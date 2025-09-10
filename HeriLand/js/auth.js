// === Heriland Auth Modal (依你的 HTML 直接接線) ===
(function () {
  const $ = (s, sc = document) => sc.querySelector(s);

  const modal     = $('#hlAuthModal');
  const loginView = $('#hlLoginView');
  const regView   = $('#hlRegisterView');
  const titleEl   = $('#hlAuthTitle');

  function showAuth(view) {
    if (!modal || !loginView || !regView) return;
    const showLogin = (view === 'login');

    loginView.hidden = !showLogin;
    regView.hidden   =  showLogin;

    if (titleEl) titleEl.textContent = showLogin ? '登入 Heriland' : '建立新帳號';

    // 顯示 Modal
    modal.setAttribute('aria-hidden', 'false');

    // 把焦點帶到當前視窗第一個可輸入欄位
    const first = (showLogin ? loginView : regView).querySelector('input,select,textarea,button');
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 0);
  }

  function openLogin()    { showAuth('login'); }
  function openRegister() { showAuth('register'); }
  function closeAuth()    { if (modal) modal.setAttribute('aria-hidden', 'true'); }

  // 對外（可選）：其他程式也能呼叫
  window.openAuthModal      = openLogin;      // 打開即為登入視窗
  window.openRegisterModal  = openRegister;
  window.switchAuthView     = showAuth;

  // 「立即登入」觸發點：
  // 1) 若你的按鈕 ID 是 #loginBtn（或 #hlLoginCTA），會自動掛上
  // 2) 或在你的任一按鈕加上 data-action="open-login" 也會生效
  document.addEventListener('click', (e) => {
    const t = e.target;

    // 打開登入
if (t.closest('#vipLoginBtn, #loginBtn, #hlLoginCTA, [data-action="open-login"], .open-login')) {
  e.preventDefault();
  openLogin();   // 或 openAuthModal('login')
  return;
}


    // 登入 -> 前往註冊
    if (t.closest('#hlGoRegister')) {
      e.preventDefault();
      openRegister();
      return;
    }

    // 註冊 -> 返回登入
    if (t.closest('#hlBackToLogin')) {
      e.preventDefault();
      openLogin();
      return;
    }

    // 關閉按鈕
    if (t.closest('#hlAuthClose')) {
      e.preventDefault();
      closeAuth();
      return;
    }
  });

  // 點背景（非面板區域）關閉
  $('#hlAuthModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAuth();
  });

  // Esc 關閉
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.getAttribute('aria-hidden') !== 'true') {
      closeAuth();
    }
  });
})();

// 只要點 #vipLoginBtn → 只開登入視窗；阻斷其它舊邏輯
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('vipLoginBtn');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation(); // 阻斷同元素上其它 listener
    e.stopPropagation();          // 阻斷冒泡
    // 開登入視窗（依你前面已貼的 API 擇一）
    if (typeof openAuthModal === 'function') openAuthModal('login');
    else if (typeof openLogin === 'function') openLogin();
  }, true); // ← 捕獲階段，優先於大多數舊綁定
});

// === Heriland Auth: Register <-> Login 強制切換（捕獲階段，避免被舊監聽覆蓋） ===
(function(){
  const $ = (s, sc=document)=>sc.querySelector(s);
  const modal = $('#hlAuthModal');
  const loginView = $('#hlLoginView');
  const regView   = $('#hlRegisterView');
  const titleEl   = $('#hlAuthTitle');

  function showAuth(view){
    const isLogin = (view === 'login');
    if (loginView) loginView.hidden = !isLogin;
    if (regView)   regView.hidden   =  isLogin;
    if (titleEl)   titleEl.textContent = isLogin ? '登入 Heriland' : '建立新帳號';
    if (modal)     modal.setAttribute('aria-hidden','false');

    const first = (isLogin ? loginView : regView)?.querySelector('input,select,textarea,button');
    if (first) setTimeout(()=>first.focus({preventScroll:true}),0);
  }

  // 讓外部也可呼叫（可選）
  window.hlShowAuth = showAuth;

  // 用「捕獲階段」搶先處理，並阻斷舊 handler 影響
  document.addEventListener('click', (e)=>{
    const t = e.target;

    // 登入 → 立即註冊
    if (t.closest('#hlGoRegister')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      showAuth('register');
      return;
    }

    // 註冊 → 返回登入（你要修的這顆）
    if (t.closest('#hlBackToLogin')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      showAuth('login');
      return;
    }
  }, true); // ← capture=true
})();

