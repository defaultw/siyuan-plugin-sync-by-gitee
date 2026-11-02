export interface SyncProgress {
    stage: "dispatching" | "polling" | "done";
    detail?: string;
}

export interface SyncOptions {
    forgejoUrl: string;
    forgejoRepo: string;
    forgejoToken: string;
    /** workflow 文件名（如 sync.yml），作为 dispatch 的 workflowId */
    workflowFile: string;
    /** 分支 ref，默认 refs/heads/master */
    branch?: string;
    /** 轮询间隔，默认 3000ms */
    pollIntervalMs?: number;
    /** 轮询超时，默认 300000ms */
    pollTimeoutMs?: number;
    onProgress?: (p: SyncProgress) => void;
    onWarn?: (msg: string) => void;
}
