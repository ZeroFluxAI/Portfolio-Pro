(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const body = document.body;
  const themeButton = $('.theme-btn');
  const themeIcon = $('#themeIcon');
  const themeText = $('#themeText');
  const storedTheme = (() => { try { return localStorage.getItem('portfolio-theme'); } catch { return null; } })();
  if (storedTheme === 'light') body.classList.add('light-mode');
  function syncThemeButton() {
    const light = body.classList.contains('light-mode');
    if (themeIcon) themeIcon.className = light ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    if (themeText) themeText.textContent = light ? 'Light Mode' : 'Dark Mode';
    if (themeButton) themeButton.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
  }
  window.toggleTheme = function () {
    body.classList.toggle('light-mode');
    try { localStorage.setItem('portfolio-theme', body.classList.contains('light-mode') ? 'light' : 'dark'); } catch {}
    syncThemeButton();
  };
  syncThemeButton();

  const modal = $('#certModal');
  window.openCertModal = function (title, issuer, date) {
    if (!modal) return;
    $('#modalTitle').textContent = title || 'Credential preview';
    $('#modalMeta').textContent = [issuer, date].filter(Boolean).join(' • ');
    modal.classList.remove('hidden'); modal.classList.add('flex'); body.classList.add('modal-open');
    const close = $('button[onclick="closeCertModal()"]', modal); if (close) close.focus();
  };
  window.closeCertModal = function () { if (!modal) return; modal.classList.add('hidden'); modal.classList.remove('flex'); body.classList.remove('modal-open'); };
  if (modal) {
    modal.addEventListener('click', e => { if (e.target === modal) window.closeCertModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeCertModal(); });
  }

  const menuToggle = $('#mobileMenuToggle'), mobileMenu = $('#mobileMenu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open)); mobileMenu.setAttribute('aria-hidden', String(!open));
      const icon = $('i', menuToggle); if (icon) icon.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    });
    $$('a', mobileMenu).forEach(a => a.addEventListener('click', () => { mobileMenu.classList.remove('open'); menuToggle.setAttribute('aria-expanded','false'); mobileMenu.setAttribute('aria-hidden','true'); const icon=$('i',menuToggle); if(icon)icon.className='fa-solid fa-bars'; }));
    document.addEventListener('click', e => { if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) { mobileMenu.classList.remove('open'); menuToggle.setAttribute('aria-expanded','false'); mobileMenu.setAttribute('aria-hidden','true'); } });
  }

  // Scroll reveal, section-aware navigation, and progress indicator.
  body.classList.add('reveal-ready');
  const sections = $$('section');
  sections.forEach(section => {
    const content = [...section.children].filter(el => !el.classList.contains('site-grid'));
    content.forEach(el => { if (!el.classList.contains('animate-fade-in')) el.classList.add('reveal'); });
  });
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => observer.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('is-visible'));
  const progress = $('#scrollProgress');
  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? window.scrollY / max * 100 : 0}%`;
  };
  window.addEventListener('scroll', updateScroll, { passive: true }); updateScroll();
  const navLinks = $$('.nav-links a');
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`)); } }), { rootMargin: '-35% 0px -55% 0px' });
    sections.filter(s => s.id).forEach(s => navObserver.observe(s));
  }
  const glow = $('.cursor-glow');
  if (glow && matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('pointermove', e => { glow.style.left = `${e.clientX}px`; glow.style.top = `${e.clientY}px`; }, { passive: true });
  }

  // Lightweight interactive terminal; text output is inserted safely as text.
  const terminal = $('#terminalBody'), input = $('#terminalInput');
  const commands = {
    help: 'Available commands: help, about, skills, specializations, courses, contact, date, clear',
    about: 'Mushahid Ali Kazmi — cybersecurity, network defense, and full-stack development learner.',
    skills: 'Cybersecurity • Incident response • Digital forensics • Network security • FortiGate • Full-stack .NET • Project management',
    specializations: 'Explore the Specializations section above for the full credential list and preview cards.',
    courses: 'Browse the Courses Archive section for courses grouped by cybersecurity, software/web, IT infrastructure/networking, and project management.',
    contact: 'Email: mushahid.ssaak7610@gmail.com | Phone: +92 340 8825529 | Location: AJK, Pakistan',
    date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
    clear: ''
  };
  function terminalLine(text, className = '') { const line = document.createElement('div'); if (className) line.className = className; line.textContent = text; terminal.appendChild(line); terminal.scrollTop = terminal.scrollHeight; }
  if (terminal && input) {
    input.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const raw = input.value.trim(); if (!raw) return;
      terminalLine(`➜ ~ ${raw}`, 'text-emerald-300'); input.value = '';
      const command = raw.toLowerCase().split(/\s+/)[0];
      if (command === 'clear') { terminal.replaceChildren(); return; }
      terminalLine(Object.prototype.hasOwnProperty.call(commands, command) ? commands[command] : `Command not found: ${command}. Type "help" to see available commands.`, Object.prototype.hasOwnProperty.call(commands, command) ? 'text-slate-200' : 'text-rose-300');
    });
  }
})();
