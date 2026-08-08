const DOMAINS=['github.com','api.github.com','raw.githubusercontent.com','objects.githubusercontent.com','codeload.github.com','github.global.ssl.fastly.net','assets-cdn.github.com','github.githubassets.com','gist.github.com','live.github.com','favicons.githubusercontent.com','collector.github.com'];
// DoH 源定义：国内可达（阿里/360）+ 国际 CORS 友好源（Cloudflare/Google/Quad9/AdGuard/OpenDNS/Mullvad）。
// 国际源在国内多数被墙，但仍列出来——能直连的网络（VPN/特殊线路）可用；自动测速已改为并行，多源也不拖慢。
// 注：DNSPod(doh.pub) 国内可达但服务端不发 CORS 头，浏览器 fetch 会被拦，故仅作下拉选项；解析时由 rd() 自动兜底回退到可用源。
const P={
  alidns:{url:d=>`https://dns.alidns.com/resolve?name=${d}&type=A`,headers:{}},
  '360':{url:d=>`https://doh.360.cn/resolve?name=${d}&type=A`,headers:{}},
  dnspod:{url:d=>`https://doh.pub/dns-query?name=${d}&type=A`,headers:{'Accept':'application/dns-json'}},
  cloudflare:{url:d=>`https://cloudflare-dns.com/dns-query?name=${d}&type=A`,headers:{'Accept':'application/dns-json'}},
  google:{url:d=>`https://dns.google/resolve?name=${d}&type=A`,headers:{}},
  quad9:{url:d=>`https://dns.quad9.net/dns-query?name=${d}&type=A`,headers:{'Accept':'application/dns-json'}},
  adguard:{url:d=>`https://dns.adguard-dns.com/dns-query?name=${d}&type=A`,headers:{'Accept':'application/dns-json'}},
  opendns:{url:d=>`https://doh.opendns.com/dns-query?name=${d}&type=A`,headers:{'Accept':'application/dns-json'}},
  mullvad:{url:d=>`https://doh.mullvad.net/dns-query?name=${d}&type=A`,headers:{'Accept':'application/dns-json'}}
};
// 自动测速覆盖全部源（并行执行，总耗时≈单源耗时，不会因源多而变慢）；国内网络通常仅阿里/360 可用
const A=['alidns','360','dnspod','cloudflare','google','quad9','adguard','opendns','mullvad'];
const S={};DOMAINS.forEach(d=>{S[d]={domain:d,ips:[],selectedIp:'',status:'pending',latency:null,included:false}});
const $=id=>document.getElementById(id),H=$('hosts-content'),T=$('toast');
let dohValue='auto';

