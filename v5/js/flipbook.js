/* 11-28 JUDY item 17: an open journal that keeps turning pages forever (loops).
   One leaf turns over the spine; under it the next spread is already in place. */
(function () {
  'use strict';
  var fb = document.getElementById('flipbook');
  if (!fb) return;
  var pages = fb.getAttribute('data-pages').split(',').map(function (n) { return 'img/flip/p' + n + '.webp'; });
  var n = pages.length;
  var L = fb.querySelector('.fb-left img'), R = fb.querySelector('.fb-right img');
  var leaf = fb.querySelector('.fb-leaf');
  var F = leaf.querySelector('.fb-front img'), B = leaf.querySelector('.fb-back img');
  var k = 0, running = false;
  function pg(i) { return pages[((i % n) + n) % n]; }
  pages.forEach(function (src) { new Image().src = src; }); // preload so turns never flash
  L.src = pg(0); R.src = pg(1);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // static spread; the offer is always on top

  function turn() {
    F.src = pg(k + 1); B.src = pg(k + 2); R.src = pg(k + 3);
    leaf.classList.add('is-on', 'is-turning');
  }
  leaf.addEventListener('animationend', function (e) {
    if (e.target !== leaf) return;
    k += 2; L.src = pg(k);
    leaf.classList.remove('is-on', 'is-turning');
    if (running) setTimeout(function () { if (running) turn(); }, 1900); // rest on each spread
  });
  // only turn while on screen (saves battery), resume when back
  new IntersectionObserver(function (es) {
    var on = es[0].isIntersecting;
    if (on && !running) { running = true; if (!leaf.classList.contains('is-turning')) setTimeout(turn, 600); }
    else if (!on) running = false;
  }, { threshold: 0.25 }).observe(fb);
})();
