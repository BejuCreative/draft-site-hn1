/* Dark chapters: the nine Mind Map stations as one pinned, scroll-driven film.
   A particle field (canvas) morphs into a shape for each station. */
(function () {
  'use strict';
  var NS = window.HNW = window.HNW || {};
  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  var ACTS = ['Encode your past', 'Decode your present', 'Recode your future'];
  var TAU = Math.PI * 2;

  var canvas, ctx, W, H, dpr, phone, cx, cy, R, parts = [], sprites = [], visible = false;
  var state = { f: 0, glow: 0 };

  function rnd(i, k) { var x = Math.sin(i * 91.7 + k * 271.3) * 43758.5453; return x - Math.floor(x); }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  function sprite(r, g, b) {
    var c = document.createElement('canvas'); c.width = c.height = 32;
    var x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',1)');
    gr.addColorStop(0.25, 'rgba(' + r + ',' + g + ',' + b + ',.55)');
    gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
    return c;
  }

  /* Each formation returns [x, y, depth] in unit space (about -1.3..1.3). */
  var F = [
    function intro(i, t, a, b, c) { /* dust ring */
      if (c < 0.3) { var rr = Math.sqrt(a) * 1.5, aa = b * TAU + t * 0.03; return [Math.cos(aa) * rr, Math.sin(aa) * rr, 0.5]; }
      var an = a * TAU + t * 0.06, r = 0.92 + (b - 0.5) * 0.18;
      return [Math.cos(an) * r, Math.sin(an) * r, 1];
    },
    function wound(i, t, a, b) { /* burst rays around a dark hole */
      var ray = i % 26, an = ray / 26 * TAU + (a - 0.5) * 0.05, len = 0.55 + rnd(ray, 4) * 0.75;
      var d = 0.16 + Math.pow(b, 0.7) * len; d *= 1 + 0.035 * Math.sin(t * 2.2 + ray);
      return [Math.cos(an) * d, Math.sin(an) * d, 1 - b * 0.5];
    },
    function reaction(i, t, a, b, c) { /* lens ring + cracks */
      if (c < 0.55) { var an = a * TAU, r = 0.88 + (b - 0.5) * 0.06; return [Math.cos(an) * r, Math.sin(an) * r, 1]; }
      var l = i % 7, base = l / 7 * TAU + 0.4, s = b * 1.05, zig = Math.sin(s * 14 + l) * 0.07;
      return [0.22 + Math.cos(base + zig) * s, -0.18 + Math.sin(base + zig) * s, 0.8];
    },
    function encoding(i, t, a, b, c) { /* rotating double helix */
      var y = a * 2.3 - 1.15, k = i % 2, ph = y * 4.6 + t * 0.9 + k * Math.PI;
      if (c < 0.16) { var ph2 = Math.round(y * 6) / 6 * 4.6 + t * 0.9, m = b * 2 - 1; return [Math.sin(ph2) * 0.42 * m, Math.round(y * 6) / 6, 0.6]; }
      return [Math.sin(ph) * 0.42, y, 0.55 + 0.45 * Math.cos(ph)];
    },
    function chaos(i, t, a) { /* Lissajous tangles */
      var k = i % 3, th = a * TAU, d = t * 0.18;
      var AB = [[3, 2], [5, 4], [1, 3]][k];
      return [Math.sin(AB[0] * th + d + k) * 1.0, Math.sin(AB[1] * th + k * 0.7) * 0.92, 0.8];
    },
    function defenses(i, t, a, b) { /* spheres */
      var j = i % 5, C = [[-0.55, -0.35, 0.38], [0.5, -0.45, 0.32], [0, 0.1, 0.46], [-0.45, 0.6, 0.3], [0.58, 0.52, 0.34]][j];
      var th = Math.acos(2 * a - 1), ph = b * TAU + t * 0.4 * (j % 2 ? 1 : -1);
      var x = Math.sin(th) * Math.cos(ph), z = Math.sin(th) * Math.sin(ph), y = Math.cos(th);
      return [C[0] + x * C[2], C[1] + y * C[2], 0.55 + 0.45 * z];
    },
    function breakdown(i, t, a, b, c) { /* web with a tear, particles escaping */
      var an, r;
      if (c < 0.5) { an = Math.floor(a * 12) / 12 * TAU; r = b * 1.05; }
      else { an = a * TAU; r = (Math.floor(b * 6) + 1) / 6 * 1.05; }
      var tear = Math.cos(an - 0.5) > 0.86;
      if (tear && c > 0.3) { r = 0.6 + ((t * 0.12 + a * 3 + b) % 1) * 1.1; return [Math.cos(an) * r, Math.sin(an) * r, 1.15]; }
      return [Math.cos(an) * r, Math.sin(an) * r, 0.75];
    },
    function paradigm(i, t, a, b, c) { /* four overlapping discs */
      var j = i % 4, C = [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]][j];
      var an = a * TAU + t * 0.1 * (j % 2 ? 1 : -1), r = c < 0.75 ? 0.56 : Math.sqrt(b) * 0.56;
      return [C[0] + Math.cos(an) * r, C[1] + Math.sin(an) * r, c < 0.75 ? 1 : 0.5];
    },
    function healing(i, t, a, b, c) { /* rising helix stair */
      var s = a, y = 1.15 - s * 2.3, an = s * 4 * Math.PI + t * 0.5, rr = 0.55;
      if (c < 0.5) { var q = Math.round(s * 16) / 16; y = 1.15 - q * 2.3; an = q * 4 * Math.PI + t * 0.5; rr = 0.55 * (0.2 + b * 0.8); }
      return [Math.cos(an) * rr, y, 0.55 + 0.45 * Math.sin(an)];
    },
    function unity(i, t, a, b, c) { /* globe in concentric rings */
      if (c < 0.6) {
        var lat = (Math.floor(a * 9) / 8 - 0.5) * Math.PI, lon = b * TAU + t * 0.25;
        if (c < 0.25) { lat = (a - 0.5) * Math.PI; lon = Math.floor(b * 10) / 10 * TAU + t * 0.25; }
        var x = Math.cos(lat) * Math.sin(lon), z = Math.cos(lat) * Math.cos(lon);
        return [x * 0.55, Math.sin(lat) * 0.55, 0.5 + 0.5 * z];
      }
      var ring = Math.floor(b * 3), rad = 0.8 + ring * 0.2, an = a * TAU + t * (0.05 + ring * 0.03);
      return [Math.cos(an) * rad, Math.sin(an) * rad * 0.94, 0.9];
    },
    function outro(i, t, a, b) { /* gather into one point of light */
      var an = a * TAU, r = 0.04 + b * 0.08;
      return [Math.cos(an) * r, Math.sin(an) * r, 1.2];
    }
  ];

  function layout() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    if (!W || !H) return;
    phone = W < 760;
    /* v4 perf: the particles are soft glows, so phones draw them at 1x density */
    dpr = Math.min(phone ? 1 : 1.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    cx = W * (phone ? 0.5 : 0.62); cy = H * (phone ? 0.34 : 0.5);
    R = phone ? Math.min(W * 0.36, H * 0.2) : Math.min(W * 0.26, H * 0.34);
    var n = phone ? 500 : 900;
    if (parts.length !== n) {
      parts = [];
      for (var i = 0; i < n; i++) {
        var c = rnd(i, 9);
        parts.push({ a: rnd(i, 1), b: rnd(i, 2), c: rnd(i, 3), st: rnd(i, 4) * 0.35, x: cx, y: cy, z: 1,
          col: c < 0.5 ? 0 : c < 0.8 ? 1 : 2, size: 3 + rnd(i, 5) * 5 });
      }
    }
  }

  function frame() {
    if (!visible || !ctx) return;
    var t = performance.now() / 1000, f = state.f;
    var i0 = Math.max(0, Math.min(10, Math.floor(f))), i1 = Math.min(10, i0 + 1), fr = f - i0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    var fa = F[i0], fb = F[i1];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var A = fa(i, t, p.a, p.b, p.c), B = i1 !== i0 ? fb(i, t, p.a, p.b, p.c) : A;
      var k = smooth(clamp((fr - p.st) / 0.65));
      var tx = cx + (A[0] + (B[0] - A[0]) * k) * R, ty = cy + (A[1] + (B[1] - A[1]) * k) * R, tz = A[2] + (B[2] - A[2]) * k;
      p.x += (tx - p.x) * 0.14; p.y += (ty - p.y) * 0.14; p.z += (tz - p.z) * 0.14;
      var sz = p.size * (0.45 + 0.55 * p.z) * (phone ? 0.8 : 1);
      ctx.globalAlpha = Math.min(1, 0.32 + 0.5 * p.z);
      /* wound: more rose; healing/unity: more gold */
      var col = p.col;
      if (f < 1.5 && f > 0.5 && p.c < 0.35) col = 1;
      ctx.drawImage(sprites[col], p.x - sz / 2, p.y - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  NS.chapters = {
    state: state,
    dark: false,
    init: function (opts) {
      var stage = document.getElementById('chStage'), dark = document.getElementById('chDark');
      canvas = document.getElementById('chCanvas');
      if (!stage || !canvas || !(opts && opts.motion)) return; /* static stacked chapters (CSS) */
      ctx = canvas.getContext('2d');
      sprites = [sprite(240, 205, 150), sprite(230, 130, 150), sprite(255, 240, 228)];
      var gsap = window.gsap, self = this;
      var hudAct = document.getElementById('hudAct'), hudNum = document.getElementById('hudNum'), hudBar = document.getElementById('hudBar');
      var hud = stage.querySelector('.ch-hud');
      var intro = stage.querySelector('.ch-intro'), outro = stage.querySelector('.ch-outro');
      var slides = stage.querySelectorAll('.ch-list .ch-slide');

      gsap.set([intro, outro], { xPercent: -50, yPercent: -50 });
      var tl = gsap.timeline({ defaults: { ease: 'none' } });
      /* v4: the dark circle opens from a visible size and faster, so the block never starts with a near-empty screen */
      tl.fromTo(dark, { clipPath: 'circle(14% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 0.55, ease: 'power1.inOut' }, 0)
        .fromTo(intro, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.2)
        .to(intro, { autoAlpha: 0, y: -40, duration: 0.3, ease: 'power2.in' }, 1.7)
        .to(hud, { opacity: 1, duration: 0.3 }, 1.8)
        .to(state, { f: 0, duration: 0.01 }, 0);
      var starts = [];
      Array.prototype.forEach.call(slides, function (sl, k) {
        var s0 = 2.0 + k * 0.9;
        starts.push(s0);
        var parts = sl.children;
        tl.fromTo(sl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, s0)
          .fromTo(parts, { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: 0.24, stagger: 0.04, ease: 'power3.out' }, s0)
          .to(state, { f: k + 1, duration: 0.55, ease: 'power2.inOut' }, s0 - 0.25)
          .to(parts, { y: -36, opacity: 0, duration: 0.18, stagger: 0.02, ease: 'power2.in' }, s0 + 0.68)
          .set(sl, { autoAlpha: 0 }, s0 + 0.9);
      });
      var oS = 2.0 + slides.length * 0.9;
      tl.to(hud, { opacity: 0, duration: 0.2 }, oS - 0.1)
        .to(state, { f: 10, duration: 0.5, ease: 'power2.inOut' }, oS - 0.2)
        .fromTo(outro, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, oS + 0.1)
        .to(outro, { autoAlpha: 0, y: -30, duration: 0.25 }, oS + 1.25)
        /* v4: the dark layer fades with the outro and the pin ends right there, so the next section follows at once */
        .to(dark, { opacity: 0, duration: 0.3, ease: 'power1.in' }, oS + 1.25);
      var total = tl.duration();

      ScrollTrigger.create({
        trigger: stage, start: 'top top',
        /* same scroll distance per timeline unit as before (10.5 vh for 12 units) */
        end: function () { return '+=' + Math.round(window.innerHeight * 0.875 * total); },
        pin: true, scrub: 0.5, animation: tl,
        onLeave: function () { self.dark = false; },
        onLeaveBack: function () { self.dark = false; }
      });
      /* HUD follows the scrubbed timeline itself, so it never lags behind the chapter on screen */
      tl.eventCallback('onUpdate', function () {
          var tt = tl.time(), k = -1;
          for (var j = 0; j < starts.length; j++) if (tt >= starts[j] - 0.02) k = j;
          if (k >= 0) {
            hudNum.textContent = ROMAN[k];
            hudAct.textContent = ACTS[Math.floor(k / 3)];
          }
          hudBar.style.transform = 'scaleX(' + clamp((tt - 2.0) / (oS - 2.0)).toFixed(4) + ')';
          var was = self.dark;
          self.dark = tt > 0.45 && tt < oS + 1.35;
          if (was !== self.dark && NS.syncHeader) NS.syncHeader();
      });
      this.total = total;

      layout();
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) layout(); }, { threshold: 0 }).observe(stage);
      }
      gsap.ticker.add(frame);
      var t0;
      window.addEventListener('resize', function () { clearTimeout(t0); t0 = setTimeout(layout, 150); });
    }
  };
})();
