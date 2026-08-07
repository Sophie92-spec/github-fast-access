# 🚀 GitHub Hosts 加速工具

> 自动查询最优 GitHub IP · 一键生成 hosts 配置 · 自动生成 PowerShell 脚本

一个**纯前端、可选云端后端**的网页工具，帮助你获取 GitHub 相关域名的最优 IP，并生成可直接应用的 `hosts` 配置与一键脚本，缓解部分地区访问 GitHub 缓慢的问题。

---

## ✨ 功能特性

- **自动查询 IP**：通过 DoH（DNS over HTTPS）实时解析 12 个 GitHub 相关域名的最优 IP，支持 DNSPod / AliDNS / Cloudflare / Google 多服务商自动切换。
- **延迟测试**：测试当前网络到各域名的响应时间，应用前后可对比效果。
- **生成 hosts 配置**：自动生成标准 `hosts` 格式内容，支持勾选/取消域名，IP 可手动修改或手动输入。
- **一键 PowerShell 脚本**：生成 `.ps1` 脚本，右键「以管理员身份运行」即可自动备份原 hosts → 清理旧条目 → 写入新条目 → 刷新 DNS 缓存。
- **恢复脚本**：一键生成恢复脚本，移除所有 GitHub hosts 条目，恢复默认连接方式。

---

## 🛠 使用方法

### 方式一：打开网页（推荐）

🌐 在线直接用：https://sophie92-spec.github.io/github-fast-access/

打开链接就能用，不用装任何东西，页面会自动帮你查 IP。想本地跑也行——直接用浏览器打开 `index.html`，或执行 `python -m http.server 8765` 后访问 http://localhost:8765。

### 方式二：应用配置

1. 点「获取最新 IP」，等解析完成；
2. 点「生成 PowerShell 脚本」→「下载 .ps1」；
3. 系统若弹「可能会损害你的设备」，放心点「保留」——脚本开源透明，没毛病；
4. **右键** `.ps1` →「使用 PowerShell 运行」（需管理员）；
5. 脚本自动备份、写入、刷新 DNS，重开浏览器即可。

> PowerShell 脚本被 Windows 拦截是正常保护机制，不是脚本有问题，点「保留」再用管理员身份运行就好。嫌麻烦也可以手动复制 hosts 内容，以管理员打开 `C:\Windows\System32\drivers\etc\hosts` 粘贴保存，再跑 `ipconfig /flushdns`。

---

## 📁 项目结构

```
github-hosts-tool/
├── index.html          # 主程序（HTML 结构）
├── CSS/
│   └── styles.css      # 样式（玻璃拟态 UI）
├── JS/
│   └── app.js          # 逻辑（DoH 查询、hosts 生成、访问统计）
├── worker/
│   ├── index.js        # 可选：Cloudflare Workers 全站统计后端
│   └── wrangler.toml   # Worker 部署配置（KV 绑定）
├── LICENSE             # MIT 开源协议
└── README.md           # 本说明文档
```

---

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源。
