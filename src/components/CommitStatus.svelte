<script lang="ts">
    export let visible: boolean = false;
    export let explain: string = "";
</script>

<div class="container" class:container-hidden={!visible}>
    <div class="explain">{explain}</div>
    <div class="progress-container">
        <div class="progress-bar"></div>
    </div>
</div>

<style>
    .container {
        display: flex;
        width: 10%; /* 容器宽度是可变的 */
        align-items: center; /* 垂直居中对齐 */
        font-size: 12px;
        color: var(--b3-theme-on-surface);
        font-family: var(--b3-font-family);
        /**可以靠左显示，但是不能自适应，有可能和原有元素重合*/
        /* position: absolute;
        left: calc(100vw - 12vw - 129px); */
    }

    .explain {
        flex: 30%; /* 占据30%的宽度 */
        white-space: nowrap; /* 不换行 */
        overflow: hidden; /* 隐藏溢出内容 */
        text-overflow: ellipsis; /* 显示省略号 */
    }

    .progress-container {
        width: 60%; /* 进度条容器宽度 */
        height: 5px; /* 进度条高度 */
        background-color: #e0e0de; /* 背景颜色 */
        border-radius: 10px; /* 圆角 */
        overflow: hidden; /* 隐藏超出部分 */
        /*position: relative; /* 确保子元素的绝对定位是相对于这个容器 */
        display: flex;
        align-self: center;
    }

    .progress-bar {
        height: 100%;
        width: 100%; /* 进度条的一小节现在应该占据整个容器 */
        background: linear-gradient(
            45deg,
            #217edd 0%,
            #3a8add 100%
        ); /* 渐变背景 */
        animation: loading 2s infinite; /* 应用动画 */
        transform: translateX(-100%); /* 初始位置在容器之外 */
    }

    /* 动画定义 */
    @keyframes loading {
        0% {
            transform: translateX(-100%);
        } /* 从左侧完全移出开始 */
        100% {
            transform: translateX(100%);
        } /* 移动到容器最右侧外 */
    }

    .container-hidden {
        display: none; /* 完全隐藏并移除布局中的空间 */
    }
</style>
