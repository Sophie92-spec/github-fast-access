# 🚀 GitHub Hosts 加速工具

> 自动查询最优 GitHub IP · 一键生成 hosts 配置 · 全网实时访问统计

一个**纯前端、可选云端后端**的网页工具，帮助你获取 GitHub 相关域名的最优 IP，并生成可直接应用的 `hosts` 配置与一键脚本，缓解部分地区访问 GitHub 缓慢的问题。

---

## ✨ 功能特性

- **自动查询 IP（DoH / DNS over HTTPS）**：实时解析 **12 个** GitHub 相关域名的最优 IP，支持 DNSPod / AliDNS / Cloudflare / Google 多服务商自动切换（`pickAuto` 并行探测最快源，3 秒超时）。
- **延迟测试**：测试当前网络到各域名的响应时间（`favicon` 探连通），应用 hosts 前后可对比加速效果。
- **生成 hosts 配置**：自动生成标准 `hosts` 格式内容，支持勾选 / 取消域名，IP 可手动修改或手动输入，实时同步。
- **一键 PowerShell 脚本**：生成 `.ps1` 脚本（纯 ASCII，UTF-8 无 BOM，避免中文乱码导致闪退），右键「以管理员身份运行」即可自动备份原 `hosts` → 清理旧条目 → 写入新条目 → 刷新 DNS 缓存。
- **自动提权启动器**：附带 `.bat` 启动器（含 `-NoExit`），双击即可弹出 UAC 请求自动提权，且窗口**绝不闪退**——报错红字直接打印在屏幕上。
- **恢复脚本**：一键生成恢复脚本，移除所有 GitHub hosts 条目，恢复默认连接方式。
- **全网实时统计**：基于 Cloudflare Workers + KV 的共享后端，任何人访问都会累计计数（详见下方「访问统计」）。

---

## 🌐 在线使用

**推荐直接用网页版（无需安装任何东西）：**

```
https://sophie92-spec.github.io/github-fast-access/
```

> 页面打开后会自动帮你查 IP、画图、统计。右上角徽章会显示统计来源：
> - 🟢 **「全网实时」**（绿色）= 已连上云端统计后端
> - ⚪ **「本地」**（灰色）= 后端超时，暂用本地计数兜底

**可选自定义域名**（需完成域名解析配置）：

```
https://sophieyoucha.cc.cd
```

---

## 🛠 使用方法

### 方式一：打开网页（推荐）

直接用浏览器打开上面的在线地址即可，页面会自动帮你查询 IP、生成配置、绘制趋势图。

想本地跑也行：

- 直接用浏览器打开 `index.html`；或
- 执行 `python -m http.server 8765` 后访问 `http://localhost:8765`。

### 方式二：应用 hosts 配置

1. 点「获取最新 IP」，等解析完成；
2. 点「生成 PowerShell 脚本」→「下载 .ps1」（或下载自动提权 `.bat`）；
3. 系统若弹「可能会损害你的设备」，放心点「保留」——脚本开源透明，没有恶意行为；
4. **右键** `.ps1` →「使用 PowerShell 运行」（需管理员），或直接双击 `.bat`；
5. 脚本自动备份、写入、刷新 DNS，重开浏览器即可生效。

> Windows 拦截 PowerShell 脚本是正常保护机制，不是脚本有问题。嫌麻烦也可以手动复制 hosts 内容，以管理员打开 `C:\Windows\System32\drivers\etc\hosts` 粘贴保存，再跑 `ipconfig /flushdns`。

---

## 📊 访问统计（全网实时）

统计后端已上线并全网共享：**任何访客打开网页都会累计计数**，不再只是本地数字。

- **后端**：Cloudflare Workers + KV（`GH_STATS` 命名空间 `gh-stats`）
- **接口**：`https://stats.sophieyoucha.cc.cd`（独立子域，已 Production / Active）
- **指标**：PV（总访问）、UV（独立访客，按 `__gh_uid` Cookie 去重）、今日新增、近 30 天访问趋势
- **容错**：前端 `JS/app.js` 页面加载时优先请求后端（4 秒超时），失败则降级到本地 `localStorage` 计数，保证离线也能显示统计卡片
- **UV 去重原理**：首次访问后端下发 `__gh_uid` Cookie（`HttpOnly; SameSite=None; Secure; 1 年`），后续请求携带该 Cookie 即不重复计为独立访客

---

## 🗂 项目结构

```
github-hosts-tool/
├── index.html          # 主程序（HTML 结构）
├── CSS/
│   └── styles.css      # 样式（玻璃拟态 UI、clamp 自适应、动效）
├── JS/
│   └── app.js          # 逻辑（DoH 查询、hosts 生成、延迟测试、统计、动效）
├── worker/
│   ├── index.js        # 可选：Cloudflare Workers 全站统计后端
│   └── wrangler.toml   # Worker 部署配置（KV 绑定 GH_STATS）
├── CNAME               # GitHub Pages 自定义域名（sophieyoucha.cc.cd）
├── LICENSE             # MIT 开源协议
└── README.md           # 本说明文档
```

---

## 🧩 技术栈

- **前端**：原生 HTML + CSS + JavaScript（无框架、无构建步骤），玻璃拟态 UI、折线图、数字滚动、按钮水波纹动效
- **DNS 解析**：DoH（DNS over HTTPS），多服务商自动择优
- **统计后端**：Cloudflare Workers（Serverless）+ Workers KV（键值存储，跨用户共享计数）
- **部署**：GitHub Pages（前端）/ Cloudflare Workers（统计后端）

---

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源。
