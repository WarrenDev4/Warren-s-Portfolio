/* =============================================================
   main.js — shared behaviour for every page
   Linked from index, about, experience, projects, contact.
   ============================================================= */

/* ---- Change these two values in ONE place ---- */
const WEB3FORMS_KEY = '6b2ebc12-1704-427c-9472-8cf6ddf4ebd9';
const CONTACT_EMAIL = 'warrenspencer41@gmail.com';


/* ===== Mobile menu ===== */
(function () {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('menuOverlay');
  if (!hamburger || !mobileMenu || !overlay) return;

  function setMenu(open) {
    hamburger.classList.toggle('open', open);
    mobileMenu.classList.toggle('open', open);
    overlay.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
  }

  hamburger.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
  overlay.addEventListener('click', () => setMenu(false));

  window.__closeMobileMenu = () => setMenu(false);
})();


/* ===== Theme toggle ===== */
(function () {
  const btn = document.getElementById('themeBtn');
  const icon = document.getElementById('themeIcon');
  const root = document.documentElement;
  if (!btn || !icon) return;

  function paint(theme, animate) {
    const dark = theme === 'dark';
    if (animate) {
      btn.classList.remove('swapping');
      void btn.offsetWidth;            // forces the animation to restart
      btn.classList.add('swapping');
    }
    icon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    btn.setAttribute('aria-pressed', String(dark));
  }

  paint(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (next === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    try { localStorage.setItem('theme', next); } catch (e) {}
    paint(next, true);
  });
})();


/* ===== Let's Talk modal =====
   The markup is built here and appended to <body>, so no page
   needs to carry a copy of it. */
(function () {
  const openBtn = document.getElementById('talkBtn');
  const mobileLink = document.querySelector('.talk-link-mobile');
  if (!openBtn && !mobileLink) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="talkModal" role="dialog" aria-modal="true"
         aria-labelledby="talkTitle" aria-hidden="true">
      <div class="modal">
        <button class="modal-close" id="modalClose" type="button" aria-label="Close">&times;</button>
        <h2 id="talkTitle">Let's Talk</h2>
        <p class="modal-sub">Send me a message and I'll get back to you soon.</p>

        <form class="modal-form" id="talkForm">
          <input type="hidden" name="access_key" value="${WEB3FORMS_KEY}">
          <input type="hidden" name="subject" value="New message from your portfolio">
          <input type="checkbox" name="botcheck" class="hp-field" tabindex="-1" autocomplete="off">

          <label for="talkName">Name</label>
          <input type="text" id="talkName" name="name" required autocomplete="name">

          <label for="talkEmail">Email</label>
          <input type="email" id="talkEmail" name="email" required autocomplete="email">

          <label for="talkMessage">Message</label>
          <textarea id="talkMessage" name="message" rows="5" required></textarea>

          <button type="submit" class="modal-submit" id="modalSubmit">Send message</button>
          <p class="form-status" id="formStatus" role="status" aria-live="polite"></p>
        </form>
      </div>
    </div>
  `);

  const modal = document.getElementById('talkModal');
  const closeBtn = document.getElementById('modalClose');
  const form = document.getElementById('talkForm');
  const submitBtn = document.getElementById('modalSubmit');
  const status = document.getElementById('formStatus');
  let lastFocused = null;

  function openModal(e) {
    if (e) e.preventDefault();
    if (window.__closeMobileMenu) window.__closeMobileMenu();

    lastFocused = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => document.getElementById('talkName').focus(), 350);
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    status.textContent = '';
    status.className = 'form-status';
    if (lastFocused) lastFocused.focus();
  }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (mobileLink) mobileLink.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // Keep keyboard focus inside the dialog while it's open
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = modal.querySelectorAll('button, input:not([type="hidden"]):not(.hp-field), textarea');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (WEB3FORMS_KEY === 'YOUR_ACCESS_KEY_HERE') {
      status.textContent = 'Setup needed: add your Web3Forms access key in main.js.';
      status.classList.add('error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    status.textContent = '';
    status.className = 'form-status';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message || 'Send failed');

      status.textContent = 'Message sent. Thanks for reaching out!';
      status.classList.add('success');
      form.reset();
      setTimeout(closeModal, 2200);
    } catch (err) {
      status.innerHTML = 'The message didn\'t send. Try again, or email me at ' +
        '<a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a>.';
      status.classList.add('error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
    }
  });
})();