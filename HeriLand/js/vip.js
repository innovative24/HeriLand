// ./js/vip.js  — Heriland VIP (clean unified build)
console.log("[VIP] vip.js loaded ✅");

window.setTimeout(() => {
  console.log("[VIP] detect run ✅");
}, 0);



/* 防止重複初始化 */
if (window.__VIP_WIRED__) {
  console.info('[VIP] already wired, skip');
} else {
  window.__VIP_WIRED__ = true;

  document.addEventListener('DOMContentLoaded', () => {
    // ====== 取得主要元素 ======
    const shell     = document.getElementById('vipShell');          // 一體外殼
    const handle    = shell?.querySelector('.vip-handle');          // 右側膠囊
    const panel     = shell?.querySelector('.vip-panel');           // 面板
    const closeBtn  = shell?.querySelector('.vip-close');           // 面板右上關閉
    const backdrop  = document.getElementById('vipBackdrop')        // 霧化背景
                      || shell?.querySelector('.vip-backdrop');

    if (!shell || !panel || !backdrop) {
      console.warn('[VIP] missing core elements', { shell, panel, backdrop });
      return;
    }

    // ====== 開關動畫（保有一體化） ======
    const openVIP = () => {
  shell.classList.add('open');
  shell.setAttribute('aria-hidden', 'false');
  backdrop.hidden = false;
  requestAnimationFrame(() => backdrop.classList.add('show'));
  document.documentElement.classList.add('no-scroll');
  document.body.style.overflow = 'hidden';

  // ✅ 開啟後把焦點移到面板內第一個可聚焦元素，避免 aria-hidden 警告
  const firstFocusable = panel.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  firstFocusable?.focus();
};

const closeVIP = () => {
  // ✅ 關閉前先把焦點移回把手，避免「隱藏了仍保留焦點」
  // --- 將抽屜控制暴露到全域（讓其他檔或除錯好呼叫） ---
window.openVIP  = openVIP;
window.closeVIP = closeVIP;

  handle?.focus();

  shell.classList.remove('open');
  shell.setAttribute('aria-hidden', 'true');
  backdrop.classList.remove('show');
  setTimeout(() => (backdrop.hidden = true), 280);
  document.documentElement.classList.remove('no-scroll');
  document.body.style.overflow = '';
  showHome();
};




    // 手柄/關閉/背景 點擊
    handle && handle.addEventListener('click', (e) => {
      e.stopPropagation();
      shell.classList.contains('open') ? closeVIP() : openVIP();
    });
    closeBtn && closeBtn.addEventListener('click', closeVIP);
    backdrop && backdrop.addEventListener('click', closeVIP);
    // 防滾穿
    shell.addEventListener(
      'wheel',
      (e) => {
        if (shell.classList.contains('open')) e.stopPropagation();
      },
      { passive: true }
    );

    // ====== 子頁切換（6 宮格） ======
    const homeWrap = panel.querySelector('.vip-home'); // 卡片 + 6 宮格的容器
    const views = {
      trip:       document.getElementById('vipTrips'),
      favorites:  document.getElementById('vipFavorites'),
      footprint:  document.getElementById('vipFootprints'),
      recommend:  document.getElementById('vipRecommend'),
      badge:      document.getElementById('vipBadges'),
      settings:   document.getElementById('vipSettings'),
    };

    function hideAllViews() {
      Object.values(views).forEach((v) => v && v.classList.remove('show'));
    }
    function showHome() {
      hideAllViews();
      homeWrap && homeWrap.classList.remove('hide');
    }
    function showView(key) {
      hideAllViews();
      homeWrap && homeWrap.classList.add('hide');
      const v = views[key];
      v && v.classList.add('show');
    }

    // 6 宮格按鈕（在 VIP 卡片下方）
    panel
      .querySelectorAll('.feature-card[data-target]')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const key = btn.dataset.target;
          if (!VIP.user) {
            // 未登入：先提示或開啟登入
            console.log('[VIP] not logged in, open login CTA');
            return;
          }
          showView(key);
        });
      });

    // 子頁返回（每個子頁 header 的返回鈕）
    panel
      .querySelectorAll('.btn-back,[data-back]')
      .forEach((btn) => btn.addEventListener('click', showHome));

    // ====== 會員卡資料元素（登入/未登入兩態會共用） ======
    const el = {
      userName:  document.getElementById('vipUserName'),
      tierPill:  document.getElementById('vipTierPill'),
      badgeName: document.getElementById('vipBadgeName'),
      no:        document.getElementById('vipNo'),
      level:     document.getElementById('vipLevel'),
      expire:    document.getElementById('vipExpire'),
      stats:     document.getElementById('vipStats'),
      perkBtn:   document.getElementById('vipPerkBtn'),
      perkCnt:   document.getElementById('vipPerkCount'),
      tierWord:  document.getElementById('vipTierWord'),
    };

    // ====== 登入狀態（demo 用） ======
    const VIP = {
      user: null, // 未登入
    };

    function fillCard(user) {
      // 未登入：顯示精簡 CTA 卡
      const loginCta = document.getElementById('vipLoginCta');
      const actions  = document.getElementById('vipActions'); // 6 宮格外框
      if (!user) {
        actions && (actions.hidden = true);
        loginCta && (loginCta.hidden = false);

        el.userName && (el.userName.textContent = 'Heriland');
        el.tierPill && (el.tierPill.textContent = '');
        el.badgeName && (el.badgeName.textContent = '');
        el.no && (el.no.textContent = '');
        el.level && (el.level.textContent = '');
        el.expire && (el.expire.textContent = '');
        el.stats && (el.stats.textContent = '立即登入，解鎖你的旅遊護照！');
        el.perkCnt && (el.perkCnt.textContent = '0');
        el.perkBtn && (el.perkBtn.style.display = 'none');
        el.tierWord && (el.tierWord.textContent = '');
        return;
      }

      // 已登入：填入資料 + 顯示 6 宮格
      actions && (actions.hidden = false);
      loginCta && (loginCta.hidden = true);

      el.userName && (el.userName.textContent = user.name || '');
      el.tierPill && (el.tierPill.textContent = (user.tier || '').toUpperCase());
      el.badgeName && (el.badgeName.textContent = user.badge || '');
      el.no && (el.no.textContent = user.no || '');
      el.level && (el.level.textContent = user.level || user.tier || '');
      el.expire && (el.expire.textContent = user.exp || '');
      if (el.stats) {
        const cities = user.cities ?? 0;
        const shops  = user.merchants ?? user.shops ?? 0;
        el.stats.textContent = `已探索 ${cities} 個城市｜${shops} 家商家`;
      }
      el.perkCnt && (el.perkCnt.textContent = String(user.perks ?? 0));
      el.perkBtn && (el.perkBtn.style.display = '');
      el.tierWord && (el.tierWord.textContent = user.tier || '');
    }

    // Demo：登入/登出
    function mockLogin() {
      VIP.user = {
        name: 'Andy',
        badge: '古晉探索者',
        tier: 'Gold',
        no: 'HL-2025-00123',
        exp: '2026/12/31',
        cities: 6,
        merchants: 18,
        perks: 3,
      };
      fillCard(VIP.user);
    }
    function mockLogout() {
      VIP.user = null;
      fillCard(null);
      showHome();
    }

    // 綁定「立即登入」CTA（id: vipLoginBtn）
    const btnLogin = document.getElementById('vipLoginBtn');
    btnLogin &&
      btnLogin.addEventListener('click', (e) => {
        e.preventDefault();
        mockLogin();
      });
	  
	  // 保底：文件層級代理 #vipLoginBtn（避免被覆蓋/重新渲染導致失效）
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#vipLoginBtn');
  if (!btn) return;
  e.preventDefault();
  mockLogin();       // 你現有的假登入函式
});

    // 綁定（可選）登出
    document
      .querySelectorAll('[data-action="logout"]')
      .forEach((b) =>
        b.addEventListener('click', (e) => {
          e.preventDefault();
          mockLogout();
        })
      );

    // 初次渲染：預設未登入卡
    fillCard(null);
    showHome();

    // ====== Perks 輪播（有元素才啟用；圖片不存在也不報錯） ======
    (function () {
      const slider = document.querySelector('.vip-perks');
      const track  = slider?.querySelector('.perks-track');
      const slides = slider ? Array.from(slider.querySelectorAll('.perk')) : [];
      const dots   = slider ? Array.from(slider.querySelectorAll('.perk-dot')) : [];
      if (!slider || !track || slides.length === 0) return;

      let index = 0, timer = null;
      const delay = 3500;

      const go = (i) => {
        index = (i + slides.length) % slides.length;
        track.style.transform = `translateX(${-100 * index}%)`;
        dots.forEach((d, di) => d.classList.toggle('active', di === index));
      };
      const next  = () => go(index + 1);
      const start = () => {
        if (timer) return;
        timer = setInterval(next, delay);
      };
      const stop  = () => {
        clearInterval(timer);
        timer = null;
      };

      slider.addEventListener('pointerenter', stop);
      slider.addEventListener('pointerleave', start);
      slider.addEventListener('touchstart', stop, { passive: true });
      slider.addEventListener('touchend', start);
      dots.forEach((d, di) => d.addEventListener('click', () => go(di)));
      document.addEventListener('visibilitychange', () =>
        document.hidden ? stop() : start()
      );

      go(0);
      start();
    })();
  });
}

