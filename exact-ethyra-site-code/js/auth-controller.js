/**
 * Ethyra Consulting Services - Authentication Controller
 * Manages Auth Modal, Session Listening, Sign In, Sign Up, and Sign Out.
 */

(function () {
  'use strict';

  // Inject Auth Modal HTML into DOM if not present
  function ensureAuthModal() {
    if (document.getElementById('ethyraAuthModal')) return;

    const modalHTML = `
      <div id="ethyraAuthModal" class="ethyra-auth-backdrop" onclick="window.ethyraAuth.closeModal(event)">
        <div class="ethyra-auth-card" onclick="event.stopPropagation()">
          <button type="button" class="auth-close-btn" onclick="window.ethyraAuth.closeModal()" aria-label="Close">&times;</button>
          
          <div class="auth-header">
            <img src="assets/clean_ethyra_logo.png" alt="Ethyra" class="auth-logo" onerror="this.style.display='none'">
            <h3 class="auth-title" id="authModalTitle">Member Portal</h3>
            <p class="auth-subtitle" id="authModalSubtitle">Sign in or register to access Ethyra resources</p>
          </div>

          <div id="authAlert" class="auth-alert"></div>

          <!-- Logged Out View: Tabs -->
          <div id="authTabsWrap">
            <div class="auth-tabs">
              <button type="button" class="auth-tab-btn active" id="tabSignInBtn" onclick="window.ethyraAuth.switchTab('signin')">Sign In</button>
              <button type="button" class="auth-tab-btn" id="tabSignUpBtn" onclick="window.ethyraAuth.switchTab('signup')">Create Account</button>
            </div>

            <!-- Sign In Form -->
            <form id="ethyraSignInForm" onsubmit="window.ethyraAuth.handleSignIn(event)">
              <div class="auth-form-group">
                <label class="auth-label" for="signInEmail">Work / Official Email</label>
                <input type="email" id="signInEmail" class="auth-input" placeholder="name@organisation.org" required autocomplete="email">
              </div>
              <div class="auth-form-group">
                <label class="auth-label" for="signInPassword">Password</label>
                <input type="password" id="signInPassword" class="auth-input" placeholder="••••••••" required autocomplete="current-password">
              </div>
              <button type="submit" id="signInSubmitBtn" class="auth-submit-btn">
                <span>Sign In ↗</span>
              </button>
            </form>

            <!-- Sign Up Form -->
            <form id="ethyraSignUpForm" style="display: none;" onsubmit="window.ethyraAuth.handleSignUp(event)">
              <div class="auth-form-group">
                <label class="auth-label" for="signUpFullName">Full Name</label>
                <input type="text" id="signUpFullName" class="auth-input" placeholder="Full name" required autocomplete="name">
              </div>
              <div class="auth-form-group">
                <label class="auth-label" for="signUpEmail">Work / Official Email</label>
                <input type="email" id="signUpEmail" class="auth-input" placeholder="name@organisation.org" required autocomplete="email">
              </div>
              <div class="auth-form-group">
                <label class="auth-label" for="signUpPassword">Password (minimum 6 characters)</label>
                <input type="password" id="signUpPassword" class="auth-input" placeholder="Create a password" minlength="6" required autocomplete="new-password">
              </div>
              <button type="submit" id="signUpSubmitBtn" class="auth-submit-btn">
                <span>Create Account ↗</span>
              </button>
            </form>
          </div>

          <!-- Logged In View -->
          <div id="authProfileWrap" style="display: none;" class="auth-profile-box">
            <div class="auth-profile-avatar-big" id="authProfileAvatar">U</div>
            <div class="auth-profile-email" id="authProfileEmail">user@example.com</div>
            <div class="auth-profile-meta" id="authProfileMeta">Active Member Session</div>
            <button type="button" class="auth-signout-btn" onclick="window.ethyraAuth.handleSignOut()">
              Sign Out
            </button>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // Helper: Display alert
  function showAlert(message, type = 'error') {
    const alertEl = document.getElementById('authAlert');
    if (!alertEl) return;
    alertEl.className = `auth-alert ${type === 'error' ? 'auth-alert-error' : 'auth-alert-success'}`;
    alertEl.innerText = message;
    alertEl.style.display = 'block';
  }

  function hideAlert() {
    const alertEl = document.getElementById('authAlert');
    if (alertEl) alertEl.style.display = 'none';
  }

  // Update Navbar button state (Logged In vs Logged Out)
  function updateNavUI(user) {
    const navContainers = document.querySelectorAll('.header-actions');
    navContainers.forEach(container => {
      let authBtn = container.querySelector('#navAuthTrigger');
      if (!authBtn) {
        authBtn = document.createElement('div');
        authBtn.id = 'navAuthTrigger';
        // Insert right before or after the CTA
        container.prepend(authBtn);
      }

      if (user) {
        const initials = (user.email || 'U').charAt(0).toUpperCase();
        authBtn.innerHTML = `
          <button type="button" class="auth-user-badge" onclick="window.ethyraAuth.openModal()" title="View Account (${user.email})">
            <span class="auth-avatar-circle">${initials}</span>
            <span>Account</span>
          </button>
        `;
      } else {
        authBtn.innerHTML = `
          <button type="button" class="auth-nav-btn" onclick="window.ethyraAuth.openModal()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Sign In</span>
          </button>
        `;
      }
    });
  }

  // Update Modal content depending on user state
  function syncModalUI(user) {
    const tabsWrap = document.getElementById('authTabsWrap');
    const profileWrap = document.getElementById('authProfileWrap');
    const title = document.getElementById('authModalTitle');
    const subtitle = document.getElementById('authModalSubtitle');

    if (user) {
      if (tabsWrap) tabsWrap.style.display = 'none';
      if (profileWrap) profileWrap.style.display = 'block';
      if (title) title.innerText = 'My Account';
      if (subtitle) subtitle.innerText = 'You are currently logged in to Ethyra';
      
      const emailEl = document.getElementById('authProfileEmail');
      const avatarEl = document.getElementById('authProfileAvatar');
      if (emailEl) emailEl.innerText = user.email;
      if (avatarEl) avatarEl.innerText = (user.email || 'U').charAt(0).toUpperCase();
    } else {
      if (tabsWrap) tabsWrap.style.display = 'block';
      if (profileWrap) profileWrap.style.display = 'none';
      if (title) title.innerText = 'Member Portal';
      if (subtitle) subtitle.innerText = 'Sign in or register to access Ethyra resources';
    }
  }

  // Public Controller Object
  window.ethyraAuth = {
    openModal: function () {
      ensureAuthModal();
      hideAlert();
      const modal = document.getElementById('ethyraAuthModal');
      if (modal) modal.classList.add('is-active');

      const supabase = window.getSupabase ? window.getSupabase() : null;
      if (supabase) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          syncModalUI(user);
        });
      }
    },

    closeModal: function (e) {
      if (e && e.target !== e.currentTarget && !e.target.classList.contains('auth-close-btn')) return;
      const modal = document.getElementById('ethyraAuthModal');
      if (modal) modal.classList.remove('is-active');
      hideAlert();
    },

    switchTab: function (tab) {
      hideAlert();
      const signInBtn = document.getElementById('tabSignInBtn');
      const signUpBtn = document.getElementById('tabSignUpBtn');
      const signInForm = document.getElementById('ethyraSignInForm');
      const signUpForm = document.getElementById('ethyraSignUpForm');

      if (tab === 'signup') {
        if (signInBtn) signInBtn.classList.remove('active');
        if (signUpBtn) signUpBtn.classList.add('active');
        if (signInForm) signInForm.style.display = 'none';
        if (signUpForm) signUpForm.style.display = 'block';
      } else {
        if (signUpBtn) signUpBtn.classList.remove('active');
        if (signInBtn) signInBtn.classList.add('active');
        if (signUpForm) signUpForm.style.display = 'none';
        if (signInForm) signInForm.style.display = 'block';
      }
    },

    handleSignIn: async function (e) {
      e.preventDefault();
      hideAlert();
      const supabase = window.getSupabase ? window.getSupabase() : null;
      if (!supabase) return showAlert("Supabase client is not loaded.");

      const email = document.getElementById('signInEmail').value.trim();
      const password = document.getElementById('signInPassword').value;
      const submitBtn = document.getElementById('signInSubmitBtn');

      try {
        submitBtn.disabled = true;
        submitBtn.innerText = "Signing in...";

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        showAlert("Login successful! Welcome back.", "success");
        updateNavUI(data.user);
        syncModalUI(data.user);

        setTimeout(() => {
          window.ethyraAuth.closeModal();
        }, 1200);
      } catch (err) {
        showAlert(err.message || "Failed to sign in. Please verify your credentials.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Sign In ↗";
      }
    },

    handleSignUp: async function (e) {
      e.preventDefault();
      hideAlert();
      const supabase = window.getSupabase ? window.getSupabase() : null;
      if (!supabase) return showAlert("Supabase client is not loaded.");

      const fullName = document.getElementById('signUpFullName').value.trim();
      const email = document.getElementById('signUpEmail').value.trim();
      const password = document.getElementById('signUpPassword').value;
      const submitBtn = document.getElementById('signUpSubmitBtn');

      try {
        submitBtn.disabled = true;
        submitBtn.innerText = "Creating account...";

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;

        showAlert("Account created successfully!", "success");
        updateNavUI(data.user);
        syncModalUI(data.user);

        setTimeout(() => {
          window.ethyraAuth.closeModal();
        }, 1500);
      } catch (err) {
        showAlert(err.message || "Sign up failed. Please check your details.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Create Account ↗";
      }
    },

    handleSignOut: async function () {
      const supabase = window.getSupabase ? window.getSupabase() : null;
      if (supabase) {
        await supabase.auth.signOut();
      }
      updateNavUI(null);
      syncModalUI(null);
      showAlert("You have signed out successfully.", "success");
      setTimeout(() => {
        window.ethyraAuth.closeModal();
      }, 1000);
    }
  };

  // Init on DOM Content Loaded
  document.addEventListener('DOMContentLoaded', () => {
    ensureAuthModal();

    if (window.initEthyraMobileHeader) {
      try { window.initEthyraMobileHeader(); } catch (e) {}
    }

    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (supabase) {
      // Check current session
      supabase.auth.getSession().then(({ data: { session } }) => {
        updateNavUI(session?.user || null);
      });

      // Listen for auth state changes (login, logout, token refresh)
      supabase.auth.onAuthStateChange((_event, session) => {
        updateNavUI(session?.user || null);
        syncModalUI(session?.user || null);
      });
    } else {
      updateNavUI(null);
    }
  });

  // ESC key closes modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.ethyraAuth.closeModal();
    }
  });
})();
