<script lang="ts">
    import { Button, Textarea } from "siyuan-kit-svelte";

    export let message: string = "";
    export let onConfirm;

    function handleConfirm() {
        if (onConfirm) {
            onConfirm(message);
        }
    }
</script>

<div class="b3-dialog__content">
    <Textarea
        id="text"
        style="height: 100px; width: 500px;"
        bind:value={message}
    ></Textarea>
    <div class="custom-button">
        <Button
            id="confirm"
            on:click={handleConfirm}
            text={false}
            label="同步"
            outline={false}
        ></Button>
    </div>
</div>

<style>
    .custom-button {
        display: flex;
        justify-content: flex-end;
        padding-top: 10px;
    }
</style>
