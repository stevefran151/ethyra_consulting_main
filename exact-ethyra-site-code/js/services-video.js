/* Services section: ambient video, per-card hover videos, scroll reveal.
   Videos live in assets/videos/. Any missing file is silently skipped. */
(function () {
  var section = document.getElementById('services');
  if (!section) return;

  var base = 'assets/videos/';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;

  function makeVideo(file, cls) {
    var v = document.createElement('video');
    v.className = cls;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'none';
    v.setAttribute('aria-hidden', 'true');
    var s = document.createElement('source');
    s.src = base + file;
    s.type = 'video/mp4';
    v.appendChild(s);
    s.addEventListener('error', function () { v.remove(); });
    v.addEventListener('loadeddata', function () { v.classList.add('is-ready'); });
    return v;
  }

  // Scroll reveal
  if (reduce || !('IntersectionObserver' in window)) {
    section.classList.add('is-revealed');
  } else {
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) {
        section.classList.add('is-revealed');
        obs.disconnect();
      }
    }, { threshold: 0.15 }).observe(section);
  }

  if (reduce || saveData) return;

  // Per-card videos shown on the flipped back face
  var files = { '1': 'project-design.mp4', '2': 'monitoring-evaluation.mp4', '3': 'social-impact-assessment.mp4' };
  section.querySelectorAll('.flip-card').forEach(function (card) {
    var file = files[card.getAttribute('data-service')];
    var back = card.querySelector('.flip-card-back');
    if (!file || !back) return;
    var v = makeVideo(file, 'flip-card-back-video');
    back.insertBefore(v, back.firstChild);

    function start() {
      if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
    function stop() { v.pause(); }
    card.addEventListener('mouseenter', start);
    card.addEventListener('mouseleave', stop);
    card.addEventListener('focusin', start);
    card.addEventListener('focusout', stop);
    card.addEventListener('touchstart', start, { passive: true });
  });
})();
