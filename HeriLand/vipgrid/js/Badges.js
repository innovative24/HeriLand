const $=(s,e=document)=>e.querySelector(s); const $$=(s,e=document)=>Array.from(e.querySelectorAll(s));
].filter(Boolean);


// 12: 全境
const first11Unlocked = badges.slice(0,11).every(b=>b.unlocked);
badges.splice(11,0, B('srwk-king','砂拉越旅程王 · 全境','城市探索','集齊以上 11 個城市徽章自動解鎖','👑', first11Unlocked));
return badges;
}


function B(id, title, category, cond, icon, unlocked){
const saved = (store.read('hl_badges', [])).find(b=>b.id===id);
return { id, title, category, cond, icon, unlocked: saved? saved.unlocked : !!unlocked, unlockedAt: saved? saved.unlockedAt : (unlocked? new Date().toISOString(): null) };
}


// 渲染
const grid = $('#grid');
function render(){
const badges = buildBadges();
// 寫回（並記錄新近解鎖）
const prev = store.read('hl_badges', []);
const newly=[];
badges.forEach(b=>{
const p = prev.find(x=>x.id===b.id);
if(b.unlocked && (!p || !p.unlocked)) newly.push(b);
});
store.write('hl_badges', badges);


// 最近獲得（最多 2）
const recentWrap = $('#recent');
const recent = badges.filter(b=>b.unlockedAt).sort((a,b)=> new Date(b.unlockedAt)-new Date(a.unlockedAt)).slice(0,2);
if(recent.length){ recentWrap.style.display='flex'; recentWrap.innerHTML = recent.map(r=>`<span class="chip">${r.icon} ${r.title}<span style="color:#a9bbb5;font-size:12px"> · ${fmt(r.unlockedAt)}</span></span>`).join(''); store.write('hl_badges_recent', recent); }
else { recentWrap.style.display='none'; store.write('hl_badges_recent', []); }


grid.innerHTML='';
badges.forEach(b=> grid.appendChild(card(b)));
}


function card(b){
const box = document.createElement('article');
box.className='badge'; box.dataset.unlocked = b.unlocked ? 'true':'false'; box.dataset.id = b.id;
box.innerHTML = `
<div class="icon" style="background:${b.unlocked? 'linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,.08))':'rgba(255,255,255,.08)'}">${b.icon}</div>
<h3 class="title">${b.title}</h3>
<div class="meta">${b.unlocked? '已解鎖' : '未解鎖'}</div>
<div class="ribbon ${b.unlocked? '' : 'lock'}">${b.category}</div>
`;
box.addEventListener('click', ()=> openModal(b));
return box;
}


// Modal
const backdrop = $('#backdrop'); const sheet = $('#sheet');
function openModal(b){
$('#mIcon').textContent = b.icon; $('#mTitle').textContent = b.title; $('#mSub').textContent = b.category; $('#mCond').textContent = '解鎖條件：' + b.cond; $('#mDate').textContent = '解鎖日期：' + (b.unlockedAt? fmt(b.unlockedAt) : '—');
backdrop.classList.add('show'); sheet.classList.add('show');
}
function closeModal(){ backdrop.classList.remove('show'); sheet.classList.remove('show'); }
backdrop.addEventListener('click', closeModal); $('#close').addEventListener('click', closeModal);


// 操作
$('#sync').addEventListener('click', ()=> render());
$('#demoRain').addEventListener('click', ()=>{
// Demo：往足跡加入一筆雨天紀錄，方便解鎖「雨天旅人」
const key='hl_history';
const list = store.read(key, []);
list.push({ id: crypto.randomUUID(), title:'Rainy Day Demo', city:'Kuching', tags:['雨天'], lastViewed:new Date().toISOString() });
store.write(key, list); render();
});


render();