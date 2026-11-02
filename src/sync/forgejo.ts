import { fetchSyncPost } from "siyuan";
import { SyncOptions } from "./types";

/** IResForwardProxy（forwardProxy data 字段结构） */
interface ProxyResult {
    url: string;
    status: number;
    contentType?: string;
    body?: string;
}

function baseUrl(url: string): string {
    return url.replace(/\/+$/, "");
}

/**
 * 清洗设置值：用户从文档/聊天复制粘贴时可能混入反引号、引号等 markdown 格式字符，
 * 这些字符在 URL/仓库名/令牌中本就非法，会导致 forwardProxy 请求失败。
 */
export function sanitizeSetting(value: string): string {
    return String(value || "").trim().replace(/[`'"]/g, "");
}

/** 清洗 URL 设置值：另去末尾斜杠 */
export function sanitizeUrl(value: string): string {
    return baseUrl(sanitizeSetting(value));
}

function authHeaders(token: string): { Authorization: string }[] {
    return [{ Authorization: `token ${token}` }];
}

/**
 * 经内核 forwardProxy 发起请求。
 * fetchSyncPost 返回完整 IWebSocketData {code, msg, data}：
 * - code !== 0 → 内核层失败，抛含 msg 与 URL 的错误
 * - 返回 data（IResForwardProxy），由调用方检查 HTTP status
 */
async function proxyRequest(
    url: string,
    method: "GET" | "POST",
    payload: Record<string, unknown>,
    token: string
): Promise<ProxyResult> {
    const response = await fetchSyncPost("/api/network/forwardProxy", {
        url: url,
        method: method,
        timeout: 30000,
        contentType: "application/json",
        headers: authHeaders(token),
        payload: payload
    });
    if (response.code !== 0) {
        throw new Error(`forwardProxy 请求失败: ${response.msg || "未知原因"} (URL: ${url})`);
    }
    return response.data as ProxyResult;
}

function extractErrorMessage(body: string): string {
    try {
        const parsed = JSON.parse(body);
        if (parsed && typeof parsed.message === "string") {
            return parsed.message;
        }
    } catch (e) {
        // body 非 JSON，原样返回
    }
    return body;
}

/** Forgejo Actions workflow run 摘要（兼容 Gitea 与 Forgejo v17 两种 schema） */
export interface WorkflowRun {
    id: number;
    run_number: number;
    status: string;      // 终态：success | failure | cancelled；进行态：pending | queued | in_progress
    // Forgejo v17 schema
    trigger_event?: string;  // "workflow_dispatch"
    workflow_id?: string;    // "sync.yml"
    title?: string;
    // Gitea schema
    event?: string;          // "workflow_dispatch"
    path?: string;           // ".forgejo/workflows/sync.yml"
    display_title?: string;
    conclusion?: string;
    html_url?: string;
}

const FINAL_STATUSES = ["success", "failure", "cancelled", "canceled", "skipped"];

/** 匹配本插件触发的 run：workflow_dispatch 事件 + workflow 文件标识 */
function matchDispatchRun(runs: WorkflowRun[], workflowFile: string): WorkflowRun[] {
    return runs.filter(r =>
        (r.trigger_event ?? r.event) === "workflow_dispatch"
        && (r.workflow_id ?? r.path ?? "").endsWith(workflowFile)
    );
}

/** 拉取 workflow run 列表 */
async function listRuns(opts: SyncOptions): Promise<WorkflowRun[]> {
    const url = `${sanitizeUrl(opts.forgejoUrl)}/api/v1/repos/${sanitizeSetting(opts.forgejoRepo)}/actions/runs`;
    const data = await proxyRequest(url, "GET", {}, sanitizeSetting(opts.forgejoToken));
    if (data.status !== 200) {
        throw new Error(`Forgejo API ${data.status}: ${extractErrorMessage(data.body || "")} (URL: ${url})`);
    }
    const parsed = JSON.parse(data.body || "{}") as { workflow_runs?: WorkflowRun[] };
    return parsed.workflow_runs || [];
}

/**
 * 获取当前 workflow 最新的 run id（dispatch 前调用作为基线，
 * 轮询时只认 id 大于基线的 run，避免把旧 run 误判为本次结果）。
 */
export async function getLatestRunId(opts: SyncOptions): Promise<number> {
    const runs = await listRuns(opts);
    const matched = matchDispatchRun(runs, opts.workflowFile);
    let latest = 0;
    for (const r of matched) {
        if (r.id > latest) {
            latest = r.id;
        }
    }
    return latest;
}

/**
 * 触发 workflow dispatch：
 * POST /api/v1/repos/{owner}/{repo}/actions/workflows/{workflowId}/dispatches
 * workflowId 可为数字 ID 或 workflow 文件名（如 sync.yml）。
 * 成功返回 204 No Content。
 */
export async function dispatchWorkflow(opts: SyncOptions, message?: string): Promise<void> {
    const workflowId = sanitizeSetting(opts.workflowFile);
    const url = `${sanitizeUrl(opts.forgejoUrl)}/api/v1/repos/${sanitizeSetting(opts.forgejoRepo)}/actions/workflows/${encodeURIComponent(workflowId)}/dispatches`;
    const payload: Record<string, unknown> = { ref: opts.branch || "refs/heads/master" };
    if (message) {
        payload.inputs = { commit_message: message };
    }
    const data = await proxyRequest(url, "POST", payload, sanitizeSetting(opts.forgejoToken));
    if (data.status !== 204) {
        throw new Error(`Forgejo API ${data.status}: ${extractErrorMessage(data.body || "")} (URL: ${url})`);
    }
}

/**
 * 轮询本次 dispatch 产生的 run（id > baselineRunId），直到终态或超时。
 */
export async function pollWorkflowRun(
    opts: SyncOptions,
    baselineRunId: number,
    onTick?: (run: WorkflowRun | null, elapsed: number) => void
): Promise<WorkflowRun> {
    const workflowFile = opts.workflowFile;
    const interval = opts.pollIntervalMs || 3000;
    const timeout = opts.pollTimeoutMs || 300000;
    const start = Date.now();

    while (true) {
        const runs = await listRuns(opts);
        const candidates = matchDispatchRun(runs, workflowFile)
            .filter(r => r.id > baselineRunId)
            .sort((a, b) => b.id - a.id);
        const matched = candidates.length > 0 ? candidates[0] : null;
        if (matched) {
            onTick?.(matched, Date.now() - start);
            if (FINAL_STATUSES.includes(matched.status)) {
                return matched;
            }
        }
        if (Date.now() - start > timeout) {
            throw new Error(`同步超时：等待 workflow 执行结果超过 ${Math.round(timeout / 1000)} 秒`);
        }
        await new Promise(r => setTimeout(r, interval));
    }
}
