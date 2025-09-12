/* ==========================================================
   HeriLand 推薦頁 JS（最小可用版）
   - 事件委派：收藏 / 加入 / 不感興趣
   - 分段顯示：有卡片就顯示 section，否則隱藏
   - 空狀態：若任一模組有內容則關閉空狀態
   - 倒數更新：data-countdown 文字自動更新
   - 狀態保存：localStorage（fav / added / hidden）
   - Toast：操作提示「推薦已更新」
   ========================================================== */

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---- Storage helpers ----
  const LS_KEYS = {
    FAV:   'hl_favorites',
    ADD:   'hl_added',
    HIDE:  'hl_hidden'
  };
  const readSet = (key) => new Set(JSON.parse(localStorage.getItem(key) || '[]'));
  const writeSet = (key, set) => localStorage.setItem(key, JSON.stringify(Array.from(set)));

  let favSet  = readSet(LS_KEYS.FAV);
  let addSet  = readSet(LS_KEYS.ADD);
  let hideSet = readSet(LS_KEYS.HIDE);

  // ---- Card identity ----
  function cardId(card) {
    // 盡量取穩定 id，依序嘗試 data-* 或 href
    return card.dataset.expId
        || card.dataset.itineraryId
        || card.dataset.eventId
        || card.dataset.cityId
        || ($('.card-link', card)?.getAttribute('href')) 
        || `anon-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
  }

  // ---- Apply persisted states on load ----
  function applyPersistedStates() {
    $$('.card').forEach(card => {
      const id = cardId(card);
      if (hideSet.has(id)) {
        // 動畫退場後移除
        hideCard(card, {persist:false}); // 已經在集合內，不再重複寫入
        return;
      }
      const btnFav = $('.btn-fav', card);
      const btnAdd = $('.btn-add', card);
      if (btnFav && favSet.has(id)) btnFav.classList.add('is-active');
      if (btnAdd && addSet.has(id)) btnAdd.classList.add('is-added');
    });
  }

  // ---- Section visibility & Empty state ----
  function updateSectionsVisibility() {
    const sections = [
      '#sec-city-for-you',
      '#sec-you-may-like',
      '#sec-trending',
      '#sec-stories',
      '#sec-events'
    ].map(id => $(id)).filter(Boolean);

    let anyShown = false;
    sections.forEach(sec => {
      const hasCards = $$('.card', sec).some(c => !c.classList.contains('is-hidden'));
      if (hasCards) {
        sec.removeAttribute('hidden');
        anyShown = true;
      } else {
        sec.setAttribute('hidden', 'true');
      }
    });

    const empty = $('#empty-state');
    if (empty) {
      if (anyShown) empty.setAttribute('hidden', 'true');
      else empty.removeAttribute('hidden');
    }
  }

  // ---- Toast ----
  let toastTimer = null;
  function toast(msg) {
    let el = $('#hl-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'hl-toast';
      Object.assign(el.style, {
        position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,.74)', color: '#fff', padding: '10px 14px',
        borderRadius: '999px', fontSize: '14px', zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,.25)',
        opacity: '0', transition: 'opacity .18s ease'
      });
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.opacity = '0'; }, 1800);
  }

  // ---- Actions ----
  function toggleFav(card) {
    const id = cardId(card);
    const btn = $('.btn-fav', card);
    if (!btn) return;

    if (btn.classList.toggle('is-active')) {
      favSet.add(id);
    } else {
      favSet.delete(id);
    }
    writeSet(LS_KEYS.FAV, favSet);
  }

  function toggleAdd(card) {
    const id = cardId(card);
    const btn = $('.btn-add', card);
    if (!btn) return;

    if (btn.classList.toggle('is-added')) {
      addSet.add(id);
      // 這裡可觸發實際加入「我的旅程」的 API 呼叫
    } else {
      addSet.delete(id);
      // 這裡可觸發移除 API
    }
    writeSet(LS_KEYS.ADD, addSet);
  }

  function hideCard(card, {persist = true} = {}) {
    const id = cardId(card);
    card.classList.add('is-hidden');
    // 動畫完成後再移除避免占位
    setTimeout(() => {
      card.parentElement && card.parentElement.removeChild(card);
      updateSectionsVisibility();
    }, 220);

    if (persist) {
      hideSet.add(id);
      writeSet(LS_KEYS.HIDE, hideSet);
      toast('推薦已更新');
    }
  }

  // ---- Event delegation ----
  function onClick(e) {
    const target = e.target;

    // 找到最近的 card
    const card = target.closest('.card');
    if (!card) return;

    const actionBtn = target.closest('[data-action]');
    if (!actionBtn) return;

    const action = actionBtn.dataset.action;
    switch (action) {
      case 'fav':  toggleFav(card); break;
      case 'add':  toggleAdd(card); break;
      case 'hide': hideCard(card);  break;
      case 'import':
        // 旅人故事：匯入到我的旅程（此處僅提示，實務接 API）
        toast('已匯入到「我的旅程」');
        break;
    }
  }

  // ---- Countdown (events) ----
  function initCountdown() {
    const nodes = $$('[data-countdown]');
    if (!nodes.length) return;

    function fmt(ms) {
      if (ms <= 0) return '已結束';
      const sec = Math.floor(ms / 1000);
      const d = Math.floor(sec / 86400);
      const h = Math.floor((sec % 86400) / 3600);
      const m = Math.floor((sec % 3600) / 60);
      return d > 0 ? `還剩 ${d} 天 ${h} 小時` : (h > 0 ? `還剩 ${h} 小時 ${m} 分` : `還剩 ${m} 分`);
    }

    function tick() {
      const now = Date.now();
      nodes.forEach(n => {
        const iso = n.getAttribute('data-countdown');
        const end = Date.parse(iso);
        if (!Number.isFinite(end)) return;
        const remain = end - now;
        n.textContent = fmt(remain);
      });
    }

    tick();
    setInterval(tick, 60 * 1000); // 每分鐘更新一次即可（更省電）
  }

  // ---- Keyboard shortcuts (optional QoL) ----
  function onKeydown(e) {
    // 按下 "f" 收藏、"+" 加入、"x" 不感興趣（針對目前 hover 的卡，或第一張）
    const focusCard = document.activeElement?.closest?.('.card') || $('.card');
    if (!focusCard) return;
    if (e.key === 'f') { toggleFav(focusCard); }
    if (e.key === '+') { toggleAdd(focusCard); }
    if (e.key.toLowerCase() === 'x') { hideCard(focusCard); }
  }

  // ---- Boot ----
  function boot() {
    applyPersistedStates();
    updateSectionsVisibility();
    initCountdown();

    // 事件委派掛在 main
    const root = $('#recommend-root');
    if (root) root.addEventListener('click', onClick);

    document.addEventListener('keydown', onKeydown, false);
  }

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();