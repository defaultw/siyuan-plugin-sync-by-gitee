import { dispatchWorkflow, getLatestRunId, pollWorkflowRun, WorkflowRun } from "./forgejo";
import { SyncOptions, SyncProgress } from "./types";

/**
 * 同步思源工作区到 Forgejo 仓库（Actions runner 方案）：
 * 插件触发 workflow_dispatch，由服务器上的 Forgejo runner 执行真 git
 * （pull/add/commit/push），插件轮询执行结果。
 * 所有 git 操作由成熟工具链完成，插件不参与任何文件比对，避免数据丢失风险。
 */
export async function syncWorkspace(
    opts: SyncOptions,
    commitMessage: string
): Promise<{ run: WorkflowRun | null }> {
    const onProgress = (p: SyncProgress) => opts.onProgress?.(p);

    // 1. 记录 dispatch 前最新 run id 作为基线，避免误读旧 run
    const baselineRunId = await getLatestRunId(opts);

    // 2. 触发 dispatch
    onProgress({ stage: "dispatching" });
    await dispatchWorkflow(opts, commitMessage);

    // 3. 轮询本次 dispatch 产生的新 run 直到终态
    onProgress({ stage: "polling" });
    const run = await pollWorkflowRun(opts, baselineRunId, (r) => {
        onProgress({ stage: "polling", detail: r.status });
    });

    onProgress({ stage: "done" });
    return { run: run };
}
