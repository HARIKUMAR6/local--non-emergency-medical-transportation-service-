// Standalone Login and Registration page.
// Frontend-only validation and simulated authentication flow.

import { createValidator, isEmail, setStatus } from './modules/form-validation.js';

const REMEMBER_KEY = 'hw-remember-email';
const SESSION_KEY = 'hw-test-session';

function storage(area) {
  try {
    return window[area];
  } catch {
    return null;
  }
}

function initTabs() {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const panelLogin = document.getElementById('panel-login');
  const panelRegister = document.getElementById('panel-register');

  if (!tabLogin || !tabRegister || !panelLogin || !panelRegister) return;

  function switchTab(target) {
    const isLogin = target === 'login';

    tabLogin.setAttribute('aria-selected', String(isLogin));
    tabRegister.setAttribute('aria-selected', String(!isLogin));

    panelLogin.hidden = !isLogin;
    panelRegister.hidden = isLogin;

    if (isLogin) {
      document.getElementById('login-email')?.focus();
    } else {
      document.getElementById('register-name')?.focus();
    }
  }

  tabLogin.addEventListener('click', () => switchTab('login'));
  tabRegister.addEventListener('click', () => switchTab('register'));

  // Keyboard navigation for tablist
  tabLogin.parentElement?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const current = tabLogin.getAttribute('aria-selected') === 'true' ? 'register' : 'login';
      switchTab(current);
      (current === 'login' ? tabLogin : tabRegister).focus();
    }
  });

  return { switchTab };
}

function initPasswordToggles() {
  document.querySelectorAll('[data-password-toggle]').forEach((button) => {
    const targetId = button.getAttribute('aria-controls');
    const input = document.getElementById(targetId);
    if (!input) return;

    button.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      const label = button.querySelector('[data-toggle-label]');
      if (label) label.textContent = show ? 'Hide' : 'Show';
    });
  });
}

function initSignIn() {
  const form = document.getElementById('login-form');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('[type="submit"]');
  const local = storage('localStorage');

  const validator = createValidator(form, {
    email: (v) => (!v ? 'Enter your email address.' : !isEmail(v) ? 'Enter an email address in the format name@example.com.' : ''),
    password: (v) => (!v ? 'Enter your password.' : v.length < 6 ? 'Password must be at least 6 characters.' : ''),
  });

  const remembered = local?.getItem(REMEMBER_KEY);
  if (remembered) {
    form.elements.email.value = remembered;
    form.elements.remember.checked = true;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validator.validate()) {
      setStatus(status, 'error', 'Please correct the highlighted fields.');
      return;
    }

    const { email } = validator.values();

    if (form.elements.remember.checked) {
      local?.setItem(REMEMBER_KEY, email);
    } else {
      local?.removeItem(REMEMBER_KEY);
    }

    storage('sessionStorage')?.setItem(SESSION_KEY, '1');

    submit.disabled = true;
    setStatus(status, 'success', 'Details accepted. No real account check takes place on this website. Opening the dashboard…');
    window.setTimeout(() => window.location.assign('dashboard.html'), 800);
  });
}

function initRegistration(tabController) {
  const form = document.getElementById('register-form');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('[type="submit"]');

  const validator = createValidator(form, {
    name: (v) => (!v ? 'Enter your full name.' : v.length < 2 ? 'Please enter a valid full name.' : ''),
    email: (v) => (!v ? 'Enter your email address.' : !isEmail(v) ? 'Enter an email address in the format name@example.com.' : ''),
    password: (v) => (!v ? 'Enter a password.' : v.length < 8 ? 'Password must be at least 8 characters.' : ''),
    confirmPassword: (v, f) => (!v ? 'Please confirm your password.' : v !== f.elements.password.value ? 'Passwords do not match.' : ''),
    terms: (checked) => (!checked ? 'You must accept the terms and conditions to register.' : ''),
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validator.validate()) {
      setStatus(status, 'error', 'Please complete all required fields correctly.');
      return;
    }

    const { email } = validator.values();

    // Frontend demo response — clarify no real account created on a server
    setStatus(
      status,
      'success',
      'Registration is a frontend demonstration. No real account has been created on a server. You can now sign in to view the patient dashboard.',
    );

    // Pre-fill email in login form and switch to login tab after a short pause
    const loginEmail = document.getElementById('login-email');
    if (loginEmail) loginEmail.value = email;

    window.setTimeout(() => {
      tabController?.switchTab('login');
      const loginStatus = document.querySelector('#login-form [data-form-status]');
      if (loginStatus) {
        setStatus(loginStatus, 'info', 'Test registration details filled. Enter your password to sign in.');
      }
      document.getElementById('login-password')?.focus();
    }, 2000);
  });
}

function initForgotPassword() {
  const trigger = document.querySelector('[data-forgot-trigger]');
  const panel = document.getElementById(trigger?.getAttribute('aria-controls'));
  const form = panel?.querySelector('form');
  if (!trigger || !form) return;
  const status = form.querySelector('[data-form-status]');

  const validator = createValidator(form, {
    'reset-email': (v) => (!v ? 'Enter the email address for your account.' : !isEmail(v) ? 'Enter an email address in the format name@example.com.' : ''),
  });

  const setOpen = (open) => {
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) {
      const loginEmail = document.getElementById('login-email')?.value.trim();
      if (loginEmail && !form.elements['reset-email'].value) {
        form.elements['reset-email'].value = loginEmail;
      }
      panel.querySelector('h2')?.focus();
    } else {
      validator.reset();
      setStatus(status, 'info', '');
      trigger.focus();
    }
  };

  trigger.addEventListener('click', () => setOpen(panel.hidden));
  panel.querySelector('[data-forgot-close]')?.addEventListener('click', () => setOpen(false));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validator.validate()) {
      setStatus(status, 'error', 'Please enter a valid email address.');
      return;
    }
    setStatus(
      status,
      'info',
      'This website can’t send emails, so no reset link has been sent. If you need help signing in to a real account, please contact our team.',
    );
  });
}

const tabController = initTabs();
initPasswordToggles();
initSignIn();
initRegistration(tabController);
initForgotPassword();
