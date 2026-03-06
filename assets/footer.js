/* ── Footer: shared render logic ───────────────────────────────────────────── *
 * Source of truth: items table, section_key='ui', item_key='legal_*',
 *                  tenant_id=NULL (global). Managed via Master Admin → Pravne strani.
 * HTML target: <footer id="main-site-footer"> with child .footer-links div.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var DOCS = ['impressum', 'privacy', 'cookies', 'terms'];

  function getLang() {
    var lang = (localStorage.getItem('preferredLanguage') || 'sl').toLowerCase().split('-')[0];
    return (lang === 'sl' || lang === 'en') ? lang : 'sl';
  }

  function renderLinks(data) {
    var footer = document.getElementById('main-site-footer');
    if (!footer) return;
    var linksDiv = footer.querySelector('.footer-links');
    if (!linksDiv) return;

    var lang = getLang();
    var html = '';

    if (data && data.length) {
      DOCS.forEach(function (doc) {
        var item = null;
        for (var i = 0; i < data.length; i++) {
          if (data[i].item_key === 'legal_' + doc) { item = data[i]; break; }
        }
        if (!item || !item.data_json) return;
        var dj = item.data_json;
        if (dj.enabled_in_footer === false) return;
        var title = dj.title && (dj.title[lang] || dj.title.sl);
        if (!title) return;
        html += '<a href="/legal/index.html?doc=' + doc + '">' + title + '</a>';
      });
    }

    linksDiv.innerHTML = html;
  }

  function init() {
    var footer = document.getElementById('main-site-footer');
    if (!footer) return;

    var waited = 0;
    function tryLoad() {
      var sb = window.supabaseClient || window.SB;
      if (!sb) {
        waited += 200;
        if (waited < 8000) setTimeout(tryLoad, 200);
        return;
      }
      sb.from('items')
        .select('item_key, data_json')
        .eq('section_key', 'ui')
        .is('tenant_id', null)
        .in('item_key', ['legal_impressum', 'legal_privacy', 'legal_cookies', 'legal_terms'])
        .then(function (r) {
          if (r && r.data) renderLinks(r.data);
        })
        .catch(function () {});
    }
    tryLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
