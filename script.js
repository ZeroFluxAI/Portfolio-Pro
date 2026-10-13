(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Theme switch: remembers the visitor's choice when browser storage is available.
  const themeButton = $('.theme-btn');
  const themeIcon = $('#themeIcon');
  const themeText = $('#themeText');

  let storedTheme = null;
  try { storedTheme = localStorage.getItem('portfolio-theme'); } catch (_) {}
  if (storedTheme === 'light') body.classList.add('light-mode');

  function syncThemeButton() {
    const light = body.classList.contains('light-mode');
    if (themeIcon) themeIcon.className = light ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    if (themeText) themeText.textContent = light ? 'Light Mode' : 'Dark Mode';
    if (themeButton) themeButton.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
  }

  window.toggleTheme = function toggleTheme() {
    body.classList.toggle('light-mode');
    try { localStorage.setItem('portfolio-theme', body.classList.contains('light-mode') ? 'light' : 'dark'); } catch (_) {}
    syncThemeButton();
  };
  syncThemeButton();

  // Accessible mobile navigation.
  const menuToggle = $('#mobileMenuToggle');
  const mobileMenu = $('#mobileMenu');
  function closeMobileMenu() {
    if (!menuToggle || !mobileMenu) return;
    mobileMenu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
    mobileMenu.setAttribute('aria-hidden', 'true');
    const icon = $('i', menuToggle);
    if (icon) icon.className = 'fa-solid fa-bars';
  }
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const open = !mobileMenu.classList.contains('open');
      if (open) {
        mobileMenu.classList.add('open');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.setAttribute('aria-label', 'Close navigation menu');
        mobileMenu.setAttribute('aria-hidden', 'false');
        const icon = $('i', menuToggle);
        if (icon) icon.className = 'fa-solid fa-xmark';
      } else closeMobileMenu();
    });
    $$('a', mobileMenu).forEach(link => link.addEventListener('click', closeMobileMenu));
    document.addEventListener('click', event => {
      if (!mobileMenu.contains(event.target) && !menuToggle.contains(event.target)) closeMobileMenu();
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMobileMenu(); });
  }

  // Scroll progress and section-aware navigation.
  const progress = $('#scrollProgress');
  let scrollQueued = false;
  function updateScrollProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScrollProgress);
    }
  }, { passive: true });
  updateScrollProgress();

  const sections = $$('main section[id]');
  const navLinks = $$('.nav-links a');
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(section => navObserver.observe(section));
  }

  // Reveal content only when motion is allowed; content remains visible without JS.
  if (!reducedMotion && 'IntersectionObserver' in window) {
    body.classList.add('reveal-ready');
    const revealTargets = [];
    $$('main section > div').forEach(element => {
      if (!element.classList.contains('animate-fade-in')) {
        element.classList.add('reveal');
        revealTargets.push(element);
      }
    });
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    revealTargets.forEach(element => revealObserver.observe(element));
  }

  // Subtle pointer glow, disabled for touch devices and reduced-motion preferences.
  const glow = $('.cursor-glow');
  if (glow && !reducedMotion && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', event => {
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
    }, { passive: true });
  }

  // Search across all course titles and providers without deleting or rewriting any entries.
  const courseSearch = $('#courseSearch');
  const clearCourseSearch = $('#clearCourseSearch');
  const courseResultCount = $('#courseResultCount');
  const courseCards = $$('#courses .grid > .card-bg');
  const courseDomains = $$('#courses .max-w-6xl > .space-y-20 > .space-y-6');
  const courseTotal = courseCards.length;
  let noCoursesMessage = $('#noCoursesMessage');

  if (courseSearch && courseResultCount && courseCards.length) {
    if (!noCoursesMessage) {
      noCoursesMessage = document.createElement('p');
      noCoursesMessage.id = 'noCoursesMessage';
      noCoursesMessage.className = 'hidden text-center text-subtext py-10';
      noCoursesMessage.textContent = 'No courses match that search. Try another title, provider, or topic.';
      courseSearch.closest('#courses').appendChild(noCoursesMessage);
    }

    function filterCourses() {
      const query = courseSearch.value.trim().toLocaleLowerCase();
      let visible = 0;
      courseCards.forEach(card => {
        const match = !query || card.textContent.toLocaleLowerCase().includes(query);
        card.classList.toggle('course-card-hidden', !match);
        if (match) visible += 1;
      });
      courseDomains.forEach(domain => {
        const hasVisible = $$('.grid > .card-bg', domain).some(card => !card.classList.contains('course-card-hidden'));
        domain.classList.toggle('course-domain-empty', !hasVisible);
      });
      courseResultCount.textContent = query
        ? `Showing ${visible} of ${courseTotal} courses`
        : `Showing all ${courseTotal} courses`;
      noCoursesMessage.classList.toggle('hidden', visible !== 0);
      if (clearCourseSearch) clearCourseSearch.disabled = !courseSearch.value;
    }
    courseSearch.addEventListener('input', filterCourses);
    courseSearch.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        courseSearch.value = '';
        filterCourses();
        courseSearch.blur();
      }
    });
    if (clearCourseSearch) {
      clearCourseSearch.addEventListener('click', () => {
        courseSearch.value = '';
        filterCourses();
        courseSearch.focus();
      });
    }
    filterCourses();
  }

  // Credential preview modal; this is a display preview, not independent credential verification.
  const modal = $('#certModal');
  let previousFocus = null;
  window.openCertModal = function openCertModal(title, issuer, date) {
    if (!modal) return;
    previousFocus = document.activeElement;
    const titleNode = $('#modalTitle', modal);
    const metaNode = $('#modalMeta', modal);
    if (titleNode) titleNode.textContent = title || 'Credential preview';
    if (metaNode) metaNode.textContent = [issuer, date].filter(Boolean).join(' • ');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    body.classList.add('modal-open');
    const closeButton = $('button[onclick="closeCertModal()"]', modal);
    if (closeButton) closeButton.focus();
  };
  window.closeCertModal = function closeCertModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    body.classList.remove('modal-open');
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  };
  if (modal) {
    modal.addEventListener('click', event => { if (event.target === modal) window.closeCertModal(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !modal.classList.contains('hidden')) window.closeCertModal();
      if (event.key === 'Tab' && !modal.classList.contains('hidden')) {
        const focusable = $$('button, a[href], input, [tabindex]:not([tabindex="-1"])', modal)
          .filter(element => !element.disabled && element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }

  // Interactive terminal. It is a safe portfolio simulation and never executes shell commands.
  const terminal = $('#terminalBody');
  const terminalInput = $('#terminalInput');
  if (terminal && terminalInput) {
    const commandHistory = [];
    let historyIndex = 0;
    const commands = {
      help: 'Commands: help, about, skills, specializations, courses, contact, date, clear',
      about: 'Mushahid Ali Kazmi — focused on cybersecurity, network defense, and full-stack software development.',
      skills: 'Cybersecurity • Incident response • Digital forensics • Network security • FortiGate • Full-stack .NET • Project management',
      specializations: 'Scroll to the Specializations section to explore all 12 specialization cards.',
      courses: 'Scroll to the Courses Archive. Use its search box to filter all 63 course entries by title or provider.',
      contact: 'Email: mushahid.ssaak7610@gmail.com | Phone: +92 340 8825529 | Location: Garhi Dupatta, Muzaffarabad, AJK, Pakistan',
      date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
      github: 'This portfolio is configured for GitHub Pages. Publish your updated files from the repository root.',
      clear: ''
    };
    const helpText = 'Type help to list commands. Use ↑ and ↓ to browse command history.';
    const outputLine = (text, className = '') => {
      const line = document.createElement('div');
      if (className) line.className = className;
      line.textContent = text;
      terminal.appendChild(line);
      terminal.scrollTop = terminal.scrollHeight;
    };

    terminalInput.addEventListener('keydown', event => {
      if (event.key === 'ArrowUp') {
        if (!commandHistory.length) return;
        event.preventDefault();
        historyIndex = Math.max(0, historyIndex - 1);
        terminalInput.value = commandHistory[historyIndex] || '';
        return;
      }
      if (event.key === 'ArrowDown') {
        if (!commandHistory.length) return;
        event.preventDefault();
        historyIndex = Math.min(commandHistory.length, historyIndex + 1);
        terminalInput.value = commandHistory[historyIndex] || '';
        return;
      }
      if (event.key === 'Tab') {
        const typed = terminalInput.value.trim().toLowerCase();
        const match = Object.keys(commands).find(command => command.startsWith(typed));
        if (typed && match) { event.preventDefault(); terminalInput.value = match; }
        return;
      }
      if (event.key !== 'Enter') return;
      const raw = terminalInput.value.trim();
      if (!raw) return;
      commandHistory.push(raw);
      historyIndex = commandHistory.length;
      outputLine(`➜ ~ ${raw}`, 'text-emerald-300');
      terminalInput.value = '';
      const command = raw.toLowerCase().split(/\s+/)[0];
      if (command === 'clear') { terminal.replaceChildren(); outputLine(helpText, 'text-slate-400'); return; }
      if (Object.prototype.hasOwnProperty.call(commands, command)) outputLine(commands[command], 'text-slate-200');
      else outputLine(`Command not found: ${command}. Type "help" to see available commands.`, 'text-rose-300');
    });
  }
})();
