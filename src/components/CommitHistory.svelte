<script>
    import { onMount } from "svelte";
    import axios from "axios";

    const getCommitHistory = async (pageNum = 1, pageSize = 20) => {
        const url =
            `https://gitee.com/api/v5/repos/defaultw/siyuan/commits?` +
            `access_token=17bf19fc2f54f3c01fc7781c6df694ec&page=${pageNum}&per_page=${pageSize}`;
        try {
            const response = await axios.get(url);
            const res = response.data;
            const headers = response.headers;

            return {
                page: pageNum,
                totalPage: headers?.total_page,
                totalCommit: headers?.total_count,
                data: res?.map((commit) => ({
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
            };
        } catch (error) {
            console.error("Error fetching commit history:", error);
            throw error; // 重新抛出错误以便调用者可以处理
        }
    };

    let commitHistory = [];

    // 在组件初始化时获取提交历史
    onMount(async () => {
        try {
            const res = await getCommitHistory();
            commitHistory = res.data;
        } catch (error) {
            console.error("Error fetching commit history:", error);
        }
    });
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
</div>

<style>
    .commit-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background-color: transparent;
        transition: background-color 0.3s;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .commit-item:nth-child(odd) {
        background-color: #f9f9f9;
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
</style>
