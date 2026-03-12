(function () {
  'use strict';

  /* ══════════════════════════════════════
     01. UTILITIES
  ══════════════════════════════════════ */

  var doc = document;

  /**
   * Safe querySelector — returns null without throwing.
   * @param {string} sel  - CSS selector
   * @param {Element} [ctx] - optional scope (defaults to document)
   * @returns {Element|null}
   */
  function qs(sel, ctx) {
    return (ctx || doc).querySelector(sel);
  }

  /**
   * querySelectorAll returning a real Array.
   * @param {string} sel
   * @param {Element} [ctx]
   * @returns {Element[]}
   */
  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
  }


  /* ══════════════════════════════════════
     02. DYNAMIC COPYRIGHT YEAR
     Updates the footer year automatically
     so you never need to touch it manually.
  ══════════════════════════════════════ */
  var yearEl = qs('#copyright-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }


  /* ══════════════════════════════════════
     03. SCROLL-REVEAL (IntersectionObserver)
     Elements with [data-reveal] animate in
     when they enter the viewport.
     Graceful fallback for old browsers.
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
      if (!el.classList.contains('in')) {
        revealObserver.observe(el);
      }
    });
  } else {
    /* Fallback: show everything immediately */
    qsa('[data-reveal]').forEach(function (el) {
      el.classList.add('in');
    });
  }


  /* ══════════════════════════════════════
     04. NAV SCROLL SHADOW
     Adds a subtle shadow to the sticky nav
     once the user scrolls past 20px.
  ══════════════════════════════════════ */
  var nav = qs('#nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }


  /* ══════════════════════════════════════
     05. HERO CAROUSEL
     Cycles through .hero-msg spans every
     5.2 seconds with a pop-in animation.
     Completely disabled when user prefers
     reduced motion (accessibility).
  ══════════════════════════════════════ */
  var prefersReducedMotion = (
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  var heroMessages = qsa('.hero-msg');

  if (!prefersReducedMotion && heroMessages.length > 1) {
    var heroIdx = 0;

    setInterval(function () {
      heroMessages[heroIdx].classList.remove('active');
      heroIdx = (heroIdx + 1) % heroMessages.length;
      heroMessages[heroIdx].classList.add('active');
    }, 5200);
  }


  /* ══════════════════════════════════════
     06. FLIP CARDS
     Applies to both .aud-card (Audience)
     and .hww-card (How We Work).

     Desktop (pointer: fine):
       Hover CSS handles the overlay reveal.

     Mobile (touch):
       Click toggles the .open class.
       Only one card per section can be open.
       Clicking outside closes all cards.
       Escape key closes the active card.
  ══════════════════════════════════════ */
  var FLIP_SELECTORS = ['.aud-card', '.hww-card'];

  FLIP_SELECTORS.forEach(function (sel) {
    qsa(sel).forEach(function (card) {

      /* Click / tap */
      card.addEventListener('click', function () {
        var section = card.closest('section');
        var isOpen  = card.classList.contains('open');

        /* Close siblings in the same section */
        qsa(sel + '.open', section).forEach(function (sibling) {
          sibling.classList.remove('open');
        });

        if (!isOpen) {
          card.classList.add('open');
        }
      });

      /* Keyboard: Enter / Space activates; Escape closes */
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
        if (e.key === 'Escape') {
          card.classList.remove('open');
        }
      });

    });
  });

  /* Close all flip cards on outside click */
  doc.addEventListener('click', function (e) {
    var insideCard = (
      e.target.closest('.aud-card') ||
      e.target.closest('.hww-card')
    );
    if (!insideCard) {
      qsa('.aud-card.open, .hww-card.open').forEach(function (c) {
        c.classList.remove('open');
      });
    }
  });


  /* ══════════════════════════════════════
     07. MOBILE NAVIGATION DRAWER
     Features:
       - ARIA attributes toggled for screen readers
       - Focus trap keeps keyboard users inside drawer
       - Escape key closes the drawer
       - Scroll-lock on <body> while open
       - Focus returns to trigger button on close
  ══════════════════════════════════════ */
  var mobNav     = qs('#mobile-nav');
  var mobOverlay = qs('#mob-overlay');
  var hamBtn     = qs('#nav-ham');
  var mobClose   = qs('#mob-close');
  var prevFocus  = null;   /* element that had focus before drawer opened */

  /**
   * Returns visible, focusable elements inside the mobile nav.
   * @returns {Element[]}
   */
  function getMobFocusable() {
    return qsa('a[href], button:not([disabled])', mobNav).filter(function (el) {
      return el.offsetParent !== null; /* skip hidden elements */
    });
  }

  /** Open the mobile nav drawer */
  function openMobNav() {
    if (!mobNav) return;
    prevFocus = doc.activeElement;

    mobNav.setAttribute('aria-hidden', 'false');
    if (mobOverlay) {
      mobOverlay.classList.add('active');
      mobOverlay.setAttribute('aria-hidden', 'false');
    }
    doc.body.style.overflow = 'hidden';
    if (hamBtn) hamBtn.setAttribute('aria-expanded', 'true');

    /* Move focus to first item inside drawer */
    var focusable = getMobFocusable();
    if (focusable.length) focusable[0].focus();
  }

  /** Close the mobile nav drawer */
  function closeMobNav() {
    if (!mobNav) return;

    mobNav.setAttribute('aria-hidden', 'true');
    if (mobOverlay) {
      mobOverlay.classList.remove('active');
      mobOverlay.setAttribute('aria-hidden', 'true');
    }
    doc.body.style.overflow = '';
    if (hamBtn) hamBtn.setAttribute('aria-expanded', 'false');

    /* Return focus to the element that opened the drawer */
    if (prevFocus) prevFocus.focus();
  }

  /* Focus trap: Tab / Shift+Tab cycles within drawer */
  if (mobNav) {
    mobNav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;

      var focusable = getMobFocusable();
      if (!focusable.length) return;

      var first = focusable[0];
      var last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (doc.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (doc.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* Escape closes drawer from anywhere on the page */
  doc.addEventListener('keydown', function (e) {
    if (
      e.key === 'Escape' &&
      mobNav &&
      mobNav.getAttribute('aria-hidden') === 'false'
    ) {
      closeMobNav();
    }
  });

  /* Wire up controls */
  if (hamBtn)     hamBtn.addEventListener('click', openMobNav);
  if (mobClose)   mobClose.addEventListener('click', closeMobNav);
  if (mobOverlay) mobOverlay.addEventListener('click', closeMobNav);

  /*
   * Expose closeMobNav globally so anchor links inside the drawer
   * (which use onclick="closeMobNav()") work without a separate handler.
   */
  window.closeMobNav = closeMobNav;


  qsa('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href   = anchor.getAttribute('href');
      if (href === '#') return;          /* bare # — do nothing */

      var target = qs(href);
      if (!target) return;

      e.preventDefault();

      var isNavOpen = (
        mobNav &&
        mobNav.getAttribute('aria-hidden') === 'false'
      );
      var delay = isNavOpen ? 380 : 0;  /* wait for drawer slide-out */

      if (isNavOpen) closeMobNav();

      setTimeout(function () {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });

        /*
         * Move focus to the section so the next Tab keypress
         * enters the section rather than jumping elsewhere.
         */
        if (!target.getAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: true });
      }, delay);
    });
  });



  /* ══════════════════════════════════════
     08. COUNTER ANIMATION
     Animates numeric elements from 0 to
     their target value on viewport entry.
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

    /* sc-num and proof-num — large headline numbers */
    qsa('.sc-num, .proof-num').forEach(function (el) {
      var val = parseInt(el.textContent, 10);
      if (!isNaN(val)) {
        el.setAttribute('data-target', val);
        el.setAttribute('data-suffix', '');
        el.textContent = '0';
        counterObserver.observe(el);
      }
    });


    /* "~40 min → 8 min" — countdown-style animation */
    qsa('[data-animate-text]').forEach(function (el) {
      var steps = el.getAttribute('data-steps').split(',').map(Number);
      var unit  = el.getAttribute('data-unit');
      var final = el.getAttribute('data-final');
      el.setAttribute('data-target', '0'); /* dummy so observer picks it up */
      el.setAttribute('data-suffix', '');

      var textObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          textObserver.unobserve(el);
          var i = 0;
          var interval = 140;
          el.textContent = '~' + steps[0] + unit;
          var timer = setInterval(function () {
            i++;
            if (i < steps.length - 1) {
              el.textContent = '~' + steps[i] + unit + ' → ' + steps[steps.length - 1] + unit;
            } else {
              el.textContent = final;
              clearInterval(timer);
            }
          }, interval);
        });
      }, { threshold: 0.3 });
      textObserver.observe(el);
    });

    /* "200+ in first month" — count up */
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

}());