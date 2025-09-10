const $ = (s,el=document)=>el.querySelector(s); const $$ = (s,el=document)=>Array.from(el.querySelectorAll(s));
{ id: crypto.randomUUID(), title:'Sarawak Cultural Village', city:'Kuching', phone:'+60 82-846411', tags:['景點','文化','清真'], img:'', liked:true, type:'玩' },
{ id: crypto.randomUUID(), title:'Sibu Swan Square', city:'Sibu', phone:'—', tags:['地標','親子'], img:'', liked:true, type:'樂' },
]);


let currentSort = 'latest';
let searchKeyword = '';


$('#toggleSearch').addEventListener('click', ()=>{
const wrap = $('#searchWrap');
const show = wrap.style.display === 'none';
wrap.style.display = show ? 'block' : 'none';
if(show) $('#searchInput').focus();
});
$('#searchInput').addEventListener('input', (e)=>{ searchKeyword = e.target.value.trim().toLowerCase(); render(); });


$$('.pill').forEach(p=> p.addEventListener('click', ()=>{
currentSort = p.dataset.sort;
$$('.pill').forEach(x=>x.setAttribute('aria-pressed', x===p ? 'true':'false'));
render();
}));


function render(){
const list = $('#list'); list.innerHTML='';
let items = favorites.filter(f=> f.liked);
if(searchKeyword){ items = items.filter(x=> (x.title + ' ' + x.city + ' ' + (x.tags||[]).join(' ')).toLowerCase().includes(searchKeyword)); }


// 排序
if(currentSort==='latest'){
// 假設後加入在陣列後方，最新置頂
items = items.slice().reverse();
} else if(currentSort==='city'){
items = items.slice().sort( (a,b)=> a.city.localeCompare(b.city, 'zh-Hant') || a.title.localeCompare(b.title,'zh-Hant') );
} else if(currentSort==='type'){
items = items.slice().sort( (a,b)=> (a.type||'').localeCompare(b.type||'', 'zh-Hant') || a.title.localeCompare(b.title,'zh-Hant') );
}


if(!items.length){ $('#empty').style.display='block'; return; } else { $('#empty').style.display='none'; }


items.forEach(item=> list.appendChild(card(item)));
}


function card(item){
const tpl = $('#tpl-card').content.cloneNode(true);
const el = tpl.querySelector('.card'); el.dataset.id = item.id;
const thumb = tpl.querySelector('.thumb');
if(item.img){ const img = document.createElement('img'); img.src=item.img; thumb.innerHTML=''; thumb.appendChild(img); }
tpl.querySelector('.title').textContent = item.title;
tpl.querySelector('.phone').textContent = item.phone || '—';
tpl.querySelector('.city').textContent = item.city || 'Sarawak';


const chips = tpl.querySelector('.chips');
(item.tags||[]).forEach(t=>{ const c=document.createElement('span'); c.className='chip'; c.textContent=t; chips.appendChild(c); });


const heart = tpl.querySelector('.heart');
heart.dataset.liked = !!item.liked;
heart.addEventListener('click', ()=>{
item.liked = !item.liked; // 取消收藏
store.write('hl_favorites', favorites);
// 動畫：縮回 → 重新渲染
heart.style.transform='scale(.7)'; setTimeout(()=>{ render(); }, 120);
});


// 其他按鈕（地圖、加入行程）— 先示範提示
const [mapBtn, pinBtn] = tpl.querySelectorAll('.actions .btn-icon:not(.heart)');
mapBtn.addEventListener('click', ()=> alert('開啟地圖（下版可串 Google Maps 或原生地圖）'));
pinBtn.addEventListener('click', ()=> alert('加入行程（可串到「想去的地方」清單）'));


return tpl;
}


render();