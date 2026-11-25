/* DOSSIER section: "Every journey begins with a map".
   Desktop + motion OK + GSAP  -> pinned cinematic scroll through the 9 chapter pages.
   Otherwise                  -> calm stacked layout with soft reveals.
   Independent of site.js; only reads window.gsap / window.ScrollTrigger. */
(function () {
  'use strict';
  var sec = document.getElementById('dossier');
  if (!sec) return;
  var root = document.documentElement;
  var pin = sec.querySelector('.dz-pin');
  var chs = [].slice.call(sec.querySelectorAll('.dz-ch'));
  var rail = [].slice.call(sec.querySelectorAll('.dz-rail button'));
  var actEl = sec.querySelector('.dz-act');
  var nowEl = sec.querySelector('.dz-count-now');
  var hud = sec.querySelector('.dz-hud');
  var railBox = sec.querySelector('.dz-rail');
  var canvas = sec.querySelector('.dz-embers');
  var NUM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  chs.forEach(function (li) { li.style.setProperty('--g', li.getAttribute('data-glow')); });
  root.classList.add('dz-js');

  /* ---------- stacked layout: reveal each chapter once ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    chs.forEach(function (li) { io.observe(li); });
  } else {
    chs.forEach(function (li) { li.classList.add('is-in'); });
  }

  /* ---------- embers: rising rose-gold sparks ---------- */
  var glow = chs[0].getAttribute('data-glow');
  var embers = (function () {
    if (!canvas || reduce) return { start: function () {}, stop: function () {} };
    var ctx = canvas.getContext('2d'), P = [], W = 0, H = 0, dpr = 1, raf = 0, on = false;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(p, fresh) {
      p.x = Math.random() * W;
      p.y = fresh ? Math.random() * H : H + 10;
      p.r = 0.6 + Math.random() * 1.9;
      p.vy = 0.25 + Math.random() * 0.75;
      p.sw = Math.random() * Math.PI * 2;
      p.a = 0.25 + Math.random() * 0.6;
      p.gold = Math.random() < 0.55;
      return p;
    }
    function frame() {
      if (!on) return;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        p.y -= p.vy; p.sw += 0.012; p.x += Math.sin(p.sw) * 0.35;
        if (p.y < -10) spawn(p, false);
        var fade = Math.min(1, p.y / (H * 0.35));
        ctx.globalAlpha = p.a * fade * 0.35;
        ctx.fillStyle = p.gold ? '#e3be8f' : glow;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.2, 0, 6.283); ctx.fill();
        ctx.globalAlpha = p.a * fade;
        ctx.fillStyle = p.gold ? '#fbe6c8' : '#f6d6dc';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (on || document.hidden) return;
      size();
      if (!P.length) for (var i = 0; i < 70; i++) P.push(spawn({}, true));
      on = true; raf = requestAnimationFrame(frame);
    }
    function stop() { on = false; cancelAnimationFrame(raf); }
    window.addEventListener('resize', function () { if (on) size(); });
    var want = false;
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (want) start(); });
    return { start: function () { want = true; start(); }, stop: function () { want = false; stop(); } };
  })();

  if (!hasGsap || reduce) return;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  /* ---------- pinned cinematic mode ---------- */
  var goTo = null;
  rail.forEach(function (b) {
    b.addEventListener('click', function () { if (goTo) goTo(+b.getAttribute('data-go')); });
  });
  var mm = gsap.matchMedia();
  mm.add('(min-width: 900px) and (min-height: 620px)', function () {
    root.classList.add('dz-on');
    // each card takes its page's real shape (some pages are taller)
    var cards = chs.map(function (li) { return li.querySelector('.dz-card'); });
    cards.forEach(function (c) { var im = c.querySelector('img'); c.style.aspectRatio = im.getAttribute('width') + ' / ' + im.getAttribute('height'); });
    // load the 9 pages ~1.5 screens before the section, not on page load
    var eagerST = ST.create({ trigger: sec, start: 'top bottom+=1500', once: true,
      onEnter: function () { sec.querySelectorAll('img').forEach(function (im) { im.loading = 'eager'; }); } });

    var INTRO = 1, STEP = 1, IN = 0.3, OUT = 0.25;
    var total = INTRO + chs.length * STEP + 0.3;
    var cur = -2;

    function setActive(i) {
      if (i === cur) return;
      cur = i;
      chs.forEach(function (li, k) { li.classList.toggle('is-on', k === i); });
      rail.forEach(function (b, k) {
        b.classList.toggle('is-on', k === i);
        if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      if (i < 0) return;
      glow = chs[i].getAttribute('data-glow');
      sec.style.setProperty('--g', glow);
      if (actEl) actEl.textContent = chs[i].getAttribute('data-act');
      if (nowEl) nowEl.textContent = NUM[i];
    }

    gsap.set([hud, railBox], { autoAlpha: 0 });
    gsap.set(sec.querySelector('.dz-glow'), { autoAlpha: 0 });

    var tl = gsap.timeline({ defaults: { ease: 'none' } });
    // HUD follows the timeline (what you see), not the raw scroll position
    tl.eventCallback('onUpdate', function () {
      var at = tl.progress() * total;
      setActive(at < INTRO - 0.1 ? -1 : Math.max(0, Math.min(chs.length - 1, Math.floor((at - INTRO + 0.1) / STEP))));
    });
    // phase 0: walk down the road into the dark
    tl.to('.dz-road', { scale: 2.6, yPercent: -8, duration: INTRO, ease: 'power1.in' }, 0)
      .to('.dz-intro-copy', { autoAlpha: 0, y: -80, duration: INTRO * 0.5 }, 0)
      .to('.dz-intro', { autoAlpha: 0, duration: INTRO * 0.45 }, INTRO * 0.55)
      .to('.dz-glow', { autoAlpha: 1, duration: INTRO * 0.5 }, INTRO * 0.5)
      .to([hud, railBox], { autoAlpha: 1, duration: 0.3 }, INTRO * 0.8);

    chs.forEach(function (li, i) {
      var card = li.querySelector('.dz-card');
      var cap = li.querySelectorAll('.dz-cap > *');
      var t = INTRO + i * STEP - 0.2;
      gsap.set(card, { xPercent: -50, yPercent: -50, autoAlpha: 0, y: '75vh', scale: 1.12, rotationX: -24, filter: 'blur(4px) brightness(.6)', transformPerspective: 1400 });
      gsap.set(cap, { autoAlpha: 0, y: 50 });
      tl.to(card, { autoAlpha: 1, y: 0, scale: 1, rotationX: 0, filter: 'blur(0px) brightness(1)', duration: IN, ease: 'power2.out' }, t)
        .to(cap, { autoAlpha: 1, y: 0, duration: IN * 0.8, stagger: 0.06, ease: 'power2.out' }, t + 0.1);
      if (i < chs.length - 1) {
        var o = t + IN + (STEP - IN - OUT) + 0.2;
        tl.to(card, { autoAlpha: 0, y: '-38vh', scale: 0.8, rotationX: 26, filter: 'blur(4px) brightness(.5)', duration: OUT, ease: 'power2.in' }, o)
          .to(cap, { autoAlpha: 0, y: -40, duration: OUT * 0.7, stagger: 0.04, ease: 'power2.in' }, o);
      }
    });
    tl.to({}, { duration: 0.3 }, total - 0.3);

    var st = ST.create({
      trigger: sec,
      start: 'top top',
      end: function () { return '+=' + Math.round(window.innerHeight * total * 0.7); },
      pin: pin,
      scrub: 0.8,
      animation: tl,
      invalidateOnRefresh: true,
      onToggle: function (self) { if (self.isActive) embers.start(); else embers.stop(); }
    });

    goTo = function (i) {
      var at = (INTRO + i * STEP + 0.3) / total;
      window.scrollTo({ top: st.start + (st.end - st.start) * at, behavior: 'smooth' });
    };

    // subtle tilt of the active page toward the mouse
    function tilt(e) {
      if (cur < 0) return;
      var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      gsap.to(chs[cur], { rotationY: x * 6, rotationX: -y * 5, transformPerspective: 1600, duration: 0.9, ease: 'power3.out', overwrite: 'auto' });
    }
    pin.addEventListener('mousemove', tilt);

    // outro: the injury page rises behind the closing line
    var outro = sec.querySelector('.dz-outro');
    if (outro) {
      gsap.fromTo(outro.querySelector('.dz-injury'), { scale: 0.86, y: 60, autoAlpha: 0 }, {
        scale: 1, y: 0, autoAlpha: 1, ease: 'none',
        scrollTrigger: { trigger: outro, start: 'top 90%', end: 'top 20%', scrub: 0.8 }
      });
      gsap.from(outro.querySelectorAll('.dz-cta'), {
        autoAlpha: 0, y: 40, duration: 1.1, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: outro.querySelector('.dz-cta'), start: 'top 92%' }
      });
    }

    ST.sort();
    ST.refresh();
    return function () {
      pin.removeEventListener('mousemove', tilt);
      eagerST.kill();
      gsap.set(chs, { clearProps: 'transform' });
      cards.forEach(function (c) { c.style.removeProperty('aspect-ratio'); });
      goTo = null;
      embers.stop();
      root.classList.remove('dz-on');
      sec.style.removeProperty('--g');
    };
  });
})();
