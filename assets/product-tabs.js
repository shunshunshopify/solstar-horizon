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
      button.addEventListener('click', () => this.activateTab(button.dataset.tab), { signal });
      button.addEventListener(
        'keydown',
        (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.activateTab(button.dataset.tab);
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

    const anchorTop = this.disableScroll ? this.getBoundingClientRect().top : null;

    this.tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === tabId;
      button.classList.toggle('current', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.setAttribute('tabindex', isActive ? '0' : '-1');

      if (isActive && focus) {
        if (this.disableScroll) {
          if (document.activeElement !== button) {
            const scrollX = window.scrollX;
            const scrollY = window.scrollY;

            try {
              button.focus({ preventScroll: true });
            } catch {
              button.focus();
            }

            const restoreScroll = () => {
              if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
                window.scrollTo(scrollX, scrollY);
              }
            };

            restoreScroll();
            requestAnimationFrame(restoreScroll);
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

    if (this.disableScroll && anchorTop !== null) {
      const adjustScroll = () => {
        const newTop = this.getBoundingClientRect().top;
        const delta = anchorTop - newTop;

        if (Math.abs(delta) > 1) {
          window.scrollBy({ top: delta, left: 0 });
        }
      };

      adjustScroll();
      requestAnimationFrame(adjustScroll);
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

  refreshEllipsis() {
    // Read-more removed from tabs; no-op.
  }
}

if (!customElements.get('tabs-component')) {
  customElements.define('tabs-component', TabsComponent);
}
