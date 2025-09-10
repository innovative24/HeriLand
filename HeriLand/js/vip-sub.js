(function(){
  const $$  = s => Array.from(document.querySelectorAll(s));
  const $id = id => document.getElementById(id);

  function showView(nextEl, direction='forward'){
    const views = $$('.vip-view');
    const current = views.find(v => v.classList.contains('show'));
    if (current === nextEl) return;

    const enter = direction==='back' ? 'view-enter-back' : 'view-enter';
    const leave = direction==='back' ? 'view-leave-back' : 'view-leave';

    // 先確保顯示
    nextEl.removeAttribute('hidden');        // ★ 移除 hidden 屬性
    nextEl.classList.add('show', enter);

    requestAnimationFrame(()=>{
      nextEl.classList.add('view-enter-active');
      nextEl.classList.remove(enter);

      if (current){
        current.classList.add(leave, 'view-leave-active');
      }

      setTimeout(()=>{
        nextEl.classList.remove('view-enter-active');

        if (current){
          current.classList.remove(leave, 'view-leave-active', 'show');
          current.setAttribute('hidden',''); // ★ 隱藏舊畫面
        }
      }, 300);
    });
  }

  // 點六顆按鈕
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.feature-card[data-target]');
    if(!btn) return;
    e.preventDefault();
    const id = btn.getAttribute('data-target'); // e.g. "trips"
    const next = $id(id);
    if (!next) {
      console.warn('[VIP] 找不到子頁 id =', id);
      return;
    }
    showView(next, 'forward');
  });

  // 返回
  document.addEventListener('click', (e)=>{
    const back = e.target.closest('[data-back]');
    if(!back) return;
    e.preventDefault();
    const dash = $id('vipDashboard');
    if (dash) showView(dash, 'back');
  });

  // 初始化：只顯示 vipDashboard
  document.addEventListener('DOMContentLoaded', ()=>{
    const dash = $id('vipDashboard');
    $$('.vip-view').forEach(v=>{
      if (v === dash){ v.removeAttribute('hidden'); v.classList.add('show'); }
      else { v.setAttribute('hidden',''); v.classList.remove('show'); }
    });
  });
})();

document.getElementById('trips').removeAttribute('hidden');
document.getElementById('trips').classList.add('show');
