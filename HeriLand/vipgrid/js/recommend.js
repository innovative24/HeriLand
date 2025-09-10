const $=(s,e=document)=>e.querySelector(s); const $$=(s,e=document)=>Array.from(e.querySelectorAll(s));
const store={ read(k,f){try{return JSON.parse(localStorage.getItem(k)) ?? f}catch{return f}}, write(k,v){localStorage.setItem(k,JSON.stringify(v))} };


// ===== 使用者訊號 =====
const favorites = store.read('hl_favorites', []); // {id,title,city,tags,type,img,liked}
const history = store.read('hl_history', []); // {id,title,city,tags,img,lastViewed}


// ===== Demo 資料池（實際可由後端/城市頁提供） =====
const catalog = store.read('hl_catalog', [
{id:'k_food_1', title:'Top Spot Food Court', city:'Kuching', tags:['美食','海鮮'], img:'', pop:95, reason:''},
{id:'k_spot_1', title:'Sarawak Cultural Village', city:'Kuching', tags:['景點','文化'], img:'', pop:98, reason:''},
{id:'k_spot_2', title:'Siniawan Night Market', city:'Kuching', tags:['美食','夜市'], img:'', pop:90, reason:''},
{id:'s_spot_1', title:'Sibu Swan Square', city:'Sibu', tags:['地標','親子'], img:'', pop:85, reason:''},
{id:'m_spot_1', title:'Miri Canada Hill', city:'Miri', tags:['地標'], img:'', pop:88, reason:''},
{id:'m_spot_2', title:'Mulu National Park', city:'Miri', tags:['自然','世界遺產'], img:'', pop:99, reason:''},
{id:'b_spot_1', title:'Bintulu Waterfront', city:'Bintulu', tags:['景點'], img:'', pop:80, reason:''},
]);


// ===== 規則生成推薦 =====
function topBy(arr, key){
const map={}; arr.forEach(x=>{const v=x[key]; if(!v) return; map[v]=(map[v]||0)+1});
return Object.entries(map).sort((a,b)=>b[1]-a[1])[0]?.[0];
}
function topTag(arr){
const map={}; arr.forEach(x=> (x.tags||[]).forEach(t=> map[t]=(map[t]||0)+1));
return Object.entries(map).sort((a,b)=>b[1]-a[1])[0]?.[0];
}


const seenIds = new Set([ ...favorites.map(f=>f.id), ...history.map(h=>h.id) ]);


// 1) 為你推薦城市
const favCity = topBy(favorites,'city') || topBy(history,'city');
const rowCity = favCity ? catalog.filter(c=> c.city===favCity && !seenIds.has(c.id)) : [];
rowCity.forEach(x=> x.reason = `因為你常看 ${favCity}`);


// 2) 猜你會喜歡（按收藏類型 / 標籤）
const favTag = topTag(favorites);
const rowLike = favTag ? catalog.filter(c=> (c.tags||[]).includes(favTag) && !seenIds.has(c.id)) : [];
rowLike.forEach(x=> x.reason = `因為你收藏了「${favTag}」`);


// 3) 熱門體驗（全站熱門、未看過）
const rowHot = catalog.filter(c=> !seenIds.has(c.id)).sort((a,b)=> b.pop - a.pop).slice(0,12);
rowHot.forEach(x=> x.reason = `大家都在去`);


const blocks = [
{ title: favCity ? `因為你常看 ${favCity}` : null, items: rowCity },
{ title: favTag ? `猜你會喜歡` : null, items: rowLike },
{ title: `熱門體驗`, items: rowHot }
].filter(b=> b.title);


function emptyCheck(){
const hasSignal = favorites.length || history.length;
const hasRec = blocks.some(b=> b.items.length);
$('#empty').style.display = (!hasSignal || !hasRec) ? 'block' : 'none';
}


// ===== Render =====
const rowsEl = $('#rows');
function render(){
rowsEl.innerHTML='';
blocks.forEach(b=>{
if(!b.items.length) return;
const row = $('#tpl-row').content.cloneNode(true);
row.querySelector('.row-title').textContent = b.title;
const rail = row.querySelector('.rail');
b.items.forEach(item=> rail.appendChild(card(item)));
row.querySelector('.more').addEventListener('click', ()=>{
alert(`${b.title} — 查看更多（下版可跳完整列表頁）`)
});
rowsEl.appendChild(row);
});
emptyCheck();
}


render();