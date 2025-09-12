/* Heriland - Badges page only
   Scope: #badges 內元素；不接管全站路由/抽屜/登入 */
(function(){
  'use strict';

  const root = document.getElementById('badges');
  if (!root) return;

  // ---------- DOM helpers (scoped to #badges) ----------
  const $  = (sel, el=root) => el.querySelector(sel);
  const $$ = (sel, el=root) => Array.from(el.querySelectorAll(sel));

  // Panels & tabs
  const tabs = $$('.badge-tabs .tab');
  const panels = $$('.badge-panel');

  // Grids & counters
  const grid = {
    city: $('#badgeGridCity'),
    exp:  $('#badgeGridExp'),
    mil:  $('#badgeGridMil'),
    spec: $('#badgeGridSpec')
  };
  const count = {
    city: { got: $('#cityUnlocked'), total: $('#cityTotal') },
    exp:  { got: $('#expUnlocked'),  total: $('#expTotal')  },
    mil:  { got: $('#milUnlocked'),  total: $('#milTotal')  },
    spec: { got: $('#specUnlocked'), total: $('#specTotal') },
  };
  const emptyEl = {
    city: $('#badgeEmptyCity'),
    exp:  $('#badgeEmptyExp'),
    mil:  $('#badgeEmptyMil'),
    spec: $('#badgeEmptySpec'),
  };

  // Sheet / backdrop elements
  const backdrop   = $('#badgeBackdrop');
  const sheet      = $('#badgeSheet');
  const sheetClose = $('#badgeClose');
  const sheetTitle = $('#badgeTitle');
  const sheetHero  = $('#badgeHero');
  const sheetRule  = $('#badgeRule');
  const sheetDate  = $('#badgeDate');
  const btnShare   = $('#badgeShare');
  const btnPin     = $('#badgePin');

  // Template
  const tplItem = $('#tpl-badge-item');

  // ---------- Local storage (unlocked & pinned) ----------
  const LS_UNLOCK = 'hl_badges_unlocked'; // { [id]: "YYYY-MM-DD" }
  const LS_PINNED = 'hl_badges_pinned';   // [id, id...]

  function loadJSON(key, fallback){
    try { const v = JSON.parse(localStorage.getItem(key) || ''); return v ?? fallback; }
    catch { return fallback; }
  }
  function saveJSON(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  const unlockedMap = new Map(Object.entries(loadJSON(LS_UNLOCK, {}))); // id -> date
  const pinnedSet   = new Set(loadJSON(LS_PINNED, []));

  // ---------- Data shape ----------
  // item: { id, name, icon, category: city|exp|milestone|special, theme?, tier?: gold|silver, rule, unlockedAt? }
  // *若 unlockedAt 提供，將與本地 storage 合併，以 storage 為準
  const state = {
    city: [], exp: [], mil: [], spec: []
  };

  // ---------- Public API ----------
  window.HLBadges = {
    /** 設定四類徽章資料（可分批） */
    setData(blocks){
      ['city','exp','mil','spec'].forEach(k=>{
        if (Array.isArray(blocks?.[k])) state[k] = blocks[k].map(normalizeItem);
      });
      renderAll();
    },
    /** 解鎖徽章（會觸發動畫與更新進度） */
    unlock(id, dateStr){
      const date = dateStr || toYMD(new Date());
      unlockedMap.set(String(id), date);
      saveJSON(LS_UNLOCK, Object.fromEntries(unlockedMap));
      // 找到卡片做動畫 & 更新日期
      const card = root.querySelector(`.badge-card[data-badge-id="${cssEscape(id)}"]`);
      if (card){
        card.setAttribute('data-unlocked', 'true');
        card.classList.add('unlocked-anim');
        const dateEl = card.querySelector('.badge-state .date');
        if (dateEl){ dateEl.textContent = date; dateEl.hidden = false; }
        setTimeout(()=> card.classList.remove('unlocked-anim'), 700);
      }
      updateProgress();
    },
    /** 取得已解鎖 id 陣列 */
    getUnlocked(){ return Array.from(unlockedMap.keys()); },
    /** 置頂/取消置頂（會員中心展示） */
    togglePin(id){
      if (pinnedSet.has(id)) pinnedSet.delete(id); else pinnedSet.add(id);
      saveJSON(LS_PINNED, Array.from(pinnedSet));
      return pinnedSet.has(id);
    },
    getPinned(){ return Array.from(pinnedSet); }
  };

  function normalizeItem(it){
    const id = String(it.id);
    const unlockedAt = unlockedMap.get(id) || it.unlockedAt || null;
    return {
      id,
      name: it.name || '未命名徽章',
      icon: it.icon || '',               // 建議給 PNG/SVG
      category: it.category || 'city',   // city|exp|milestone|special
      theme: it.theme || '',             // 例如 kuching/sibu/miri/food/culture/nature...
      tier: it.tier || null,             // gold|silver|null
      rule: it.rule || '探索完成指定條件即可解鎖',
      unlockedAt,
    };
  }

  // ---------- Render ----------
  function renderAll(){
    renderCategory('city', state.city);
    renderCategory('exp',  state.exp);
    renderCategory('mil',  state.mil);
    renderCategory('spec', state.spec);

    updateProgress();
    ensureEmptyStates();
  }

  function renderCategory(key, list){
    const ul = grid[key];
    if (!ul || !tplItem) return;
    ul.innerHTML = '';

    // 更新總數顯示
    if (count[key]?.total) count[key].total.textContent = String(list.length || 0);

    for (const it of list){
      const li  = tplItem.content.firstElementChild.cloneNode(true);
      const btn = li.querySelector('.badge-card');
      const ico = li.querySelector('.badge-icon img');
      const nameEl = li.querySelector('.badge-name');
      const stateEl= li.querySelector('.badge-state');
      const dateEl = li.querySelector('.badge-state .date');

      btn.dataset.badgeId = it.id;
      btn.dataset.category = mapCat(it.category); // 對應 CSS 規則
      if (it.theme) btn.dataset.theme = it.theme;
      if (it.tier)  btn.dataset.tier  = it.tier;

      if (ico && it.icon) { ico.src = it.icon; ico.alt = it.name; }
      if (nameEl) nameEl.textContent = it.name;

      const unlocked = !!it.unlockedAt;
      btn.setAttribute('data-unlocked', String(unlocked));
      stateEl?.setAttribute('data-unlocked', String(unlocked));
      if (dateEl){
        if (unlocked){ dateEl.textContent = toYMD(it.unlockedAt); dateEl.hidden = false; }
        else { dateEl.hidden = true; }
      }

      // 點擊 → 開啟詳情彈窗
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        openSheet(it);
      });

      ul.appendChild(li);
    }
  }

  function updateProgress(){
    ['city','exp','mil','spec'].forEach(key=>{
      const list = state[key] || [];
      const got = list.reduce((n, it)=> n + (it.unlockedAt ? 1 : 0), 0);
      if (count[key]?.got) count[key].got.textContent = String(got);
      if (count[key]?.total) count[key].total.textContent = String(list.length);
    });
  }

  function ensureEmptyStates(){
    Object.entries(emptyEl).forEach(([key, el])=>{
      if (!el) return;
      const list = state[key] || [];
      const hasAny = list.length > 0;
      el.hidden = hasAny;
    });
  }

  function mapCat(c){
    // 與 CSS 對齊（milestone 對應 mil）
    if (c === 'milestone' || c === 'mil') return 'milestone';
    if (c === 'special') return 'special';
    if (c === 'exp' || c === 'experience') return 'exp';
    return 'city';
  }

  // ---------- Sheet (dialog) ----------
  let currentBadge = null;

  function openSheet(it){
    currentBadge = it;
    sheetTitle.textContent = it.name;
    sheetHero.src = it.icon || '';
    sheetRule.textContent = it.rule || '探索完成指定條件即可解鎖';
    sheetDate.textContent = it.unlockedAt ? toYMD(it.unlockedAt) : '—';

    backdrop.hidden = false;
    sheet.hidden = false;
    sheet.classList.add('open');

    // 焦點管理
    setTimeout(()=> sheet.querySelector('#badgeClose')?.focus(), 0);
  }
  function closeSheet(){
    sheet.classList.remove('open');
    sheet.hidden = true;
    backdrop.hidden = true;
    currentBadge = null;
  }

  backdrop?.addEventListener('click', closeSheet);
  sheetClose?.addEventListener('click', closeSheet);
  document.addEventListener('keydown', (e)=>{
    if (sheet.hidden) return;
    if (e.key === 'Escape') closeSheet();
  });

  // 分享 / 置頂（交給外部處理，這裡派發事件；也做本地 pinned 狀態）
  btnShare?.addEventListener('click', ()=>{
    if (!currentBadge) return;
    // 全站可監聽這個事件生成卡片圖像
    root.dispatchEvent(new CustomEvent('hl:badge:share', {bubbles:true, detail: { badge: currentBadge }}));
  });
  btnPin?.addEventListener('click', ()=>{
    if (!currentBadge) return;
    const pinned = HLBadges.togglePin(currentBadge.id);
    root.dispatchEvent(new CustomEvent('hl:badge:pin', {bubbles:true, detail:{ id: currentBadge.id, pinned }}));
    // 簡單提示（交給全站 toast）
    root.dispatchEvent(new CustomEvent('hl:toast', {bubbles:true, detail:{ type:'success', text: pinned? '已展示在會員中心' : '已取消展示' }}));
  });

  // ---------- Tabs ----------
  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      const id = tab.id.replace(/^tab-/, 'panel-');
      tabs.forEach(t => t.setAttribute('aria-selected', String(t===tab)));
      panels.forEach(p => p.hidden = (p.id !== id));
    });
  });

  // ---------- Scroll 微縮放（輕量） ----------
  const content = $('.content');
  let raf = 0;
  content?.addEventListener('scroll', ()=>{
    if (raf) return;
    raf = requestAnimationFrame(()=>{
      raf = 0;
      // 只針對可見面板做微縮放（靠近視口中心的徽章稍微放大）
      const panel = panels.find(p => !p.hidden);
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      const centerY = rect.top + rect.height/2;
      $$('.badge-card', panel).forEach(card=>{
        const r = card.getBoundingClientRect();
        const dy = Math.abs((r.top + r.height/2) - centerY);
        // 0 ~ 1 範圍內映射，最多 +2% 規模
        const t = Math.max(0, 1 - dy / (window.innerHeight*0.8));
        const scale = 1 + t * 0.02;
        card.style.transform = `scale(${scale.toFixed(3)})`;
      });
    });
  }, { passive:true });

  // ---------- Utils ----------
  function toYMD(d){
    const dt = (d instanceof Date) ? d : new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,'0');
    const da= String(dt.getDate()).padStart(2,'0');
    return `${y}/${m}/${da}`;
  }
  function cssEscape(id){
    // 簡化版本：只處理最常見情況
    return String(id).replace(/"/g, '\\"');
  }

  // ---------- First render ----------
  let inited = false;
  root.addEventListener('hl:view:shown', ()=>{
    if (inited) { renderAll(); return; }
    inited = true;

    // 若外部尚未 setData，就用 demo 讓你先看樣式
    const totalNow = state.city.length + state.exp.length + state.mil.length + state.spec.length;
    if (!totalNow){
      HLBadges.setData(demoData());
    } else {
      renderAll();
    }
  }, { once:true });

  // ---------- Demo data (可刪) ----------
  function demoIcon(color='#1e6b5b'){
    // 簡單彩色圓圖示（替代真實 SVG/PNG）
    const svg = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <defs><radialGradient id="g" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fff" stop-opacity=".9"/><stop offset="100%" stop-color="${color}"/>
        </radialGradient></defs>
        <circle cx="60" cy="60" r="56" fill="url(#g)"/>
        <circle cx="60" cy="60" r="32" fill="rgba(255,255,255,.25)"/>
      </svg>`
    );
    return `data:image/svg+xml;charset=utf-8,${svg}`;
  }
  function demoData(){
    const today = toYMD(new Date());
    return {
      city: [
        { id:'c-kuching', name:'貓城守護者', icon: demoIcon('#1e6b5b'), category:'city', theme:'kuching', tier:'gold', rule:'完成古晉任一商家足跡', unlockedAt: today },
        { id:'c-sibu',    name:'詩巫探索者', icon: demoIcon('#2a7ea8'), category:'city', theme:'sibu',    tier:'silver', rule:'完成詩巫任一商家足跡' },
        { id:'c-miri',    name:'美里賞景家', icon: demoIcon('#3a6dde'), category:'city', theme:'miri',    rule:'完成美里任一商家足跡' },
        { id:'c-kch-food',name:'古晉美食王', icon: demoIcon('#ff8a3d'), category:'city', theme:'kuching', rule:'在古晉收藏 3 間餐廳' },
      ],
      exp: [
        { id:'e-food',    name:'美食達人',   icon: demoIcon('#ff8a3d'), category:'exp', theme:'food',    rule:'收藏 5 間美食', unlockedAt: today },
        { id:'e-culture', name:'文化玩家',   icon: demoIcon('#8c6ad6'), category:'exp', theme:'culture', rule:'完成 3 個文化景點' },
        { id:'e-nature',  name:'自然行者',   icon: demoIcon('#3aa676'), category:'exp', theme:'nature',  rule:'完成 3 個自然景點' },
      ],
      mil: [
        { id:'m-10', name:'旅程里程碑·10', icon: demoIcon('#c9d1d9'), category:'milestone', tier:'silver', rule:'完成 10 個足跡' },
        { id:'m-50', name:'旅程里程碑·50', icon: demoIcon('#f6c350'), category:'milestone', tier:'gold',   rule:'完成 50 個足跡' },
      ],
      spec: [
        { id:'s-rainbow', name:'彩虹探險家', icon: demoIcon('#65c7f7'), category:'special', theme:'rainbow', rule:'參與特別活動一次' }
      ]
    };
  }
})();