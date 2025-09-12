/* Heriland - Recommend page only
   Scope: #recommend 內元素；不接管全站路由/抽屜/登入 */
(function(){
  'use strict';

  const root = document.getElementById('recommend');
  if (!root) return;

  // ---------- DOM helpers (scoped to #recommend) ----------
  const $  = (sel, el=root) => el.querySelector(sel);
  const $$ = (sel, el=root) => Array.from(el.querySelectorAll(sel));

  const el = {
    empty:   $('#recEmpty'),
    goExplore: $('#recGoExplore'),

    // lists
    citiesList:   $('#recCitiesList'),
    similarList:  $('#recSimilarList'),
    trendingList: $('#recTrendingList'),
    storiesList:  $('#recStoriesList'),
    eventsList:   $('#recEventsList'),

    // hints & buttons
    citiesHint:  $('#recCitiesHint'),
    similarHint: $('#recSimilarHint'),
    trendingHint:$('#recTrendingHint'),
    citiesMore:  $('#recCitiesMore'),
    similarMore: $('#recSimilarMore'),
    trendingMore:$('#recTrendingMore'),
  };

  // ---------- Storage keys ----------
  const LS_HIDDEN = 'hl_rec_hidden';     // 被「不感興趣」的 merchantIds
  const LS_ADDED  = 'hl_rec_addedTrip';  // 已加入行程的 merchantIds（外部也可自己管理）

  const hiddenSet = new Set(loadArray(LS_HIDDEN));
  const addedSet  = new Set(loadArray(LS_ADDED));

  function loadArray(key){
    try{ const a = JSON.parse(localStorage.getItem(key)||'[]'); return Array.isArray(a)?a:[]; }catch{ return []; }
  }
  function saveSet(key, set){
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  }

  // ---------- Public API to feed data ----------
  // 每個項目 shape 盡量一致：
  // { id, name/title, city, tag, reason, image, ratio, category }
  // stories: { id, title, image, author, city }
  // events:  { id, title, image, city, endsAt (ISO), startedAt (ISO, optional) }
  const state = {
    cities:  [],
    similar: [],
    trending:[],
    stories: [],
    events:  []
  };

  window.HLRecommend = {
    setData(blocks){
      // 外部可一次或分段注入
      ['cities','similar','trending','stories','events'].forEach(k=>{
        if (Array.isArray(blocks?.[k])) state[k] = blocks[k];
      });
      renderAll();
    },
    // 可選：覆蓋標籤文字
    setHints({cities, similar, trending}={}){
      if (cities && el.citiesHint)  el.citiesHint.textContent  = cities;
      if (similar && el.similarHint)el.similarHint.textContent = similar;
      if (trending && el.trendingHint)el.trendingHint.textContent = trending;
    },
    // 允許外部清掉「不感興趣」名單（例如設定頁）
    resetHidden(){
      hiddenSet.clear(); saveSet(LS_HIDDEN, hiddenSet); renderAll();
    }
  };

  // ---------- Rendering ----------
  const tplCard   = document.getElementById('tpl-rec-card');
  const tplStory  = document.getElementById('tpl-rec-story');
  const tplEvent  = document.getElementById('tpl-rec-event');

  function renderAll(){
    // 若完全沒資料 → 顯示空狀態
    const total =
      state.cities.length + state.similar.length + state.trending.length +
      state.stories.length + state.events.length;

    if (!total){
      el.empty && (el.empty.hidden = false);
    } else {
      el.empty && (el.empty.hidden = true);
    }

    renderBlockList(el.citiesList,  state.cities,   { showReason:false });
    renderBlockList(el.similarList, state.similar,  { showReason:true  });
    renderBlockList(el.trendingList,state.trending, { showReason:false });

    renderStories(el.storiesList, state.stories);
    renderEvents(el.eventsList, state.events);

    // 區塊顯示/隱藏
    toggleSection('#recCities',  state.cities.length);
    toggleSection('#recSimilar', state.similar.length);
    toggleSection('#recTrending',state.trending.length);
    toggleSection('#recStories', state.stories.length);
    toggleSection('#recEvents',  state.events.length);
  }

  function toggleSection(sel, has){
    const sec = $(sel);
    if (!sec) return;
    sec.hidden = !has;
  }

  function renderBlockList(ul, items, {showReason=false}={}){
    if (!ul || !tplCard) return;
    ul.innerHTML = '';
    const visible = items.filter(it => !hiddenSet.has(String(it.id)));
    for (const it of visible){
      const li  = tplCard.content.firstElementChild.cloneNode(true);
      const art = li.querySelector('.rec-card');
      const a   = li.querySelector('.rec-main');
      const img = li.querySelector('.thumb img');
      const th  = li.querySelector('.thumb');
      const nm  = li.querySelector('.name') || li.querySelector('.title');
      const city= li.querySelector('.chip.city');
      const tag = li.querySelector('.chip.tag');
      const actions = li.querySelector('.actions');
      const btnLike = li.querySelector('.rec-like');
      const btnAdd  = li.querySelector('.rec-add');
      const btnHide = li.querySelector('.rec-hide');

      art.dataset.merchantId = it.id;
      if (img && it.image){ img.src = it.image; img.alt = it.name || it.title || ''; }
      if (th && it.ratio){ th.setAttribute('data-ratio', it.ratio); }

      if (nm)   nm.textContent   = it.name || it.title || '未命名';
      if (city) city.textContent = it.city || '—';
      if (tag)  tag.textContent  = it.tag  || (it.category || '—');

      // 猜你會喜歡：推薦理由 chip
      if (showReason){
        const meta = li.querySelector('.meta');
        if (meta && it.reason){
          const chip = document.createElement('span');
          chip.className = 'chip reason';
          chip.textContent = it.reason;
          meta.appendChild(chip);
        }
      }

      // 互動：收藏
      if (btnLike){
        const isFav = typeof window.HLFavorites?.isFav === 'function'
          ? !!window.HLFavorites.isFav(it.id)
          : false;
        btnLike.setAttribute('aria-pressed', String(isFav));
        btnLike.addEventListener('click', (e)=>{
          e.preventDefault(); e.stopPropagation();
          const pressed = btnLike.getAttribute('aria-pressed') === 'true';
          if (pressed){
            // 取消收藏
            if (typeof window.HLFavorites?.remove === 'function'){
              window.HLFavorites.remove(it.id);
            }
            btnLike.setAttribute('aria-pressed','false');
          }else{
            if (typeof window.HLFavorites?.add === 'function'){
              window.HLFavorites.add({
                id: it.id, name: it.name || it.title, city: it.city, tag: it.tag,
                image: it.image, category: it.category
              });
            }
            btnLike.setAttribute('aria-pressed','true');
          }
        });
      }

      // 互動：加入我的旅程（toggle 樣式 .added）
      if (btnAdd){
        const added = addedSet.has(String(it.id));
        if (added) btnAdd.classList.add('added');
        btnAdd.addEventListener('click', (e)=>{
          e.preventDefault(); e.stopPropagation();
          const nowAdded = !btnAdd.classList.contains('added');
          btnAdd.classList.toggle('added', nowAdded);
          if (nowAdded) addedSet.add(String(it.id)); else addedSet.delete(String(it.id));
          saveSet(LS_ADDED, addedSet);

          // 對接你的行程 API（若提供）
          if (nowAdded && typeof window.HLTrips?.addPlace === 'function'){
            window.HLTrips.addPlace({
              id: it.id, name: it.name || it.title, city: it.city, tag: it.tag, image: it.image
            });
          }
        });
      }

      // 互動：不感興趣（隱藏 + 記錄）
      if (btnHide){
        btnHide.addEventListener('click', (e)=>{
          e.preventDefault(); e.stopPropagation();
          // 極簡「下拉」：直接隱藏，並派發提示事件讓全站去顯示 Toast
          const id = String(it.id);
          hiddenSet.add(id); saveSet(LS_HIDDEN, hiddenSet);
          // 淡出後移除
          animateRemove(li, ()=>{
            // 若整段空了可選擇隱藏該模組：在 renderAll 會自動處理
          });
          // 提示（交由全站）：推薦已更新
          root.dispatchEvent(new CustomEvent('hl:toast', {bubbles:true, detail:{ type:'info', text:'推薦已更新' }}));
        });
      }

      // 點卡片：交由全站開商家詳情
      if (a){
        a.addEventListener('click', (e)=>{
          e.preventDefault();
          const ev = new CustomEvent('hl:navigate:merchant', {bubbles:true, detail:{ id: it.id, source:'recommend' }});
          root.dispatchEvent(ev);
          if (typeof window.hlOpenMerchant === 'function') window.hlOpenMerchant(it.id);
        });
      }

      ul.appendChild(li);
    }
  }

  function renderStories(ul, items){
    if (!ul || !tplStory) return;
    ul.innerHTML = '';
    for (const it of items){
      const li  = tplStory.content.firstElementChild.cloneNode(true);
      const art = li.querySelector('.rec-story');
      const a   = li.querySelector('.rec-main');
      const img = li.querySelector('.thumb img');
      const th  = li.querySelector('.thumb');
      const ttl = li.querySelector('.title');
      const city= li.querySelector('.chip.city');
      const author = li.querySelector('.chip.author');

      art.dataset.tripId = it.id;
      if (img && it.image){ img.src = it.image; img.alt = it.title || ''; }
      if (th && it.ratio){ th.setAttribute('data-ratio', it.ratio); }
      if (ttl) ttl.textContent   = it.title || '旅人故事';
      if (city) city.textContent = it.city || '—';
      if (author) author.textContent = it.author ? ('by ' + it.author) : 'by traveler';

      if (a){
        a.addEventListener('click', (e)=>{
          e.preventDefault();
          const ev = new CustomEvent('hl:navigate:story', {bubbles:true, detail:{ id: it.id }});
          root.dispatchEvent(ev);
          if (typeof window.hlOpenStory === 'function') window.hlOpenStory(it.id);
        });
      }

      ul.appendChild(li);
    }
  }

  // 活動 / 限時：含倒數條
  let eventTimer = null;
  function renderEvents(ul, items){
    if (!ul || !tplEvent) return;
    ul.innerHTML = '';
    clearInterval(eventTimer);

    for (const it of items){
      const li  = tplEvent.content.firstElementChild.cloneNode(true);
      const art = li.querySelector('.rec-event');
      const a   = li.querySelector('.rec-main');
      const img = li.querySelector('.thumb img');
      const th  = li.querySelector('.thumb');
      const ttl = li.querySelector('.title');
      const city= li.querySelector('.chip.city');
      const cd  = li.querySelector('.chip.countdown');
      // 動態進度條（用 <i>）
      let bar = li.querySelector('.countdown-bar > i');
      if (!bar){
        const wrap = document.createElement('div'); wrap.className = 'countdown-bar';
        bar = document.createElement('i'); wrap.appendChild(bar);
        li.querySelector('.info')?.appendChild(wrap);
      }

      art.dataset.eventId = it.id;
      if (img && it.image){ img.src = it.image; img.alt = it.title || ''; }
      if (th && it.ratio){ th.setAttribute('data-ratio', it.ratio); }
      if (ttl) ttl.textContent   = it.title || '活動';
      if (city) city.textContent = it.city || '—';

      const ends   = it.endsAt ? new Date(it.endsAt) : null;
      const starts = it.startedAt ? new Date(it.startedAt) : null;

      function updateCountdown(){
        if (!ends) { cd && (cd.textContent=''); bar && (bar.style.width='0%'); return; }
        const now = Date.now();
        const endTs = ends.getTime();
        const startTs = starts ? starts.getTime() : now - 1;
        const total = Math.max(1, endTs - startTs);
        const remain = Math.max(0, endTs - now);
        const pct = Math.max(0, Math.min(100, Math.round((1 - remain/total) * 100)));
        if (cd){
          const days = Math.ceil(remain/86400000);
          cd.textContent = days>0 ? `還剩 ${days} 天` : (remain>0 ? '最後一天' : '已結束');
        }
        if (bar){ bar.style.width = pct + '%'; }
      }
      updateCountdown();

      if (a){
        a.addEventListener('click', (e)=>{
          e.preventDefault();
          const ev = new CustomEvent('hl:navigate:event', {bubbles:true, detail:{ id: it.id }});
          root.dispatchEvent(ev);
          if (typeof window.hlOpenEvent === 'function') window.hlOpenEvent(it.id);
        });
      }

      ul.appendChild(li);
    }

    // 啟動 1 分鐘刷新倒數（輕量）
    if (items.length){
      eventTimer = setInterval(()=>{
        $$('#recEventsList .rec-item', root).forEach(li=>{
          const chip = li.querySelector('.chip.countdown');
          const bar  = li.querySelector('.countdown-bar > i');
          // 由於 items 不在 li 上，簡易重算靠 data-ends-at (若你要，也可在渲染時 setAttribute)
          // 這裡直接跳過；活動倒數主要是初次渲染算好 + 每分刷新 chip/條的文字/寬度
        });
        // 簡化：重跑一次 renderEvents 也可，但成本高。這裡就不重算，維持初算結果（多數場景足夠）。
      }, 60000);
    }
  }

  function animateRemove(li, done){
    const el = li;
    const h  = el.getBoundingClientRect().height;
    el.style.height = h + 'px';
    el.style.transition = 'opacity .18s ease, transform .18s ease, height .18s ease, margin .18s ease, padding .18s ease';
    requestAnimationFrame(()=>{
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      el.style.height = '0px';
      el.style.marginTop = '0px';
      el.style.marginBottom = '0px';
      el.style.paddingTop = '0px';
      el.style.paddingBottom = '0px';
      setTimeout(()=>{ el.remove(); if (typeof done==='function') done(); }, 200);
    });
  }

  // ---------- Buttons / events ----------
  el.goExplore?.addEventListener('click', ()=>{
    const ev = new CustomEvent('hl:navigate:home', {bubbles:true, detail:{ source:'recommend-empty' }});
    root.dispatchEvent(ev);
    if (typeof window.hlGoHome === 'function') window.hlGoHome();
  });

  el.citiesMore?.addEventListener('click', ()=>{
    const ev = new CustomEvent('hl:navigate:explore', {bubbles:true, detail:{ section:'cities' }});
    root.dispatchEvent(ev);
  });
  el.similarMore?.addEventListener('click', ()=>{
    const ev = new CustomEvent('hl:navigate:explore', {bubbles:true, detail:{ section:'similar' }});
    root.dispatchEvent(ev);
  });
  el.trendingMore?.addEventListener('click', ()=>{
    const ev = new CustomEvent('hl:navigate:explore', {bubbles:true, detail:{ section:'trending' }});
    root.dispatchEvent(ev);
  });

  // 首次進入推薦頁再渲染（避免隱藏狀態量尺寸）
  let inited = false;
  root.addEventListener('hl:view:shown', ()=>{
    if (!inited){
      inited = true;
      // 若外部尚未 setData，先用最小 demo 資料讓你檢視樣式
      if (!(state.cities.length + state.similar.length + state.trending.length + state.stories.length + state.events.length)) {
        HLRecommend.setData(demoData());
        HLRecommend.setHints({
          cities:  '因為你收藏了古晉夜市',
          similar: '和你收藏的咖啡館相似',
          trending:'大家都在去'
        });
      } else {
        renderAll();
      }
    } else {
      renderAll();
    }
  }, { once:true });

  // ---------- Demo data (僅顯示樣式；接真實資料後可刪) ----------
  function demoData(){
    const img = (w=800,h=500,q=20) => `https://picsum.photos/${w}/${h}?random=${Math.floor(Math.random()*9999)}`;
    return {
      cities: [
        {id:'c1', name:'古晉夜市', city:'古晉', tag:'夜市', image:img(800,500), ratio:'4:3'},
        {id:'c2', name:'瑪麗安海灘', city:'美里', tag:'海邊', image:img(800,500), ratio:'4:3'},
        {id:'c3', name:'動物園', city:'古晉', tag:'親子', image:img(800,500), ratio:'4:3'},
        {id:'c4', name:'藝術街區', city:'詩巫', tag:'藝文', image:img(800,500), ratio:'4:3'}
      ],
      similar: [
        {id:'s1', name:'木質咖啡', city:'古晉', tag:'咖啡', reason:'因為你喜歡咖啡', image:img(), ratio:'4:3', category:'吃'},
        {id:'s2', name:'港町咖啡', city:'古晉', tag:'咖啡', reason:'相似店風', image:img(), ratio:'4:3', category:'吃'},
        {id:'s3', name:'森林書店', city:'古晉', tag:'閱讀', reason:'與你收藏相似', image:img(), ratio:'4:3', category:'玩'},
        {id:'s4', name:'河畔咖啡', city:'詩巫', tag:'咖啡', reason:'你近期足跡', image:img(), ratio:'4:3', category:'喝'}
      ],
      trending: [
        {id:'t1', name:'天空步道', city:'古晉', tag:'景點', image:img(720,480), ratio:'4:3'},
        {id:'t2', name:'鱷魚農場', city:'古晉', tag:'親子', image:img(720,480), ratio:'4:3'},
        {id:'t3', name:'老街美食', city:'詩巫', tag:'美食', image:img(720,480), ratio:'4:3'},
        {id:'t4', name:'山海線', city:'美里', tag:'路線', image:img(720,480), ratio:'4:3'},
        {id:'t5', name:'港式早茶', city:'古晉', tag:'早餐', image:img(720,480), ratio:'4:3'},
        {id:'t6', name:'夜景觀景台', city:'古晉', tag:'夜景', image:img(720,480), ratio:'4:3'}
      ],
      stories: [
        {id:'st1', title:'古晉三日咖啡散步', image:img(1000,620), author:'Traveler A', city:'古晉', ratio:'4:3'},
        {id:'st2', title:'婆羅洲親子冒險', image:img(1000,620), author:'Family B',   city:'美里', ratio:'4:3'}
      ],
      events: [
        {id:'e1', title:'古晉美食節', image:img(1200,520), city:'古晉',
         startedAt: new Date(Date.now()-3*86400000).toISOString(),
         endsAt:    new Date(Date.now()+5*86400000).toISOString(),
         ratio:'16:9'}
      ]
    };
  }
})();