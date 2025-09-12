/* Heriland - Settings page only
   Scope: #settings 內元素；不接管全站抽屜/路由/登入 */
(function(){
  'use strict';

  const root = document.getElementById('settings');
  if (!root) return;

  // ---------- scoped helpers ----------
  const $  = (sel, el=root) => el.querySelector(sel);
  const $$ = (sel, el=root) => Array.from(el.querySelectorAll(sel));

  const els = {
    lang:  $('#prefLang'),
    theme: $('#prefTheme'),
    nTrips:  $('#notifyTrips'),
    nDeals:  $('#notifyDeals'),
    nSystem: $('#notifySystem'),
    goHome: $('#hlGoHome'),
  };

  // 依文字內容找到某一列（避免必須改 HTML 加 id）
  function findItemByText(txt){
    txt = String(txt).trim();
    const items = $$('.settings-item');
    return items.find(b => (b.textContent || '').trim().startsWith(txt));
  }

  const btn = {
    accountManage: findItemByText('帳號管理'),
    logout:        findItemByText('登出'),
    delete:        findItemByText('刪除帳號'),
    clearCache:    findItemByText('清除快取'),
    help:          findItemByText('幫助中心'),
    contact:       findItemByText('聯絡客服'),
    terms:         findItemByText('條款與隱私政策'),
    version:       findItemByText('版本資訊'),
    about:         findItemByText('關於我們')
  };

  // ---------- Local storage keys ----------
  const LS = {
    theme:   'hl_pref_theme',   // light | dark | auto
    lang:    'hl_pref_lang',
    nTrips:  'hl_notify_trips',
    nDeals:  'hl_notify_deals',
    nSystem: 'hl_notify_system'
  };

  // ---------- Theme (light/dark/auto) with smooth transition ----------
  function applyTheme(pref){
    const html = document.documentElement;

    // 平滑過渡（只在切換瞬間開啟 300ms）
    html.style.transition = 'background-color .3s ease, color .3s ease';
    setTimeout(()=>{ html.style.transition = ''; }, 320);

    if (pref === 'auto'){
      html.removeAttribute('data-theme'); // 交給系統 prefers-color-scheme
    } else {
      html.setAttribute('data-theme', pref); // 你的全站 CSS 可用 [data-theme="dark|light"] 做覆蓋
    }
    localStorage.setItem(LS.theme, pref);
    // 廣播全站（若有人要同步調整）
    root.dispatchEvent(new CustomEvent('hl:theme:changed', {bubbles:true, detail:{ theme: pref }}));
  }

  // ---------- Language ----------
  function applyLang(lang){
    localStorage.setItem(LS.lang, lang);
    // 廣播給全站（由你去換文案/重載字串）
    root.dispatchEvent(new CustomEvent('hl:locale:changed', {bubbles:true, detail:{ lang }}));
  }

  // ---------- Notifications (iOS switch) ----------
  function applyToggle(el, key){
    if (!el) return;
    const on = !!el.checked;
    localStorage.setItem(key, JSON.stringify(on));
    root.dispatchEvent(new CustomEvent('hl:notify:changed', {bubbles:true, detail:{ key, value:on }}));
  }

  // ---------- Logout / Delete account / Clear cache ----------
  async function doLogout(){
    try{
      if (window.Auth && typeof window.Auth.signOut === 'function'){
        await window.Auth.signOut();
      }
      // 廣播：讓會員中心刷新成未登入
      root.dispatchEvent(new CustomEvent('hl:auth:logout', {bubbles:true}));
      // 顯示登入彈窗（若有）
      if (typeof window.hlOpenLogin === 'function') window.hlOpenLogin();
    }catch(err){
      console.warn('[settings] logout error', err);
    }
  }

  async function doDeleteAccount(){
    // 簡易確認（之後可換成你站內的毛玻璃確認框）
    if (!confirm('確定要刪除帳號嗎？此動作無法復原。')) return;
    try{
      if (window.Auth && typeof window.Auth.deleteAccount === 'function'){
        await window.Auth.deleteAccount();
      }
      root.dispatchEvent(new CustomEvent('hl:auth:deleted', {bubbles:true}));
      if (typeof window.hlOpenLogin === 'function') window.hlOpenLogin();
    }catch(err){
      console.warn('[settings] delete error', err);
      alert('刪除失敗，請稍後再試或聯絡客服。');
    }
  }

  function doClearCache(){
    // 清除本站常用快取（依你實作調整）
    try{
      // 推薦 / 行程 / 收藏 / 足跡 等本地 keys（若不存在會無感）
      localStorage.removeItem('hl_rec_hidden');
      localStorage.removeItem('hl_rec_addedTrip');
      localStorage.removeItem('hl_fp_records');     // 足跡
      localStorage.removeItem('hl_trip_plans');     // 行程規劃
      localStorage.removeItem('hl_fav_store');      // 收藏（若 HLFavorites 使用）
      if (window.HLFavorites && typeof window.HLFavorites.clear === 'function'){
        window.HLFavorites.clear();
      }
      root.dispatchEvent(new CustomEvent('hl:toast', {bubbles:true, detail:{ type:'success', text:'快取已清除' }}));
    }catch(err){
      console.warn('[settings] clear cache error', err);
    }
  }

  // ---------- Version info (可選：自動補副標) ----------
  (function injectVersionSubtext(){
    if (!btn.version) return;
    const span = document.createElement('span');
    span.className = 'subtext';
    const ver = (window.HL_VERSION || '1.0.0');
    span.innerHTML = `當前版本 ${ver}<br><small>已是最新版本</small>`;
    btn.version.appendChild(span);
  })();

  // ---------- Bind events ----------
  // Theme
  els.theme?.addEventListener('change', (e)=> applyTheme(e.target.value));
  // Lang
  els.lang?.addEventListener('change', (e)=> applyLang(e.target.value));

  // Toggles
  els.nTrips?.addEventListener('change', ()=> applyToggle(els.nTrips, LS.nTrips));
  els.nDeals?.addEventListener('change', ()=> applyToggle(els.nDeals, LS.nDeals));
  els.nSystem?.addEventListener('change',()=> applyToggle(els.nSystem,LS.nSystem));

  // Buttons
  btn.logout?.addEventListener('click', doLogout);
  btn.delete?.addEventListener('click', doDeleteAccount);
  btn.clearCache?.addEventListener('click', doClearCache);

  // 導覽（不覆寫全站，只是備援）
  els.goHome?.addEventListener('click', ()=>{
    root.dispatchEvent(new CustomEvent('hl:navigate:home', {bubbles:true, detail:{ source:'settings' }}));
    if (typeof window.hlGoHome === 'function') window.hlGoHome();
  });
  btn.help?.addEventListener('click', ()=>{
    root.dispatchEvent(new CustomEvent('hl:navigate:help', {bubbles:true}));
  });
  btn.contact?.addEventListener('click', ()=>{
    root.dispatchEvent(new CustomEvent('hl:navigate:contact', {bubbles:true}));
  });
  btn.terms?.addEventListener('click', ()=>{
    root.dispatchEvent(new CustomEvent('hl:navigate:legal', {bubbles:true}));
  });
  btn.about?.addEventListener('click', ()=>{
    root.dispatchEvent(new CustomEvent('hl:navigate:about', {bubbles:true}));
  });
  btn.accountManage?.addEventListener('click', ()=>{
    root.dispatchEvent(new CustomEvent('hl:navigate:account', {bubbles:true}));
  });

  // ---------- Load initial prefs ----------
  (function init(){
    // theme
    const themePref = localStorage.getItem(LS.theme) || 'auto';
    if (els.theme) els.theme.value = themePref;
    applyTheme(themePref);

    // lang
    const langPref = localStorage.getItem(LS.lang) || (els.lang?.value || 'zh-tw');
    if (els.lang) els.lang.value = langPref;

    // toggles
    const vTrips  = JSON.parse(localStorage.getItem(LS.nTrips)  ?? 'true');
    const vDeals  = JSON.parse(localStorage.getItem(LS.nDeals)  ?? 'true');
    const vSystem = JSON.parse(localStorage.getItem(LS.nSystem) ?? 'true');
    if (els.nTrips)  els.nTrips.checked  = vTrips;
    if (els.nDeals)  els.nDeals.checked  = vDeals;
    if (els.nSystem) els.nSystem.checked = vSystem;
  })();

})();