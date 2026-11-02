/* Ethyra Services page: hero timeline, scroll reveal, hover videos.
   Loads after landing-page.js, magnetic-button.js, GSAP and dropping-cards.js.
   Everything is guarded, so a missing element or missing GSAP never throws.
   Videos live in assets/videos/. Any missing file is silently skipped. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);

/* === SVC HERO SCROLL EFFECT START === */
  /**
   * Scroll-Scrubbed Shrinking Hero with Floating Methodology Cards
   * - 220vh track, sticky 100vh stage
   * - Central hero panel shrinks 1 -> ~0.84 with growing rounded corners
   * - Looping background video with parallax counter-translation
   * - 3 glass methodology cards peek in and glide smoothly to position
   * - Header hides on scroll down and reveals on scroll up
   * - Throttled rAF lerp, passive scroll listener, will-change only during scrub
   * - Mobile (<= 768px) and prefers-reduced-motion fallbacks
   */
  function initScrollShrinkHero() {
    if (window.svcScrollHeroActive) return;
    var hero = document.getElementById('svc-hero');
    if (!hero) return;

    var track = document.getElementById('svcShTrack') || hero.querySelector('.svc-sh-track');
    var stage = document.getElementById('svcShStage') || hero.querySelector('.svc-sh-stage');
    var panel = document.getElementById('svcShPanel') || hero.querySelector('.svc-sh-panel');
    var mediaWrap = document.getElementById('svcShMediaWrap') || hero.querySelector('.svc-sh-media-wrap');
    var video = document.getElementById('svcShVideo') || hero.querySelector('.svc-sh-video');
    var content = document.getElementById('svcShContent') || hero.querySelector('.svc-sh-content');
    var cardLeft = document.getElementById('svcShCardLeft') || hero.querySelector('.svc-sh-card--left');
    var cardRight = document.getElementById('svcShCardRight') || hero.querySelector('.svc-sh-card--right');
    var cardBottom = document.getElementById('svcShCardBottom') || hero.querySelector('.svc-sh-card--bottom');
    var scrollHint = document.getElementById('svcShScrollHint') || hero.querySelector('.svc-sh-scroll-hint');

    // Video playback management (safe skip on saveData or reduced motion)
    if (video) {
      if (reduce || saveData) {
        video.pause();
        video.style.display = 'none';
      } else {
        var playPromise = video.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(function () {
            // Autoplay blocked: fallback blueprint backdrop remains active
          });
        }
      }
    }

    // Header hide / show logic on scroll direction
    var lastScrollY = window.scrollY || window.pageYOffset || 0;
    function updateHeaderOnScroll(currentY) {
      var delta = currentY - lastScrollY;
      if (currentY > 120 && delta > 6) {
        document.body.classList.add('svc-header-hidden');
      } else if (delta < -6 || currentY <= 80) {
        document.body.classList.remove('svc-header-hidden');
      }
      lastScrollY = currentY;
    }

    // Reset styles for mobile or reduced-motion
    function resetStaticLayout() {
      if (panel) { panel.style.transform = ''; panel.style.borderRadius = '28px'; }
      if (mediaWrap) { mediaWrap.style.transform = 'none'; }
      if (content) { content.style.transform = ''; }
      if (cardLeft) { cardLeft.style.transform = ''; cardLeft.style.opacity = ''; cardLeft.style.pointerEvents = ''; }
      if (cardRight) { cardRight.style.transform = ''; cardRight.style.opacity = ''; cardRight.style.pointerEvents = ''; }
      if (cardBottom) { cardBottom.style.transform = ''; cardBottom.style.opacity = ''; cardBottom.style.pointerEvents = ''; }
      if (scrollHint) { scrollHint.style.opacity = ''; }
    }

    // If reduced-motion or below mobile breakpoint, keep static layout
    var isMobile = window.innerWidth <= 768;
    if (reduce || isMobile) {
      resetStaticLayout();
      window.addEventListener('scroll', function () {
        updateHeaderOnScroll(window.scrollY || window.pageYOffset || 0);
      }, { passive: true });
      return;
    }

    // Scrub state variables
    var targetP = 0;
    var currentP = 0;
    var isTicking = false;
    var willChangeActive = false;

    function setWillChange(active) {
      if (willChangeActive === active) return;
      willChangeActive = active;
      var val = active ? 'transform, border-radius' : '';
      if (panel) panel.style.willChange = val;
      // mediaWrap stays locked in frame
      if (cardLeft) cardLeft.style.willChange = active ? 'transform, opacity' : '';
      if (cardRight) cardRight.style.willChange = active ? 'transform, opacity' : '';
      if (cardBottom) cardBottom.style.willChange = active ? 'transform, opacity' : '';
    }

    function calculateTargetProgress() {
      if (!track) return 0;
      var trackRect = track.getBoundingClientRect();
      var trackTop = trackRect.top + window.scrollY;
      var trackH = track.offsetHeight;
      var winH = window.innerHeight;
      var maxScroll = trackH - winH;
      if (maxScroll <= 0) return 0;
      var rawP = (window.scrollY - trackTop) / maxScroll;
      return Math.max(0, Math.min(1, rawP));
    }

    function renderProgress(p) {
      // 1. Central Hero Panel: full screen at progress 0, curves like a pro to 32px as it shrinks to ~0.84
      var pPanel = Math.min(1, p / 0.6);
      var scale = 1 - (0.16 * pPanel);
      var radius = Math.round(32 * pPanel);

      if (panel) {
        panel.style.transform = 'scale(' + scale.toFixed(4) + ')';
        panel.style.borderRadius = radius + 'px';
      }

      // 2. Media stays perfectly locked in frame (no shifting or scaling out of bounds)
      if (mediaWrap) {
        mediaWrap.style.transform = 'none';
      }

      // Headline counter-translate slightly so it feels stable
      if (content) {
        var contentY = -16 * pPanel;
        content.style.transform = 'translate3d(0, ' + contentY.toFixed(1) + 'px, 0)';
      }

      // 3. Left Card: Flies in from off-screen and lands directly OVER the left border
      if (cardLeft) {
        var pLeft = Math.max(0, Math.min(1, (p - 0.05) / 0.45));
        var leftTx = -120 * (1 - pLeft);
        var leftOp = Math.max(0, Math.min(1, pLeft * 1.6));
        cardLeft.style.transform = 'translate3d(' + leftTx.toFixed(2) + '%, -50%, 0)';
        cardLeft.style.opacity = leftOp.toFixed(3);
        cardLeft.style.pointerEvents = pLeft > 0.35 ? 'auto' : 'none';
      }

      // 4. Right Card: Flies in from off-screen and lands directly OVER the right border
      if (cardRight) {
        var pRight = Math.max(0, Math.min(1, (p - 0.08) / 0.45));
        var rightTx = 120 * (1 - pRight);
        var rightOp = Math.max(0, Math.min(1, pRight * 1.6));
        cardRight.style.transform = 'translate3d(' + rightTx.toFixed(2) + '%, -50%, 0)';
        cardRight.style.opacity = rightOp.toFixed(3);
        cardRight.style.pointerEvents = pRight > 0.35 ? 'auto' : 'none';
      }

      // 5. Bottom Card: Flies up from below screen and lands directly OVER the bottom border
      if (cardBottom) {
        var pBottom = Math.max(0, Math.min(1, (p - 0.15) / 0.45));
        var bottomTy = 130 * (1 - pBottom);
        var bottomOp = Math.max(0, Math.min(1, pBottom * 1.6));
        cardBottom.style.transform = 'translate3d(-50%, ' + bottomTy.toFixed(2) + '%, 0)';
        cardBottom.style.opacity = bottomOp.toFixed(3);
        cardBottom.style.pointerEvents = pBottom > 0.35 ? 'auto' : 'none';
      }

      // 6. Scroll Hint: fades out quickly on scroll
      if (scrollHint) {
        var hintOp = Math.max(0, 1 - p * 8);
        scrollHint.style.opacity = hintOp.toFixed(2);
      }
    }

    function tick() {
      var diff = targetP - currentP;
      if (Math.abs(diff) < 0.0006) {
        currentP = targetP;
        renderProgress(currentP);
        setWillChange(false);
        isTicking = false;
        return;
      }

      // Smooth lerp (0.16 smoothing factor)
      currentP += diff * 0.16;
      renderProgress(currentP);
      requestAnimationFrame(tick);
    }

    function onScroll() {
      var curY = window.scrollY || window.pageYOffset || 0;
      updateHeaderOnScroll(curY);

      targetP = calculateTargetProgress();
      if (!isTicking) {
        isTicking = true;
        setWillChange(true);
        requestAnimationFrame(tick);
      }
    }

    // Set initial position immediately without animation
    targetP = calculateTargetProgress();
    currentP = targetP;
    renderProgress(currentP);

    window.addEventListener('scroll', onScroll, { passive: true });

    // Handle responsive resize dynamically
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var mobileNow = window.innerWidth <= 768;
        if (mobileNow || reduce) {
          resetStaticLayout();
        } else {
          targetP = calculateTargetProgress();
          currentP = targetP;
          renderProgress(currentP);
        }
      }, 150);
    }, { passive: true });
  }

  /* Alias to maintain internal call compatibility */
  function initHero() {
    initScrollShrinkHero();
  }
  /* === SVC HERO SCROLL EFFECT END === */

  /* ----------------------------------------------------------------------
     2. Scroll reveal: IntersectionObserver adds .is-revealed once
     ---------------------------------------------------------------------- */
  function initReveal() {
    var targets = document.querySelectorAll('.svc-reveal');
    if (!targets.length) return;

    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------------------
     3. Hover videos on flip-card backs and media panels
     ---------------------------------------------------------------------- */
  function makeVideo(file) {
    var v = document.createElement('video');
    v.className = 'svc-video';
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'none';
    v.setAttribute('aria-hidden', 'true');
    var s = document.createElement('source');
    s.src = 'assets/videos/' + file;
    s.type = 'video/mp4';
    v.appendChild(s);
    s.addEventListener('error', function () { v.remove(); });
    v.addEventListener('loadeddata', function () { v.classList.add('is-ready'); });
    return v;
  }

  function initVideos() {
    if (reduce || saveData) return;

    document.querySelectorAll('[data-svc-video]').forEach(function (trigger) {
      var file = trigger.getAttribute('data-svc-video');
      if (!file) return;

      // Flip cards show the video on the back face; media panels host it directly
      var host = trigger.querySelector('.flip-card-back') || trigger;
      var v = makeVideo(file);
      host.insertBefore(v, host.firstChild);

      function start() {
        if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      }
      function stop() { v.pause(); }

      trigger.addEventListener('mouseenter', start);
      trigger.addEventListener('mouseleave', stop);
      trigger.addEventListener('focusin', start);
      trigger.addEventListener('focusout', stop);
      trigger.addEventListener('touchstart', start, { passive: true });
    });
  }

  function init() {
    initHero();
    initReveal();
    initVideos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
