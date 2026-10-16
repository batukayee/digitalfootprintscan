/* Digital Footprint Scan - cookie consent for UK/EU/EEA/Swiss visitors.
   Google Analytics consent defaults are set inline in each page's <head>
   (denied by IP region for the UK/EEA/CH). This file shows the banner to
   visitors in those regions (detected from the browser time zone) and
   stores their choice in localStorage only. */
(function () {
  'use strict';

  var KEY = 'dfs_consent';

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function save(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
  }

  function inConsentRegion() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return false; }
    /* UK, EU, EEA (Iceland, Liechtenstein, Norway) and Switzerland */
    var EUROPE = ['London', 'Belfast', 'Isle_of_Man', 'Guernsey', 'Jersey', 'Gibraltar',
      'Dublin', 'Lisbon', 'Madrid', 'Paris', 'Brussels', 'Amsterdam', 'Luxembourg',
      'Berlin', 'Busingen', 'Zurich', 'Vaduz', 'Vienna', 'Rome', 'Malta', 'Copenhagen',
      'Oslo', 'Stockholm', 'Helsinki', 'Mariehamn', 'Tallinn', 'Riga', 'Vilnius', 'Warsaw',
      'Prague', 'Bratislava', 'Budapest', 'Ljubljana', 'Zagreb', 'Bucharest', 'Sofia',
      'Athens', 'Nicosia'];
    var OTHER = ['Atlantic/Reykjavik', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores',
      'Atlantic/Faroe', 'Africa/Ceuta', 'Asia/Nicosia', 'Asia/Famagusta'];
    if (tz.indexOf('Europe/') === 0) { return EUROPE.indexOf(tz.slice(7)) !== -1; }
    return OTHER.indexOf(tz) !== -1;
  }

  function apply(value) {
    if (typeof window.gtag !== 'function') { return; }
    window.gtag('consent', 'update', {
      analytics_storage: value === 'granted' ? 'granted' : 'denied'
    });
  }

  var banner = null;

  function css() {
    if (document.getElementById('dfs-consent-css')) { return; }
    var s = document.createElement('style');
    s.id = 'dfs-consent-css';
    s.textContent =
      '.dfs-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;' +
      'padding:18px 20px;background:#fff;color:#0b1220;border:1px solid #e4e8ef;border-radius:14px;' +
      'box-shadow:0 2px 4px rgba(11,18,32,.04),0 24px 60px -20px rgba(11,18,32,.28);' +
      'font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:14px;line-height:1.55}' +
      '.dfs-consent p{margin:0 0 14px;color:#5b6472}' +
      '.dfs-consent strong{display:block;margin-bottom:4px;color:#0b1220;font-size:15px}' +
      '.dfs-consent a{color:#0b1220}' +
      '.dfs-consent-actions{display:flex;gap:10px;flex-wrap:wrap}' +
      '.dfs-consent button{flex:1 1 140px;padding:11px 16px;border-radius:10px;font:inherit;font-weight:600;cursor:pointer}' +
      '.dfs-consent .dfs-accept{background:#0b1220;color:#fff;border:1px solid #0b1220}' +
      '.dfs-consent .dfs-decline{background:#fff;color:#0b1220;border:1px solid #e4e8ef}' +
      '.dfs-consent button:focus-visible{outline:2px solid #0e7c86;outline-offset:2px}';
    document.head.appendChild(s);
  }

  function close() {
    if (banner && banner.parentNode) { banner.parentNode.removeChild(banner); }
    banner = null;
  }

  function choose(value) {
    save(value);
    apply(value);
    close();
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'cookie_consent', { choice: value });
    }
  }

  function open() {
    if (banner) { return; }
    css();
    banner = document.createElement('div');
    banner.className = 'dfs-consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie choice');
    banner.innerHTML =
      '<p><strong>Can we count your visit?</strong>' +
      'We use Google Analytics cookies to see which guides help people. No ads, and we never sell data. ' +
      '<a href="/privacy.html#analytics">Privacy policy</a></p>' +
      '<div class="dfs-consent-actions">' +
      '<button type="button" class="dfs-accept">Accept</button>' +
      '<button type="button" class="dfs-decline">Decline</button>' +
      '</div>';
    banner.querySelector('.dfs-accept').addEventListener('click', function () { choose('granted'); });
    banner.querySelector('.dfs-decline').addEventListener('click', function () { choose('denied'); });
    document.body.appendChild(banner);
  }

  window.dfsConsent = { open: open };

  function init() {
    var buttons = document.querySelectorAll('[data-consent-open]');
    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener('click', function (event) { event.preventDefault(); open(); });
    });
    if (!stored() && inConsentRegion()) { open(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
