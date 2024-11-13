import {
    Plugin,
    showMessage,
    Menu
} from "siyuan";
import "@/index.scss";
import axios from 'axios';

import { svelteDialog } from "./libs/dialog";
import GitteCommitMessage from "./components/GitteCommitMessage.svelte";
import { SettingUtils } from "./libs/setting-utils";
import CommitStatus from "./components/CommitStatus.svelte";
import CommitHistory from "./components/CommitHistory.svelte";

const DOCK_TYPE = "dock_tab";

export default class PluginSample extends Plugin {

    private settingUtils: SettingUtils;

    async onload() {

        // 图标的制作参见帮助文档
        this.addIcons(`
            <symbol id="iconFace" viewBox="0 0 32 32">
                <path d="M13.667 17.333c0 0.92-0.747 1.667-1.667 1.667s-1.667-0.747-1.667-1.667 0.747-1.667 1.667-1.667 1.667 0.747 1.667 1.667zM20 15.667c-0.92 0-1.667 0.747-1.667 1.667s0.747 1.667 1.667 1.667 1.667-0.747 1.667-1.667-0.747-1.667-1.667-1.667zM29.333 16c0 7.36-5.973 13.333-13.333 13.333s-13.333-5.973-13.333-13.333 5.973-13.333 13.333-13.333 13.333 5.973 13.333 13.333zM14.213 5.493c1.867 3.093 5.253 5.173 9.12 5.173 0.613 0 1.213-0.067 1.787-0.16-1.867-3.093-5.253-5.173-9.12-5.173-0.613 0-1.213 0.067-1.787 0.16zM5.893 12.627c2.28-1.293 4.040-3.4 4.88-5.92-2.28 1.293-4.040 3.4-4.88 5.92zM26.667 16c0-1.040-0.16-2.040-0.44-2.987-0.933 0.2-1.893 0.32-2.893 0.32-4.173 0-7.893-1.92-10.347-4.92-1.4 3.413-4.187 6.093-7.653 7.4 0.013 0.053 0 0.12 0 0.187 0 5.88 4.787 10.667 10.667 10.667s10.667-4.787 10.667-10.667z"></path>
            </symbol>
            <symbol id="iconSaving" viewBox="0 0 32 32">
                <path d="M20 13.333c0-0.733 0.6-1.333 1.333-1.333s1.333 0.6 1.333 1.333c0 0.733-0.6 1.333-1.333 1.333s-1.333-0.6-1.333-1.333zM10.667 12h6.667v-2.667h-6.667v2.667zM29.333 10v9.293l-3.76 1.253-2.24 7.453h-7.333v-2.667h-2.667v2.667h-7.333c0 0-3.333-11.28-3.333-15.333s3.28-7.333 7.333-7.333h6.667c1.213-1.613 3.147-2.667 5.333-2.667 1.107 0 2 0.893 2 2 0 0.28-0.053 0.533-0.16 0.773-0.187 0.453-0.347 0.973-0.427 1.533l3.027 3.027h2.893zM26.667 12.667h-1.333l-4.667-4.667c0-0.867 0.12-1.72 0.347-2.547-1.293 0.333-2.347 1.293-2.787 2.547h-8.227c-2.573 0-4.667 2.093-4.667 4.667 0 2.507 1.627 8.867 2.68 12.667h2.653v-2.667h8v2.667h2.68l2.067-6.867 3.253-1.093v-4.707z"></path>
            </symbol>
            <symbol id="iconGithubCommit" viewBox="0 0 1024 1024">
                <path d="M511.6 76.3C264.3 76.2 64 276.4 64 523.5 64 718.9 189.3 885 363.8 946c23.5 5.9 19.9-10.8 19.9-22.2v-77.5c-135.7 15.9-141.2-73.9-150.3-88.9C215 726 171.5 718 184.5 703c30.9-15.9 62.4 4 98.9 57.9 26.4 39.1 77.9 32.5 104 26 5.7-23.5 17.9-44.5 34.7-60.8-140.6-25.2-199.2-111-199.2-213 0-49.5 16.3-95 48.3-131.7-20.4-60.5 1.9-112.3 4.9-120 58.1-5.2 118.5 41.6 123.2 45.3 33-8.9 70.7-13.6 112.9-13.6 42.4 0 80.2 4.9 113.5 13.9 11.3-8.6 67.3-48.8 121.3-43.9 2.9 7.7 24.7 58.3 5.5 118 32.4 36.8 48.9 82.7 48.9 132.3 0 102.2-59 188.1-200 212.9 23.5 23.2 38.1 55.4 38.1 91v112.5c0.8 9 0 17.9 15 17.9 177.1-59.7 304.6-227 304.6-424.1 0-247.2-200.4-447.3-447.5-447.3z" p-id="2703"></path>
            </symbol>
            <symbol id="iconGiteeCommit" viewBox="0 0 1024 1024">
                <path d="M896.3052803 427.59336267H465.08398823c-20.69630173 0-37.49062554 16.79432382-37.49062556 37.49062555l-0.02636472 93.75292941c0 20.69630173 16.76795911 37.49062554 37.49062556 37.51699027h262.51347546c20.69630173 0 37.49062554 16.79432382 37.49062555 37.49062638v18.74531277a112.49824219 112.49824219 0 0 1-112.49824219 112.49824219H296.32344217a37.49062554 37.49062554 0 0 1-37.49062554-37.49062556V371.38378824a112.49824219 112.49824219 0 0 1 112.49824218-112.49824219L896.22618615 258.85918133c20.69630173 0 37.49062554-16.76795911 37.49062557-37.46426165L933.79590585 127.64199027h0.02636472A37.49062554 37.49062554 0 0 0 896.35800973 90.125h-0.02636471L371.38378824 90.15136472C216.06924714 90.15136472 90.15136472 216.06924714 90.15136472 371.38378824v524.94785678c0 20.69630173 16.79432382 37.49062554 37.49062555 37.49062555h553.07900829a253.101272 253.101272 0 0 0 253.10127201-253.10127201v-215.61064563c0-20.69630173-16.79432382-37.49062554-37.49062555-37.49062554z" p-id="7470"></path>
            </symbol>
            <symbol id="iconSync" viewBox="0 0 1024 1024">
                <path d="M811.4 368.9C765.6 248 648.9 162 512.2 162S258.8 247.9 213 368.8C126.9 391.5 63.5 470.2 64 563.6 64.6 668 145.6 752.9 247.6 762c4.7 0.4 8.7-3.3 8.7-8v-60.4c0-4-3-7.4-7-7.9-27-3.4-52.5-15.2-72.1-34.5-24-23.5-37.2-55.1-37.2-88.6 0-28 9.1-54.4 26.2-76.4 16.7-21.4 40.2-36.9 66.1-43.7l37.9-10 13.9-36.7c8.6-22.8 20.6-44.2 35.7-63.5 14.9-19.2 32.6-36 52.4-50 41.1-28.9 89.5-44.2 140-44.2s98.9 15.3 140 44.3c19.9 14 37.5 30.8 52.4 50 15.1 19.3 27.1 40.7 35.7 63.5l13.8 36.6 37.8 10c54.2 14.4 92.1 63.7 92.1 120 0 33.6-13.2 65.1-37.2 88.6-19.5 19.2-44.9 31.1-71.9 34.5-4 0.5-6.9 3.9-6.9 7.9V754c0 4.7 4.1 8.4 8.8 8 101.7-9.2 182.5-94 183.2-198.2 0.6-93.4-62.7-172.1-148.6-194.9z" p-id="3066" fill="#bfbfbf"></path><path d="M376.9 656.4c1.8-33.5 15.7-64.7 39.5-88.6 25.4-25.5 60-39.8 96-39.8 36.2 0 70.3 14.1 96 39.8 1.4 1.4 2.7 2.8 4.1 4.3l-25 19.6c-5.3 4.1-3.5 12.5 3 14.1l98.2 24c5 1.2 9.9-2.6 9.9-7.7l0.5-101.3c0-6.7-7.6-10.5-12.9-6.3L663 532.7c-36.6-42-90.4-68.6-150.5-68.6-107.4 0-195 85.1-199.4 191.7-0.2 4.5 3.4 8.3 8 8.3H369c4.2-0.1 7.7-3.4 7.9-7.7zM703 664h-47.9c-4.2 0-7.7 3.3-8 7.6-1.8 33.5-15.7 64.7-39.5 88.6-25.4 25.5-60 39.8-96 39.8-36.2 0-70.3-14.1-96-39.8-1.4-1.4-2.7-2.8-4.1-4.3l25-19.6c5.3-4.1 3.5-12.5-3-14.1l-98.2-24c-5-1.2-9.9 2.6-9.9 7.7l-0.4 101.4c0 6.7 7.6 10.5 12.9 6.3l23.2-18.2c36.6 42 90.4 68.6 150.5 68.6 107.4 0 195-85.1 199.4-191.7 0.2-4.5-3.4-8.3-8-8.3z" p-id="3067"></path>
            </symbol>
            <symbol id="iconCommitHistory" viewBox="0 0 1024 1024">
                <path d="M512 109.714286c222.183619 0 402.285714 180.102095 402.285714 402.285714S734.183619 914.285714 512 914.285714l-2.901333-0.121904c-104.545524-8.313905-189.415619-43.52-253.074286-105.130667L256 889.904762h-73.142857V658.285714H390.095238v73.142857h-106.105905c52.857905 65.048381 128.560762 101.400381 229.449143 109.714286l7.631238-0.121905C698.660571 836.217905 841.142857 690.736762 841.142857 512c0-181.784381-147.358476-329.142857-329.142857-329.142857S182.857143 330.215619 182.857143 512h-73.142857c0-222.183619 180.102095-402.285714 402.285714-402.285714zM463.238095 292.571429h73.142857v182.857142h182.857143v73.142858H463.238095V292.571429z" p-id="4162"></path>
            </symbol>
        `);

        this.settingUtils = new SettingUtils({
            plugin: this, name: this.i18n.giteeConfig
        });
        this.settingUtils.addItem({
            key: "requestUrl",
            value: "",
            type: "textinput",
            title: this.i18n.syncAddr,
            description: this.i18n.syncAddrDesc,
            action: {
                callback: () => { }
            }
        });

        this.settingUtils.addItem({
            key: "requestMessage",
            value: "",
            type: "textinput",
            title: this.i18n.syncMessage,
            description: this.i18n.syncMessageDesc,
            action: {
                callback: () => { }
            }
        });

        this.settingUtils.addItem({
            key: "requestToken",
            value: "",
            type: "textinput",
            title: this.i18n.token,
            description: this.i18n.tokenDesc,
            action: {
                callback: () => { }
            }
        });

        this.settingUtils.addItem({
            key: "commitHistoryPageSize",
            value: "",
            type: "textinput",
            title: this.i18n.commitHistoryPageSize,
            description: this.i18n.commitHistoryPageSize,
            action: {
                callback: () => { }
            }
        });

        this.settingUtils.addItem({
            key: "giteeToken",
            value: "",
            type: "textinput",
            title: this.i18n.giteeToken,
            description: this.i18n.giteeToken,
            action: {
                callback: () => { }
            }
        });
        // 导入并合并配置
        await this.settingUtils.load();

        const template = document.createElement('div');
        const commitStatusComponent = new CommitStatus({
            target: template,
            props: {
                visible: false,
                explain: this.i18n.explainInfo
            }
        });

        this.addStatusBar({
            element: template.firstChild as HTMLElement
        });

        /**
         * 请求同步接口
         */
        const syncData = (message?: string, dialog?: any) => {
            // 关闭弹窗
            dialog?.close();
            // 显示提交信息弹窗
            showMessage(this.i18n.syncStart, 2000, "info");
            // 显示加载框
            commitStatusComponent.$set({ visible: true })

            let url = this.settingUtils.get("requestUrl");
            if (message) {
                url += `?message=${message}`;
            } else {
                url += ("?message=" + this.settingUtils.get("requestMessage"));
            }

            const headers = {
                'token': this.settingUtils.get("requestToken")
            };
            axios.get(url, { "headers": headers }).then(response => {
                const res = response.data;
                // 请求成功
                if (res.code === 1) {
                    showMessage(this.i18n.syncFinish, 2000, "info");
                } else {
                    showMessage(`🙁[${res?.code}] ${res?.message}`, 2000, "error");
                }
                commitStatusComponent.$set({ visible: false })
            }).catch(error => {
                showMessage(`[${error?.code}] ${error?.message}`);
                commitStatusComponent.$set({ visible: false })
            });
        }

        const showMessageDialog = (message = "", onConfirm) => {
            return svelteDialog({
                title: this.i18n.syncDesc,
                constructor: (container: HTMLElement) => {
                    return new GitteCommitMessage({
                        target: container,
                        props: {
                            message: message,
                            onConfirm: (message: string) => { onConfirm(message) }
                        }
                    });
                }
            });
        }

        const addMenu = (rect?: DOMRect) => {
            const menu = new Menu("topBarSample", () => {
                console.log(this.i18n.byeMenu);
            });
            menu.addItem({
                icon: "iconSync",
                label: this.i18n.sync,
                accelerator: this.commands[0].customHotkey,
                click: () => {
                    const dialog = showMessageDialog("", (message: string) => {
                        syncData(message, dialog);
                    });
                }
            });
            // menu.addItem({
            //     icon: "iconCommitHistory",
            //     label: this.i18n.commitHistory,
            //     click: () => {
            //         IS_DOCK_SHOW = true;
            //     }
            // });
            menu.open({
                x: rect.right,
                y: rect.bottom,
                isLeft: true,
            });
        }

        const topBarElement = this.addTopBar({
            icon: "iconGiteeCommit",
            title: this.i18n.pluginName,
            position: "right",
            callback: () => {
                let rect = topBarElement.getBoundingClientRect();
                // 如果被隐藏，则使用更多按钮
                if (rect.width === 0) {
                    rect = document.querySelector("#barMore").getBoundingClientRect();
                }
                if (rect.width === 0) {
                    rect = document.querySelector("#barPlugins").getBoundingClientRect();
                }
                addMenu(rect);
            }
        });

        /**
        * 注册快捷键
        */
        this.addCommand({
            langKey: this.i18n.sync,
            hotkey: "⌘⌥G",
            callback: () => {
                syncData(this.settingUtils.get("requestMessage"));
            },
        });


        this.addDock({
            config: {
                position: "RightTop",
                size: { width: 400, height: 0 },
                icon: "iconCommitHistory",
                title: this.i18n.commitHistory,
                hotkey: "⌥⌘W",
                show: false
            },
            data: {
                title: this.i18n.commitHistory,
            },
            type: DOCK_TYPE,
            init: (dock) => {
                const template = document.createElement("div");
                new CommitHistory({
                    target: template,
                    props: {
                        pageSize: this.settingUtils.get("commitHistoryPageSize"),
                        accessToken: this.settingUtils.get("giteeToken")
                    }
                });
                dock.element.appendChild(template);
            }
        });
    }

}
