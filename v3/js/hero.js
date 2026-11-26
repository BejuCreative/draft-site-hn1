/* Hero: the woman from the book cover draws back a veil of silk.
   heroCanvas (2D): the silk, shaded fold by fold.
   heroWoman (WebGL): the woman cut from the cover art (img/hero-woman.webp), with a slow idle
   motion (breath, head and hair sway, shawl drift) done by warping the image in a shader.
   Scroll drives the reveal (pinned). Load draws the strands in. */
(function () {
  'use strict';
  var NS = window.HNW = window.HNW || {};

  var stage, canvas, ctx, shell, W = 0, H = 0, dpr = 1, phone = false;
  var hand = { x: 0, y: 0 }, s = 0.8;
  var strands = [], N = 70, folds = [], silk = null, sctx = null;
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
      hand.x = W * 0.62; hand.y = H * 0.93; s = 0.42;
    } else {
      var r = offsetIn(shell, stage);
      hand.x = r.x - 10; hand.y = r.y + r.h * 0.95;
      s = Math.min(0.95, (r.x + 40) / 520);
      if (hand.y > H * 0.9) hand.y = H * 0.9;
    }
    N = phone ? 50 : 90;
    buildStrands();
    silk = silk || document.createElement('canvas');
    silk.width = canvas.width; silk.height = canvas.height; sctx = silk.getContext('2d');
    Woman.place();
  }

  function buildStrands() {
    strands = []; folds = [];
    var ph = 0, v = 0;
    for (var f = 0; f < N; f++) { v = v * 0.82 + (rnd(f, 4) - 0.5) * 0.55; ph += v; folds.push(ph + 1.4 * Math.sin(f * 0.19)); }
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
    /* the outline of the whole cloth (used for the wine glow) */
    var A = strands[0].P, B = strands[strands.length - 1].P;
    var cloth = new Path2D();
    cloth.moveTo(A[0], A[1]);
    cloth.bezierCurveTo(A[2], A[3], A[4], A[5], A[6], A[7]);
    cloth.bezierCurveTo(A[8], A[9], A[10], A[11], A[12], A[13]);
    cloth.lineTo(B[12], B[13]);
    cloth.bezierCurveTo(B[10], B[11], B[8], B[9], B[6], B[7]);
    cloth.bezierCurveTo(B[4], B[5], B[2], B[3], B[0], B[1]);
    cloth.closePath();
    /* silk: one band between each pair of strands. Each band is lit by how its fold faces the light
       (a cosine of the fold angle). The folds roll slowly, so light and shadow travel across the cloth. */
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.clearRect(0, 0, W, H);
    sctx.lineJoin = 'round';
    for (var j = 0; j < strands.length - 1; j++) {
      var P = strands[j].P, Q = strands[j + 1].P;
      var th = folds[j] + 0.6 * Math.sin(time * 0.8 + j * 0.35);
      var band = new Path2D();
      band.moveTo(P[0], P[1]);
      band.bezierCurveTo(P[2], P[3], P[4], P[5], P[6], P[7]);
      band.bezierCurveTo(P[8], P[9], P[10], P[11], P[12], P[13]);
      band.lineTo(Q[12], Q[13]);
      band.bezierCurveTo(Q[10], Q[11], Q[8], Q[9], Q[6], Q[7]);
      band.bezierCurveTo(Q[4], Q[5], Q[2], Q[3], Q[0], Q[1]);
      band.closePath();
      var g = sctx.createLinearGradient(P[0], P[1], P[12], P[13]);
      g.addColorStop(0, silkCol(th + 0.7 * Math.sin(time * 0.5 + j * 0.13)));
      g.addColorStop(0.5, silkCol(th));
      g.addColorStop(1, silkCol(th - 0.8 * Math.sin(time * 0.45 + j * 0.17 + 1)));
      sctx.fillStyle = g; sctx.strokeStyle = g; sctx.lineWidth = 1;
      sctx.fill(band); sctx.stroke(band);
    }
    /* cream silk while it hangs; as she gathers it, the fold in her hand turns to the wine velvet of the booklet cover */
    var ca = lerp(0.9, 0.42, avgT) * lt;
    ctx.globalAlpha = ca; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(silk, 0, 0); ctx.globalAlpha = 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

    /* fold edges: a soft shadow line and a sheen line, so each fold reads as raised silk */
    var len = 3 * H;
    if (lt < 1) { ctx.setLineDash([len * lt + 0.1, len]); }
    ctx.lineCap = 'round';
    ctx.save(); ctx.translate(0.8, 1.2); ctx.strokeStyle = 'rgba(120,80,75,.16)'; ctx.lineWidth = phone ? 1.4 : 1.8; ctx.stroke(path); ctx.restore();
    var sheen = new Path2D();
    for (var k = 0; k < strands.length; k++) {
      var b2 = 0.5 + 0.5 * Math.cos(folds[Math.min(k, folds.length - 1)] + 0.6 * Math.sin(time * 0.8 + k * 0.35));
      if (b2 > 0.72) addStrand(sheen, strands[k].P);
    }
    ctx.strokeStyle = 'rgba(255,253,250,.75)'; ctx.lineWidth = 1.1; ctx.stroke(sheen);
    ctx.strokeStyle = 'rgba(' + Math.round(lerp(222, 208, avgT)) + ',' + Math.round(lerp(198, 160, avgT)) + ',' + Math.round(lerp(190, 112, avgT)) + ',.35)'; ctx.lineWidth = 0.8; ctx.stroke(path);
    ctx.setLineDash([]);
  }

  /* silk colour from the fold angle: light (252,244,240) to shadow (214,186,182) */
  function silkCol(th) {
    var b = 0.5 + 0.5 * Math.cos(th);
    b = b * b * (3 - 2 * b);
    return 'rgb(' + Math.round(lerp(214, 252, b)) + ',' + Math.round(lerp(186, 244, b)) + ',' + Math.round(lerp(182, 240, b)) + ')';
  }

  /* ---------- The woman: cover-art cutout, warped in a WebGL shader for idle motion ---------- */
  var Woman = (function () {
    /* The cutout covers this box of the cover art (cover pixels). Her fist sits at (543,149) inside it. */
    var BX = 40, BY = 766, BW = 560, BH = 340, HX = 543, HY = 149;
    var cv = null, gl = null, g2 = null, img = null, uT, uP, uA, shown = 0, r = { x: 0, y: 0, w: 0, h: 0 }, wd = 1;
    var VS = 'attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
    var FS = [
      'precision mediump float;varying vec2 v;uniform sampler2D tx;uniform float t,pe,al;',
      'void main(){',
      ' vec2 o=vec2(' + BX + '.,' + BY + '.),b=vec2(' + BW + '.,' + BH + '.),c=o+v*b,d=vec2(0.);',
      /* head and neck: a slow sway about the base of the neck */
      ' float wh=(1.-smoothstep(895.,935.,c.y))*(1.-smoothstep(452.,478.,c.x));',
      ' float a=.013*sin(t*.9)*(1.+pe*.6)*wh;vec2 r=c-vec2(408.,905.);',
      ' d+=r-vec2(r.x*cos(a)+r.y*sin(a),-r.x*sin(a)+r.y*cos(a));',
      /* hair: drifts more toward its tips on the left */
      ' float wl=smoothstep(430.,120.,c.x)*(1.-smoothstep(930.,1010.,c.y));',
      ' d+=wl*vec2(sin(t*1.1+c.y*.035)*3.2,sin(t*.9+c.x*.025)*2.4)*(1.+pe*.8);',
      /* breath: the chest and shoulders swell a little */
      ' vec2 q=c-vec2(400.,985.);d+=q*.016*sin(t*1.45)*exp(-dot(q,q)/9800.);',
      /* shawl: a slow drift low and to the left */
      ' float ws=smoothstep(400.,220.,c.x)*smoothstep(925.,1000.,c.y);',
      ' d+=ws*vec2(sin(t*.8+c.x*.015+c.y*.01)*3.,cos(t*.7+c.x*.02)*2.);',
      /* her fist stays locked on the silk */
      ' vec2 h=c-vec2(578.,918.);d*=1.-exp(-dot(h,h)/2900.);',
      ' vec2 u=(c-d-o)/b;',
      ' float in1=step(0.,u.x)*step(u.x,1.)*step(0.,u.y)*step(u.y,1.);',
      ' gl_FragColor=texture2D(tx,u)*al*in1;}'
    ].join('\n');

    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }

    function setupGL() {
      try { gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }); } catch (e) { gl = null; }
      if (!gl) return false;
      var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
      if (!vs || !fs) { gl = null; return false; }
      var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { gl = null; return false; }
      gl.useProgram(pr);
      var bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      var tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      uT = gl.getUniformLocation(pr, 't'); uP = gl.getUniformLocation(pr, 'pe'); uA = gl.getUniformLocation(pr, 'al');
      gl.clearColor(0, 0, 0, 0);
      return true;
    }

    function place() {
      cv = cv || document.getElementById('heroWoman');
      if (!cv) return;
      /* desktop: scaled with the cloth; phone: wide enough to read her face */
      var fs = phone ? Math.min(0.8, W / BW * 1.0) : Math.max(0.6, s * 1.25);
      r.w = BW * fs; r.h = BH * fs; r.x = hand.x - HX * fs; r.y = hand.y - HY * fs;
      wd = Math.min(2, window.devicePixelRatio || 1);
      cv.style.left = r.x.toFixed(1) + 'px'; cv.style.top = r.y.toFixed(1) + 'px';
      cv.style.width = r.w.toFixed(1) + 'px'; cv.style.height = r.h.toFixed(1) + 'px';
      cv.width = Math.round(r.w * wd); cv.height = Math.round(r.h * wd);
      if (gl) gl.viewport(0, 0, cv.width, cv.height);
      if (!motion) render(0);
    }

    function render(time) {
      if (!img || !cv) return;
      var al = motion ? smooth(clamp((performance.now() - shown) / 1100)) : 1;
      var pe = 1 - Math.pow(1 - clamp(state.p), 2.2);
      if (gl) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(uT, motion ? time : 0); gl.uniform1f(uP, pe); gl.uniform1f(uA, al);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      } else if (g2) {
        /* no WebGL: the still image */
        g2.setTransform(1, 0, 0, 1, 0, 0); g2.clearRect(0, 0, cv.width, cv.height);
        g2.globalAlpha = al; g2.drawImage(img, 0, 0, cv.width, cv.height); g2.globalAlpha = 1;
      }
    }

    /* Load after first paint so the photo never delays the page. */
    function load() {
      cv = cv || document.getElementById('heroWoman');
      if (!cv) return;
      img = new Image();
      img.decoding = 'async';
      img.onload = function () {
        if (!setupGL()) g2 = cv.getContext('2d');
        shown = performance.now();
        place(); render(0);
      };
      img.src = cv.getAttribute('data-src');
    }

    return { place: place, render: render, load: load, mode: function () { return gl ? 'webgl' : g2 ? '2d' : 'none'; } };
  })();

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
    Woman.render(time);
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
      if (document.readyState === 'complete') setTimeout(Woman.load, 0);
      else window.addEventListener('load', function () { setTimeout(Woman.load, 0); });

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
    relayout: function () { if (stage) layout(); },
    womanMode: function () { return Woman.mode(); }
  };
})();
