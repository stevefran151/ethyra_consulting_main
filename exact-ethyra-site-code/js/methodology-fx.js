/**
 * Methodology FX — "Living Deck" micro-interaction controller.
 * Additive only: it observes the existing deck (.stack__deck) and never
 * alters its markup, copy, GSAP timelines or event handlers.
 * Responsibilities:
 *   - scroll-in choreography trigger (.mfx-in)
 *   - tags the active card (.mfx-front) for per-card effects
 *   - smoothed cursor tilt / spotlight / parallax variables
 *   - shuffle shockwave + settle sweep
 *   - magnetic + ripple controls
 */
(function () {
  'use strict';

  function init() {
    var section = document.getElementById('methodology');
    var deck = section && section.querySelector('.stack__deck');
    if (!section || !deck) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cards = Array.prototype.slice.call(deck.querySelectorAll('.stack__card'));
    var dots = Array.prototype.slice.call(section.querySelectorAll('.stack__dot'));
    var wrapper = section.querySelector('.stack-wrapper') || section;
    var buttons = Array.prototype.slice.call(section.querySelectorAll('.stack__btn'));

    /* ---------- Active-card tagging (follows the existing progress dots) ---------- */
    function activeIndex() {
      for (var i = 0; i < dots.length; i++) {
        if (dots[i].classList.contains('stack__dot--active')) return i;
      }
      return 0;
    }
    function tagFront() {
      var idx = activeIndex();
      cards.forEach(function (c) {
        c.classList.toggle('mfx-front', parseInt(c.getAttribute('data-index') || '0', 10) === idx);
      });
    }
    tagFront();

    var shiftTimer = null;
    function settleSweep() {
      deck.classList.remove('mfx-shift');
      void deck.offsetWidth; // restart animation
      deck.classList.add('mfx-shift');
      clearTimeout(shiftTimer);
      shiftTimer = setTimeout(function () { deck.classList.remove('mfx-shift'); }, 1200);
    }
    if (dots.length && 'MutationObserver' in window) {
      var dotObserver = new MutationObserver(function () {
        tagFront();
        if (!reduce) settleSweep();
      });
      dots.forEach(function (d) { dotObserver.observe(d, { attributes: true, attributeFilter: ['class'] }); });
    }

    if (reduce) {
      section.classList.add('mfx-in');
      return;
    }

    /* ---------- Scroll-in choreography ---------- */
    section.classList.add('mfx-ready');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            section.classList.add('mfx-in');
            io.disconnect();
          }
        });
      }, { threshold: 0.2 });
      io.observe(section);
    } else {
      section.classList.add('mfx-in');
    }

    /* ---------- Shuffle shockwave: first style mutation after idle ---------- */
    var pulseTimer = null;
    var lastMutation = performance.now();
    function pulse() {
      deck.classList.remove('mfx-pulse');
      void deck.offsetWidth;
      deck.classList.add('mfx-pulse');
      clearTimeout(pulseTimer);
      pulseTimer = setTimeout(function () { deck.classList.remove('mfx-pulse'); }, 1000);
    }
    if ('MutationObserver' in window) {
      var cardObserver = new MutationObserver(function () {
        var now = performance.now();
        if (now - lastMutation > 1200) pulse();
        lastMutation = now;
      });
      cards.forEach(function (c) { cardObserver.observe(c, { attributes: true, attributeFilter: ['style'] }); });
    }

    /* ---------- Smoothed cursor tilt, spotlight and parallax ---------- */
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var target = { px: 0, py: 0, mx: 50, my: 50 };
    var cur = { px: 0, py: 0, mx: 50, my: 50 };
    var raf = null;
    var inView = true;

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function tick() {
      raf = null;
      var k = 0.12;
      cur.px += (target.px - cur.px) * k;
      cur.py += (target.py - cur.py) * k;
      cur.mx += (target.mx - cur.mx) * 0.2;
      cur.my += (target.my - cur.my) * 0.2;

      section.style.setProperty('--px', cur.px.toFixed(4));
      section.style.setProperty('--py', cur.py.toFixed(4));
      deck.style.setProperty('--mx', cur.mx.toFixed(2) + '%');
      deck.style.setProperty('--my', cur.my.toFixed(2) + '%');

      var settled = Math.abs(target.px - cur.px) < 0.001 && Math.abs(target.py - cur.py) < 0.001 &&
                    Math.abs(target.mx - cur.mx) < 0.05 && Math.abs(target.my - cur.my) < 0.05;
      if (!settled && inView) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && inView) raf = requestAnimationFrame(tick); }

    if (fine) {
      wrapper.addEventListener('pointermove', function (e) {
        var r = deck.getBoundingClientRect();
        var nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        target.px = clamp(nx, -1, 1);
        target.py = clamp(ny, -1, 1);
        target.mx = clamp(((e.clientX - r.left) / r.width) * 100, 0, 100);
        target.my = clamp(((e.clientY - r.top) / r.height) * 100, 0, 100);
        kick();
      });
      wrapper.addEventListener('pointerleave', function () {
        target.px = 0; target.py = 0; target.mx = 50; target.my = 50;
        kick();
      });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) kick();
      }, { threshold: 0 }).observe(section);
    }

    /* ---------- Magnetic + ripple controls ---------- */
    buttons.forEach(function (btn) {
      if (fine) {
        btn.addEventListener('pointermove', function (e) {
          var r = btn.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width / 2)) * 0.28;
          var dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
          btn.style.setProperty('--tx', dx.toFixed(1) + 'px');
          btn.style.setProperty('--ty', dy.toFixed(1) + 'px');
        });
        btn.addEventListener('pointerleave', function () {
          btn.style.setProperty('--tx', '0px');
          btn.style.setProperty('--ty', '0px');
        });
      }
      btn.addEventListener('click', function (e) {
        var r = btn.getBoundingClientRect();
        var dot = document.createElement('span');
        dot.className = 'mfx-ripple';
        dot.style.left = (e.clientX ? e.clientX - r.left : r.width / 2) + 'px';
        dot.style.top = (e.clientY ? e.clientY - r.top : r.height / 2) + 'px';
        btn.appendChild(dot);
        setTimeout(function () { if (dot.parentNode) dot.parentNode.removeChild(dot); }, 750);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
