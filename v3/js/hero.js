/* Hero: a woman drawn in code draws back a veil of embossed fabric strands.
   Everything here is vector math on a canvas. No photo, no image file.
   Scroll drives the reveal (pinned). Load draws the strands in. */
(function () {
  'use strict';
  var NS = window.HNW = window.HNW || {};

  /* Figure outlines in local units (traced from the dossier cover art, redrawn as paths). */
  var BODY = 'M352 160 C354 170 355 180 358 188 C372 192 390 196 402 206 C430 222 470 236 512 244 C534 248 552 246 566 243 C578 240 590 244 594 252 C597 260 594 270 586 276 C576 282 562 280 552 276 C530 274 500 270 470 266 C444 262 424 262 414 266 C416 290 414 310 408 330 L300 330 C292 280 290 230 300 196 C310 182 322 172 330 166 Z';
  var HEAD = 'M330 166 C318 150 302 128 304 100 C306 72 326 54 346 58 C360 62 364 76 362 88 C364 96 367 102 367 106 C368 112 371 118 375 126 C376 129 372 133 367 135 C368 138 369 141 366 143 C368 146 368 149 365 151 C366 155 364 158 359 160 C356 162 354 162 352 160 C348 162 340 166 330 166 Z';
  var CAP = 'M360 80 C352 62 330 54 314 62 C296 72 290 100 294 126 C298 150 310 168 326 178 C334 170 338 150 336 132 C334 116 342 100 352 92 C356 88 358 84 360 80 Z';
  var HAND = { x: 575, y: 258 };
  var OX = 270, OY = 40, OW = 350, OH = 310; /* offscreen box for the pre-rendered body */

  var stage, canvas, ctx, shell, W = 0, H = 0, dpr = 1, phone = false;
  var hand = { x: 0, y: 0 }, s = 0.8;
  var strands = [], hairs = [], N = 70;
  var fig = null;
  var state = { p: 0 };
  var loadT = 0, loadStart = 0, visible = true, running = false, motion = true;
  var sparks = [];

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rnd(i, k) { var x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }

  function offsetIn(el, root) {
    var x = 0, y = 0, n = el;
    while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
  }

  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    phone = W < 760;
    if (phone) {
      hand.x = W * 0.48; hand.y = H * 0.86; s = 0.42;
    } else {
      var r = offsetIn(shell, stage);
      hand.x = r.x - 10; hand.y = r.y + r.h * 0.95;
      s = Math.min(0.95, (r.x + 40) / 520);
      if (hand.y > H * 0.9) hand.y = H * 0.9;
    }
    N = phone ? 34 : 52;
    buildStrands();
    buildHair();
    buildFigure();
  }

  function buildStrands() {
    strands = [];
    var uH = clamp(hand.x / W);
    for (var i = 0; i < N; i++) {
      var u = i / (N - 1), a = rnd(i, 1), b = rnd(i, 2);
      /* VEIL: hanging straight across the whole stage, the left ones gathered toward her hand. */
      var x = -0.03 * W + (u + 0.018 * Math.sin(u * 23) + (a - 0.5) * 0.012) * 1.06 * W;
      var sw = Math.sin(u * 9 + 1.3) * 0.035 * W, sw2 = Math.sin(u * 6 + 2.1) * 0.03 * W;
      var top = -0.04 * H, bot = 1.04 * H;
      var pull = Math.pow(1 - u, 4);
      var mx = x + (hand.x - x) * 0.5 * pull, my = lerp(0.5 * H, hand.y, pull);
      var V = [x, top, x + sw, top + (my - top) * 0.4, mx + (x - mx) * 0.3 - sw * 0.6, my - (my - top) * 0.25, mx, my,
               mx + (x - mx) * 0.3 + sw * 0.6, my + (bot - my) * 0.25, x + sw2, bot - (bot - my) * 0.4, x, bot];
      /* FINAL: bunched at the top right, swooping under the video into her hand, tails fanned along an L. */
      var tx = W * (0.8 + 0.21 * u) + (b - 0.5) * 8, ty = -0.04 * H;
      var Mx = hand.x + (a - 0.5) * 14 * s, My = hand.y + (b - 0.5) * 10 * s;
      var Lv = Math.max(10, 1.04 * H - My), Lh = Math.max(10, Mx + 0.03 * W), d = u * (Lv + Lh), Ex, Ey;
      if (d < Lv) { Ex = -0.03 * W; Ey = My + d; } else { Ex = -0.03 * W + (d - Lv); Ey = 1.04 * H; }
      var F = [tx, ty, tx - 0.02 * W * (1 - u), H * (0.45 + 0.15 * u),
               Mx + 0.25 * W * (0.6 + 0.4 * u), My + 0.035 * H * (0.5 + 0.5 * u), Mx, My,
               Mx - (Mx - Ex) * 0.35, My + (Ey - My) * 0.05 + 0.015 * H, Ex + (Mx - Ex) * 0.25, Ey - (Ey - My) * 0.3, Ex, Ey];
      strands.push({ u: u, V: V, F: F, delay: Math.abs(u - uH) * 0.4, P: new Array(14) });
    }
  }

  function buildHair() {
    hairs = [];
    var n = phone ? 26 : 40;
    for (var k = 0; k < n; k++) {
      var q = k / (n - 1), r = rnd(k, 7);
      var th = (150 + 140 * q) * Math.PI / 180;
      hairs.push({
        rx: 332 + 32 * Math.cos(th), ry: 108 + 46 * Math.sin(th),
        tx: lerp(240, 70, rnd(k, 3)), ty: lerp(300, 140, q) + r * 30,
        ph: rnd(k, 5) * 6.28, w: 0.7 + rnd(k, 9) * 0.9
      });
    }
  }

  function buildFigure() {
    fig = document.createElement('canvas');
    var k = s * dpr;
    fig.width = Math.ceil(OW * k); fig.height = Math.ceil(OH * k);
    var g = fig.getContext('2d');
    g.setTransform(k, 0, 0, k, -OX * k, -OY * k);
    var body = new Path2D(BODY), head = new Path2D(HEAD), cap = new Path2D(CAP);
    function emboss(p, fill) {
      g.save();
      g.fillStyle = fill;
      g.shadowColor = 'rgba(120,80,75,.34)'; g.shadowBlur = 4 * k; g.shadowOffsetX = 2.4 * k; g.shadowOffsetY = 3 * k;
      g.fill(p);
      g.shadowColor = 'rgba(255,255,255,.95)'; g.shadowBlur = 2 * k; g.shadowOffsetX = -1.4 * k; g.shadowOffsetY = -1.4 * k;
      g.fill(p);
      g.restore();
    }
    emboss(body, '#F7EDE9');
    emboss(head, '#F8EFEB');
    emboss(cap, '#EFDDD6');
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = 'rgba(166,118,70,.72)'; g.lineWidth = 1.3;
    g.stroke(body); g.stroke(head);
    g.strokeStyle = 'rgba(166,118,70,.55)'; g.lineWidth = 1; g.stroke(cap);
    /* braid, eye, shoulder fold, fingers */
    g.beginPath(); g.moveTo(352, 74); g.bezierCurveTo(340, 80, 330, 86, 318, 96);
    for (var j = 0; j < 5; j++) { var bx = 348 - j * 7, by = 77 + j * 4.2; g.moveTo(bx, by - 3); g.lineTo(bx - 3, by + 3); }
    g.moveTo(357, 113); g.quadraticCurveTo(361, 110.5, 365, 113.5);
    g.moveTo(402, 206); g.bezierCurveTo(396, 230, 400, 252, 414, 266);
    g.moveTo(566, 243); g.bezierCurveTo(572, 252, 572, 264, 566, 272);
    g.moveTo(578, 246); g.bezierCurveTo(584, 254, 584, 266, 578, 274);
    g.strokeStyle = 'rgba(111,42,64,.42)'; g.lineWidth = 1.1; g.stroke();
    /* fade the cut-off bust into the paper */
    g.globalCompositeOperation = 'destination-out';
    var fade = g.createLinearGradient(0, 270, 0, 332);
    fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = fade; g.fillRect(OX, 262, OW, 80);
    g.globalCompositeOperation = 'source-over';
  }

  function computeStrand(st, pe, time, i) {
    var t = smooth(clamp((pe - st.delay) / 0.6));
    var V = st.V, F = st.F, P = st.P;
    for (var k = 0; k < 14; k++) P[k] = V[k] + (F[k] - V[k]) * t;
    var amp = 6 * (1 - t) + 2, dm = Math.sin(time * 0.7 + i * 0.37) * amp;
    P[4] += dm; P[6] += dm; P[8] += dm;
    P[7] += Math.cos(time * 0.5 + i * 0.21) * 2;
    var w2 = Math.sin(time * 0.9 + i * 0.5) * (5 * (1 - t) + 3);
    P[4] += w2; P[8] -= w2;
    P[10] += Math.sin(time * 0.6 + i * 0.29) * (4 * (1 - t) + 2);
    return t;
  }

  function addStrand(path, P) {
    path.moveTo(P[0], P[1]);
    path.bezierCurveTo(P[2], P[3], P[4], P[5], P[6], P[7]);
    path.bezierCurveTo(P[8], P[9], P[10], P[11], P[12], P[13]);
  }

  function draw(time) {
    var p = state.p, pe = 1 - Math.pow(1 - clamp(p), 2.2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var path = new Path2D(), avgT = 0;
    for (var i = 0; i < strands.length; i++) { avgT += computeStrand(strands[i], pe, time, i); addStrand(path, strands[i].P); }
    avgT /= strands.length;

    var lt = 1 - Math.pow(1 - loadT, 3);
    /* cloth fill between the outer strands */
    var A = strands[0].P, B = strands[strands.length - 1].P;
    var cloth = new Path2D();
    cloth.moveTo(A[0], A[1]);
    cloth.bezierCurveTo(A[2], A[3], A[4], A[5], A[6], A[7]);
    cloth.bezierCurveTo(A[8], A[9], A[10], A[11], A[12], A[13]);
    cloth.lineTo(B[12], B[13]);
    cloth.bezierCurveTo(B[10], B[11], B[8], B[9], B[6], B[7]);
    cloth.bezierCurveTo(B[4], B[5], B[2], B[3], B[0], B[1]);
    cloth.closePath();
    /* cream silk while it hangs; as she gathers it, the fold in her hand turns to the wine velvet of the booklet cover */
    var ca = lerp(0.9, 0.32, avgT) * lt;
    var cg = ctx.createLinearGradient(0, 0, W, H);
    cg.addColorStop(0, 'rgba(252,246,242,' + ca + ')');
    cg.addColorStop(0.6, 'rgba(244,232,227,' + ca + ')');
    cg.addColorStop(1, 'rgba(236,220,213,' + ca + ')');
    ctx.fillStyle = cg; ctx.fill(cloth);
    var va = smooth(clamp((avgT - 0.15) / 0.85)) * lt;
    if (va > 0.01) {
      var vr = Math.max(W, H) * (phone ? 0.7 : 0.55);
      var vg = ctx.createRadialGradient(hand.x, hand.y, 0, hand.x, hand.y, vr);
      vg.addColorStop(0, 'rgba(111,42,64,' + (0.62 * va) + ')');
      vg.addColorStop(0.35, 'rgba(140,62,82,' + (0.34 * va) + ')');
      vg.addColorStop(0.7, 'rgba(200,150,140,' + (0.12 * va) + ')');
      vg.addColorStop(1, 'rgba(240,225,218,0)');
      ctx.fillStyle = vg; ctx.fill(cloth);
    }

    /* strands: shadow, highlight, base (embossed paper ridges) */
    var len = 3 * H;
    if (lt < 1) { ctx.setLineDash([len * lt + 0.1, len]); }
    ctx.lineCap = 'round';
    ctx.save(); ctx.translate(1, 1.4); ctx.strokeStyle = 'rgba(120,80,75,.28)'; ctx.lineWidth = phone ? 1.8 : 2.2; ctx.stroke(path); ctx.restore();
    ctx.save(); ctx.translate(-0.8, -0.8); ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 1.5; ctx.stroke(path); ctx.restore();
    ctx.strokeStyle = 'rgba(' + Math.round(lerp(222, 208, avgT)) + ',' + Math.round(lerp(198, 160, avgT)) + ',' + Math.round(lerp(190, 112, avgT)) + ',.85)'; ctx.lineWidth = 1.15; ctx.stroke(path);
    ctx.setLineDash([]);

    /* the woman */
    var fa = smooth(clamp((loadT - 0.15) / 0.85));
    if (fa > 0 && fig) {
      ctx.globalAlpha = fa;
      var X = hand.x + (OX - HAND.x) * s, Y = hand.y + (OY - HAND.y) * s;
      ctx.drawImage(fig, X, Y, OW * s, OH * s);
      /* hair, alive: flows left, lifts a little more as she pulls */
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (hand.x - HAND.x * s), dpr * (hand.y - HAND.y * s));
      var wind = 1 + pe * 0.8;
      ctx.lineCap = 'round';
      for (var pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        for (var k = 0; k < hairs.length; k++) {
          var h = hairs[k], wv = Math.sin(time * 1.3 + h.ph) * 8 * wind, wv2 = Math.sin(time * 1.1 + h.ph * 1.7) * 6 * wind;
          var ox = pass ? 0 : 1, oy = pass ? 0 : 1.2;
          var ex = h.tx + Math.cos(time * 0.8 + h.ph) * 5, ey = h.ty + wv2 * 0.6;
          var mxh = (h.rx + ex) / 2 + 6, myh = (h.ry + ey) / 2 + 18 + wv * 0.9;
          ctx.moveTo(h.rx + ox, h.ry + oy);
          ctx.bezierCurveTo(h.rx - 22 + ox, h.ry - 26 + wv * 0.4 + oy, mxh + 30 + ox, myh - 22 + oy, mxh + ox, myh + oy);
          ctx.bezierCurveTo(mxh - 30 + ox, myh + 22 + oy, ex + 34 + ox, ey - 26 - wv2 + oy, ex + ox, ey + oy);
        }
        ctx.strokeStyle = pass ? 'rgba(185,138,92,.6)' : 'rgba(120,80,75,.18)';
        ctx.lineWidth = (pass ? 1.15 : 1.4) / Math.max(s, 0.4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  function placeSparks(time) {
    for (var i = 0; i < sparks.length; i++) {
      var a = time * (0.35 + i * 0.12) + i * 2.1;
      var big = i !== 1;
      var rx = big ? 49 : 46, ry = big ? 48.3 : 45;
      sparks[i].style.left = (50 + rx * Math.cos(a)) + '%';
      sparks[i].style.top = (50 + ry * Math.sin(a)) + '%';
    }
  }

  function frame() {
    if (!visible) return;
    var now = performance.now();
    if (loadT < 1) loadT = Math.min(1, (now - loadStart) / 1400);
    var time = now / 1000;
    draw(time);
    placeSparks(time);
  }

  NS.hero = {
    state: state,
    trigger: null,
    init: function (opts) {
      stage = document.getElementById('heroStage');
      canvas = document.getElementById('heroCanvas');
      shell = document.getElementById('teaserShell');
      if (!stage || !canvas || !canvas.getContext) return;
      ctx = canvas.getContext('2d');
      motion = !!(opts && opts.motion);
      sparks = Array.prototype.slice.call(document.querySelectorAll('#teaserCard .spark'));
      layout();

      if (!motion) {
        /* Reduced motion or no GSAP: the final composition, drawn once. */
        state.p = 1; loadT = 1;
        draw(0); placeSparks(0);
        var t0;
        window.addEventListener('resize', function () { clearTimeout(t0); t0 = setTimeout(function () { layout(); draw(0); }, 150); });
        return;
      }

      var gsap = window.gsap;
      var q = function (k) { return stage.querySelectorAll('[data-hx="' + k + '"]'); };
      var orbs = stage.querySelectorAll('.orb');
      Array.prototype.forEach.call(orbs, function (o) { o.setAttribute('pathLength', '100'); o.style.strokeDasharray = '100'; o.style.strokeDashoffset = '100'; });

      var tl = gsap.timeline({ defaults: { ease: 'none' } });
      /* Phones: the title is readable from the first frame (no blur, full opacity). */
      if (!phone) tl.fromTo(q('title'), { opacity: 0.38, filter: 'blur(2px)', letterSpacing: '0.09em' }, { opacity: 1, filter: 'blur(0px)', letterSpacing: '0.045em', duration: 0.45, ease: 'power2.out' }, 0);
      tl.to(state, { p: 1, duration: 1 }, 0)
        .fromTo(q('eyebrow'), { opacity: phone ? 1 : 0.35, y: phone ? 0 : 6 }, { opacity: 1, y: 0, duration: 0.4 }, 0)
        .fromTo(q('sub'), { opacity: phone ? 1 : 0.3 }, { opacity: 1, duration: 0.4 }, 0.08)
        .fromTo(q('video'), phone ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0.3, scale: 0.86, filter: 'blur(4px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out' }, 0.35)
        .to(orbs, { strokeDashoffset: 0, duration: 0.5, stagger: 0.08 }, 0.4)
        .fromTo(q('cta'), { opacity: phone ? 1 : 0.25, y: phone ? 0 : 24 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.4)
        .fromTo(q('side')[0], { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.35 }, 0.5)
        .fromTo(q('side')[1], { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.35 }, 0.55)
        .to(stage.querySelector('.scroll-cue'), { opacity: 0, duration: 0.15 }, 0)
        .set({}, {}, 1.05);

      this.trigger = window.ScrollTrigger.create({
        trigger: stage, start: 'top top',
        end: function () { return '+=' + Math.round(window.innerHeight * (phone ? 1.0 : 1.1)); },
        pin: true, scrub: 0.6, animation: tl, anticipatePin: 1
      });

      /* Desktop: if the visitor has not scrolled after 1.5 s, open the veil on its own.
         Scrolling before that still drives it. */
      var self = this;
      if (!phone) setTimeout(function () {
        var t = self.trigger;
        if (!t || t.progress > 0.02 || (window.scrollY || window.pageYOffset) > 2) return;
        t.kill(true, true); self.trigger = null;
        gsap.to(tl, { progress: 1, duration: 2.2, ease: 'power1.inOut' });
        window.ScrollTrigger.refresh();
      }, 1500);

      gsap.fromTo(stage.querySelector('.hero-inner'), { opacity: 0 }, { opacity: 1, duration: 1.1, ease: 'power2.out', delay: 0.15 });
      loadStart = performance.now();

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(stage);
      }
      gsap.ticker.add(frame);

      var t1, lastW = window.innerWidth;
      window.addEventListener('resize', function () {
        clearTimeout(t1);
        t1 = setTimeout(function () {
          /* phones fire resize on URL-bar show/hide: only relayout on width change or big height change */
          if (window.innerWidth === lastW && Math.abs(stage.clientHeight - H) < 120) return;
          lastW = window.innerWidth; layout();
        }, 150);
      });
      window.addEventListener('load', function () { layout(); });
    },
    relayout: function () { if (stage) layout(); }
  };
})();
