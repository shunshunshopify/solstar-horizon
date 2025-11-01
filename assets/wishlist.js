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

  /**
   * @typedef {Object} ProductOption
   * @property {string} name
   * @property {number} position
   * @property {string[]} values
   */

  /**
   * @typedef {Object} ProductVariant
   * @property {string|number} id
   * @property {boolean} available
   * @property {number} price
   * @property {string[]} options
   * @property {string|undefined} option1
   * @property {string|undefined} option2
   * @property {string|undefined} option3
   * @property {string|undefined} featuredImage
   */

  /**
   * @typedef {Object} ProductData
   * @property {string} handle
   * @property {string} [url]
   * @property {ProductOption[]} options
   * @property {ProductVariant[]} variants
   * @property {string|undefined} featuredImage
   * @property {string|undefined} featuredMedia
   * @property {string[]|undefined} images
   * @property {Record<string, string>} [variantMedia]
   */

  /**
   * @typedef {Object} WishlistProductState
   * @property {ProductData} productData
   * @property {string} baseUrl
   * @property {ProductVariant} selectedVariant
   */

  /**
   * @typedef {Object} WishlistRenderResult
  * @property {WishlistItem} item
  * @property {ProductData | undefined} productData
  * @property {ProductVariant | undefined} selectedVariant
  * @property {string} html
  * @property {boolean} storageDirty
   * @property {boolean} shouldInitVariantPicker
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

      /** @type {Map<string, ProductData>} */
      this.productCache = new Map();
      /** @type {Map<string, WishlistProductState>} */
      this.wishlistProductData = new Map();

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
              .filter((rawItem) => rawItem && typeof rawItem === 'object')
              .map((rawItem) => {
                const item = /** @type {any} */ (rawItem);
                const availableValue =
                  item.available === undefined
                    ? true
                    : item.available === true || item.available === 'true';

                return /** @type {WishlistItem} */ ({
                  id: item.id,
                  title: String(item.title ?? ''),
                  image: String(item.image ?? ''),
                  url: String(item.url ?? ''),
                  price: String(item.price ?? ''),
                  variant_id: item.variant_id,
                  available: availableValue,
                  handle: typeof item.handle === 'string' ? item.handle : '',
                  added_at: item.added_at,
                });
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
     * @param {number | string} cents
     * @returns {string}
     */
    formatMoney(cents) {
      if (cents === undefined || cents === null || Number.isNaN(Number(cents))) {
        return '';
      }

      if (typeof cents === 'string') {
        const digitsOnly = cents.replace(/[^0-9.-]/g, '');
        if (digitsOnly !== '') {
          const parsed = Number(digitsOnly);
          if (!Number.isNaN(parsed)) {
            cents = parsed;
          }
        }
      }

      const amount = Number(cents);
      if (Number.isNaN(amount)) {
        return typeof cents === 'string' ? cents : '';
      }
      try {
        const shopifyGlobal = /** @type {{ formatMoney?: (value: number, format: string) => string, money_format?: string, currency?: { active?: string }, locale?: string } | undefined} */ ((/** @type {any} */ (window)).Shopify);
        if (shopifyGlobal && typeof shopifyGlobal.formatMoney === 'function') {
          const themeSettings = /** @type {{ moneyFormat?: string } | undefined} */ ((/** @type {any} */ (window)).theme);
          const format = themeSettings?.moneyFormat || shopifyGlobal.money_format || '${{amount}}';
          return shopifyGlobal.formatMoney(amount, format);
        }

        const currency = shopifyGlobal?.currency?.active || 'USD';
        const locale = shopifyGlobal?.locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          currencyDisplay: 'symbol'
        }).format(amount / 100);
      } catch (error) {
        console.warn('Failed to format money, falling back to plain number:', error);
        return `$${(amount / 100).toFixed(2)}`;
      }
    }

    /**
     * @param {string} value
     * @returns {string}
     */
    escapeSelector(value) {
      if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
        return CSS.escape(value);
      }
      return value.replace(/([^a-zA-Z0-9_-])/g, '\\$1');
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

    /**
     * @param {WishlistItem} item
     * @returns {string | undefined}
     */
    getProductHandle(item) {
      if (item.handle) {
        return item.handle;
      }

      try {
        const url = new URL(item.url, window.location.origin);
        const segments = url.pathname.split('/').filter(Boolean);
        const handleIndex = segments.indexOf('products');
        if (handleIndex !== -1 && segments[handleIndex + 1]) {
          return segments[handleIndex + 1];
        }
      } catch (error) {
        console.warn('Unable to determine product handle from URL', item.url, error);
      }

      return undefined;
    }

    /**
     * @param {any} rawData
     * @returns {ProductData | undefined}
     */
    normalizeProductData(rawData) {
      if (!rawData || typeof rawData !== 'object') {
        return undefined;
      }

      /** @type {ProductOption[]} */
      const options = [];
      if (Array.isArray(rawData.options)) {
        for (let index = 0; index < rawData.options.length; index += 1) {
          const option = /** @type {any} */ (rawData.options[index]);
          if (option && typeof option === 'object') {
            const values = Array.isArray(option.values) ? option.values.map(String) : [];
            options.push({
              name: typeof option.name === 'string' ? option.name : `Option ${index + 1}`,
              position: typeof option.position === 'number' ? option.position : index + 1,
              values
            });
          } else {
            options.push({
              name: String(option ?? `Option ${index + 1}`),
              position: index + 1,
              values: []
            });
          }
        }
      }

      /** @type {ProductVariant[]} */
      const variants = [];
      if (Array.isArray(rawData.variants)) {
        for (const rawVariant of rawData.variants) {
          const variant = /** @type {any} */ (rawVariant);
          if (!variant || typeof variant !== 'object') {
            continue;
          }

          const optionsArray = Array.isArray(variant.options) && variant.options.length > 0
            ? variant.options.map(String)
            : [variant.option1, variant.option2, variant.option3].filter((value) => typeof value === 'string');

          const featuredImageSrc =
            typeof variant.featured_image === 'object' && variant.featured_image
              ? variant.featured_image.src
              : variant.featured_image;

          variants.push({
            id: variant.id,
            available: Boolean(variant.available),
            price: Number(variant.price),
            options: optionsArray,
            option1: typeof variant.option1 === 'string' ? variant.option1 : undefined,
            option2: typeof variant.option2 === 'string' ? variant.option2 : undefined,
            option3: typeof variant.option3 === 'string' ? variant.option3 : undefined,
            featuredImage: typeof featuredImageSrc === 'string' ? featuredImageSrc : undefined
          });
        }
      }

      const handle = typeof rawData.handle === 'string' ? rawData.handle : '';
      const url = typeof rawData.url === 'string' ? rawData.url : undefined;

      const featuredImage =
        typeof rawData.featured_image === 'string'
          ? rawData.featured_image
          : typeof rawData.featured_image === 'object' && rawData.featured_image
          ? rawData.featured_image.src
          : undefined;

      const featuredMedia =
        rawData.featured_media && typeof rawData.featured_media === 'object'
          ? rawData.featured_media.preview_image?.src || rawData.featured_media.src
          : undefined;

      const images = Array.isArray(rawData.images)
        ? rawData.images.filter((imageSrc) => typeof imageSrc === 'string')
        : undefined;

      /** @type {Record<string, string>} */
      const variantMedia = {};
      if (Array.isArray(rawData.media)) {
        rawData.media.forEach((media) => {
          if (!media || typeof media !== 'object') {
            return;
          }

          const previewSrc =
            typeof media.preview_image === 'object' && media.preview_image
              ? media.preview_image.src
              : typeof media.src === 'string'
              ? media.src
              : undefined;
          if (!previewSrc) {
            return;
          }

          /** @type {Array<string|number>} */
          const possibleVariantIds = [];
          if (Array.isArray(media.variant_ids)) {
            possibleVariantIds.push(...media.variant_ids);
          }
          if (Array.isArray(media.variants)) {
            media.variants.forEach((variantEntry) => {
              if (typeof variantEntry === 'object' && variantEntry) {
                if (variantEntry.id) {
                  possibleVariantIds.push(variantEntry.id);
                }
              } else if (variantEntry) {
                possibleVariantIds.push(variantEntry);
              }
            });
          }

          possibleVariantIds
            .map((id) => String(id))
            .filter(Boolean)
            .forEach((id) => {
              if (!variantMedia[id]) {
                variantMedia[id] = previewSrc;
              }
            });
        });
      }

      /** @type {ProductData} */
      const normalized = {
        handle,
        url,
        options,
        variants,
        featuredImage,
        featuredMedia,
        images,
        variantMedia: Object.keys(variantMedia).length > 0 ? variantMedia : undefined
      };

      return normalized;
    }

    /**
     * @param {WishlistItem} item
     * @returns {Promise<ProductData | undefined>}
     */
    async fetchProductData(item) {
      const handle = this.getProductHandle(item);
      if (!handle) {
        return undefined;
      }

      if (this.productCache.has(handle)) {
        return this.productCache.get(handle);
      }

      try {
        const response = await fetch(`/products/${handle}.js`);
        if (!response.ok) {
          console.error('Failed to fetch product data for handle', handle, response.status, response.statusText);
          return undefined;
        }

        const rawData = await response.json();
        const normalizedData = this.normalizeProductData(rawData);
        if (!normalizedData) {
          return undefined;
        }

        this.productCache.set(handle, normalizedData);
        return normalizedData;
      } catch (error) {
        console.error('Failed to fetch product data for handle', handle, error);
        return undefined;
      }
    }

    /**
     * @param {string | undefined} baseUrl
     * @param {string | number | undefined} variantId
     * @returns {string}
     */
    buildVariantUrl(baseUrl, variantId) {
      if (!baseUrl) {
        return '';
      }

      const cleanBase = baseUrl.split('?')[0];
      if (!variantId) {
        return cleanBase;
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
      const url = new URL(cleanBase, origin);
      url.searchParams.set('variant', String(variantId));
      return url.pathname + url.search;
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
        this.wishlistProductData.delete(String(productId));
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
      this.wishlistProductData.clear();
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
     * @param {WishlistItem} item
     * @param {Partial<WishlistItem>} updates
     * @returns {boolean}
     */
    updateWishlistItemData(item, updates) {
      let changed = false;
      if (updates.id !== undefined && updates.id !== item.id) {
        item.id = updates.id;
        changed = true;
      }
      if (updates.title !== undefined && updates.title !== item.title) {
        item.title = updates.title;
        changed = true;
      }
      if (updates.image !== undefined && updates.image !== item.image) {
        item.image = updates.image;
        changed = true;
      }
      if (updates.url !== undefined && updates.url !== item.url) {
        item.url = updates.url;
        changed = true;
      }
      if (updates.price !== undefined && updates.price !== item.price) {
        item.price = updates.price;
        changed = true;
      }
      if (updates.variant_id !== undefined && updates.variant_id !== item.variant_id) {
        item.variant_id = updates.variant_id;
        changed = true;
      }
      if (updates.available !== undefined && updates.available !== item.available) {
        item.available = updates.available;
        changed = true;
      }
      if (updates.handle !== undefined && updates.handle !== item.handle) {
        item.handle = updates.handle;
        changed = true;
      }
      return changed;
    }

    /**
     * @param {ProductVariant} variant
     * @returns {string[]}
     */
    getVariantOptionValues(variant) {
      if (Array.isArray(variant.options) && variant.options.length > 0) {
        return variant.options.map(String);
      }

      const values = [];
      if (typeof variant.option1 === 'string') {
        values.push(variant.option1);
      }
      if (typeof variant.option2 === 'string') {
        values.push(variant.option2);
      }
      if (typeof variant.option3 === 'string') {
        values.push(variant.option3);
      }
      return values;
    }

    /**
     * @param {HTMLElement} itemElement
     * @param {ProductData} productData
     * @param {ProductVariant} variant
     */
    setSelectValues(itemElement, productData, variant) {
      const variantValues = this.getVariantOptionValues(variant);
      (productData.options || []).forEach((_, index) => {
        const select = itemElement.querySelector(`select[data-option-index="${index}"]`);
        if (!(select instanceof HTMLSelectElement)) {
          return;
        }

        select.disabled = false;
        const desiredValue = variantValues[index] || '';
        if (desiredValue) {
          const matchingOption = Array.from(select.options).find((optionEl) => optionEl.value === desiredValue && !optionEl.disabled);
          if (matchingOption) {
            select.value = desiredValue;
            return;
          }
        }

        const fallbackOption = Array.from(select.options).find((optionEl) => optionEl.value && !optionEl.disabled);
        select.value = fallbackOption ? fallbackOption.value : '';
      });
    }

    /**
     * @param {string|undefined} src
     * @param {number} [width]
     * @returns {string}
     */
    normalizeImageUrl(src, width = 600) {
      if (!src || typeof src !== 'string') {
        return '';
      }
      if (typeof window === 'undefined' || !window.location) {
        return src;
      }
      try {
        const normalizedSrc = src.startsWith('//') ? `${window.location.protocol}${src}` : src;
        const url = new URL(normalizedSrc, window.location.origin);
        if (!url.searchParams.has('width')) {
          url.searchParams.set('width', String(width));
        }
        return url.toString();
      } catch (_error) {
        return src;
      }
    }

    /**
     * @param {ProductVariant | undefined} variant
     * @param {ProductData | undefined} productData
     * @param {string | undefined} fallback
     * @returns {string}
     */
    resolveProductImage(productData, variant, fallback) {
      const variantId = variant ? String(variant.id) : undefined;

      if (variant && typeof variant.featuredImage === 'string' && variant.featuredImage) {
        return this.normalizeImageUrl(variant.featuredImage);
      }

      if (variantId && productData?.variantMedia && productData.variantMedia[variantId]) {
        return this.normalizeImageUrl(productData.variantMedia[variantId]);
      }

      if (productData?.featuredMedia) {
        return this.normalizeImageUrl(productData.featuredMedia);
      }

      if (productData?.featuredImage) {
        return this.normalizeImageUrl(productData.featuredImage);
      }

      if (Array.isArray(productData?.images) && productData.images.length > 0) {
        return this.normalizeImageUrl(productData.images[0]);
      }

      return fallback ? this.normalizeImageUrl(fallback) : '';
    }

    /**
     * @param {ProductVariant[]} variants
     * @param {(string | undefined)[]} selectedValues
     * @returns {ProductVariant | undefined}
     */
    findVariantByOptions(variants, selectedValues) {
      return variants.find((variant) => {
        const optionValues = Array.isArray(variant.options)
          ? variant.options
          : [variant.option1, variant.option2, variant.option3].filter((value) => typeof value === 'string');

        return selectedValues.every((value, index) => {
          if (value === undefined) return true;
          return optionValues[index] === value;
        });
      });
    }

    /**
     * @param {ProductData} productData
     * @param {WishlistItem} item
     * @param {ProductVariant} selectedVariant
     * @returns {string}
     */
    buildVariantPickerHtml(productData, item, selectedVariant) {
      /** @type {ProductOption[]} */
      const options = Array.isArray(productData.options) ? productData.options : [];
      /** @type {ProductVariant[]} */
      const variants = Array.isArray(productData.variants) ? productData.variants : [];
      if (!options.length || !variants.length) {
        return '<p class="wishlist-variant-picker__unavailable">Variant options unavailable.</p>';
      }

      const selectedOptionValues = this.getVariantOptionValues(selectedVariant);

      /** @type {string[]} */
      const htmlParts = [];

      options.forEach((option, index) => {
        const optionName = typeof option === 'object' && option
          ? option.name
          : String(option ?? `Option ${index + 1}`);

        /** @type {string[]} */
        const optionValues = Array.from(
          new Set(
            variants
              .map((variant) => {
                const variantOptionValues = this.getVariantOptionValues(variant);
                return variantOptionValues[index];
              })
              .filter((value) => typeof value === 'string')
          )
        );

        const selectId = `wishlist-select-${String(item.id)}-${index}`;
        const escapedSelectId = this.escapeHtml(selectId);
        const escapedLabel = this.escapeHtml(optionName);
        const placeholderLabel = this.escapeHtml(`-- ${optionName} --`);

        let selectHtml = `<div class="variant-option variant-option--dropdowns" data-wishlist-option-index="${index}">`;
        selectHtml += '<div class="variant-option__select-wrapper">';
        selectHtml += `<select id="${escapedSelectId}" class="variant-option__select" data-option-index="${index}" aria-label="${escapedLabel}">`;
        selectHtml += `<option value="" disabled>${placeholderLabel}</option>`;

        optionValues.forEach((value) => {
          const escapedValue = this.escapeHtml(value);
          const isSelected = selectedOptionValues[index] === value;
          selectHtml += `<option value="${escapedValue}"${isSelected ? ' selected' : ''}>${escapedValue}</option>`;
        });

        selectHtml += '</select>';
        selectHtml += '<svg class="variant-option__select-icon" viewBox="0 0 10 6" aria-hidden="true" focusable="false"><path d="M0 0h10L5 6z" fill="currentColor"></path></svg>';
        selectHtml += '</div></div>';
        htmlParts.push(selectHtml);
      });

      return `<div class="wishlist-variant-dropdowns" data-option-count="${options.length}">${htmlParts.join('')}</div>`;
    }

    /**
     * @param {string} templateHtml
     * @param {WishlistItem} item
     * @returns {Promise<WishlistRenderResult>}
     */
    async prepareWishlistItem(templateHtml, item) {
      /** @type {WishlistRenderResult} */
      const result = {
        item,
        productData: undefined,
        selectedVariant: undefined,
        html: '',
        storageDirty: false,
        shouldInitVariantPicker: false
      };

      const productData = await this.fetchProductData(item);
      result.productData = productData;

      let selectedVariant;
      if (productData && Array.isArray(productData.variants) && productData.variants.length > 0) {
        selectedVariant = productData.variants.find((variant) => String(variant.id) === String(item.variant_id));
        if (!selectedVariant) {
          selectedVariant = productData.variants.find((variant) => variant.available) || productData.variants[0];
        }
        result.selectedVariant = selectedVariant;
      }

      let renderedItem = templateHtml;

      const fallbackProductUrl = productData?.url || (productData?.handle ? `/products/${productData.handle}` : '');
      const itemBaseUrl = item.url ? item.url.split('?')[0] : undefined;
      const baseUrl = (itemBaseUrl ?? fallbackProductUrl) || '';
      const variantUrl = selectedVariant ? this.buildVariantUrl(baseUrl, selectedVariant.id) : (item.url || baseUrl);
      const imageUrl = this.resolveProductImage(productData, selectedVariant, item.image);
      const price = selectedVariant ? this.formatMoney(selectedVariant.price) : item.price;
      const isAvailable = selectedVariant ? Boolean(selectedVariant.available) : item.available !== false;

      let variantPickerHtml = '';
      let shouldInitVariantPicker = false;

      if (productData && selectedVariant) {
        if (isAvailable) {
          variantPickerHtml = this.buildVariantPickerHtml(productData, item, selectedVariant);
          shouldInitVariantPicker = variantPickerHtml.trim().length > 0;
        }

        const updates = {
          variant_id: selectedVariant.id,
          available: selectedVariant.available,
          price,
          image: imageUrl,
          url: variantUrl,
          handle: productData.handle || this.getProductHandle(item)
        };

        if (this.updateWishlistItemData(item, updates)) {
          result.storageDirty = true;
        }

        this.wishlistProductData.set(String(item.id), {
          productData,
          baseUrl,
          selectedVariant
        });
      } else if (!productData) {
        variantPickerHtml = '';
        this.wishlistProductData.delete(String(item.id));
      } else {
        variantPickerHtml = '';
        this.wishlistProductData.delete(String(item.id));
      }

      renderedItem = renderedItem.replace(/\[\[variant_picker\]\]/g, variantPickerHtml);
      result.shouldInitVariantPicker = shouldInitVariantPicker;

      const safeId = this.escapeHtml(item.id);
      const safeTitle = this.escapeHtml(item.title);
      const safeImage = this.escapeHtml(imageUrl || item.image);
      const safeUrl = this.escapeHtml(variantUrl || item.url);
      const safePrice = this.escapeHtml(price || item.price);
      const safeVariantId = this.escapeHtml(item.variant_id || '');
      const availableValue = isAvailable ? 'true' : 'false';
      const addToCartDisabledAttr = isAvailable ? '' : 'disabled';
      const addToCartAriaDisabled = isAvailable ? '' : 'aria-disabled="true"';
      const variantInputDisabledAttr = isAvailable ? '' : 'disabled';
      const addToCartText = isAvailable ? this.translations.addToCart : this.translations.soldOut;
      const safeAddToCartText = this.escapeHtml(addToCartText);
      const addToCartExtraClass = isAvailable ? '' : ' wishlist-add-to-cart--sold-out';

      renderedItem = renderedItem.replace(/\[\[item_key\]\]/g, safeId);
      renderedItem = renderedItem.replace(/\[\[id\]\]/g, safeId);
      renderedItem = renderedItem.replace(/\[\[title\]\]/g, safeTitle);
      renderedItem = renderedItem.replace(/\[\[image\]\]/g, safeImage);
      renderedItem = renderedItem.replace(/\[\[url\]\]/g, safeUrl);
      renderedItem = renderedItem.replace(/\[\[price\]\]/g, safePrice);
      renderedItem = renderedItem.replace(/\[\[variant_id\]\]/g, safeVariantId);
      renderedItem = renderedItem.replace(/\[\[available\]\]/g, availableValue);
      renderedItem = renderedItem.replace(/\[\[add_to_cart_disabled_attr\]\]/g, addToCartDisabledAttr);
      renderedItem = renderedItem.replace(/\[\[add_to_cart_aria_disabled\]\]/g, addToCartAriaDisabled);
      renderedItem = renderedItem.replace(/\[\[variant_input_disabled_attr\]\]/g, variantInputDisabledAttr);
      renderedItem = renderedItem.replace(/\[\[add_to_cart_text\]\]/g, safeAddToCartText);
      renderedItem = renderedItem.replace(/\[\[add_to_cart_extra_class\]\]/g, addToCartExtraClass);

      result.html = renderedItem;
      return result;
    }

    /**
     * @param {HTMLElement} itemElement
     * @param {WishlistItem} itemRecord
     * @param {ProductData} productData
     * @param {ProductVariant} selectedVariant
     */
    initializeWishlistVariantPicker(itemElement, itemRecord, productData, selectedVariant) {
      const optionsContainer = itemElement.querySelector('.wishlist-item-options');
      if (!optionsContainer) {
        return;
      }

      this.setSelectValues(itemElement, productData, selectedVariant);
      const normalizedValues = this.updateVariantOptionAvailability(itemElement, productData);
      const resolvedVariant = this.findVariantByOptions(productData.variants, normalizedValues) || selectedVariant;
      if (resolvedVariant && resolvedVariant.id !== selectedVariant.id) {
        this.applyVariantSelection(itemElement, itemRecord, productData, resolvedVariant);
      }

      /** @param {Event} event */
      const changeHandler = (event) => {
        if (!(event.target instanceof HTMLSelectElement)) {
          return;
        }
        this.handleWishlistVariantSelection(itemElement, itemRecord, productData);
      };

      optionsContainer.addEventListener('change', changeHandler);
    }

    /**
     * @param {HTMLElement} itemElement
     * @param {ProductData} productData
     * @returns {(string | undefined)[]}
     */
    collectSelectedOptionValues(itemElement, productData) {
      return (productData.options || []).map((_, index) => {
        const select = itemElement.querySelector(`select[data-option-index="${index}"]`);
        if (select instanceof HTMLSelectElement) {
          return select.value || undefined;
        }
        return undefined;
      });
    }

    /**
     * @param {HTMLElement} itemElement
     * @param {ProductData} productData
     * @returns {(string | undefined)[]}
     */
    updateVariantOptionAvailability(itemElement, productData) {
      const normalizedValues = this.collectSelectedOptionValues(itemElement, productData);

      (productData.options || []).forEach((_, optionIndex) => {
        const select = itemElement.querySelector(`select[data-option-index="${optionIndex}"]`);
        if (!(select instanceof HTMLSelectElement)) {
          return;
        }

        const options = Array.from(select.options);
        options.forEach((optionEl) => {
          if (!optionEl.value) {
            return;
          }
          const testValues = [...normalizedValues];
          testValues[optionIndex] = optionEl.value;
          const variant = this.findVariantByOptions(productData.variants, testValues);

          optionEl.disabled = !variant;
          if (variant) {
            optionEl.dataset.available = variant.available ? 'true' : 'false';
            optionEl.dataset.variantId = String(variant.id);
          } else {
            optionEl.dataset.available = 'false';
            optionEl.removeAttribute('data-variant-id');
          }
        });

        const hasSelection = select.value && select.selectedIndex >= 0;
        const selectedOption = hasSelection ? select.options[select.selectedIndex] : undefined;
        if (!hasSelection || !selectedOption || selectedOption.disabled) {
          const fallbackOption = options.find((optionEl) => optionEl.value && !optionEl.disabled);
          if (fallbackOption) {
            select.value = fallbackOption.value;
            normalizedValues[optionIndex] = fallbackOption.value;
          } else {
            select.value = '';
            normalizedValues[optionIndex] = undefined;
          }
        } else {
          normalizedValues[optionIndex] = select.value || undefined;
        }
      });

      return normalizedValues;
    }

    /**
     * @param {HTMLElement} itemElement
     * @param {WishlistItem} itemRecord
     * @param {ProductData} productData
     */
    handleWishlistVariantSelection(itemElement, itemRecord, productData) {
      const normalizedValues = this.updateVariantOptionAvailability(itemElement, productData);
      let variant = this.findVariantByOptions(productData.variants, normalizedValues);

      if (!variant) {
        variant = productData.variants.find((candidate) => candidate.available) || productData.variants[0];
        if (!variant) {
          this.applyVariantUnavailableState(itemElement, itemRecord);
          return;
        }

        this.setSelectValues(itemElement, productData, variant);
        this.updateVariantOptionAvailability(itemElement, productData);
      }

      this.applyVariantSelection(itemElement, itemRecord, productData, variant);
    }

    /**
     * @param {HTMLElement} itemElement
     * @param {WishlistItem} itemRecord
     */
    applyVariantUnavailableState(itemElement, itemRecord) {
      const button = itemElement.querySelector('.wishlist-add-to-cart');
      const variantInput = itemElement.querySelector('input[ref="variantId"]');
      if (button instanceof HTMLButtonElement) {
        button.disabled = true;
        button.classList.add('wishlist-add-to-cart--sold-out');
        button.setAttribute('aria-disabled', 'true');
        const textContentEl = button.querySelector('.add-to-cart-text__content');
        if (textContentEl instanceof HTMLElement) {
          textContentEl.textContent = this.translations.soldOut;
        }
        button.dataset.variantAvailable = 'false';
        button.dataset.variantId = '';
      }
      if (variantInput instanceof HTMLInputElement) {
        variantInput.value = '';
        variantInput.disabled = true;
      }
      const selects = itemElement.querySelectorAll('.variant-option__select');
      selects.forEach((select) => {
        if (select instanceof HTMLSelectElement) {
          select.disabled = true;
        }
      });
      itemRecord.available = false;
      itemRecord.variant_id = '';
      this.saveToStorage();
    }

    /**
     * @param {HTMLElement} itemElement
     * @param {WishlistItem} itemRecord
     * @param {ProductData} productData
     * @param {ProductVariant} variant
     */
    applyVariantSelection(itemElement, itemRecord, productData, variant) {
      const existingState = this.wishlistProductData.get(String(itemRecord.id));
      const fallbackProductUrl = productData.url || (productData.handle ? `/products/${productData.handle}` : '');
      const itemBaseUrl = itemRecord.url ? itemRecord.url.split('?')[0] : undefined;
      const baseUrl = (existingState?.baseUrl ?? itemBaseUrl ?? fallbackProductUrl) || '';
      const variantUrl = this.buildVariantUrl(baseUrl, variant.id);
      const price = this.formatMoney(variant.price);
      const imageUrl = this.resolveProductImage(productData, variant, itemRecord.image);

      this.setSelectValues(itemElement, productData, variant);
      this.updateVariantOptionAvailability(itemElement, productData);

      const variantInput = itemElement.querySelector('input[ref="variantId"]');
      if (variantInput instanceof HTMLInputElement) {
        variantInput.value = String(variant.id);
        variantInput.disabled = !variant.available;
      }

      const button = itemElement.querySelector('.wishlist-add-to-cart');
      if (button instanceof HTMLButtonElement) {
        button.dataset.variantId = String(variant.id);
        button.dataset.productPrice = price;
        button.dataset.variantAvailable = variant.available ? 'true' : 'false';
        button.dataset.productUrl = variantUrl;
        if (imageUrl) {
          button.dataset.productImage = imageUrl;
        }
        button.disabled = !variant.available;
        if (variant.available) {
          button.classList.remove('wishlist-add-to-cart--sold-out');
          button.removeAttribute('aria-disabled');
          const textContentEl = button.querySelector('.add-to-cart-text__content');
          if (textContentEl instanceof HTMLElement) {
            textContentEl.textContent = this.translations.addToCart;
          }
        } else {
          button.classList.add('wishlist-add-to-cart--sold-out');
          button.setAttribute('aria-disabled', 'true');
          const textContentEl = button.querySelector('.add-to-cart-text__content');
          if (textContentEl instanceof HTMLElement) {
            textContentEl.textContent = this.translations.soldOut;
          }
        }
      }

      const priceElement = itemElement.querySelector('.wishlist-item-price');
      if (priceElement) {
        priceElement.textContent = price;
      }

      const imageElement = itemElement.querySelector('.wishlist-item-image img');
      if (imageElement instanceof HTMLImageElement && imageUrl) {
        imageElement.src = imageUrl;
      }

      const selects = itemElement.querySelectorAll('.variant-option__select');
      selects.forEach((select) => {
        if (select instanceof HTMLSelectElement) {
          select.disabled = false;
        }
      });

      const linkElements = itemElement.querySelectorAll('.wishlist-item-title a, .wishlist-item-image a');
      linkElements.forEach((link) => {
        if (link instanceof HTMLAnchorElement) {
          link.href = variantUrl;
        }
      });

      const dataUpdates = {
        variant_id: variant.id,
        available: variant.available,
        price,
        image: imageUrl,
        url: variantUrl,
        handle: productData.handle || this.getProductHandle(itemRecord)
      };

      if (this.updateWishlistItemData(itemRecord, dataUpdates)) {
        this.saveToStorage();
      }

      this.wishlistProductData.set(String(itemRecord.id), {
        productData,
        baseUrl,
        selectedVariant: variant
      });
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

    async renderWishlistPage() {
      try {
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

        const templateHtml = template.innerHTML;
        /** @type {WishlistRenderResult[]} */
        const renderResults = await Promise.all(
          items.map((wishlistItem) => this.prepareWishlistItem(templateHtml, wishlistItem))
        );

        wishlistContainer.innerHTML = renderResults.map((result) => result.html).join('');

        renderResults.forEach((result) => {
          if (result.productData && result.selectedVariant && result.shouldInitVariantPicker) {
            const selector = `.wishlist-item[data-wishlist-key="${this.escapeSelector(String(result.item.id))}"]`;
            const itemElement = wishlistContainer.querySelector(selector);
            if (itemElement instanceof HTMLElement) {
              this.initializeWishlistVariantPicker(itemElement, result.item, result.productData, result.selectedVariant);
            }
          }
        });

        if (renderResults.some((result) => result.storageDirty)) {
          this.saveToStorage();
        }
      } catch (error) {
        console.error('Failed to render wishlist page', error);
      }
    }
  }

  // Initialize simplified wishlist controller
  new SimpleWishlistController();

})();
