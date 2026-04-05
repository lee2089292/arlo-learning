/**
 * 学习记录存储模块
 * 使用 localStorage 存储用户名和每日学习数据
 */

const STORE_KEY_USER = 'arlo_username';
const STORE_KEY_RECORDS = 'arlo_records';

// 获取今天的日期字符串 YYYY-MM-DD
function getToday() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

// 获取保存的用户名
function getSavedUser() {
  return localStorage.getItem(STORE_KEY_USER) || '';
}

// 保存用户名
function saveUser(name) {
  localStorage.setItem(STORE_KEY_USER, name.trim());
}

// 获取所有记录 { username: { "2026-04-05": { units: {score,correct,wrong}, clock: {score,correct,wrong} } } }
function getAllRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY_RECORDS)) || {};
  } catch { return {}; }
}

// 获取当前用户今天的某模块记录
function getTodayRecord(module) {
  const user = getSavedUser();
  if (!user) return { score: 0, correct: 0, wrong: 0 };
  const all = getAllRecords();
  const today = getToday();
  return (all[user] && all[user][today] && all[user][today][module]) || { score: 0, correct: 0, wrong: 0 };
}

// 保存当前用户今天的某模块记录
function saveTodayRecord(module, data) {
  const user = getSavedUser();
  if (!user) return;
  const all = getAllRecords();
  if (!all[user]) all[user] = {};
  const today = getToday();
  if (!all[user][today]) all[user][today] = {};
  all[user][today][module] = data;
  localStorage.setItem(STORE_KEY_RECORDS, JSON.stringify(all));
}

// 获取当前用户的所有历史记录，按日期倒序
function getUserHistory() {
  const user = getSavedUser();
  if (!user) return [];
  const all = getAllRecords();
  const userData = all[user] || {};
  return Object.keys(userData).sort().reverse().map(date => ({
    date,
    ...userData[date]
  }));
}