/* ===== 国际化 i18n（中文 / English） ===== */
const I18N={
  zh:{
    page_title:'GitHub Hosts 加速器',
    app_title:'GitHub Hosts 加速器',
    app_sub:'DoH 查询最优 IP · 一键生成 hosts · .bat 脚本',
    sec_cmp:'📊 解析表 · DoH 源 + GitHub 域名',
    cmp_hint:'测每个 DoH 源的延迟并自动切最快源解析下方全部 GitHub 域名；每个域名会实测各候选 IP 延迟、<b>自动选用最快的那个</b>。<span style="color:var(--green)">绿框</span> = 最快，<span style="color:var(--red)">红框</span> = 最慢（≥1000ms）。点「🔄 重测延迟」可在不重跑 DoH 测速的情况下刷新域名延迟与最快 IP。',
    step_doh_title:'选 DoH 源',
    step_doh_hint:'测速后自动用最快源解析下方 GitHub 域名',
    doh_status_init:'DoH 未测速',
    btn_test:'⚡ 测 DoH + 解析域名',
    btn_retest:'🔄 重测延迟',
    sec_hosts:'📝 Hosts 内容',
    btn_copy:'复制',
    btn_gen:'生成 .bat',
    btn_restore:'恢复 .bat',
    sec_howto:'📖 使用说明',
    howto_win:'<ol><li>选择 DoH 来源，点击 <code>测 DoH + 解析域名</code>，等待所有 DoH 源和域名解析完成</li><li>查看状态列：绿色 ✓ 表示成功，红色 ✗ 可手动输入 IP</li><li>确认需要加速的域名已勾选（可取消不需要的域名）</li><li>切换到下方 Hosts 内容区，点击 <code>生成 .bat</code></li><li>下载后<strong>双击运行</strong>（或右键 → 以管理员身份运行），首次会弹 UAC 请求管理员权限</li><li>脚本将自动：备份原 hosts → 写入新条目 → 刷新 DNS 缓存，结果会停留显示</li></ol><div class="tip">💡 也可手动操作：以管理员身份打开记事本 → 打开文件 <code>C:\\Windows\\System32\\drivers\\etc\\hosts</code>（注意文件无扩展名！）→ 将 Hosts 内容粘贴到文件末尾 → 保存 → 在 CMD 中执行 <code>ipconfig /flushdns</code></div>',
    howto_mac:'<ol><li>选择 DoH 来源，点击 <code>测 DoH + 解析域名</code>，等待所有 DoH 源和域名解析完成</li><li>查看状态列确认解析成功（绿色 ✓），勾选需要加速的域名</li><li>切换到下方 Hosts 内容区，点击 <code>复制</code> 或手动全选文本</li><li>打开终端（Terminal.app），输入 <code>sudo nano /etc/hosts</code></li><li>输入系统密码后，将光标移至文件末尾，粘贴 Hosts 内容</li><li>按 <code>Control + O</code> 保存文件，再按 <code>Control + X</code> 退出 nano</li><li>终端执行 <code>sudo dscacheutil -flushcache</code> 和 <code>sudo killall -HUP mDNSResponder</code></li></ol><div class="tip">💡 如果 nano 提示无写入权限，请确认当前账号具有管理员权限（系统偏好设置 → 用户与群组）</div>',
    howto_linux:'<ol><li>选择 DoH 来源，点击 <code>测 DoH + 解析域名</code>，等待所有 DoH 源和域名解析完成</li><li>查看状态列，绿色 ✓ 表示成功，取消不需要加速的域名勾选</li><li>切换到 Hosts 内容区，点击 <code>复制</code> 获取 hosts 文本</li><li>打开终端，输入 <code>sudo nano /etc/hosts</code>（也可用 <code>sudo vi /etc/hosts</code>）</li><li>将光标移至文件末尾，粘贴 Hosts 内容</li><li>按 <code>Control + O</code> 保存，<code>Control + X</code> 退出</li><li>刷新 DNS 缓存，根据发行版选择对应命令</li></ol><div class="tip">💡 不同发行版刷新命令：Ubuntu/Debian → <code>sudo systemd-resolve --flush-caches</code>；CentOS/RHEL/Fedora → <code>sudo systemctl restart NetworkManager</code>；Arch → <code>sudo resolvectl flush-caches</code></div>',
    social_github:'GitHub',
    social_bili:'哔哩哔哩',
    stats_trend_title:'📈 近 30 天访问趋势',
    stats_live:'全网实时',
    stats_report_title:'访问统计',
    stats_pv_label:'总访问量 PV',
    stats_uv_label:'独立访客 UV',
    stats_today_label:'今日新增',
    stats_date_pick:'📅 选择日期',
    ps1_tip:'下载后 Windows 可能提示风险点「仍要运行」——脚本完全开源透明，双击运行并点「是」放行 UAC 即可。<br>运行后窗口会<b>停留</b>显示结果：<b style="color:#86efac">绿色</b> = 备份 / 写入 / 刷 DNS 成功（末尾 All done）；若出错则显示 <b style="color:#fca5a5">红色</b> 错误信息并停留，把那段红字发我即可。看完按任意键或点 X 关闭。',
    modal_title:'脚本',
    modal_apply:'Windows 脚本 (.bat)',
    modal_restore:'恢复脚本 (.bat)',
    btn_dl:'下载',
    btn_close:'关闭',
    opt_auto:'自动 DoH',
    opt_alidns:'AliDNS (阿里)',
    opt_360:'360 DoH',
    opt_dnspod:'DNSPod (腾讯)',
    opt_cloudflare:'Cloudflare',
    opt_google:'Google',
    opt_quad9:'Quad9 (隐私)',
    opt_adguard:'AdGuard (去广告)',
    opt_opendns:'OpenDNS (Cisco)',
    opt_mullvad:'Mullvad',
    doh_testing:'DoH 状态：测速中…',
    doh_testing_n:'DoH 状态：测速中 {0}/{1}',
    doh_timeout:'DoH 状态：测速超时（30s 未完成，可能网络问题）',
    doh_all_fail:'DoH 状态：所有源都连不上（网络可能限制了 DoH）',
    doh_partial:'DoH 状态：{0}/{1} 可用，最快 {2} {3}ms（均 {4}ms）',
    doh_all_ok:'DoH 状态：{0}/{1} 全部可用，最快 {2} {3}ms（均 {4}ms）',
    toast_fastest:'最快 {0} {1}ms',
    toast_all_fail:'所有 DoH 源都无法连接：可手动输入 IP，或换网络/热点再试',
    toast_timeout:'测速超时，建议检查网络或换源',
    toast_picked:'已选用 DoH：{0}',
    prog_ready:'准备测速…',
    prog_doh_n:'测 DoH 源 {0}/{1}',
    prog_parse:'解析 GitHub 域名…',
    prog_done:'完成 ✓',
    prog_retest:'重测域名延迟…',
    toast_need_test:'请先点「测 DoH + 解析域名」解析域名',
    toast_retested:'域名延迟已重测，已自动选用最快 IP',
    toast_copied:'✅ 已复制',
    toast_copy_fail:'❌ 失败',
    toast_hosts_dl:'✅ hosts.txt 下载完成',
    toast_bat_dl:'✅ {0}',
    fresh_none:'尚未解析',
    fresh_just:'刚刚更新',
    fresh_mins:'更新于 {0}（{1} 分钟前）',
    fresh_hours:'更新于 {0}（已过期 {1} 小时前）',
    fresh_days:'更新于 {0}（已过期 {1} 天前）',
    sum_usable:'可用源',
    sum_timeout:'超时',
    sum_slow:'慢（≥1000ms）',
    sum_avg:'平均延迟',
    sum_recommend:'推荐使用',
    tk_visits:'访问 {0} 次',
    badge_src:'源',
    badge_dom:'域',
    lat_untested:'未测',
    lat_timeout:'超时',
    cur:'✓ 当前',
    loading:'查询中...',
    ph_ip:'手动输入IP',
    divider_domains:'📌 GitHub 域名',
    sel_all:'全选',
    parse_progress:'解析中 {0}/{1}…',
    parse_ok:'{0} / {1} 解析成功',
    cmp_empty:'点「⚡ 测 DoH + 解析域名」开始：先测每个 DoH 源的延迟，挑最快用于解析下方全部 12 个 GitHub 域名。<b>绿框</b> = 最快，<b>红框</b> = 最慢（≥1000ms）。'
  },
  en:{
    page_title:'GitHub Hosts Accelerator',
    app_title:'GitHub Hosts Accelerator',
    app_sub:'Find the fastest IP via DoH · generate hosts · .bat script',
    sec_cmp:'📊 Comparison · DoH sources + GitHub domains',
    cmp_hint:'Measures each DoH source\'s latency and auto-picks the fastest to resolve all GitHub domains below; each domain gets its candidate IPs latency-tested and the <b>fastest one is auto-selected</b>. <span style="color:var(--green)">Green box</span> = fastest, <span style="color:var(--red)">red box</span> = slowest (≥1000ms). Click <b>🔄 Retest latency</b> to refresh domain latency and fastest IP without re-running the DoH speed test.',
    step_doh_title:'Choose DoH source',
    step_doh_hint:'After testing, auto-resolves GitHub domains with the fastest source',
    doh_status_init:'DoH not tested',
    btn_test:'⚡ Test DoH + Resolve Domains',
    btn_retest:'🔄 Retest latency',
    sec_hosts:'📝 Hosts content',
    btn_copy:'Copy',
    btn_gen:'Generate .bat',
    btn_restore:'Restore .bat',
    sec_howto:'📖 How to use',
    howto_win:'<ol><li>Select a DoH source and click <code>Test DoH + Resolve Domains</code>; wait for all sources and domains to finish resolving.</li><li>Check the status column: green ✓ means success, red ✗ lets you enter an IP manually.</li><li>Confirm the domains you want to accelerate are checked (uncheck any you don\'t need).</li><li>Go to the Hosts section below and click <code>Generate .bat</code>.</li><li>After download, <strong>double-click to run</strong> (or right-click → Run as administrator). A UAC prompt asks for admin rights the first time.</li><li>The script automatically: backs up the original hosts → writes new entries → flushes the DNS cache, and the result stays on screen.</li></ol><div class="tip">💡 Or manually: open Notepad <strong>as administrator</strong> → open <code>C:\\Windows\\System32\\drivers\\etc\\hosts</code> (note: no file extension!) → paste the Hosts content at the end → save → run <code>ipconfig /flushdns</code> in CMD.</div>',
    howto_mac:'<ol><li>Select a DoH source and click <code>Test DoH + Resolve Domains</code>; wait for all sources and domains to finish resolving.</li><li>Check the status column (green ✓ = success) and tick the domains you want to accelerate.</li><li>Go to the Hosts section and click <code>Copy</code> or select all the text.</li><li>Open Terminal.app and run <code>sudo nano /etc/hosts</code>.</li><li>Enter your password, move the cursor to the end of the file, and paste the Hosts content.</li><li>Press <code>Control + O</code> to save, then <code>Control + X</code> to exit nano.</li><li>Run <code>sudo dscacheutil -flushcache</code> and <code>sudo killall -HUP mDNSResponder</code> in Terminal.</li></ol><div class="tip">💡 If nano says permission denied, make sure your account has admin rights (System Settings → Users & Groups).</div>',
    howto_linux:'<ol><li>Select a DoH source and click <code>Test DoH + Resolve Domains</code>; wait for all sources and domains to finish resolving.</li><li>Check the status column (green ✓ = success) and uncheck any domains you don\'t want.</li><li>Go to the Hosts section and click <code>Copy</code> to get the hosts text.</li><li>Open a terminal and run <code>sudo nano /etc/hosts</code> (or <code>sudo vi /etc/hosts</code>).</li><li>Move the cursor to the end of the file and paste the Hosts content.</li><li>Press <code>Control + O</code> to save, <code>Control + X</code> to exit.</li><li>Flush the DNS cache with the command for your distro.</li></ol><div class="tip">💡 Flush commands by distro: Ubuntu/Debian → <code>sudo systemd-resolve --flush-caches</code>; CentOS/RHEL/Fedora → <code>sudo systemctl restart NetworkManager</code>; Arch → <code>sudo resolvectl flush-caches</code>.</div>',
    social_github:'GitHub',
    social_bili:'Bilibili',
    stats_trend_title:'📈 Visits · last 30 days',
    stats_live:'live',
    stats_report_title:'Visits stats',
    stats_pv_label:'Total PV',
    stats_uv_label:'Unique UV',
    stats_today_label:'Today',
    stats_date_pick:'📅 Pick a date',
    ps1_tip:'After download Windows may warn about risk — click <strong>Still run</strong>. The script is fully open-source and transparent; double-click to run and click <strong>Yes</strong> on the UAC prompt.<br>The window will <b>stay open</b> showing the result: <b style="color:#86efac">green</b> = backup / write / DNS flush succeeded (ends with All done); if something errors, <b style="color:#fca5a5">red</b> error text is shown and stays — send me that red text. When done, press any key or click X to close.',
    modal_title:'Script',
    modal_apply:'Windows script (.bat)',
    modal_restore:'Restore script (.bat)',
    btn_dl:'Download',
    btn_close:'Close',
    opt_auto:'Auto DoH',
    opt_alidns:'AliDNS',
    opt_360:'360 DoH',
    opt_dnspod:'DNSPod (Tencent)',
    opt_cloudflare:'Cloudflare',
    opt_google:'Google',
    opt_quad9:'Quad9 (Privacy)',
    opt_adguard:'AdGuard',
    opt_opendns:'OpenDNS (Cisco)',
    opt_mullvad:'Mullvad',
    doh_testing:'DoH status: testing…',
    doh_testing_n:'DoH status: testing {0}/{1}',
    doh_timeout:'DoH status: timeout (30s, possible network issue)',
    doh_all_fail:'DoH status: no source reachable (network may block DoH)',
    doh_partial:'DoH status: {0}/{1} usable, fastest {2} {3}ms (avg {4}ms)',
    doh_all_ok:'DoH status: {0}/{1} all usable, fastest {2} {3}ms (avg {4}ms)',
    toast_fastest:'Fastest: {0} {1}ms',
    toast_all_fail:'All DoH sources unreachable: enter an IP manually, or switch network/try hotspot',
    toast_timeout:'Test timed out — check your network or switch source',
    toast_picked:'DoH selected: {0}',
    prog_ready:'Preparing…',
    prog_doh_n:'Testing DoH sources {0}/{1}',
    prog_parse:'Resolving GitHub domains…',
    prog_done:'Done ✓',
    prog_retest:'Retesting domain latency…',
    toast_need_test:'Run “Test DoH + Resolve Domains” first to resolve domains',
    toast_retested:'Domain latency retested, fastest IP auto-selected',
    toast_copied:'✅ Copied',
    toast_copy_fail:'❌ Failed',
    toast_hosts_dl:'✅ hosts.txt downloaded',
    toast_bat_dl:'✅ {0}',
    fresh_none:'Not resolved yet',
    fresh_just:'Just updated',
    fresh_mins:'Updated at {0} ({1} min ago)',
    fresh_hours:'Updated at {0} ({1} h ago, stale)',
    fresh_days:'Updated at {0} ({1} d ago, stale)',
    sum_usable:'Usable',
    sum_timeout:'Timeout',
    sum_slow:'Slow (≥1000ms)',
    sum_avg:'Avg latency',
    sum_recommend:'Recommended',
    tk_visits:'{0} visits',
    badge_src:'SRC',
    badge_dom:'DOM',
    lat_untested:'—',
    lat_timeout:'Timeout',
    cur:'✓ Current',
    loading:'Resolving...',
    ph_ip:'Enter IP manually',
    divider_domains:'📌 GitHub Domains',
    sel_all:'Select all',
    parse_progress:'Resolving {0}/{1}…',
    parse_ok:'{0} / {1} resolved',
    cmp_empty:'Click <b>⚡ Test DoH + Resolve Domains</b> to start: it first measures each DoH source\'s latency, then picks the fastest to resolve all 12 GitHub domains below. <b>Green box</b> = fastest, <b>red box</b> = slowest (≥1000ms).'
  }
};
let lang=(function(){try{var s=localStorage.getItem('gh_lang');if(s==='en'||s==='zh')return s;var n=(navigator.language||'zh-CN').slice(0,2);return n==='en'?'en':'zh';}catch(e){return 'zh';}})();
function t(key){
  var d=I18N[lang]&&I18N[lang][key]!=null?I18N[lang][key]:(I18N.zh[key]!=null?I18N.zh[key]:key);
  for(var i=1;i<arguments.length;i++){d=String(d).replace(new RegExp('\\{'+(i-1)+'\\}','g'),arguments[i]);}
  return d;
}
function applyI18n(){
  document.documentElement.lang=lang==='zh'?'zh-CN':'en';
  document.querySelectorAll('[data-i18n]').forEach(function(el){el.textContent=t(el.getAttribute('data-i18n'));});
  document.querySelectorAll('[data-i18n-html]').forEach(function(el){el.innerHTML=t(el.getAttribute('data-i18n-html'));});
  document.title=t('page_title');
  var lb=$('lang-toggle');if(lb)lb.textContent=lang==='zh'?'🇬🇧 EN':'🇨🇳 中文';
}
// Portal dropdown
const dTrigger=$('doh-trigger'),dLabel=$('doh-label'),dWrap=$('doh-trigger-wrap');
const OPTIONS=[{v:'auto',k:'opt_auto'},{v:'alidns',k:'opt_alidns'},{v:'360',k:'opt_360'},{v:'dnspod',k:'opt_dnspod'},{v:'cloudflare',k:'opt_cloudflare'},{v:'google',k:'opt_google'},{v:'quad9',k:'opt_quad9'},{v:'adguard',k:'opt_adguard'},{v:'opendns',k:'opt_opendns'},{v:'mullvad',k:'opt_mullvad'}];
let dMenu=null;
function closeDoh(){if(dMenu){dMenu.remove();dMenu=null;dWrap.classList.remove('doh-open')}}
function openDoh(){
  if(dMenu)return closeDoh();
  dWrap.classList.add('doh-open');
  dMenu=document.createElement('div');dMenu.className='doh-menu';
  var r=dTrigger.getBoundingClientRect();
  dMenu.style.top=(r.bottom+4)+'px';dMenu.style.left=r.left+'px';
  OPTIONS.forEach(function(o){
    var el=document.createElement('div');el.className='doh-menu-item';
    if(o.v===dohValue)el.classList.add('on');
    el.textContent=t(o.k);el.addEventListener('click',function(e){e.stopPropagation();dohPick(o.v)});
    dMenu.appendChild(el)
  });
  document.body.appendChild(dMenu)
}
dTrigger.addEventListener('click',function(e){e.stopPropagation();openDoh()});
document.addEventListener('click',function(e){if(dMenu&&!dMenu.contains(e.target)&&e.target!==dTrigger)closeDoh()});
window.addEventListener('resize',closeDoh);window.addEventListener('scroll',closeDoh,true);
function toast(m,g){T.textContent=m;T.className='toast on '+(g||'');setTimeout(()=>T.className='toast',2500)}
async function rwp(d,k,t=2500){const p=P[k],c=new AbortController();const id=setTimeout(()=>c.abort(),t);try{const r=await fetch(p.url(d),{headers:p.headers,signal:c.signal});clearTimeout(id);const d2=await r.json();return d2.Answer?d2.Answer.filter(a=>a.type===1).map(a=>a.data):[]}catch(e){clearTimeout(id);throw e}}
// 解析域名：优先用 pref 指定的源；若该源失败（如 DNSPod 无 CORS 被浏览器拦），自动兜底试其他所有源
async function rd(d,pref){
  const order=pref==='auto'?A:[pref,...A.filter(x=>x!==pref)];
  for(const p of order){
    try{const ips=await rwp(d,p);if(ips.length>0)return{ips}}catch(e){}
  }
  return{ips:[]}
}
function tl(d,t=5000){return new Promise(r=>{const img=new Image(),s=performance.now();let done=false;const id=setTimeout(()=>{if(!done){done=true;r(null)}},t);img.onload=img.onerror=()=>{if(!done){done=true;clearTimeout(id);r(Math.round(performance.now()-s))}};img.src=`https://${d}/favicon.ico?_t=${Date.now()}`})}
// 按具体 IP 实测延迟（用于"选最快 IP"）：直接连该 IP 的 443，TLS 失败也算到达，取耗时作 RTT 代理
async function ipLat(ip,t=2500){return new Promise(function(r){var img=new Image(),s=performance.now(),done=false;var id=setTimeout(function(){if(!done){done=true;r(null)}},t);img.onload=img.onerror=function(){if(!done){done=true;clearTimeout(id);r(Math.round(performance.now()-s))}};img.src='https://'+ip+'/favicon.ico?_t='+Date.now()})}
function cls(l){if(l===null)return'fail';if(l<200)return'good';if(l<800)return'ok';return'slow'}
function txt(l){return l===null?'—':l+'ms'}
function domStatusOk(d){return S[d].status==='success'&&S[d].ips.length>0}