/* ===== VIP 卡片：未登入 ↔ 已登入 切換 ===== */
(function () {
  // 1) 狀態（未登入預設）
  const VIP_STATE = {
    isLoggedIn: false,
    user: null,
  };

  // 2) 假資料（體驗用；未串接前端登入）
  const FAKE_USER = {
    name: 'Heriland',
    no: 'HL-2025-00123',
    points: 12480,
    tier: 'Gold',       // Explorer / Gold / Platinum
    tierPill: 'GOLD',
    expire: '2026/12/31',
    cities: 6,
    shops: 18,
    perks: 3,
  };

  // 3) 填入會員卡資料 & 顯示/隱藏區塊
  function renderVipCard() {
    const card = document.getElementById('vipCard');
    if (!card) return;

    const elGuest  = card.querySelector('.vip-card-guest');
    const elMember = card.querySelector('.vip-card-member');
    const actions  = document.getElementById('vipActions'); // 2×3 功能區

    // 內部小工具（從卡片裡找元素）
    const $ = (sel) => card.querySelector(sel);

    if (VIP_STATE.isLoggedIn && VIP_STATE.user) {
      // 填資料
      $('#vipUserName')  && ($('#vipUserName').textContent  = VIP_STATE.user.name);
      $('#vipNo')        && ($('#vipNo').textContent        = VIP_STATE.user.no);
      $('#vipPoints')    && ($('#vipPoints').textContent    = Number(VIP_STATE.user.points).toLocaleString('en-US'));
      $('#vipTier')      && ($('#vipTier').textContent      = VIP_STATE.user.tier);
      $('#vipTierPill')  && ($('#vipTierPill').textContent  = VIP_STATE.user.tierPill);
      $('#vipExpire')    && ($('#vipExpire').textContent    = VIP_STATE.user.expire);
      $('#vipStats')     && ($('#vipStats').textContent     = `已探索 ${VIP_STATE.user.cities} 個城市 / ${VIP_STATE.user.shops} 家商家`);
      $('#vipPerkCount') && ($('#vipPerkCount').textContent = VIP_STATE.user.perks);

      // 顯示會員卡、顯示 2×3 功能、隱藏登入 CTA
      elGuest  && (elGuest.hidden  = true);
      elMember && (elMember.hidden = false);
      actions  && actions.removeAttribute('hidden');
      const loginCta = document.getElementById('vipLoginCta') || document.getElementById('btnVipLogin');
      loginCta && (loginCta.hidden = true);
    } else {
      // 未登入：顯示登入卡片、隱藏 2×3 功能
      elGuest  && (elGuest.hidden  = false);
      elMember && (elMember.hidden = true);
      actions  && actions.setAttribute('hidden', '');
      const loginCta = document.getElementById('vipLoginCta') || document.getElementById('btnVipLogin');
      loginCta && (loginCta.hidden = false);

      // 清空重要欄位（保持你喜歡的未登入樣式）
      $('#vipUserName')  && ($('#vipUserName').textContent  = 'Heriland');
      $('#vipTierPill')  && ($('#vipTierPill').textContent  = '');
      $('#vipNo')        && ($('#vipNo').textContent        = '');
      $('#vipExpire')    && ($('#vipExpire').textContent    = '');
      $('#vipStats')     && ($('#vipStats').textContent     = '立即登入，解鎖你的旅遊護照');
      $('#vipPerkCount') && ($('#vipPerkCount').textContent = '0');
    }
  }

  // 4) 綁定「立即登入」→ 使用假資料切換到已登入
  document.addEventListener('DOMContentLoaded', () => {
    const loginBtn =
      document.getElementById('btnVipLogin') ||
      document.getElementById('vipLoginBtn') ||
      document.querySelector('[data-role="vip-login"]');

    if (loginBtn) {
      console.log('[VIP] login button bound');
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[VIP] login clicked');
        VIP_STATE.isLoggedIn = true;
        VIP_STATE.user = FAKE_USER;
        renderVipCard();
      });
    }

    // （可選）登出示例：如果你的 HTML 有 data-action="logout" 的按鈕
    document.addEventListener('click', (e) => {
      const logoutBtn = e.target.closest('[data-action="logout"]');
      if (!logoutBtn) return;
      e.preventDefault();
      VIP_STATE.isLoggedIn = false;
      VIP_STATE.user = null;
      renderVipCard();
    });

    // 5) 2×3 功能卡 — 登入後才可點
    const actions = document.getElementById('vipActions');
    if (actions) {
      actions.addEventListener('click', (e) => {
        const btn = e.target.closest('.feature-card');
        if (!btn) return;
        if (!VIP_STATE.isLoggedIn) {
          // 未登入，什麼都不做（或提示登入）
          return;
        }
        const target = btn.dataset.target;  // trip / favorites / footprints / recommend / badge / settings
        console.log('[VIP] open sub view:', target);
        // TODO: 這裡接你的頁面跳轉或子頁顯示
      });
    }

    // 初始渲染（未登入樣式）
    renderVipCard();
  });
})();

