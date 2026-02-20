(function () {
  'use strict';

  if (window.SB) return; // already initialised by admin page

  var SUPABASE_URL = 'https://hkztanenhxoducivluor.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_VJewQ-VKXAyCQyK_FtVPow_HOP0_UiT';

  function initClient() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      window.SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  }

  // If the CDN bundle was already loaded (e.g. shared page), init synchronously.
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    initClient();
    return;
  }

  // Otherwise inject the UMD bundle and init on load.
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  s.onload  = initClient;
  s.onerror = function () {}; // fail silently — guest site works without Supabase
  document.head.appendChild(s);
})();
