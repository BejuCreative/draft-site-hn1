/* Healing Narcissistic Wounds */
(function () {
  'use strict';

  var SHOW_PHONE = false;
  var PUBLIC_PHONE = '';
  var CONTACT_EMAIL = 'info@psychologicalhealingcenter.com';
  var VIMEO_SRC = 'https://player.vimeo.com/video/857633766?h=b1ca4e1d99&dnt=1&autoplay=1&title=0&byline=0&portrait=0';

  var root = document.documentElement;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var reduce = false, fine = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  try { fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) {}
  var hasIO = 'IntersectionObserver' in window;
  var motion = !reduce && hasIO;
  var lenis = null;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  // One broken effect must never take down the forms or the video.
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.warn('[hnw]', e); } }
  function now() { return window.performance ? performance.now() : 0; }

  if (motion) root.classList.add('anim');

  /* =========================================================
     1. CORE: header, nav, teaser + gate, request form, booklet
     ========================================================= */
  var header = $('.site-header'), toggle = $('#navToggle'), nav = $('#nav');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-solid', y > 24);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    header.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setNav(open) {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
  }
  toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
  nav.setAttribute('data-lenis-prevent', '');
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setNav(false); toggle.focus(); }
  });

  var teaser = $('#teaser'), cover = $('#teaserCover'), gate = $('#videoGate'),
      gateForm = $('#gateForm'), gateEmail = $('#gateEmail'), gateErr = $('#gateErr'), shell = $('#teaserCard .video-shell');

  function playTeaser() {
    if (cover) { cover.parentNode.removeChild(cover); cover = null; }
    gate.hidden = true;
    var p = teaser.play();
    if (p && p.catch) p.catch(function () {});
  }
  function showGate() {
    if (cover) { cover.parentNode.removeChild(cover); cover = null; }
    teaser.pause();
    gate.hidden = false;
    gateEmail.focus({ preventScroll: true });
  }
  cover.addEventListener('click', playTeaser);
  $('#playTeaser').addEventListener('click', function () {
    var card = $('#teaserCard');
    if (lenis) lenis.scrollTo(card, { offset: -Math.max(0, (window.innerHeight - card.offsetHeight) / 2) });
    else card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    playTeaser();
  });
  teaser.addEventListener('ended', showGate);
  $('#openGate').addEventListener('click', showGate);
  $('#gateReplay').addEventListener('click', function () { teaser.currentTime = 0; playTeaser(); });
  gateForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = gateEmail.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      gateErr.textContent = 'Please enter a valid email.';
      gateEmail.setAttribute('aria-invalid', 'true');
      gateEmail.focus();
      return;
    }
    teaser.pause();
    var f = document.createElement('iframe');
    f.src = VIMEO_SRC;
    f.title = 'Healing from Narcissistic Abuse, full introduction';
    f.allow = 'autoplay; fullscreen; picture-in-picture';
    shell.innerHTML = '';
    shell.appendChild(f);
    $('#openGate').hidden = true;
  });

  // Request a session: opens the visitor's email app with the request filled in
  $('#requestForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#rqName'), phone = $('#rqPhone'), email = $('#rqEmail'), note = $('#rqNote'), err = $('#rqErr');
    [name, phone, email].forEach(function (i) { i.removeAttribute('aria-invalid'); });
    var bad = null;
    if (!name.value.trim()) bad = [name, 'Please add your name.'];
    else if (phone.value.replace(/\D/g, '').length < 7) bad = [phone, 'Please add a phone number so Dr. Judy can reach you.'];
    else if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) bad = [email, 'Please check your email address.'];
    if (bad) { err.textContent = bad[1]; bad[0].setAttribute('aria-invalid', 'true'); bad[0].focus(); return; }
    err.textContent = '';
    var body = 'Name: ' + name.value.trim() + '\nPhone: ' + phone.value.trim() + '\nEmail: ' + email.value.trim() + '\n\n' + note.value.trim();
    window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Private session request') + '&body=' + encodeURIComponent(body);
    var t = $('#rqThanks');
    t.hidden = false;
    t.focus();
  });

  // Booklet button: shows the checkout note
  $('#bookletBtn').addEventListener('click', function (e) {
    e.preventDefault();
    var n = $('#booklet-checkout');
    n.hidden = false;
    n.classList.remove('is-flash');
    void n.offsetWidth;
    n.classList.add('is-flash');
    n.focus({ preventScroll: true });
  });

  // Footer phone stays hidden while SHOW_PHONE is false.
  if (SHOW_PHONE && PUBLIC_PHONE) {
    var fp = $('#footerPhone');
    fp.textContent = PUBLIC_PHONE;
    fp.hidden = false;
  }

  /* =========================================================
     2. SPLIT HEADLINES into words (before the intro ends)
     ========================================================= */
  function splitWords(el) {
    var k = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'), s = document.createElement('span');
            w.className = 'w'; s.textContent = t; s.style.setProperty('--k', k++);
            w.appendChild(s); frag.appendChild(w);
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== 'SUP') {
          walk(c); // em, i: split inside, keep the styling
        }
      });
    })(el);
    el.classList.add('split-ready');
  }
  if (motion) safe(function () { $$('.split').forEach(splitWords); });

  /* =========================================================
     3. INTRO (CSS-driven; JS only handles skip + hand-off)
     ========================================================= */
  var intro = $('#intro'), introDone = false, heroStarted = false;

  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    requestAnimationFrame(function () {
      root.classList.add('hero-in');
      var t = $('.hero-title');
      if (t) t.classList.add('is-in');
    });
  }

  function endIntro() {
    if (introDone) return;
    introDone = true;
    try { sessionStorage.setItem('hnw-intro-seen', '1'); } catch (e) {}
    root.classList.add('intro-out');
    startHero();
    setTimeout(function () {
      root.classList.remove('intro-on');
      if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
      if (lenis) lenis.start();
      if (hasGsap) ScrollTrigger.refresh();
    }, 820);
  }

  if (root.classList.contains('intro-on') && intro) {
    $('#introSkip').addEventListener('click', endIntro);
    intro.addEventListener('click', endIntro);
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); endIntro(); }
    });
    ['wheel', 'touchmove'].forEach(function (t) {
      window.addEventListener(t, endIntro, { passive: true, once: true });
    });
    setTimeout(endIntro, Math.max(0, 2200 - now()));
    // Failsafe: the site is never blocked more than ~3 s after navigation start.
    setTimeout(endIntro, Math.max(0, 2700 - now()));
  } else {
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    root.classList.remove('intro-on');
    startHero();
  }

  /* =========================================================
     4. SMOOTH SCROLL (Lenis) + anchor links
     ========================================================= */
  safe(function () {
    if (reduce || typeof window.Lenis === 'undefined') return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
    if (root.classList.contains('intro-on') && !introDone) lenis.stop();
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.classList.contains('skip-link')) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -68 });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  /* =========================================================
     5. REVEALS: split words, clip-path curtains, mind-map rings
     ========================================================= */
  safe(function () {
    if (!motion) return;
    var targets = $$('[data-reveal], [data-curtain], .split:not(.hero-title), .mm-row');
    var io = new IntersectionObserver(function (entries) {
      var i = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, d = Math.min(i++ * 0.06, 0.3);
        io.unobserve(el);
        if (el.hasAttribute('data-reveal')) el.style.setProperty('--d', d + 's');
        el.classList.add('is-in');
        // Drop the reveal hooks once done so hover lifts work again.
        if (el.hasAttribute('data-reveal') || el.hasAttribute('data-curtain')) {
          setTimeout(function () {
            el.removeAttribute('data-reveal');
            el.removeAttribute('data-curtain');
            el.style.removeProperty('--d');
          }, 1200 + d * 1000);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  });

  // Pause CSS loops (orbits, marquees, motes) while their section is off-screen.
  safe(function () {
    if (!hasIO) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('is-off', !en.isIntersecting); });
    });
    $$('.hero, .press, .meet-portal, .reviews').forEach(function (s) { io.observe(s); });
  });

  /* =========================================================
     6. MARQUEES (press logos + review cards)
     ========================================================= */
  safe(function () {
    if (!motion) return;
    var wide = window.matchMedia('(min-width: 700px)');
    function build(wrap) {
      if (wrap.classList.contains('is-marquee')) return;
      var track = $('.marquee-track', wrap);
      var items = Array.prototype.slice.call(track.children);
      if (!items.length) return;
      wrap.classList.add('is-marquee');
      var setW = track.scrollWidth;
      if (!setW) return;
      var need = Math.max(wrap.clientWidth, window.screen ? window.screen.width : 0, window.innerWidth);
      var n = Math.max(0, Math.ceil(need / setW) - 1); // extra sets so one half covers the screen
      function cloneSet() {
        items.forEach(function (it) {
          var c = it.cloneNode(true);
          c.setAttribute('aria-hidden', 'true');
          c.setAttribute('data-clone', '');
          $$('img', c).forEach(function (im) { im.setAttribute('loading', 'eager'); });
          $$('a, button', c).forEach(function (x) { x.setAttribute('tabindex', '-1'); });
          track.appendChild(c);
        });
      }
      for (var i = 0; i < n; i++) cloneSet();
      for (var j = 0; j < n + 1; j++) cloneSet(); // second, identical half: loop at -50%
      var speed = wrap.classList.contains('rv-rail') ? 40 : 50; // px per second
      wrap.style.setProperty('--dur', (setW * (n + 1) / speed).toFixed(1) + 's');
    }
    function teardown(wrap) {
      if (!wrap.classList.contains('is-marquee')) return;
      $$('[data-clone]', wrap).forEach(function (c) { c.parentNode.removeChild(c); });
      wrap.classList.remove('is-marquee');
      wrap.style.removeProperty('--dur');
    }
    $$('[data-marquee]').forEach(function (wrap) {
      if (!wrap.classList.contains('rv-rail')) { build(wrap); return; }
      // Phones: swipe rail, long quotes stay readable. Wider screens: moving rail.
      function apply() { if (wide.matches) build(wrap); else teardown(wrap); }
      apply();
      if (wide.addEventListener) wide.addEventListener('change', apply);
      else if (wide.addListener) wide.addListener(apply);
    });
  });

  /* =========================================================
     7. GIANT TEXT RAIL driven by scroll velocity
     ========================================================= */
  safe(function () {
    if (!motion) return;
    var band = $('.rail-band');
    if (!band) return;
    var rails = $$('[data-rail]').map(function (r) {
      var tr = $('.rail-track', r);
      tr.innerHTML = tr.innerHTML + tr.innerHTML + tr.innerHTML;
      var dir = parseFloat(r.getAttribute('data-rail')) || 1;
      var w = tr.scrollWidth / 3;
      return { el: tr, dir: dir, w: w, x: dir > 0 ? 0 : -w / 2, v: 0 };
    });
    var raf = 0, visible = false, lastY = window.scrollY, sign = 1;
    function frame() {
      var y = window.scrollY, dy = y - lastY;
      lastY = y;
      if (dy) sign = dy > 0 ? 1 : -1;
      var boost = 1 + Math.min(Math.abs(dy), 60) * 0.35;
      rails.forEach(function (r) {
        var target = -r.dir * 0.6 * boost * sign;
        r.v += (target - r.v) * 0.08;
        r.x += r.v;
        if (r.x <= -r.w) r.x += r.w;
        if (r.x > 0) r.x -= r.w;
        r.el.style.transform = 'translate3d(' + r.x.toFixed(2) + 'px,0,0)';
      });
      raf = requestAnimationFrame(frame);
    }
    function run() { if (!raf && visible && !document.hidden) { lastY = window.scrollY; raf = requestAnimationFrame(frame); } }
    function stop() { cancelAnimationFrame(raf); raf = 0; }
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) run(); else stop(); }).observe(band);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else run(); });
    window.addEventListener('resize', function () { rails.forEach(function (r) { r.w = r.el.scrollWidth / 3; }); });
  });

  /* =========================================================
     8. HERO CONSTELLATION CANVAS (dots link to the cursor)
     ========================================================= */
  safe(function () {
    var canvas = $('#heroStars');
    if (!canvas || !canvas.getContext) return;
    var hero = $('.hero');
    var ctx = canvas.getContext('2d'), pts = [], w = 0, h = 0, raf = 0, visible = true, mx = -1e4, my = -1e4;
    // Text boxes (plus a margin): dots and lines there drop to a quarter of their strength.
    var zones = [], headZones = [], PAD = 18;
    function box(el, ox, oy) {
      var r = el.getBoundingClientRect();
      return r.width ? [r.left - ox - PAD, r.top - oy - PAD, r.right - ox + PAD, r.bottom - oy + PAD] : null;
    }
    function measureZones() {
      var c = canvas.getBoundingClientRect();
      zones = $$('.hero-eyebrow, .hero-title, .lead, .lead-strong, .hero-side-r .cta-row, .hero-note, #teaserCard figcaption')
        .map(function (el) { return box(el, c.left, c.top); }).filter(Boolean);
      // The header is fixed: keep its boxes in viewport space and shift them each frame.
      headZones = $$('.site-header .brand, .site-header .nav, .site-header .nav-toggle')
        .map(function (el) { return box(el, c.left, 0); }).filter(Boolean);
    }
    var headOff = 0;
    function quiet(x, y) {
      var i, z;
      for (i = 0; i < zones.length; i++) { z = zones[i]; if (x > z[0] && x < z[2] && y > z[1] && y < z[3]) return 0.25; }
      for (i = 0; i < headZones.length; i++) { z = headZones[i]; if (x > z[0] && x < z[2] && y + headOff > z[1] && y + headOff < z[3]) return 0.25; }
      return 1;
    }
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(80, (w * h) / 15000));
      pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2, r: Math.random() * 1.6 + .7, g: Math.random() < .7 });
      }
    }
    function draw(move) {
      ctx.clearRect(0, 0, w, h);
      headOff = canvas.getBoundingClientRect().top;
      var i, p;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        if (move) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
        }
        p.f = quiet(p.x, p.y);
      }
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < 12000) {
            ctx.strokeStyle = 'rgba(98,16,25,' + (0.13 * Math.min(p.f, q.f) * (1 - d / 12000)).toFixed(3) + ')';
            ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        var mdx = p.x - mx, mdy = p.y - my, md = mdx * mdx + mdy * mdy;
        if (md < 25600) {
          ctx.strokeStyle = 'rgba(184,137,59,' + (0.55 * p.f * (1 - md / 25600)).toFixed(3) + ')';
          ctx.lineWidth = 0.9;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my); ctx.stroke();
        }
        ctx.fillStyle = p.g ? 'rgba(184,137,59,' + (0.85 * p.f) + ')' : 'rgba(98,16,25,' + (0.45 * p.f) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    size();
    measureZones();
    // Re-measure once the hero copy has settled and the fonts are in.
    window.addEventListener('load', measureZones);
    setTimeout(measureZones, 3600);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureZones);
    if (!motion) {
      draw(false);
      window.addEventListener('resize', function () { size(); measureZones(); draw(false); });
      window.addEventListener('load', function () { draw(false); });
      setTimeout(function () { draw(false); }, 3700);
      return;
    }
    function loop() { draw(true); raf = requestAnimationFrame(loop); }
    function run() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); }
    function stop() { cancelAnimationFrame(raf); raf = 0; }
    window.addEventListener('resize', function () { size(); measureZones(); });
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) run(); else stop(); }).observe(canvas);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else run(); });
    if (fine) {
      hero.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = canvas.getBoundingClientRect();
        mx = e.clientX - r.left; my = e.clientY - r.top;
      });
      hero.addEventListener('pointerleave', function () { mx = my = -1e4; });
    }
    run();
  });

  /* =========================================================
     8b. HERO ORBIT: items ride one ring around the video card.
         Behind the card (top pass) they are smaller and dimmer.
     ========================================================= */
  safe(function () {
    var field = $('#heroOrbit');
    if (!field) return;
    var portal = field.parentNode, card = $('#teaserCard'), shellEl = $('.video-shell', card);
    var svg = $('.orbit-path', field), eMain = $('.op-main', field), eOuter = $('.op-outer', field);
    var all = $$('.oi', field), items = [];
    var cx = 0, cy = 0, rx = 0, ry = 0;
    var angle = 0.55, speed = motion ? 1 : 0, LAP = (Math.PI * 2) / 64; // one lap ~64 s
    var fade = motion ? 0 : 1, raf = 0, last = 0, visible = true, hover = false, playing = false;

    function measure() {
      items = all.filter(function (el) { return el.offsetWidth > 0; })
        .map(function (el) { return { el: el, w: el.offsetWidth, h: el.offsetHeight }; });
      var maxW = 0, maxH = 0;
      items.forEach(function (it) { maxW = Math.max(maxW, it.w); maxH = Math.max(maxH, it.h); });
      var cw = shellEl.offsetWidth, ch = shellEl.offsetHeight;
      if (!cw) return;
      var small = window.innerWidth < 600;
      var availHalf = document.documentElement.clientWidth / 2 - 6;
      // Side gap: room for an item beside the card, never off-screen.
      var gapX = Math.max(maxW * 0.42 + 8, Math.min(small ? 34 : 80, availHalf - cw / 2 - maxW * 0.42));
      rx = cw / 2 + gapX;
      // The ring must clear the card's lower corners, so the front pass never covers the video.
      var k = Math.min(0.97, (cw / 2 - 8) / rx);
      var ryCorner = (ch / 2 - 4) / Math.sqrt(1 - k * k);
      ry = Math.max(ch / 2 + (small ? 40 : 56), Math.min(ryCorner, ch / 2 + (small ? 66 : 84)));
      portal.style.setProperty('--orb-top', Math.ceil(ry - ch / 2 + maxH * 0.31 + 10) + 'px');
      portal.style.setProperty('--orb-bot', Math.ceil(ry - ch / 2 + maxH * 0.5 + 14) + 'px');
      // offsetLeft/Top ignore the entrance transform, so the ring sits right from the start.
      cx = card.offsetLeft + shellEl.offsetLeft + cw / 2;
      cy = card.offsetTop + shellEl.offsetTop + ch / 2;
      svg.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      [[eMain, 1, 1], [eOuter, 1.07, 1.12]].forEach(function (e) {
        e[0].setAttribute('cx', 0); e[0].setAttribute('cy', 0);
        e[0].setAttribute('rx', (rx * e[1]).toFixed(1)); e[0].setAttribute('ry', (ry * e[2]).toFixed(1));
      });
    }

    function place() {
      var n = items.length;
      for (var i = 0; i < n; i++) {
        var it = items[i], a = angle + (i * Math.PI * 2) / n, s = Math.sin(a);
        var t = (s + 1) / 2;                 // 0 = far back (top), 1 = front (bottom)
        var sc = 0.62 + 0.38 * t;
        var x = cx + Math.cos(a) * rx - it.w / 2, y = cy + s * ry - it.h / 2;
        it.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
        it.el.style.opacity = (fade * (0.42 + 0.58 * t)).toFixed(3);
        it.el.style.zIndex = s < 0 ? 1 : 3;
      }
    }

    function frame(ts) {
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      var goal = hover || playing ? 0 : 1;
      speed += (goal - speed) * Math.min(1, dt * 2.5);
      if (!goal && speed < 0.02) speed = 0; // a full stop on hover / while playing
      angle -= LAP * speed * dt;             // the front pass moves left to right
      if (root.classList.contains('hero-in') && fade < 1) fade = Math.min(1, fade + dt / 1.2);
      place();
      raf = requestAnimationFrame(frame);
    }
    function run() { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { cancelAnimationFrame(raf); raf = 0; }

    measure();
    place();
    field.classList.add('orbit-ready');
    function refresh() { measure(); place(); }
    window.addEventListener('resize', refresh);
    window.addEventListener('load', refresh);
    if (window.ResizeObserver) new ResizeObserver(refresh).observe(shellEl);
    if (!motion) return;

    portal.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    portal.addEventListener('pointerleave', function () { hover = false; });
    var tv = $('#teaser');
    if (tv) {
      tv.addEventListener('play', function () { playing = true; });
      tv.addEventListener('pause', function () { playing = false; });
      tv.addEventListener('ended', function () { playing = false; });
    }
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) run(); else stop(); }).observe(portal);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else run(); });
    run();
  });

  /* =========================================================
     9. CURSOR LIGHT + TILT (fine pointer only)
     ========================================================= */
  safe(function () {
    if (!motion || !fine) return;
    var light = document.createElement('div');
    light.className = 'cursor-light';
    light.setAttribute('aria-hidden', 'true');
    document.body.appendChild(light);
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    function step() {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      light.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      raf = (Math.abs(tx - x) + Math.abs(ty - y) > 0.5) ? requestAnimationFrame(step) : 0;
    }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      if (!light.classList.contains('is-on')) { x = tx; y = ty; light.classList.add('is-on'); }
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { light.classList.remove('is-on'); });
  });

  safe(function () {
    if (!motion || !fine) return;
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 9).toFixed(2) + 'deg) rotateY(' + (px * 11).toFixed(2) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  });

  /* =========================================================
     10. GSAP SCROLL SCENES
     ========================================================= */
  if (!hasGsap || reduce) return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Curtain pull: pinned, scrubbed. Cloth opens, the heart glows, gold floods, lines cycle.
  safe(function () {
    var sec = $('#curtain');
    if (!sec) return;
    var stage = $('.curtain-stage', sec), cloth = $('.ca-cloth', sec), back = $('.ca-back', sec),
        heart = $('.ca-heart', sec), rays = $('.ca-rays', sec), flood = $('.curtain-flood', sec),
        hint = $('.curtain-hint', sec), steps = $$('.curtain-steps li', sec);
    var l1 = $$('.cl-1 .clm > span', sec), l2 = $$('.cl-2 .clm > span', sec), l3 = $$('.cl-3 .clm > span', sec);

    function placeFlood() {
      var s = stage.getBoundingClientRect(), h = heart.getBoundingClientRect();
      stage.style.setProperty('--fx', (h.left + h.width / 2 - s.left) + 'px');
      stage.style.setProperty('--fy', (h.top + h.height / 2 - s.top) + 'px');
    }

    function build(end) {
      sec.classList.add('is-pinned');
      gsap.set(cloth, { xPercent: 22.7 });
      gsap.set(back, { scale: 1.12, filter: 'brightness(.7)' });
      gsap.set(heart, { opacity: 0, scale: .4 });
      gsap.set(rays, { opacity: 0, rotate: -20 });
      gsap.set(flood, { opacity: 0, scale: 0 });
      gsap.set(l2.concat(l3), { yPercent: 130 });
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: sec, start: 'top top', end: end, pin: true, scrub: .6, anticipatePin: 1,
          onRefresh: placeFlood,
          onUpdate: function (self) {
            var p = self.progress, idx = p < .34 ? 0 : p < .68 ? 1 : 2;
            steps.forEach(function (li, i) { li.classList.toggle('is-on', i === idx); });
            if (hint) hint.style.opacity = Math.max(0, 1 - p * 8).toFixed(2);
          }
        }
      });
      tl.to(cloth, { xPercent: 0, duration: .7, ease: 'power1.inOut' }, .05)
        .to(back, { scale: 1, filter: 'brightness(1.05)', duration: .7 }, .05)
        .to(heart, { opacity: 1, scale: 1.15, duration: .25, ease: 'power2.out' }, .25)
        .to(rays, { opacity: .7, rotate: 0, duration: .3 }, .45)
        .to(flood, { opacity: .75, scale: 9, duration: .3, ease: 'power2.in' }, .62)
        .to(l1, { yPercent: -130, duration: .08, stagger: .02, ease: 'power2.in' }, .28)
        .to(l2, { yPercent: 0, duration: .08, stagger: .02, ease: 'power2.out' }, .36)
        .to(l2, { yPercent: -130, duration: .08, stagger: .02, ease: 'power2.in' }, .61)
        .to(l3, { yPercent: 0, duration: .08, stagger: .02, ease: 'power2.out' }, .7)
        .to({}, { duration: .05 }, .95);
      placeFlood();
      return function () { sec.classList.remove('is-pinned'); if (hint) hint.style.opacity = ''; };
    }

    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () { return build('+=220%'); });
    mm.add('(max-width: 899px)', function () { return build('+=160%'); });
  });

  // Constellation dividers that draw with the scroll.
  safe(function () {
    var ns = 'http://www.w3.org/2000/svg';
    [
      ['#recognize', [[0, 28], [120, 20], [230, 34], [330, 14], [440, 28], [550, 14], [650, 34], [760, 20], [880, 28]], 3],
      ['#books', [[0, 18], [140, 36], [250, 12], [370, 30], [470, 22], [600, 40], [700, 16], [800, 32], [880, 24]], 4]
    ].forEach(function (cfg) {
      var sec = $(cfg[0]), pts = cfg[1], big = cfg[2];
      if (!sec) return;
      var d = 'M' + pts.map(function (p) { return p.join(' '); }).join(' L ');
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('class', 'divider');
      svg.setAttribute('viewBox', '0 0 880 56');
      svg.setAttribute('aria-hidden', 'true');
      var path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      path.setAttribute('pathLength', '1');
      svg.appendChild(path);
      var dots = pts.slice(1, -1).map(function (p, i) {
        var c = document.createElementNS(ns, 'circle');
        c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); c.setAttribute('r', i === big ? 3.4 : 2.2);
        svg.appendChild(c);
        return c;
      });
      sec.insertBefore(svg, sec.firstChild);
      gsap.set(path, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(dots, { scale: 0 });
      gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 90%', end: 'top 40%', scrub: .5 } })
        .to(path, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0)
        .to(dots, { scale: 1, ease: 'back.out(3)', duration: .25, stagger: .11 }, .05);
    });
  });

  safe(function () {
    gsap.to('.hero-lady', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Journey thread: a clip reveal (non-scaling stroke makes dash lengths unreliable).
    var thread = $('.thread');
    if (thread) {
      gsap.fromTo(thread, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: '.thread-wrap', start: 'top 70%', end: 'bottom 70%', scrub: .6 } });
    }
    $$('.glyph').forEach(function (g) {
      gsap.from(g, { scale: .4, rotate: -40, duration: .8, ease: 'back.out(2)', scrollTrigger: { trigger: g, start: 'top 85%', once: true } });
    });

    gsap.to('.stack-dossier', { rotate: -7, y: -20, ease: 'none', scrollTrigger: { trigger: '.program', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.stack-book', { rotate: 9, y: -50, ease: 'none', scrollTrigger: { trigger: '.program', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.booklet-cover', { rotate: -14, y: 40, ease: 'none', scrollTrigger: { trigger: '.booklet', start: 'top bottom', end: 'center center', scrub: true } });
    gsap.from('.price-tag', { scale: 0, rotate: -90, duration: .8, ease: 'back.out(2.2)', scrollTrigger: { trigger: '.booklet-cover-wrap', start: 'top 75%', once: true } });
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