// IP 单元格渲染（域名行用）：根据 status 渲染不同控件
function ipCellHtml(d){
  const s=S[d];
  if(s.status==='loading')return'<span style="color:var(--muted)">'+t('loading')+'</span>';
  if(s.status==='success'&&s.ips.length>0){
    if(s.ips.length===1)return`<input type="text" class="ip-input" data-domain="${d}" value="${s.selectedIp}">`;
    return`<select class="ip-select" data-domain="${d}">${s.ips.map(ip=>{const lt=(s.ipLats&&s.ipLats[ip]!=null)?' ('+s.ipLats[ip]+'ms)':'';return `<option value="${ip}" ${ip===s.selectedIp?'selected':''}>${ip}${lt}</option>`}).join('')}</select>`;
  }
  if(s.status==='fail')return`<input type="text" class="ip-input" data-domain="${d}" placeholder="${t('ph_ip')}" value="${s.selectedIp}">`;
  return'<span style="color:var(--muted)">—</span>';
}

function update(){const e=[];DOMAINS.forEach(d=>{const s=S[d];if(s.included&&domStatusOk(d)&&s.selectedIp&&/^(\d{1,3}\.){3}\d{1,3}$/.test(s.selectedIp))e.push(`${s.selectedIp.padEnd(22)} ${d}`)});var stamp=lang==='zh'?new Date().toLocaleString('zh-CN'):new Date().toISOString().slice(0,16).replace('T',' ');H.value=`# GitHub Hosts Start (${lang==='zh'?'更新于 ':'updated '}${stamp})\n${e.join('\n')}\n# GitHub Hosts End`;$('hosts-count').textContent=e.length;  H.style.height='auto';H.style.height=H.scrollHeight+'px'}

