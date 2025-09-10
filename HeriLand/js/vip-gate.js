// vip-gate.js — gate (login required) + auto-return + capture-phase stop
(function () {
  'use strict';

  const $id = (id) => document.getElementById(id);
  const $$  = (sel) => Array.from(document.querySelectorAll(sel));

  const Auth = {
    get user() {
      try { return JSON.parse(localStorage.getItem('hl_currentUser') || 'null'); }
      catch { return null; }
    }
  };

  // 更嚴謹的登入判斷：既要有 user，又要卡片是 member 狀態（避免殘留資料）
  function isLoggedIn() {
    const u = Auth.user;
    if (!u) return false;
    const card = $id('vipCard');
    return !!(card && card.classList.contains('member'));
  }

  function showAuthLogin() {
    const modal = $id('hlAuthModal');
    if (modal) {
      modal.setAttribute('aria-hidden', 'false');
      console.debug('[gate] show login modal');
    } else {
      console.warn('[gate] #hlAuthModal not found');
    }
  }

  function showViewById(id, direction = 'forward') {
    const next = $id(id);
    if (!next) {
      console.warn('[gate] target view not found:', id);
      return;
    }
    if (typeof window.showView === 'function') {
      window.showView(next, direction);
      return;
    }
    // fallback
    const views = $$('.vip-view');
    const current = views.find(v => v.classList.contains('show'));
    next.removeAttribute('hidden');
    next.classList.add('show');
    if (current && current !== next) {
      current.classList.remove('show');
      current.setAttribute('hidden', '');
    }
  }

  let pendingTarget = null;

// Intercept feature buttons — allow "settings" without login
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.feature-card[data-target]');
  if (!btn) return;

  const id = btn.getAttribute('data-target'); // e.g. "trips" / "settings"
  const isSettings = (id === 'settings');
  const loggedIn = isLoggedIn();
  console.debug('[gate] click target =', id, 'loggedIn =', loggedIn);

  // ✅ 設定頁永遠允許進入（不攔）
  if (isSettings) {
    // 若你想统一由 gate 切页（可保留动画），可在此直接切换：
    // e.preventDefault();
    // e.stopImmediatePropagation();
    // showViewById(id, 'forward');
    // 否则就不阻止，让你原本的切页逻辑接手。
    return;
  }

  // 其它頁面需要登入
  if (!loggedIn) {
    e.preventDefault();
    e.stopImmediatePropagation();
    pendingTarget = id;
    showAuthLogin();
    return;
  }

  // 已登入 → 正常切頁
  // e.preventDefault(); // 若你的切页用 <a> 可保留
  showViewById(id, 'forward');
}, true); // capture = true（维持先手拦截）


  const prevOnLoginSuccess = window.onLoginSuccess;
  window.onLoginSuccess = function (user) {
    console.debug('[gate] onLoginSuccess user =', user);

    if (typeof prevOnLoginSuccess === 'function') {
      try { prevOnLoginSuccess(user); }
      catch (e) { console.warn('[gate] prev onLoginSuccess error:', e); }
    }

    if (pendingTarget) {
      const id = pendingTarget;
      pendingTarget = null;
      console.debug('[gate] auto navigate to pending target =', id);
      setTimeout(() => showViewById(id, 'forward'), 50);
    }
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('#vipLogoutBtn,[data-action="logout"]');
    if (!el) return;
    pendingTarget = null;
    console.debug('[gate] logout → clear pending target');
  });

  console.debug('[gate] ready');
})();
