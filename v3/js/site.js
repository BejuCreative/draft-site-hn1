/* Site behaviour: smooth scroll, reveals, interactions, video gate, request form. */
(function () {
  'use strict';

  /* ---- Phone: kept behind one flag. Only the public office number may ever go here. ---- */
  var SHOW_PHONE = false;
  var PUBLIC_PHONE = "310-651-7644";
  var CONTACT_EMAIL = 'info@psychologicalhealingcenter.com';
  var VIMEO_SRC = 'https://player.vimeo.com/video/857633766?h=b1ca4e1d99&dnt=1&autoplay=1&title=0&byline=0&portrait=0';

  var d = document, html = d.documentElement, NS = window.HNW = window.HNW || {};
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduced = html.classList.contains('rm');
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var motion = !!(gsap && ST) && !reduced;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var lenis = null;

  if (motion) { html.classList.add('fx'); gsap.registerPlugin(ST); }

  /* ---------- smooth scroll ---------- */
  if (motion && window.Lenis && finePointer) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToY(y, done) {
    if (lenis) lenis.scrollTo(y, { duration: 1.2, onComplete: done });
    else { window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' }); if (done) setTimeout(done, reduced ? 50 : 900); }
  }

  /* ---------- hero + chapters engines ---------- */
  if (NS.hero) NS.hero.init({ motion: motion });
  if (NS.chapters) NS.chapters.init({ motion: motion });

  /* ---------- header, progress, nav ---------- */
  var header = $('#siteHeader'), bar = $('.progress i');
  var darkEls = $$('#meet, #divorce, #footer');
  var buyBar = $('#buyBar'), buyHide = $$('#booklet, #books, #program, #footer, .bk-nudge'), nav = $('#nav');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-solid', y > 40);
    var max = d.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0).toFixed(4) + ')';
    var hh = header.offsetHeight, dark = !!(NS.chapters && NS.chapters.dark);
    if (!dark) for (var i = 0; i < darkEls.length; i++) { var r = darkEls[i].getBoundingClientRect(); if (r.top <= hh && r.bottom > hh) { dark = true; break; } }
    var chEl = $('#chapters');
    if (!dark && !motion && chEl) { var c = chEl.getBoundingClientRect(); dark = c.top <= hh && c.bottom > hh; }
    header.classList.toggle('on-dark', dark);
    if (buyBar) {
      var vh = window.innerHeight, hide = (nav && nav.classList.contains('open'));
      if (!hide) for (var k = 0; k < buyHide.length; k++) { var q = buyHide[k].getBoundingClientRect(); if (q.top < vh && q.bottom > 0) { hide = true; break; } }
      var topEl = $('#top'), show = !hide && !!topEl && topEl.getBoundingClientRect().bottom < vh * 0.3;
      buyBar.classList.toggle('on', show);
      buyBar.inert = !show;
    }
  }
  NS.syncHeader = onScroll;
  if (lenis) lenis.on('scroll', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var toggle = $('#navToggle');
  function setNav(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    onScroll();
  }
  toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setNav(false); toggle.focus(); } });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { if (nav.classList.contains('open')) setNav(false); }); });

  /* in-page anchors through Lenis */
  if (lenis) {
    $$('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute('href');
      if (id.length < 2 || a.hasAttribute('data-free-video') || id === '#booklet-checkout') return;
      a.addEventListener('click', function (e) {
        var t = $(id); if (!t) return;
        e.preventDefault();
        lenis.scrollTo(t, { offset: id === '#top' ? 0 : -header.offsetHeight + 1, duration: 1.4 });
      });
    });
  }

  /* ---------- word-mask headlines ---------- */
  function splitWords(el) {
    var nodes = Array.prototype.slice.call(el.childNodes), lastWi = null;
    el.textContent = '';
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { el.appendChild(d.createTextNode(' ')); lastWi = null; return; }
          var w = d.createElement('span'), wi = d.createElement('span');
          w.className = 'w'; wi.className = 'wi'; wi.textContent = part;
          w.appendChild(wi); el.appendChild(w); lastWi = wi;
        });
      } else if (lastWi) { lastWi.appendChild(n); }
      else {
        var w2 = d.createElement('span'), wi2 = d.createElement('span');
        w2.className = 'w'; wi2.className = 'wi'; wi2.appendChild(n); w2.appendChild(wi2); el.appendChild(w2); lastWi = wi2;
      }
    });
  }
  $$('.split-words').forEach(function (el) {
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    splitWords(el);
    el.setAttribute('aria-label', label);
    $$('.w', el).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
    if (!motion) return;
    gsap.to($$('.wi', el), {
      y: 0, duration: 1.05, ease: 'back.out(1.7)', stagger: 0.045,
      scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none reverse' }
    });
  });

  /* ---------- scroll reveals (both directions) ---------- */
  if (motion) {
    gsap.set('.rv', { y: 26 });
    ST.batch('.rv', {
      start: 'top 88%',
      onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09, overwrite: true }); },
      onLeaveBack: function (b) { gsap.to(b, { opacity: 0, y: 26, duration: 0.5, ease: 'power2.in', overwrite: true }); }
    });
  }

  /* ---------- count-up numbers ---------- */
  $$('[data-count]').forEach(function (el) {
    var n = parseInt(el.getAttribute('data-count'), 10);
    if (!motion || !n) return;
    var o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, { v: n, duration: 1.8, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); },
      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
  });

  /* ---------- pointer toys (fine pointers only) ---------- */
  if (motion && finePointer) {
    var light = $('.cursor-light');
    var lx = gsap.quickTo(light, 'x', { duration: 0.6, ease: 'power3' }), ly = gsap.quickTo(light, 'y', { duration: 0.6, ease: 'power3' });
    window.addEventListener('mousemove', function (e) { light.classList.add('on'); lx(e.clientX); ly(e.clientY); }, { passive: true });
    d.addEventListener('mouseleave', function () { light.classList.remove('on'); });

    $$('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.28, y: (e.clientY - r.top - r.height / 2) * 0.38, duration: 0.4, ease: 'power3.out' });
      });
      b.addEventListener('mouseleave', function () { gsap.to(b, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' }); });
    });

    $$('.spot').forEach(function (c) {
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    $$('.tilt').forEach(function (el) {
      var target = el.classList.contains('book-cover') ? el.firstElementChild : el;
      var bx = el.classList.contains('bk-cover') ? -14 : 0, by = el.classList.contains('bk-cover') ? 4 : 0;
      gsap.set(target, { rotationY: bx, rotationX: by, transformPerspective: 900 });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(target, { rotationY: bx + dx * 18, rotationX: by - dy * 14, duration: 0.5, ease: 'power2.out' });
      });
      el.addEventListener('mouseleave', function () { gsap.to(target, { rotationY: bx, rotationX: by, duration: 1, ease: 'elastic.out(1, 0.45)' }); });
    });
  }

  /* ---------- recognise: the lens cracks ---------- */
  var cracks = $$('#lensSvg .cracks path');
  cracks.forEach(function (p) { p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1'; p.style.strokeDashoffset = motion ? '1' : '0'; });
  if (motion && cracks.length) {
    var ctl = gsap.timeline({ scrollTrigger: { trigger: '#lensSvg', start: 'top 80%', end: 'bottom 40%', scrub: 0.6 } });
    ctl.fromTo('#lensSvg .impact', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.15, ease: 'back.out(3)' }, 0)
       .to(cracks.filter(function (p) { return !p.classList.contains('thin'); }), { strokeDashoffset: 0, duration: 0.6, stagger: 0.05 }, 0.1)
       .to(cracks.filter(function (p) { return p.classList.contains('thin'); }), { strokeDashoffset: 0, duration: 0.3, stagger: 0.04 }, 0.55);
    gsap.fromTo('#lensSvg', { rotation: -8 }, { rotation: 4, ease: 'none', scrollTrigger: { trigger: '#recognize', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- journey road ---------- */
  var road = $('#road');
  function buildRoad() {
    if (!road) return;
    var svg = $('#roadSvg'), rr = road.getBoundingClientRect(), mks = $$('.beats .mk', road);
    var W = road.offsetWidth, H = road.offsetHeight, small = W < 700, A = small ? 10 : 90;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var pts = mks.map(function (m) { var r = m.getBoundingClientRect(); return [r.left - rr.left + r.width / 2, r.top - rr.top + r.height / 2]; });
    if (pts.length < 2) return;
    var dd = 'M' + pts[0][0].toFixed(1) + ' ' + (pts[0][1] - 40).toFixed(1) + ' L' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], dir = i % 2 ? 1 : -1, dy = (b[1] - a[1]) / 2;
      dd += ' C' + (a[0] + A * dir).toFixed(1) + ' ' + (a[1] + dy).toFixed(1) + ' ' + (b[0] + A * dir).toFixed(1) + ' ' + (b[1] - dy).toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
    }
    ['roadSh', 'roadBed', 'roadHl', 'roadDash', 'roadGlow'].forEach(function (id) { $('#' + id).setAttribute('d', dd); });
    $('#roadSh').style.strokeWidth = small ? 16 : 34;
    $('#roadBed').style.strokeWidth = small ? 13 : 30;
    var glow = $('#roadGlow'), L = glow.getTotalLength();
    glow.style.strokeDasharray = L + ' ' + L;
    road._len = L; road._fr = pts.map(function (p) { return (p[1] - pts[0][1] + 40) / (pts[pts.length - 1][1] - pts[0][1] + 40); });
    if (!motion) glow.style.strokeDashoffset = 0;
  }
  buildRoad();
  if (road && motion) {
    var beats = $$('.beats li', road), compass = $('.compass', road);
    ST.create({
      trigger: road, start: 'top 65%', end: 'bottom 55%', scrub: 0.4,
      onUpdate: function (s) {
        var p = s.progress;
        $('#roadGlow').style.strokeDashoffset = (road._len * (1 - p)).toFixed(1);
        beats.forEach(function (li, i) { li.classList.toggle('on', p >= road._fr[i] - 0.01); });
        if (compass) compass.style.transform = 'rotate(' + (p * 300).toFixed(1) + 'deg)';
      }
    });
    $$('.beat .bt', road).forEach(function (bt, i) {
      gsap.fromTo(bt, { opacity: 0, x: (i % 2 ? -40 : 40) }, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: bt, start: 'top 82%', toggleActions: 'play none none reverse' } });
    });
  } else if (road) { $$('.beats li', road).forEach(function (li) { li.classList.add('on'); }); }

  /* ---------- mind map ---------- */
  var MM = [
    ['The Wound', 'Childhood wounds create the hole in the soul.', 'mm-wound', 'a dark burst of fragments'],
    ['Reaction', 'Reactions to the wound crack your lens of perception.', 'mm-reaction', 'a cracked lens'],
    ['Encoding', 'Negative distorted core beliefs begin to form.', 'mm-encoding', 'a dark double helix'],
    ['Chaos', 'The old unsustainable system begins to dismantle.', 'mm-chaos', 'tangled lines'],
    ['Defenses', 'Defenses aim to protect but lock you into psychological prison.', 'mm-defenses', 'coloured spheres'],
    ['Breakdown / Breakthrough', 'The system breaks down and gives rise to breakthrough.', 'mm-breakthrough', 'a red sweeping shape breaking free'],
    ['Paradigm Shift', "A paradigm shift creates a new way of 'being' and 'seeing'.", 'mm-paradigm', 'overlapping circles of light'],
    ['Healing', 'A new healthy and sustainable blueprint emerges.', 'mm-healing', 'a golden rising helix'],
    ['Unity', 'Healing individually begets healing globally.', 'mm-unity', 'the earth inside rings of light']
  ];
  var ACT = ['I · Encode your past', 'II · Decode your present', 'III · Recode your future'];
  var mmBtns = $$('#mmNodes button'), dots = $$('.mm-dots i'), mmCur = 0, mmTimer = null, mmTouched = false;
  function mmSet(i, fromUser) {
    if (fromUser) { mmTouched = true; clearInterval(mmTimer); }
    if (i === mmCur && !fromUser && mmBtns[i].getAttribute('aria-pressed') === 'true') return;
    mmCur = i;
    var m = MM[i];
    mmBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    dots.forEach(function (dt, k) { dt.classList.toggle('on', k === i); });
    function apply() {
      var art = $('#mmArt');
      if (!art) return;
      art.src = 'img/' + m[2] + '.webp';
      art.alt = 'Mind Map panel ' + (i + 1) + ', ' + m[0] + ': ' + m[3];
      $('#mmAct').textContent = ACT[Math.floor(i / 3)];
      $('#mmNum').textContent = i + 1;
      $('#mmName').textContent = m[0];
      $('#mmCap').textContent = m[1];
    }
    if (motion) {
      gsap.to('#mmPanel > *:not(.mm-dots):not(.mm-hint)', { opacity: 0, y: -8, duration: 0.18, stagger: 0.02, onComplete: function () {
        apply();
        gsap.fromTo('#mmPanel > *:not(.mm-dots):not(.mm-hint)', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.04, ease: 'back.out(1.6)' });
      }, overwrite: true });
    } else apply();
  }
  mmBtns.forEach(function (b, i) {
    b.addEventListener('click', function () { mmSet(i, true); });
    if (finePointer) b.addEventListener('mouseenter', function () { mmSet(i, true); });
  });
  dots.forEach(function (dt, i) { if (i === 0) dt.classList.add('on'); });
  (function buildMandala() {
    var g = $('#mandala'), sp = $('.mm-spokes'), ns = 'http://www.w3.org/2000/svg';
    if (!g) return;
    var out = '';
    for (var k = 0; k < 16; k++) {
      var a = k / 16 * 360;
      out += '<ellipse cx="300" cy="216" rx="15" ry="38" transform="rotate(' + a + ' 300 300)" stroke-width=".8" opacity=".55"/>';
    }
    out += '<circle cx="300" cy="300" r="122" stroke-width=".8" stroke-dasharray="1 5"/><circle cx="300" cy="300" r="92" stroke-width=".6"/>';
    g.innerHTML = out;
    var s = '';
    for (var j = 0; j < 8; j++) {
      var an = (-90 + j * 45) * Math.PI / 180, c = Math.cos(an), si = Math.sin(an);
      s += '<line x1="' + (300 + c * 96).toFixed(1) + '" y1="' + (300 + si * 96).toFixed(1) + '" x2="' + (300 + c * 166).toFixed(1) + '" y2="' + (300 + si * 166).toFixed(1) + '"/>';
      s += '<circle cx="' + (300 + c * 131).toFixed(1) + '" cy="' + (300 + si * 131).toFixed(1) + '" r="2.4"/>';
    }
    sp.innerHTML = s;
    void ns;
  })();
  if (motion) {
    gsap.to('#mandala', { rotation: 360, duration: 140, repeat: -1, ease: 'none', svgOrigin: '300 300' });
    gsap.fromTo('#mmNodes li button', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.8)', stagger: 0.07, clearProps: 'transform',
      scrollTrigger: { trigger: '#mmMap', start: 'top 75%', toggleActions: 'play none none reverse' } });
    gsap.from('.mm-spokes line', { opacity: 0, duration: 0.6, stagger: 0.05, scrollTrigger: { trigger: '#mmMap', start: 'top 70%', toggleActions: 'play none none reverse' } });
    ST.create({
      trigger: '#mmMap', start: 'top 60%', end: 'bottom 20%',
      onToggle: function (s) {
        clearInterval(mmTimer);
        if (s.isActive && !mmTouched) mmTimer = setInterval(function () { mmSet((mmCur + 1) % 9, false); }, 3600);
      }
    });
  }

  /* ---------- program stack parallax ---------- */
  if (motion) {
    [['.peek-1', -60, -6], ['.peek-2', -110, 5], ['.peek-3', -30, 3], ['.pg-page', -80, 3], ['.pg-cover', -40, -2]].forEach(function (c) {
      gsap.fromTo(c[0], { y: 60 }, { y: c[1], rotation: '+=' + c[2], ease: 'none', scrollTrigger: { trigger: '#pgStack', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- meet: golden spiral + motes ---------- */
  (function spiral() {
    var p = $('#spiral'); if (!p) return;
    var dd = '', phi = 1.618034, b = Math.log(phi) / (Math.PI / 2);
    for (var t = 0; t <= Math.PI * 7.2; t += 0.05) {
      var r = 3 * Math.exp(b * t), x = 300 + r * Math.cos(t + 2.2), y = 300 + r * Math.sin(t + 2.2);
      if (r > 290) break;
      dd += (dd ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    p.setAttribute('d', dd);
    p.setAttribute('pathLength', '1');
    p.style.strokeDasharray = '1';
    p.style.strokeDashoffset = motion ? '1' : '0';
    if (motion) gsap.to(p, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '#portal', start: 'top 85%', end: 'center 45%', scrub: 0.8 } });
  })();
  if (motion) {
    gsap.from('.meet-frame', { scale: 0.82, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '#portal', start: 'top 75%', toggleActions: 'play none none reverse' } });
    gsap.from('.p-orbit ellipse, .ring-text', { opacity: 0, duration: 1.4, stagger: 0.15, scrollTrigger: { trigger: '#portal', start: 'top 75%', toggleActions: 'play none none reverse' } });
  }
  (function motes() {
    var c = $('#meetMotes'); if (!c || reduced) return;
    var x = c.getContext('2d'), W, H, dp, ms = [], vis = false, raf = 0;
    function size() { W = c.clientWidth; H = c.clientHeight; dp = Math.min(1.5, window.devicePixelRatio || 1); c.width = W * dp; c.height = H * dp; }
    size();
    for (var i = 0; i < 70; i++) ms.push({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, s: 0.004 + Math.random() * 0.012, ph: Math.random() * 6.28 });
    function loop(now) {
      if (!vis) { raf = 0; return; }
      var t = now / 1000;
      x.setTransform(dp, 0, 0, dp, 0, 0); x.clearRect(0, 0, W, H);
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i]; m.y -= m.s / 60; if (m.y < -0.02) m.y = 1.02;
        var px = (m.x + Math.sin(t * 0.3 + m.ph) * 0.01) * W, py = m.y * H, a = 0.25 + 0.35 * Math.sin(t + m.ph) ** 2;
        x.beginPath(); x.arc(px, py, m.r, 0, 6.283); x.fillStyle = 'rgba(227,190,143,' + a.toFixed(3) + ')'; x.fill();
      }
      raf = requestAnimationFrame(loop);
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis && !raf) raf = requestAnimationFrame(loop); }).observe(c);
    window.addEventListener('resize', size);
  })();

  /* ---------- footer: family holding hands + dandelions ---------- */
  (function family() {
    var svg = $('#family'); if (!svg) return;
    var out = '<path class="ground" d="M0 212 Q600 196 1200 212"/>';
    var people = [[430, 1], [505, 0.62], [575, 0.95], [648, 0.58], [722, 1.04]];
    function person(x, k) {
      var hTop = 212 - 150 * k, hr = 13 * k + 2;
      return '<g class="fig"><circle cx="' + x + '" cy="' + (hTop + hr) + '" r="' + hr + '"/>' +
        '<path d="M' + (x - 14 * k) + ' ' + (hTop + hr * 2 + 4) + ' Q' + x + ' ' + (hTop + hr * 2 - 2) + ' ' + (x + 14 * k) + ' ' + (hTop + hr * 2 + 4) +
        ' L' + (x + 24 * k) + ' ' + (212 - 52 * k) + ' L' + (x + 8 * k) + ' ' + (212 - 52 * k) + ' L' + (x + 7 * k) + ' 212 L' + (x + 1) + ' 212 L' + x + ' ' + (212 - 50 * k) +
        ' L' + (x - 1) + ' 212 L' + (x - 7 * k) + ' 212 L' + (x - 8 * k) + ' ' + (212 - 52 * k) + ' L' + (x - 24 * k) + ' ' + (212 - 52 * k) + ' Z"/></g>';
    }
    for (var i = 0; i < people.length; i++) {
      out += person(people[i][0], people[i][1]);
      if (i < people.length - 1) {
        var a = people[i], b = people[i + 1], ya = 212 - 150 * a[1] + 30 * a[1] + 14, yb = 212 - 150 * b[1] + 30 * b[1] + 14;
        var mid = Math.max(212 - 80 * a[1], 212 - 80 * b[1]);
        out += '<path class="fig arm" d="M' + (a[0] + 12 * a[1]) + ' ' + ya + ' Q' + ((a[0] + b[0]) / 2) + ' ' + (mid + 6) + ' ' + (b[0] - 12 * b[1]) + ' ' + yb + '"/>';
      }
    }
    var dands = [[170, 150], [260, 120], [960, 130], [1050, 158], [330, 170], [880, 168]];
    dands.forEach(function (p, j) {
      out += '<g class="dand"><line x1="' + p[0] + '" y1="212" x2="' + p[0] + '" y2="' + p[1] + '"/>';
      for (var k = 0; k < 14; k++) {
        var an = k / 14 * Math.PI * 2, r = 16 + (j % 2) * 4;
        out += '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + (p[0] + Math.cos(an) * r).toFixed(1) + '" y2="' + (p[1] + Math.sin(an) * r).toFixed(1) + '"/><circle cx="' + (p[0] + Math.cos(an) * r).toFixed(1) + '" cy="' + (p[1] + Math.sin(an) * r).toFixed(1) + '" r="1.6"/>';
      }
      out += '</g>';
    });
    for (var s = 0; s < 10; s++) out += '<circle class="seed" cx="' + (1000 + s * 18) + '" cy="' + (80 - s * 6 + (s % 3) * 9) + '" r="1.6"/>';
    svg.innerHTML = out;
    if (motion) {
      gsap.from('#family .fig', { y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '#footer', start: 'top 85%', toggleActions: 'play none none reverse' } });
      gsap.from('#family .dand, #family .seed', { scale: 0, transformOrigin: '50% 100%', opacity: 0, duration: 1.2, stagger: 0.05, ease: 'back.out(1.6)', scrollTrigger: { trigger: '#footer', start: 'top 85%', toggleActions: 'play none none reverse' } });
      gsap.to('#family .seed', { x: 40, y: -30, opacity: 0.2, duration: 6, stagger: 0.3, repeat: -1, ease: 'sine.inOut', yoyo: true });
    }
  })();

  /* ---------- videos + gate ---------- */
  var teaser = $('#teaser'), cover = $('#teaserCover'), gate = $('#videoGate'), shell = $('#teaserShell');
  function revealY() {
    var h = NS.hero && NS.hero.trigger;
    return h ? h.end - 2 : 0;
  }
  function playTeaser() {
    if (!teaser) return;
    if (cover) cover.hidden = true;
    if (gate) gate.hidden = true;
    teaser.controls = true;
    var pr = teaser.play();
    if (pr && pr.catch) pr.catch(function () {});
  }
  function goPlay() {
    var y = revealY(), cur = window.scrollY || window.pageYOffset;
    if (Math.abs(cur - y) < 8) { playTeaser(); return; }
    scrollToY(y, playTeaser);
  }
  if (cover) cover.addEventListener('click', goPlay);
  var pt = $('#playTeaser'); if (pt) pt.addEventListener('click', goPlay);
  $$('[data-free-video]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); goPlay(); }); });
  function showGate() {
    if (!gate) return;
    if (cover) cover.hidden = true;
    gate.hidden = false;
    var em = $('#gateEmail'); if (em) em.focus({ preventScroll: true });
  }
  if (teaser) teaser.addEventListener('ended', showGate);
  var og = $('#openGate'); if (og) og.addEventListener('click', function () {
    var y = revealY(), cur = window.scrollY || window.pageYOffset;
    if (Math.abs(cur - y) < 8) showGate(); else scrollToY(y, showGate);
  });
  var gr = $('#gateReplay'); if (gr) gr.addEventListener('click', function () { teaser.currentTime = 0; playTeaser(); });
  var gf = $('#gateForm');
  if (gf) gf.addEventListener('submit', function (e) {
    e.preventDefault();
    var em = $('#gateEmail'), err = $('#gateErr');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) { err.textContent = 'Please enter a valid email.'; em.focus(); return; }
    err.textContent = '';
    var f = d.createElement('iframe');
    f.className = 'vimeo-frame'; f.src = VIMEO_SRC;
    f.title = 'Healing from Narcissistic Abuse, full introduction';
    f.allow = 'autoplay; fullscreen; picture-in-picture'; f.allowFullscreen = true;
    if (teaser) teaser.remove();
    if (cover) cover.remove();
    gate.hidden = true;
    shell.appendChild(f);
  });
  var mv = $('#meetVideo'), mc = $('#meetCover');
  if (mc && mv) mc.addEventListener('click', function () { mc.hidden = true; var p = mv.play(); if (p && p.catch) p.catch(function () {}); });

  /* ---------- booklet placeholder checkout ---------- */
  var bc = $('#booklet-checkout');
  if (bc) $$('.js-checkout').forEach(function (bb) { bb.addEventListener('click', function (e) {
    e.preventDefault();
    var note = bb.parentNode.querySelector('.checkout-note');
    if (note && note !== bc) { note.hidden = false; return; }
    bc.hidden = false; bc.classList.remove('flash'); void bc.offsetWidth; bc.classList.add('flash');
    bc.focus({ preventScroll: true });
  }); });

  /* ---------- request form (mailto placeholder) ---------- */
  var rf = $('#requestForm');
  if (rf) rf.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#rqName').value.trim(), phone = $('#rqPhone').value.trim(), email = $('#rqEmail').value.trim(), note = $('#rqNote').value.trim();
    var err = $('#rqErr'), bad = null, msg = '';
    if (!name) { bad = '#rqName'; msg = 'Please add your name.'; }
    else if ((phone.match(/\d/g) || []).length < 7) { bad = '#rqPhone'; msg = 'Please add a phone number so Dr. Judy can reach you.'; }
    else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { bad = '#rqEmail'; msg = 'Please check your email address.'; }
    if (bad) { err.textContent = msg; $(bad).focus(); return; }
    err.textContent = '';
    var body = 'Name: ' + name + '\nPhone: ' + phone + '\nEmail: ' + email + '\n\n' + note;
    window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Private session request') + '&body=' + encodeURIComponent(body);
    rf.hidden = true;
    var th = $('#rqThanks'); th.hidden = false; th.focus();
  });

  /* ---------- waitlist forms (mailto placeholder, same pattern as the request form) ---------- */
  $$('form[data-waitlist]').forEach(function (wf) {
    wf.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = $('input[type="email"]', wf), err = $('.form-err', wf), book = wf.getAttribute('data-waitlist');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) { err.textContent = 'Please enter a valid email.'; em.focus(); return; }
      err.textContent = '';
      var body = 'Please add me to the waitlist for ' + book + '.\n\nEmail: ' + em.value.trim();
      window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Waitlist: ' + book) + '&body=' + encodeURIComponent(body);
      wf.hidden = true;
      var th = wf.nextElementSibling; if (th) { th.hidden = false; th.focus(); }
    });
  });

  /* ---------- phone flag ---------- */
  if (SHOW_PHONE) {
    var tel = 'tel:+1' + PUBLIC_PHONE.replace(/\D/g, '');
    var fp = $('#footerPhone'); if (fp) { fp.innerHTML = '<a href="' + tel + '">' + PUBLIC_PHONE + '</a>'; fp.hidden = false; }
    var rc = $('#rqCall'), rl = $('#rqCallLink'); if (rc && rl) { rl.href = tel; rl.textContent = PUBLIC_PHONE; rc.hidden = false; }
  }

  /* ---------- finish ---------- */
  if (motion) {
    ST.sort();
    ST.refresh();
    var rebuild = function () { buildRoad(); ST.refresh(); };
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(rebuild);
    window.addEventListener('load', rebuild);
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(buildRoad, 200); });
  } else {
    window.addEventListener('resize', buildRoad);
    window.addEventListener('load', buildRoad);
  }
  html.classList.add('ready');
})();
