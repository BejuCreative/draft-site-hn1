/* 11-28 JUDY item 17: the journal flips page by page when it scrolls into view,
   rests on each art page, then shows the $497 pop-up (+ booklet downsell). */
(function () {
  'use strict';
  var fb = document.getElementById('flipbook');
  if (!fb) return;
  var sheets = [].slice.call(fb.querySelectorAll('.fb-sheet')).reverse(); // cover first
  var pop = fb.querySelector('.fb-pop');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timer = null, started = false;
  sheets.forEach(function (s, i) { s.style.zIndex = sheets.length - i; });

  function play() {
    var i = 0;
    pop.hidden = true;
    sheets.forEach(function (s) { s.classList.remove('is-turned'); });
    (function next() {
      // turn every sheet except the last one, then show the pop-up over the last page
      if (i >= sheets.length - 1) { pop.hidden = false; return; }
      sheets[i++].classList.add('is-turned');
      timer = setTimeout(next, i === 1 ? 1500 : 2600);
    })();
  }

  fb.querySelector('.fb-replay').addEventListener('click', function () { clearTimeout(timer); play(); });
  if (reduce || !('IntersectionObserver' in window)) { pop.hidden = false; return; }
  new IntersectionObserver(function (es, io) {
    if (!started && es[0].isIntersecting) { started = true; io.disconnect(); timer = setTimeout(play, 700); }
  }, { threshold: 0.45 }).observe(fb);
})();
