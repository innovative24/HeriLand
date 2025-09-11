/* Heriland - Favorites (收藏)
   Scope: 只在 #favorites 內生效；不接管抽屜/登入/全站 router */
(function () {
  'use strict';
  const root = document.getElementById('favorites');
  if (!root) return;

  // ------- 小工具 -------
  const $  = (sel, el=root) => el.querySelector(sel);
  const $$ = (sel, el=root) => Array.from(el.querySelectorAll(sel));
  const byId = (id) => document.getElementById(id);

  // DOM 參考
  const listEl   = byId('favList');
  const emptyEl  = byId('favEmpty');
  const tplCard  = byId('tpl-fav-card');
  const selSort  = byId('favSort');
  const selCity  = byId('favCity');
  const selCat   = byId('favCategory');
  const goExplore= byId('favGoExplore');

  // ------- 資料儲存（localStorage） -------
  const LS_KEY = 'hl_favorites';
  function loadFavorites() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    // 首次預設：幾筆示例資料（可刪）
    const demo = [
      { id:'m01', name:'瑪覺咖啡', city:'Taipei', tags:['咖啡', '甜點'], phone:'02-1234-5678', image:'https://picsum.photos/seed/a/128', category:'eat',  createdAt: Date.now()-1000*60*60*2, liked:true },
      { id:'m02', name:'河畔散步', city:'Kuching', tags:['散步', '景點'], phone:'',                image:'https://picsum.photos/seed/b/128', category:'play', createdAt: Date.now()-1000*60*60*24, liked:true },
      { id:'m03', name:'藍灣餐酒館', city:'Hong Kong', tags:['餐酒', '夜景'], phone:'852-2222-3333', image:'https://picsum.photos/seed/c/128', category:'drink', createdAt: Date.now()-1000*60*30, liked:true },
    ];
    saveFavorites(demo);
    return demo;
  }
  function saveFavorites(arr) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch {}
  }

  // 狀態
  let items = loadFavorites();

  // ------- 篩選 / 排序 -------
  function currentFilters() {
    return {
      sort: selSort?.value || 'latest',
      city: selCity?.value || '',
      cat : selCat?.value  || '',
    };
  }
  function applyFilterAndSort() {
    const { sort, city, cat } = currentFilters();
    let data = items.filter(it => it.liked);               // 收藏頁僅顯示 liked=true
    if (city) data = data.filter(it => it.city === city);
    if (cat)  data = data.filter(it => it.category === cat);

    // 排序
    if (sort === 'latest') {
      data.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
    } else if (sort === 'city') {
      data.sort((a,b) => (a.city||'').localeCompare(b.city||'') || (a.name||'').localeCompare(b.name||''));
    } else if (sort === 'category') {
      data.sort((a,b) => (a.category||'').localeCompare(b.category||'') || (a.name||'').localeCompare(b.name||''));
    }
    return data;
  }

  // ------- 下拉選單（城市/類別）動態注入 -------
  function populateFilters() {
    if (selCity) {
      const cities = Array.from(new Set(items.filter(x=>x.liked).map(x=>x.city).filter(Boolean))).sort();
      selCity.innerHTML = `<option value="">全部城市</option>` + cities.map(c=>`<option value="${c}">${c}</option>`).join('');
    }
    if (selCat) {
      // 只補齊已存在的類別（eat/drink/play/fun，如要固定清單可自行寫死）
      const cats = Array.from(new Set(items.filter(x=>x.liked).map(x=>x.category).filter(Boolean))).sort();
      const label = {eat:'吃', drink:'喝', play:'玩', fun:'樂'};
      selCat.innerHTML = `<option value="">全部類別</option>` + cats.map(k=>`<option value="${k}">${label[k]||k}</option>`).join('');
    }
  }

  // ------- 渲染卡片 -------
  function renderList() {
    if (!listEl || !tplCard) return;
    const data = applyFilterAndSort();
    listEl.innerHTML = '';

    if (!data.length) {
      emptyEl && (emptyEl.hidden = false);
      return;
    }
    emptyEl && (emptyEl.hidden = true);

    const frag = document.createDocumentFragment();
    data.forEach(it => frag.appendChild(createCardNode(it)));
    listEl.appendChild(frag);
  }

  function createCardNode(it) {
    const node = tplCard.content.firstElementChild.cloneNode(true);

    node.dataset.id = it.id;

    // 縮圖
    const img = node.querySelector('.thumb-img');
    if (img) {
      img.src = it.image || 'https://picsum.photos/seed/hl/128';
      img.alt = (it.name || '商家') + ' 圖片';
    }

    // 資訊
    node.querySelector('.title').textContent = it.name || '未命名商家';
    const meta = node.querySelector('.meta');
    meta.innerHTML = '';
    // 城市 chip
    const cityChip = document.createElement('span');
    cityChip.className = 'chip city';
    cityChip.textContent = it.city || '—';
    meta.appendChild(cityChip);
    // 標籤 chips
    (it.tags || []).forEach(t => {
      const chip = document.createElement('span');
      chip.className = 'chip tag';
      chip.textContent = t;
      meta.appendChild(chip);
    });

    // 電話
    const telLink = node.querySelector('.tel');
    const phoneWrap = node.querySelector('.phone');
    if (it.phone) {
      telLink.href = `tel:${it.phone}`;
      telLink.textContent = it.phone;
    } else {
      phoneWrap.style.display = 'none';
    }

    // 收藏 ❤️
    const favBtn = node.querySelector('.btn-fav');
    favBtn.setAttribute('aria-pressed', String(!!it.liked));
    favBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      toggleFavorite(it.id, favBtn);
    });

    // 卡片點擊 → 商家詳情（這裡只留掛點，不做實際導航）
    node.querySelector('.thumbnail')?.addEventListener('click', (e)=>{
      e.preventDefault();
      // 之後可換成你的導航：window.showMerchant(it.id) 等
      node.dispatchEvent(new CustomEvent('hl:openMerchant',{bubbles:true, detail:{id:it.id}}));
    });

    return node;
  }

  // ------- 收藏切換（取消後從列表移除） -------
  function toggleFavorite(id, btnEl) {
    const idx = items.findIndex(x => x.id === id);
    if (idx < 0) return;
    const nowLiked = !(!!items[idx].liked);
    items[idx].liked = nowLiked;
    items[idx].createdAt = Date.now();     // 更新時間，用於 "最新收藏" 排序
    saveFavorites(items);

    if (!nowLiked) {
      // 取消收藏：加個小淡出
      const card = btnEl.closest('.fav-card');
      if (card) {
        card.style.transition = 'opacity .2s ease, transform .2s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(.98)';
        setTimeout(()=> {
          card.remove();
          // 若列表空了顯示空狀態
          if (!listEl.children.length) {
            emptyEl && (emptyEl.hidden = false);
          }
          populateFilters(); // 取消後更新城市/類別選項
        }, 200);
      }
    } else {
      // 重新收藏：直接重渲染
      renderList();
      populateFilters();
    }
  }

  // ------- 事件：排序 / 篩選 -------
  selSort?.addEventListener('change', renderList);
  selCity?.addEventListener('change', renderList);
  selCat?.addEventListener('change', renderList);

  // ------- 空狀態：「去探索」回首頁 -------
  goExplore?.addEventListener('click', ()=>{
    // 優先觸發既有首頁按鈕
    const homeBtn = byId('hlGoHome');
    if (homeBtn) homeBtn.click();
    else if (typeof window.goHome === 'function') window.goHome();
    else window.location.href = '/';
  });

  // ------- 首次顯示此子頁時初始化（不接管抽屜返回） -------
  // 若你的 router 會在切頁時派發 hl:view:shown，可用它延遲初始化；
  // 否則直接初始化也沒關係（程式都只在 #favorites 內部運作）
  function init() {
    populateFilters();
    renderList();
  }
  root.addEventListener('hl:view:shown', init, { once:true });
  // 若沒有發 hl:view:shown，也能保險初始化（例如直接進入此頁）
  if (!document.hidden) setTimeout(init, 0);
})();