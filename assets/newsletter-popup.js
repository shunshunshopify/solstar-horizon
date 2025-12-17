/* global Shopify */

(() => {
  const MODAL_SELECTOR = '[data-newsletter-modal]';
  const DEFAULT_DELAY = 5;
  const DEFAULT_DAYS_TO_WAIT = 3;
  const VIDEO_INTRO_COMPLETE_EVENT = 'videoIntro:complete';

  const isDesignMode = () => Boolean(window.Shopify && Shopify.designMode);

  const getModalLib = () => /** @type {any} */ (window).MicroModal;

  const hasMicroModal = () => typeof getModalLib() !== 'undefined';

  /**
   * @param {HTMLElement} modal
   * @param {boolean} [track=true]
   */
  const showModal = (modal, track = true) => {
    if (!hasMicroModal()) return;
    getModalLib().show(modal.id, {
      disableScroll: true,
    });
    if (track) {
      const cookieKey = modal.dataset.cookieKey;
      const daysToWait = Number(modal.dataset.daysToWait || DEFAULT_DAYS_TO_WAIT);
      if (cookieKey) {
        setCookie(cookieKey, 'true', daysToWait);
      }
    }
  };

  /** @param {HTMLElement} modal */
  const closeModal = (modal) => {
    if (!hasMicroModal()) return;
    getModalLib().close(modal.id);
  };

  /** @param {string} name */
  const hasCookie = (name) => {
    return document.cookie.split(';').some((entry) => entry.trim().startsWith(`${name}=`));
  };

  /**
   * @param {string} name
   * @param {string} value
   * @param {number} days
   */
  const setCookie = (name, value, days) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    document.cookie = `${name}=${value}; expires=${expiry.toUTCString()}; path=/`;
  };

  const shouldForceOpen = () => window.location.href.includes('eg-newsletter-popup');

  /**
   * Start a callback only after the video intro is complete (if present).
   * @param {() => void} callback
   */
  const runAfterVideoIntroComplete = (callback) => {
    const introElement = document.getElementById('shopi_video_intro');
    if (!introElement) {
      callback();
      return;
    }

    let didRun = false;
    const runOnce = () => {
      if (didRun) return;
      didRun = true;
      callback();
    };

    document.addEventListener(VIDEO_INTRO_COMPLETE_EVENT, runOnce, { once: true });

    // Fallback: if the intro disappears without emitting the event, proceed.
    window.setTimeout(() => {
      if (!document.getElementById('shopi_video_intro')) runOnce();
    }, 0);
  };

  /** @param {HTMLElement} modal */
  const initializeModal = (modal) => {
    if (!modal || modal.dataset.newsletterInitialized === 'true') return;
    modal.dataset.newsletterInitialized = 'true';

    const delay = Number(modal.dataset.delay || DEFAULT_DELAY);
    const cookieKey = modal.dataset.cookieKey || `newsletter-popup-${modal.dataset.sectionId}`;
    modal.dataset.cookieKey = cookieKey;
    const shouldOpenOnLoad = Boolean(
      modal.querySelector('[data-newsletter-form-error], [data-newsletter-form-success]')
    );
    const form = modal.querySelector('.newsletter-modal__form');
    if (form instanceof HTMLFormElement) {
      const action = form.getAttribute('action');
      const sanitizedAction = typeof action === 'string' && action.includes('#') ? action.split('#')[0] : null;
      if (sanitizedAction) {
        form.setAttribute('action', sanitizedAction);
      }
    }

    if (shouldForceOpen() || shouldOpenOnLoad) {
      showModal(modal, false);
      return;
    }

    if (!isDesignMode()) {
      if (hasCookie(cookieKey)) return;
      const scheduleModal = () => {
        window.setTimeout(() => {
          showModal(modal);
        }, Math.max(0, delay) * 1000);
      };

      runAfterVideoIntroComplete(scheduleModal);
    } else {
      // Ensure close buttons work in editor
      const closeButtons = modal.querySelectorAll('[data-micromodal-close]');
      closeButtons.forEach((button) => {
        button.addEventListener('click', () => {
          const lib = getModalLib();
          if (lib) {
            lib.close(modal.id);
          }
        });
      });
    }
  };

  /**
   * @param {Document | HTMLElement} [root=document]
   */
  const initializeInRoot = (root = document) => {
    const modals = root.querySelectorAll(MODAL_SELECTOR);
    modals.forEach((modalElement) => {
      if (modalElement instanceof HTMLElement) {
        initializeModal(modalElement);
      }
    });
  };

  /**
   * @param {CustomEvent} event
   * @param {(modal: HTMLElement) => void} handler
   */
  const handleSectionEvent = (event, handler) => {
    const sectionId = event?.detail?.sectionId;
    if (!sectionId) return;
    const modal = document.querySelector(`${MODAL_SELECTOR}[data-section-id="${sectionId}"]`);
    if (modal instanceof HTMLElement) {
      handler(modal);
    }
  };

  initializeInRoot();

  document.addEventListener('shopify:section:load', /** @param {CustomEvent} event */ (event) => {
    const target = event.target;
    if (target instanceof HTMLElement) {
      initializeInRoot(target);
    }
  });

  document.addEventListener('shopify:section:unload', /** @param {CustomEvent} event */ (event) => {
    const target = event.target;
    if (target instanceof HTMLElement) {
      const modal = target.querySelector(MODAL_SELECTOR);
      if (modal instanceof HTMLElement) {
        delete modal.dataset.newsletterInitialized;
      }
    }
  });

  if (isDesignMode()) {
    document.addEventListener('shopify:section:select', /** @param {CustomEvent} event */ (event) => {
      handleSectionEvent(event, (modal) => showModal(modal, false));
    });

    document.addEventListener('shopify:section:deselect', /** @param {CustomEvent} event */ (event) => {
      handleSectionEvent(event, (modal) => closeModal(modal));
    });
  }
})();
