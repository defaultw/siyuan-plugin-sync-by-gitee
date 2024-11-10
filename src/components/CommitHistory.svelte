<script>
    import { onMount } from "svelte";
    import axios from "axios";

    export let pageSize = 5;

    let commitHistory = [];
    let page = 1;
    let totalPage = 1;
    let totalCommit = 0;
    let isLoading = false;

    const getCommitHistory = async (pageNum = 1) => {
        if (isLoading) return;
        isLoading = true;

        const url =
            `https://gitee.com/api/v5/repos/defaultw/siyuan/commits?` +
            `access_token=17bf19fc2f54f3c01fc7781c6df694ec&page=${pageNum}&per_page=${pageSize} ? ${pageSize} : 5`;
        try {
            const response = await axios.get(url);
            const res = response.data;
            const headers = response.headers;

            commitHistory = [
                ...commitHistory,
                ...res.map((commit) => ({
                    user: commit.commit.committer.name,
                    date: new Date(commit.commit.committer.date).toLocaleString(
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
                    message: commit.commit.message,
                })),
            ];

            totalPage = parseInt(headers["total_page"] || 1);
            totalCommit = parseInt(headers["total_count"] || 0);
            page = pageNum;

            isLoading = false;
        } catch (error) {
            console.error("Error fetching commit history:", error);
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
</script>

<div class="fn__flex-1 fn__flex-column">
    <div class="block__icons">
        <div class="block__logo">提交记录</div>
    </div>
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
        <button class="pagination-button" on:click={loadMore}>
            加载更多
        </button>
    {/if}
    {#if page == totalPage && !isLoading}
        <button class="pagination-button"> 没有更多内容啦~ </button>
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
        background-color: #e4e4e4;
    }

    .commit-item:nth-child(odd) {
        background-color: #f6f6f6;
    }

    .commit-item:hover {
        background-color: #e0e0e0;
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

    .pagination-button {
        display: block;
        width: 100%;
        padding: 10px;
        text-align: center;
        color: black; /* 文字颜色为黑色 */
        border: none; /* 不显示边框 */
        cursor: pointer;
    }

    /* .pagination-button:hover {
        background-color: #f0f0f0;
    }

    .pagination-button:disabled {
        background-color: #f0f0f0;
        cursor: not-allowed;
    } */
</style>