/* --- VIP login (delegated binding, robust) --- */
(function () {
  // 如果前面我給你的 VIP_STATE / FAKE_USER / renderVipCard 都在
  // 這裡就直接用；若名稱不同，請改成你的名稱。
  if (typeof renderVipCard !== 'function') return;

  // 安全一次性保護
  if (window.__VIP_LOGIN_WIRED__) return;
  window.__VIP_LOGIN_WIRED__ = true;

  // 1) 啟動時做個偵測，幫你看 DOM 狀態
  window.setTimeout(() => {
    const hasVipCard  = !!document.getElementById('vipCard');
    const idBtn1      = !!document.getElementById('btnVipLogin');
    const idBtn2      = !!document.getElementById('vipLoginBtn');
    const roleBtn     = !!document.querySelector('[data-role="vip-login"]');
    console.log('[VIP] detect:', { hasVipCard, idBtn1, idBtn2, roleBtn });
  }, 0);

  // 2) 事件委派（不怕元素晚載入、被重繪、或 aria-hidden）
  document.addEventListener('click', (e) => {
    const loginBtn = e.target.closest('#btnVipLogin, #vipLoginBtn, [data-role="vip-login"]');
    if (!loginBtn) return;

    e.preventDefault();
    console.log('[VIP] login clicked (delegated)');

    // 沒串登入前，先用假資料切換
    window.VIP_STATE = window.VIP_STATE || {};
    window.VIP_STATE.isLoggedIn = true;
    window.VIP_STATE.user = window.FAKE_USER || {
      name: 'Heriland',
      no: 'HL-2025-00123',
      points: 12480,
      tier: 'Gold',
      tierPill: 'GOLD',
      expire: '2026/12/31',
      cities: 6,
      shops: 18,
      perks: 3,
    };

    renderVipCard();
  });

  // 3) 可選：登出也做委派（如果有 data-action="logout" 的按鈕）
  document.addEventListener('click', (e) => {
    const logoutBtn = e.target.closest('[data-action="logout"]');
    if (!logoutBtn) return;

    e.preventDefault();
    console.log('[VIP] logout clicked (delegated)');
    window.VIP_STATE = window.VIP_STATE || {};
    window.VIP_STATE.isLoggedIn = false;
    window.VIP_STATE.user = null;
    renderVipCard();
  });
})();


