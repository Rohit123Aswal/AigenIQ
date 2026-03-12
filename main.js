(function () {
  'use strict';

  var doc = document;

  function qs(sel, ctx)  { return (ctx || doc).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }


  /* ══════════════════════════════════════
     01. DYNAMIC COPYRIGHT YEAR
  ══════════════════════════════════════ */
  var yearEl = qs('#copyright-year');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }


  /* ══════════════════════════════════════
     02. SCROLL-REVEAL
  ══════════════════════════════════════ */
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    qsa('[data-reveal]').forEach(function (el) {
      if (!el.classList.contains('in')) revealObserver.observe(el);
    });
  } else {
    qsa('[data-reveal]').forEach(function (el) { el.classList.add('in'); });
  }


  /* ══════════════════════════════════════
     03. NAV SCROLL SHADOW
  ══════════════════════════════════════ */
  var nav = qs('#nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }


  /* ══════════════════════════════════════
     04. HERO CAROUSEL
     Slides messages in from the left.
     The right column (stats card) is never
     affected because hero-grid uses
     align-items: start and the h1 wrapper
     has a fixed min-height.
  ══════════════════════════════════════ */
  var prefersReducedMotion = (
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  var heroMessages = qsa('.hero-msg');

  if (!prefersReducedMotion && heroMessages.length > 1) {
    var heroIdx = 0;

    setInterval(function () {
      var current = heroMessages[heroIdx];
      heroIdx = (heroIdx + 1) % heroMessages.length;
      var next = heroMessages[heroIdx];

      /* Remove active from current — CSS hides it (display: none) */
      current.classList.remove('active');

      /* Add active to next — CSS slide-in-left animation plays */
      next.classList.add('active');
    }, 5200);
  }


  /* ══════════════════════════════════════
     05. FLIP CARDS (Audience + HWW)
  ══════════════════════════════════════ */
  var FLIP_SELECTORS = ['.aud-card', '.hww-card'];

  FLIP_SELECTORS.forEach(function (sel) {
    qsa(sel).forEach(function (card) {
      card.addEventListener('click', function () {
        var section = card.closest('section');
        var isOpen  = card.classList.contains('open');

        qsa(sel + '.open', section).forEach(function (sibling) {
          sibling.classList.remove('open');
        });
        if (!isOpen) card.classList.add('open');
      });

      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
        if (e.key === 'Escape') card.classList.remove('open');
      });
    });
  });

  doc.addEventListener('click', function (e) {
    var insideCard = e.target.closest('.aud-card') || e.target.closest('.hww-card');
    if (!insideCard) {
      qsa('.aud-card.open, .hww-card.open').forEach(function (c) {
        c.classList.remove('open');
      });
    }
  });


  /* ══════════════════════════════════════
     06. MOBILE NAV DRAWER
  ══════════════════════════════════════ */
  var mobNav     = qs('#mobile-nav');
  var mobOverlay = qs('#mob-overlay');
  var hamBtn     = qs('#nav-ham');
  var mobClose   = qs('#mob-close');
  var prevFocus  = null;

  function getMobFocusable() {
    return qsa('a[href], button:not([disabled])', mobNav).filter(function (el) {
      return el.offsetParent !== null;
    });
  }

  function openMobNav() {
    if (!mobNav) return;
    prevFocus = doc.activeElement;
    mobNav.setAttribute('aria-hidden', 'false');
    if (mobOverlay) { mobOverlay.classList.add('active'); mobOverlay.setAttribute('aria-hidden', 'false'); }
    doc.body.style.overflow = 'hidden';
    if (hamBtn) hamBtn.setAttribute('aria-expanded', 'true');
    var focusable = getMobFocusable();
    if (focusable.length) focusable[0].focus();
  }

  function closeMobNav() {
    if (!mobNav) return;
    mobNav.setAttribute('aria-hidden', 'true');
    if (mobOverlay) { mobOverlay.classList.remove('active'); mobOverlay.setAttribute('aria-hidden', 'true'); }
    doc.body.style.overflow = '';
    if (hamBtn) hamBtn.setAttribute('aria-expanded', 'false');
    if (prevFocus) prevFocus.focus();
  }

  if (mobNav) {
    mobNav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focusable = getMobFocusable();
      if (!focusable.length) return;
      var first = focusable[0];
      var last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (doc.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (doc.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });
  }

  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobNav && mobNav.getAttribute('aria-hidden') === 'false') {
      closeMobNav();
    }
  });

  if (hamBtn)     hamBtn.addEventListener('click', openMobNav);
  if (mobClose)   mobClose.addEventListener('click', closeMobNav);
  if (mobOverlay) mobOverlay.addEventListener('click', closeMobNav);

  window.closeMobNav = closeMobNav;

  qsa('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href   = anchor.getAttribute('href');
      if (href === '#') return;
      var target = qs(href);
      if (!target) return;
      e.preventDefault();
      var isNavOpen = mobNav && mobNav.getAttribute('aria-hidden') === 'false';
      var delay = isNavOpen ? 380 : 0;
      if (isNavOpen) closeMobNav();
      setTimeout(function () {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (!target.getAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }, delay);
    });
  });


  /* ══════════════════════════════════════
     07. COUNTER ANIMATION
  ══════════════════════════════════════ */
  function animateCounter(el, target, suffix, duration) {
    var start = null;
    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseInt(el.getAttribute('data-target'), 10);
          var suffix = el.getAttribute('data-suffix') || '';
          animateCounter(el, target, suffix, 1800);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    qsa('.sc-num, .proof-num').forEach(function (el) {
      var val = parseInt(el.textContent, 10);
      if (!isNaN(val)) {
        el.setAttribute('data-target', val);
        el.setAttribute('data-suffix', '');
        el.textContent = '0';
        counterObserver.observe(el);
      }
    });

    qsa('[data-animate-text]').forEach(function (el) {
      var steps = el.getAttribute('data-steps').split(',').map(Number);
      var unit  = el.getAttribute('data-unit');
      var final = el.getAttribute('data-final');
      var textObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          textObserver.unobserve(el);
          var i = 0;
          el.textContent = '~' + steps[0] + unit;
          var timer = setInterval(function () {
            i++;
            if (i < steps.length - 1) {
              el.textContent = '~' + steps[i] + unit + ' → ' + steps[steps.length - 1] + unit;
            } else {
              el.textContent = final;
              clearInterval(timer);
            }
          }, 140);
        });
      }, { threshold: 0.3 });
      textObserver.observe(el);
    });

    qsa('[data-animate-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-animate-count'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      el.textContent = '0' + suffix;
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          countObserver.unobserve(el);
          animateCounter(el, target, suffix, 1600);
        });
      }, { threshold: 0.3 });
      countObserver.observe(el);
    });
  }


  /* ══════════════════════════════════════
     08. LOGO — RELOAD ON CLICK
  ══════════════════════════════════════ */
  var logoLinks = doc.querySelectorAll('.nav-logo, .foot-logo');
  logoLinks.forEach(function (logo) {
    logo.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.reload();
    });
  });

}());