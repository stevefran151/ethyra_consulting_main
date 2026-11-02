/**
 * ETHYRA CONSULTING SERVICES — BOY PUSH CURTAIN INTRO ENGINE
 * Character push curtain reveal powered by GSAP.
 * Configured for a single-time 7.0s landing page reveal.
 */

(function () {
  'use strict';

  // Detect if user refreshed the landing page
  let isReload = false;
  try {
    const navEntry = (window.performance && performance.getEntriesByType) ? performance.getEntriesByType('navigation')[0] : null;
    isReload = (navEntry && navEntry.type === 'reload') ||
               (window.performance && window.performance.navigation && window.performance.navigation.type === 1);
  } catch (e) {}

  const isHashDeepLink = !!(window.location.hash && window.location.hash.length > 1);

  if (isReload && !isHashDeepLink) {
    console.log('[BoyCurtainIntro] Page refresh on landing page detected: triggering 7s transition.');
    try {
      sessionStorage.removeItem('ethyra_curtain_intro_shown');
    } catch (e) {}
    document.documentElement.classList.remove('intro-already-shown');
  }

  // Check if intro has already been displayed this session or if direct deep-link/hash navigation
  let alreadyShown = false;
  try {
    alreadyShown = sessionStorage.getItem('ethyra_curtain_intro_shown') === 'true' || isHashDeepLink;
  } catch (e) {}

  if (alreadyShown) {
    console.log('[BoyCurtainIntro] Intro suppressed: already viewed or deep-linked to section.');
    document.documentElement.classList.add('intro-already-shown');
    const overlay = document.getElementById('boyIntroOverlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.style.pointerEvents = 'none';
      overlay.remove();
    }
    document.body.style.overflow = '';
    return;
  }

  // Mark as shown immediately so any reload or internal page change won't trigger it again
  try {
    sessionStorage.setItem('ethyra_curtain_intro_shown', 'true');
  } catch (e) {}

  console.log('[BoyCurtainIntro] First landing detected. Initializing 7.0s reveal.');

  let introTimeline = null;
  let audioCtx = null;

  // Initialize Web Audio API for subtle, procedural physical friction & whoosh
  function playPushSwoosh(volume = 0.15) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const bufferSize = audioCtx.sampleRate * 0.45;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.45);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      whiteNoise.start();
    } catch (e) {
      // Audio is non-critical enhancement; fails silently if blocked
    }
  }

  function getElements() {
    return {
      overlay: document.getElementById('boyIntroOverlay'),
      curtain: document.getElementById('boyCurtain'),
      anchor: document.getElementById('boyAnchor'),
      sprite: document.getElementById('boySprite'),
      skipBtn: document.getElementById('boySkipBtn'),
      welcome: document.getElementById('curtainWelcome')
    };
  }

  function buildTimeline() {
    const { overlay, curtain, welcome } = getElements();
    if (!overlay || !curtain) {
      console.warn('[BoyCurtainIntro] Elements missing in buildTimeline', { overlay, curtain });
      return null;
    }

    if (introTimeline) {
      introTimeline.kill();
    }

    const screenW = window.innerWidth;
    const totalDist = screenW + 580; // clears curtain and boy completely past viewport

    introTimeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        console.log('[BoyCurtainIntro] 7.0s push sequence complete, fading out overlay');
        try {
          sessionStorage.setItem('ethyra_curtain_intro_shown', 'true');
        } catch (e) {}
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.35,
          ease: 'power2.out',
          onComplete: () => {
            overlay.style.display = 'none';
            overlay.style.pointerEvents = 'none';
            overlay.remove();
            document.body.style.overflow = '';
          }
        });
      }
    });

    // Precision 7-Second Physical Push Choreography (Total duration = 7.0s):
    // 0.0s - 0.3s (0.3s): Stance setup & initial anticipation
    // 0.3s - 2.2s (1.9s): Initial drive — breaks inertia, pushes into first quadrant (x: 28%)
    // 2.2s - 3.2s (1.0s): Heavy friction phase — digging in with sustained exertion (x: 38%)
    // 3.2s - 5.3s (2.1s): Grand center sweep — smoothly unveiling the 3D hero & headline (x: 78%)
    // 5.3s - 7.0s (1.7s): Mighty final surge — smoothly accelerates completely off-screen (totalDist)
    // Sum = 0.3 + 1.9 + 1.0 + 2.1 + 1.7 = 7.0 seconds.
    introTimeline
      .set(curtain, { x: 0 });

    if (welcome) {
      introTimeline.set(welcome, { opacity: 1 });
    }

    introTimeline
      .to({}, { duration: 0.3 })
      .call(() => playPushSwoosh(0.12))
      .to(curtain, {
        x: screenW * 0.28,
        duration: 1.9,
        ease: 'power1.inOut'
      });

    introTimeline
      .call(() => playPushSwoosh(0.16))
      .to(curtain, {
        x: screenW * 0.38,
        duration: 1.0,
        ease: 'sine.inOut'
      })
      .call(() => playPushSwoosh(0.20))
      .to(curtain, {
        x: screenW * 0.78,
        duration: 2.1,
        ease: 'power1.inOut'
      })
      .call(() => playPushSwoosh(0.24))
      .to(curtain, {
        x: totalDist,
        duration: 1.7,
        ease: 'power2.inOut'
      });

    return introTimeline;
  }

  function startIntro() {
    const { overlay, curtain, welcome } = getElements();
    if (!overlay || !curtain) {
      console.warn('[BoyCurtainIntro] Missing overlay or curtain in startIntro');
      return;
    }

    console.log('[BoyCurtainIntro] Starting 7-second intro sequence');

    if (introTimeline) {
      introTimeline.kill();
    }
    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf(overlay);
      gsap.killTweensOf(curtain);
      if (welcome) gsap.killTweensOf(welcome);
      gsap.set(overlay, { opacity: 1, display: 'block' });
      gsap.set(curtain, { x: 0 });
      if (welcome) gsap.set(welcome, { opacity: 1 });
    } else {
      overlay.style.display = 'block';
      overlay.style.opacity = '1';
      if (welcome) welcome.style.opacity = '1';
    }

    overlay.style.pointerEvents = 'auto';

    // Prevent background scrolling while intro is running
    document.body.style.overflow = 'hidden';

    // Wait until GSAP is ready
    if (typeof gsap === 'undefined') {
      console.log('[BoyCurtainIntro] Waiting for GSAP...');
      setTimeout(startIntro, 40);
      return;
    }

    const tl = buildTimeline();
    if (tl) {
      tl.restart();
    }
  }

  function skipIntro() {
    console.log('[BoyCurtainIntro] Skipping intro');
    try {
      sessionStorage.setItem('ethyra_curtain_intro_shown', 'true');
    } catch (e) {}

    if (introTimeline) {
      introTimeline.kill();
    }

    const { overlay, curtain } = getElements();
    if (!overlay || !curtain) return;

    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf(overlay);
      gsap.killTweensOf(curtain);
      const screenW = window.innerWidth;
      gsap.to(curtain, {
        x: screenW + 550,
        duration: 0.35,
        ease: 'power3.out'
      });
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out',
        onComplete: () => {
          overlay.style.display = 'none';
          overlay.style.pointerEvents = 'none';
          overlay.remove();
          document.body.style.overflow = '';
        }
      });
    } else {
      overlay.style.display = 'none';
      overlay.style.pointerEvents = 'none';
      overlay.remove();
      document.body.style.overflow = '';
    }
  }

  // Expose skip API on window
  window.skipBoyIntro = skipIntro;

  function initIntro() {
    console.log('[BoyCurtainIntro] Initializing DOM listeners');
    const { skipBtn } = getElements();

    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        skipIntro();
      });
    }

    // Keyboard shortcut: Escape to skip
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        skipIntro();
      }
    });

    // Auto-start intro
    startIntro();
  }

  // Bulletproof initialization regardless of script loading timing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIntro);
  } else {
    initIntro();
  }
})();
