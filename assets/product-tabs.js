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
    const { signal } = this.controller;
    const ellipsisBlocks = scope.querySelectorAll('[data-ellipsis-root]');

    ellipsisBlocks.forEach((root) => {
      const content = root.querySelector('[data-ellipsis-content]');
      const toggle = root.querySelector('[data-ellipsis-toggle]');
      const fade = root.querySelector('.toggle-ellipsis__fade');

      if (!content || !toggle) return;

      const collapsed = Number(root.dataset.collapsedHeight) || 220;
      const contentHeight = content.scrollHeight;
      const isExpandable = contentHeight > collapsed + 8;

      toggle.removeAttribute('hidden');
      fade?.classList.remove('is-hidden');

      if (!isExpandable) {
        root.dataset.state = 'static';
        toggle.hidden = true;
        fade?.classList.add('is-hidden');
        content.style.removeProperty('max-height');
        toggle.setAttribute('aria-expanded', 'false');
        return;
      }

      const expanded = root.dataset.state === 'expanded';
      root.dataset.state = expanded ? 'expanded' : 'collapsed';

      if (expanded) {
        content.style.maxHeight = `${contentHeight}px`;
        toggle.setAttribute('aria-expanded', 'true');
        fade?.classList.add('is-hidden');
      } else {
        content.style.maxHeight = `${collapsed}px`;
        toggle.setAttribute('aria-expanded', 'false');
      }

      if (root.dataset.ellipsisEnhanced !== 'true') {
        toggle.addEventListener(
          'click',
          () => {
            const isCurrentlyExpanded = root.dataset.state === 'expanded';
            const nextState = !isCurrentlyExpanded;

            root.dataset.state = nextState ? 'expanded' : 'collapsed';
            if (nextState) {
              content.style.maxHeight = `${content.scrollHeight}px`;
              toggle.setAttribute('aria-expanded', 'true');
              fade?.classList.add('is-hidden');
            } else {
              content.style.maxHeight = `${collapsed}px`;
              toggle.setAttribute('aria-expanded', 'false');
              fade?.classList.remove('is-hidden');
            }

            const readMoreLabel = toggle.querySelector('[data-ellipsis-label="more"]');
            const readLessLabel = toggle.querySelector('[data-ellipsis-label="less"]');

            readMoreLabel?.classList.toggle('hidden', nextState);
            readLessLabel?.classList.toggle('hidden', !nextState);
          },
          { signal }
        );

        root.dataset.ellipsisEnhanced = 'true';
      }
    });
  }
}

if (!customElements.get('tabs-component')) {
  customElements.define('tabs-component', TabsComponent);
}
