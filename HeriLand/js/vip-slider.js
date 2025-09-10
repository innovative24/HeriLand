
(function(){
  const wrap = document.getElementById('vipPromo');
  if(!wrap) return;

  const track = wrap.querySelector('.vip-carousel-track');
  const slides = Array.from(wrap.querySelectorAll('.vip-slide'));
  const prev = wrap.querySelector('.vip-ctrl.prev');
  const next = wrap.querySelector('.vip-ctrl.next');
  const dotsWrap = wrap.querySelector('.vip-dots');

  if(!track || slides.length===0) return;

  let i = 0, timer = null;

  // dots
  slides.forEach((_, idx)=>{
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'go to slide ' + (idx+1));
    if(idx===0) b.setAttribute('aria-current','true');
    b.addEventListener('click', ()=> go(idx, true));
    dotsWrap.appendChild(b);
  });
  const dots = Array.from(dotsWrap.children);

  function go(idx, user=false){
    i = (idx + slides.length) % slides.length;
    track.style.transform = `translateX(-${i*100}%)`;
    dots.forEach((d, k)=> d.toggleAttribute('aria-current', k===i));
    if(user) restart();
  }
  function nextSlide(user=false){ go(i+1, user); }
  function prevSlide(user=false){ go(i-1, user); }

  function start(){ timer = setInterval(()=> nextSlide(false), 4000); }
  function stop(){ clearInterval(timer); timer = null; }
  function restart(){ stop(); start(); }

  next?.addEventListener('click', ()=> nextSlide(true));
  prev?.addEventListener('click', ()=> prevSlide(true));
  wrap.addEventListener('mouseenter', stop);
  wrap.addEventListener('mouseleave', start);

  // 初始化
  go(0);
  start();
})();