/* --------------------------
   VIP：登入狀態與卡片渲染（不動你的動畫）
-------------------------- */

// 1) 狀態（可改成實際登入狀態）
window.VIP_STATE = window.VIP_STATE || { isLoggedIn: false, user: null };

// Demo 用的假資料（之後接真登入回填）
window.FAKE_USER = {
  name: 'Heriland',
  no: 'HL-2025-00123',
  tier: 'Gold',
  tierPill: 'GOLD',
  points: 12480,
  expire: '2026/12/31',
  cities: 6,
  shops: 18,
  perks: 3
};

// 2) 小工具：安全填字
function setText(sel, val) {
  const el = document.querySelector(sel);
  if (el) el.textContent = (val ?? '').toString();
}

// 3) 依狀態渲染卡片（不改動面板/動畫，只改 panel 內文字/區塊顯示）
function renderVipCard() {
  const card   = document.getElementById('vipCard');
  if (!card) return;

  const guest  = card.querySelector('.vip-card-guest');   // 未登入區
  const member = card.querySelector('.vip-card-member');  // 已登入區

  if (!guest || !member) return;

  const u = window.VIP_STATE.user;
  const loggedIn = !!u;

  guest.hidden  = loggedIn;
  member.hidden = !loggedIn;

  if (loggedIn) {
    setText('#vipUserName',  u.name);
    setText('#vipNo',        u.no);
    setText('#vipTier',      u.tier);
    setText('#vipTierPill',  u.tierPill);
    setText('#vipPoints',    Number(u.points).toLocaleString('en-US'));
    setText('#vipExpire',    u.expire);
    setText('#vipStats',     `已探索 ${u.cities} 個城市 / ${u.shops} 家商家`);
    setText('#vipPerkCount', String(u.perks ?? 0));
  } else {
    // 未登入時保持設計稿的精簡提示樣式
    // 這裡不強制覆寫文字，讓你的 HTML 文案維持即可
  }
}

