// —— 強化版視圖切換：永遠只顯示 1 個視圖，含動畫鎖 —— //
(function(){
  const $$  = s => Array.from(document.querySelectorAll(s));
  const byId = id => document.getElementById(id);

  let isTransitioning = false;

  function forceSingleView(keepEl){
    const views = $$('.vip-view');
    views.forEach(v=>{
      if (v === keepEl){
        v.classList.add('show');
        v.removeAttribute('hidden');
      } else {
        v.classList.remove('show','view-enter','view-enter-active','view-leave','view-leave-active',
                           'view-enter-back','view-leave-back');
        v.setAttribute('hidden','');
      }
    });
  }

  window.showView = function showView(nextEl, direction='forward'){
    if (!nextEl) return;
    if (isTransitioning) return; // 避免快速連點
    isTransitioning = true;

    const views = $$('.vip-view');
    let current = views.find(v => v !== nextEl && !v.hasAttribute('hidden'));

    if (current === nextEl){
      isTransitioning = false;
      return;
    }

    const enter = direction==='back' ? 'view-enter-back' : 'view-enter';
    const leave = direction==='back' ? 'view-leave-back' : 'view-leave';

    nextEl.removeAttribute('hidden');
    nextEl.classList.add('show', enter);

    requestAnimationFrame(()=>{
      nextEl.classList.add('view-enter-active');
      nextEl.classList.remove(enter);

      if (current){
        current.classList.add(leave, 'view-leave-active');
      }

      setTimeout(()=>{
        nextEl.classList.remove('view-enter-active');
        forceSingleView(nextEl);
        isTransitioning = false;
      }, 320);
    });
  };

  // —— 點六顆按鈕 —— //
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.feature-card[data-target]');
    if (!btn) return;

    e.preventDefault();
    const id = btn.getAttribute('data-target');
    const next = byId(id);
    if (!next) { console.warn('[router] view not found:', id); return; }

    showView(next, 'forward');
    next.dispatchEvent(new CustomEvent('hl:view:shown', {bubbles:true, detail:{id}}));
  }, true);

  // —— 返回 —— //
  document.addEventListener('click', (e)=>{
    const back = e.target.closest('[data-back]');
    if(!back) return;
    e.preventDefault();
    const dash = byId('vipDashboard');
    if (dash) showView(dash, 'back');
  });

  // —— 初始化：只顯示 vipDashboard —— //
  document.addEventListener('DOMContentLoaded', ()=>{
    const dash = byId('vipDashboard');
    if (dash) forceSingleView(dash);
  });
})();