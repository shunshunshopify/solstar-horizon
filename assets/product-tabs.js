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

    this.tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === tabId;
      button.classList.toggle('current', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.setAttribute('tabindex', isActive ? '0' : '-1');

      if (isActive && focus) {
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

  refreshEllipsis(scope = this) {
    const ellipsisBlocks = scope.querySelectorAll('[data-tabs-ellipsis-root]');
    ellipsisBlocks.forEach((root) => {
      if (root.dataset.tabsEllipsisEnhanced === 'true') return;

      const content = root.querySelector('[data-tabs-ellipsis-content]');
      const fade = root.querySelector('[data-tabs-ellipsis-fade]');
      const toggle = root.querySelector('[data-tabs-ellipsis-toggle]');
      const labelTarget = root.querySelector('[data-tabs-ellipsis-label]') || toggle;
      const collapsed = Number(root.dataset.collapsedHeight) || 160;
      const readMore = root.dataset.readMoreLabel || 'READ MORE';
      const readLess = root.dataset.readLessLabel || 'COLLAPSE';

      if (!content || !toggle) return;

      const setExpandedHeight = () => {
        root.style.setProperty('--pdp-description-expanded-height', `${content.scrollHeight}px`);
      };

      const updateState = (expanded) => {
        root.dataset.state = expanded ? 'expanded' : 'collapsed';
        toggle.setAttribute('aria-expanded', expanded);
        labelTarget.textContent = expanded ? readLess : readMore;
        if (expanded) {
          content.style.maxHeight = `${content.scrollHeight}px`;
          fade?.setAttribute('hidden', 'true');
        } else {
          content.style.maxHeight = `${collapsed}px`;
          fade?.removeAttribute('hidden');
        }
      };

      const lockIfShort = () => {
        const isShort = content.scrollHeight <= collapsed + 10;
        if (isShort) {
          root.dataset.state = 'static';
          toggle.hidden = true;
          fade?.setAttribute('hidden', 'true');
          content.style.maxHeight = 'none';
        } else {
          content.style.removeProperty('max-height');
          toggle.hidden = false;
          fade?.removeAttribute('hidden');
          setExpandedHeight();
          updateState(false);
        }
      };

      lockIfShort();
      toggle.addEventListener('click', () => {
        const isExpanded = root.dataset.state === 'expanded';
        if (!isExpanded) setExpandedHeight();
        updateState(!isExpanded);
      });

      const resizeObserver = new ResizeObserver(lockIfShort);
      resizeObserver.observe(content);

      root.dataset.tabsEllipsisEnhanced = 'true';
    });
  }
}

if (!customElements.get('tabs-component')) {
  customElements.define('tabs-component', TabsComponent);
}