// 4) 綁定登入/登出（委派，不怕 aria-hidden）
document.addEventListener('DOMContentLoaded', () => {
  // 【立即登入】（任何一個符合下列選擇器都可以觸發）
  document.addEventListener('click', (e) => {
    const loginBtn =
      e.target.closest('#vipLoginBtn, #btnVipLogin, [data-role="vip-login"]');
    if (!loginBtn) return;

    e.preventDefault();
    console.log('[VIP] login clicked');

    // 模擬登入：寫入狀態，再渲染
    window.VIP_STATE.user = { ...window.FAKE_USER };
    window.VIP_STATE.isLoggedIn = true;
    renderVipCard();
  });

  // 【登出】（可選）
  document.addEventListener('click', (e) => {
    const logoutBtn = e.target.closest('[data-action="logout"]');
    if (!logoutBtn) return;

    e.preventDefault();
    console.log('[VIP] logout clicked');

    window.VIP_STATE.user = null;
    window.VIP_STATE.isLoggedIn = false;
    renderVipCard();
  });

  // 首次渲染（依當前狀態顯示 guest/member）
  renderVipCard();
});

// === VIP login glue (non-breaking) ===
(() => {
  // 等 DOM 都在再綁定
  window.addEventListener('DOMContentLoaded', () => {
    const card   = document.getElementById('vipCard');
    if (!card) return; // 沒有卡片就跳出（不影響動畫）

    const btnLogin = document.getElementById('vipLoginBtn'); // 你的「立即登入」按鈕
    const elGuest  = card.querySelector('.vip-card-guest');  // 未登入區塊
    const elMember = card.querySelector('.vip-card-member'); // 已登入區塊（含 2×3 按鈕）

    // 沒有任何一塊就不處理
    if (!elGuest || !elMember || !btnLogin) return;

    // 初始保險：預設顯示未登入
    elGuest.hidden  = false;
    elMember.hidden = true;
    card.classList.add('guest');
    card.classList.remove('authed');

    // 假資料（體驗用）
    const demoUser = {
      name:    'Heriland',
      no:      'HL-2025-00123',
      points:  12480,
      tier:    'Gold',
      tierPill:'GOLD',
      expire:  '2026/12/31',
      perks:   3,
      cities:  6,
      shops:   18
    };

    // 把數字補千分位
    const fmt = n => Number(n).toLocaleString('en-US');

    // 寫入卡片文字（用你頁面上的 id）
    function fillMember(u) {
      const byId = id => document.getElementById(id);
      byId('vipUserName') && (byId('vipUserName').textContent = u.name);
      byId('vipNo')       && (byId('vipNo').textContent       = u.no);
      byId('vipPoints')   && (byId('vipPoints').textContent   = fmt(u.points));
      byId('vipTier')     && (byId('vipTier').textContent     = u.tier);
      byId('vipTierPill') && (byId('vipTierPill').textContent = u.tierPill);
      byId('vipExpire')   && (byId('vipExpire').textContent   = u.expire);
      byId('vipPerkCount')&& (byId('vipPerkCount').textContent= u.perks);
      byId('vipStats')    && (byId('vipStats').textContent    = `已探索 ${u.cities} 個城市｜${u.shops} 家商家`);
    }

    // 切換到「已登入」視圖 + 綁功能按鈕
    function showAuthed() {
      fillMember(demoUser);
      elGuest.hidden  = true;
      elMember.hidden = false;
      card.classList.remove('guest');
      card.classList.add('authed');

      // 六個功能按鈕（你的 HTML 上 button 有 .feature-card 與 data-target）
      elMember.querySelectorAll('.feature-card').forEach(btn => {
        btn.addEventListener('click', () => {
          const t = btn.getAttribute('data-target');
          // 這裡先簡單示範：你可以改成實際導航 / 開子頁
          console.log('[VIP] open →', t);
          // openVipSubView(t)  或  location.href = ...
        }, { once: false });
      });
    }

    // 綁定「立即登入」按鈕（事件委派替代：document 也可以，但有這顆就直接綁）
    btnLogin.addEventListener('click', e => {
      e.preventDefault();
      showAuthed();
    });
  });
})();


