/**
 * ETHYRA CONSULTING SERVICES — RESPONSIVE SITE HEADER & MOBILE NAVIGATION ENGINE
 * Provides smooth mobile menu toggling, active route indication, touch-friendly navigation,
 * outside-click dismissal, and keyboard accessibility without affecting desktop layout.
 */

(function () {
  'use strict';

  function initMobileHeader() {
    const headers = document.querySelectorAll('.site-header');
    if (!headers.length) return;

    headers.forEach(header => {
      const container = header.querySelector('.header-container');
      if (!container) return;

      // Ensure mobile toggle button exists
      let toggleBtn = container.querySelector('.mobile-nav-toggle');
      if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.className = 'mobile-nav-toggle';
        toggleBtn.id = 'mobileNavToggle';
        toggleBtn.type = 'button';
        toggleBtn.setAttribute('aria-label', 'Toggle navigation menu');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = `
          <span class="hamburger-bar bar-1" aria-hidden="true"></span>
          <span class="hamburger-bar bar-2" aria-hidden="true"></span>
          <span class="hamburger-bar bar-3" aria-hidden="true"></span>
        `;
        container.appendChild(toggleBtn);
      }

      // Ensure mobile navigation drawer exists
      let drawer = header.querySelector('.mobile-nav-drawer');
      if (!drawer) {
        drawer = document.createElement('div');
        drawer.className = 'mobile-nav-drawer';
        drawer.id = 'mobileNavDrawer';
        drawer.setAttribute('aria-hidden', 'true');

        // Determine current page to mark active link
        const currentPath = window.location.pathname.toLowerCase();
        const isAbout = currentPath.includes('about-us');
        const isServices = currentPath.includes('services');
        const isWebinar = currentPath.includes('webinar');
        const isContact = currentPath.includes('contact-us');
        const isHome = !isAbout && !isServices && !isWebinar && !isContact;

        drawer.innerHTML = `
          <div class="mobile-nav-inner">
            <nav class="mobile-nav-list" aria-label="Mobile Navigation">
              <a href="index.html" class="mobile-nav-item ${isHome ? 'active' : ''}">
                <span class="mobile-nav-link-left">
                  <span class="mobile-nav-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                  </span>
                  <span>Home</span>
                </span>
                <span class="mobile-nav-arrow" aria-hidden="true">→</span>
              </a>
              <a href="about-us.html" class="mobile-nav-item ${isAbout ? 'active' : ''}">
                <span class="mobile-nav-link-left">
                  <span class="mobile-nav-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </span>
                  <span>About Us</span>
                </span>
                <span class="mobile-nav-arrow" aria-hidden="true">→</span>
              </a>
              <a href="services.html" class="mobile-nav-item ${isServices ? 'active' : ''}">
                <span class="mobile-nav-link-left">
                  <span class="mobile-nav-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                  </span>
                  <span>Services</span>
                </span>
                <span class="mobile-nav-arrow" aria-hidden="true">→</span>
              </a>
              <a href="webinar.html" class="mobile-nav-item ${isWebinar ? 'active' : ''}">
                <span class="mobile-nav-link-left">
                  <span class="mobile-nav-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="3" rx="2"></rect><polyline points="8 21 12 17 16 21"></polyline></svg>
                  </span>
                  <span>Webinar</span>
                </span>
                <span class="mobile-nav-arrow" aria-hidden="true">→</span>
              </a>
              <a href="contact-us.html" class="mobile-nav-item mobile-nav-item--cta ${isContact ? 'active' : ''}">
                <span class="mobile-nav-link-left">
                  <span class="mobile-nav-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  </span>
                  <span>Get in Touch</span>
                </span>
                <span class="mobile-nav-arrow" aria-hidden="true">→</span>
              </a>
            </nav>

            <div class="mobile-nav-footer">
              <div class="mobile-auth-slot" id="mobileAuthSlot">
                <button type="button" class="mobile-auth-btn" onclick="if(window.ethyraAuth){window.ethyraAuth.openModal();}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span>Client Portal &amp; Sign In</span>
                </button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(drawer);
      }

      // Backdrop overlay
      let backdrop = document.querySelector('.mobile-nav-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'mobile-nav-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.appendChild(backdrop);
      }

      function openMenu() {
        toggleBtn.classList.add('is-open');
        toggleBtn.setAttribute('aria-expanded', 'true');
        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
        backdrop.classList.add('is-open');
        document.body.classList.add('mobile-nav-locked');
      }

      function closeMenu() {
        toggleBtn.classList.remove('is-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        backdrop.classList.remove('is-open');
        document.body.classList.remove('mobile-nav-locked');
      }

      function toggleMenu(e) {
        e.stopPropagation();
        if (drawer.classList.contains('is-open')) {
          closeMenu();
        } else {
          openMenu();
        }
      }

      toggleBtn.removeEventListener('click', toggleMenu);
      toggleBtn.addEventListener('click', toggleMenu);

      backdrop.addEventListener('click', closeMenu);

      // Close when clicking any nav item link
      drawer.querySelectorAll('.mobile-nav-item').forEach(link => {
        link.addEventListener('click', () => {
          closeMenu();
        });
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
          closeMenu();
        }
      });

      // Auto close on window resize to desktop
      window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && drawer.classList.contains('is-open')) {
          closeMenu();
        }
      });
    });
  }

  // Expose globally
  window.initEthyraMobileHeader = initMobileHeader;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileHeader);
  } else {
    initMobileHeader();
  }
})();
