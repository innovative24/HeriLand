/* ===== HL util bootstrap (safe fallback) ===== */
(function(){
  // 確保 HL / HL.util 一定存在
  window.HL = window.HL || {};
  HL.util = HL.util || {};

  // 由 cities.js / tags.js 建立對照表（若尚未載入，則是空陣列，不會壞）
  const CITY_MAP = (window.CITIES || []).reduce((m, c) => { m[c.id] = c.name; return m; }, {});
  const TAG_MAP  = (window.TAGS  || []).reduce((m, t) => { m[t.id] = t.name; return m; }, {});

  // 提供缺少時的預設實作（已存在就不覆蓋）
  HL.util.cityName = HL.util.cityName || (id => CITY_MAP[id] || id || '');
  HL.util.tagName  = HL.util.tagName  || (id => TAG_MAP[id]  || id || '');
  HL.util.firstTags = HL.util.firstTags || ((ids = [], n = 2) =>
    (ids || []).slice(0, n).map(id => HL.util.tagName(id))
  );
  HL.util.priceLevelText = HL.util.priceLevelText || (lvl => {
    const table = ['$', '$$', '$$$', '$$$$', '$$$$$'];
    const i = Number.isFinite(lvl) ? Math.max(0, Math.min(table.length - 1, lvl|0)) : 0;
    return table[i];
  });
})();

// [safe stub] 放在 app.js 最上方
if (typeof window.updateMemberAuthButton !== 'function') {
  window.updateMemberAuthButton = function(){
    // 這裡先留空即可；未來要更新會員按鈕狀態再補
  };
}


function debugLog(msg){
  const el = document.getElementById('debug');
  if(el) el.textContent += msg + "\n";
}
debugLog("HL merchants length: " + HL.MERCHANTS.length);
/* ===== Demo 資料 ===== */

// 取得主題容器（只在這層切換）
const THEME_KEY = 'theme';

function applyTheme(mode){
  const root = document.documentElement; // ← 直接掛在 <html>
  let finalMode = mode;
  if(mode === 'auto'){
    finalMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', finalMode);
  localStorage.setItem(THEME_KEY, mode);
  highlightThemeSegment?.(mode); // 若你有 segmented 的高亮
}

document.addEventListener('DOMContentLoaded', ()=>{
  const saved = localStorage.getItem(THEME_KEY) || 'auto';
  applyTheme(saved);

  // 自動模式時跟隨系統
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{
    if((localStorage.getItem(THEME_KEY) || 'auto') === 'auto'){
      applyTheme('auto');
    }
  });
});