// === VIP 子頁切換（不需 #vipHome，使用 #vipCard + #vipActions 作為首頁） ===
document.addEventListener('DOMContentLoaded', () => {
  const panel   = document.getElementById('vipPanel');      // 整個 VIP 面板
  const card    = document.getElementById('vipCard');       // 會員卡區（未登入卡 / 已登入卡）
  const actions = document.getElementById('vipActions');    // 2×3 按鈕區
  if (!panel) return;

  // 視為“首頁”的元素集合：同時隱藏/顯示
  const homeEls = [card, actions].filter(Boolean);

  // 你的子頁 id 對應（依你 HTML 實際 id）
  const views = {
    trips:       panel.querySelector('#vipTrips'),
    favorites:  panel.querySelector('#vipFavorites'),
    footprints: panel.querySelector('#vipFootprints'),
    recommend:  panel.querySelector('#vipRecommend'),
    badges:     panel.querySelector('#vipBadges'),
    settings:   panel.querySelector('#vipSettings'),
  };

  function hideHome() {
    homeEls.forEach(el => el && el.classList.add('vip-hide'));
  }
  function showHome() {
    // 關所有子頁
    Object.values(views).forEach(v => {
      if (!v) return;
      v.classList.remove('show');
      v.hidden = true;
    });
    // 顯示首頁
    homeEls.forEach(el => el && el.classList.remove('vip-hide'));
  }
  

  // 事件委派：點 6 顆按鈕（.feature-card[data-target]）→ 進入子頁
  //           點子頁返回（.btn-back[data-back]）→ 回首頁
  panel.addEventListener('click', (e) => {
    // 如果面板目前被標成 aria-hidden，就不處理（避免焦點被鎖住時誤觸）
    if (panel.getAttribute('aria-hidden') === 'true') return;

    const btn = e.target.closest('.feature-card[data-target], .btn-back[data-back]');
    if (!btn) return;

    // 子頁返回
    if (btn.matches('.btn-back')) {
      e.preventDefault();
      showHome();
      return;
    }
	
	// --- Router shim: provide showView() for legacy calls ---
(() => {
  // 你的各子頁 <section> 的 id 要對應這張表（可依實際命名調整）
  const VIEW_ID_MAP = {
    dashboard:  'vipDashboard',
    trips:      'vipTrips',
    favorites:  'vipFavorites',
    footprints: 'vipFootprints',
    recommend:  'vipRecommend',
    badges:     'vipBadges',
    settings:   'vipSettings',
  };

  function _showView(key) {
    const viewKey = VIEW_ID_MAP[key] ? key : 'dashboard';
    // 1) 切換顯示
    document.querySelectorAll('.vip-view').forEach(el => el.classList.remove('show'));
    const target = document.getElementById(VIEW_ID_MAP[viewKey]);
    if (target) target.classList.add('show');

    // 2) 進頁一次性初始化（有定義才會呼叫）
    if (viewKey === 'trips'     && typeof initTripsOnce === 'function')     initTripsOnce();
    if (viewKey === 'settings'  && typeof initSettingsOnce === 'function')  initSettingsOnce();
    if (viewKey === 'recommend' && typeof initRecommendOnce === 'function') initRecommendOnce();

    // 3) 可選：同步網址 hash（不影響功能）
    try { history.replaceState({}, '', `#view=${viewKey}`); } catch (e) {}
    console.log('[VIP] showView ->', viewKey);
  }

  // 舊碼會呼叫 showView；若需要，也順手掛個 show()
  if (typeof window.showView !== 'function') window.showView = _showView;
  if (typeof window.show    !== 'function') window.show    = _showView;
})();


    // 6 顆按鈕 → 子頁
    const key = btn.dataset.target;
    if (key) {
      e.preventDefault();
      showView(key);
    }
  });

  // 進入面板時預設回首頁
  showHome();
});


(function () {
  const url = new URL(location.href);
  if (url.searchParams.get('member') === '1') {
    openDrawer(); // 抽屜滑出
    url.searchParams.delete('member'); // 清掉參數
    history.replaceState({}, '', url.pathname);
  }
})();

// --- 首頁載入：若帶旗標就自動開抽屜 ---
document.addEventListener('DOMContentLoaded', () => {
  // A) 查網址參數 ?member=1
  try {
    const url = new URL(location.href);
    if (url.searchParams.get('?member') === '1') {
      openVIP();
      // 清掉參數避免殘留（重新整理/書籤不會再帶）
      url.searchParams.delete('member');
      history.replaceState({}, '', url.pathname + url.hash);
    }
  } catch (e) {}

  // B) 查 sessionStorage 旗標（子頁可能用這招）
  try {
    if (sessionStorage.getItem('HL_MEMBER') === '1') {
      sessionStorage.removeItem('HL_MEMBER');
      openVIP();
    }
  } catch (e) {}
});

