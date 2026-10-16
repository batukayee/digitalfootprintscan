/* Digital Footprint Scan - shared site behaviour (load with defer).
   Theme toggle, navigation menus, free-check boxes, phone sticky bar, GA4 click events.
   The boxes and cards are static HTML in each page; this file only adds behaviour,
   so pages render fully without it. */
(function () {
  'use strict';
  if (window.__dfsSite) { return; }
  window.__dfsSite = true;

  var CHECK_URL = '/#scanEmail';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var root = document.documentElement;

  function ga(name, params) {
    if (typeof window.gtag === 'function') {
      try { window.gtag('event', name, params || {}); } catch (e) {}
    }
  }

  /* ---------- theme ---------- */
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('dfs-theme', t); } catch (e) {}
  }
  Array.prototype.forEach.call(document.querySelectorAll('.theme-toggle'), function (b) {
    b.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(next);
      ga('theme_toggle', { theme: next });
    });
  });
  try {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var follow = function (e) {
      var manual = null;
      try { manual = localStorage.getItem('dfs-theme'); } catch (err) {}
      if (!manual) { root.setAttribute('data-theme', e.matches ? 'dark' : 'light'); }
    };
    if (mq.addEventListener) { mq.addEventListener('change', follow); }
  } catch (e) {}

  /* ---------- navigation ---------- */
  var burger = document.querySelector('.nav-burger');
  var menu = document.getElementById('mobileMenu');
  function closeMenu() {
    if (!burger || !menu) { return; }
    menu.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.hidden;
      menu.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  var dropBtn = document.querySelector('.nav-drop-btn');
  var dropPanel = dropBtn ? document.getElementById(dropBtn.getAttribute('aria-controls')) : null;
  function closeDrop() {
    if (!dropBtn || !dropPanel) { return; }
    dropPanel.hidden = true;
    dropBtn.setAttribute('aria-expanded', 'false');
  }
  if (dropBtn && dropPanel) {
    dropBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = dropPanel.hidden;
      dropPanel.hidden = !open;
      dropBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
      if (!dropPanel.contains(e.target)) { closeDrop(); }
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeDrop(); closeMenu(); }
  });

  /* ---------- free-check boxes ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.dfs-cta form'), function (form) {
    var box = form.closest('.dfs-cta');
    var pos = box.getAttribute('data-cta') || 'box';
    var kind = box.getAttribute('data-kind') || '';
    var input = form.querySelector('input[type="email"]');
    var hp = form.querySelector('.cta-hp');
    var err = box.querySelector('.cta-err');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = (input.value || '').trim();
      if (!EMAIL_RE.test(v)) {
        err.textContent = v ? 'That does not look like a valid email address.' : 'Enter your email address to run the free check.';
        err.hidden = false;
        input.focus();
        return;
      }
      err.hidden = true;
      try { sessionStorage.setItem('dfs_prefill', JSON.stringify({ e: v, hp: hp ? hp.value : '', t: Date.now() })); } catch (e) {}
      var done = false;
      var go = function () { if (!done) { done = true; location.href = CHECK_URL; } };
      if (typeof window.gtag === 'function') {
        try {
          window.gtag('event', 'blog_hook_submit', { position: pos, cta_kind: kind, event_callback: go, event_timeout: 600 });
          setTimeout(go, 700);
          return;
        } catch (e) {}
      }
      go();
    });
  });

  /* ---------- click events (partners and internal CTAs) ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-partner], a[data-cta-click]') : null;
    if (!a) { return; }
    if (a.hasAttribute('data-partner')) {
      ga('affiliate_click', {
        partner: a.getAttribute('data-partner'),
        placement: a.getAttribute('data-placement') || '',
        link_type: a.getAttribute('data-link-type') || '',
        page_path: location.pathname
      });
    } else {
      ga(a.getAttribute('data-cta-click'), { page_path: location.pathname });
    }
  });

  /* ---------- phone sticky bar ---------- */
  var top = document.querySelector('.dfs-cta[data-cta="tldr"]');
  if (top && 'IntersectionObserver' in window) {
    var bar = document.createElement('div');
    bar.className = 'dfs-sticky';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<span class="dfs-sticky-dot"></span><span class="dfs-sticky-txt">Your email: <b>not checked yet</b></span>' +
      '<a href="' + CHECK_URL + '" tabindex="-1" data-cta-click="blog_sticky_cta_click">Check free</a>';
    document.body.appendChild(bar);
    var link = bar.querySelector('a');
    var seen = [];
    var watch = Array.prototype.slice.call(document.querySelectorAll('.dfs-cta, .dfs-card, footer'));
    var update = function () {
      var passed = top.getBoundingClientRect().bottom < 0;
      var on = passed && seen.length === 0;
      bar.classList.toggle('show', on);
      bar.setAttribute('aria-hidden', on ? 'false' : 'true');
      link.tabIndex = on ? 0 : -1;
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var i = seen.indexOf(en.target);
        if (en.isIntersecting && i === -1) { seen.push(en.target); }
        if (!en.isIntersecting && i !== -1) { seen.splice(i, 1); }
      });
      update();
    });
    watch.forEach(function (w) { io.observe(w); });
    window.addEventListener('scroll', update, { passive: true });
  }
})();
