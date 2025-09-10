  // ===== Utilities & Storage =====
  const $ = (sel, el=document) => el.querySelector(sel);
  const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
  const fmtDate = (d=new Date()) => d.toLocaleDateString('zh-Hant', {year:'numeric', month:'2-digit', day:'2-digit'}).replace(/\//g,'/');

  const store = {
    read(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback }catch{ return fallback } },
    write(key, value){ localStorage.setItem(key, JSON.stringify(value)) }
  };

  // Schema
  // wish = [{id, title, city, tag, note, created}]
  // pack = {"必備文件": [ {id, text, done:false} ], ...}
  // trips = [{id, title, date, thumb}]

  const DefaultPack = {
    "必備文件": [
      {id: crypto.randomUUID(), text: "護照", done:false},
      {id: crypto.randomUUID(), text: "身分證/駕照", done:false},
      {id: crypto.randomUUID(), text: "機票/行程單", done:false},
    ],
    "日用品": [
      {id: crypto.randomUUID(), text: "牙刷/牙膏", done:false},
      {id: crypto.randomUUID(), text: "毛巾/備用衣物", done:false},
      {id: crypto.randomUUID(), text: "防曬乳/蚊液", done:false},
    ],
    "電子設備": [
      {id: crypto.randomUUID(), text: "手機/行動電源", done:false},
      {id: crypto.randomUUID(), text: "充電器/轉接頭", done:false},
      {id: crypto.randomUUID(), text: "相機/記憶卡", done:false},
    ],
    "其他": []
  };

  let wish = store.read('hl_wish', [
    { id: crypto.randomUUID(), title:'Siniawan Night Market', city:'Kuching', tag:'美食', note:'Day 1 晚上', created: fmtDate() },
    { id: crypto.randomUUID(), title:'Sarawak Cultural Village', city:'Kuching', tag:'景點', note:'Day 2 下午', created: fmtDate() },
  ]);
  let pack = store.read('hl_pack', DefaultPack);
  let trips = store.read('hl_trips', [
    { id: crypto.randomUUID(), title:'古晉三日遊', date:'2025/09/01', thumb:'🏞️' }
  ]);

  // ===== Tabs =====
  const tabs = $$('.tab');
  const panels = $$('.panel');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.setAttribute('aria-selected', x===t ? 'true' : 'false'));
    panels.forEach(p => p.classList.toggle('active', p.id === t.getAttribute('aria-controls')));
  }));

  // ===== 想去的地方 =====
  const wishListEl = $('#wishList');
  function renderWish(){
    wishListEl.innerHTML = '';
    if(!wish.length){ wishListEl.innerHTML = `<div class="empty card">目前沒有想去的地方，先新增一個吧！</div>`; return; }
    wish.forEach(item => wishListEl.appendChild(wishCard(item)));
  }
  function wishCard(item){
    const tpl = $('#tpl-wish-card').content.cloneNode(true);
    const card = tpl.querySelector('.place-card');
    card.dataset.id = item.id;
    card.querySelector('.tag').textContent = item.tag || '景點';
    card.querySelector('.city').textContent = item.city || 'Sarawak';
    card.querySelector('.title').textContent = item.title;
    card.querySelector('.note').textContent = item.note ? `備註：${item.note}` : '—';
    card.querySelector('.created').textContent = item.created || fmtDate();

    // DnD
    card.addEventListener('dragstart', (e)=>{
      e.dataTransfer.setData('text/plain', item.id);
      e.dataTransfer.effectAllowed = 'move';
      card.style.opacity = .5;
    });
    card.addEventListener('dragend', ()=> card.style.opacity = 1);
    card.addEventListener('dragover', (e)=>{ e.preventDefault(); card.style.outline = '1px dashed rgba(255,255,255,.3)'; card.style.outlineOffset = '3px'; });
    card.addEventListener('dragleave', ()=>{ card.style.outline = '' });
    card.addEventListener('drop', (e)=>{
      e.preventDefault(); card.style.outline = '';
      const fromId = e.dataTransfer.getData('text/plain');
      const toId = item.id;
      if(fromId === toId) return;
      const fromIdx = wish.findIndex(x=>x.id===fromId);
      const toIdx = wish.findIndex(x=>x.id===toId);
      const [moved] = wish.splice(fromIdx,1);
      wish.splice(toIdx,0,moved);
      store.write('hl_wish', wish);
      renderWish();
    });

    // actions
    tpl.querySelector('.btn-delete').addEventListener('click', ()=>{
      wish = wish.filter(x=>x.id!==item.id);
      store.write('hl_wish', wish); renderWish();
    });
    tpl.querySelector('.btn-edit').addEventListener('click', ()=>{
      const title = prompt('名稱', item.title) ?? item.title;
      const city = prompt('城市', item.city) ?? item.city;
      const tag  = prompt('標籤', item.tag) ?? item.tag;
      const note = prompt('備註', item.note) ?? item.note;
      Object.assign(item, {title, city, tag, note});
      store.write('hl_wish', wish); renderWish();
    });

    return tpl;
  }

  $('#btnAddWish').addEventListener('click', ()=>{
    const title = $('#wishTitle').value.trim();
    if(!title) return alert('請輸入商家 / 景點名稱');
    const city = $('#wishCity').value.trim();
    const tag = $('#wishTag').value.trim();
    const note = $('#wishNote').value.trim();
    const item = { id: crypto.randomUUID(), title, city, tag, note, created: fmtDate() };
    wish.push(item); store.write('hl_wish', wish); renderWish();
    ['wishTitle','wishCity','wishTag','wishNote'].forEach(id=> $('#'+id).value='');
  });
  $('#btnClearWish').addEventListener('click', ()=>{
    if(confirm('確定清空「想去的地方」？')){ wish = []; store.write('hl_wish', wish); renderWish(); }
  });

  // ===== 旅行清單 =====
  const packGrid = $('#packGrid');
  function renderPack(){
    packGrid.innerHTML = '';
    for(const [cat, items] of Object.entries(pack)){
      const box = document.createElement('div');
      box.className = 'card list';
      box.innerHTML = `<h4>${cat}</h4>`;

      const list = document.createElement('div');
      items.filter(x=>!x.done).forEach(item => list.appendChild(packItem(cat, item)));
      box.appendChild(list);

      const doneWrap = document.createElement('div');
      doneWrap.className = 'done-wrap';
      const doneTitle = document.createElement('div'); doneTitle.className='muted'; doneTitle.textContent='已完成';
      doneWrap.appendChild(doneTitle);
      items.filter(x=>x.done).forEach(i=>{
        const row = document.createElement('div');
        row.className='done-item'; row.innerHTML = `✅ ${i.text}`;
        doneWrap.appendChild(row);
      });
      box.appendChild(doneWrap);

      const add = document.createElement('div');
      add.className = 'add-line';
      add.innerHTML = `<input class="input" placeholder="新增項目"><button class="btn secondary">新增</button>`;
      add.querySelector('button').addEventListener('click', ()=>{
        const input = add.querySelector('input');
        const text = input.value.trim(); if(!text) return;
        items.push({id: crypto.randomUUID(), text, done:false});
        store.write('hl_pack', pack); renderPack();
      });
      box.appendChild(add);

      packGrid.appendChild(box);
    }
  }
  function packItem(cat, item){
    const row = document.createElement('label');
    row.className='item';
    row.innerHTML = `<input type="checkbox" ${item.done?'checked':''}><span>${item.text}</span><span style="margin-left:auto; display:flex; gap:6px">
      <button class="btn secondary" style="padding:4px 8px">刪除</button></span>`;
    const cb = row.querySelector('input');
    cb.addEventListener('change', ()=>{ item.done = cb.checked; store.write('hl_pack', pack); renderPack(); });
    row.querySelector('button').addEventListener('click', ()=>{
      pack[cat] = pack[cat].filter(x=>x.id!==item.id); store.write('hl_pack', pack); renderPack();
    });
    return row;
  }

  // ===== 已完成旅程 =====
  const tripList = $('#tripList');
  const tripEmpty = $('#tripEmpty');
  function renderTrips(){
    tripList.innerHTML='';
    if(!trips.length){ tripEmpty.style.display='block'; return; } else { tripEmpty.style.display='none'; }
    trips.forEach(t => {
      const tpl = $('#tpl-trip-card').content.cloneNode(true);
      const card = tpl.querySelector('.card');
      card.dataset.id = t.id;
      card.querySelector('.thumb').textContent = t.thumb || '🧭';
      card.querySelector('.trip-title').textContent = t.title;
      card.querySelector('.date').textContent = t.date;
      tpl.querySelector('.btn-view').addEventListener('click', ()=>{
        alert(`${t.title}\n\n(下版加入：顯示完整規劃內容與商家清單)`)
      });
      tpl.querySelector('.btn-copy').addEventListener('click', ()=>{
        const copy = { ...t, id: crypto.randomUUID(), title: t.title + '（複製）', date: fmtDate() };
        trips.unshift(copy); store.write('hl_trips', trips); renderTrips();
      });
      tripList.appendChild(tpl);
    });
  }

  // ===== 分享 / 匯出 =====
  const backdrop = $('#backdrop');
  const sheet = $('#sheet');
  $('#openSheet').addEventListener('click', ()=>{ backdrop.classList.add('show'); sheet.classList.add('show'); });
  $('#closeSheet').addEventListener('click', closeSheet);
  backdrop.addEventListener('click', closeSheet);
  function closeSheet(){ backdrop.classList.remove('show'); sheet.classList.remove('show'); }

  $('#copyLink').addEventListener('click', ()=>copyShareLink());
  $$('.share-btn', sheet).forEach(btn => btn.addEventListener('click', (e)=>{
    e.preventDefault(); const ch = btn.dataset.channel; copyShareLink(); alert(`已複製分享連結，前往 ${ch.toUpperCase()} 貼上即可`);
  }));
  function copyShareLink(){
    const data = { wish, pack, trips };
    const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
    const url = URL.createObjectURL(blob); // demo：用可下載的臨時網址代表分享連結
    navigator.clipboard.writeText(url);
  }

  // ===== Init =====
  renderWish();
  renderPack();
  renderTrips();

 // 子頁返回（每個子頁 header 的返回鈕）
    panel
      .querySelectorAll('.btn-back,[data-back]')
      .forEach((btn) => btn.addEventListener('click', showHome));
	  
	   // 子頁 ←：設定 flag，並回到首頁；首頁會自動把抽屜打開
  document.getElementById('btnBackToMember').addEventListener('click', () => {
    sessionStorage.setItem('HL_RETURN_TO_MEMBER', '1');
    // 子頁淡出效果（可選）
    document.body.classList.add('fade-out');
    setTimeout(()=> { location.href = '../heriland.html'; }, 160);
  });

  // 右上角 HeriLand：直接回首頁（清掉 flag，跳過會員中心）
  document.querySelector('.hl-header .home').addEventListener('click', () => {
    sessionStorage.removeItem('HL_RETURN_TO_MEMBER');
  });
  
 
  
  document.getElementById('btnBack').addEventListener('click', () => {
    // 設定旗標：回首頁後要打開抽屜
    sessionStorage.setItem('HERILAND_OPEN_DRAWER', '1');
    // 回首頁
    location.href = '../heriland.html';
  });
  
  document.body.classList.add('fade-out');
setTimeout(() => { location.href = '../heriland.html'; }, 200);

document.addEventListener('DOMContentLoaded', ()=>{
  const userStr = localStorage.getItem('hl_currentUser');
  if(!userStr) return;

  try {
    const user = JSON.parse(userStr);
    const vipCard = document.getElementById('vipCard');
    if(vipCard){
      vipCard.classList.remove('guest');
      vipCard.classList.add('member');
      document.querySelector('.vip-card-guest')?.setAttribute('hidden','');
      document.querySelector('.vip-card-member')?.removeAttribute('hidden');

      // 填寫會員卡資料
      document.getElementById('vipNo')?.textContent = user.no || 'HL-2025-00123';
      document.getElementById('vipPoints')?.textContent = user.points || '12,480';
      document.getElementById('vipTier')?.textContent = user.tier || 'Gold';
    }
  } catch(e){
    console.warn('User restore failed', e);
  }
});
