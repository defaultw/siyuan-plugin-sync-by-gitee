import { forwardProxy } from "../api";
import { SyncOptions } from "./types";

function baseUrl(url: string): string {
    return url.replace(/\/+$/, "");
}

function authHeaders(token: string): { Authorization: string }[] {
    return [{ Authorization: `token ${token}` }];
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

/** Forgejo Actions workflow run 摘要 */
export interface WorkflowRun {
    id: number;
    display_title: string;
    event: string;
    path: string;
    run_number: number;
    status: string;      // pending | queued | in_progress | success | failure | ...
    conclusion: string;  // success | failure | cancelled | ...
    html_url: string;
}

const FINAL_STATUSES = ["success", "failure", "cancelled", "skipped"];

/** 匹配本插件触发的 run：workflow_dispatch 事件 + workflow 文件路径 */
function matchDispatchRun(runs: WorkflowRun[], workflowFile: string): WorkflowRun[] {
    return runs.filter(r =>
        r.event === "workflow_dispatch"
        && r.path.endsWith(workflowFile)
    );
}

/** 拉取 workflow run 列表 */
async function listRuns(opts: SyncOptions): Promise<WorkflowRun[]> {
    const url = `${baseUrl(opts.forgejoUrl)}/api/v1/repos/${opts.forgejoRepo}/actions/runs`;
    const response = await forwardProxy(url, "GET", {}, authHeaders(opts.forgejoToken), 30000, "application/json");
    if (response.code !== 0) {
        throw new Error(response.msg || "forwardProxy 请求失败");
    }
    const data = response.data;
    if (data.status !== 200) {
        throw new Error(`Forgejo API ${data.status}: ${extractErrorMessage(data.body || "")}`);
    }
    const parsed = JSON.parse(data.body) as { workflow_runs?: WorkflowRun[] };
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
    const workflowId = opts.workflowFile;
    const url = `${baseUrl(opts.forgejoUrl)}/api/v1/repos/${opts.forgejoRepo}/actions/workflows/${encodeURIComponent(workflowId)}/dispatches`;
    const payload: Record<string, unknown> = { ref: opts.branch || "refs/heads/master" };
    if (message) {
        payload.inputs = { commit_message: message };
    }
    const response = await forwardProxy(url, "POST", payload, authHeaders(opts.forgejoToken), 30000, "application/json");
    if (response.code !== 0) {
        throw new Error(response.msg || "forwardProxy 请求失败");
    }
    const data = response.data;
    if (data.status !== 204) {
        throw new Error(`Forgejo API ${data.status}: ${extractErrorMessage(data.body || "")}`);
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
