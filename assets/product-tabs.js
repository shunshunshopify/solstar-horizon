class TabsComponent extends HTMLElement {
  /** @type {AbortController} */
  controller;
  /** @type {HTMLElement | null} */
  navList = null;
  /** @type {HTMLButtonElement[]} */
  tabButtons = [];
  /** @type {HTMLElement[]} */
  tabPanels = [];
  /** @type {HTMLButtonElement | null} */
  prevButton = null;
  /** @type {HTMLButtonElement | null} */
  nextButton = null;
  /** @type {boolean} */
  disableScroll = false;
  /** @type {AbortController | null} */
  scrollLockController = null;

  constructor() {
    super();
    this.controller = new AbortController();
  }

  connectedCallback() {
    const { signal } = this.controller;

    this.navList = /** @type {HTMLElement | null} */ (this.querySelector('.product-tabs-title'));
    this.tabButtons = /** @type {HTMLButtonElement[]} */ (Array.from(this.querySelectorAll('[data-tab]')));
    this.tabPanels = /** @type {HTMLElement[]} */ (Array.from(this.querySelectorAll('[data-tab-content]')));
    this.prevButton = /** @type {HTMLButtonElement | null} */ (this.querySelector('[data-tabs-prev]'));
    this.nextButton = /** @type {HTMLButtonElement | null} */ (this.querySelector('[data-tabs-next]'));
    this.disableScroll = this.hasAttribute('data-tabs-no-scroll');

    this.tabButtons.forEach((button) => {
      const tabId = button.dataset.tab;
      if (!tabId) return;

      button.addEventListener(
        'click',
        () => this.activateTab(tabId, { focus: !this.disableScroll }),
        { signal }
      );
      button.addEventListener(
        'keydown',
        (event) => {
          const keyboardEvent = /** @type {KeyboardEvent} */ (event);
          if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
            keyboardEvent.preventDefault();
            this.activateTab(tabId, { focus: !this.disableScroll });
          }
        },
        { signal }
      );
    });

    this.prevButton?.addEventListener('click', this.scrollPrev, { signal });
    this.nextButton?.addEventListener('click', this.scrollNext, { signal });
    this.navList?.addEventListener('scroll', this.updateArrows, { signal });
    window.addEventListener('resize', this.updateArrows, { signal });

    this.activateInitialTab();
    this.updateArrows();
  }

  disconnectedCallback() {
    this.controller.abort();
  }

  activateInitialTab() {
    const currentButton = this.tabButtons.find((button) => button.classList.contains('current'));
    const fallbackButton = currentButton || this.tabButtons[0];
    const fallbackTabId = fallbackButton?.dataset.tab;

    if (fallbackTabId) {
      this.activateTab(fallbackTabId, { focus: false });
    }
  }

  /**
   * @param {string} tabId
   * @param {{ focus?: boolean }} [options]
   */
  activateTab = (tabId, { focus = true } = {}) => {
    if (!tabId) return;

    const lockScroll = this.disableScroll;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const shouldFocus = focus && !lockScroll;

    this.tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === tabId;
      button.classList.toggle('current', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.setAttribute('tabindex', isActive ? '0' : '-1');

      if (isActive && shouldFocus) {
        button.focus();
        button.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });

    this.tabPanels.forEach((panel) => {
      const isActive = panel.dataset.tabContent === tabId;
      panel.classList.toggle('current', isActive);
      panel.toggleAttribute('hidden', !isActive);

      if (isActive) {
        this.refreshEllipsis(panel);
      }
    });

    if (lockScroll) {
      this.lockScrollPosition(scrollX, scrollY);
    }
  };

  /**
   * @param {number} scrollX
   * @param {number} scrollY
   */
  lockScrollPosition = (scrollX, scrollY) => {
    if (this.scrollLockController) {
      this.scrollLockController.abort();
    }

    const controller = new AbortController();
    const { signal } = controller;
    this.scrollLockController = controller;

    const rootElement = document.documentElement;
    const previousOverflowAnchor = rootElement.style.overflowAnchor;
    rootElement.style.overflowAnchor = 'none';

    const startTime = performance.now();
    const maxDurationMs = 1000;

    const release = () => {
      if (signal.aborted) return;
      controller.abort();
      rootElement.style.overflowAnchor = previousOverflowAnchor;
      if (this.scrollLockController === controller) {
        this.scrollLockController = null;
      }
    };

    const restoreScroll = () => {
      if (signal.aborted) return;
      if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
        window.scrollTo(scrollX, scrollY);
      }
    };

    const tick = () => {
      if (signal.aborted) return;
      restoreScroll();
      if (performance.now() - startTime < maxDurationMs) {
        requestAnimationFrame(tick);
      } else {
        release();
      }
    };

    window.addEventListener('wheel', release, { signal, passive: true });
    window.addEventListener('touchmove', release, { signal, passive: true });
    window.addEventListener(
      'keydown',
      (event) => {
        const keyboardEvent = /** @type {KeyboardEvent} */ (event);
        const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Space'];
        if (keys.includes(keyboardEvent.code)) {
          release();
        }
      },
      { signal }
    );

    tick();
  };

  scrollPrev = () => {
    this.navList?.scrollBy({ left: -160, behavior: 'smooth' });
  };

  scrollNext = () => {
    this.navList?.scrollBy({ left: 160, behavior: 'smooth' });
  };

  updateArrows = () => {
    if (!this.navList) return;

    const overflow = this.navList.scrollWidth > this.navList.clientWidth + 2;
    const atStart = this.navList.scrollLeft <= 0;
    const atEnd = Math.ceil(this.navList.scrollLeft + this.navList.clientWidth) >= this.navList.scrollWidth;

    this.prevButton?.classList.toggle('is-hidden', !overflow || atStart);
    this.nextButton?.classList.toggle('is-hidden', !overflow || atEnd);
  };

  /**
   * @param {HTMLElement} [_panel]
   */
  refreshEllipsis(_panel) {
    // Read-more removed from tabs; no-op.
  }
}

if (!customElements.get('tabs-component')) {
  customElements.define('tabs-component', TabsComponent);
}
