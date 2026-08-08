# GitHub Hosts 加速工具

打开页面，它帮你查清 GitHub 一堆域名当前最快的 IP，生成一份 hosts 文本，再给你一个 Windows 批处理脚本，一键写进本机 hosts。

适合"直连 GitHub 慢得像在翻墙"的环境用。

## 在线使用

打开即用，零安装：

- 主站：[https://sophieyoucha.cc.cd/](https://sophieyoucha.cc.cd/)
- 备用：[https://sophie92-spec.github.io/github-fast-access/](https://sophie92-spec.github.io/github-fast-access/)

右上角的小圆点徽章表示统计来源：绿色 = 已连上云端，全网共用统计；灰色 = 后端抽风，临时只在自己浏览器里记数。

## 怎么把 hosts 真的写进系统

1. 页面打开后，先点「获取 IP」让它跑一遍解析
2. 点「生成 .bat」，下载一个 `.bat`
3. 双击运行（或右键 → 以管理员身份运行）—— 会弹 UAC，点同意
4. 脚本自动备份原 hosts、写新条目、刷新 DNS，结果停在窗口里
5. 重开浏览器，去 GitHub 试试速度

不想用脚本也行：页面上有一段 hosts 文本，复制下来，以管理员身份打开 `C:\Windows\System32\drivers\etc\hosts` 粘贴进去，保存，再执行一次 `ipconfig /flushdns`。一样能生效。

Windows 第一次跑这个 `.bat` 会冒一个「已保护你的电脑」的提示——这是 SmartScreen 在拦不认识的程序，不是脚本有问题。点「更多信息 → 仍要运行」。脚本开源，没鬼。

## 运行后窗口里会显示什么

双击（或右键以管理员身份运行）`.bat` 之后，会弹一个管理员窗口，它**不会自己关**，停下来把结果给你看清楚：

- **绿色几行** = 备份原 hosts、写入新条目、刷新 DNS 都成功了，最后一行是 `All done`
- **红色几行** = 哪一步出了错，窗口会把具体的错误信息完整打出来（不会再一闪没了），把那段红字发我就行
- 看完按任意键，或者点右上角 X 关掉

要是 UAC 弹窗你点了「否」，原来的窗口只显示一句提示就自动关了——那是正常的，重新双击运行、这次点「是」就好。

## 挑最快的 DoH 源（延迟对比）

页面顶部那个下拉框，选的是"用哪个 DoH（DNS over HTTPS）源去解析 GitHub 域名"。不同网络环境下各家 DoH 的速度差很多，所以给了一个对比工具，帮你挑当前网络里最快的那个：

1. 翻到页面下方的「DoH 延迟对比」卡片，点「测 DoH 延迟」
2. 它会同时测 DNSPod、阿里、Cloudflare、Google、Quad9、AdGuard、360 这 7 个源解析 `github.com` 的耗时
3. 表格里绿框标的是本次最快的源，标「当前」的是你顶部下拉现在正在用的那个
4. 点某一行的「选用」，或点「选用最快」，顶部下拉立即切到那个最快的源

之后你再点「获取 IP」，就全走这个最快的源了。

一点说明：浏览器只能测你当前这条网络下的延迟，没法跨运营商比。所以这个对比是在你当下的网络里挑最优 DoH 源，不是比不同运营商的快慢。

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

**窗口一闪而过 / 看不到结果？**
现在下载的是 `.bat`：双击会先弹 UAC 提权，同意后管理员窗口把活干完并停在窗口里（成功显示 All done，报错红字也会留着），自己点 X 关。`.bat` 不受 PowerShell 执行策略限制，也不会再有编码闪退的问题——之前的 `.ps1` 在 Windows 默认执行策略下加载就被拒，窗口红字一闪就没了。

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
