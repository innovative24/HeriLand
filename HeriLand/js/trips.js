
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
