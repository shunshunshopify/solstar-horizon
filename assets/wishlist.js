/**
 * Wishlist Functionality for Shopify Theme
 * Manages wishlist items in localStorage and provides counter updates
 */

(function() {
  'use strict';

  class Wishlist {
    constructor() {
      this.storageKey = 'shopify-wishlist';
      this.items = this.loadFromStorage();
      this.eventTarget = document.createElement('div');
      
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
      console.log('🎯 Wishlist initialized');
      this.setupEventListeners();
      this.updateAllCounters();
      this.renderWishlistPage();
      
      // Force header counter update after a short delay to ensure DOM is ready
      setTimeout(() => {
        console.log('⏰ Delayed header counter update');
        this.forceHeaderCounterUpdate();
      }, 500);
    }

    /**
     * Force update header counter - more aggressive approach
     */
    forceHeaderCounterUpdate() {
      const count = this.getCount();
      console.log('💪 Force updating header counter with count:', count);
      
      // Try multiple selectors to find the header counter
      const selectors = [
        '[data-wishlist-counter]',
        '.wishlist-count-bubble',
        '.header__icon--wishlist .wishlist-count-bubble',
        'header-actions [data-wishlist-counter]'
      ];
      
      let headerCounter = null;
      for (const selector of selectors) {
        headerCounter = document.querySelector(selector);
        if (headerCounter) {
          console.log(`✅ Found header counter with selector: ${selector}`);
          break;
        }
      }
      
      if (headerCounter) {
        const htmlHeaderCounter = /** @type {HTMLElement} */ (headerCounter);
        if (count > 0) {
          htmlHeaderCounter.classList.remove('is-hidden');
          htmlHeaderCounter.textContent = String(count);
          htmlHeaderCounter.style.display = 'flex';
          htmlHeaderCounter.style.visibility = 'visible';
          console.log('💪 Header counter force updated to:', count);
        } else {
          htmlHeaderCounter.classList.add('is-hidden');
          htmlHeaderCounter.style.display = 'none';
          console.log('💪 Header counter force hidden');
        }
      } else {
        console.error('❌ Header counter not found with any selector!');
      }
    }

    /**
     * Load wishlist items from localStorage
     * @returns {Array<any>} Array of wishlist items
     */
    loadFromStorage() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('Failed to load wishlist from storage:', error);
        return [];
      }
    }

    /**
     * Save wishlist items to localStorage
     */
    saveToStorage() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.items));
      } catch (error) {
        console.error('Failed to save wishlist to storage:', error);
      }
    }

    /**
     * Get current wishlist count
     * @returns {number} Number of items in wishlist
     */
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
      return this.items.some(item => String(item.id) === String(productId));
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
        this.updateAllCounters();
        this.forceHeaderCounterUpdate(); // Extra force update
        this.dispatchUpdateEvent();
        this.showNotification(`${product.title} added to wishlist`);
        
        return true;
      }
      return false;
    }

    /**
     * Remove product from wishlist
     * @param {string|number} productId - Product ID
     */
    remove(productId) {
      if (!productId) return false;
      const initialLength = this.items.length;
      this.items = this.items.filter(item => String(item.id) !== String(productId));
      
      if (this.items.length !== initialLength) {
        this.saveToStorage();
        this.updateAllCounters();
        this.forceHeaderCounterUpdate(); // Extra force update
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

    /**
     * Get all wishlist items
     * @returns {Array<any>} Array of wishlist items
     */
    getItems() {
      return [...this.items];
    }

    /**
     * Clear all items from wishlist
     */
    clear() {
      this.items = [];
      this.saveToStorage();
      this.updateAllCounters();
      this.dispatchUpdateEvent();
      this.renderWishlistPage();
    }

    /**
     * Setup event listeners for wishlist buttons
     */
    setupEventListeners() {
      console.log('🎧 Setting up wishlist event listeners');
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

        // Handle add to cart from wishlist
        const addToCartButton = target.closest('.wishlist-add-to-cart');
        if (addToCartButton) {
          this.handleAddToCart(/** @type {HTMLElement} */ (addToCartButton));
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
      
      // Also update when page is fully loaded (for dynamic content)
      window.addEventListener('load', () => {
        this.updateWishlistButtons();
        // Ensure counters are updated after all scripts have loaded
        setTimeout(() => {
          this.updateAllCounters();
          this.forceHeaderCounterUpdate();
        }, 100);
      });
      
      // Update counters when page visibility changes (helps with navigation)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.updateAllCounters();
          setTimeout(() => {
            this.forceHeaderCounterUpdate();
          }, 100);
        }
      });
      
      // Listen for theme events that might affect the header
      document.addEventListener('theme:header:loaded', () => {
        console.log('🎭 Theme header loaded event detected');
        this.forceHeaderCounterUpdate();
      });
      
      // Listen for any DOM changes that might recreate the header
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if any added nodes contain a header counter
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = /** @type {Element} */ (node);
                if (element.querySelector && element.querySelector('[data-wishlist-counter]')) {
                  console.log('🔄 Header counter element added to DOM');
                  setTimeout(() => this.forceHeaderCounterUpdate(), 50);
                }
              }
            });
          }
        });
      });
      
      // Observe changes to the document body
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
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
     * Handle add to cart from wishlist
     * @param {HTMLElement} button - Add to cart button
     */
    async handleAddToCart(button) {
      const productId = button.dataset.productId;
      const variantId = button.dataset.variantId;

      if (!variantId) {
        console.error('Variant ID not found');
        return;
      }

      try {
        button.classList.add('is-loading');
        
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: variantId,
            quantity: 1
          })
        });

        if (response.ok) {
          // Trigger cart update events
          document.dispatchEvent(new CustomEvent('cart:updated'));
          this.showNotification('Item added to cart');
          
          // Optionally remove from wishlist after adding to cart
          // this.remove(productId);
          // this.renderWishlistPage();
        } else {
          throw new Error('Failed to add to cart');
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        this.showNotification('Failed to add to cart', 'error');
      } finally {
        button.classList.remove('is-loading');
      }
    }

    /**
     * Update all wishlist counters
     */
    updateAllCounters() {
      const count = this.getCount();
      console.log('🔢 Updating all counters with count:', count);
      
      // Update header counter with more robust element finding
      const headerCounter = document.querySelector('[data-wishlist-counter]');
      console.log('🎯 Header counter element found:', !!headerCounter);
      console.log('🎯 Header counter details:', {
        element: headerCounter,
        isHidden: headerCounter ? headerCounter.classList.contains('is-hidden') : 'N/A',
        currentText: headerCounter ? headerCounter.textContent : 'N/A',
        style: headerCounter ? (/** @type {HTMLElement} */ (headerCounter)).style.display : 'N/A'
      });
      
      if (headerCounter) {
        const htmlHeaderCounter = /** @type {HTMLElement} */ (headerCounter);
        if (count > 0) {
          htmlHeaderCounter.classList.remove('is-hidden');
          htmlHeaderCounter.textContent = String(count);
          htmlHeaderCounter.style.display = 'flex'; // Force display
          console.log('✅ Header counter updated to:', count, 'Classes:', headerCounter.className);
        } else {
          htmlHeaderCounter.classList.add('is-hidden');
          htmlHeaderCounter.style.display = 'none'; // Force hide
          console.log('� Header counter hidden');
        }
      } else {
        console.error('❌ Header counter element [data-wishlist-counter] not found!');
        // Try alternative selectors
        const altCounter = document.querySelector('.wishlist-count-bubble');
        console.log('🔍 Alternative selector .wishlist-count-bubble found:', !!altCounter);
      }

      // Update bottom navigation counter
      const bottomCounter = document.querySelector('[data-wishlist-counter-bottom]');
      if (bottomCounter) {
        const htmlBottomCounter = /** @type {HTMLElement} */ (bottomCounter);
        const countSpan = bottomCounter.querySelector('[aria-hidden="true"]');
        if (count > 0) {
          htmlBottomCounter.style.display = 'flex';
          if (countSpan) {
            countSpan.textContent = String(count);
          }
        } else {
          htmlBottomCounter.style.display = 'none';
        }
      }

      // Update legacy bottom menu counter (if exists)
      const legacyCounter = document.querySelector('[data-wishlist-bubble]');
      const legacyCount = document.querySelector('[data-wishlist-count]');
      const legacyCountText = document.querySelector('[data-wishlist-count-text]');
      const legacyIcon = document.querySelector('.bottom-menu__wishlist-icon');
      
      if (legacyCounter && legacyCount && legacyCountText && legacyIcon) {
        legacyCount.textContent = String(count);
        legacyCountText.textContent = String(count);
        
        if (count > 0) {
          legacyCounter.classList.remove('visually-hidden');
          legacyIcon.classList.add('bottom-menu__wishlist-icon--has-items');
        } else {
          legacyCounter.classList.add('visually-hidden');
          legacyIcon.classList.remove('bottom-menu__wishlist-icon--has-items');
        }
      }
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

    /**
     * Update all wishlist buttons on page
     */
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

    /**
     * Dispatch wishlist update event
     */
    dispatchUpdateEvent() {
      document.dispatchEvent(new CustomEvent('wishlist:updated', {
        detail: {
          count: this.getCount(),
          items: this.getItems()
        }
      }));
    }

    /**
     * Show notification
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
      console.log('📢 Notification element added to DOM:', notification);

      // Show notification
      setTimeout(() => {
        notification.classList.add('is-active');
        console.log('📢 Notification activated');
      }, 50);

      // Auto hide after 4 seconds (increased from 3)
      setTimeout(() => {
        console.log('📢 Auto-hiding notification');
        notification.classList.remove('is-active');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
            console.log('📢 Notification removed from DOM');
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

    /**
     * Render wishlist page (if on wishlist page)
     */
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

  // Initialize wishlist when DOM is ready
  new Wishlist();

})();