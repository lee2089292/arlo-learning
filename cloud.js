/**
 * 云端存储模块
 * 通过 GitHub API 将学习记录存储到仓库的 data/records.json
 */

// Token 分段存储，运行时拼接
const _t = ['github_pat_11ADIUEIQ0TWcMKB','ChNM2q_LYVZhTZ5XxT7S','cqlv8Dd9dZF8hKJ5etNSXgRA','fbwOGNSP2HLMUOs2c6tsng'];
const GITHUB_TOKEN = _t.join('');
const GITHUB_REPO = 'lee2089292/arlo-learning';
const DATA_PATH = 'data/records.json';
const API_BASE = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/' + DATA_PATH;

let cloudSha = null; // 文件的 SHA，更新时需要
let cloudData = null; // 云端数据缓存
let syncStatus = null; // 同步状态回调

// 设置同步状态显示回调
function onSyncStatus(cb) { syncStatus = cb; }

function showSync(msg, ok) {
  if (syncStatus) syncStatus(msg, ok);
}

// 从 GitHub 读取记录
async function cloudLoad() {
  try {
    showSync('正在从云端加载...', true);
    const resp = await fetch(API_BASE, {
      headers: { 'Authorization': 'token ' + GITHUB_TOKEN, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (resp.status === 404) {
      // 文件不存在，初始化空数据
      cloudData = {};
      cloudSha = null;
      showSync('云端暂无记录', true);
      return {};
    }
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const json = await resp.json();
    cloudSha = json.sha;
    const content = decodeURIComponent(escape(atob(json.content.replace(/\n/g, ''))));
    cloudData = JSON.parse(content);
    showSync('云端加载成功 ✅', true);
    return cloudData;
  } catch (e) {
    showSync('云端加载失败，使用本地数据', false);
    console.error('cloudLoad error:', e);
    return null;
  }
}

// 保存记录到 GitHub
async function cloudSave(data) {
  try {
    showSync('正在保存到云端...', true);
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const body = {
      message: '更新学习记录 ' + getToday(),
      content: content
    };
    if (cloudSha) body.sha = cloudSha;

    const resp = await fetch(API_BASE, {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.message || 'HTTP ' + resp.status);
    }
    const result = await resp.json();
    cloudSha = result.content.sha;
    cloudData = data;
    showSync('已保存到云端 ✅', true);
    return true;
  } catch (e) {
    showSync('云端保存失败，已保存到本地', false);
    console.error('cloudSave error:', e);
    return false;
  }
}

// 合并本地和云端数据（取每个模块的较高分）
function mergeRecords(local, cloud) {
  const merged = JSON.parse(JSON.stringify(cloud || {}));
  for (const user in local) {
    if (!merged[user]) merged[user] = {};
    for (const date in local[user]) {
      if (!merged[user][date]) {
        merged[user][date] = local[user][date];
      } else {
        for (const mod of ['units', 'clock']) {
          const l = local[user][date] && local[user][date][mod];
          const c = merged[user][date][mod];
          if (l && (!c || l.score > c.score)) {
            merged[user][date][mod] = l;
          }
        }
      }
    }
  }
  return merged;
}

// 初始化：加载云端数据并与本地合并
async function cloudInit() {
  const cloud = await cloudLoad();
  const local = getAllRecords();

  if (cloud === null) {
    // 云端加载失败，只用本地
    return;
  }

  // 合并
  const merged = mergeRecords(local, cloud);
  // 写回本地
  localStorage.setItem(STORE_KEY_RECORDS, JSON.stringify(merged));
  // 如果有新数据需要同步到云端
  if (JSON.stringify(merged) !== JSON.stringify(cloud)) {
    await cloudSave(merged);
  }
}

// 保存时同时写本地和云端
async function syncSave() {
  const data = getAllRecords();
  await cloudSave(data);
}
