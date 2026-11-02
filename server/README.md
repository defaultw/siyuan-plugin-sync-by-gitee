# 服务器端部署说明（Forgejo Actions runner 方案）

本方案下，插件不再自己比对/上传文件，而是触发 Forgejo Actions workflow，
由服务器上的 Forgejo runner 在 `/opt/siyuan` 目录执行**真 git**（pull/add/commit/push）。
所有 git 操作由 git 工具链完成，不存在插件自研比对逻辑，数据丢失风险最低。

架构：

```
思源插件 ──dispatch(workflow_dispatch)──▶ Forgejo API ──▶ runner(自托管, /opt/siyuan)
   ▲                                          │
   └──────────轮询 run 状态 ◀─────────────────┘
```

## 前置条件

- Forgejo 已启用 Actions（Site Administration → Actions → Enable，或仓库设置里开启）
- 服务器已安装 git、flock（util-linux 自带）
- `/opt/siyuan` 已是 git 仓库（此前 auto_commit.sh 已在用它提交，通常已满足；若没有：
  `cd /opt/siyuan && git init && git remote add origin <Forgejo仓库地址> && git add -A && git commit -m init && git push -u origin master`）

## 1. 部署 workflow 文件

把本目录的 [sync.yml](sync.yml) 放到仓库默认分支的 `.forgejo/workflows/sync.yml`
（`.gitea/workflows/sync.yml` 也可，Forgejo 两者都识别）。

注意：workflow 必须存在于**默认分支**（master）上，workflow_dispatch 才能被 API 触发。

放到仓库里的方式二选一：

- 直接在 Forgejo 网页上创建文件 `.forgejo/workflows/sync.yml`，粘贴 sync.yml 内容；
- 或在 `/opt/siyuan` 下：
  `mkdir -p .forgejo/workflows && cp sync.yml .forgejo/workflows/ && git add .forgejo && git commit -m "add sync workflow" && git push`

## 2. 安装 Forgejo runner

推荐用 forgejo-runner 官方二进制（v13 系列，占用小、无需 docker）。要求 Git ≥ 2.24.3。

```bash
export ARCH=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')
# 自动获取最新版本号（当前为 13.x，需 curl + jq）
export RUNNER_VERSION=$(curl -s https://data.forgejo.org/api/v1/repos/forgejo/runner/releases/latest | jq .name -r | cut -c 2-)
# 也可手动指定 13 系列版本号，例如：
# export RUNNER_VERSION=13.1.0

wget -O /usr/local/bin/forgejo-runner \
  https://code.forgejo.org/forgejo/runner/releases/download/v${RUNNER_VERSION}/forgejo-runner-${RUNNER_VERSION}-linux-${ARCH}
chmod +x /usr/local/bin/forgejo-runner
forgejo-runner -v   # 应输出 forgejo-runner version v13.x.x
```

> 如需校验签名：再下载 `${URL}.asc` 文件，用官方密钥
> `EB114F5E6C0DC2BCDD183550A4B61A2DC5923710` 执行 `gpg --verify forgejo-runner.asc forgejo-runner`。

### 注册 runner（v13：配置文件方式）

> **注意**：forgejo-runner v13 已废弃 `register` 子命令（执行会打 WARN 且对新版凭据报
> "runner registration token not found"）。v13 改为在 Forgejo 网页上创建 runner，
> 然后把 **UUID + Token** 写进配置文件。

1. 在 Forgejo 网页创建 runner（按作用范围选其一）：
   - 全局：`Site Administration` → `Actions` → `Runners` → `Create new runner`
   - 仓库级：仓库 `Settings` → `Actions` → `Runners` → `Create new runner`
   弹窗里填名称 `siyuan-runner`，创建后会显示 **UUID** 和 **Token** 一对凭据（记下来）。

2. 生成配置文件并把凭据写进 `server.connections` 段：

```bash
mkdir -p /etc/forgejo-runner
forgejo-runner generate-config > /etc/forgejo-runner/config.yml
nano /etc/forgejo-runner/config.yml
```

   配置文件关键修改（三处）：

```yaml
server:
  connections:
    forgejo:                    # 键名任意，仅要求唯一
      url: http://192.168.31.10:13333/
      uuid: <网页显示的UUID>
      token: <网页显示的Token>

runner:
  labels:
    - "self-hosted:host"        # host 模式，对应 workflow 的 runs-on: [self-hosted]
```

- labels 里 `self-hosted:host` 表示这是名为 `self-hosted` 的 **host 模式** runner
  （job 直接跑在宿主机 shell，不进容器），与 sync.yml 的 `runs-on: [self-hosted]` 对应。
  如你偏好 docker 模式，labels 改为 `self-hosted:docker:gitea/runner-images:ubuntu-latest`
  并把 workflow 里 `/opt/siyuan` 相关步骤改为挂载路径（host 模式最简单，推荐）。

### 启动（v13 要求配置文件必须用 `-c` 显式指定，没有默认路径）

```bash
forgejo-runner daemon -c /etc/forgejo-runner/config.yml
# 日志出现 "Starting runner daemon" 即启动成功
```

用 systemd 常驻：

```ini
# /etc/systemd/system/forgejo-runner.service
[Unit]
Description=Forgejo Runner
After=network.target

[Service]
ExecStart=/usr/local/bin/forgejo-runner daemon -c /etc/forgejo-runner/config.yml
Restart=always
User=root
WorkingDirectory=/opt/siyuan

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload && systemctl enable --now forgejo-runner
```

启动后在 Forgejo 仓库 Settings → Actions → Runners 应能看到 `siyuan-runner` 处于 Idle。

## 3. git 推送凭据

runner 在 `/opt/siyuan` 执行 `git push`，需要凭据。两种方式：

- **本地 remote 用 token 内嵌（简单）**：
  `git remote set-url origin http://<用户名>:<token>@192.168.31.10:13333/wangxiaojiang/siyuan.git`
- 或 credential helper / SSH key（按你原有 auto_commit.sh 的配置沿用即可）

## 4. 停用旧的 auto_commit.sh

确认新链路同步成功后：

```bash
crontab -l            # 找到 auto_commit.sh 的定时项并删除
systemctl list-timers # 如有 systemd timer 也一并禁用
pkill -f auto_commit.sh
```

## 5. 插件侧配置

思源插件设置：

- Forgejo 地址：`http://192.168.31.10:13333`
- 仓库：`wangxiaojiang/siyuan`
- Forgejo token：需要 **Actions 写权限**（dispatch 需要 `workflow`/`actions:write` scope）
- Workflow 文件名：`sync.yml`
- 同步备注消息：默认提交信息

之后点同步 → 插件触发 dispatch → runner 在服务器上跑真 git → 插件轮询结果显示成功/失败。

## 6. 验证

1. 仓库网页 Actions 页面手动 "Run workflow" 一次，确认 runner 能领取并执行成功；
2. 思源里点同步，观察 Actions 出现新 run，状态变 success；
3. 修改一篇笔记再同步，确认提交出现在仓库历史里（提交信息为插件输入的 message）。
