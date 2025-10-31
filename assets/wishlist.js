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
      
      // Animation constants (same as PDP)
      this.ADD_TO_CART_TEXT_ANIMATION_DURATION = 2000;
      
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
      this.variantAvailabilityCache = new Map();
      this.variantAvailabilityTTL = 60 * 1000;
      
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
     * Check variant availability (cached for a short period)
     * @param {string|number} variantId
     * @returns {Promise<boolean|null>} True if available, false if sold out, null if unknown
     */
    async checkVariantAvailability(variantId) {
      if (!variantId) {
        return null;
      }

      const cacheKey = String(variantId);
      const cached = this.variantAvailabilityCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.variantAvailabilityTTL) {
        return cached.available;
      }

      try {
        const response = await fetch(`/variants/${variantId}.json`, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('Failed to fetch variant availability', response.status, response.statusText);
          return null;
        }

        const data = await response.json();
        const variant = data && (data.variant || data);
        if (!variant || typeof variant.available === 'undefined') {
          return null;
        }

        const available = Boolean(variant.available);
        this.variantAvailabilityCache.set(cacheKey, {
          available,
          timestamp: Date.now()
        });
        return available;
      } catch (error) {
        console.error('Failed to verify variant availability', error);
        return null;
      }
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
     * Animate add to cart button (same logic as PDP)
     * @param {HTMLElement} button - Add to cart button element
     */
    animateAddToCart(button) {
      // Use dataset to store timeout IDs to avoid TypeScript errors
      const timeoutId = button.dataset.animationTimeout;
      const cleanupId = button.dataset.cleanupTimeout;
      
      // Clear any existing timeouts
      if (timeoutId) {
        clearTimeout(parseInt(timeoutId, 10));
        delete button.dataset.animationTimeout;
      }
      if (cleanupId) {
        clearTimeout(parseInt(cleanupId, 10));
        delete button.dataset.cleanupTimeout;
      }

      // Add the 'atc-added' class that triggers CSS animations
      if (!button.classList.contains('atc-added')) {
        button.classList.add('atc-added');
      }

      // Remove the class after animation duration (same as PDP)
      const animationTimeout = setTimeout(() => {
        const cleanupTimeout = setTimeout(() => {
          button.classList.remove('atc-added');
          delete button.dataset.cleanupTimeout;
        }, 10);
        button.dataset.cleanupTimeout = cleanupTimeout.toString();
        delete button.dataset.animationTimeout;
      }, this.ADD_TO_CART_TEXT_ANIMATION_DURATION);
      
      button.dataset.animationTimeout = animationTimeout.toString();
    }

    /**
     * Announce text to screen readers (same as PDP)
     * @param {string} text - Text to announce
     */
    announceToScreenReader(text) {
      // Create or find existing live region
      let liveRegion = document.querySelector('#wishlist-live-region');
      if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'wishlist-live-region';
        liveRegion.setAttribute('aria-live', 'assertive');
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'visually-hidden';
        document.body.appendChild(liveRegion);
      }

      // Set the text for screen reader announcement
      liveRegion.textContent = text;

      // Clear the announcement after a delay
      setTimeout(() => {
        if (liveRegion) {
          liveRegion.textContent = '';
        }
      }, 5000);
    }

    /**
     * Handle add to cart from wishlist page - reuses PDP logic
     * @param {HTMLElement} button - Add to cart button element
     */
    async handleAddToCart(button) {
      const variantId = button.dataset.variantId;
      const productId = button.dataset.productId;
      const buttonElement = /** @type {HTMLButtonElement} */ (button);
      let keepDisabled = false;
      
      if (!variantId || !productId) {
        console.error('No variant ID or product ID found for add to cart');
        return;
      }

      buttonElement.classList.add('loading');
      buttonElement.disabled = true;

      try {
        const availability = await this.checkVariantAvailability(variantId);
        if (availability === false) {
          console.warn('Variant is sold out, skipping add to cart', variantId);
          this.showNotification('This item is sold out.', 'error');
          buttonElement.classList.add('is-disabled');
          buttonElement.setAttribute('aria-disabled', 'true');
          keepDisabled = true;
          return;
        }

        if (availability === null) {
          this.showNotification('Could not verify availability. Please try again.', 'error');
          return;
        }

        // Trigger animation after verifying availability (same as PDP)
        this.animateAddToCart(button);

        console.log('🛒 Adding to cart:', { variantId, productId });

        // Use the same cart add logic as PDP
        const formData = new FormData();
        formData.append('id', variantId);
        formData.append('quantity', '1');

        // Add sections parameter like PDP does for cart drawer updates
        const cartItemsComponents = document.querySelectorAll('cart-items-component');
        /** @type {string[]} */
        let cartItemComponentsSectionIds = [];
        cartItemsComponents.forEach((item) => {
          if (item instanceof HTMLElement && item.dataset.sectionId) {
            cartItemComponentsSectionIds.push(item.dataset.sectionId);
          }
        });
        if (cartItemComponentsSectionIds.length > 0) {
          formData.append('sections', cartItemComponentsSectionIds.join(','));
        }

        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        console.log('🔍 Cart add response:', result);

        // Check if there was an error in the response
        if (!response.ok || result.status || result.message) {
          // Handle cart add errors (like out of stock, etc.)
          const errorMessage = result.message || result.description || 'Could not add to cart';
          throw new Error(errorMessage);
        }

        console.log('✅ Successfully added to cart:', result);

        // Find the product in wishlist to show notification
        const product = this.items.find(/** @param {any} item */ item => String(item.id) === String(productId));
        if (product) {
          this.showNotification(`${product.title} added to cart`);
          
          // Add accessibility announcement (same as PDP)
          this.announceToScreenReader(`${product.title} 追加済み`);
          
          // Optional: Remove from wishlist after adding to cart
          // Users might want to keep items in wishlist even after adding to cart
          // Uncomment the next two lines if you want auto-removal:
          // this.remove(productId);
          // this.renderWishlistPage();
        }

        // Dispatch CartAddEvent (same as PDP) - this is what updates the cart bubble!
        // This creates the exact same event structure as ProductFormComponent uses
        // Using 'product-form-component' source so cart-icon treats it as addition, not replacement
        const cartAddEvent = new CustomEvent('cart:update', {
          bubbles: true,
          detail: {
            resource: {},
            sourceId: 'wishlist-component',
            data: {
              source: 'product-form-component', // Same source as PDP for consistent behavior
              itemCount: 1, // Number of items being added (always 1 for wishlist)
              productId: productId,
              variantId: variantId,
              sections: result.sections || {}
            }
          }
        });
        
        document.dispatchEvent(cartAddEvent);
        console.log('🔄 Dispatched CartAddEvent for cart bubble update');
        
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
        buttonElement.classList.remove('loading');
        if (keepDisabled) {
          buttonElement.disabled = true;
        } else {
          buttonElement.disabled = false;
          buttonElement.classList.remove('is-disabled');
          buttonElement.removeAttribute('aria-disabled');
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

        itemHtml = itemHtml.replace(/\[\[id\]\]/g, safeId);
        itemHtml = itemHtml.replace(/\[\[title\]\]/g, safeTitle);
        itemHtml = itemHtml.replace(/\[\[image\]\]/g, safeImage);
        itemHtml = itemHtml.replace(/\[\[url\]\]/g, safeUrl);
        itemHtml = itemHtml.replace(/\[\[price\]\]/g, safePrice);
        itemHtml = itemHtml.replace(/\[\[variant_id\]\]/g, safeVariantId);
        html += itemHtml;
      });

      wishlistContainer.innerHTML = html;
    }
  }

  // Initialize simplified wishlist controller
  new SimpleWishlistController();

})();
