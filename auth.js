/**
 * 用户登录模块
 * 进入页面时检查是否有用户名，没有则弹出输入框
 */

function initAuth(onReady) {
  const saved = getSavedUser();

  // 创建遮罩
  const overlay = document.createElement('div');
  overlay.id = 'auth-overlay';
  overlay.innerHTML = `
    <div class="auth-box">
      <div style="font-size:2.5rem;margin-bottom:10px;">🌟</div>
      <h2 style="color:#1a73e8;margin-bottom:6px;">欢迎来到学习站</h2>
      <p style="color:#888;font-size:0.9rem;margin-bottom:16px;">请输入你的名字开始学习吧</p>
      <input type="text" id="auth-name" placeholder="输入名字" value="${saved}" maxlength="20" />
      <button class="btn btn-primary" id="auth-btn" style="margin-top:12px;width:100%;">开始学习 🚀</button>
    </div>
  `;

  // 样式
  const style = document.createElement('style');
  style.textContent = `
    #auth-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999;
    }
    .auth-box {
      background: #fff; border-radius: 24px; padding: 36px 28px;
      text-align: center; box-shadow: 0 12px 40px rgba(0,0,0,0.2);
      max-width: 320px; width: 90%;
    }
    .auth-box input {
      width: 100%; padding: 10px 14px; border-radius: 14px;
      border: 2px solid #84b6f4; font-size: 1.1rem;
      font-family: inherit; text-align: center; outline: none;
    }
    .auth-box input:focus { border-color: #1a73e8; }
  `;
  document.head.appendChild(style);

  function doLogin() {
    const name = document.getElementById('auth-name').value.trim();
    if (!name) {
      document.getElementById('auth-name').style.borderColor = '#e74c3c';
      document.getElementById('auth-name').placeholder = '请输入名字！';
      return;
    }
    saveUser(name);
    overlay.remove();
    if (onReady) onReady(name);
  }

  // 如果已有用户名，自动登录
  if (saved) {
    if (onReady) onReady(saved);
    return;
  }

  document.body.appendChild(overlay);
  document.getElementById('auth-name').focus();
  document.getElementById('auth-btn').addEventListener('click', doLogin);
  document.getElementById('auth-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
}