// 测试进度条：pct 为 0-100 显示并设宽度；pct 为 null/undefined 隐藏
function setProgress(pct,label){
  var box=$('test-progress'),bar=$('test-progress-bar'),lab=$('test-progress-label');
  if(!box)return;
  if(pct===null||pct===undefined){box.style.display='none';return;}
  box.style.display='block';
  bar.style.width=Math.max(0,Math.min(100,pct))+'%';
  if(label)lab.textContent=label;
}

async function pickAuto(){
  const races=A.map(k=>rwp('github.com',k).then(()=>k).catch(()=>null));
  let pref=await Promise.race([...races,new Promise(r=>setTimeout(()=>r(null),2500))]);
  if(!pref){for(const k of A){try{await rwp('github.com',k);pref=k;break}catch(e){}}}
  return pref;
}

// 解析域名（通过当前 dohValue），并发限 4，结果更新到 S[d] 并刷新表格
// onProg(0-100) 可选：由上层用于驱动测试进度条（解析占 0-60，延迟占 60-90，结束 100）
async function fetchDomains(onProg){
  const ok0=DOMAINS.filter(domStatusOk).length;
  if(ok0>0)DOMAINS.forEach(d=>{S[d].status='loading'});   // 二次解析时显示过渡态
  renderUnified();
  const pref=dohValue==='auto'?await pickAuto():dohValue;
  const batch=6,total=DOMAINS.length;
  for(let i=0;i<total;i+=batch){
    const chunk=DOMAINS.slice(i,i+batch);
    await Promise.all(chunk.map(async d=>{
      const r=await rd(d,pref||'auto');
      S[d].ips=r.ips;S[d].selectedIp=r.ips[0]||'';S[d].status=r.ips.length>0?'success':'fail';
    }));
    renderUnified();
    update();
    if(onProg)onProg(Math.round((i+batch)/total*60));
  }
  // 按延迟自动选用每个域名的最快 IP（轻量版"候选 IP 对比"）
  await measureDomainLatency(onProg?p=>onProg(60+Math.round(p*0.3)):undefined);
  if(onProg)onProg(90);
  // 自动按解析结果勾选：成功的勾上、失败的不勾（覆盖用户此前手动设置）
  DOMAINS.forEach(d=>{S[d].included=domStatusOk(d)});
  renderUnified();
  if(onProg)onProg(100);
  lastFetchAt=Date.now();
  const ok=DOMAINS.filter(domStatusOk).length;
  return ok;
}
// 测每个域名候选 IP 的延迟，自动选用最快；并发限 4。无 IP 的域名跳过
async function measureDomainLatency(onProg){
  const batch=6,total=DOMAINS.length;
  for(let i=0;i<total;i+=batch){
    const chunk=DOMAINS.slice(i,i+batch);
    await Promise.all(chunk.map(async d=>{
      if(S[d].ips.length===0){S[d].latency=null;renderUnified();return;}
      let lat=null;
      if(S[d].ips.length===1){
        S[d].selectedIp=S[d].ips[0];
        lat=await ipLat(S[d].ips[0]);
      }else{
        const lats=await Promise.all(S[d].ips.map(ip=>ipLat(ip)));
        S[d].ipLats={};S[d].ips.forEach((ip,idx)=>{S[d].ipLats[ip]=lats[idx]});
        let bi=S[d].ips[0],bv=null;
        S[d].ips.forEach((ip,idx)=>{const v=lats[idx];if(v!==null&&(bv===null||v<bv)){bv=v;bi=ip}});
        S[d].selectedIp=bi;lat=bv;
      }
      if(lat===null)lat=await tl(d,2500); // 回退：IP 探测全超时则用域名级延迟
      S[d].latency=lat;
      renderUnified();
    }));
    if(onProg)onProg(Math.round((i+batch)/total*100));
  }
  update();
}

