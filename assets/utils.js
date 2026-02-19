(function() {
  'use strict';
  window.APP = window.APP || {};
  window.APP.utils = window.APP.utils || {};

  function showToast(message) {
    var toast = document.getElementById('toast');
    var toastText = document.getElementById('toast-text');
    if (toastText) toastText.textContent = message;
    if (toast) {
      toast.classList.add('show');
      setTimeout(function() { toast.classList.remove('show'); }, 2500);
    }
  }

  function copyToClipboard(text, successMessage, fallbackMessage) {
    var msg = successMessage || fallbackMessage || 'Copied!';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        showToast(msg);
      }).catch(function() {
        fallbackCopy();
      });
    } else {
      fallbackCopy();
    }
    function fallbackCopy() {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast(msg);
      } catch (err) {
        showToast(fallbackMessage || 'Copied!');
      }
      document.body.removeChild(textarea);
    }
  }

  function getTownFromAddress(address) {
    if (!address) return 'Bovec';
    var addrLower = address.toLowerCase();
    if (addrLower.indexOf('kobarid') !== -1) return 'Kobarid';
    if (addrLower.indexOf('tolmin') !== -1) return 'Tolmin';
    if (addrLower.indexOf('bovec') !== -1) return 'Bovec';
    return 'Bovec';
  }

  function scrollToTopReliable() {
    var root = document.scrollingElement || document.documentElement;
    root.scrollTop = 0;
    requestAnimationFrame(function() {
      root.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      var header = document.querySelector('.glass-header');
      if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  window.APP.utils.showToast = showToast;
  window.APP.utils.copyToClipboard = copyToClipboard;
  window.APP.utils.getTownFromAddress = getTownFromAddress;
  window.APP.utils.scrollToTopReliable = scrollToTopReliable;
  window.APP.utils.generateId = generateId;
})();
