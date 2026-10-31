<script>
    import { onMount } from "svelte";
    import { fetchSyncPost } from "siyuan";

    export let pageSize = 5;
    export let forgejoUrl = "";
    export let forgejoRepo = "";
    export let forgejoToken = "";

    let commitHistory = [];
    let page = 1;
    let totalPage = 1;
    let totalCommit = 0;
    let isLoading = false;
    let errorMessage = "";
    let configured = forgejoUrl && forgejoRepo;

    const getCommitHistory = async (pageNum = 1) => {
        if (isLoading) return;
        if (!configured) {
            errorMessage = "请先在设置中配置 Forgejo 地址和仓库";
            return;
        }
        isLoading = true;
        errorMessage = "";

        const baseUrl = forgejoUrl.replace(/\/+$/, "");
        const targetUrl = `${baseUrl}/api/v1/repos/${forgejoRepo}/commits?page=${pageNum}&limit=${pageSize}`;
        try {
            const response = await fetchSyncPost("/api/network/forwardProxy", {
                url: targetUrl,
                method: "GET",
                timeout: 15000,
                contentType: "application/json",
                headers: [{ "Authorization": `token ${forgejoToken}` }],
                payload: {}
            });
            if (response.code !== 0) {
                throw new Error(response.msg || "请求失败");
            }
            const data = response.data;
            if (data.status !== 200) {
                throw new Error(`Forgejo API ${data.status}: ${data.body}`);
            }
            const commits = JSON.parse(data.body);
            const totalCount = parseInt(data.headers?.["X-Total-Count"] || data.headers?.["x-total-count"] || 0, 10);
            totalCommit = totalCount;
            totalPage = Math.max(1, Math.ceil(totalCount / pageSize));
            page = pageNum;

            commitHistory = [
                ...commitHistory,
                ...commits.map((commit) => ({
                    user: commit.commit?.committer?.name ?? "",
                    date: new Date(commit.commit?.committer?.date).toLocaleString(
                        "zh-CN",
                        {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        },
                    ),
                    message: commit.commit?.message ?? "",
                })),
            ];
        } catch (error) {
            console.error("Error fetching commit history:", error);
            errorMessage = `加载失败: ${error.message || error}`;
        } finally {
            isLoading = false;
        }
    };

    onMount(async () => {
        await getCommitHistory();
    });

    const loadMore = () => {
        if (page < totalPage) {
            getCommitHistory(page + 1);
        }
    };

    const refreshData = () => {
        commitHistory = [];
        getCommitHistory();
    };
</script>

<div class="fn__flex-1 fn__flex-column">
    <div class="block__icons">
        <div class="block__logo">提交记录</div>
        <button class="b3-button b3-button--outline" on:click={refreshData}> 刷新 </button>
    </div>
    {#if errorMessage}
        <div class="error-message">{errorMessage}</div>
    {/if}
    <div class="commit-history">
        {#each commitHistory as commit}
            <div class="commit-item" title={commit.message}>
                <span class="commit-message">{commit.message}</span>
                <span class="commit-user">{commit.user}</span>
                <span class="commit-date">{commit.date}</span>
            </div>
        {/each}
    </div>
    {#if isLoading}
        <div class="loading">加载中...</div>
    {/if}
    {#if !isLoading && page < totalPage}
        <button class="pagination-button b3-button b3-button--outline" on:click={loadMore}>
            加载更多
        </button>
    {/if}
    {#if page == totalPage && !isLoading}
        <button class="pagination-button b3-button b3-button--outline" disabled> 没有更多内容啦~ </button>
    {/if}
</div>

<style>
    .commit-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        transition: background-color 0.3s;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* 斑马纹效果 */
    .commit-item:nth-child(even) {
        background-color: var(--b3-theme-surface);
    }

    .commit-item:nth-child(odd) {
        background-color: var(--b3-theme-background);
    }

    .commit-item:hover {
        background-color: var(--b3-list-hover, var(--b3-theme-surface));
    }

    .commit-item > span {
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .commit-message {
        flex: 0 0 50%;
    }

    .commit-user {
        flex: 0 0 20%;
    }

    .commit-date {
        flex: 0 0 30%;
    }

    .commit-item:hover .commit-message,
    .commit-item:hover .commit-user,
    .commit-item:hover .commit-date {
        white-space: normal;
        word-wrap: break-word;
        overflow: visible;
    }

    .loading {
        text-align: center;
        margin-top: 20px;
    }

    .error-message {
        text-align: center;
        margin-top: 20px;
        color: var(--b3-theme-error, #d23f31);
        padding: 8px;
    }

    .pagination-button {
        display: block;
        width: 100%;
        text-align: center;
    }

    .block__icons {
        font-size: 16px;
    }
</style>