document.addEventListener('DOMContentLoaded', () => {
  // 檢查是否有子頁留下的旗標
  if (sessionStorage.getItem('HERILAND_OPEN_DRAWER') === '1') {
    sessionStorage.removeItem('HERILAND_OPEN_DRAWER'); // 用完清掉
    openVIP(); // 打開抽屜（你原本的函式）
  }
});

// ===== Heriland Auth (minimal) =====
(() => {
  const btnOpen = document.getElementById('vipOpenBtn'); // 你現有的「立即登入」按鈕
  const modal   = document.getElementById('hlAuthModal');
  const btnClose= document.getElementById('hlAuthClose');

  const loginView = document.getElementById('hlLoginView');
  const regView   = document.getElementById('hlRegisterView');
  const toast     = document.getElementById('hlToast');

  // login inputs
  const iAcc = document.getElementById('hlLoginAccount');
  const iPwd = document.getElementById('hlLoginPassword');
  const eAcc = document.getElementById('hlLoginAccountErr');
  const ePwd = document.getElementById('hlLoginPasswordErr');

  // register inputs
  const rName = document.getElementById('hlRegName');
  const rAcc  = document.getElementById('hlRegAccount');
  const rPwd  = document.getElementById('hlRegPwd');
  const rPwd2 = document.getElementById('hlRegPwd2');
  const reName= document.getElementById('hlRegNameErr');
  const reAcc = document.getElementById('hlRegAccountErr');
  const rePwd = document.getElementById('hlRegPwdErr');
  const rePwd2= document.getElementById('hlRegPwd2Err');

  const btnDoLogin = document.getElementById('hlDoLogin');
  const btnGoRegister = document.getElementById('hlGoRegister');
  const btnBackToLogin= document.getElementById('hlBackToLogin');
  const btnDoRegister = document.getElementById('hlDoRegister');
  const btnForgot = document.getElementById('hlForgot');
  const quickBtns = [...document.querySelectorAll('.hl-quick-btn')];

  // storage (demo)
  const store = {
    get users(){ try { return JSON.parse(localStorage.getItem('hl_users')||'[]'); } catch(_) { return []; } },
    set users(v){ localStorage.setItem('hl_users', JSON.stringify(v)); },
    get currentUser(){ try { return JSON.parse(localStorage.getItem('hl_currentUser')||'null'); } catch(_) { return null; } },
    set currentUser(v){ localStorage.setItem('hl_currentUser', JSON.stringify(v)); }
  };

  const showModal = ()=> modal.setAttribute('aria-hidden','false');
  const hideModal = ()=> modal.setAttribute('aria-hidden','true');
  const showView  = (k)=>{ loginView.hidden = (k!=='login'); regView.hidden = (k!=='register'); clearErr(); };
  const toastMsg  = (m,ms=1600)=>{ toast.textContent=m; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),ms); };
  const clearErr  = ()=> [eAcc,ePwd,reName,reAcc,rePwd,rePwd2].forEach(n=>n.textContent='');
  const findUser  = (a)=> store.users.find(u => (u.account||'').toLowerCase()===(a||'').toLowerCase());
  const validAccount = (v)=> !!v && (/\d{6,}/.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));

