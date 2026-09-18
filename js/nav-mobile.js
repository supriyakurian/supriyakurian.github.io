(function(){
  var btn = document.querySelector('.nav-hamburger');
  var menu = document.getElementById('navMobileMenu');
  var nav = document.querySelector('.nav');
  if(!btn || !menu) return;

  function closeMenu(){
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-label','Open navigation');
  }
  function openMenu(){
    menu.classList.add('open');
    btn.setAttribute('aria-expanded','true');
    btn.setAttribute('aria-label','Close navigation');
  }

  btn.addEventListener('click',function(e){
    e.stopPropagation();
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });

  menu.querySelectorAll('.nav-mobile-link').forEach(function(link){
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click',function(e){
    if(!nav.contains(e.target) && !menu.contains(e.target)) closeMenu();
  });

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape') closeMenu();
  });
})();