/* 分類（四張卡片、兩欄） */
const CATS = [
  { id:'Eat',   name:'吃',  en:'Eat',   img:'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1400&auto=format&fit=crop' },
  { id:'Drink', name:'喝',  en:'Drink', img:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1400&auto=format&fit=crop' },
  { id:'Play',  name:'玩',  en:'Play',  img:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop' },
  { id:'Stay',  name:'樂',  en:'Stay',  img:'https://images.unsplash.com/photo-1551776235-dde6d4829808?q=80&w=1400&auto=format&fit=crop' },
];

/* 城市（以州屬代表；avatar 使用 emoji SVG data URI，不怕外網載不到） */
const DIVS = [
{ id:'kuching',   name:'Kuching',   emoji:'🐱' },  // 貓城
  { id:'serian',    name:'Serian',    emoji:'🥥' },  // 椰子產地
  { id:'samarahan', name:'Samarahan', emoji:'🌾' },  // 稻米
  { id:'sri-aman',  name:'Sri Aman',  emoji:'⛪' },  // 和平城/教堂
  { id:'betong',    name:'Betong',    emoji:'🌴' },  // 胡椒
  { id:'sibu',      name:'Sibu',      emoji:'🦢' },  // 天鵝
  { id:'mukah',     name:'Mukah',     emoji:'🦐' },  // 魚蝦漁業
  { id:'kapit',     name:'Kapit',     emoji:'🏚️' },  // 長屋
  { id:'bintulu',   name:'Bintulu',   emoji:'⚓' },  // 港口
  { id:'miri',      name:'Miri',      emoji:'🛢️' },  // 石油城
  { id:'marudi',    name:'Marudi',    emoji:'🥁' },  // 文化鼓節
  { id:'limbang',   name:'Limbang',   emoji:'🐃' }   // 水牛
];

/* 商家卡片（含最新/熱點 標籤） */
const ITEMS = [
  { id:'1', cat:'Eat',   div:'kuching', title:'Sarawak Laksa @ Chong Choon', tags:['Laksa','Breakfast'], rating:4.7, cover:'https://images.unsplash.com/photo-1604908176997-431621b71090?q=80&w=1400&auto=format&fit=crop', latest:true,  hot:true },
  { id:'2', cat:'Play',  div:'kuching', title:'Bako National Park',         tags:['Nature','Hike'],      rating:4.8, cover:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop', latest:false, hot:true },
  { id:'3', cat:'Drink', div:'sibu',    title:'Sibu Night Market',          tags:['Night','Street'],     rating:4.6, cover:'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?q=80&w=1400&auto=format&fit=crop', latest:true,  hot:false },
  { id:'4', cat:'Play',  div:'miri',    title:'Miri Sunset Cruise',         tags:['Sunset','Boat'],      rating:4.5, cover:'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1400&auto=format&fit=crop', latest:false, hot:true },
  { id:'5', cat:'Stay',  div:'miri',    title:'Coco Palm Homestay',         tags:['Homestay','Cozy'],    rating:4.4, cover:'https://images.unsplash.com/photo-1551776235-dde6d4829808?q=80&w=1400&auto=format&fit=crop', latest:true,  hot:false },
];

/* ===== 狀態 ===== */
const state = {
  cat: null,     // 選到的分類
  div: null,     // 選到的城市
  likes: JSON.parse(localStorage.getItem('hl_likes') || '{}'),
// 在你的 state 物件內新增這幾個欄位
view: 'home',   // 'home' | 'city'
cityId: null,   // 目前城市頁 id（例如 'kuching'）
cityCat: null   // 城市頁選中的分類（Eat/Drink/... 或 null=全部）
 };
function persist(){ localStorage.setItem('hl_likes', JSON.stringify(state.likes)); }

// 假帳號資料庫（key: email/phone；value: {email, phone, name, pass}）
function loadUsers(){ try{return JSON.parse(localStorage.getItem('hl_users')||'{}')}catch{ return {}; } }
function saveUsers(db){ localStorage.setItem('hl_users', JSON.stringify(db||{})); }

const auth = {
  db: loadUsers(),
  lastIdentifier: null,
  loggedInAs: null,
  returnTo: null,     // 'settings' | null
  forceRegister: false // true 表示直接打開註冊面板
};


// 你的 state 物件加這幾項（如前面已加 view/cityId 可保留）：
state.view ??= 'home';
state.cityId ??= null;
state.cityCat ??= null;
state.user ??= localStorage.getItem('hl_user') || ''; // 讓登入成功可顯示名字

// ===== 篩選狀態 =====
state.citySort = 'latest';   // 'latest' | 'hot' | 'distance' | 'rating'
state.cityFilter = {
  sort: 'latest',            // 同 citySort，for sheet 同步
  openNow: false,            // 營業中（單選）
  themes: new Set(),         // 多選
  attrs: new Set(),          // 多選
  location: null             // {lat, lng}，用於距離排序
};

// ===== HL fallback helpers (avoid undefined) =====
window.HL = window.HL || {};
HL.util = HL.util || {};

// 城市映射（如果沒有 util.cityName）
if (typeof HL.util.cityName !== 'function') {
  const _CITY_MAP = (window.CITIES || []).reduce((m,c)=>{m[c.id]=c.name; return m;}, {});
  HL.util.cityName = (id)=> _CITY_MAP[id] || id || '';
}

// 特色/最新清單（如果 merchants.js 尚未提供）
if (typeof HL.getHomeFeatured !== 'function') {
  HL.getHomeFeatured = (n=12)=>{
    const list = (HL.merchants || []).filter(m=>m.featured);
    return list.slice(0, n);
  };
}
if (typeof HL.getHomeLatest !== 'function') {
  HL.getHomeLatest = (n=12)=>{
    const list = (HL.merchants || []).slice()
      .sort((a,b)=> new Date(b.updatedAt||0) - new Date(a.updatedAt||0));
    return list.slice(0, n);
  };
}

/* ===== DOM ===== */
const elCatGrid  = document.getElementById('catGrid');
const elCityRow  = document.getElementById('cityRow');
const elCardList = document.getElementById('cardList');
const elFilters  = document.getElementById('activeFilters');
const elClear    = document.getElementById('clearFilters');
/* City page DOM */
const elCityPage      = document.getElementById('cityPage');
const elCityBack      = document.getElementById('cityBack');
const elCityTitle     = document.getElementById('cityTitle');
const elCityHero      = document.getElementById('cityHero');
const elCityCatChips  = document.getElementById('cityCatChips');
const elCityCardList  = document.getElementById('cityCardList');

/* Home sections for show/hide */
const secHomeCats   = document.getElementById('homeCats');
const secHomeCities = document.getElementById('homeCities');
const secHomeList   = document.getElementById('homeList');

// Pages
const elAuthPage     = document.getElementById('authPage');
const elSettingsPage = document.getElementById('settingsPage');
const elMerchantPage = document.getElementById('merchantPage');

// Auth elements
const elAuthBack = document.getElementById('authBack');
const elTrack    = document.getElementById('authTrack');
const elGoCont   = document.getElementById('goContinue');
const elPwTitle  = document.getElementById('pwTitle');
const elPwUser   = document.getElementById('pwUser');
const elPwUserLabel = document.getElementById('pwUserLabel');
const elPwInput  = document.getElementById('pwInput');
const elDoLogin  = document.getElementById('doLogin');
const elToReg    = document.getElementById('toRegisterFromPw');
const elRegName  = document.getElementById('regName');
const elRegId    = document.getElementById('regId');      // 註冊：單一識別
const elRegPass  = document.getElementById('regPass');
const elDoReg    = document.getElementById('doRegister');

// Settings
const elSetBack   = document.getElementById('settingsBack');
const elSetLang   = document.getElementById('setLang');
const elSetCurr   = document.getElementById('setCurrency');
const elOpenTerms = document.getElementById('openTerms');
const elSetTheme = document.getElementById('setTheme');


// Merchant page
const elMerBack   = document.getElementById('merchantBack');
const elOpenLocalOnboard = document.getElementById('openLocalOnboard');

// 會員中心按鈕（整合）
const btnSettings = document.getElementById('btnSettings');
const btnOnboard  = document.getElementById('btnOnboardMerchant');

// 快速篩選列 & Sheet DOM
const elQuickRow  = document.getElementById('cityQuickChips');
const elOpenSheet = document.getElementById('openFilterSheet');
const elSheet     = document.getElementById('filterSheet');
const elSheetBg   = document.getElementById('filterBackdrop');
const elFsSort    = document.getElementById('fsSort');
const elFsThemes  = document.getElementById('fsThemes');
const elFsAttrs   = document.getElementById('fsAttrs');
const elFsReset   = document.getElementById('fsReset');
const elFsApply   = document.getElementById('fsApply');

// 詳情 DOM
const hlBackdrop = document.getElementById('hlDetailBackdrop');
const hlSheet    = document.getElementById('hlDetailSheet');
const elDP       = document.getElementById('detailPage');

const elMedia    = document.getElementById('hlDetailMedia');
const elTitle    = document.getElementById('hlDetailTitle');
const elRating   = document.getElementById('hlDetailRating');
const elChips    = document.getElementById('hlDetailChips');
const elTel      = document.getElementById('hlTel');
const elAddr     = document.getElementById('hlAddr');
const elOpen     = document.getElementById('hlOpenState');
const elDesc     = document.getElementById('hlDesc');
const elGal      = document.getElementById('hlGallery');
const elThemes   = document.getElementById('hlThemes');
const elNearby   = document.getElementById('hlNearby');

const btnFav     = document.getElementById('hlActFav');
const btnMap     = document.getElementById('hlActMap');
const btnShare   = document.getElementById('hlActShare');
const btnAddRoute= document.getElementById('hlAddRoute');

// 桌面版右側
const hlBack     = document.getElementById('hlDetailBack');
const dpTitle    = document.getElementById('hlDetailPageTitle');
const dpBanner   = document.getElementById('hlDetailBanner');
const dpChips    = document.getElementById('hlDeskChips');
const dpRating   = document.getElementById('hlDeskRating');
const dpTitleH3  = document.getElementById('hlDeskTitle');
const dpTel      = document.getElementById('hlDeskTel');
const dpAddr     = document.getElementById('hlDeskAddr');
const dpOpen     = document.getElementById('hlDeskOpen');
const dpDesc     = document.getElementById('hlDeskDesc');
const dpGallery  = document.getElementById('hlDeskGallery');
const dpNearby   = document.getElementById('hlDeskNearby');
const dpFav      = document.getElementById('hlDeskFav');
const dpMap      = document.getElementById('hlDeskMap');
const dpShare    = document.getElementById('hlDeskShare');
const dpAddRoute = document.getElementById('hlDeskAddRoute');

function isDesktop(){ return window.matchMedia('(min-width: 900px)').matches; }

let _hlItem = null;

function hlOpenDetail(item){
  _hlItem = item;

  // 通用資料
  const cover  = item.cover || DEFAULT_COVER;
  const rating = (item.rating!=null) ? `★ ${item.rating}` : '—';
  const chips  = (item.tags||[]).slice(0,6).map(t=>`<span class="chip">${t}</span>`).join('');
  const desc   = item.desc || (item.title + ' · ' + (item.cat||'') + ' · ' + (item.div||''));

  if(isDesktop()){
    // ===== 桌面版：使用 Detail Page =====
    showPage(elDP);
    dpTitle.textContent = item.title;
    dpTitleH3.textContent = item.title;
    dpBanner.style.backgroundImage = `url('${cover}')`;
    dpRating.textContent = rating;
    dpChips.innerHTML = chips;

    dpTel.innerHTML  = item.phone ? `📞 <a href="tel:${item.phone}">${item.phone}</a>` : '—';
    if(item.address){
      const q = encodeURIComponent(`${item.title} ${item.address}`);
      dpAddr.innerHTML = `📍 <a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener">${item.address}</a>`;
    }else dpAddr.textContent = '—';

    dpDesc.textContent = desc;
    dpOpen.innerHTML = hlFormatOpenState(item);
    dpGallery.innerHTML = (item.photos||[]).map(u=>`<div class="ph" style="background-image:url('${u}')"></div>`).join('') || '<div class="ph"></div>';
    dpNearby.innerHTML  = hlRenderNearby(item);

    // 動作
    dpFav.onclick      = ()=> hlToggleFav(item, dpFav);
    dpMap.onclick      = ()=> hlOpenMap(item);
    dpShare.onclick    = ()=> hlShare(item);
    dpAddRoute.onclick = ()=> hlAddToRoute(item);
    hlBack.onclick     = ()=> showHome();

  }else{
    // ===== 手機版：Bottom Sheet（半屏 ↔ 全屏 ⛶） =====

    // 基本區塊
    elMedia.style.backgroundImage = `url('${cover}')`;
    elTitle.textContent  = item.title;
    elRating.textContent = rating;
    elChips.innerHTML    = chips;
    elDesc.textContent   = desc;
    elOpen.innerHTML     = hlFormatOpenState(item);

    // 聯絡
    elTel.textContent = item.phone ? `📞 ${item.phone}` : '📞 —';
    elTel.href        = item.phone ? `tel:${item.phone}` : '#';

    if(item.address){
      const q = encodeURIComponent(`${item.title} ${item.address}`);
      elAddr.textContent = `📍 ${item.address}`;
      elAddr.href = `https://www.google.com/maps/search/?api=1&query=${q}`;
      elAddr.target = '_blank';
    }else{
      elAddr.textContent = '📍 —';
      elAddr.removeAttribute('href');
      elAddr.removeAttribute('target');
    }

    // 圖片 / 主題 / 附近
    elGal.innerHTML    = (item.photos||[]).map(u=>`<div class="ph" style="background-image:url('${u}')"></div>`).join('') || '<div class="ph"></div>';
    elThemes.innerHTML = (item.themes||[]).map(t=>`<span class="chip brand">${t}</span>`).join('');
    elNearby.innerHTML = hlRenderNearby(item);

    // 動作
    btnFav.onclick      = ()=> hlToggleFav(item, btnFav);
    btnMap.onclick      = ()=> hlOpenMap(item);
    btnShare.onclick    = ()=> hlShare(item);
    btnAddRoute.onclick = ()=> hlAddToRoute(item);

    // ⛶ 放大 / 縮小 切換（半屏 ↔ 全屏）
    const btnExpand = document.getElementById('hlExpand');
    if(btnExpand){
      // 初始：回到半屏狀態，避免上一個詳情遺留 full
      hlSheet.classList.remove('full');

      btnExpand.onclick = ()=>{
        hlSheet.classList.toggle('full');
      };
    }

    // 開啟 Sheet（含背景）
    hlBackdrop.hidden = false;
    requestAnimationFrame(()=> hlBackdrop.classList.add('show'));
    hlSheet.classList.add('open');
    hlSheet.setAttribute('aria-hidden','false');
  }
}

// 把 HL 的商家物件 → 轉換成 hlOpenDetail 需要的格式
function mapMerchantToDetailItem(m){
  return {
    id: m.id,
    title: m.name,
    div: m.cityId,
    address: m.address,
    phone: m.phone || '',
    cover: (m.images && m.images[0]) || DEFAULT_COVER,
    photos: m.images || [],
    tags: (m.tagIds || []).map(id => HL.util.tagLabel(id)),
    themes: (m.tagIds || []).map(id => HL.util.tagLabel(id)), // 先共用
    rating: m.rating,
    open: (m.openHours||'').split('-')[0]?.trim() || '',
    close: (m.openHours||'').split('-')[1]?.trim() || '',
    lat: m.location?.lat,
    lng: m.location?.lng,
    desc: m.description || ''
  };
}

function hlCloseDetail(){
  if(isDesktop()){
    showHome(); // 回首頁或上一頁
  }else{
    hlSheet.classList.remove('open');
    hlSheet.setAttribute('aria-hidden','true');

const hlSheetBody = document.querySelector('.hl-sheet-body');
hlSheetBody.addEventListener('touchmove', (e)=>{
  e.stopPropagation(); // 阻止事件傳到 backdrop
}, {passive:false});
    hlBackdrop.classList.remove('show');
    setTimeout(()=> hlBackdrop.hidden = true, 200);
  }
}
// 手勢/點擊關閉
hlBackdrop?.addEventListener('click', hlCloseDetail);

function hlToggleFav(item, btn){
  state.likes[item.id] = !state.likes[item.id];
  persist?.();
  // 視覺：簡單切換（btn 內可能是 ♥ + small）
  btn.classList.toggle('active', !!state.likes[item.id]);
  // 若你在列表也顯示收藏狀態，可選擇重render
  // renderCityFromHL?.();
}
function hlOpenMap(item){
  const q = encodeURIComponent(`${item.title} ${item.address||''} ${item.div||''}`);
  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
}
async function hlShare(item){
  const url = location.href.split('#')[0]; // 你之後可換成實際分享連結
  const text = `${item.title} - ${item.address||''}`;
  if(navigator.share){
    try{ await navigator.share({ title:item.title, text, url }); }catch{}
  }else{
    prompt('複製分享連結', url);
  }
}
function hlAddToRoute(item){
  const key = 'hl_route';
  const arr = JSON.parse(localStorage.getItem(key)||'[]');
  if(!arr.find(x=>x.id===item.id)) arr.push({ id:item.id, title:item.title, address:item.address||'', div:item.div||'' });
  localStorage.setItem(key, JSON.stringify(arr));
  alert('已加入「我的路線」');
}

function hlFormatOpenState(item){
  const open = item.open, close = item.close;
  if(!open || !close) return '<span class="chip">營業時間未提供</span>';
  // 簡單判斷今日是否營業中（以本地時間）
  const now = new Date();
  const [oh,om] = open.split(':').map(Number);
  const [ch,cm] = close.split(':').map(Number);
  const start = new Date(now); start.setHours(oh||0, om||0, 0, 0);
  const end   = new Date(now); end.setHours(ch||0, cm||0, 0, 0);
  const ok = now >= start && now <= end;
  const badge = ok ? `<span class="chip brand">✔ 營業中 till ${close}</span>` : `<span class="chip">未營業（今日 ${open}-${close}）</span>`;
  return badge;
}

function hlRenderNearby(item){
  // 同城市 & 有座標才算距離
  const me = (typeof item.lat==='number' && typeof item.lng==='number') ? {lat:item.lat, lng:item.lng} : null;
  const list = ITEMS
    .filter(x=> x.id!==item.id && x.div===item.div)
    .map(x=>{
      const has = (typeof x.lat==='number' && typeof x.lng==='number');
      return { ...x, _d: (me && has) ? distanceKm(me, {lat:x.lat, lng:x.lng}) : Infinity };
    })
    .sort((a,b)=> a._d - b._d)
    .slice(0, 10)
    .filter(x=> x._d <= 0.8 || x._d===Infinity) // 0.8km 內；沒有座標也可顯示
    .slice(0, 6);

  if(!list.length) return '<div class="tag">暫無資料</div>';

  return list.map(x=>`
    <div class="hl-near clickable" data-id="${x.id}">
      <div class="ph" style="background-image:url('${x.cover||DEFAULT_COVER}')"></div>
      <div class="info">
        <div class="t">${x.title}</div>
        <div class="s" style="font-size:12px;color:#6b7280;">${isFinite(x._d)? (x._d.toFixed(2)+' km'): (x.address||'') }</div>
      </div>
    </div>
  `).join('');
}

// 附近卡片點擊 → 直接開該商家詳情
document.addEventListener('click', (e)=>{
  const near = e.target.closest?.('.hl-near');
  if(near){
    const id = near.getAttribute('data-id');
    const it = ITEMS.find(x=> x.id===id);
    if(it) hlOpenDetail(mapMerchantToDetailItem(merchant));
  }
});



// ===== Theme: auto/light/dark =====
// 套用主題（若已有可沿用）
function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (mode === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.setAttribute('data-theme',
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );
  }
  localStorage.setItem('theme', mode);
  highlightThemeSegment(mode);
}

// Segmented UI 高亮
function highlightThemeSegment(mode){
  const wrap = document.getElementById('themeSegment');
  if(!wrap) return;
  wrap.querySelectorAll('.seg-btn').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}



// 綁定事件 + 初始化
document.addEventListener('DOMContentLoaded', ()=>{
  const wrap = document.getElementById('themeSegment');
  if(!wrap) return;

  const saved = localStorage.getItem('theme') || 'auto';
  applyTheme(saved); // 也會順便 highlight

  wrap.addEventListener('click', (e)=>{
    const btn = e.target.closest('.seg-btn');
    if(!btn) return;
    applyTheme(btn.dataset.mode);
  });

/* ===== VIP Drawer & Handle (one-piece with drawer) ===== */
(function(){
  const root = document.body;

  // 建立 scrim + drawer（只建立一次）
  let scrim = document.getElementById('vipScrim');
  if(!scrim){
    scrim = document.createElement('div');
    scrim.id = 'vipScrim';
    scrim.className = 'vip-scrim';
    document.body.appendChild(scrim);
  }
  let drawer = document.getElementById('memberPanel');
  if(!drawer){
    drawer = document.createElement('section');
    drawer.id = 'memberPanel';
    drawer.className = 'vip-drawer';
    drawer.setAttribute('role','dialog');
    drawer.setAttribute('aria-modal','true');
    drawer.innerHTML = `
      <button class="vip-close" aria-label="關閉">✕</button>
      <div class="vip-inner">
        <!-- 這裡仍然用你原本的會員卡片與按鈕區塊： -->
        ${document.getElementById('vipTemplate')?.innerHTML || `
          <div style="height:100%;display:grid;place-items:center;color:#fff;opacity:.6">
            <div>VIP 內容放這裡（模板未提供）</div>
          </div>
        `}
      </div>`;
    document.body.appendChild(drawer);
  }

  // 建立把手（黏在抽屜邊）
  let handle = document.getElementById('vipHandle');
  if(!handle){
    handle = document.createElement('button');
    handle.id = 'vipHandle';
    handle.className = 'vip-handle';
    handle.setAttribute('aria-label','開啟 VIP');
    
    drawer.appendChild(handle); // ★ 把手屬於抽屜的一部分
  }

  // 關閉鍵
  const btnClose = drawer.querySelector('.vip-close');

  // 開/關
  function openVIP(){
    drawer.classList.add('open');
    scrim.classList.add('show');
    // 讓箭頭朝向「關閉」方向
    handle.querySelector('.arrow').textContent = '‹';
  }
  function closeVIP(){
    drawer.classList.remove('open');
    scrim.classList.remove('show');
    handle.querySelector('.arrow').textContent = '›';
  }
  function toggleVIP(){
    (drawer.classList.contains('open') ? closeVIP : openVIP)();
  }

  // 點擊事件
  handle.addEventListener('click', toggleVIP);
  btnClose.addEventListener('click', closeVIP);
  scrim.addEventListener('click', closeVIP);

  // 簡單拖曳（像拉窗簾）
  let dragging = false, startX = 0, startTx = 0;
  const maxTx = drawer.offsetWidth;

  const onDragMove = (e)=>{
    if(!dragging) return;
    const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
    const dx = startX - clientX; // 往右為正
    let tx = Math.min(Math.max(0, startTx + dx), maxTx);
    drawer.style.transition = 'none';
    drawer.style.transform = `translateX(${tx}px)`;
    if(e.cancelable) e.preventDefault();
  };
  const onDragEnd = ()=>{
    if(!dragging) return;
    dragging = false;
    drawer.style.transition = '';
    const m = drawer.style.transform.match(/translateX\(([-\d.]+)px\)/);
    const tx = m ? parseFloat(m[1]) : 0;
    if(tx > maxTx*0.35) { closeVIP(); drawer.style.transform=''; }
    else { openVIP(); drawer.style.transform=''; }
  };
  const onDragStart = (e)=>{
    dragging = true;
    startX = (e.touches ? e.touches[0].clientX : e.clientX);
    // 目前 translateX
    const opened = drawer.classList.contains('open');
    startTx = opened ? 0 : maxTx;
    if(e.cancelable) e.preventDefault();
  };

  handle.addEventListener('mousedown', onDragStart);
  handle.addEventListener('touchstart', onDragStart, {passive:false});
  window.addEventListener('mousemove', onDragMove, {passive:false});
  window.addEventListener('touchmove', onDragMove, {passive:false});
  window.addEventListener('mouseup', onDragEnd);
  window.addEventListener('touchend', onDragEnd);

  // 提供給其他地方呼叫（如右上角人像）
  window.openVIP = openVIP;
  window.closeVIP = closeVIP;
})();

/* ===== VIP 抽屜一體式把手 ===== */
const elVipDrawer  = document.getElementById('memberPanel');   // class: vip-drawer
const elVipHandle  = document.getElementById('vipHandle');
function openVIP(){ if(!elVipDrawer) return; elVipDrawer.classList.add('open'); elVipDrawer.setAttribute('aria-hidden','false'); }
function closeVIP(){ if(!elVipDrawer) return; elVipDrawer.classList.remove('open'); elVipDrawer.setAttribute('aria-hidden','true'); }
function toggleVIP(){ elVipDrawer?.classList.contains('open') ? closeVIP() : openVIP(); }
elVipHandle && elVipHandle.addEventListener('click', (e)=>{ e.stopPropagation(); toggleVIP(); });

// 綁定 VIP 把手的點擊事件
handle.addEventListener("click", () => {
  if (panel.classList.contains("open")) {
    closeVIP();   // 已經開 → 關閉
  } else {
    openVIP();    // 關閉狀態 → 打開
  }
});

/* 詳情 BottomSheet → 打開/關閉時同步 doc 狀態，隱藏把手 */
function markSheetOpen(on){
  document.documentElement.classList.toggle('sheet-open', !!on);
}

/* 你的詳情打開處：呼叫 markSheetOpen(true) */
/* 你的詳情關閉處：呼叫 markSheetOpen(false) */

/* ===== 商家詳情：右上關閉鈕（全域） ===== */
const elSheetClose = document.getElementById('sheetClose');
if (elSheetClose){
  elSheetClose.addEventListener('click', ()=>{
    // 關閉你的詳情面板（請呼叫現有的關閉函式）
    if (typeof closeDetailSheet === 'function') closeDetailSheet();
    markSheetOpen(false);
  });
}

/* 保險：當詳情真正開啟時請調用 markSheetOpen(true);
   若你沒有集中管理，最低限度可在 open detail 的函式末尾加：markSheetOpen(true); */

  // 系統主題變化時（僅 auto 跟隨）
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{
    if ((localStorage.getItem('theme') || 'auto') === 'auto') applyTheme('auto');
  });
});


function gotoSettingsPage(){
  showPage(elSettingsPage);
  elSetLang.value = localStorage.getItem('hl_lang') || 'zh';
  elSetCurr.value = localStorage.getItem('hl_curr') || 'MYR';
  if(elSetTheme) elSetTheme.value = localStorage.getItem('hl_theme') || 'auto'; // ★ 新增
}

elSetTheme?.addEventListener('change', ()=>{
  localStorage.setItem('hl_theme', elSetTheme.value);
  applyTheme();
});


function afterAuthSuccess(){
  persist();
  updateMemberAuthButton();
  if (auth.returnTo === 'settings') {
    gotoSettingsPage();
    auth.returnTo = null;
  } else {
    showHome();
  }
}


/* ===== Helpers ===== */
function svgEmoji(emoji, bg='#ffffff'){
  const svg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>
    <rect width='100%' height='100%' rx='64' ry='64' fill='${bg}'/>
    <text x='50%' y='54%' font-size='72' text-anchor='middle' dominant-baseline='middle'>${emoji}</text>
  </svg>`);
  return `url("data:image/svg+xml,${svg}")`;
}
function tag(text){ const s = document.createElement('span'); s.className='tag'; s.textContent=text; return s; }

/* ===== Render: 分類卡片（兩欄） ===== */
function renderCats(){
  elCatGrid.innerHTML = '';
  CATS.forEach(c=>{
    const card = document.createElement('div');
    card.className = 'cat';
    card.innerHTML = `
      <div class="cover" style="background-image:url('${c.img}')"></div>
      <div class="txt">${c.name}<small>${c.en}</small></div>
    `;
    card.onclick = () => { state.cat = c.id; renderFilters(); renderHomeFromHL(); highlightCats(); };
    elCatGrid.appendChild(card);
  });
}
function highlightCats(){
  [...elCatGrid.children].forEach((node,i)=>{
    const id = CATS[i].id;
    node.style.outline = (state.cat===id)?'2px solid var(--brand)':'none';
  });
}

function renderCities(){
  elCityRow.innerHTML = '';
  DIVS.forEach(d => {
    const wrap = document.createElement('div');
    wrap.className = 'city' + (state.div === d.id ? ' active' : '');
    wrap.innerHTML = `
      <div class="avatar" style="background-image:${svgEmoji(d.emoji)}"></div>
      <div class="name">${d.name}</div>
    `;
    wrap.onclick = () => {
      gotoCityPage(d.id);
    };
    elCityRow.appendChild(wrap);
  });
}


/* ===== Render: 商家卡片清單 ===== */
/* ====== Render: 首頁兩欄大圖卡 (不依賴 HL.getHomeFeatured) ====== */
function renderHomeFromHL(mode='featured'){
  // 1) 商家清單
  const allMerchants = (HL && HL.merchants) ? HL.merchants : [];
  if(!allMerchants.length){
    console.warn('[HL] merchants list is empty');
    return;
  }

  // 2) 篩選模式
  let list = [];
  if(mode === 'latest'){
    list = [...allMerchants]               // 複製
             .sort((a,b)=> (b.createdAt||0)-(a.createdAt||0)) // 按時間新舊
             .slice(0,12);
  } else { // featured 預設
    list = allMerchants.filter(m=>m.featured).slice(0,12);
    if(list.length < 12){                  // 如果不足，補滿
      list = list.concat(allMerchants.slice(0,12-list.length));
    }
  }

  // 3) 容器
  const containerEl = document.getElementById('cardList');
  if(!containerEl){ console.warn('[HL] #cardList not found'); return; }
  containerEl.innerHTML = '';

  // 4) 渲染每張卡片
  list.forEach(m=>{
    const cover = (m.images && m.images[0]) || (window.DEFAULT_COVER || '');
    const city  = (HL.util && HL.util.cityName) ? HL.util.cityName(m.cityId) : (m.cityId || '');
    const rating= (typeof m.rating==='number') ? m.rating.toFixed(1) : '—';
    const chips = (m.tagIds || []).slice(0,2)
                   .map(id => (TAGS && TAGS[id] && TAGS[id].name) ? TAGS[id].name : id)
                   .map(t => `<span class="chip">${t}</span>`).join('');

    const el = document.createElement('div');
    el.className = 'card-mag clickable';
    el.innerHTML = `
      <div class="media" style="background-image:url('${cover}')">
        ${m.featured ? `<div class="badge hot">熱點</div>` : ``}
        <button class="fav" aria-label="收藏"></button>
      </div>
      <div class="meta-wrap">
        <div class="meta">
          <div class="title">${m.name || ''}</div>
          <div class="sub"><span class="city">${city}</span> · <span class="star">★ ${rating}</span></div>
          <div class="chips">${chips}</div>
        </div>
      </div>
    `;

    // 點擊卡片 → 詳情
    el.addEventListener('click', (ev)=>{
      if((ev.target && ev.target.classList.contains('fav'))) return;
      if (typeof hLOpenDetail === 'function' && typeof mapMerchantToDetailItem === 'function'){
        hLOpenDetail(mapMerchantToDetailItem(m));
      }
    });

    // 收藏按鈕
    const favBtn = el.querySelector('.fav');
    favBtn.addEventListener('click', (ev)=>{
      ev.stopPropagation();
      favBtn.classList.toggle('on');
    });

    containerEl.appendChild(el);
  });
}

/* ===== Render: 篩選條 ===== */
function renderFilters(){
  elFilters.innerHTML = '';
  if(state.cat) elFilters.appendChild(tag(`分類：${state.cat}`));
  if(state.div){
    const d = DIVS.find(x=>x.id===state.div);
    elFilters.appendChild(tag(`城市：${d?.name||state.div}`));
  }
}
document.getElementById('clearFilters').onclick = ()=>{
  state.cat = null; state.div = null;
  renderFilters(); renderHomeFromHL(); highlightCats(); renderCities();
};



/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  try {
    renderCats();
    renderCities();
    renderFilters();
    renderHomeFromHL();
    highlightCats();
	updateMemberAuthButton();
	applyTheme();

    console.log('[Heriland] Init 完成 ✅');
  } catch (e) {
    console.error('Init 錯誤：', e);
    alert('Init 錯誤：' + (e && e.message));
  }
});




/* ===== City page: enter / back ===== */
function gotoCityPage(cityId){
  state.view = 'city';
  state.cityId = cityId;
  state.cityCat = null; // 初始顯示全部

const QUICK_OPTIONS = [
  {id:'latest', label:'最新'},
  {id:'hot',    label:'熱門'},
  {id:'distance', label:'距離最近'},
  {id:'rating', label:'評分最高'},
];

function renderCityQuickFilters(){
  if(!elQuickRow) return;
  elQuickRow.innerHTML = '';
  QUICK_OPTIONS.forEach(opt=>{
    const btn = document.createElement('button');
    btn.className = 'qchip' + (state.citySort===opt.id ? ' active':'');
    btn.textContent = opt.label;
    btn.onclick = async ()=>{
      state.citySort = opt.id;
      state.cityFilter.sort = opt.id;
      // 若選「距離最近」→ 取得定位（一次）
      if(opt.id==='distance' && !state.cityFilter.location){
        try{
          await getUserLocationOnce();
        }catch{}
      }
      renderCityQuickFilters();
      renderCityFromHL();
    };
    elQuickRow.appendChild(btn);
  });
}

const SHEET_SORT = ['最新','熱門','距離最近','評分最高','營業中'];  // 單選（營業中作為排序組內開關）
const SHEET_THEMES = ['文化體驗','自然景點','美食推薦','親子友善','夜生活','購物','在地人愛','冷門寶藏'];
const SHEET_ATTRS  = ['清真','素食','輪椅友善','寵物友善','英文可','雨天可玩','免費入場'];

function openSheet(){
  elSheet.setAttribute('aria-hidden','false');
  elSheet.classList.add('open');
  elSheetBg.hidden = false;
  requestAnimationFrame(()=> elSheetBg.classList.add('show'));
  renderSheetOptions();
}
function closeSheet(){
  elSheet.setAttribute('aria-hidden','true');
  elSheet.classList.remove('open');
  elSheetBg.classList.remove('show');
  setTimeout(()=> elSheetBg.hidden = true, 200);
}

elOpenSheet?.addEventListener('click', openSheet);
elSheetBg?.addEventListener('click', closeSheet);

// 渲染 Sheet 選項
function renderSheetOptions(){
  // 排序（含營業中）
  elFsSort.innerHTML = '';
  SHEET_SORT.forEach(name=>{
    const id = name; // 直接用中文當 id
    const isSort = ['最新','熱門','距離最近','評分最高'].includes(name);
    const active = isSort ? (toSortId(state.cityFilter.sort)===toSortId(name)) : (state.cityFilter.openNow===true && name==='營業中');

    const o = document.createElement('div');
    o.className = 'opt' + (active?' active':'');
    o.textContent = name;
    o.onclick = async ()=>{
      if(isSort){
        state.cityFilter.sort = toSortId(name);
        state.citySort = state.cityFilter.sort;
        // 若選距離 → 獲取定位
        if(state.cityFilter.sort==='distance' && !state.cityFilter.location){
          try{ await getUserLocationOnce(); }catch{}
        }
      }else{
        state.cityFilter.openNow = !state.cityFilter.openNow; // 營業中切換
      }
      renderSheetOptions();
    };
    elFsSort.appendChild(o);
  });

  // 主題（多選）
  elFsThemes.innerHTML = '';
  SHEET_THEMES.forEach(name=>{
    const active = state.cityFilter.themes.has(name);
    const o = document.createElement('div');
    o.className = 'opt' + (active?' active':'');
    o.textContent = name;
    o.onclick = ()=>{
      if(active) state.cityFilter.themes.delete(name);
      else state.cityFilter.themes.add(name);
      renderSheetOptions();
    };
    elFsThemes.appendChild(o);
  });

  // 屬性（多選）
  elFsAttrs.innerHTML = '';
  SHEET_ATTRS.forEach(name=>{
    const active = state.cityFilter.attrs.has(name);
    const o = document.createElement('div');
    o.className = 'opt' + (active?' active':'');
    o.textContent = name;
    o.onclick = ()=>{
      if(active) state.cityFilter.attrs.delete(name);
      else state.cityFilter.attrs.add(name);
      renderSheetOptions();
    };
    elFsAttrs.appendChild(o);
  });
}

function toSortId(name){
  if(name==='最新') return 'latest';
  if(name==='熱門') return 'hot';
  if(name==='距離最近') return 'distance';
  if(name==='評分最高') return 'rating';
  return name;
}

// 底部操作
elFsReset?.addEventListener('click', ()=>{
  state.cityFilter.sort = 'latest';
  state.cityFilter.openNow = false;
  state.cityFilter.themes.clear();
  state.cityFilter.attrs.clear();
  state.citySort = 'latest';
  renderSheetOptions();
});
elFsApply?.addEventListener('click', ()=>{
  // 套用 → 重繪 Chips 與清單
  state.citySort = state.cityFilter.sort;
  renderCityQuickFilters();
  renderCityFromHL();
  closeSheet();
});

async function getUserLocationOnce(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation){ return reject(new Error('此裝置不支援定位')); }
    navigator.geolocation.getCurrentPosition(pos=>{
      state.cityFilter.location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      resolve();
    }, err=>{
      console.warn('定位失敗：', err);
      reject(err);
    }, { enableHighAccuracy:true, timeout:8000, maximumAge:60000 });
  });
}
function distanceKm(a, b){
  if(!a || !b) return Infinity;
  const R = 6371;
  const dLat = (b.lat-a.lat)*Math.PI/180;
  const dLng = (b.lng-a.lng)*Math.PI/180;
  const la = a.lat*Math.PI/180, lb = b.lat*Math.PI/180;
  const h = Math.sin(dLat/2)**2 + Math.cos(la)*Math.cos(lb)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

  // 隱藏首頁三段
  secHomeCats.classList.add('hidden');
  secHomeCities.classList.add('hidden');
  secHomeList.classList.add('hidden');

  // 顯示城市頁
  elCityPage.classList.remove('hidden');
  elCityPage.setAttribute('aria-hidden', 'false');

  renderCityHeader();
  renderCityCatChips();
	renderCityQuickFilters();
  renderCityFromHL();
}

function backToHome(){
  state.view = 'home';
  state.cityId = null;
  state.cityCat = null;

  // 顯示首頁三段
  secHomeCats.classList.remove('hidden');
  secHomeCities.classList.remove('hidden');
  secHomeList.classList.remove('hidden');

  // 隱藏城市頁
  elCityPage.classList.add('hidden');
  elCityPage.setAttribute('aria-hidden', 'true');
}

elCityBack.addEventListener('click', backToHome);

/* ===== City page: header / chips / items ===== */
function renderCityHeader(){
  const d = DIVS.find(x => x.id === state.cityId);
  const title = d ? d.name : 'City';
  elCityTitle.textContent = title;

  // 用現成的 svgEmoji() 當 hero（離線可用）
  const heroBg = svgEmoji(d?.emoji || '📍', '#ffffff');
  elCityHero.style.backgroundImage = heroBg;
  elCityHero.innerHTML = `<div class="badge-wrap"><span class="badge">探索 ${title}</span></div>`;
}

function renderCityCatChips(){
  // 用你目前的 CATS（若是物件陣列，取 id；若是字串陣列，直接用）
  const catIds = Array.isArray(CATS) && typeof CATS[0] === 'object' ? CATS.map(c => c.id) : CATS;
  const chips = ['全部', ...catIds];

  elCityCatChips.innerHTML = '';
  chips.forEach(label => {
    const isAll = label === '全部';
    const active = (isAll && !state.cityCat) || (!isAll && state.cityCat === label);
    const chip = document.createElement('div');
    chip.className = 'chip' + (active ? ' active' : '');
    chip.textContent = label;
    chip.onclick = () => {
      state.cityCat = isAll ? null : label;
      renderCityCatChips();
      renderCityFromHL();
    };
    elCityCatChips.appendChild(chip);
  });
}

// ===== 城市頁渲染：單欄三區塊卡 =====
function renderCityFromHL(containerEl, cityId){
  const host = containerEl || document.getElementById('cityCardList');
  if(!host) return;
  host.className = 'cards list-1';

  const data = (window.HL && HL.MERCHANTS) ? HL.MERCHANTS : [];
  let list = data.filter(m=> m.cityId === (cityId || state.cityId) && m.status === 'active');

  // 依需求排序（最新/熱門/評分/距離）
  const sort = state?.citySort || 'latest';
  if(sort==='latest') list.sort((a,b)=> new Date(b.updatedAt)-new Date(a.updatedAt));
  else if(sort==='hot') list.sort((a,b)=> (b.featured===a.featured ? (b.rating||0)-(a.rating||0) : (b.featured?1:0)-(a.featured?1:0)));
  else if(sort==='rating') list.sort((a,b)=> (b.rating||0)-(a.rating||0));
  // 距離排序需自備使用者位置 me = {lat,lng} 和商家 location

  host.innerHTML = '';
  list.forEach(m=>{
    const el = document.createElement('div');
    el.className = 'card-dir clickable';
    el.innerHTML = `
      <div class="thumb" style="background-image:url('${(m.images&&m.images[0])||DEFAULT_COVER}')"></div>
      <div class="content">
        <div class="title">${m.name}</div>
        <div class="sub">${m.address || ''} ${m.phone?` · ${m.phone}`:''}</div>
      </div>
      <div class="actions">
        <button class="icon-btn map" title="導航">📍</button>
      </div>
    `;
    el.querySelector('.map')?.addEventListener('click', (e)=>{
      e.stopPropagation();
      const q = encodeURIComponent(`${m.name} ${m.address||''}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`,'_blank');
    });
    el.addEventListener('click', ()=> hlOpenDetail(mapMerchantToDetailItem(m)));
// 打開詳情的地方（例如 hlOpenDetail / openDetailSheet）
document.documentElement.classList.add('sheet-open');

// 關閉詳情的地方（例如 hlCloseDetail / closeDetailSheet）
document.documentElement.classList.remove('sheet-open');

    host.appendChild(el);
  });
}

function mapMerchantToDetailItem(m){
  return {
    id: m.id,
    title: m.name,
    div: m.cityId,
    address: m.address,
    phone: m.phone || '',
    cover: (m.images && m.images[0]) || DEFAULT_COVER,
    photos: m.images || [],
    tags: m.tagIds || [],
    themes: m.tagIds || [],
    rating: m.rating,
    open: (m.openHours||'').split('-')[0]?.trim() || '',
    close: (m.openHours||'').split('-')[1]?.trim() || '',
    lat: m.location?.lat,
    lng: m.location?.lng,
    desc: m.description || ''
  };
}

// ==== 下滑關閉：改良版（避免誤觸） ====
(function(){
  let startY=0, dy=0, dragging=false, startTime=0;
  hlSheet.addEventListener('touchstart', (e)=>{
    dragging = true;
    startY   = e.touches[0].clientY;
    dy       = 0;
    startTime= Date.now();
  }, {passive:true});

  hlSheet.addEventListener('touchmove', (e)=>{
    if(!dragging) return;
    dy = Math.max(0, e.touches[0].clientY - startY);
    if(dy > 0){
      hlSheet.style.transform = `translateY(${dy}px)`;
      hlBackdrop.style.opacity = String(Math.max(0, 1 - dy/200));
    }
  }, {passive:true});

  hlSheet.addEventListener('touchend', ()=>{
    dragging=false;
    const dt    = Date.now() - startTime;
    const speed = dy/dt; // px/ms
    if(dy > 150 && speed < 1){ 
      // 慢速且距離夠 → 關閉
      hlCloseDetail(); 
    }else{
      // 還原
      hlSheet.style.transform = '';
      hlBackdrop.style.opacity = '';
    }
  }, {passive:true});
})();




// ===== Data source 設定：builtin / remote / hybrid =====
window.DATA_SOURCE_MODE = window.DATA_SOURCE_MODE || 'hybrid';

// 建立索引用的小工具
function arrToMap(arr, key='id'){ const m={}; (arr||[]).forEach(x=> m[x[key]]=x); return m; }

// 將 merchants.json → 轉成你 UI 既有的 ITEM 形狀
function mapMerchantToItem(m, citiesMap, tagsMap){
  // openHours 可能是 "09:00-18:00"
  let open='', close='';
  if(typeof m.openHours==='string' && m.openHours.includes('-')){
    const [o,c] = m.openHours.split('-').map(s=>s.trim());
    open=o; close=c;
  }
  const tagNames = (m.tagIds||[]).map(id=> (tagsMap[id]?.name || id));
  const cover = (m.images && m.images[0]) ? m.images[0] : (window.DEFAULT_COVER || '');

  // 最新/熱門的推斷（你可依需求調整）
  const updated = m.updatedAt ? new Date(m.updatedAt) : null;
  const days = updated ? ((Date.now() - updated.getTime())/86400000) : 999;
  const latest = days <= 14;                      // 兩週內更新算最新
  const hot = !!m.featured || (m.rating||0)>=4.5; // featured 或高分算熱門

  return {
    id: m.id,
    title: m.name,
    div: m.cityId,                 // 你現有程式用 div 當 cityId
    cat: '',                       // 若需要分類再補
    address: m.address || '',
    phone: m.phone || '',
    lat: m.location?.lat,
    lng: m.location?.lng,
    cover,
    photos: m.images || [],
    tags: tagNames,                // 直接映射成文字 chips
    latest,
    hot,
    rating: m.rating || 0,
    price: m.priceLevel ?? null,
    open, close,
    openNow: false,                // 簡化：先不動態判斷
    desc: m.description || ''
  };
}

