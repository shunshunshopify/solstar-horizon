/**
 * Simplified Wishlist Controller - Based on working original
 * Eliminates over-engineering that caused counter glitching
 */

(function() {
  'use strict';

  /**
   * @typedef {Object} WishlistItem
   * @property {string|number} id
   * @property {string} title
   * @property {string} image
   * @property {string} url
   * @property {string} price
   * @property {string|number} variant_id
   * @property {boolean} available
   * @property {string} handle
   * @property {string} [added_at]
   */

  class SimpleWishlistController {
    constructor() {
      this.storageKey = 'shopify-wishlist';
      /**
       * @type {WishlistItem[]}
       */
      this.items = this.loadFromStorage();
      
      // Simple selectors - no complex registry
      this.selectors = {
        wishlistButton: '[data-wishlist-button]',
        wishlistCounterHeader: '[data-wishlist-counter]',
        wishlistCounterBottom: '[data-wishlist-counter-bottom]',
        wishlistBubble: '[data-wishlist-bubble]'
      };
      
      this.classes = {
        hidden: 'is-hidden',
        visible: 'is-visible',
        added: 'is-added'
      };

      /** @type {{ addToCart: string; soldOut: string }} */
      this.translations = {
        addToCart: 'Add to cart',
        soldOut: 'Sold out'
      };

      const wishlistContainer = document.querySelector('.wishlist-container');
      if (wishlistContainer instanceof HTMLElement) {
        this.translations.addToCart = wishlistContainer.dataset.wishlistAddText || this.translations.addToCart;
        this.translations.soldOut = wishlistContainer.dataset.wishlistSoldOutText || this.translations.soldOut;
      }
      
      this.handleCartUpdate = this.handleCartUpdate.bind(this);
      this.handleCartError = this.handleCartError.bind(this);
      
      // Make wishlist available globally
      // @ts-ignore
      window.wishlist = this;
      
      // Single initialization point
      this.init();
    }

    init() {
      console.log('🎯 Simple Wishlist Controller Initialized');
      console.log('🎯 Items in storage:', this.items.length);
      
      this.setupEventListeners();
      this.updateWishlistButtons();
      this.updateWishlistCounters(); // Single counter update method
      this.renderWishlistPage();
      
      // Watch for counter tampering and fix it
      this.observeCounterChanges();
    }

    loadFromStorage() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        const items = stored ? JSON.parse(stored) : [];
        const normalized = Array.isArray(items)
          ? items
              .filter((item) => item && typeof item === 'object')
              .map((item) => {
                const availableValue =
                  item.available === undefined
                    ? true
                    : item.available === true || item.available === 'true';

                return {
                  id: item.id,
                  title: item.title,
                  image: item.image,
                  url: item.url,
                  price: item.price,
                  variant_id: item.variant_id,
                  available: availableValue,
                  handle: typeof item.handle === 'string' ? item.handle : '',
                  added_at: item.added_at,
                };
              })
          : [];
        console.log('🔍 Loaded', normalized.length, 'items from storage');
        return normalized;
      } catch (error) {
        console.error('Failed to load wishlist from storage:', error);
        return [];
      }
    }

    saveToStorage() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.items));
        console.log('💾 Saved', this.items.length, 'items to storage');
        
        // Update everything after save - single point of truth
        this.updateWishlistCounters();
        this.updateWishlistButtons();
        this.dispatchUpdateEvent();
      } catch (error) {
        console.error('Failed to save wishlist to storage:', error);
      }
    }

    getCount() {
      return this.items.length;
    }

    /**
     * Escape HTML entities in a string
     * @param {unknown} value
     * @returns {string}
     */
    escapeHtml(value) {
      if (value === undefined || value === null) {
        return '';
      }

      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    /**
     * SINGLE COUNTER UPDATE METHOD - No complex registry
     * Updates all counters directly and simply
     */
    updateWishlistCounters() {
      const count = this.getCount();
      console.log(`🔄 Updating all counters to: ${count}`);
      
      // Update header counter
      const headerCounters = document.querySelectorAll(this.selectors.wishlistCounterHeader);
      headerCounters.forEach(counter => {
        const element = /** @type {HTMLElement} */ (counter);
        element.textContent = String(count);
        if (count > 0) {
          element.style.display = 'flex';
          element.classList.remove(this.classes.hidden);
          element.classList.add(this.classes.visible);
        } else {
          element.style.display = 'none';
          element.classList.add(this.classes.hidden);
          element.classList.remove(this.classes.visible);
        }
      });
      
      // Update bottom counter
      const bottomCounters = document.querySelectorAll(this.selectors.wishlistCounterBottom);
      bottomCounters.forEach(counter => {
        const element = /** @type {HTMLElement} */ (counter);
        const countSpan = element.querySelector('[aria-hidden="true"]');
        if (count > 0) {
          element.style.display = 'flex';
          if (countSpan) {
            countSpan.textContent = String(count);
          }
        } else {
          element.style.display = 'none';
        }
      });
      
      // Update legacy bubble counters
      const bubbleCounters = document.querySelectorAll(this.selectors.wishlistBubble);
      bubbleCounters.forEach(counter => {
        if (count > 0) {
          counter.classList.remove('visually-hidden');
          counter.textContent = String(count);
        } else {
          counter.classList.add('visually-hidden');
        }
      });
      
      console.log(`✅ Updated ${headerCounters.length + bottomCounters.length + bubbleCounters.length} counters`);
    }

    /**
     * Watch for counter changes and fix them - from original working code
     */
    observeCounterChanges() {
      const allCounters = [
        ...document.querySelectorAll(this.selectors.wishlistCounterHeader),
        ...document.querySelectorAll(this.selectors.wishlistCounterBottom)
      ];
      
      allCounters.forEach(counter => {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
              const count = this.getCount();
              // If counter has items but is hidden, fix it
              if (count > 0 && counter.classList.contains(this.classes.hidden)) {
                console.log('🔧 Counter was hidden incorrectly, fixing...');
                const element = /** @type {HTMLElement} */ (counter);
                element.classList.remove(this.classes.hidden);
                element.classList.add(this.classes.visible);
                element.style.display = 'flex';
                element.textContent = String(count);
              }
            }
          });
        });
        
        observer.observe(counter, {
          attributes: true,
          attributeFilter: ['class']
        });
      });
      
      console.log('👁️ Counter observers set up for', allCounters.length, 'elements');
    }

    // ===== CORE WISHLIST METHODS =====

    /**
     * Check if product is in wishlist
     * @param {string|number} productId - Product ID
     * @returns {boolean} True if product is in wishlist
     */
    contains(productId) {
      if (!productId) return false;
      return this.items.some((item) => String(item.id) === String(productId));
    }

    /**
     * Add product to wishlist
     * @param {Object} product - Product object
     * @param {string|number} product.id - Product ID
     * @param {string} product.title - Product title
     * @param {string} product.image - Product image URL
     * @param {string} product.url - Product URL
     * @param {string} product.price - Product price
     * @param {string|number} product.variant_id - Variant ID
     */
    /**
     * Add product to wishlist
     * @param {WishlistItem} product
     * @returns {boolean}
     */
    add(product) {
      if (!this.contains(product.id)) {
        this.items.push({
          id: product.id,
          title: product.title,
          image: product.image,
          url: product.url,
          price: product.price,
          variant_id: product.variant_id,
          available: product.available,
          handle: product.handle || '',
          added_at: new Date().toISOString()
        });
        
        this.saveToStorage();
        this.showNotification(`${product.title} added to wishlist`);
        return true;
      }
      return false;
    }

    /**
     * Remove product from wishlist
     * @param {string|number} productId - Product ID
     * @returns {boolean} True if item was removed
     */
    remove(productId) {
      if (!productId) return false;
      const initialLength = this.items.length;
      this.items = this.items.filter((item) => String(item.id) !== String(productId));
      
      if (this.items.length !== initialLength) {
        this.saveToStorage();
        this.showNotification('Item removed from wishlist');
        return true;
      }
      return false;
    }

    /**
     * Toggle product in wishlist
     * @param {WishlistItem} product
     * @returns {boolean}
     */
    toggle(product) {
      if (this.contains(product.id)) {
        this.remove(product.id);
        return false;
      } else {
        this.add(product);
        return true;
      }
    }

    getItems() {
      return [...this.items];
    }

    clear() {
      this.items = [];
      this.saveToStorage();
      this.renderWishlistPage();
    }

    // ===== EVENT HANDLING =====

    setupEventListeners() {
      console.log('🎧 Setting up simplified event listeners');
      
      // Handle wishlist button clicks
      document.addEventListener('click', (e) => {
        if (!e.target) return;
        const target = /** @type {Element} */ (e.target);
        const wishlistButton = target.closest('[data-wishlist-button]');
        if (wishlistButton) {
          e.preventDefault();
          e.stopPropagation();
          this.handleWishlistButtonClick(/** @type {HTMLElement} */ (wishlistButton));
        }

        // Handle remove from wishlist
        const removeButton = target.closest('.wishlist-remove');
        if (removeButton) {
          const htmlRemoveButton = /** @type {HTMLElement} */ (removeButton);
          const productId = htmlRemoveButton.dataset.productId;
          if (productId) {
            this.remove(productId);
            this.renderWishlistPage();
          }
        }

      });

      // Update button states on page load
      this.updateWishlistButtons();
      
      document.addEventListener('cart:update', this.handleCartUpdate);
      document.addEventListener('cart:error', this.handleCartError);

      // Listen for storage events to sync across tabs (from original)
      window.addEventListener('storage', (event) => {
        if (event.key === this.storageKey) {
          this.items = this.loadFromStorage();
          this.updateWishlistButtons();
          this.updateWishlistCounters();
          this.renderWishlistPage();
        }
      });
    }

    /**
     * Handle wishlist button click
     * @param {HTMLElement} button - Wishlist button element
     */
    handleWishlistButtonClick(button) {
      console.log('🔥 Wishlist button clicked');
      
      const productId = button.dataset.productId;
      const variantId = button.dataset.variantId;
      const variantAvailableAttr = button.dataset.variantAvailable;
      const productHandle = button.dataset.productHandle || '';

      if (!productId || !variantId) {
        console.error('Wishlist button missing product or variant identifiers');
        return;
      }

      const product = /** @type {WishlistItem} */ ({
        id: productId,
        title: button.dataset.productTitle || '',
        image: button.dataset.productImage || '',
        url: button.dataset.productUrl || '',
        price: button.dataset.productPrice || '',
        variant_id: variantId,
        available: variantAvailableAttr === undefined ? true : variantAvailableAttr === 'true',
        handle: productHandle
      });

      const wasAdded = this.toggle(product);
      console.log('✅ Wishlist toggle result:', wasAdded ? 'Added' : 'Removed');
      this.updateWishlistButton(button, wasAdded);
    }

    /**
     * Handle cart update events triggered from wishlist forms
     * @param {CustomEvent} event
     */
    handleCartUpdate(event) {
      const rawTarget = event.target;
      if (!(rawTarget instanceof Element)) {
        return;
      }

      const wishlistItem = rawTarget.closest('.wishlist-item');
      if (!(wishlistItem instanceof HTMLElement)) {
        return;
      }

      const detail = /** @type {{ data?: { didError?: boolean, productId?: string }, sourceId?: string }} */ (event.detail || {});
      if (detail?.data?.didError) {
        return;
      }

      const productId = detail?.data?.productId || wishlistItem.dataset.productId;
      const product = this.items.find((item) => String(item.id) === String(productId));
      const title = product?.title || 'Item';

      this.showNotification(`${title} added to cart`);
    }

    /**
     * Handle cart error events triggered from wishlist forms
     * @param {CustomEvent} event
     */
    handleCartError(event) {
      const rawTarget = event.target;
      if (!(rawTarget instanceof Element)) {
        return;
      }

      const wishlistItem = rawTarget.closest('.wishlist-item');
      if (!(wishlistItem instanceof HTMLElement)) {
        return;
      }

      const detail = /** @type {{ data?: { message?: string } }} */ (event.detail || {});
      const message = detail?.data?.message || 'Could not add to cart. Please try again.';

      this.showNotification(message, 'error');
    }

    /**
     * Update wishlist button state
     * @param {HTMLElement} button - Wishlist button
     * @param {boolean} isAdded - Whether item is in wishlist
     */
    updateWishlistButton(button, isAdded) {
      if (isAdded) {
        button.classList.add(this.classes.added);
        button.setAttribute('aria-label', 'Remove from wishlist');
        const heartIcon = button.querySelector('.icon-heart');
        if (heartIcon) {
          heartIcon.setAttribute('fill', 'currentColor');
        }
      } else {
        button.classList.remove(this.classes.added);
        button.setAttribute('aria-label', 'Add to wishlist');
        const heartIcon = button.querySelector('.icon-heart');
        if (heartIcon) {
          heartIcon.setAttribute('fill', 'none');
        }
      }
    }

    updateWishlistButtons() {
      const buttons = document.querySelectorAll(this.selectors.wishlistButton);
      if (buttons.length > 0) {
        console.log('🔄 Found', buttons.length, 'wishlist buttons on page');
      }
      buttons.forEach(button => {
        const htmlButton = /** @type {HTMLElement} */ (button);
        const productId = htmlButton.dataset.productId;
        if (productId) {
          const isAdded = this.contains(productId);
          this.updateWishlistButton(htmlButton, isAdded);
        }
      });
    }

    dispatchUpdateEvent() {
      document.dispatchEvent(new CustomEvent('wishlist:updated', {
        detail: {
          count: this.getCount(),
          items: this.getItems()
        }
      }));
    }

    /**
     * Show notification message - simplified from original
     * @param {string} message - Notification message
     * @param {string} type - Notification type ('success' or 'error')
     */
    showNotification(message, type = 'success') {
      console.log('📢 Showing notification:', message, type);
      
      // Remove existing notification
      const existing = document.querySelector('.wishlist-notification');
      if (existing) {
        existing.remove();
      }

      // Create notification
      const notification = document.createElement('div');
      notification.className = `wishlist-notification wishlist-notification--${type}`;
      notification.innerHTML = `
        <div class="wishlist-notification-content">
          <p>${message}</p>
          <button class="wishlist-notification__close" aria-label="Close notification">×</button>
        </div>
      `;

      document.body.appendChild(notification);

      // Show notification
      setTimeout(() => {
        notification.classList.add('is-active');
      }, 50);

      // Auto hide after 3 seconds (like original)
      setTimeout(() => {
        notification.classList.remove('is-active');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }, 3000);

      // Handle close button
      const closeButton = notification.querySelector('.wishlist-notification__close');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          notification.classList.remove('is-active');
          setTimeout(() => {
            if (notification.parentNode) {
              notification.remove();
            }
          }, 300);
        });
      }
    }

    renderWishlistPage() {
      const wishlistContainer = document.getElementById('wishlist-items');
      const emptyContainer = document.getElementById('wishlist-empty');
      
      if (!wishlistContainer || !emptyContainer) {
        return; // Not on wishlist page
      }

      const items = this.getItems();
      
      if (items.length === 0) {
        wishlistContainer.innerHTML = '';
        emptyContainer.classList.remove(this.classes.hidden);
        return;
      }

      emptyContainer.classList.add(this.classes.hidden);
      
      const template = document.getElementById('wishlist-item-template');
      if (!template) {
        console.error('Wishlist item template not found');
        return;
      }

      let html = '';
      items.forEach(item => {
        let itemHtml = template.innerHTML;
        const safeId = this.escapeHtml(item.id);
        const safeTitle = this.escapeHtml(item.title);
        const safeImage = this.escapeHtml(item.image);
        const safeUrl = this.escapeHtml(item.url);
        const safePrice = this.escapeHtml(item.price);
        const safeVariantId = this.escapeHtml(item.variant_id);
        const isAvailable = item.available !== false;
        const availableValue = isAvailable ? 'true' : 'false';
        const addToCartDisabledAttr = isAvailable ? '' : 'disabled';
        const addToCartAriaDisabled = isAvailable ? '' : 'aria-disabled="true"';
        const variantInputDisabledAttr = isAvailable ? '' : 'disabled';
        const addToCartText = isAvailable ? this.translations.addToCart : this.translations.soldOut;
        const safeAddToCartText = this.escapeHtml(addToCartText);
        const addToCartExtraClass = isAvailable ? '' : ' wishlist-add-to-cart--sold-out';

        itemHtml = itemHtml.replace(/\[\[id\]\]/g, safeId);
        itemHtml = itemHtml.replace(/\[\[title\]\]/g, safeTitle);
        itemHtml = itemHtml.replace(/\[\[image\]\]/g, safeImage);
        itemHtml = itemHtml.replace(/\[\[url\]\]/g, safeUrl);
        itemHtml = itemHtml.replace(/\[\[price\]\]/g, safePrice);
        itemHtml = itemHtml.replace(/\[\[variant_id\]\]/g, safeVariantId);
        itemHtml = itemHtml.replace(/\[\[available\]\]/g, availableValue);
        itemHtml = itemHtml.replace(/\[\[add_to_cart_disabled_attr\]\]/g, addToCartDisabledAttr);
        itemHtml = itemHtml.replace(/\[\[add_to_cart_aria_disabled\]\]/g, addToCartAriaDisabled);
        itemHtml = itemHtml.replace(/\[\[variant_input_disabled_attr\]\]/g, variantInputDisabledAttr);
        itemHtml = itemHtml.replace(/\[\[add_to_cart_text\]\]/g, safeAddToCartText);
        itemHtml = itemHtml.replace(/\[\[add_to_cart_extra_class\]\]/g, addToCartExtraClass);
        html += itemHtml;
      });

      wishlistContainer.innerHTML = html;
    }
  }

  // Initialize simplified wishlist controller
  new SimpleWishlistController();

})();
