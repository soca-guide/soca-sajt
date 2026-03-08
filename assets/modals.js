(() => {
  const modal = document.getElementById('iframeModal');
  const frame = document.getElementById('vtFrame');
  const overlay = document.getElementById('vtOverlay');
  const titleEl = document.getElementById('vtTitle');

  const btnLive = document.getElementById('openSocaLive');
  const btnRez = document.getElementById('openRezervisiPonovo');
  const btnLF = document.getElementById('openLostFound');
  const btnRestavracije = document.getElementById('openRestavracije');

  let savedScrollY = 0;
  let modalHistoryPushed = false;

  function lockScroll(lock) {
    var body = document.body;
    var html = document.documentElement;
    if (lock) {
      savedScrollY = window.scrollY || document.documentElement.scrollTop;
      body.style.position = 'fixed';
      body.style.top = '-' + savedScrollY + 'px';
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';
    } else {
      body.style.removeProperty('position');
      body.style.removeProperty('top');
      body.style.removeProperty('left');
      body.style.removeProperty('right');
      body.style.removeProperty('width');
      body.style.overflow = '';
      html.style.overflow = '';
      window.scrollTo(0, savedScrollY);
    }
  }

  function openModal(title, url){
    titleEl.textContent = title;
    // Set src immediately while still inside the user gesture (click) context.
    // This is critical for mobile autoplay — the browser grants activation only
    // if the iframe src is set synchronously within the user gesture handler.
    frame.src = '';
    frame.src = url;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    lockScroll(true);
    // GA4: section_view for every modal open
    var _sectionName = title.replace(/^SOČA\s*[•·]\s*/i,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
    var _slug = (new URLSearchParams(window.location.search).get('t') || 'direct').toLowerCase();
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'section_view', { section: _sectionName, section_url: url, tenant_slug: _slug });
    }
    if (window.__DEBUG || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('[GA4 📊] section_view', { section: _sectionName, url: url, tenant_slug: _slug });
    }
    // Push history state only once per modal open (prevent duplicate)
    if (!modalHistoryPushed) {
      history.pushState({ __appModal: true, id: 'iframeModal' }, '', window.location.pathname + window.location.search + (window.location.hash || ''));
      modalHistoryPushed = true;
    }
  }

  function restoreScroll(){
    lockScroll(false);
  }

  function closeModal(){
    if (!modal || !modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    if (frame) frame.src = '';
    restoreScroll();
    requestAnimationFrame(function(){
      restoreScroll();
      window.scrollTo(0, savedScrollY);
    });
    setTimeout(function(){
      restoreScroll();
    }, 50);
    // Reset flag so next open can push state again
    modalHistoryPushed = false;
  }

  function isAnyModalOpen() {
    return modal && modal.classList.contains('open');
  }

  // Export for app.js popstate handler
  window.__MODALS = {
    closeModal: closeModal,
    isAnyModalOpen: isAnyModalOpen
  };

  function panicUnlockIfModalClosed() {
    if (modal && !modal.classList.contains('open')) {
      lockScroll(false);
    }
  }
  document.addEventListener('visibilitychange', panicUnlockIfModalClosed);
  window.addEventListener('pageshow', panicUnlockIfModalClosed);

  btnLive?.addEventListener('click', () => openModal('SOČA • Soča Live', './soca-live/index.html'));
  btnRez?.addEventListener('click', () => {
    var slug = (new URLSearchParams(window.location.search).get('t') || '').toLowerCase().trim();
    var url = './rezervisi-ponovo/index.html' + (slug ? ('?t=' + encodeURIComponent(slug)) : '');
    console.log(url);
    openModal('SOČA • Rezerviraj znova', url);
  });
  btnLF?.addEventListener('click', () => openModal('SOČA • Izgubljeno / Najdeno', './izgubljeno-nadjeno/index.html'));
  btnRestavracije?.addEventListener('click', () => openModal('SOČA • Restavracije & Kavarne', './restavracije/index.html'));

  // Directory pages — Aktivnosti & Taxi (called from app.js via window.__MODALS)
  window.__MODALS.openAktivnosti = function() {
    openModal('SOČA • Adrenalin & Aktivnosti', './aktivnosti/index.html');
  };
  window.__MODALS.openTaxi = function() {
    openModal('SOČA • Taxi & Bus', './taxi/index.html');
  };
  window.__MODALS.openOwnerBiznis = function() {
    var slug = window._ownerBiznisSlug || '';
    var url = './owner-biznis/index.html' + (slug ? '?t=' + encodeURIComponent(slug) : '');
    openModal('SOČA • Biznis', url);
  };

  var LEGAL_TITLES = {
    impressum: 'Impressum',
    privacy:   'Zasebnost / Privacy',
    cookies:   'Piškotki / Cookies',
    terms:     'Pogoji / Terms'
  };
  window.__MODALS.openLegal = function(doc) {
    openModal('SOČA • ' + (LEGAL_TITLES[doc] || doc), '/legal/index.html?doc=' + doc);
  };

  overlay?.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // Swipe down closes (mobile)
  (() => {
    const sheet = modal?.querySelector('.vt-sheet');
    if (!sheet) return;

    let startY = 0, curY = 0, tracking = false;

    sheet.addEventListener('touchstart', (e) => {
      if (!modal.classList.contains('open')) return;
      tracking = true;
      startY = e.touches[0].clientY;
      curY = startY;
    }, { passive: true });

    sheet.addEventListener('touchmove', (e) => {
      if (!tracking) return;
      curY = e.touches[0].clientY;
    }, { passive: true });

    sheet.addEventListener('touchend', () => {
      if (!tracking) return;
      tracking = false;
      if (curY - startY > 120) closeModal();
    });
  })();

  // Close from inside iframe pages
  window.addEventListener('message', (event) => {
    if (event?.data === 'CLOSE_MODAL') closeModal();
  });

  // YouTube activation bypass — forward first touch/scroll inside the modal
  // sheet to all YouTube iframes loaded inside vtFrame (cross-origin postMessage)
  (function() {
    var sheet = modal && modal.querySelector('.vt-sheet');
    if (!sheet) return;
    function _sendPlay() {
      if (!frame || !frame.contentWindow) return;
      var msg = JSON.stringify({ event: 'command', func: 'playVideo', args: '' });
      try { frame.contentWindow.postMessage(msg, '*'); } catch(e) {}
    }
    sheet.addEventListener('touchstart', function() {
      setTimeout(_sendPlay, 300);
    }, { once: false, passive: true });
    sheet.addEventListener('scroll', function() {
      setTimeout(_sendPlay, 300);
    }, { once: false, passive: true });
  })();

  // =========================
  // Drag & drop + save order (menu-grid / menu-card)
  // =========================
  const grid = document.querySelector('.menu-grid') || document.querySelector('.cards-grid, .grid, #cardsGrid') || document.body;
  const cardSelector = '.menu-card';
  let cards = grid ? [...grid.querySelectorAll(cardSelector)] : [];

  cards.forEach((card, i) => {
    if (!card.dataset.cardId) card.dataset.cardId = 'card-' + i;
    // Only make draggable if card doesn't have data-section (panels shouldn't be draggable)
    // Cards with data-section need to open panels on first click, not start drag
    if (!card.hasAttribute('data-section')) {
      card.draggable = true;
    } else {
      card.draggable = false;
    }
  });

  let dragged = null;

  document.addEventListener('dragstart', (e) => {
    if (!e.target.classList.contains('menu-card')) return;
    // Prevent drag for cards with data-section (they open panels)
    if (e.target.hasAttribute('data-section')) {
      e.preventDefault();
      return;
    }
    dragged = e.target;
    e.target.style.opacity = '0.5';
  });

  document.addEventListener('dragend', (e) => {
    if (!e.target.classList.contains('menu-card')) return;
    e.target.style.opacity = '';
    saveOrder();
  });

  document.addEventListener('dragover', (e) => {
    if (!dragged) return;
    e.preventDefault();
    if (!grid) return;
    const after = getAfterElement(grid, e.clientY);
    if (after == null) grid.appendChild(dragged);
    else grid.insertBefore(dragged, after);
  });

  function getAfterElement(container, y) {
    const els = [...container.querySelectorAll(cardSelector)];
    return els.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  }

  function saveOrder() {
    if (!grid) return;
    const order = [...grid.querySelectorAll(cardSelector)].map(c => c.dataset.cardId);
    localStorage.setItem('soca_cards_order_v1', JSON.stringify(order));
  }

  function loadOrder() {
    if (!grid) return;
    const order = JSON.parse(localStorage.getItem('soca_cards_order_v1') || '[]');
    const cardsNow = [...grid.querySelectorAll(cardSelector)];
    order.forEach(id => {
      const el = cardsNow.find(c => c.dataset.cardId === id);
      if (el) grid.appendChild(el);
    });
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', loadOrder);
  } else {
    loadOrder();
  }

})();
