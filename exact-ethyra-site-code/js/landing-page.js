/**
 * Ethyra Landing Page - Interactive Video Engine, Typewriter & UI Interactions
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Looping Typewriter Engine for the Headline
  const typewriterEl = document.getElementById('typewriterText');
  
  if (typewriterEl) {
    const lines = [
      "Good intentions",
      "are a start.",
      "The real question is,",
      "what changed?"
    ];

    let currentLineIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let completedLines = [];

    function renderText() {
      let html = completedLines.map(line => line).join('<br>');
      if (completedLines.length > 0 && currentLineIndex < lines.length) {
        html += '<br>';
      }
      
      if (currentLineIndex < lines.length) {
        const currentText = lines[currentLineIndex].substring(0, currentCharIndex);
        if (currentLineIndex === 3) {
          html += `<span class="accent-highlight">${currentText}</span>`;
        } else {
          html += currentText;
        }
      }
      
      typewriterEl.innerHTML = html;
    }

    function typeStep() {
      if (!isDeleting) {
        // Typing forward character by character
        if (currentCharIndex < lines[currentLineIndex].length) {
          currentCharIndex++;
          renderText();
          setTimeout(typeStep, 50 + Math.random() * 20);
        } else {
          // Finished current line
          if (currentLineIndex === 3) {
            completedLines.push(`<span class="accent-highlight">${lines[currentLineIndex]}</span>`);
          } else {
            completedLines.push(lines[currentLineIndex]);
          }
          currentLineIndex++;
          currentCharIndex = 0;

          if (currentLineIndex < lines.length) {
            setTimeout(typeStep, 200); // Natural pause between lines
          } else {
            // Finished all 4 lines! Hold completed text for 4.5 seconds
            setTimeout(() => {
              isDeleting = true;
              typeStep();
            }, 4500);
          }
        }
      } else {
        // Smooth reset & repeat
        typewriterEl.style.transition = 'opacity 0.4s ease';
        typewriterEl.style.opacity = '0';
        setTimeout(() => {
          completedLines = [];
          currentLineIndex = 0;
          currentCharIndex = 0;
          isDeleting = false;
          renderText();
          typewriterEl.style.opacity = '1';
          setTimeout(typeStep, 350);
        }, 400);
      }
    }

    // Initialize typing
    renderText();
    setTimeout(typeStep, 350);
  }

  // 2. Pure HD Video Auto-Play & Background Liveness
  const heroVideo = document.getElementById('heroLoupeVideo') || document.getElementById('heroPureVideo');
  if (heroVideo) {
    heroVideo.play().catch(() => {});

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && heroVideo.paused) {
        heroVideo.play().catch(() => {});
      }
    });
  }

  // 3. Smooth scroll for navigation anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId.length > 1) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // 4. Animated Number Counters for Trust Metrics
  const counterElements = document.querySelectorAll('.animate-num');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const targetNum = parseInt(el.getAttribute('data-target'), 10);
          if (!isNaN(targetNum)) {
            animateValue(el, 0, targetNum, 1800);
          }
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    counterElements.forEach(el => observer.observe(el));
  }

  function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeProgress * (end - start) + start);
      obj.innerHTML = current.toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.innerHTML = end.toLocaleString();
      }
    };
    window.requestAnimationFrame(step);
  }

  // 5. Interactive 3D Flip Service Cards (Click & Touch Toggle)
  const flipCards = document.querySelectorAll('.flip-card, .service-flip-card');
  flipCards.forEach(card => {
    // Click on flip button or card toggles flipped state
    card.addEventListener('click', (e) => {
      // If user clicked an external link, let browser navigate
      if (e.target.closest('a')) return;
      
      card.classList.toggle('is-flipped');
    });

    // Handle button clicks specifically
    const flipBtns = card.querySelectorAll('.btn-flip-trigger');
    flipBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.toggle('is-flipped');
      });
    });
  });

  // 6. Section 02: Our Perspective — Scroll-Triggered Text & Cards Animation
  const perspectiveSection = document.getElementById('perspective');
  if (perspectiveSection && 'IntersectionObserver' in window) {
    const pObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          perspectiveSection.classList.add('is-visible');

          // GSAP timeline enhancement if GSAP is loaded
          if (typeof gsap !== 'undefined') {
            const tl = gsap.timeline();

            // Headline lines stagger
            const headlineLines = perspectiveSection.querySelectorAll('.headline-part');
            if (headlineLines.length) {
              tl.fromTo(headlineLines, 
                { y: 32, opacity: 0, rotateX: 8 },
                { y: 0, opacity: 1, rotateX: 0, duration: 0.8, ease: 'power3.out', stagger: 0.14 },
                0
              );
            }

            // Draw SVG underline
            const underlinePath = perspectiveSection.querySelector('.headline-underline path');
            if (underlinePath) {
              tl.fromTo(underlinePath,
                { strokeDashoffset: 290 },
                { strokeDashoffset: 0, duration: 0.85, ease: 'power2.out' },
                0.35
              );
            }

            // Bridge banner
            const bridgeBanner = perspectiveSection.querySelector('.perspective-bridge-banner');
            if (bridgeBanner) {
              tl.fromTo(bridgeBanner,
                { y: 24, opacity: 0, scale: 0.96 },
                { y: 0, opacity: 1, scale: 1, duration: 0.65, ease: 'back.out(1.4)' },
                0.3
              );
            }

            // Stagger perspective cards
            const pCards = perspectiveSection.querySelectorAll('.perspective-card');
            if (pCards.length) {
              tl.fromTo(pCards,
                { y: 35, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out', stagger: 0.16 },
                0.22
              );
            }
          }

          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    pObserver.observe(perspectiveSection);
  }
});

