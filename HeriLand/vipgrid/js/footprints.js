const $ = (s,el=document)=>el.querySelector(s); const $$ = (s,el=document)=>Array.from(el.querySelectorAll(s));
{ id: crypto.randomUUID(), title:'Siniawan Night Market', city:'Kuching', tags:['美食','夜市'], img:'', lastViewed: new Date(Date.now()- 2*24*3600*1000).toISOString() },
{ id: crypto.randomUUID(), title:'Sarawak Cultural Village', city:'Kuching', tags:['文化','景點'], img:'', lastViewed: new Date(Date.now()- 5*24*3600*1000).toISOString() },
{ id: crypto.randomUUID(), title:'Sibu Night Market', city:'Sibu', tags:['美食'], img:'', lastViewed: new Date(Date.now()- 10*24*3600*1000).toISOString() },
{ id: crypto.randomUUID(), title:'Canada Hill', city:'Miri', tags:['地標'], img:'', lastViewed: new Date(Date.now()- 18*24*3600*1000).toISOString() },
]);


let range = '7'; // 7 | 30 | all
let sortBy = 'latest'; // latest | city
let city = 'all';


// 綁定 UI
$$('[data-range]').forEach(b=> b.addEventListener('click', ()=>{
range = b.dataset.range;
$$('[data-range]').forEach(x=> x.setAttribute('aria-pressed', x===b ? 'true':'false'));
render();
}));
$$('[data-sort]').forEach(b=> b.addEventListener('click', ()=>{
sortBy = b.dataset.sort;
$$('[data-sort]').forEach(x=> x.setAttribute('aria-pressed', x===b ? 'true':'false'));
render();
}));
$('#cityFilter').addEventListener('change', (e)=>{ city = e.target.value; render(); });


$('#clearAll').addEventListener('click', ()=>{
if(!history.length) return;
if(confirm('確定要清除全部足跡嗎？')){
history = []; store.write('hl_history', history); render();
}
});


function render(){
const grid = $('#grid'); grid.innerHTML='';
let items = history.slice();


// 時間範圍
if(range !== 'all'){
const days = Number(range);
const from = new Date(Date.now() - days*24*3600*1000);
items = items.filter(x => new Date(x.lastViewed) >= from);
}


// 城市
if(city !== 'all'){ items = items.filter(x=> (x.city||'').toLowerCase() === city.toLowerCase()); }


// 排序
if(sortBy==='latest'){
items.sort((a,b)=> new Date(b.lastViewed)-new Date(a.lastViewed));
} else if(sortBy==='city'){
items.sort((a,b)=> (a.city||'').localeCompare(b.city||'', 'zh-Hant') || new Date(b.lastViewed)-new Date(a.lastViewed));
}


if(!items.length){ $('#empty').style.display='block'; return; } else { $('#empty').style.display='none'; }


items.forEach(item => grid.appendChild(card(item)));
}


function card(item){
const tpl = $('#tpl-card').content.cloneNode(true);
const el = tpl.querySelector('.card'); el.dataset.id = item.id;
const thumb = tpl.querySelector('.thumb');
if(item.img){ const img = document.createElement('img'); img.src=item.img; thumb.innerHTML=''; thumb.appendChild(img); }
tpl.querySelector('.title').textContent = item.title;
tpl.querySelector('.tags').textContent = (item.tags||[]).join(' / ') || '—';
tpl.querySelector('.city').textContent = item.city || 'Sarawak';


el.addEventListener('click', ()=>{
// 下版可導向對應商家詳情頁，先用提示示範
alert(`${item.title}\n\n（下版：跳轉到商家詳情頁）`);
});
return tpl;
}


render();