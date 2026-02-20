(function () {
  'use strict';

  // If already initialised, ensure window.supabaseClient alias exists and exit.
  if (window.SB) {
    window.supabaseClient = window.supabaseClient || window.SB;
    return;
  }

  var SUPABASE_URL = 'https://hkztanenhxoducivluor.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_VJewQ-VKXAyCQyK_FtVPow_HOP0_UiT';

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[SupabaseClient] Missing URL or ANON key');
  }

  function initClient() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      window.SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      window.supabaseClient = window.SB; // unified alias used by admin.js
    }
    if (!window.supabaseClient) {
      console.error('[SupabaseClient] Failed to initialize client');
    }
  }

  // If the CDN bundle was already loaded (e.g. admin page loads it via <script>), init synchronously.
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    initClient();
    return;
  }

  // Otherwise inject the UMD bundle and init on load (guest site path).
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  s.onload  = initClient;
  s.onerror = function () {}; // fail silently — guest site works without Supabase
  document.head.appendChild(s);
})();
