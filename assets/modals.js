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
    frame.src = url;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    lockScroll(true);
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
  btnRez?.addEventListener('click', () => openModal('SOČA • Rezerviraj znova', './rezervisi-ponovo/index.html'));
  btnLF?.addEventListener('click', () => openModal('SOČA • Izgubljeno / Najdeno', './izgubljeno-nadjeno/index.html'));
  btnRestavracije?.addEventListener('click', () => openModal('SOČA • Restavracije & Kavarne', './restavracije/index.html'));

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