// 登入/註冊成功後呼叫
const goMemberCenter = (user) => {
  // 1) 對外事件（給你其他地方用）
  document.dispatchEvent(new CustomEvent('hl:member:loginSuccess', { detail:{ user } }));

  // 2) 立即切 VIP 卡片到會員視圖（不等別的檔案）
  const vipCard = document.getElementById('vipCard');
  if (vipCard) {
    vipCard.classList.remove('guest');
    vipCard.classList.add('member');
    document.querySelector('.vip-card-guest')?.setAttribute('hidden', '');
    document.querySelector('.vip-card-member')?.removeAttribute('hidden');
  }



  // 4) 關掉登入彈窗 + 還原背景
  hideModal();
};


  // 綁定
  btnOpen?.addEventListener('click', ()=>{ showView('login'); showModal(); });
  btnClose.addEventListener('click', hideModal);
  modal.addEventListener('click', (e)=>{ if(e.target===modal) hideModal(); });

  btnGoRegister.addEventListener('click', ()=> showView('register'));
  btnBackToLogin.addEventListener('click', ()=> showView('login'));
  btnForgot.addEventListener('click', ()=> toastMsg('請與客服聯繫重設密碼'));

  btnDoLogin.addEventListener('click', ()=>{
    clearErr();
    const acc=iAcc.value.trim(), pwd=iPwd.value;
    if(!validAccount(acc)){ eAcc.textContent='請輸入正確的電話或 Email'; return; }
    if(!pwd){ ePwd.textContent='請輸入密碼'; return; }
    const u = findUser(acc);
    if(!u){ toastMsg('查無帳號，請先註冊'); rAcc.value=acc; showView('register'); return; }
    if(u.password!==pwd){ ePwd.textContent='密碼錯誤，請重新輸入'; return; }
    store.currentUser=u; toastMsg('登入成功'); setTimeout(()=>{ hideModal(); goMemberCenter(u); },400);
  });

  btnDoRegister.addEventListener('click', ()=>{
    clearErr();
    const name=rName.value.trim(), acc=rAcc.value.trim(), pwd=rPwd.value, pwd2=rPwd2.value;
    let ok=true;
    if(!name){ reName.textContent='請輸入姓名'; ok=false; }
    if(!validAccount(acc)){ reAcc.textContent='請輸入正確的電話或 Email'; ok=false; }
    if(pwd.length<6){ rePwd.textContent='密碼至少 6 碼'; ok=false; }
    if(pwd!==pwd2){ rePwd2.textContent='兩次密碼不一致'; ok=false; }
    if(!ok) return;
    if(findUser(acc)){ reAcc.textContent='此帳號已存在'; return; }

    const users=store.users; const nu={name,account:acc,password:pwd,createdAt:Date.now()};
    users.push(nu); store.users=users; store.currentUser=nu;
    toastMsg('註冊成功，已自動登入'); setTimeout(()=>{ hideModal(); goMemberCenter(nu); },400);
  });

  quickBtns.forEach(b=>{
    b.addEventListener('click', ()=>{
      const p=b.dataset.provider;
      const demo={name:p.toUpperCase()+' 用戶',account:p+'@demo',password:'',oauth:p};
      store.currentUser=demo; toastMsg(`已透過 ${p} 登入（示意）`);
      setTimeout(()=>{ hideModal(); goMemberCenter(demo); },300);
    });
  });

  // 預置測試帳號
  if(!findUser('test@heriland.app')){
    const users=store.users; users.push({name:'測試用戶',account:'test@heriland.app',password:'123456',createdAt:Date.now()}); store.users=users;
  }
})();




/* ===== Force-bind loginBtn to open Auth Modal ===== */
(function bindLoginBtnToAuthModal(){
  // 1) 找到按鈕
  const oldBtn = document.getElementById('loginBtn');
  if(!oldBtn) return;

  // 2) 移除舊監聽（把節點 clone 一份替換，所有 addEventListener 都會被清乾淨）
  const newBtn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);

  // 3) 小工具
  const showAuthModal = () => {
    const modal = document.getElementById('hlAuthModal');
    if(modal) modal.setAttribute('aria-hidden','false');
  };
  const hideAuthModal = () => {
    const modal = document.getElementById('hlAuthModal');
    if(modal) modal.setAttribute('aria-hidden','true');
  };

  // 👉 換成你原本的「打開 vipPanel / 抽屜」方法
  const openVipPanel = (user) => {
    // A) 你若有現成函式
    // window.openVipPanel && window.openVipPanel(user);

    // B) 或者你之前提到的路由做法
    // location.hash = '#drawer=1';

    // C) 若你的面板是某個元素，需要加上 class 顯示，也可在這裡處理
  };

  // 4) 若已登入，點擊就直接進 vipPanel；否則先開登入窗
  newBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    let current = null;
    try { current = JSON.parse(localStorage.getItem('hl_currentUser') || 'null'); } catch(_){}

    if(current){
      openVipPanel(current);
      return;
    }
    showAuthModal();
  });

  // 5) 監聽登入成功事件：關窗 → 進 vipPanel
  document.addEventListener('hl:member:loginSuccess', (ev) => {
    const user = ev.detail?.user || null;
    hideAuthModal();
    openVipPanel(user);
  });

  // 6) （可選）若你希望載入頁就自動判斷已登入就顯示 vipPanel：
  (function autoOpenIfLoggedInOnce(){
    let current = null;
    try { current = JSON.parse(localStorage.getItem('hl_currentUser') || 'null'); } catch(_){}
    if(current){
      // 取消註解即可開啟自動進入會員中心
      // openVipPanel(current);
    }
  })();
})();

document.querySelector('.social-btn.google')?.addEventListener('click', ()=>{
  console.log('Google signup 點擊');
  // TODO: 呼叫 Google OAuth
});

document.querySelector('.social-btn.apple')?.addEventListener('click', ()=>{
  console.log('Apple signup 點擊');
  // TODO: 呼叫 Apple OAuth
});

document.querySelector('.social-btn.facebook')?.addEventListener('click', ()=>{
  console.log('Facebook signup 點擊');
  // TODO: 呼叫 Facebook OAuth
});


