/* Heriland - Trips page only
   Scope: #trips 內部，不接管全站路由/登入流程 */
(function () {
  'use strict';
  const root   = document.getElementById('trips');
  if (!root) return;                     // 安全：沒有 #trips 就不執行

  // 快捷查詢
  const $  = (sel, el=root) => el.querySelector(sel);
  const $$ = (sel, el=root) => Array.from(el.querySelectorAll(sel));

  /* ---------------------------------
   * 1) Tabs 切換（不影響全站）
   * --------------------------------- */
  const tabs   = $$('.tabs .tab');
  const panels = tabs.map(t => $('#'+t.getAttribute('aria-controls')));
  const tabsNav = $('.tabs');

  function moveIndicator(i){
    const el = tabs[i];
    const rect = el.getBoundingClientRect();
    const parentLeft = el.parentElement.getBoundingClientRect().left;
    const w = Math.max(28, rect.width * 0.45);
    tabsNav.style.setProperty('--bar-w', w + 'px');
    tabsNav.style.setProperty('--bar-x', (rect.left - parentLeft + rect.width/2) + 'px');
  }
  function showPanel(i){
    tabs.forEach((t,k)=> t.setAttribute('aria-selected', String(k===i)));
    panels.forEach((p,k)=> p.toggleAttribute('hidden', k!==i));
    moveIndicator(i);
  }
  tabs.forEach((t, i)=>{
    t.addEventListener('click', (e)=>{
      e.preventDefault();
      showPanel(i);
    });
  });
  // 首次顯示此頁時才定位一次（避免隱藏時量不到尺寸）
  root.addEventListener('hl:view:shown', ()=> {
    const current = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
    showPanel(current === -1 ? 0 : current);
  }, { once:true });

  /* ---------------------------------
   * 2) Hero 封面卡（初始化 API 之後可呼叫）
   * --------------------------------- */
  const heroHas = $('#tripHeroHasData');
  const heroEmpty = $('#tripHeroEmpty');
  function hydrateHero(trip){
    // trip: { title, datesText, coverUrl }
    if (!trip) { heroHas.hidden = true; heroEmpty.hidden = false; return; }
    $('#tripHeroTitle').textContent = trip.title || '未命名旅程';
    $('#tripHeroDates').textContent = trip.datesText || '';
    const img = $('#tripHeroCover');
    if (trip.coverUrl) { img.src = trip.coverUrl; img.hidden = false; } else { img.hidden = true; }
    heroHas.hidden = false; heroEmpty.hidden = true;
  }
  // 預設先顯示「無旅程」狀態；你串資料後呼叫 hydrateHero(trip)

  /* ---------------------------------
   * 3) 底部彈窗（新增旅程 / 分享）
   * --------------------------------- */
  function openSheet(sheetId, backdropId){
    const sheet = $('#'+sheetId, document);
    const mask  = $('#'+backdropId, document);
    if (!sheet || !mask) return;
    mask.hidden = false; sheet.hidden = false;
    // 動畫 class
    requestAnimationFrame(()=> sheet.classList.add('open'));
    const close = ()=> { sheet.classList.remove('open'); setTimeout(()=>{ sheet.hidden = true; mask.hidden = true; }, 280); };
    return close;
  }

  // 新增旅程 sheet
  let closeCreate = null;
  $('#fabAddTrip')?.addEventListener('click', ()=>{
    closeCreate = openSheet('createSheet','createBackdrop');
  });
  $('#btnOpenCreate')?.addEventListener('click', ()=>{
    closeCreate = openSheet('createSheet','createBackdrop');
  });
  $('#createBackdrop')?.addEventListener('click', ()=> closeCreate && closeCreate());
  $('#createClose')?.addEventListener('click', ()=> closeCreate && closeCreate());

  // 上傳/系統圖片掛點（不做實作，只觸發 input）
  $('#btnPickUpload')?.addEventListener('click', ()=> $('#tripCoverUpload', document)?.click());
  // $('#btnPickSystem') 之後可彈出系統圖選擇器

  // 分享 sheet
  let closeShare = null;
  $('#btnOpenShare')?.addEventListener('click', ()=>{
    closeShare = openSheet('shareSheet','shareBackdrop');
  });
  $('#shareBackdrop')?.addEventListener('click', ()=> closeShare && closeShare());
  $('#shareClose')?.addEventListener('click', ()=> closeShare && closeShare());

  /* ---------------------------------
   * 4) 規劃中：新增卡片（最小版）
   * --------------------------------- */
  const planList  = $('#planList');
  const planEmpty = $('#planEmpty');
  const tplPlan   = $('#tpl-plan-card', document);

  function renderPlanEmpty(){
    if (!planList) return;
    const hasItem = !!planList.firstElementChild;
    planEmpty && (planEmpty.hidden = hasItem);
  }
  $('#btnPlanAdd')?.addEventListener('click', ()=>{
    if (!tplPlan || !planList) return;
    const title = $('#planPlace').value.trim();
    const day   = $('#planDay').value.trim() || 'Day 1';
    const note  = $('#planNote').value.trim();

    const node = tplPlan.content.firstElementChild.cloneNode(true);
    node.querySelector('.title').textContent = title || '未命名地點';
    node.querySelector('.day').textContent   = day;
    node.querySelector('.note').textContent  = note || '';
    node.querySelector('.created').textContent = '加入於 ' + new Date().toISOString().slice(0,10);

    node.querySelector('.btn-delete')?.addEventListener('click', ()=> {
      node.remove(); renderPlanEmpty();
    });
    node.querySelector('.btn-edit')?.addEventListener('click', ()=> {
      // 之後可開編輯彈窗；暫時把欄位回填
      $('#planPlace').value = node.querySelector('.title').textContent;
      $('#planDay').value   = node.querySelector('.day').textContent.replace(/\s+/g,' ');
      $('#planNote').value  = node.querySelector('.note').textContent;
    });

    // 簡易拖曳排序（整列可拖；之後可限定 .drag-handle 再優化）
    node.draggable = true;
    let dragging = null;
    node.addEventListener('dragstart', (e)=>{ dragging = node; node.style.opacity='.6'; e.dataTransfer.effectAllowed='move'; });
    node.addEventListener('dragend',   ()=>{ dragging = null; node.style.opacity=''; });
    planList.addEventListener('dragover', (e)=>{
      if (!dragging) return;
      e.preventDefault();
      const card = e.target.closest('.place-card');
      if (!card || card===dragging) return;
      const rect = card.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height/2;
      card[before ? 'before' : 'after'](dragging);
    });

    planList.prepend(node);
    renderPlanEmpty();
    // 清欄位
    $('#planPlace').value = ''; $('#planDay').value = ''; $('#planNote').value = '';
  });
  renderPlanEmpty();

  /* ---------------------------------
   * 5) 行李清單：待準備/已準備好
   * --------------------------------- */
  const packTodo = $('#packTodo');
  const packDone = $('#packDone');
  const tplItem  = $('#tpl-pack-item', document);
  const defaults = ['護照', '手機/充電器', '相機/電池', '防曬乳', '雨傘', '換洗衣物'];

  function addPackItem(text, toDone=false){
    if (!tplItem) return;
    const li = tplItem.content.firstElementChild.cloneNode(true);
    li.querySelector('.text').textContent = text;
    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.checked = !!toDone;
    li.classList.toggle('done', !!toDone);

    // 勾選移動
    checkbox.addEventListener('change', ()=>{
      li.classList.toggle('done', checkbox.checked);
      (checkbox.checked ? packDone : packTodo).prepend(li);
    });
    // 刪除
    li.querySelector('.btn-del')?.addEventListener('click', ()=> li.remove());

    (toDone ? packDone : packTodo).prepend(li);
  }
  // 初始資料只在第一次顯示此面板時注入
  let packInited = false;
  function initPackIfNeeded(){
    if (packInited) return;
    packInited = true;
    defaults.forEach(t => addPackItem(t, false));
  }
  // 切到「行李清單」時再初始化
  $('#tab-pack')?.addEventListener('click', initPackIfNeeded);
  // 也許使用者直接從其他地方跳到 pack 面板
  root.addEventListener('hl:view:shown', ()=>{
    if ($('#panel-pack').hidden === false) initPackIfNeeded();
  });

  $('#btnPackAdd')?.addEventListener('click', ()=>{
    const v = $('#packNewItem').value.trim();
    if (!v) return;
    addPackItem(v, false);
    $('#packNewItem').value = '';
  });

  /* ---------------------------------
   * 6) 旅程記錄：時間軸新增
   * --------------------------------- */
  const timeline   = $('#diaryTimeline');
  const diaryEmpty = $('#diaryEmpty');
  const tplDiary   = $('#tpl-diary-item', document);

  function addDiaryItem({ day='Day 1', time='14:00', title='打卡：景點', note='' } = {}){
    if (!tplDiary || !timeline) return;
    const node = tplDiary.content.firstElementChild.cloneNode(true);
    node.querySelector('.day').textContent  = day;
    node.querySelector('.time').textContent = time;
    node.querySelector('.title').textContent= title;
    node.querySelector('.note').textContent = note || '';
    timeline.appendChild(node);
    if (diaryEmpty) diaryEmpty.hidden = true;
  }
  $('#btnDiaryAdd')?.addEventListener('click', ()=>{
    const day  = $('#diaryDay').value.trim()   || 'Day 1';
    const place= $('#diaryPlace').value.trim() || '打卡：景點';
    const note = $('#diaryNote').value.trim();
    // 時間暫給現在的 HH:mm
    const now  = new Date();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    addDiaryItem({ day, time: `${hh}:${mm}`, title: place, note });
    $('#diaryPlace').value = ''; $('#diaryNote').value = '';
  });

  /* ---------------------------------
   * 7) 分享面板：按鈕掛點（不做實際分享）
   * --------------------------------- */
  $$('.share-btn', document).forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const ch = a.getAttribute('data-channel');
      // 之後可接真實分享；目前只是關閉面板
      closeShare && closeShare();
      console.debug('[share] channel:', ch);
    });
  });
})();