// ===== DoH 延迟对比（同时驱动统一表渲染）=====
var dohLats={},cmpTesting=false,lastFetchAt=null;
function dohName(k){for(var i=0;i<OPTIONS.length;i++){if(OPTIONS[i].v===k)return t(OPTIONS[i].k)}return k}
function dohBest(){var bk=null,bv=null;A.forEach(function(k){var v=dohLats[k];if(v!==null&&v!==undefined&&(bv===null||v<bv)){bv=v;bk=k}});return bk}
function dohWorst(){var wk=null,wv=null;A.forEach(function(k){var v=dohLats[k];if(v!==null&&v!==undefined&&(wv===null||v>wv)){wv=v;wk=k}});return wk}
function dohUsable(){return A.filter(function(k){return(k in dohLats)&&dohLats[k]!==null}).length}
function dohAvg(){var vs=A.map(function(k){return dohLats[k]}).filter(function(v){return v!==null&&v!==undefined});return vs.length?Math.round(vs.reduce(function(a,b){return a+b},0)/vs.length):null}
function us(){return dohUsable()}
// 数据新鲜度：根据 lastFetchAt 计算多久前解析，>6h 视为过期
function freshness(){
  if(!lastFetchAt)return{text:t('fresh_none'),stale:true};
  var mins=Math.floor((Date.now()-lastFetchAt)/60000);
  var d=new Date(lastFetchAt);
  var hh=('0'+d.getHours()).slice(-2),mm=('0'+d.getMinutes()).slice(-2);
  var when=hh+':'+mm;
  if(mins<1)return{text:t('fresh_just'),stale:false};
  if(mins<60)return{text:t('fresh_mins',when,mins),stale:false};
  var hrs=Math.floor(mins/60);
  if(hrs<24)return{text:t('fresh_hours',when,hrs),stale:true};
  var dys=Math.floor(hrs/24);
  return{text:t('fresh_days',when,dys),stale:true};
}

// 选用某个 DoH 源 = 设为当前 + 自动用其解析域名
async function dohPick(k){
  if(!k)return;
  var wasSame=dohValue===k;
  dohValue=k;dLabel.textContent=dohName(k);
  if(!wasSame)toast(t('toast_picked',dohName(k)),'good');
  await fetchDomains();
  renderUnified();
}

// 根据当前 dohLats 重新渲染 DoH 状态文字（语言切换 / 测速完成后共用）
function renderDohStatus(){
  var ds=$('doh-status');if(!ds)return;
  if(!dohLats||Object.keys(dohLats).length===0){ds.textContent=t('doh_status_init');return;}
  var usN=us(),best=dohBest(),avg=dohAvg(),total=A.length;
  if(usN===0)ds.textContent=t('doh_all_fail');
  else if(usN<total)ds.textContent=t('doh_partial',usN,total,dohName(best),dohLats[best],avg);
  else ds.textContent=t('doh_all_ok',usN,total,dohName(best),dohLats[best],avg);
}

// 测 DoH 源延迟 + 自动选用最快 + 解析域名
async function dohTest(){
  if(cmpTesting)return;cmpTesting=true;
  var btn=$('cmp-test');btn.disabled=true;btn.textContent='…';
  var ds=$('doh-status');ds.textContent=t('doh_testing');
  dohLats={};renderUnified();$('cmp-summary').style.display='none';if($('cmp-empty'))$('cmp-empty').style.display='none';
  setProgress(0,t('prog_ready'));
  // 硬超时兜底：万一 DoH 源全卡住，30s 后强制结束（不会让按钮永远停在 "…"）
  var hardTimer=setTimeout(function(){
    if(!cmpTesting)return;
    ds.textContent=t('doh_timeout');
    setProgress(null);
    cmpTesting=false;btn.disabled=false;btn.textContent=t('btn_test');
    toast(t('toast_timeout'),'bad');
  },30000);
  try{
    var total=A.length,done=0;
    setProgress(2,t('prog_doh_n',0,total));
    await Promise.all(A.map(async function(k){
      var s=performance.now();
      try{await rwp('github.com',k);dohLats[k]=Math.round(performance.now()-s);}
      catch(e){dohLats[k]=null;}
      done++;ds.textContent=t('doh_testing_n',done,total);
      setProgress(Math.max(2,Math.round(done/total*35)),t('prog_doh_n',done,total));renderUnified();
    }));
  renderDohStatus();
  var best=dohBest(),usN=us(),avg=dohAvg();
  if(usN===0){
    toast(t('toast_all_fail'),'bad');
  }else{
    toast(t('toast_fastest',dohName(best),dohLats[best]),'good');
  }
  var sum=$('cmp-summary');
  if(sum&&usN>0){
    var fail=A.filter(function(k){return(k in dohLats)&&dohLats[k]===null}).length;
    var slow=A.filter(function(k){var v=dohLats[k];return(v!==null&&v!==undefined)&&v>=1000}).length;
    var row='<div class="cmp-sum-item"><span class="cmp-sum-label">'+t('sum_usable')+'</span><span class="cmp-sum-val">'+usN+' / '+A.length+'</span></div>'+
      '<div class="cmp-sum-item"><span class="cmp-sum-label">'+t('sum_timeout')+'</span><span class="cmp-sum-val">'+(fail||'0')+'</span></div>'+
      '<div class="cmp-sum-item"><span class="cmp-sum-label">'+t('sum_slow')+'</span><span class="cmp-sum-val">'+slow+'</span></div>'+
      '<div class="cmp-sum-item"><span class="cmp-sum-label">'+t('sum_avg')+'</span><span class="cmp-sum-val">'+avg+' ms</span></div>'+
      '<div class="cmp-sum-item cmp-sum-recommend"><span class="cmp-sum-label">'+t('sum_recommend')+'</span><span class="cmp-sum-val"><span style="color:var(--green)">'+dohName(best)+'</span> '+dohLats[best]+'ms</span></div>';
    sum.innerHTML=row;sum.style.display='flex';
  }
  // 自动切到最快源并解析域名（用户核心诉求："只用 DoH"）
  if(best){
    dohValue=best;dLabel.textContent=dohName(best);
    renderUnified();
    setProgress(35,t('prog_parse'));
    await fetchDomains(function(p){setProgress(35+Math.round(p*0.6),t('prog_parse'))});
    setProgress(100,t('prog_done'));
  }else{
    setProgress(null);
  }
  }finally{
    clearTimeout(hardTimer);
    cmpTesting=false;btn.disabled=false;btn.textContent=t('btn_test');
    setTimeout(function(){setProgress(null)},800);
  }
}

