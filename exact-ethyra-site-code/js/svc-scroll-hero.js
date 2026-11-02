/**
 * ETHYRA CONSULTING SERVICES: SCROLL-SCRUBBED SHRINKING HERO
 * Reusable Component Script. Prefix: `svc-`.
 * - No ScrollTrigger, no layout thrashing, 60fps passive rAF lerp.
 * - Auto-disables on <= 768px or prefers-reduced-motion.
 */
(function() {
  'use strict';

  function initScrollHero() {
    var track = document.getElementById('svcShTrack');
    var stage = document.getElementById('svcShStage');
    var panel = document.getElementById('svcShPanel');
    var video = document.getElementById('svcShVideo');
    var content = document.getElementById('svcShContent');
    var cardLeft = document.getElementById('svcShCardLeft');
    var cardRight = document.getElementById('svcShCardRight');
    var cardBottom = document.getElementById('svcShCardBottom');
    var scrollHint = document.getElementById('svcShScrollHint');

    if (!track || !stage || !panel) return;
    window.svcScrollHeroActive = true;

    // Accessibility check: reduced motion
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    // Mobile check: <= 768px
    function isMobile() {
      return window.innerWidth <= 768;
    }

    if (isMobile()) return;

    var targetProgress = 0;
    var currentProgress = 0;
    var isTicking = false;
    var lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
    var headerEl = document.querySelector('.site-header');

    function clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    }

    function lerp(start, end, factor) {
      return start + (end - start) * factor;
    }

    function mapRange(val, inMin, inMax, outMin, outMax) {
      var clamped = clamp(val, inMin, inMax);
      return outMin + ((clamped - inMin) / (inMax - inMin)) * (outMax - outMin);
    }

    function calculateProgress() {
      var rect = track.getBoundingClientRect();
      var trackTop = window.pageYOffset + rect.top;
      var trackHeight = track.offsetHeight;
      var viewportHeight = window.innerHeight;
      var maxScroll = trackHeight - viewportHeight;

      if (maxScroll <= 0) return 0;
      var currentScroll = (window.pageYOffset || document.documentElement.scrollTop) - trackTop;
      return clamp(currentScroll / maxScroll, 0, 1);
    }

    // Apply choreography based on progress [0..1]
    function renderFrame(p) {
      // 1. Panel: scale 1 -> 0.84, border-radius 0 -> 32px over p: 0 -> 0.60
      var panelScale = mapRange(p, 0, 0.60, 1.0, 0.84);
      var panelRadius = mapRange(p, 0, 0.60, 0, 32);
      panel.style.transform = 'scale(' + panelScale.toFixed(4) + ')';
      panel.style.borderRadius = panelRadius.toFixed(1) + 'px';

      // 2. Media inside panel: parallax y 0 -> -6%, scale 1.12 -> 0.95 over p: 0 -> 0.75
      if (video) {
        var videoScale = mapRange(p, 0, 0.75, 1.12, 0.95);
        var videoY = mapRange(p, 0, 0.75, 0, -6);
        video.style.transform = 'scale(' + videoScale.toFixed(4) + ') translateY(' + videoY.toFixed(2) + '%)';
      }

      // 3. Headline block: counter-translate y 0 -> -24px over p: 0 -> 0.60 to maintain generous clearance for CTAs
      if (content) {
        var contentY = mapRange(p, 0, 0.60, 0, -24);
        content.style.transform = 'translateY(' + contentY.toFixed(2) + 'px)';
      }

      // 4. Left Card (01): translateX -60% -> 0% over p: 0.05 -> 0.50
      if (cardLeft) {
        var leftX = mapRange(p, 0.05, 0.50, -60, 0);
        var leftOp = mapRange(p, 0.05, 0.40, 0.35, 1.0);
        cardLeft.style.transform = 'translateY(-50%) translateX(' + leftX.toFixed(2) + '%)';
        cardLeft.style.opacity = leftOp.toFixed(3);
      }

      // 5. Right Card (02): translateX +60% -> 0% over p: 0.08 -> 0.53
      if (cardRight) {
        var rightX = mapRange(p, 0.08, 0.53, 60, 0);
        var rightOp = mapRange(p, 0.08, 0.43, 0.35, 1.0);
        cardRight.style.transform = 'translateY(-50%) translateX(' + rightX.toFixed(2) + '%)';
        cardRight.style.opacity = rightOp.toFixed(3);
      }

      // 6. Bottom Card (03): translateY 70% -> 0% over p: 0.15 -> 0.60
      if (cardBottom) {
        var bottomY = mapRange(p, 0.15, 0.60, 70, 0);
        var bottomOp = mapRange(p, 0.15, 0.50, 0.35, 1.0);
        cardBottom.style.transform = 'translateX(-50%) translateY(' + bottomY.toFixed(2) + '%)';
        cardBottom.style.opacity = bottomOp.toFixed(3);
      }

      // 7. Scroll Hint fade out
      if (scrollHint) {
        var hintOp = mapRange(p, 0, 0.12, 1.0, 0);
        scrollHint.style.opacity = hintOp.toFixed(3);
        scrollHint.style.pointerEvents = hintOp <= 0.05 ? 'none' : 'auto';
      }
    }

    function update() {
      // Lerp progress for smooth scrubbing
      currentProgress = lerp(currentProgress, targetProgress, 0.12);

      // Snap if close
      if (Math.abs(targetProgress - currentProgress) < 0.0005) {
        currentProgress = targetProgress;
      }

      renderFrame(currentProgress);

      if (Math.abs(targetProgress - currentProgress) >= 0.0005) {
        requestAnimationFrame(update);
      } else {
        isTicking = false;
      }
    }

    function onScroll() {
      if (isMobile()) return;
      if (urlParams && urlParams.has('p')) return;

      var currentY = window.pageYOffset || document.documentElement.scrollTop;
      targetProgress = calculateProgress();

      // Header auto-hide logic
      if (headerEl) {
        if (currentY > 120 && currentY > lastScrollY && targetProgress > 0.05 && targetProgress < 0.85) {
          document.body.classList.add('svc-header-hidden');
        } else if (currentY < lastScrollY || currentY <= 60) {
          document.body.classList.remove('svc-header-hidden');
        }
      }
      lastScrollY = currentY;

      if (!isTicking) {
        isTicking = true;
        requestAnimationFrame(update);
      }
    }

    // Initial render & URL preview support
    var urlParams = typeof URLSearchParams !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (urlParams && urlParams.has('p')) {
      targetProgress = parseFloat(urlParams.get('p'));
    } else {
      targetProgress = calculateProgress();
    }
    currentProgress = targetProgress;
    renderFrame(currentProgress);

    if (urlParams && urlParams.has('scroll')) {
      var targetScroll = parseFloat(urlParams.get('scroll'));
      window.scrollTo(0, targetScroll);
      setTimeout(function() { window.scrollTo(0, targetScroll); }, 50);
      setTimeout(function() { window.scrollTo(0, targetScroll); }, 300);
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    window.addEventListener('resize', function() {
      if (isMobile()) {
        // Reset inline transforms if switched to mobile
        panel.style.transform = '';
        panel.style.borderRadius = '';
        if (video) video.style.transform = '';
        if (content) content.style.transform = '';
        if (cardLeft) { cardLeft.style.transform = ''; cardLeft.style.opacity = ''; }
        if (cardRight) { cardRight.style.transform = ''; cardRight.style.opacity = ''; }
        if (cardBottom) { cardBottom.style.transform = ''; cardBottom.style.opacity = ''; }
      } else {
        targetProgress = calculateProgress();
        currentProgress = targetProgress;
        renderFrame(currentProgress);
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollHero);
  } else {
    initScrollHero();
  }
})();
