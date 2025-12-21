class TabsComponent extends HTMLElement {
  /** @type {boolean} */
  static supportsPreventScroll = (() => {
    if (typeof document === 'undefined') return false;
    let supports = false;
    const test = document.createElement('button');
    test.tabIndex = -1;
    try {
      test.focus({
        get preventScroll() {
          supports = true;
          return true;
        },
      });
    } catch {
      supports = false;
    }
    return supports;
  })();

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
        () => this.activateTab(tabId, { focus: true, scrollToTab: true }),
        { signal }
      );
      button.addEventListener(
        'keydown',
        (event) => {
          const keyboardEvent = /** @type {KeyboardEvent} */ (event);
          if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
            keyboardEvent.preventDefault();
            this.activateTab(tabId, { focus: true, scrollToTab: true });
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
      this.activateTab(fallbackTabId, { focus: false, scrollToTab: false });
    }
  }

  /**
   * @param {string} tabId
   * @param {{ focus?: boolean, scrollToTab?: boolean }} [options]
   */
  activateTab = (tabId, { focus = true, scrollToTab = true } = {}) => {
    if (!tabId) return;

    const lockScroll = this.disableScroll;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const shouldFocus = focus;
    let activeButton = null;

    this.tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === tabId;
      button.classList.toggle('current', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.setAttribute('tabindex', isActive ? '0' : '-1');

      if (isActive) {
        activeButton = button;
      }

      if (isActive && shouldFocus) {
        this.focusTabButton(button, { preventScroll: lockScroll, scrollX, scrollY });
      }
    });

    if (activeButton && scrollToTab) {
      this.scrollTabIntoView(activeButton, lockScroll ? 'auto' : 'smooth');
    }

    this.tabPanels.forEach((panel) => {
      const isActive = panel.dataset.tabContent === tabId;
      panel.classList.toggle('current', isActive);
      panel.toggleAttribute('hidden', !isActive);

      if (isActive) {
        this.refreshEllipsis(panel);
      }
    });

    if (lockScroll) {
      this.restoreScrollPosition(scrollX, scrollY);
    }
  };

  /**
   * @param {HTMLButtonElement} button
   * @param {{ preventScroll: boolean, scrollX: number, scrollY: number }} options
   */
  focusTabButton(button, { preventScroll, scrollX, scrollY }) {
    if (!preventScroll) {
      button.focus();
      return;
    }

    if (TabsComponent.supportsPreventScroll) {
      button.focus({ preventScroll: true });
      return;
    }

    const prevScrollX = scrollX ?? window.scrollX;
    const prevScrollY = scrollY ?? window.scrollY;
    button.focus();
    if (window.scrollX !== prevScrollX || window.scrollY !== prevScrollY) {
      window.scrollTo(prevScrollX, prevScrollY);
    }
  }

  /**
   * @param {number} scrollX
   * @param {number} scrollY
   */
  restoreScrollPosition = (scrollX, scrollY) => {
    if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
      window.scrollTo(scrollX, scrollY);
    }
  };

  /**
   * @param {HTMLButtonElement} button
   * @param {ScrollBehavior} behavior
   */
  scrollTabIntoView = (button, behavior) => {
    if (!this.navList) return;

    const navList = this.navList;
    const navRect = navList.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const buttonCenter = buttonRect.left + buttonRect.width / 2;
    const navCenter = navRect.left + navRect.width / 2;
    const delta = buttonCenter - navCenter;

    if (Math.abs(delta) > 1) {
      navList.scrollBy({ left: delta, behavior });
    }
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