// 渲染统一表：DoH 源 + GitHub 域名合并为一张表
function renderUnified(){
  var table=$('cmp-table'),empty=$('cmp-empty');if(!table)return;
  if(A.length===0&&DOMAINS.length===0){table.innerHTML='';if(empty)empty.style.display='block';return}
  if(empty)empty.style.display='none';

  var head='<thead><tr>'+
    '<th style="width:3.5rem">类型</th>'+
    '<th>名称</th>'+
    '<th style="width:11rem">IP 地址</th>'+
    '<th style="width:4.5rem">延迟</th>'+
    '</tr></thead>';

  var best=dohBest(),worst=dohWorst();

  // 域名行的最快/最慢（用于高亮）
  var domLats=DOMAINS.map(d=>S[d].latency).filter(v=>v!==null&&v!==undefined);
  var dMin=domLats.length?Math.min.apply(null,domLats):null;
  var dMax=domLats.length?Math.max.apply(null,domLats):null;

  // —— 段 1：DoH 源 ——
  var dohRows=A.map(function(k){
    var measured=(k in dohLats),l=dohLats[k];
    var c,win,warn,label;
    if(!measured){c='fail';win='';warn='';label=t('lat_untested');}
    else if(l===null){c='fail';win='';warn=' lt-timeout';label=t('lat_timeout');}
    else{
      c=cls(l);
      win=(k===best&&best&&l!==null)?' lt-best':'';
      warn=(k===worst&&worst&&k!==best&&us()>=2&&l>=1000)?' lt-worst':'';
      label=l+'ms';
    }
    var cur=(k===dohValue)?' <span class="lt-cur">'+t('cur')+'</span>':'';
    return '<tr class="row-doh">'+
      '<td><span class="type-badge type-doh">'+t('badge_src')+'</span></td>'+
      '<td class="domain-name">'+dohName(k)+cur+'</td>'+
      '<td class="ip-cell"><span class="ip-empty">—</span></td>'+
      '<td><span class="latency '+c+win+warn+'">'+label+'</span></td>'+
      '</tr>';
  }).join('');

  // —— 段 2：分隔行（含域名解析进度） ——
  var okN=DOMAINS.filter(domStatusOk).length;
  var pendN=DOMAINS.filter(d=>S[d].status==='loading').length;
  var progTxt=pendN>0?t('parse_progress',pendN,DOMAINS.length):t('parse_ok',okN,DOMAINS.length);
  var fr=freshness();
  // 「全选」checkbox：只对解析成功的项生效；checked 状态以"可用项是否全勾"为准
  var usableDoms=DOMAINS.filter(domStatusOk);
  var allUsableOn=usableDoms.length>0&&usableDoms.every(d=>S[d].included);
  var selectAllHtml=usableDoms.length>0
    ?'<label class="divider-sel"><input type="checkbox" id="select-all" '+(allUsableOn?'checked':'')+'> '+t('sel_all')+'</label>'
    :'';
  var divider='<tr class="row-divider"><td colspan="4">'+
    '<span class="divider-title">'+t('divider_domains')+'</span>'+
    '<span class="divider-meta'+(fr.stale?' stale':'')+'">'+progTxt+' · '+fr.text+'</span>'+
    selectAllHtml+
    '</td></tr>';

  // —— 段 3：域名行 ——
  var domRows=DOMAINS.map(function(d){
    var s=S[d];
    var ipHtml=ipCellHtml(d);
    var checked=s.included?'checked':'';
    var dwin=(s.latency!==null&&s.latency===dMin)?' lt-best':'';
    var dwarn=(s.latency!==null&&s.latency===dMax&&dMax>=1000&&dMax!==dMin)?' lt-worst':'';
    return '<tr class="row-dom">'+
      '<td><span class="type-badge type-dom">'+t('badge_dom')+'</span></td>'+
      '<td class="domain-name"><label class="dom-label">'+
        '<input type="checkbox" class="inc-cb" data-domain="'+d+'" '+checked+'> '+
        '<span class="dom-name-text">'+d+'</span>'+
        ' <span class="status-dot '+s.status+'"></span>'+
      '</label></td>'+
      '<td class="ip-cell">'+ipHtml+'</td>'+
      '<td><span class="latency '+cls(s.latency)+dwin+dwarn+'">'+txt(s.latency)+'</span></td>'+
      '</tr>';
  }).join('');

  table.innerHTML=head+
    '<tbody class="section-doh">'+dohRows+'</tbody>'+
    '<tbody class="section-divider">'+divider+'</tbody>'+
    '<tbody class="section-dom">'+domRows+'</tbody>';

  // —— 事件绑定 ——
  table.querySelectorAll('.inc-cb').forEach(function(cb){cb.addEventListener('change',e=>{S[e.target.dataset.domain].included=e.target.checked;update()})});
  table.querySelectorAll('.ip-select').forEach(function(sel){sel.addEventListener('change',e=>{S[e.target.dataset.domain].selectedIp=e.target.value;update()})});
  table.querySelectorAll('.ip-input').forEach(function(inp){inp.addEventListener('input',e=>{S[e.target.dataset.domain].selectedIp=e.target.value.trim();update()})});
  var selAll=$('select-all');
  if(selAll)selAll.addEventListener('change',e=>{
    var ck=e.target.checked;
    // 「全选」只作用于解析成功的项——避免一键把失败项也勾上
    DOMAINS.forEach(d=>{if(domStatusOk(d))S[d].included=ck});
    table.querySelectorAll('.inc-cb').forEach(cb=>{
      if(domStatusOk(cb.dataset.domain))cb.checked=ck;
    });
    update()
  });
}

async function retestLatency(){
  if(cmpTesting)return;
  if(!DOMAINS.some(d=>S[d].ips.length>0)){toast(t('toast_need_test'),'bad');return;}
  var btn=$('retest-lat');if(btn)btn.disabled=true;
  setProgress(0,t('prog_retest'));
  await measureDomainLatency(function(p){setProgress(Math.round(p*100),t('prog_retest'))});
  if(btn)btn.disabled=false;
  setProgress(100,t('prog_done'));setTimeout(function(){setProgress(null)},800);
  toast(t('toast_retested'),'good');
}
$('cmp-test').addEventListener('click',dohTest);
$('retest-lat').addEventListener('click',retestLatency);
renderUnified();

