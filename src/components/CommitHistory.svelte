<script>
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
            <div class="commit-item">
                <span>User: {commit.user}</span><br />
                <span>Date: {commit.date}</span><br />
                <span>Message: {commit.message}</span>
            </div>
        {/each}
    </div>
</div>

<style>
    .commit-item {
        margin-bottom: 10px;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
    }
</style>
