/* Healing Narcissistic Wounds, draft site A */
(function () {
  'use strict';

  // Founder decision 11-25: phone OFF. Never put the number in this file.
  var SHOW_PHONE = false;
  var PUBLIC_PHONE = '';
  var CONTACT_EMAIL = 'info@psychologicalhealingcenter.com';
  var VIMEO_SRC = 'https://player.vimeo.com/video/857633766?h=b1ca4e1d99&dnt=1&autoplay=1&title=0&byline=0&portrait=0';

  var root = document.documentElement;
  var hasGsap = typeof window.gsap !== 'undefined';
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------------------------------------------------------
     1. ANGEL INTRO
     --------------------------------------------------------- */
  var intro = $('#intro');
  var introDone = false;

  function endIntro(fast) {
    if (introDone) return;
    introDone = true;
    try { sessionStorage.setItem('hnw-intro-seen', '1'); } catch (e) {}
    var finish = function () {
      root.classList.remove('intro-on');
      if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
      startHero();
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    };
    if (fast || !hasGsap) { finish(); return; }
    gsap.killTweensOf(intro);
    gsap.to(intro, { autoAlpha: 0, duration: .35, ease: 'power1.out', onComplete: finish });
  }

  function playIntro() {
    var skip = $('#introSkip');
    skip.addEventListener('click', function () { endIntro(false); });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); endIntro(false); }
    });
    ['wheel', 'touchmove'].forEach(function (t) {
      window.addEventListener(t, function () { if (introDone) return; endIntro(false); }, { passive: true, once: true });
    });
    intro.addEventListener('click', function (e) { if (e.target !== skip) endIntro(false); });

    var cloth = $('.intro-cloth'), back = $('.intro-back'), veil = $('.intro-veil'),
        heart = $('.intro-heart'), bloom = $('.intro-bloom'),
        lines = $$('.intro-lines path'), copy = $$('.intro-copy > *');

    lines.forEach(function (p) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });

    // Place the bloom on the heart light of the figure.
    function placeBloom() {
      var r = $('.intro-frame').getBoundingClientRect();
      gsap.set(bloom, { left: r.left + r.width * 0.834, top: r.top + r.height * 0.395 });
    }

    var tl = gsap.timeline({ defaults: { ease: 'power2.out' }, onComplete: function () { endIntro(true); } });
    tl.set(cloth, { xPercent: 22.7 })
      .set(back, { filter: 'brightness(.45) saturate(.8)' })
      .set(cloth, { filter: 'brightness(.62)' })
      .from('.intro-frame', { autoAlpha: 0, scale: .96, duration: .4 }, 0)
      .to(lines, { strokeDashoffset: 0, duration: 1.4, stagger: .1, ease: 'power1.inOut' }, 0)
      .from(copy, { autoAlpha: 0, y: 14, duration: .5, stagger: .1 }, .25)
      .to(cloth, { xPercent: 0, duration: 1.3, ease: 'power3.inOut' }, .2)
      .to(cloth, { filter: 'brightness(1)', duration: .9, ease: 'power1.out' }, .3)
      .to(veil, { opacity: 0, duration: .9, ease: 'power1.out' }, .55)
      .to(back, { filter: 'brightness(1.05) saturate(1)', duration: 1, ease: 'power1.out' }, .55)
      .to(heart, { opacity: 1, scale: 1.1, duration: .45, ease: 'power2.out' }, 1.0)
      .to(heart, { scale: .95, duration: .25, ease: 'sine.inOut' }, 1.45)
      .add(placeBloom, 1.45)
      .to(bloom, { opacity: 1, duration: .2, ease: 'none' }, 1.5)
      .to(bloom, { scale: Math.max(window.innerWidth, window.innerHeight) / 10, duration: .65, ease: 'power2.in' }, 1.5)
      .to(intro, { autoAlpha: 0, duration: .3, ease: 'power1.out' }, 1.95);
  }

  if (root.classList.contains('intro-on') && intro) {
    if (!hasGsap) { endIntro(true); }
    else {
      var imgs = $$('img', intro), pending = imgs.length, started = false;
      var go = function () { if (started) return; started = true; playIntro(); };
      imgs.forEach(function (im) {
        if (im.complete) { pending--; }
        else { im.addEventListener('load', function () { if (--pending <= 0) go(); }); im.addEventListener('error', function () { if (--pending <= 0) go(); }); }
      });
      if (pending <= 0) go();
      setTimeout(go, 500); // do not wait on slow images
      // Failsafe: the site is never blocked more than ~3 s after navigation start.
      setTimeout(function () { endIntro(true); }, Math.max(0, 2700 - (window.performance ? performance.now() : 0)));
    }
  } else {
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    root.classList.remove('intro-on');
  }

  /* ---------------------------------------------------------
     2. HEADER + NAV
     --------------------------------------------------------- */
  var header = $('.site-header'), toggle = $('#navToggle'), nav = $('#nav');
  function onScroll() { header.classList.toggle('is-solid', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  function setNav(open) {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setNav(false); toggle.focus(); }
  });

  /* ---------------------------------------------------------
     3. TEASER VIDEO + EMAIL GATE
     --------------------------------------------------------- */
  var teaser = $('#teaser'), cover = $('#teaserCover'), gate = $('#videoGate'),
      gateForm = $('#gateForm'), gateEmail = $('#gateEmail'), gateErr = $('#gateErr'), shell = $('.video-shell');

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
    $('#teaserCard').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
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
    // DRAFT: the email is not stored yet. Wire this to the CRM / GHL form before launch.
    teaser.pause();
    var f = document.createElement('iframe');
    f.src = VIMEO_SRC;
    f.title = 'Healing from Narcissistic Abuse, full introduction';
    f.allow = 'autoplay; fullscreen; picture-in-picture';
    shell.innerHTML = '';
    shell.appendChild(f);
    $('#openGate').hidden = true;
  });

  /* ---------------------------------------------------------
     4. REQUEST A SESSION (mailto until a real form backend exists)
     --------------------------------------------------------- */
  var rq = $('#requestForm');
  rq.addEventListener('submit', function (e) {
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

  /* ---------------------------------------------------------
     5. BOOKLET (checkout placeholder)
     --------------------------------------------------------- */
  $('#bookletBtn').addEventListener('click', function (e) {
    e.preventDefault();
    var n = $('#booklet-checkout');
    n.hidden = false;
    n.classList.remove('is-flash');
    void n.offsetWidth;
    n.classList.add('is-flash');
    n.focus({ preventScroll: true });
  });

  /* Footer phone stays hidden while SHOW_PHONE is false. */
  if (SHOW_PHONE && PUBLIC_PHONE) {
    var fp = $('#footerPhone');
    fp.textContent = PUBLIC_PHONE;
    fp.hidden = false;
  }

  /* ---------------------------------------------------------
     6. HERO CONSTELLATION CANVAS
     --------------------------------------------------------- */
  var canvas = $('#heroStars');
  (function stars() {
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d'), pts = [], w = 0, h = 0, raf = 0, visible = true;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, (w * h) / 16000));
      pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18, r: Math.random() * 1.6 + .6 });
      }
    }
    function draw(move) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (move) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
        }
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < 13000) {
            ctx.strokeStyle = 'rgba(99,16,25,' + (0.16 * (1 - d / 13000)).toFixed(3) + ')';
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(255,250,244,0.95)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    function loop() { draw(true); raf = visible ? requestAnimationFrame(loop) : 0; }
    size();
    if (reduce) { draw(false); window.addEventListener('resize', function () { size(); draw(false); }); return; }
    window.addEventListener('resize', size);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(loop);
      }).observe(canvas);
    }
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (visible && !raf) raf = requestAnimationFrame(loop);
    });
  })();

  /* ---------------------------------------------------------
     7. SCROLL ANIMATION (GSAP + ScrollTrigger)
     --------------------------------------------------------- */
  var heroStarted = false;
  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    if (!hasGsap || reduce) return;
    gsap.from('[data-hero]', { autoAlpha: 0, y: 26, duration: .9, stagger: .1, ease: 'power3.out', clearProps: 'all' });
    gsap.from('.hero-lady', { autoAlpha: 0, x: 40, duration: 1.6, ease: 'power2.out' });
  }
  if (!root.classList.contains('intro-on')) startHero();

  if (!hasGsap || reduce || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // Cloth ribbons sway gently, like the cloth in the cover.
  gsap.to('.rb-a', { y: -18, skewY: 2, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.rb-b', { y: 14, skewY: -2, duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.hero-lady', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Generic reveals.
  gsap.set('[data-reveal]', { autoAlpha: 0, y: 30 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: function (els) { gsap.fromTo(els, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: .9, stagger: .09, ease: 'power3.out', overwrite: true }); }
  });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

  // Journey thread draws with the scroll. A clip reveal, because the stretched
  // SVG (non-scaling stroke) makes dash lengths differ from getTotalLength().
  var thread = $('.thread');
  if (thread) {
    gsap.fromTo(thread, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: '.thread-wrap', start: 'top 70%', end: 'bottom 70%', scrub: .6 } });
  }
  $$('.glyph').forEach(function (g) {
    gsap.from(g, { scale: .4, rotate: -40, duration: .8, ease: 'back.out(2)', scrollTrigger: { trigger: g, start: 'top 85%', once: true } });
  });

  // Mind map: gold line draws across each row, medallions turn in.
  $$('[data-row]').forEach(function (row) {
    var st = $('.mm-stations', row);
    gsap.fromTo(st, { '--line': 0 }, { '--line': 1, duration: 1.2, ease: 'power2.inOut', scrollTrigger: { trigger: row, start: 'top 80%', once: true } });
    gsap.from($$('.mm-st img', row), { scale: .6, rotate: -60, autoAlpha: 0, duration: 1, stagger: .15, ease: 'power3.out', scrollTrigger: { trigger: row, start: 'top 82%', once: true } });
  });

  // Program stack parallax.
  gsap.to('.stack-dossier', { rotate: -7, y: -20, ease: 'none', scrollTrigger: { trigger: '.program', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.to('.stack-book', { rotate: 9, y: -50, ease: 'none', scrollTrigger: { trigger: '.program', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.booklet-cover', { rotate: -14, y: 40, ease: 'none', scrollTrigger: { trigger: '.booklet', start: 'top bottom', end: 'center center', scrub: true } });
  gsap.from('.price-tag', { scale: 0, rotate: -90, duration: .8, ease: 'back.out(2.2)', scrollTrigger: { trigger: '.booklet-cover-wrap', start: 'top 75%', once: true } });
})();
