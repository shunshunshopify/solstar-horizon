class TabsComponent extends HTMLElement {
  constructor() {
    super();
    this.controller = new AbortController();
  }

  connectedCallback() {
    const { signal } = this.controller;

    this.navList = this.querySelector('.product-tabs-title');
    this.tabButtons = Array.from(this.querySelectorAll('[data-tab]'));
    this.tabPanels = Array.from(this.querySelectorAll('[data-tab-content]'));
    this.prevButton = this.querySelector('[data-tabs-prev]');
    this.nextButton = this.querySelector('[data-tabs-next]');
    this.disableScroll = this.hasAttribute('data-tabs-no-scroll');

    this.tabButtons.forEach((button) => {
      button.addEventListener(
        'click',
        () => this.activateTab(button.dataset.tab, { focus: !this.disableScroll }),
        { signal }
      );
      button.addEventListener(
        'keydown',
        (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.activateTab(button.dataset.tab, { focus: !this.disableScroll });
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

    if (fallbackButton) {
      this.activateTab(fallbackButton.dataset.tab, { focus: false });
    }
  }

  activateTab = (tabId, { focus = true } = {}) => {
    if (!tabId) return;

    const lockScroll = this.disableScroll;
    const scrollX = lockScroll ? window.scrollX : null;
    const scrollY = lockScroll ? window.scrollY : null;
    const shouldFocus = focus && !lockScroll;

    this.tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === tabId;
      button.classList.toggle('current', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.setAttribute('tabindex', isActive ? '0' : '-1');

      if (isActive && shouldFocus) {
        if (lockScroll) {
          if (document.activeElement !== button) {
            try {
              button.focus({ preventScroll: true });
            } catch {
              button.focus();
            }

            if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
              window.scrollTo(scrollX, scrollY);
            }
          }
        } else {
          button.focus();
          button.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
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

  lockScrollPosition = (scrollX, scrollY) => {
    if (scrollX == null || scrollY == null) return;

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
        const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Space'];
        if (keys.includes(event.code)) {
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

  refreshEllipsis() {
    // Read-more removed from tabs; no-op.
  }
}

if (!customElements.get('tabs-component')) {
  customElements.define('tabs-component', TabsComponent);
}
