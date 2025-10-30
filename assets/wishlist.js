/**
 * Simplified Wishlist Controller - Based on working original
 * Eliminates over-engineering that caused counter glitching
 */

(function() {
  'use strict';

  class SimpleWishlistController {
    constructor() {
      this.storageKey = 'shopify-wishlist';
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
        console.log('🔍 Loaded', items.length, 'items from storage');
        return items;
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

        // Handle add to cart from wishlist page
        const addToCartButton = target.closest('.wishlist-add-to-cart');
        if (addToCartButton) {
          e.preventDefault();
          e.stopPropagation();
          this.handleAddToCart(/** @type {HTMLElement} */ (addToCartButton));
        }
      });

      // Update button states on page load
      this.updateWishlistButtons();
      
      // Listen for storage events to sync across tabs (from original)
      window.addEventListener('storage', (event) => {
        if (event.key === this.storageKey) {
          this.items = JSON.parse(event.newValue || '[]');
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
     * Handle add to cart from wishlist page - reuses PDP logic
     * @param {HTMLElement} button - Add to cart button element
     */
    async handleAddToCart(button) {
      const variantId = button.dataset.variantId;
      const productId = button.dataset.productId;
      
      if (!variantId || !productId) {
        console.error('No variant ID or product ID found for add to cart');
        return;
      }

      // Show loading state
      const buttonElement = /** @type {HTMLButtonElement} */ (button);
      buttonElement.classList.add('is-loading');
      buttonElement.disabled = true;

      try {
        console.log('🛒 Adding to cart:', { variantId, productId });

        // Use the same cart add logic as PDP
        const formData = new FormData();
        formData.append('id', variantId);
        formData.append('quantity', '1');

        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Successfully added to cart:', result);

        // Find the product in wishlist to show notification
        const product = this.items.find(/** @param {any} item */ item => String(item.id) === String(productId));
        if (product) {
          this.showNotification(`${product.title} added to cart`);
          
          // Optionally remove from wishlist after adding to cart
          this.remove(productId);
          this.renderWishlistPage();
        }

        // Trigger cart update events (same as PDP)
        document.dispatchEvent(new CustomEvent('cart:updated'));
        
        // Update cart drawer if it exists
        const cartDrawer = document.querySelector('cart-drawer-component');
        if (cartDrawer) {
          // @ts-ignore
          if (typeof cartDrawer.fetchCartContent === 'function') {
            // @ts-ignore
            cartDrawer.fetchCartContent();
          }
        }

      } catch (error) {
        console.error('❌ Error adding to cart:', error);
        this.showNotification('Could not add to cart. Please try again.', 'error');
      } finally {
        // Remove loading state
        buttonElement.classList.remove('is-loading');
        buttonElement.disabled = false;
      }
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

  // Initialize simplified wishlist controller
  new SimpleWishlistController();

})();