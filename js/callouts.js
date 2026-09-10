(function(){
  'use strict';

  // Only run on pages with callout pins
  var mainPins = document.querySelectorAll('.cs-callout-pin[data-pin]');
  if(!mainPins.length) return;

  // Touch detection
  var isTouchDevice = false;
  window.addEventListener('touchstart', function(){ isTouchDevice = true; }, {once:true, passive:true});

  // ── Build legend map ──
  var legendMap = {};
  document.querySelectorAll('.cs-callout-legend li[data-pin]').forEach(function(li){
    var n = li.dataset.pin;
    var clone = li.cloneNode(true);
    var numEl = clone.querySelector('.cs-callout-num');
    if(numEl) numEl.remove();
    var text = clone.textContent.trim();
    var sep = text.indexOf(' — ');
    legendMap[n] = {
      title: sep > -1 ? text.slice(0, sep).trim() : text,
      desc:  sep > -1 ? text.slice(sep + 3).trim() : ''
    };
  });

  // ── Collect pin positions ──
  var pinPositions = [];
  mainPins.forEach(function(pin){
    var style = pin.getAttribute('style') || '';
    var tm = style.match(/top:\s*([^;]+)/);
    var lm = style.match(/left:\s*([^;]+)/);
    pinPositions.push({ n: pin.dataset.pin, top: tm ? tm[1].trim() : '0%', left: lm ? lm[1].trim() : '0%' });
  });

  // ══════════════════════════════════════
  //  MAIN PAGE — tooltip
  // ══════════════════════════════════════
  var mpTip = document.createElement('div');
  mpTip.className = 'cs-pin-tooltip';
  mpTip.setAttribute('role', 'tooltip');
  mpTip.innerHTML = '<div class="cs-pin-tooltip-title"></div><div class="cs-pin-tooltip-desc"></div>';
  document.body.appendChild(mpTip);
  var mpTipTitle = mpTip.querySelector('.cs-pin-tooltip-title');
  var mpTipDesc  = mpTip.querySelector('.cs-pin-tooltip-desc');
  var activeMainPin = null;

  function mpPosition(pin){
    var r = pin.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    var tw = Math.min(240, vw - 24);
    var left = r.right + 12;
    var top  = r.top + r.height / 2 - 32;
    if(left + tw > vw - 8){ left = r.left - tw - 12; }
    if(left < 8){ left = 8; }
    if(top < 8){ top = 8; }
    if(top + 76 > vh - 8){ top = vh - 84; }
    mpTip.style.left = left + 'px';
    mpTip.style.top  = top  + 'px';
    mpTip.style.maxWidth = tw + 'px';
  }
  function mpShow(pin){
    var d = legendMap[pin.dataset.pin] || {title:'', desc:''};
    mpTipTitle.textContent = d.title;
    mpTipDesc.textContent  = d.desc;
    mpTipDesc.style.display = d.desc ? '' : 'none';
    mpPosition(pin);
    mpTip.classList.add('visible');
  }
  function mpHide(){
    mpTip.classList.remove('visible');
    activeMainPin = null;
  }
  function highlightLegend(n){
    document.querySelectorAll('.cs-callout-legend li[data-pin]').forEach(function(li){
      li.classList.toggle('pin-active', li.dataset.pin === n);
    });
  }
  function clearLegend(){
    document.querySelectorAll('.cs-callout-legend li.pin-active').forEach(function(li){
      li.classList.remove('pin-active');
    });
  }

  mainPins.forEach(function(pin){
    var n = pin.dataset.pin;
    var scrollEl = pin.closest('.cs-final-scroll');
    if(scrollEl){
      scrollEl.addEventListener('scroll', function(){
        if(activeMainPin === pin) mpPosition(pin);
      }, {passive:true});
    }
    pin.addEventListener('mouseenter', function(){
      if(isTouchDevice) return;
      activeMainPin = pin; pin.classList.add('pin-active');
      mpShow(pin); highlightLegend(n);
    });
    pin.addEventListener('mouseleave', function(){
      if(isTouchDevice) return;
      pin.classList.remove('pin-active'); mpHide(); clearLegend();
    });
    pin.addEventListener('focus', function(){
      activeMainPin = pin; pin.classList.add('pin-active');
      mpShow(pin); highlightLegend(n);
    });
    pin.addEventListener('blur', function(){
      pin.classList.remove('pin-active'); mpHide(); clearLegend();
    });
    pin.addEventListener('click', function(e){
      e.stopPropagation();
      if(!isTouchDevice) return;
      if(activeMainPin === pin){
        pin.classList.remove('pin-active'); mpHide(); clearLegend();
      } else {
        document.querySelectorAll('.cs-callout-pin.pin-active').forEach(function(p){ p.classList.remove('pin-active'); });
        activeMainPin = pin; pin.classList.add('pin-active');
        mpShow(pin); highlightLegend(n);
      }
    });
  });

  document.querySelectorAll('.cs-callout-legend li[data-pin]').forEach(function(li){
    var n = li.dataset.pin;
    li.addEventListener('mouseenter', function(){
      if(isTouchDevice) return;
      var p = document.querySelector('.cs-callout-pin[data-pin="'+n+'"]');
      if(p) p.classList.add('pin-active');
      li.classList.add('pin-active');
    });
    li.addEventListener('mouseleave', function(){
      if(isTouchDevice) return;
      var p = document.querySelector('.cs-callout-pin[data-pin="'+n+'"]');
      if(p) p.classList.remove('pin-active');
      li.classList.remove('pin-active');
    });
  });

  document.addEventListener('click', function(){
    if(!isTouchDevice) return;
    if(activeMainPin) activeMainPin.classList.remove('pin-active');
    mpHide(); clearLegend();
  });

  // ══════════════════════════════════════
  //  ANNOTATED LIGHTBOX
  // ══════════════════════════════════════
  var finalWrap = document.querySelector('.cs-final-img-wrap');
  var mainImg   = finalWrap && finalWrap.querySelector('.cs-final-image');
  if(!finalWrap || !mainImg) return;

  // Hide expand button — whole-image click is the affordance
  var expandBtn = finalWrap.querySelector('.cs-step-expand');
  if(expandBtn) expandBtn.style.display = 'none';

  // Build lightbox element
  var lb = document.createElement('div');
  lb.className = 'cs-ann-lb';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Screenshot viewer');
  lb.innerHTML = [
    '<div class="cs-ann-lb-bg"></div>',
    '<div class="cs-ann-lb-inner">',
      '<button class="cs-ann-lb-close" aria-label="Close">&#xd7;</button>',
      '<div class="cs-ann-lb-img-wrap">',
        '<img class="cs-ann-lb-img" src="" alt="">',
      '</div>',
    '</div>',
    '<div class="cs-ann-lb-tip" role="tooltip">',
      '<div class="cs-ann-lb-tip-title"></div>',
      '<div class="cs-ann-lb-tip-desc"></div>',
    '</div>',
    '<div class="cs-ann-lb-pop">',
      '<div class="cs-ann-lb-pop-hd">',
        '<span class="cs-ann-lb-pop-num"></span>',
        '<button class="cs-ann-lb-pop-x" aria-label="Close">&#xd7;</button>',
      '</div>',
      '<div class="cs-ann-lb-pop-title"></div>',
      '<div class="cs-ann-lb-pop-desc"></div>',
    '</div>'
  ].join('');
  document.body.appendChild(lb);

  var lbBg       = lb.querySelector('.cs-ann-lb-bg');
  var lbInner    = lb.querySelector('.cs-ann-lb-inner');
  var lbClose    = lb.querySelector('.cs-ann-lb-close');
  var lbImgWrap  = lb.querySelector('.cs-ann-lb-img-wrap');
  var lbImg      = lb.querySelector('.cs-ann-lb-img');
  var lbTip      = lb.querySelector('.cs-ann-lb-tip');
  var lbTipTitle = lb.querySelector('.cs-ann-lb-tip-title');
  var lbTipDesc  = lb.querySelector('.cs-ann-lb-tip-desc');
  var lbPop      = lb.querySelector('.cs-ann-lb-pop');
  var lbPopNum   = lb.querySelector('.cs-ann-lb-pop-num');
  var lbPopX     = lb.querySelector('.cs-ann-lb-pop-x');
  var lbPopTitle = lb.querySelector('.cs-ann-lb-pop-title');
  var lbPopDesc  = lb.querySelector('.cs-ann-lb-pop-desc');

  // Inject pins into lightbox
  var lbPins = {};
  pinPositions.forEach(function(p){
    var btn = document.createElement('button');
    btn.className = 'cs-ann-lb-pin';
    btn.dataset.pin = p.n;
    btn.setAttribute('aria-label', 'Callout ' + p.n + (legendMap[p.n] ? ': ' + legendMap[p.n].title : ''));
    btn.textContent = p.n;
    btn.style.top  = p.top;
    btn.style.left = p.left;
    lbImgWrap.appendChild(btn);
    lbPins[p.n] = btn;
  });

  // ── Tooltip (desktop hover) ──
  var activeLbPin = null;
  function lbTipPosition(pin){
    var r  = pin.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    var tw = Math.min(260, vw - 24);
    var left = r.right + 14;
    var top  = r.top + r.height / 2 - 36;
    if(left + tw > vw - 8){ left = r.left - tw - 14; }
    if(left < 8){ left = 8; }
    if(top < 8){ top = 8; }
    if(top + 82 > vh - 8){ top = vh - 90; }
    lbTip.style.left = left + 'px';
    lbTip.style.top  = top  + 'px';
    lbTip.style.maxWidth = tw + 'px';
  }
  function showLbTip(pin){
    var d = legendMap[pin.dataset.pin] || {title:'', desc:''};
    lbTipTitle.textContent = d.title;
    lbTipDesc.textContent  = d.desc;
    lbTipDesc.style.display = d.desc ? '' : 'none';
    lbTipPosition(pin);
    lbTip.classList.add('visible');
  }
  function hideLbTip(){ lbTip.classList.remove('visible'); }

  // ── Popover (mobile tap) ──
  function showPopover(pin){
    var d = legendMap[pin.dataset.pin] || {title:'', desc:''};
    lbPopNum.textContent   = 'Callout ' + pin.dataset.pin;
    lbPopTitle.textContent = d.title;
    lbPopDesc.textContent  = d.desc;
    lbPopDesc.style.display = d.desc ? '' : 'none';
    Object.keys(lbPins).forEach(function(k){ lbPins[k].classList.remove('lb-active'); });
    pin.classList.add('lb-active');
    activeLbPin = pin;
    lbPop.classList.add('visible');
  }
  function hidePopover(){
    lbPop.classList.remove('visible');
    if(activeLbPin){ activeLbPin.classList.remove('lb-active'); activeLbPin = null; }
  }

  // Pin event handlers
  Object.keys(lbPins).forEach(function(n){
    var pin = lbPins[n];
    pin.addEventListener('mouseenter', function(){ if(!isTouchDevice) showLbTip(pin); });
    pin.addEventListener('mouseleave', function(){ if(!isTouchDevice) hideLbTip(); });
    pin.addEventListener('click', function(e){
      e.stopPropagation();
      if(!isTouchDevice) return;
      if(activeLbPin === pin){ hidePopover(); } else { showPopover(pin); }
    });
    pin.addEventListener('focus', function(){ if(!isTouchDevice) showLbTip(pin); });
    pin.addEventListener('blur',  function(){ if(!isTouchDevice) hideLbTip(); });
  });

  lbPopX.addEventListener('click', function(e){ e.stopPropagation(); hidePopover(); });
  lbPop.addEventListener('click',  function(e){ e.stopPropagation(); });

  // ── Open / close ──
  function openLb(){
    lbImg.src = mainImg.src;
    lbImg.alt = mainImg.alt;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    hideLbTip(); hidePopover();
    lbClose.focus();
  }
  function closeLb(){
    lb.classList.remove('open');
    document.body.style.overflow = '';
    hideLbTip(); hidePopover();
    Object.keys(lbPins).forEach(function(k){ lbPins[k].classList.remove('lb-active'); });
  }

  lbClose.addEventListener('click', closeLb);
  lb.addEventListener('click', function(e){
    if(e.target === lb || e.target === lbBg) closeLb();
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && lb.classList.contains('open')) closeLb();
  });

  // Intercept .cs-final-img-wrap click (capture) to open annotated lightbox
  finalWrap.addEventListener('click', function(e){
    if(e.target.closest('.cs-callout-pin') || e.target.closest('.cs-step-expand')) return;
    e.stopImmediatePropagation();
    openLb();
  }, true);

})();