function gen(restore) {
  var ts = new Date().toISOString().slice(0,19).replace('T',' ');
  var entries = [];
  if (!restore) {
    DOMAINS.forEach(function (d) {
      var s = S[d];
      if (s.included && s.selectedIp && /^(\d{1,3}\.){3}\d{1,3}$/.test(s.selectedIp)) entries.push(s.selectedIp + ' ' + d);
    });
  }
  var ps;
  if (restore) {
    ps = [
      '# GitHub Hosts Restore',
      "$ErrorActionPreference = 'Stop'",
      '$hostsPath = "$env:WINDIR\\System32\\drivers\\etc\\hosts"',
      'try {',
      '  $content = Get-Content $hostsPath -Raw -ErrorAction SilentlyContinue',
      '  if ($content) { $content = $content -replace \'(?s)\\r?\\n?# GitHub Hosts Start.*?# GitHub Hosts End\\r?\\n?\', "`n" } else { $content = "" }',
      '  Set-Content -Path $hostsPath -Value ($content.TrimEnd() + "`n") -Encoding UTF8 -NoNewline',
      '  ipconfig /flushdns | Out-Null',
      '  Write-Host "Removed GitHub Hosts entries and flushed DNS." -ForegroundColor Green',
      '} catch {',
      '  Write-Host $_.Exception.Message -ForegroundColor Red',
      '}',
      'Write-Host "All done." -ForegroundColor Cyan'
    ].join('\n');
  } else {
    ps = [
      '# GitHub Hosts Apply',
      "$ErrorActionPreference = 'Stop'",
      '$hostsPath = "$env:WINDIR\\System32\\drivers\\etc\\hosts"',
      'try {',
      '  $stamp = Get-Date -Format \'yyyyMMdd-HHmmss\'',
      '  $backupPath = "$env:WINDIR\\System32\\drivers\\etc\\hosts.backup.$stamp"',
      '  Copy-Item $hostsPath $backupPath -Force',
      '  Write-Host "Backup -> $backupPath" -ForegroundColor Green',
      '  $content = Get-Content $hostsPath -Raw -ErrorAction SilentlyContinue',
      '  if ($content) { $content = $content -replace \'(?s)\\r?\\n?# GitHub Hosts Start.*?# GitHub Hosts End\\r?\\n?\', "`n" } else { $content = "" }',
      '  $newEntries = @"',
      '',
      '# GitHub Hosts Start (' + ts + ')',
      entries.join('\n'),
      '# GitHub Hosts End',
      '"@',
      '  $content = $content.TrimEnd() + "`n" + $newEntries + "`n"',
      '  Set-Content -Path $hostsPath -Value $content -Encoding UTF8 -NoNewline',
      '  Write-Host "Wrote GitHub Hosts entries." -ForegroundColor Green',
      '  ipconfig /flushdns | Out-Null',
      '  Write-Host "DNS cache flushed." -ForegroundColor Green',
      '  Write-Host "All done." -ForegroundColor Cyan',
      '} catch {',
      '  Write-Host $_.Exception.Message -ForegroundColor Red',
      '}'
    ].join('\n');
  }
  var b64 = utf16leB64(ps);
  var title = restore ? 'GitHub Hosts Restore' : 'GitHub Hosts Apply';
  var bat = [
    '@echo off',
    'title ' + title,
    'net session >nul 2>&1',
    'if %errorlevel% equ 0 goto admin',
    'echo Please approve the UAC prompt.',
    'echo An administrator window will then open with the result.',
    'powershell -NoProfile -Command "Start-Process -FilePath \'%~f0\' -Verb RunAs"',
    'ping -n 7 127.0.0.1 >nul',
    'exit /b',
    ':admin',
    'powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ' + b64,
    'echo.',
    'pause'
  ].join('\r\n');
  return bat;
}
function utf16leB64(str) {
  var T = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var b = [], r = '';
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    b.push(c & 255, (c >> 8) & 255);
  }
  for (var j = 0; j < b.length; j += 3) {
    var b1 = b[j], b2 = b[j + 1], b3 = b[j + 2];
    r += T[b1 >> 2] + T[((b1 & 3) << 4) | (b2 >> 4)];
    r += (j + 1 < b.length) ? T[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    r += (j + 2 < b.length) ? T[b3 & 63] : '=';
  }
  return r;
}
async function copy(text){try{await navigator.clipboard.writeText(text);return true}catch(e){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');document.body.removeChild(ta);return true}catch(e2){document.body.removeChild(ta);return false}}}
function dl(fn,content){const blob=new Blob([content],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fn;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url)}
$('copy-hosts').addEventListener('click',async()=>{const ok=await copy(H.value);toast(ok?t('toast_copied'):t('toast_copy_fail'),ok?'good':'bad')});
$('download-hosts').addEventListener('click',()=>{dl('hosts.txt',H.value);toast(t('toast_hosts_dl'),'good')});
$('gen-ps1').addEventListener('click',()=>{$('modal-title').textContent=t('modal_apply');$('ps1-content').value=gen(false);$('ps1-modal').classList.add('on');$('download-ps1').dataset.mode='apply'});
$('gen-restore').addEventListener('click',()=>{$('modal-title').textContent=t('modal_restore');$('ps1-content').value=gen(true);$('ps1-modal').classList.add('on');$('download-ps1').dataset.mode='restore'});
$('copy-ps1').addEventListener('click',async()=>{const ok=await copy($('ps1-content').value);toast(ok?t('toast_copied'):t('toast_copy_fail'),ok?'good':'bad')});
$('download-ps1').addEventListener('click',()=>{const m=$('download-ps1').dataset.mode;const n=m==='restore'?'github-hosts-restore.bat':'github-hosts-apply.bat';dl(n,$('ps1-content').value);toast(t('toast_bat_dl',n),'good')});
$('close-modal').addEventListener('click',()=>{$('ps1-modal').classList.remove('on')});
$('ps1-modal').addEventListener('click',e=>{if(e.target===$('ps1-modal'))$('ps1-modal').classList.remove('on')});
update();
// 语言切换：保存偏好，重渲染所有文本与动态内容
var langBtn=$('lang-toggle');
if(langBtn)langBtn.addEventListener('click',function(){
  lang=lang==='zh'?'en':'zh';
  try{localStorage.setItem('gh_lang',lang);}catch(e){}
  applyI18n();renderUnified();update();renderDohStatus();loadStats();
});
applyI18n();
// 按钮水波纹动效
document.querySelectorAll('.btn').forEach(function(b){
  b.addEventListener('click',function(e){
    if(b.disabled)return;
    var rect=b.getBoundingClientRect();
    var size=Math.max(rect.width,rect.height);
    var r=document.createElement('span');r.className='ripple';
    r.style.width=r.style.height=size+'px';
    r.style.left=(e.clientX-rect.left-size/2)+'px';
    r.style.top=(e.clientY-rect.top-size/2)+'px';
    b.appendChild(r);setTimeout(function(){r.remove()},600)
  })
});
document.querySelectorAll('.howto-tab').forEach(tab=>{tab.addEventListener('click',()=>{const scope=tab.closest('.howto');scope.querySelectorAll('.howto-tab').forEach(t=>t.classList.remove('on'));scope.querySelectorAll('.howto-panel').forEach(c=>c.classList.remove('on'));tab.classList.add('on');document.getElementById('tab-'+tab.dataset.tab).classList.add('on')})});

// ===== 访问统计 =====
var STATS_API='https://stats.sophieyoucha.cc.cd';
var K='gh_hosts_stats',tdate=new Date().toISOString().slice(0,10);
(function(){
  try{var d=JSON.parse(localStorage.getItem(K)||'{}');d[tdate]=(d[tdate]||0)+1;localStorage.setItem(K,JSON.stringify(d))}catch(e){}
})();
function fmtDate(iso){
  var p=iso.split('-');var dt=new Date(+p[0],+p[1]-1,+p[2]);
  if(lang==='en'){
    var mn=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.getMonth()];
    var wd=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()];
    return wd+', '+mn+' '+dt.getDate()+' '+dt.getFullYear();
  }
  var w=['日','一','二','三','四','五','六'][dt.getDay()];
  return dt.getFullYear()+'年'+(dt.getMonth()+1)+'月'+dt.getDate()+'日 周'+w;
}
function drawTrend(vals){
  var mx=Math.max(1,Math.max.apply(null,vals)),W=240,H=96,pts=[],dates=[];
  for(var i=29;i>=0;i--){var dd=new Date();dd.setDate(dd.getDate()-i);dates.push(dd.toISOString().slice(0,10))}
  for(var i=0;i<vals.length;i++){
    var x=(i/(vals.length-1))*W;
    var y=H-2-Math.max((vals[i]/mx)*(H-8),0);
    pts.push(x+','+y)
  }
  var area='0,'+H+' '+pts.join(' ')+' '+W+','+H;
  var svg='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg">'+
    '<defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">'+
    '<stop offset="0%" stop-color="#80a0ff" stop-opacity="0.4"/>'+
    '<stop offset="100%" stop-color="#80a0ff" stop-opacity="0"/>'+
    '</linearGradient></defs>'+
    '<polygon class="trend-area" points="'+area+'" fill="url(#sg)"/>'+
    '<polyline class="trend-line" points="'+pts.join(' ')+'" fill="none" stroke="#80a0ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'+
    pts.map(function(p,i){if(i%7!==0&&i!==vals.length-1)return'';var xy=p.split(',');var dl=(0.95+(i/29)*0.5).toFixed(2);return'<circle class="trend-dot" style="animation-delay:'+dl+'s" cx="'+xy[0]+'" cy="'+xy[1]+'" r="2.5" fill="#80a0ff"/>'}).join('')+
    '<line id="tk-guide" x1="0" y1="0" x2="0" y2="'+H+'" stroke="rgba(255,255,255,.35)" stroke-width="1" style="opacity:0"/>'+
    '<circle id="tk-dot" r="3.5" fill="#fff" stroke="#80a0ff" stroke-width="2" style="opacity:0"/>'+
    '<line id="tk-sel-line" x1="0" y1="0" x2="0" y2="'+H+'" stroke="rgba(128,160,255,.55)" stroke-width="1" stroke-dasharray="3 3" style="opacity:0"/>'+
    '<circle id="tk-sel" r="4.5" fill="#80a0ff" stroke="#fff" stroke-width="1.5" style="opacity:0"/>'+
    vals.map(function(v,i){var x=(i/(vals.length-1))*W,hw=(W/(vals.length-1))/2;return'<rect class="tk-hit" x="'+(x-hw)+'" y="0" width="'+(hw*2)+'" height="'+H+'" fill="transparent" data-i="'+i+'"/>'}).join('')+
    '</svg>';
  var c=document.getElementById('sv-chart');if(c)c.innerHTML=svg;
  var poly=c&&c.querySelector('polyline.trend-line');
  if(poly){try{var L=poly.getTotalLength();poly.style.strokeDasharray=L;poly.style.strokeDashoffset=L;poly.getBoundingClientRect();poly.style.transition='stroke-dashoffset 1.1s var(--ease)';requestAnimationFrame(function(){poly.style.strokeDashoffset='0'})}catch(e){}}
  TK_DATES=dates;TK_VALS=vals;TK_MX=mx;
  var guide=document.getElementById('tk-guide'),dot=document.getElementById('tk-dot'),sel=document.getElementById('tk-sel'),selLine=document.getElementById('tk-sel-line');
  Array.prototype.forEach.call(document.querySelectorAll('#sv-chart .tk-hit'),function(r){
    var i=+r.dataset.i;
    r.addEventListener('mouseenter',function(e){tkShow(i,e,guide,dot)});
    r.addEventListener('mousemove',function(e){tkShow(i,e,guide,dot)});
    r.addEventListener('mouseleave',function(){tkHide(guide,dot)});
    r.addEventListener('click',function(){selectDate(i,sel,selLine)})
  });
  var pick=document.getElementById('date-pick');
  if(pick){
    pick.min=dates[0];pick.max=dates[dates.length-1];
    if(TK_SEL<0)TK_SEL=dates.length-1;
    pick.value=dates[TK_SEL];
    pick.onchange=function(){var idx=dates.indexOf(pick.value);if(idx<0)idx=dates.length-1;selectDate(idx,sel,selLine)}
  }else if(TK_SEL<0)TK_SEL=dates.length-1;
  selectDate(TK_SEL,sel,selLine)
}
var TK_DATES=[],TK_VALS=[],TK_MX=1,TK_SEL=-1;
function tkShow(i,ev,guide,dot){
  var x=(i/29)*240,y=96-2-Math.max((TK_VALS[i]/TK_MX)*(96-8),0);
  if(guide){guide.setAttribute('x1',x);guide.setAttribute('x2',x);guide.style.opacity=1}
  if(dot){dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.style.opacity=1}
  var card=document.querySelector('.stats-chart-card'),tip=document.getElementById('tk-tip');
  if(!card||!tip)return;
  tip.querySelector('.tk-date').textContent=fmtDate(TK_DATES[i]);
  tip.querySelector('.tk-val').textContent=t('tk_visits',fmtNum(TK_VALS[i]||0));
  var cr=card.getBoundingClientRect();
  var px=ev.clientX-cr.left,py=ev.clientY-cr.top;
  px=Math.min(Math.max(px,44),cr.width-44);
  tip.style.left=px+'px';tip.style.top=(py-46)+'px';
  tip.classList.add('on')
}
function tkHide(guide,dot){
  if(guide)guide.style.opacity=0
  if(dot)dot.style.opacity=0;
  var tip=document.getElementById('tk-tip');if(tip)tip.classList.remove('on')
}
function selectDate(i,sel,selLine){
  TK_SEL=i;
  var iso=TK_DATES[i];
  var x=(i/29)*240,y=96-2-Math.max((TK_VALS[i]/TK_MX)*(96-8),0);
  if(sel){sel.setAttribute('cx',x);sel.setAttribute('cy',y);sel.style.opacity=1}
  if(selLine){selLine.setAttribute('x1',x);selLine.setAttribute('x2',x);selLine.style.opacity=1}
  var pick=document.getElementById('date-pick');if(pick&&pick.value!==iso)pick.value=iso;
  var ss=document.getElementById('sel-stat');
  if(ss)ss.innerHTML='<span class="sel-date">'+fmtDate(iso)+'</span><span class="sel-val">'+t('tk_visits',fmtNum(TK_VALS[i]||0))+'</span>'
}
function localVals(){
  var d=JSON.parse(localStorage.getItem(K)||'{}'),vals=[];
  for(var i=29;i>=0;i--){var dd=new Date();dd.setDate(dd.getDate()-i);vals.push(d[dd.toISOString().slice(0,10)]||0)}
  return vals
}
function localData(){
  var d=JSON.parse(localStorage.getItem(K)||'{}');
  var vals=localVals();
  return {
    pv:vals.reduce(function(a,b){return a+(b||0)},0),
    uv:vals.filter(function(v){return v>0}).length,
    today:d[t]||0,
    trend:vals
  }
}
function renderStats(data,live){
  data=data||localData();
  drawTrend(data.trend);
  var rdEl=document.getElementById('report-date');if(rdEl)rdEl.textContent=fmtDate(t);
  countUp(document.getElementById('report-today'),data.today);
  countUp(document.getElementById('report-pv'),data.pv);
  countUp(document.getElementById('report-uv'),data.uv);
  var tt=document.querySelector('.stats-chart-card .stats-card-title');
  if(tt)tt.textContent=t('stats_trend_title')+(live?' · '+t('stats_live'):'');
}
async function loadStats(){
  if(!STATS_API){renderStats(localData(),false);return}
  try{
    var ctrl=new AbortController();var id=setTimeout(function(){ctrl.abort()},4000);
    var r=await fetch(STATS_API,{method:'GET',credentials:'include',headers:{'Accept':'application/json'},signal:ctrl.signal});
    clearTimeout(id);
    if(!r.ok)throw new Error('bad status '+r.status);
    var j=await r.json();
    if(typeof j.pv!=='number'||!Array.isArray(j.trend))throw new Error('bad payload');
    renderStats({pv:j.pv,uv:j.uv||0,today:j.today||0,trend:j.trend},true);
  }catch(e){
    renderStats(localData());
  }
}
loadStats();
function fmtNum(n){
  if(n==null||n==='-')return'-';
  var s=String(n).trim();
  if(/[万亿]/.test(s))return s;
  n=parseInt(s);if(isNaN(n))return s;
  if(lang==='en')return n.toLocaleString('en-US');
  if(n>=1e8)return (n/1e8).toFixed(1)+'亿';
  if(n>=1e4)return (n/1e4).toFixed(1)+'万';
  return String(n)
}
function countUp(el,target){
  if(!el)return;
  target=target||0;var dur=900,start=performance.now();
  function tick(now){
    var p=Math.min(1,(now-start)/dur);
    var e=1-Math.pow(1-p,3);
    el.textContent=fmtNum(Math.round(target*e));
    if(p<1)requestAnimationFrame(tick);else el.textContent=fmtNum(target);
  }
  requestAnimationFrame(tick);
}