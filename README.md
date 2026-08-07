# GitHub Hosts 加速工具

打开页面，它帮你查清 GitHub 一堆域名当前最快的 IP，生成一份 hosts 文本，再给你一个 PowerShell 脚本，一键写进本机 hosts。

适合"直连 GitHub 慢得像在翻墙"的环境用。

## 在线使用

打开即用，零安装：

- 主站：[https://sophieyoucha.cc.cd/](https://sophieyoucha.cc.cd/)
- 备用：[https://sophie92-spec.github.io/github-fast-access/](https://sophie92-spec.github.io/github-fast-access/)

右上角的小圆点徽章表示统计来源：绿色 = 已连上云端，全网共用统计；灰色 = 后端抽风，临时只在自己浏览器里记数。

## 怎么把 hosts 真的写进系统

1. 页面打开后，先点「获取 IP」让它跑一遍解析
2. 点「生成 PowerShell 脚本」，下载一个 `.ps1`
3. 右键这个 `.ps1`，「使用 PowerShell 运行」—— 会弹 UAC，点同意
4. 脚本自动备份原 hosts、写新条目、刷新 DNS
5. 重开浏览器，去 GitHub 试试速度

不想用脚本也行：页面上有一段 hosts 文本，复制下来，以管理员身份打开 `C:\Windows\System32\drivers\etc\hosts` 粘贴进去，保存，再执行一次 `ipconfig /flushdns`。一样能生效。

Windows 第一次跑这个 `.ps1` 会冒一个「已保护你的电脑」的提示——这是 SmartScreen 在拦不认识的脚本，不是脚本有问题。点「更多信息 → 仍要运行」。脚本开源，没鬼。

## 访问统计

页面里那个 PV/UV 数字是接了 Cloudflare Workers + KV，全网共享的。任何人访问都会 +1。

UV 去重靠第一次访问时下发的一个 cookie（`__gh_uid`），里面就是个随机串，不收集任何个人信息。后端地址：[https://stats.sophieyoucha.cc.cd/](https://stats.sophieyoucha.cc.cd/)

如果 Workers 抽风，前端会自动降级到 `localStorage` 计数，徽章变灰。

## 安全方面

- 全站 HTTPS，Cloudflare 用 Full 模式回源
- 橙色云代理开着，GitHub Pages 真实 IP 不暴露
- 纯前端 SPA，零登录、零后端写用户数据
- 自带 Cloudflare 基础 DDoS 防护

## 常见问题

**自定义域名打不开 / 报 404？**
三件事确认：仓库根有 `CNAME` 文件且内容对、Cloudflare 给 apex 加了 4 条 A 指向 GitHub Pages 官方 IP（`185.199.108.153` / `.109.153` / `.110.153` / `.111.153`）并开代理、Cloudflare SSL/TLS 模式设的是 Full。三样齐全后等 5–30 分钟 DNS 传播。

**统计一直是灰色不涨？**
多半是后端 Workers 临时不可达，等几分钟刷一下通常会自己回到绿色。

**右键 `.ps1` 窗口一闪而过 / 看不到结果？**
老版本脚本会因为中文编码问题闪退。新版已改为纯 ASCII + 自动 UAC 提权：右键运行会弹 UAC → 同意后管理员窗口跑起来 → 跑完不关窗口，按 Enter 或点 X 关闭。

**想支持 `www.sophieyoucha.cc.cd`？**
在 Cloudflare DNS 加一条 CNAME，名称 `www`、目标 `sophieyoucha.cc.cd`、代理开，再回 GitHub Pages 自定义域名页点「再查一次」。

## 本地跑 / 自己改

```bash
git clone https://github.com/Sophie92-spec/github-fast-access.git
cd github-fast-access
python -m http.server 8765
# 浏览器打开 http://localhost:8765
```

直接双击 `index.html` 也能跑。

## 项目结构

```
github-hosts-tool/
├── index.html
├── CSS/styles.css
├── JS/app.js
├── worker/index.js        # 可选：Cloudflare Workers 统计后端
├── worker/wrangler.toml
├── CNAME                  # GitHub Pages 自定义域名
├── LICENSE                # MIT
└── README.md
```

## License

MIT。随便用。
