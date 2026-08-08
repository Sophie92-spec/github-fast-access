# GitHub Hosts 加速工具

一个纯前端的网页小工具：帮你把 GitHub 那一堆域名在当前网络下**最快的 IP** 查出来，自动生成一份 `hosts` 文本，再给你一个 Windows 一键脚本，把 hosts 写进本机 —— 让直连 GitHub 慢得像在翻墙的环境也能跑得顺畅。

不需要装任何东西，打开网页就能用。

---

## 在线使用

两个地址都指向同一份页面，挑能打开的用：

- 主站：[https://sophieyoucha.cc.cd/](https://sophieyoucha.cc.cd/)
- 备用（GitHub Pages 官方域）：[https://sophie92-spec.github.io/github-fast-access/](https://sophie92-spec.github.io/github-fast-access/)

> ⚠️ 因为站点挂在 Cloudflare 边缘缓存后面，**改完代码后看到的可能是旧版**。如果功能对不上，请用无痕窗口，或在页面上按 `Ctrl + Shift + R` 强制刷新。

---

## 它到底干了什么（三句话讲清）

1. **测延迟挑最快 DoH 源**：并列测全部 DoH 源（国内可用的 AliDNS / 360 / DNSPod，以及国际 CORS 友好的 Cloudflare / Google / Quad9 / AdGuard / OpenDNS / Mullvad）解析 `github.com` 的耗时，自动切到当前网络里最快且能用的那个。
2. **解析 + 选最快 IP**：用最快的 DoH 源把 12 个 GitHub 域名解析成候选 IP，再**逐 IP 实测延迟，自动选用每个域名最快的那一个**。
3. **生成 hosts / 一键脚本**：把选好的 IP 拼成 hosts 文本，给你一个 Windows `.bat` 脚本，双击就写进系统。

---

## 一张表看懂界面

页面顶部那张「📊 解析表」把 **DoH 源** 和 **GitHub 域名** 合并在同一张表里，用左侧徽章区分：

| 类型徽章 | 含义 | 这一行会显示什么 |
|----------|------|------------------|
| `源`（绿） | DoH 解析源 | 名称、本次测速延迟（`未测` / `超时` / `xxxms`），`✓ 当前` 表示下拉框正在用的源 |
| `域`（紫） | GitHub 域名 | 勾选框、解析到的 IP（可手动改）、实测延迟 |

**延迟配色（两张表同一套语言，不会看混）：**

- 🟢 **绿框** = 本轮最快（DoH 源里最快的那个、域名里最快的那条都会标绿）
- 🔴 **红框** = 本轮最慢（且 ≥1000ms，明显偏慢的才标，避免误伤）
- 淡红虚线底 = 测了但超时 / 没测到
- 蓝色 `✓ 当前` = 下拉框当前选中的 DoH 源

**分隔行**（📌 GitHub 域名）会显示解析进度和**数据新鲜度**：比如「更新于 14:30（12 分钟前）」；超过 6 小时会自动变红并加 ⚠，提醒你重测。

---

## 怎么把 hosts 真正写进系统

1. 打开页面，点「⚡ 测 DoH + 解析域名」—— 它会**一步做完**：测 DoH 延迟 → 自动切最快源 → 解析全部 12 个域名 → 逐 IP 测延迟 → 自动选用最快 IP。（运行时按钮下方有进度条；万一网络异常 30 秒还没跑完会自动超时提示，不会卡死）
2. 确认域名都勾选了（不需要的可以取消勾选；**解析失败的域名默认不勾选**，避免把不通的 IP 写进系统）。
3. 点「生成 .bat」，下载脚本。
4. **双击运行**（或右键 → 以管理员身份运行）—— 会弹 UAC 提权，点「是」。
5. 脚本自动：备份原 hosts → 写入新条目 → 刷新 DNS 缓存，结果**停在窗口里**让你看清楚。
6. 重开浏览器，去 GitHub 试试速度。

### 不想用脚本？手动也行（两种方式）

**方式一：复制文本框内容**
点「复制」拿到 hosts 文本 → 以**管理员身份**打开 `C:\Windows\System32\drivers\etc\hosts`（记事本 / VSCode 都行，但必须管理员，否则保存被拒）→ 把文本粘贴到文件末尾 → 保存 → 在 CMD / PowerShell 里执行 `ipconfig /flushdns`，生效。

**方式二：下载 `hosts.txt`**
点「下载 hosts.txt」拿到一份 `hosts.txt`（内容就是文本框里那份）。两种用法任选其一：
- 直接打开 `hosts.txt`，复制里面的内容，按「方式一」手动贴进系统 hosts；
- 或把 `hosts.txt` 改名为 `hosts`（**无扩展名**），以管理员身份覆盖到 `C:\Windows\System32\drivers\etc\hosts`，再 `ipconfig /flushdns`。

### 关于那个 `.bat` 脚本

下载的是**自提权批处理**（不是 `.ps1`）：双击会先请求管理员权限，同意后由管理员窗口把活干完并停在屏幕上——

- **绿色几行** = 备份 / 写入 / 刷 DNS 都成功，最后一行 `All done`
- **红色几行** = 哪步出错，窗口把具体错误信息完整打出来（不会再一闪没了），把那段红字发我就行
- 看完按任意键或点右上角 X 关掉

Windows 第一次跑会冒一个「已保护你的电脑」的提示（SmartScreen 拦不认识的程序，不是脚本有害），点「更多信息 → 仍要运行」即可。脚本完全开源透明。

> 为什么用 `.bat` 而不是 `.ps1`：之前的 `.ps1` 在 Windows 默认执行策略下加载就被拒，窗口红字一闪就没了；`.bat` 不受此限制，也不会有编码乱码问题。

---

## 按钮说明

| 按钮 | 作用 |
|------|------|
| 🌐 自动 DoH（下拉） | 选 DoH 源。`自动 DoH` 每次都会重新探测最快源；手动指定某家则固定用它解析 |
| ⚡ 测 DoH + 解析域名 | **主操作**：一步完成上面「它到底干了什么」的全部流程 |
| 🔄 重测延迟 | 不重跑 DoH 测速，只重新测各域名的 IP 延迟并刷新最快 IP |
| 复制 / hosts.txt / 生成 .bat / 恢复 .bat | 导出 hosts 文本或 Windows 脚本（恢复脚本会清掉写入的条目并刷 DNS） |

**「重测延迟」什么时候用？** 比如你换了网络、或隔了几小时想确认 IP 还快不快，点它比重新跑整套解析更轻。

---

## 访问统计（右上卡片）

页面里的 PV / UV / 近 30 天趋势接了 Cloudflare Workers + KV，**全网共享**的访问计数：

- **PV** 累计页面访问，**UV** 独立访客（靠首次访问下发的 `__gh_uid` cookie 去重，随机串，不收集个人信息）
- 趋势折线图可悬停看某天次数，也能用日期选择器选具体一天
- 数字加载时有「滚动累加」动画
- 如果后端抽风，前端自动降级到本机 `localStorage` 计数（此时趋势卡片标题不再显示「全网实时」），不耽误你看个大概

---

## 安全

- 全站 HTTPS，Cloudflare 用 Full 模式回源
- 橙色云代理开启，GitHub Pages 真实 IP 不暴露
- 纯前端静态页，**零登录、零后端写用户数据**
- 自带 Cloudflare 基础 DDoS 防护

---

## 常见问题

**自定义域名打不开 / 报 1016 / 530？**
根域 `sophieyoucha.cc.cd` 需要 Cloudflare 里绑了源站（GitHub Pages 或 Worker）才不会报源站错误。三件事确认：仓库根有 `CNAME` 文件且内容对、Cloudflare 给 apex 加 4 条 A 指向 GitHub Pages 官方 IP（`185.199.108.153` / `.109.153` / `.110.153` / `.111.153`）并开代理、Cloudflare SSL/TLS 模式设的是 Full。三样齐全后等 5–30 分钟 DNS 传播。打不开时直接用上面的 GitHub Pages 备用地址。

**统计一直是本地计数、不显示「全网实时」？**
多半是后端 Workers 临时不可达，等几分钟刷一下通常会自己回到全网实时。

**窗口一闪而过 / 看不到结果？**
现在下载的是 `.bat`：双击会先弹 UAC 提权，同意后管理员窗口把活干完并停在窗口里（成功显示 `All done`，报错红字也会留着），自己点 X 关。如果 UAC 你点了「否」，原窗口只显示一句提示就自动关——重新双击、这次点「是」即可。

**为什么有的域名延迟显示「—」？**
该域名解析出的 IP 全部连接超时、且域名级延迟探测也失败时，会显示「—」。通常是该 CDN 边缘节点在你的网络下不可达，不影响其他域名。可点「🔄 重测延迟」再试，或手动在 IP 框里填一个你能通的 IP。

**想支持 `www.sophieyoucha.cc.cd`？**
在 Cloudflare DNS 加一条 CNAME，名称 `www`、目标 `sophieyoucha.cc.cd`、代理开，再回 GitHub Pages 自定义域名页点「再查一次」。

---

## 本地跑 / 自己改

```bash
git clone https://github.com/Sophie92-spec/github-fast-access.git
cd github-fast-access
python -m http.server 8765
# 浏览器打开 http://localhost:8765
```

直接双击 `index.html` 也能跑（注意：统计后端走的是线上 Cloudflare Worker，本地不影响主要功能）。

### 项目结构

```
github-fast-access/
├── index.html            # 主页面
├── CSS/styles.css        # 样式（玻璃拟态深色主题 + 动效）
├── JS/app.js             # 核心逻辑：DoH 测速 / 域名解析 / 延迟实测 / 自动选最快 IP / 统计 / 下拉菜单
├── worker/index.js       # 可选：Cloudflare Workers 访问统计后端（KV: GH_STATS）
├── worker/wrangler.toml  # Worker 部署配置
├── CNAME                 # GitHub Pages 自定义域名
├── LICENSE               # MIT
└── README.md
```

---

## License

MIT。随便用、随便改。

---

## English

# GitHub Hosts Accelerator

A pure front-end web tool that finds the **fastest IP** for GitHub's domains on your current network, generates a `hosts` file automatically, and gives you a one-click Windows script to apply it — so GitHub loads smoothly even where direct access is slow.

No install needed. Just open the page.

---

## Use it online

Both addresses point to the same page; use whichever opens:

- Main: [https://sophieyoucha.cc.cd/](https://sophieyoucha.cc.cd/)
- Backup (official GitHub Pages domain): [https://sophie92-spec.github.io/github-fast-access/](https://sophie92-spec.github.io/github-fast-access/)

> ⚠️ Because the site sits behind Cloudflare's edge cache, **you may see an old version after a code change**. If something doesn't match, open a private/incognito window, or press `Ctrl + Shift + R` on the page to force a refresh.

---

## What it actually does (in three sentences)

1. **Pick the fastest DoH source**: it speed-tests all DoH sources in parallel (domestic-friendly AliDNS / 360 / DNSPod, plus CORS-friendly international Cloudflare / Google / Quad9 / AdGuard / OpenDNS / Mullvad) by resolving `github.com`, then auto-picks the fastest one that works on your network.
2. **Resolve + pick the fastest IP**: using the fastest DoH source, it resolves the 12 GitHub domains into candidate IPs, then **measures each IP's real latency and auto-selects the fastest one per domain**.
3. **Generate hosts / one-click script**: it assembles the chosen IPs into a hosts file and gives you a Windows `.bat` script that writes it into the system on double-click.

---

## The interface at a glance

The top **📊 comparison table** merges **DoH sources** and **GitHub domains** into one table, distinguished by a left-side badge:

| Badge | Meaning | What the row shows |
|-------|---------|--------------------|
| `SRC` (green) | DoH resolver | Name, this run's latency (`—` / `Timeout` / `xxxms`), `✓ Current` marks the source in use |
| `DOM` (purple) | GitHub domain | checkbox, resolved IP (editable), measured latency |

**Latency colors (same language in both tables):**

- 🟢 **Green box** = fastest this run (the fastest DoH source and the fastest domain both get marked green)
- 🔴 **Red box** = slowest this run (and ≥1000ms, so only clearly-slow ones are flagged)
- Faint red dashed = tested but timed out / not measured
- Blue `✓ Current` = the DoH source currently selected in the dropdown

The **divider row** (📌 GitHub Domains) shows resolution progress and **data freshness**: e.g. "Updated at 14:30 (12 min ago)". After 6 hours it turns red with ⚠ to remind you to re-test.

---

## How to actually write the hosts into your system

1. Open the page and click **⚡ Test DoH + Resolve Domains** — it does everything in one pass: test DoH latency → auto-pick fastest source → resolve all 12 domains → measure each IP's latency → auto-select fastest IP. (A progress bar appears under the button; if the network misbehaves and it hasn't finished in 30s, it auto-times-out with a hint instead of freezing.)
2. Confirm the domains you want are checked (uncheck any you don't need; **domains that failed to resolve are unchecked by default** so a dead IP is never written).
3. Click **Generate .bat** and download the script.
4. **Double-click to run** (or right-click → Run as administrator) — a UAC prompt asks for admin rights; click **Yes**.
5. The script automatically: backs up the original hosts → writes the new entries → flushes the DNS cache, and **stays on screen** so you can see the result.
6. Reopen your browser and try GitHub's speed.

### Don't want the script? Do it manually (two ways)

**Way 1: copy the text box**
Click **Copy** to get the hosts text → open `C:\Windows\System32\drivers\etc\hosts` **as administrator** (Notepad / VSCode both work, but must be admin or the save is rejected) → paste the text at the end of the file → save → run `ipconfig /flushdns` in CMD / PowerShell.

**Way 2: download `hosts.txt`**
Click **Download hosts.txt** to get a `hosts.txt` (same content as the text box). Either:
- Open `hosts.txt`, copy its content, and paste into the system hosts as in Way 1; or
- Rename `hosts.txt` to `hosts` (**no extension**) and overwrite `C:\Windows\System32\drivers\etc\hosts` as administrator, then `ipconfig /flushdns`.

### About that `.bat` script

What you download is a **self-elevating batch** (not `.ps1`): double-clicking first requests admin rights; after approval an admin window does the work and stays open —

- **Green lines** = backup / write / DNS flush all succeeded, ending with `All done`
- **Red lines** = where it failed; the window prints the exact error (no more flash-and-gone) — send me that red text
- Press any key or click the X at top-right to close when done

Windows may show a "Windows protected your PC" prompt on first run (SmartScreen blocking an unknown program, not because the script is harmful) — click "More info → Run anyway". The script is fully open-source and transparent.

> Why `.bat` instead of `.ps1`: the previous `.ps1` was rejected at load time by Windows' default execution policy — the window flashed red and closed. `.bat` isn't limited by that, and has no encoding issues either.

---

## Button reference

| Button | Action |
|--------|--------|
| 🌐 Auto DoH (dropdown) | Choose a DoH source. `Auto DoH` re-probes the fastest source each time; picking a specific one fixes it for resolution |
| ⚡ Test DoH + Resolve Domains | **Main action**: runs the entire flow described above in one step |
| 🔄 Retest latency | Without re-running the DoH speed test, only re-measures each domain's IP latency and refreshes the fastest IP |
| Copy / hosts.txt / Generate .bat / Restore .bat | Export the hosts text or Windows script (the restore script removes the written entries and flushes DNS) |

**When to use "Retest latency"?** E.g. after switching networks, or a few hours later when you want to confirm the IPs are still fast — lighter than re-running the whole resolution.

---

## Visit stats (top-right cards)

The PV / UV / last-30-days trend connects to a Cloudflare Workers + KV backend, a **globally shared** visit counter:

- **PV** = cumulative page views, **UV** = unique visitors (deduped by a `__gh_uid` cookie issued on first visit — random string, no personal info collected)
- The trend line chart is hoverable for a specific day, and a date picker selects any single day
- Numbers animate with a "count-up" effect when loading
- If the backend hiccups, the front-end falls back to local `localStorage` counting (the trend card title then drops the "live" suffix) — you still get a rough picture

---

## Security

- Fully HTTPS; Cloudflare uses Full mode to origin
- Orange-cloud proxy on; GitHub Pages' real IP is not exposed
- Pure static front-end — **zero login, zero backend writing user data**
- Built-in Cloudflare basic DDoS protection

---

## FAQ

**Custom domain won't open / shows 1016 / 530?**
The apex `sophieyoucha.cc.cd` needs a Cloudflare origin (GitHub Pages or a Worker) bound, or it errors with "no origin". Confirm three things: the repo root has a `CNAME` file with the right content, Cloudflare adds 4 A records for the apex pointing to GitHub Pages' official IPs (`185.199.108.153` / `.109.153` / `.110.153` / `.111.153`) with proxy on, and Cloudflare SSL/TLS mode is set to Full. After all three, wait 5–30 min for DNS propagation. When it won't open, just use the GitHub Pages backup link above.

**Stats stay local / no "live" suffix?**
Usually the backend Workers are temporarily unreachable; wait a few minutes and refresh — it typically returns to live on its own.

**Window flashed by / can't see the result?**
The download is now a `.bat`: double-clicking first pops a UAC elevation; after approval an admin window does the work and stays open (success shows `All done`, red errors stay too) — close it yourself with X. If you clicked "No" on UAC, the original window just shows one line and auto-closes — double-click again and this time click "Yes".

**Why does some domain show "—" for latency?**
When that domain's resolved IPs all time out on connection AND the domain-level latency probe also fails, it shows "—". Usually that CDN edge node is unreachable on your network and doesn't affect other domains. Click **🔄 Retest latency** to try again, or manually enter an IP you can reach in the IP box.

**Want `www.sophieyoucha.cc.cd`?**
In Cloudflare DNS add a CNAME named `www` targeting `sophieyoucha.cc.cd` with proxy on, then back in GitHub Pages custom-domain page click "Check again".

---

## Run locally / modify

```bash
git clone https://github.com/Sophie92-spec/github-fast-access.git
cd github-fast-access
python -m http.server 8765
# open http://localhost:8765 in your browser
```

Double-clicking `index.html` also works (note: the stats backend is the live Cloudflare Worker, unaffected locally).

### Project structure

```
github-fast-access/
├── index.html            # main page
├── CSS/styles.css        # styles (glassmorphism dark theme + animations)
├── JS/app.js             # core logic: DoH speed test / domain resolution / latency measurement / auto-pick fastest IP / stats / dropdown
├── worker/index.js       # optional: Cloudflare Workers visit-stats backend (KV: GH_STATS)
├── worker/wrangler.toml  # Worker deploy config
├── CNAME                 # GitHub Pages custom domain
├── LICENSE               # MIT
└── README.md
```

---

## License

MIT. Free to use and modify.

