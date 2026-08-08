const DOMAINS=['github.com','api.github.com','raw.githubusercontent.com','objects.githubusercontent.com','codeload.github.com','github.global.ssl.fastly.net','assets-cdn.github.com','github.githubassets.com','gist.github.com','live.github.com','favicons.githubusercontent.com','collector.github.com'];
const P={dnspod:{url:d=>`https://doh.pub/dns-query?name=${d}&type=A`,headers:{'Accept':'application/dns-json'}},alidns:{url:d=>`https://dns.alidns.com/resolve?name=${d}&type=A`,headers:{}},cloudflare:{url:d=>`https://cloudflare-dns.com/dns-query?name=${d}&type=A`,headers:{'Accept':'application/dns-json'}},google:{url:d=>`https://dns.google/resolve?name=${d}&type=A`,headers:{}},quad9:{url:d=>`https://dns.quad9.net/dns-query?name=${d}&type=A`,headers:{'Accept':'application/dns-json'}},adguard:{url:d=>`https://dns.adguard-dns.com/dns-query?name=${d}&type=A`,headers:{'Accept':'application/dns-json'}},360:{url:d=>`https://doh.360.cn/resolve?name=${d}&type=A`,headers:{}}};
const A=['dnspod','alidns','cloudflare','google','quad9','adguard','360'];
const S={};DOMAINS.forEach(d=>{S[d]={domain:d,ips:[],selectedIp:'',status:'pending',latency:null,included:true}});
const $=id=>document.getElementById(id),B=$('results-body'),H=$('hosts-content'),T=$('toast');
let dohValue='auto';
// Portal dropdown
const dTrigger=$('doh-trigger'),dLabel=$('doh-label'),dWrap=$('doh-trigger-wrap');
const OPTIONS=[{v:'auto',t:'自动 DoH'},{v:'dnspod',t:'DNSPod (腾讯)'},{v:'alidns',t:'AliDNS (阿里)'},{v:'cloudflare',t:'Cloudflare'},{v:'google',t:'Google'},{v:'quad9',t:'Quad9 (隐私)'},{v:'adguard',t:'AdGuard (去广告)'},{v:'360',t:'360 DoH'}];
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
    el.textContent=o.t;el.addEventListener('click',function(e){e.stopPropagation();dohValue=o.v;dLabel.textContent=o.t;closeDoh()});
    dMenu.appendChild(el)
  });
  document.body.appendChild(dMenu)
}
dTrigger.addEventListener('click',function(e){e.stopPropagation();openDoh()});
document.addEventListener('click',function(e){if(dMenu&&!dMenu.contains(e.target)&&e.target!==dTrigger)closeDoh()});
window.addEventListener('resize',closeDoh);window.addEventListener('scroll',closeDoh,true);
function toast(m,g){T.textContent=m;T.className='toast on '+(g||'');setTimeout(()=>T.className='toast',2500)}
async function rwp(d,k,t=2500){const p=P[k],c=new AbortController();const id=setTimeout(()=>c.abort(),t);try{const r=await fetch(p.url(d),{headers:p.headers,signal:c.signal});clearTimeout(id);const d2=await r.json();return d2.Answer?d2.Answer.filter(a=>a.type===1).map(a=>a.data):[]}catch(e){clearTimeout(id);throw e}}
async function rd(d,pref){const ps=pref==='auto'?A:[pref];for(const p of ps){try{const ips=await rwp(d,p);if(ips.length>0)return{ips}}catch(e){}}return{ips:[]}}
function tl(d,t=5000){return new Promise(r=>{const img=new Image(),s=performance.now();let done=false;const id=setTimeout(()=>{if(!done){done=true;r(null)}},t);img.onload=img.onerror=()=>{if(!done){done=true;clearTimeout(id);r(Math.round(performance.now()-s))}};img.src=`https://${d}/favicon.ico?_t=${Date.now()}`})}
function render(){B.innerHTML='';DOMAINS.forEach(d=>{const s=S[d];const tr=document.createElement('tr');tr.innerHTML=`<td><input type="checkbox" class="inc-cb" data-domain="${d}" ${s.included?'checked':''}></td><td class="domain-name">${d}</td><td><span class="status-dot ${s.status}"></span></td><td class="ip-cell" id="ip-cell-${d}">${rip(d)}</td><td><span class="latency ${cls(s.latency)}" id="lat-${d}">${txt(s.latency)}</span></td>`;B.appendChild(tr)});document.querySelectorAll('.inc-cb').forEach(cb=>{cb.addEventListener('change',e=>{S[e.target.dataset.domain].included=e.target.checked;update()})});document.querySelectorAll('.ip-select').forEach(sel=>{sel.addEventListener('change',e=>{S[e.target.dataset.domain].selectedIp=e.target.value;update()})});document.querySelectorAll('.ip-input').forEach(inp=>{inp.addEventListener('input',e=>{S[e.target.dataset.domain].selectedIp=e.target.value.trim();update()})})}
function rip(d){const s=S[d];if(s.status==='loading')return'<span style="color:var(--muted)">查询中...</span>';if(s.status==='success'&&s.ips.length>0){if(s.ips.length===1)return`<input type="text" class="ip-input" data-domain="${d}" value="${s.selectedIp}">`;return`<select class="ip-select" data-domain="${d}">${s.ips.map(ip=>`<option value="${ip}" ${ip===s.selectedIp?'selected':''}>${ip}</option>`).join('')}</select>`}if(s.status==='fail')return`<input type="text" class="ip-input" data-domain="${d}" placeholder="手动输入IP" value="${s.selectedIp}">`;return'<span style="color:var(--muted)">—</span>'}
function cls(l){if(l===null)return'fail';if(l<200)return'good';if(l<800)return'ok';return'slow'}function txt(l){return l===null?'—':l+'ms'}
function upRow(d){const s=S[d];const dot=B.querySelector(`tr:nth-child(${DOMAINS.indexOf(d)+1}) td:nth-child(3) .status-dot`);const ip=$(`ip-cell-${d}`);if(dot)dot.className='status-dot '+s.status;if(ip)ip.innerHTML=rip(d);const sel=ip?.querySelector('.ip-select'),inp=ip?.querySelector('.ip-input');if(sel)sel.addEventListener('change',e=>{S[d].selectedIp=e.target.value;update()});if(inp)inp.addEventListener('input',e=>{S[d].selectedIp=e.target.value.trim();update()})}
function update(){const e=[];DOMAINS.forEach(d=>{const s=S[d];if(s.included&&s.selectedIp&&/^(\d{1,3}\.){3}\d{1,3}$/.test(s.selectedIp))e.push(`${s.selectedIp.padEnd(22)} ${d}`)});H.value=`# GitHub Hosts Start (更新于 ${new Date().toLocaleString('zh-CN')})\n${e.join('\n')}\n# GitHub Hosts End`;$('hosts-count').textContent=e.length;H.style.height='auto';H.style.height=H.scrollHeight+'px'}
let autoPref=null;
// Probe all DoH sources in parallel, pick the first one that answers (caps wait at 3s)
async function pickAuto(){
  if(autoPref)return autoPref;
  const races=A.map(k=>rwp('github.com',k).then(()=>k).catch(()=>null));
  autoPref=await Promise.race([...races,new Promise(r=>setTimeout(()=>r(null),3000))]);
  if(!autoPref){for(const k of A){try{await rwp('github.com',k);autoPref=k;break}catch(e){}}}
  return autoPref;
}
async function fetchAll(){
  const btn=$('fetch-btn'),tbtn=$('test-btn');btn.disabled=true;tbtn.disabled=true;btn.textContent='…';$('progress').classList.add('on');$('progress-percent').classList.add('on');$('progress-percent').textContent='0%';$('ip-status').textContent='获取中…';
  DOMAINS.forEach(d=>{S[d].status='loading';upRow(d)});
  let done=0;const total=DOMAINS.length;
  const pref=dohValue==='auto'?await pickAuto():dohValue;
  const batch=4;                                  // limit concurrency so the UI thread stays responsive
  for(let i=0;i<DOMAINS.length;i+=batch){
    const chunk=DOMAINS.slice(i,i+batch);
    await Promise.all(chunk.map(async d=>{
      const r=await rd(d,pref||'auto');
      S[d].ips=r.ips;S[d].selectedIp=r.ips[0]||'';S[d].status=r.ips.length>0?'success':'fail';
      done++;const pct=Math.round(done/total*100);$('progress-fill').style.width=pct+'%';$('progress-percent').textContent=pct+'%';upRow(d);
    }));
  }
  update();
  const ok=DOMAINS.filter(d=>S[d].status==='success').length,fail=total-ok;
  $('ip-status').textContent=new Date().toLocaleTimeString('zh-CN')+` (${ok}/${total} 成功${fail?`, ${fail} 失败`:''})`;
  btn.disabled=false;tbtn.disabled=false;btn.textContent='🔍 获取 IP';$('progress').classList.remove('on');$('progress-percent').classList.remove('on');$('progress-fill').style.width='0%';
  if(ok===total)toast(`✅ ${total} 个域名全部成功`,'good');else if(ok>0)toast(`⚠️ ${ok}/${total} 成功`,'');else toast('❌ 不可用','bad')
}
async function testAll(){const btn=$('test-btn'),fbtn=$('fetch-btn');btn.disabled=true;fbtn.disabled=true;btn.textContent='…';$('progress').classList.add('on');$('progress-percent').classList.add('on');$('progress-percent').textContent='0%';$('ip-status').textContent='测延迟中…';DOMAINS.forEach(d=>{S[d].latency=null;const el=$(`lat-${d}`);if(el){el.className='latency fail';el.textContent='...'}});let done=0;const total=DOMAINS.length;const batch=4;let best=null,bestD=null,worst=null,worstD=null;for(let i=0;i<DOMAINS.length;i+=batch){const chunk=DOMAINS.slice(i,i+batch);await Promise.all(chunk.map(async d=>{const l=await tl(d);S[d].latency=l;let clsName='latency';if(l===null){clsName+=' lt-timeout'}else{if(best===null||l<best){best=l;bestD=d}if(worst===null||l>worst){worst=l;worstD=d}clsName+=' '+cls(l)}const el=$(`lat-${d}`);if(el){el.className=clsName;el.textContent=l===null?'超时':l+'ms'};done++;const pct=Math.round(done/total*100);$('progress-fill').style.width=pct+'%';$('progress-percent').textContent=pct+'%'}))}const usable=DOMAINS.filter(d=>S[d].latency!==null);if(usable.length>=2){if(bestD){const e=$(`lat-${bestD}`);if(e)e.className='latency '+cls(S[bestD].latency)+' lt-best'}if(worstD&&worstD!==bestD){const e=$(`lat-${worstD}`);if(e)e.className='latency '+cls(S[worstD].latency)+' lt-worst'}};$('progress').classList.remove('on');$('progress-percent').classList.remove('on');$('progress-fill').style.width='0%';btn.disabled=false;fbtn.disabled=false;btn.textContent='⚡ 测 IP 延迟';const avg=usable.map(d=>S[d].latency);if(avg.length>0){$('ip-status').textContent='平均 '+Math.round(avg.reduce((a,b)=>a+b,0)/avg.length)+'ms ('+avg.length+'/'+total+' 测到)';toast(`⚡ 平均: ${Math.round(avg.reduce((a,b)=>a+b,0)/avg.length)}ms`,'good')}else{$('ip-status').textContent='无法连接';toast('❌ 无法连接','bad')}}
function gen(restore) {
  var ts = new Date().toLocaleString('zh-CN');
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
      '  Set-Content -Path $hostsPath -Value $content.TrimEnd() + "`n" -Encoding UTF8 -NoNewline',
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
$('fetch-btn').addEventListener('click',fetchAll);$('test-btn').addEventListener('click',testAll);
$('select-all').addEventListener('change',e=>{DOMAINS.forEach(d=>{S[d].included=e.target.checked});document.querySelectorAll('.inc-cb').forEach(cb=>{cb.checked=e.target.checked});update()});
$('copy-hosts').addEventListener('click',async()=>{const ok=await copy(H.value);toast(ok?'✅ 已复制':'❌ 失败',ok?'good':'bad')});
$('download-hosts').addEventListener('click',()=>{dl('hosts.txt',H.value);toast('✅ hosts.txt 下载完成','good')});
$('gen-ps1').addEventListener('click',()=>{$('modal-title').textContent='Windows 加速脚本 (.bat)';$('ps1-content').value=gen(false);$('ps1-modal').classList.add('on');$('download-ps1').dataset.mode='apply'});
$('gen-restore').addEventListener('click',()=>{$('modal-title').textContent='恢复脚本 (.bat)';$('ps1-content').value=gen(true);$('ps1-modal').classList.add('on');$('download-ps1').dataset.mode='restore'});
$('copy-ps1').addEventListener('click',async()=>{const ok=await copy($('ps1-content').value);toast(ok?'✅ 已复制':'❌ 失败',ok?'good':'bad')});
$('download-ps1').addEventListener('click',()=>{const m=$('download-ps1').dataset.mode;const n=m==='restore'?'github-hosts-restore.bat':'github-hosts-apply.bat';dl(n,$('ps1-content').value);toast('✅ '+n,'good')});
$('close-modal').addEventListener('click',()=>{$('ps1-modal').classList.remove('on')});
$('ps1-modal').addEventListener('click',e=>{if(e.target===$('ps1-modal'))$('ps1-modal').classList.remove('on')});
render();
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

// ===== DoH 延迟对比 =====
// 测每个 DoH 解析源的延迟，挑最快的用于「🔍 获取 IP」。
// dohLats: { provider: ms|null }；dohValue 为当前选中源（与顶部下拉联动）。
// 测完自动 dohPick(best)，用户不用再点「✅ 选用最快」（保留按钮作手动覆盖）。
var dohLats={},cmpTesting=false;
function dohName(k){for(var i=0;i<OPTIONS.length;i++){if(OPTIONS[i].v===k)return OPTIONS[i].t}return k}
function dohBest(){var bk=null,bv=null;A.forEach(function(k){var v=dohLats[k];if(v!==null&&v!==undefined&&(bv===null||v<bv)){bv=v;bk=k}});return bk}
function dohWorst(){var wk=null,wv=null;A.forEach(function(k){var v=dohLats[k];if(v!==null&&v!==undefined&&(wv===null||v>wv)){wv=v;wk=k}});return wk}
function dohUsable(){return A.filter(function(k){return(k in dohLats)&&dohLats[k]!==null}).length}
function dohAvg(){var vs=A.map(function(k){return dohLats[k]}).filter(function(v){return v!==null&&v!==undefined});return vs.length?Math.round(vs.reduce(function(a,b){return a+b},0)/vs.length):null}
function dohPick(k){
  if(!k)return;
  var wasSame=dohValue===k;
  dohValue=k;dLabel.textContent=dohName(k);renderDoh();
  if(!wasSame)toast('已选用 DoH：'+dohName(k),'good');
}
async function dohTest(){
  if(cmpTesting)return;cmpTesting=true;
  var btn=$('cmp-test');btn.disabled=true;btn.textContent='…';var ds=$('doh-status');ds.textContent='DoH 状态：测速中…';
  dohLats={};renderDoh();$('cmp-summary').style.display='none';if($('cmp-empty'))$('cmp-empty').style.display='none';
  var total=A.length,done=0,batch=4;
  for(var i=0;i<A.length;i+=batch){
    var chunk=A.slice(i,i+batch);
    await Promise.all(chunk.map(async function(k){
      var s=performance.now();
      try{await rwp('github.com',k);dohLats[k]=Math.round(performance.now()-s);}
      catch(e){dohLats[k]=null;}
      done++;ds.textContent='DoH 状态：测速中 '+done+'/'+total;renderDoh();
    }));
  }
  cmpTesting=false;btn.disabled=false;btn.textContent='⚡ 测 DoH 延迟';
  var best=dohBest(),worst=dohWorst(),us=dohUsable(),avg=dohAvg();
  if(us===0){
    ds.textContent='DoH 状态：全 '+total+' 个源都连不上';
    toast('测速完成（都连不上）','bad');
  }else if(us<A.length){
    ds.textContent='DoH 状态：'+us+'/'+total+' 可用，最快 '+dohName(best)+' '+dohLats[best]+'ms（均 '+avg+'ms）';
    toast('最快 '+dohName(best)+' '+dohLats[best]+'ms','good');
  }else{
    ds.textContent='DoH 状态：'+us+'/'+total+' 全部可用，最快 '+dohName(best)+' '+dohLats[best]+'ms（均 '+avg+'ms）';
    toast('最快 '+dohName(best)+' '+dohLats[best]+'ms','good');
  }
  // 自动切到最快源——用户原本就要"用最快的"
  if(best&&dohValue!==best){
    dohValue=best;dLabel.textContent=dohName(best);
  }
  renderDoh();
  // 汇总
  var sum=$('cmp-summary');if(sum&&us>0){
    var sup=Math.max(...A.map(function(k){var v=dohLats[k];return(v===null||v===undefined)?0:v}));
    var fail=A.filter(function(k){return(k in dohLats)&&dohLats[k]===null}).length;
    var slow=A.filter(function(k){var v=dohLats[k];return(v!==null&&v!==undefined)&&v>=1000}).length;
    var row='<div class="cmp-sum-item"><span class="cmp-sum-label">可用源</span><span class="cmp-sum-val">'+us+' / '+A.length+'</span></div>'+
      '<div class="cmp-sum-item"><span class="cmp-sum-label">超时</span><span class="cmp-sum-val">'+(fail||'0')+'</span></div>'+
      '<div class="cmp-sum-item"><span class="cmp-sum-label">慢（≥1000ms）</span><span class="cmp-sum-val">'+slow+'</span></div>'+
      '<div class="cmp-sum-item"><span class="cmp-sum-label">平均延迟</span><span class="cmp-sum-val">'+avg+' ms</span></div>'+
      '<div class="cmp-sum-item cmp-sum-recommend"><span class="cmp-sum-label">推荐使用</span><span class="cmp-sum-val"><span style="color:var(--green)">'+dohName(best)+'</span> '+dohLats[best]+'ms</span></div>';
    sum.innerHTML=row;sum.style.display='flex';
  }
}
function renderDoh(){
  var table=$('cmp-table'),empty=$('cmp-empty');if(!table)return;
  if(A.length===0){table.innerHTML='';if(empty)empty.style.display='block';return}
  if(empty)empty.style.display='none';
  var best=dohBest(),worst=dohWorst();
  var head='<thead><tr><th>DoH 源</th><th>延迟</th><th>操作</th></tr></thead>';
  var body='<tbody>'+A.map(function(k){
    var measured=(k in dohLats),l=dohLats[k];
    var c,win,warn,label;
    if(!measured){c='fail';win='';warn='';label='未测';}
    else if(l===null){c='fail';win='';warn=' lt-timeout';label='超时';}
    else{
      c=cls(l);
      win=(k===best&&best&&l!==null)?' lt-best':'';
      warn=(k===worst&&worst&&k!==best&&us()>=2&&l>=1000)?' lt-worst':'';
      label=l+'ms';
    }
    var cur=(k===dohValue)?' <span class="lt-cur">✓ 当前</span>':'';
    return '<tr><td class="domain-name">'+dohName(k)+cur+'</td><td class="latency '+c+win+warn+'">'+label+'</td><td><button class="lt-pick" data-k="'+k+'">选用</button></td></tr>';
  }).join('')+'</tbody>';
  table.innerHTML=head+body;
  table.querySelectorAll('.lt-pick').forEach(function(b){b.addEventListener('click',function(){dohPick(b.dataset.k)})});
}
// 可用源数（供 renderDoh 闭包用，避免函数递归依赖）
function us(){return dohUsable()}
$('cmp-test').addEventListener('click',dohTest);
$('cmp-apply-all').addEventListener('click',function(){dohPick(dohBest())});
renderDoh();

// ===== 访问统计 =====
// 默认走本地 localStorage（离线/未配置后端时）；若配置 STATS_API（Cloudflare Workers+KV），
// 则改为全网真实共享统计：PV/UV/今日/30天趋势 全部由后端返回，且每次打开页面 +1 计入后端。
// 请改成你部署后的 Worker 地址，例如 'https://stats.yourdomain.com'
var STATS_API='https://stats.sophieyoucha.cc.cd';
var K='gh_hosts_stats',t=new Date().toISOString().slice(0,10);
// 本地记录：仅作为后端不可用时的降级数据源（每次打开页面给「今天」+1）
(function(){
  try{var d=JSON.parse(localStorage.getItem(K)||'{}');d[t]=(d[t]||0)+1;localStorage.setItem(K,JSON.stringify(d))}catch(e){}
})();
function fmtDate(iso){
  var p=iso.split('-');var dt=new Date(+p[0],+p[1]-1,+p[2]);
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
  tip.querySelector('.tk-val').textContent='访问 '+fmtNum(TK_VALS[i]||0)+' 次';
  var cr=card.getBoundingClientRect();
  var px=ev.clientX-cr.left,py=ev.clientY-cr.top;
  px=Math.min(Math.max(px,44),cr.width-44);
  tip.style.left=px+'px';tip.style.top=(py-46)+'px';
  tip.classList.add('on')
}
function tkHide(guide,dot){
  if(guide)guide.style.opacity=0;
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
  if(ss)ss.innerHTML='<span class="sel-date">'+fmtDate(iso)+'</span><span class="sel-val">访问 '+fmtNum(TK_VALS[i]||0)+' 次</span>'
}
function localVals(){
  var d=JSON.parse(localStorage.getItem(K)||'{}'),vals=[];
  for(var i=29;i>=0;i--){var dd=new Date();dd.setDate(dd.getDate()-i);vals.push(d[dd.toISOString().slice(0,10)]||0)}
  return vals
}
// 从本地数据派生一份统计对象（后端不可用时的降级数据）
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
// 渲染：data = { pv, uv, today, trend:[30] }；live=true 表示数据来自后端（真实共享）
function renderStats(data,live){
  data=data||localData();
  drawTrend(data.trend);
  var rdEl=document.getElementById('report-date');if(rdEl)rdEl.textContent=fmtDate(t);
  countUp(document.getElementById('report-today'),data.today);
  countUp(document.getElementById('report-pv'),data.pv);
  countUp(document.getElementById('report-uv'),data.uv);
  // 仅当数据确实来自后端时才标「全网实时」，降级本地时不误导
  var tt=document.querySelector('.stats-chart-card .stats-card-title');
  if(tt)tt.textContent=live?'📈 近 30 天访问趋势 · 全网实时':'📈 近 30 天访问趋势';
}
// 加载统计：优先后端（真实共享），失败则降级到本地，保证页面永不卡死
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
    renderStats(localData());   // 后端不可用 -> 本地降级，不影响主功能
  }
}
loadStats();

// 大数字格式化（88027687 -> 8802.8万，120000000 -> 1.2亿）
function fmtNum(n){
  if(n==null||n==='-')return'-';
  var s=String(n).trim();
  if(/[万亿]/.test(s))return s;            // already formatted -> return as-is (prevents re-parse loop)
  n=parseInt(s);if(isNaN(n))return s;
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
// 注：PV/UV 数字由 renderStats() 直接写入并格式化（fmtNum），无需 MutationObserver 监听
