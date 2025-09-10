
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

    // 更穩的 current 推斷：找“非 next”且目前可見者
    let current = views.find(v => v !== nextEl && v.classList.contains('show') && !v.hasAttribute('hidden'));
    // 如果沒有標記 show，但實際未 hidden，也視為 current
    if (!current) current = views.find(v => v !== nextEl && !v.hasAttribute('hidden'));

    // 當前與目標相同就不切
    if (current === nextEl){
      isTransitioning = false;
      return;
    }

    // 進場/退場 class
    const enter = direction==='back' ? 'view-enter-back' : 'view-enter';
    const leave = direction==='back' ? 'view-leave-back' : 'view-leave';

    // 先確保目標可見
    nextEl.removeAttribute('hidden');
    nextEl.classList.add('show', enter);

    requestAnimationFrame(()=>{
      nextEl.classList.add('view-enter-active');
      nextEl.classList.remove(enter);

      if (current){
        current.classList.add(leave, 'view-leave-active');
      }

      setTimeout(()=>{
        // 動畫結束，強制維持單一顯示
        nextEl.classList.remove('view-enter-active');
        forceSingleView(nextEl);
        isTransitioning = false;
      }, 320); // 動畫時間稍微 > CSS transition
    });
  };

  // ——（可選）初始化：只顯示 dashboard —— //
  document.addEventListener('DOMContentLoaded', ()=>{
    const dash = byId('vipDashboard');
    if (dash) forceSingleView(dash);
  });
})();
  }

  // 點六顆按鈕
  // 功能钮：允许其它处理器继续执行（比如你的内容加载器）
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.feature-card[data-target]');
  if (!btn) return;

  e.preventDefault(); // 避免 <a> 跳页；保留事件继续冒泡
  const id = btn.getAttribute('data-target');
  const next = document.getElementById(id);
  if (!next) { console.warn('[router] view not found:', id); return; }

  // 我们先做可见性切换（只保留一个视图）
  showView(next, 'forward');

  // ⭐ 主动发一个事件，给你的其它代码接力（加载数据/渲染）
  next.dispatchEvent(new CustomEvent('hl:view:shown', {bubbles:true, detail:{id}}));
}, true); // 仍然用捕获，保证先切换，但不阻断其它监听

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
