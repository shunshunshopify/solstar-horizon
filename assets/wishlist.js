/**
 * Unified Wishlist Controller for Shopify Theme
 * Single source of truth for all wishlist counters
 */

(function() {
  'use strict';

  class UnifiedWishlistController {
    constructor() {
      this.storageKey = 'shopify-wishlist';
      this.items = this.loadFromStorage();
      this.eventTarget = document.createElement('div');
      this.updatePending = false;
      this.counters = new Map(); // Registry of all counter elements
      
      // Make wishlist available globally
      // @ts-ignore
      window.wishlist = this;
      
      // Initialize after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        this.init();
      }
    }

    init() {
      console.log('🎯 UNIFIED WISHLIST CONTROLLER INITIALIZED');
      this.registerAllCounters();
      this.setupEventListeners();
      
      // Force immediate update on page load to handle initial HTML state
      setTimeout(() => {
        this.updateAllCounters();
      }, 50);
      
      this.renderWishlistPage();
    }

    /**
     * Register all wishlist counter elements in the unified system
     */
    registerAllCounters() {
      const counterConfigs = [
        {
          name: 'header',
          selector: '[data-wishlist-counter]',
          updateMethod: this.updateHeaderCounter.bind(this)
        },
        {
          name: 'bottom',
          selector: '[data-wishlist-counter-bottom]',
          updateMethod: this.updateBottomCounter.bind(this)
        },
        {
          name: 'legacy',
          selector: '[data-wishlist-bubble]',
          updateMethod: this.updateLegacyCounter.bind(this)
        }
      ];

      let registeredCount = 0;
      counterConfigs.forEach(config => {
        const element = document.querySelector(config.selector);
        if (element) {
          // Update existing registration or create new one
          this.counters.set(config.name, {
            element,
            selector: config.selector,
            updateMethod: config.updateMethod
          });
          registeredCount++;
        }
      });

      console.log(`🎯 Registered/Updated ${registeredCount} counters`);
    }

    /**
     * UNIFIED COUNTER UPDATE - Single source of truth
     */
    updateAllCounters() {
      if (this.updatePending) {
        console.log('⏳ Update already pending, skipping...');
        return;
      }

      this.updatePending = true;
      const count = this.getCount();
      console.log(`🎯 UNIFIED UPDATE: Syncing ALL counters to ${count}`);

      // Use requestAnimationFrame for perfect synchronization
      requestAnimationFrame(() => {
        try {
          // Always re-register counters to handle page transitions
          this.registerAllCounters();
          
          let successCount = 0;
          
          // Update all registered counters simultaneously
          for (const [name, counter] of this.counters) {
            try {
              if (document.contains(counter.element)) {
                counter.updateMethod(count);
                successCount++;
                console.log(`✅ ${name} synced: ${count}`);
              }
            } catch (error) {
              console.error(`❌ Failed to update ${name}:`, error);
            }
          }
          
          console.log(`🎯 SYNC COMPLETE: ${successCount}/${this.counters.size} counters updated`);
        } finally {
          this.updatePending = false;
        }
      });
    }

    /**
     * Re-register a counter if its element was recreated
     * @param {string} name - Counter name
     * @param {string} selector - CSS selector
     * @param {function} updateMethod - Update method function
     */
    reregisterCounter(name, selector, updateMethod) {
      const element = document.querySelector(selector);
      if (element) {
        this.counters.set(name, { element, selector, updateMethod });
        updateMethod(this.getCount());
        console.log(`🔄 Re-registered ${name} counter`);
      }
    }

    /**
     * Update header counter
     * @param {number} count - Wishlist count
     */
    updateHeaderCounter(count) {
      // Always try to find the header counter fresh (handles page transitions)
      const headerElement = document.querySelector('[data-wishlist-counter]');
      
      if (headerElement) {
        const element = /** @type {HTMLElement} */ (headerElement);
        
        // Update the registry with the current element
        const currentCounter = this.counters.get('header');
        if (currentCounter) {
          currentCounter.element = headerElement;
        }
        
        // ALWAYS remove both classes first to avoid conflicts
        element.classList.remove('is-hidden', 'is-visible');
        
        if (count > 0) {
          // Show the counter
          element.textContent = String(count);
          element.classList.add('is-visible');
          console.log('📍 Header counter shown:', count);
        } else {
          // Hide the counter
          element.classList.add('is-hidden');
          console.log('📍 Header counter hidden');
        }
      } else {
        console.log('⚠️ Header counter not found during update');
      }
    }

    /**
     * Update bottom navigation counter
     * @param {number} count - Wishlist count
     */
    updateBottomCounter(count) {
      const counter = this.counters.get('bottom');
      if (counter) {
        const element = /** @type {HTMLElement} */ (counter.element);
        const countSpan = element.querySelector('[aria-hidden="true"]');
        if (count > 0) {
          element.style.display = 'flex';
          if (countSpan) {
            countSpan.textContent = String(count);
          }
        } else {
          element.style.display = 'none';
        }
      }
    }

    /**
     * Update legacy counter elements
     * @param {number} count - Wishlist count
     */
    updateLegacyCounter(count) {
      const counter = this.counters.get('legacy');
      const legacyCount = document.querySelector('[data-wishlist-count]');
      const legacyCountText = document.querySelector('[data-wishlist-count-text]');
      const legacyIcon = document.querySelector('.bottom-menu__wishlist-icon');
      
      if (counter && legacyCount && legacyCountText && legacyIcon) {
        legacyCount.textContent = String(count);
        legacyCountText.textContent = String(count);
        
        if (count > 0) {
          counter.element.classList.remove('visually-hidden');
          legacyIcon.classList.add('bottom-menu__wishlist-icon--has-items');
        } else {
          counter.element.classList.add('visually-hidden');
          legacyIcon.classList.remove('bottom-menu__wishlist-icon--has-items');
        }
      }
    }

    // ===== CORE WISHLIST METHODS =====

    loadFromStorage() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('Failed to load wishlist from storage:', error);
        return [];
      }
    }

    saveToStorage() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.items));
      } catch (error) {
        console.error('Failed to save wishlist to storage:', error);
      }
    }

    getCount() {
      return this.items.length;
    }

    /**
     * Check if product is in wishlist
     * @param {string|number} productId - Product ID
     * @returns {boolean} True if product is in wishlist
     */
    contains(productId) {
      if (!productId) return false;
      return this.items.some(/** @param {any} item */ item => String(item.id) === String(productId));
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
    add(product) {
      if (!this.contains(product.id)) {
        this.items.push({
          id: product.id,
          title: product.title,
          image: product.image,
          url: product.url,
          price: product.price,
          variant_id: product.variant_id,
          added_at: new Date().toISOString()
        });
        
        this.saveToStorage();
        this.updateAllCounters(); // UNIFIED UPDATE
        this.dispatchUpdateEvent();
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
      this.items = this.items.filter(/** @param {any} item */ item => String(item.id) !== String(productId));
      
      if (this.items.length !== initialLength) {
        this.saveToStorage();
        this.updateAllCounters(); // UNIFIED UPDATE
        this.dispatchUpdateEvent();
        this.showNotification('Item removed from wishlist');
        return true;
      }
      return false;
    }

    /**
     * Toggle product in wishlist
     * @param {any} product - Product object
     * @returns {boolean} True if added, false if removed
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
      this.updateAllCounters();
      this.dispatchUpdateEvent();
      this.renderWishlistPage();
    }

    // ===== EVENT HANDLING =====

    setupEventListeners() {
      console.log('🎧 Setting up unified event listeners');
      
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
      
      // Page load update - single registration
      window.addEventListener('load', () => {
        this.updateWishlistButtons();
        setTimeout(() => {
          this.updateAllCounters(); // This now includes re-registration
        }, 200);
      });
      
      // Handle page visibility changes - only on returning to page
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          setTimeout(() => {
            this.updateAllCounters(); // This now includes re-registration
          }, 200);
        }
      });

      // Handle Shopify theme navigation events (if they exist)
      document.addEventListener('shopify:section:load', () => {
        console.log('🔄 Shopify section loaded - updating counters');
        setTimeout(() => {
          this.updateAllCounters();
        }, 100);
      });

      // Handle theme view transitions
      if ('navigation' in window) {
        // @ts-ignore
        window.navigation.addEventListener('navigatesuccess', () => {
          console.log('🔄 Navigation success - updating counters');
          setTimeout(() => {
            this.updateAllCounters();
          }, 100);
        });
      }
    }

    /**
     * Handle wishlist button click
     * @param {HTMLElement} button - Wishlist button element
     */
    handleWishlistButtonClick(button) {
      console.log('🔥 Wishlist button clicked');
      
      const product = {
        id: button.dataset.productId,
        title: button.dataset.productTitle,
        image: button.dataset.productImage,
        url: button.dataset.productUrl,
        price: button.dataset.productPrice,
        variant_id: button.dataset.variantId
      };

      const wasAdded = this.toggle(product);
      console.log('✅ Wishlist toggle result:', wasAdded ? 'Added' : 'Removed');
      this.updateWishlistButton(button, wasAdded);
    }

    /**
     * Update wishlist button state
     * @param {HTMLElement} button - Wishlist button
     * @param {boolean} isAdded - Whether item is in wishlist
     */
    updateWishlistButton(button, isAdded) {
      if (isAdded) {
        button.classList.add('is-added');
        button.setAttribute('aria-label', 'Remove from wishlist');
      } else {
        button.classList.remove('is-added');
        button.setAttribute('aria-label', 'Add to wishlist');
      }
    }

    updateWishlistButtons() {
      const buttons = document.querySelectorAll('[data-wishlist-button]');
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
     * Show notification message
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
          <button class="wishlist-notification__close" aria-label="Close notification">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;

      document.body.appendChild(notification);

      // Show notification
      setTimeout(() => {
        notification.classList.add('is-active');
      }, 50);

      // Auto hide after 4 seconds
      setTimeout(() => {
        notification.classList.remove('is-active');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }, 4000);

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
        emptyContainer.classList.remove('is-hidden');
        return;
      }

      emptyContainer.classList.add('is-hidden');
      
      const template = document.getElementById('wishlist-item-template');
      if (!template) {
        console.error('Wishlist item template not found');
        return;
      }

      let html = '';
      items.forEach(item => {
        let itemHtml = template.innerHTML;
        itemHtml = itemHtml.replace(/\[\[id\]\]/g, item.id);
        itemHtml = itemHtml.replace(/\[\[title\]\]/g, item.title);
        itemHtml = itemHtml.replace(/\[\[image\]\]/g, item.image);
        itemHtml = itemHtml.replace(/\[\[url\]\]/g, item.url);
        itemHtml = itemHtml.replace(/\[\[price\]\]/g, item.price);
        itemHtml = itemHtml.replace(/\[\[variant_id\]\]/g, item.variant_id);
        html += itemHtml;
      });

      wishlistContainer.innerHTML = html;
    }
  }

  // Initialize unified wishlist controller
  new UnifiedWishlistController();

})();