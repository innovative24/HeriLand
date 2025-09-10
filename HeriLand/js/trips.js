
(function(){
  const trips = document.getElementById('trips');
  if(!trips) return;

  // --- Tabs 切換 + 指示線 ---
  const tabs = Array.from(trips.querySelectorAll('.tabs .tab'));
  const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
  function setActive(i){
    tabs.forEach((t, k) => t.setAttribute('aria-selected', String(k===i)));
    panels.forEach((p, k) => p.classList.toggle('active', k===i));
    // 移動底部指示線
    const bar = trips.querySelector('.tabs::after'); // 無法直接存到偽元素，改用 transform 置換
    const r = tabs[i].getBoundingClientRect();
    const pLeft = tabs[i].parentElement.getBoundingClientRect().left;
    const el = tabs[i].parentElement; // 用 style 設 CSS 變數控制偽元素位置
    el.style.setProperty('--bar-x', (r.left - pLeft + r.width/2) + 'px');
    el.style.setProperty('--bar-w', Math.max(28, r.width * .45) + 'px');
    // 用於 CSS 的 transform，見下方一個小補丁
    const after = el; // nothing to do
  }
  // 用 CSS 變數控制偽元素
  const tabsNav = trips.querySelector('.tabs');
  tabsNav.style.setProperty('--bar-x','20px');
  tabsNav.style.setProperty('--bar-w','28px');
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #trips .tabs::after{ left:calc(var(--bar-x) - var(--bar-w)/2); width:var(--bar-w); }
  `;
  document.head.appendChild(styleEl);

  tabs.forEach((t, i)=> t.addEventListener('click', ()=> setActive(i)));

  // 初次顯示時定位
  trips.addEventListener('hl:view:shown', ()=> setActive(0), {once:true});

  // --- 分享 Sheet ---
  const sheet = document.getElementById('sheet');
  const backdrop = document.getElementById('backdrop');
  const openSheet = document.getElementById('openSheet');
  const closeSheet = document.getElementById('closeSheet');
  function open(){ sheet.classList.add('open'); backdrop.classList.add('show'); }
  function close(){ sheet.classList.remove('open'); backdrop.classList.remove('show'); }
  openSheet?.addEventListener('click', open);
  closeSheet?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });

  // --- 想去的地方：新增／清空（最小版示例） ---
  const list = document.getElementById('wishList');
  const tpl = document.getElementById('tpl-wish-card');
  function addCard({title, city, tag, note}){
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('.title').textContent = title || '未命名地點';
    node.querySelector('.city').textContent = city || '—';
    node.querySelector('.tag').textContent = tag || '地點';
    node.querySelector('.note').textContent = note ? ('備註：' + note) : ' ';
    node.querySelector('.created').textContent = new Date().toISOString().slice(0,10);
    node.querySelector('.btn-delete').addEventListener('click', ()=> node.remove());
    list.prepend(node);
  }
  document.getElementById('btnAddWish')?.addEventListener('click', ()=>{
    addCard({
      title: document.getElementById('wishTitle').value.trim(),
      city:  document.getElementById('wishCity').value.trim(),
      tag:   document.getElementById('wishTag').value.trim(),
      note:  document.getElementById('wishNote').value.trim()
    });
  });
  document.getElementById('btnClearWish')?.addEventListener('click', ()=> list.innerHTML='');

  // --- 拖曳排序（簡易版） ---
  let dragEl=null;
  list.addEventListener('dragstart', e=>{
    dragEl = e.target.closest('.place-card'); if(!dragEl) return;
    e.dataTransfer.effectAllowed='move';
    dragEl.style.opacity='.6';
  });
  list.addEventListener('dragend', ()=>{ if(dragEl){ dragEl.style.opacity=''; dragEl=null; }});
  list.addEventListener('dragover', e=>{
    e.preventDefault();
    const card = e.target.closest('.place-card');
    if(!card || card===dragEl) return;
    const rect = card.getBoundingClientRect();
    const before = (e.clientY - rect.top) < rect.height/2;
    card[before ? 'before' : 'after'](dragEl);
  });
})();


/* vip-gate-router.js  —  未登入攔截 + 切頁 + 登入後自動導回 */
(function () {
  'use strict';

  const $$  = (s) => Array.from(document.querySelectorAll(s));
  const $id = (id) => document.getElementById(id);

  // 白名單：不需登入也可進的頁（你要再放行別的就加）
  const WHITE = new Set(['settings']);

  function isLoggedIn() {
    const card = $id('vipCard');
    const hasUser = !!localStorage.getItem('hl_currentUser');
    return !!(card && card.classList.contains('member') && hasUser);
  }

  function showAuthLogin() {
    $id('hlAuthModal')?.setAttribute('aria-hidden', 'false');
  }

  // 只顯示一個視圖（後備，若沒動畫函式就用這個）
  function forceSingle(nextEl) {
    $$('.vip-view').forEach(v => {
      if (v === nextEl) { v.classList.add('show'); v.removeAttribute('hidden'); }
      else { v.classList.remove('show'); v.setAttribute('hidden',''); }
    });
  }

  // 切頁：優先用你在 vip.js 暴露的 window.showView；否則用後備
  function showViewById(id, direction='forward') {
    const el = $id(id);
    if (!el) return;
    if (typeof window.showView === 'function') window.showView(el, direction);
    else forceSingle(el);
    // 通知子頁做懶載入
    el.dispatchEvent(new CustomEvent('hl:view:shown', { bubbles:true, detail:{ id } }));
  }

  // ➊ 功能鍵：未登入→彈窗；已登入→切頁
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.feature-card[data-target]');
    if (!btn) return;

    const id = btn.getAttribute('data-target');
    const whitelisted = WHITE.has(id);

    if (!whitelisted && !isLoggedIn()) {
      e.preventDefault(); e.stopImmediatePropagation();   // 不讓其他 handler 先切頁
      window._hlPendingTarget = id;                       // 登入後要導回的頁
      showAuthLogin();
      return;
    }

    e.preventDefault(); e.stopImmediatePropagation();
    showViewById(id, 'forward');
  }, true); // capture=true，確保最先處理

  // ➋ 返回鍵
  document.addEventListener('click', (e) => {
    const back = e.target.closest('[data-back]');
    if (!back) return;
    e.preventDefault(); e.stopImmediatePropagation();
    showViewById('vipDashboard', 'back');
  }, true);

  // ➌ 監看登入完成後自動導回（觀察 #vipCard 變成 member）
  const card = $id('vipCard');
  if (card) {
    const tryGo = () => {
      const target = window._hlPendingTarget;
      if (target && isLoggedIn()) {
        window._hlPendingTarget = null;
        setTimeout(() => showViewById(target, 'forward'), 50);
      }
    };
    new MutationObserver(tryGo).observe(card, { attributes:true, attributeFilter:['class'] });
    document.addEventListener('hl:member:loginSuccess', tryGo);
  }

  // ➍ 初始化：只顯示 Dashboard
  document.addEventListener('DOMContentLoaded', () => {
    const dash = $id('vipDashboard');
    if (dash) forceSingle(dash);
  });
})();