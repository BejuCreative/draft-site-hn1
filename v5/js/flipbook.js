/* 11-28 JUDY item 17: an open journal that keeps turning pages forever (loops).
   One leaf turns over the spine; under it the next spread is already in place. */
(function () {
  'use strict';
  var fb = document.getElementById('flipbook');
  if (!fb) return;
  var pages = fb.getAttribute('data-pages').split(',').map(function (n) { return 'img/flip/p' + n + '.webp'; });
  var COVER = 'img/cover-hnw.webp';
  pages.unshift(COVER); // A25: real cover opens the book, sharp (no peek blur)
  var n = pages.length;
  var L = fb.querySelector('.fb-left img'), R = fb.querySelector('.fb-right img');
  var leaf = fb.querySelector('.fb-leaf');
  var F = leaf.querySelector('.fb-front img'), B = leaf.querySelector('.fb-back img');
  var k = 0, running = false;
  function pg(i) { return pages[((i % n) + n) % n]; }
  function set(img, src) { img.src = src; img.classList.toggle('is-cover', src === COVER); }
  pages.forEach(function (src) { new Image().src = src; }); // preload so turns never flash
  set(L, pg(0)); set(R, pg(1));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // static spread; the offer is always on top
  var offer = document.querySelector('.fb-offer');
  if (offer) offer.classList.add('fb-wait'); // A26: offer rises after a few spreads

  function turn() {
    set(F, pg(k + 1)); set(B, pg(k + 2)); set(R, pg(k + 3));
    leaf.classList.add('is-on', 'is-turning');
  }
  leaf.addEventListener('animationend', function (e) {
    if (e.target !== leaf) return;
    k += 2; set(L, pg(k));
    if (offer && k >= 4) offer.classList.remove('fb-wait');
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
