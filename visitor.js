/**
 * 访客追踪模块
 * 记录访问者的 IP、设备、系统、时间，并关联用户名
 * 数据存储到 GitHub data/visitors.json
 */

const VISITOR_PATH = 'data/visitors.json';
const VISITOR_API = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/' + VISITOR_PATH;
const VISIT_SESSION_KEY = 'arlo_visit_tracked';

let visitorSha = null;

// 解析 User-Agent
function parseUA() {
  const ua = navigator.userAgent;
  let device = '未知设备', os = '未知系统', browser = '未知浏览器';

  // 操作系统
  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) {
    const ver = ua.match(/Mac OS X (\d+[._]\d+)/);
    os = 'macOS' + (ver ? ' ' + ver[1].replace(/_/g, '.') : '');
  } else if (/Android ([\d.]+)/.test(ua)) os = 'Android ' + RegExp.$1;
  else if (/iPhone OS ([\d_]+)/.test(ua)) os = 'iOS ' + RegExp.$1.replace(/_/g, '.');
  else if (/iPad/.test(ua)) os = 'iPadOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  // 设备
  if (/iPhone/.test(ua)) device = 'iPhone';
  else if (/iPad/.test(ua)) device = 'iPad';
  else if (/Android/.test(ua)) {
    const m = ua.match(/;\s*([^;)]+)\s*Build/);
    device = m ? m[1].trim() : 'Android 设备';
  } else if (/Macintosh/.test(ua)) device = 'Mac';
  else if (/Windows/.test(ua)) device = 'PC';

  // 浏览器
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/Chrome\//.test(ua) && !/Edg/.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';

  return { device, os, browser };
}

// 获取访客 IP
async function getVisitorIP() {
  const apis = [
    { url: 'https://api.ipify.org?format=json', parse: r => r.ip },
    { url: 'https://ipinfo.io/json', parse: r => r.ip }
  ];
  for (const api of apis) {
    try {
      const resp = await fetch(api.url);
      if (resp.ok) return api.parse(await resp.json());
    } catch (e) { /* 下一个 */ }
  }
  return '未知';
}

// 从 GitHub 加载访客记录
async function loadVisitors() {
  try {
    const resp = await fetch(VISITOR_API, {
      headers: { 'Authorization': 'token ' + GITHUB_TOKEN, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (resp.status === 404) { visitorSha = null; return []; }
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const json = await resp.json();
    visitorSha = json.sha;
    return JSON.parse(decodeURIComponent(escape(atob(json.content.replace(/\n/g, '')))));
  } catch (e) {
    console.error('loadVisitors:', e);
    return [];
  }
}

// 保存访客记录到 GitHub
async function saveVisitors(records) {
  try {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(records, null, 2))));
    const body = { message: '访客记录 ' + getToday(), content };
    if (visitorSha) body.sha = visitorSha;
    const resp = await fetch(VISITOR_API, {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    visitorSha = (await resp.json()).content.sha;
    return true;
  } catch (e) {
    console.error('saveVisitors:', e);
    return false;
  }
}

// 格式化当前时间
function formatNow() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0') + ':' +
    String(d.getSeconds()).padStart(2, '0');
}

// 记录一次访问（同一浏览器会话只记录一次）
async function trackVisit() {
  if (sessionStorage.getItem(VISIT_SESSION_KEY)) return; // 本次会话已记录
  sessionStorage.setItem(VISIT_SESSION_KEY, '1');

  const [ip, visitors] = await Promise.all([getVisitorIP(), loadVisitors()]);
  const { device, os, browser } = parseUA();

  visitors.push({ ip, device, os, browser, time: formatNow(), username: '', page: location.pathname });

  // 保留最近 500 条
  if (visitors.length > 500) visitors.splice(0, visitors.length - 500);
  await saveVisitors(visitors);
}

// 关联用户名到最近的无名记录
async function linkVisitorName(name) {
  if (!name) return;
  const visitors = await loadVisitors();
  if (!visitors.length) return;

  // 从最新往前找，把最近一条空用户名的记录关联上
  let changed = false;
  for (let i = visitors.length - 1; i >= 0; i--) {
    if (!visitors[i].username) {
      visitors[i].username = name;
      changed = true;
      break;
    }
  }
  if (changed) await saveVisitors(visitors);
}
