/**
 * Bottom Menu Component
 * Mobile-first navigation with popup functionality
 */

// @ts-nocheck - Disable TypeScript checking for this file due to DOM API usage
class BottomMenu {
  constructor() {
    // Configuration
    this.config = {
      selectors: {
        menu: '.bottom-menu',
        item: '.bottom-menu__item',
        link: '.bottom-menu__link',
        popup: '.bottom-menu__popup',
        close: '.bottom-menu__close',
        badge: '.bottom-menu__badge'
      },
      classes: {
        active: 'bottom-menu__popup--active',
        hidden: 'visually-hidden'
      },
      attributes: {
        expanded: 'aria-expanded',
        controls: 'aria-controls',
        labelledby: 'aria-labelledby'
      }
    };

    // State management
    this.state = {
      activePopup: null,
      isInitialized: false
    };

    // Bind methods
    this.handleItemClick = this.handleItemClick.bind(this);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.handleEscapeKey = this.handleEscapeKey.bind(this);
    this.updateCartCounter = this.updateCartCounter.bind(this);
    this.updateWishlistCounter = this.updateWishlistCounter.bind(this);
  }

  /**
   * Initialize the bottom menu component
   */
  init() {
    if (this.state.isInitialized) return;

    try {
      this.setupEventListeners();
      this.setupAccessibility();
      this.setupCartEventListeners();
      this.updateCounters();
      this.state.isInitialized = true;
      
      // Dispatch custom event for initialization
      // @ts-ignore - Document event dispatch
      document.dispatchEvent(new CustomEvent('bottom-menu:initialized', {
        detail: { component: this }
      }));
    } catch (error) {
      console.error('BottomMenu initialization failed:', error);
    }
  }

  /**
   * Setup event listeners for menu interactions
   */
  setupEventListeners() {
    const menu = document.querySelector(this.config.selectors.menu);
    if (!menu) return;

    // Menu item clicks
    const items = menu.querySelectorAll(this.config.selectors.item);
    items.forEach(item => {
      const link = item.querySelector(this.config.selectors.link);
      // @ts-ignore - Element type checking
      if (link && this.hasPopup(item)) {
        link.addEventListener('click', this.handleItemClick);
      }
    });

    // Close button clicks
    const closeButtons = document.querySelectorAll(this.config.selectors.close);
    closeButtons.forEach(button => {
      button.addEventListener('click', this.handleCloseClick);
    });

    // Outside clicks and escape key
    document.addEventListener('click', this.handleOutsideClick);
    document.addEventListener('keydown', this.handleEscapeKey);

    // Cart updates
    document.addEventListener('cart:updated', this.updateCartCounter);
    
    // Wishlist updates (if available)
    if (window.wishlist) {
      document.addEventListener('wishlist:updated', this.updateWishlistCounter);
    }
  }

  /**
   * Setup accessibility attributes
   */
  setupAccessibility() {
    const menu = document.querySelector(this.config.selectors.menu);
    if (!menu) return;

    // Set menu role and label
    menu.setAttribute('role', 'navigation');
    menu.setAttribute('aria-label', 'Bottom navigation menu');

    const items = menu.querySelectorAll(this.config.selectors.item);
    items.forEach((item, index) => {
      const link = item.querySelector(this.config.selectors.link);
      const popup = this.getPopupForItem(item);
      
      if (link && popup) {
        const popupId = popup.id || `bottom-menu-popup-${index}`;
        popup.id = popupId;
        
        // Setup ARIA attributes for popup triggers
        link.setAttribute(this.config.attributes.expanded, 'false');
        link.setAttribute(this.config.attributes.controls, popupId);
        
        // Setup popup attributes
        popup.setAttribute('role', 'dialog');
        popup.setAttribute(this.config.attributes.labelledby, link.id || `bottom-menu-trigger-${index}`);
        link.id = link.id || `bottom-menu-trigger-${index}`;
      }
    });
  }

  /**
   * Setup cart event listeners for real-time updates
   */
  setupCartEventListeners() {
    // Import ThemeEvents properly - the theme uses 'cart:update' as the event name
    this.handleCartUpdate = this.handleCartUpdate.bind(this);
    
    // Listen to the correct theme cart update event
    document.addEventListener('cart:update', this.handleCartUpdate);
    
    // Setup global openCartDrawer function for cart button onclick
    if (!window.openCartDrawer) {
      window.openCartDrawer = this.openCartDrawer.bind(this);
    }
  }

  /**
   * Handle cart update events from the theme
   * @param {CustomEvent} event - Cart update event
   */
  handleCartUpdate(event) {
    try {
      console.log('Bottom Menu - Handling cart update:', event.type, event.detail);
      
      // Check if this is a CartAddEvent (adding items) or CartUpdateEvent (updating existing)
      const source = event.detail?.data?.source;
      
      if (source === 'product-form-component') {
        // This is a CartAddEvent - itemCount is quantity being added, not total
        // We need to fetch the current cart count instead
        console.log('Bottom Menu - Cart add event detected, fetching current cart count');
        this.fetchCartCount();
      } else if (source === 'cart-items-component') {
        // This is a CartUpdateEvent - itemCount is the total cart count
        const itemCount = event.detail?.data?.itemCount ?? 0;
        console.log('Bottom Menu - Cart update event with total count:', itemCount);
        this.updateCartBubble(itemCount);
      } else {
        // Fallback: Fetch current cart count for unknown sources
        console.log('Bottom Menu - Unknown cart event source, fetching current cart count');
        this.fetchCartCount();
      }
    } catch (error) {
      console.error('Failed to handle cart update event:', error);
      // Fallback: Fetch current cart count
      this.fetchCartCount();
    }
  }

  /**
   * Fetch cart count from API
   */
  async fetchCartCount() {
    try {
      const response = await fetch(window.Theme?.routes?.cart_count || '/cart.json');
      const data = await response.json();
      const itemCount = data.item_count || 0;
      console.log('Bottom Menu - Fetched cart count:', itemCount);
      this.updateCartBubble(itemCount);
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  }

  /**
   * Update the cart bubble count
   * @param {number} count - Number of items in cart
   */
  updateCartBubble(count) {
    try {
      console.log('Bottom Menu - Updating cart bubble with count:', count);
      
      // Find cart bubble using the correct selector - cart-bubble component uses ref="cartBubble"
      const cartBubble = document.querySelector('.bottom-menu [ref="cartBubble"]');
      const cartBubbleCount = document.querySelector('.bottom-menu [ref="cartBubbleCount"]');
      
      console.log('Bottom Menu - Cart bubble element:', cartBubble);
      console.log('Bottom Menu - Cart bubble count element:', cartBubbleCount);
      
      if (cartBubble && cartBubbleCount) {
        // Update visibility
        if (count > 0) {
          cartBubble.classList.remove('visually-hidden');
        } else {
          cartBubble.classList.add('visually-hidden');
        }
        
        // Update count text
        cartBubbleCount.textContent = count.toString();
        
        console.log('Bottom Menu - Cart bubble updated successfully');
      } else {
        console.warn('Bottom Menu - Cart bubble elements not found');
        console.log('Available cart bubble elements:', document.querySelectorAll('[ref*="cart"]'));
      }
    } catch (error) {
      console.error('Failed to update cart bubble:', error);
    }
  }

  /**
   * Open the cart drawer (global function for onclick)
   */
  openCartDrawer() {
    try {
      const cartDrawer = document.querySelector('cart-drawer-component');
      if (cartDrawer && typeof cartDrawer.open === 'function') {
        cartDrawer.open();
      } else {
        console.warn('Cart drawer component not found or does not have open method');
      }
    } catch (error) {
      console.error('Failed to open cart drawer:', error);
    }
  }

  /**
   * Handle menu item clicks
   * @param {Event} event - Click event
   */
  handleItemClick(event) {
    const link = event.currentTarget;
    const item = link.closest(this.config.selectors.item);
    const popup = this.getPopupForItem(item);

    if (!popup) return;

    event.preventDefault();
    
    if (this.isPopupActive(popup)) {
      this.closePopup(popup);
    } else {
      this.closeAllPopups();
      this.openPopup(popup, link);
    }
  }

  /**
   * Handle close button clicks
   * @param {Event} event - Click event
   */
  handleCloseClick(event) {
    event.preventDefault();
    const popup = event.currentTarget.closest(this.config.selectors.popup);
    if (popup) {
      this.closePopup(popup);
    }
  }

  /**
   * Handle clicks outside of popups
   * @param {Event} event - Click event
   */
  handleOutsideClick(event) {
    const menu = document.querySelector(this.config.selectors.menu);
    const activePopup = document.querySelector(`.${this.config.classes.active}`);
    
    if (activePopup && !menu.contains(event.target) && !activePopup.contains(event.target)) {
      this.closePopup(activePopup);
    }
  }

  /**
   * Handle escape key presses
   * @param {Event} event - Keydown event
   */
  handleEscapeKey(event) {
    if (event.key === 'Escape') {
      const activePopup = document.querySelector(`.${this.config.classes.active}`);
      if (activePopup) {
        this.closePopup(activePopup);
      }
    }
  }

  /**
   * Open a popup
   * @param {HTMLElement} popup - Popup element
   * @param {HTMLElement} trigger - Trigger element
   */
  openPopup(popup, trigger) {
    if (!popup) return;

    popup.classList.add(this.config.classes.active);
    this.state.activePopup = popup;

    // Update ARIA attributes
    if (trigger) {
      trigger.setAttribute(this.config.attributes.expanded, 'true');
    }

    // Focus management
    this.focusPopup(popup);

    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('bottom-menu:popup-opened', {
      detail: { popup, trigger }
    }));
  }

  /**
   * Close a popup
   * @param {HTMLElement} popup - Popup element
   */
  closePopup(popup) {
    if (!popup) return;

    popup.classList.remove(this.config.classes.active);
    
    // Update ARIA attributes
    const triggerId = popup.getAttribute(this.config.attributes.labelledby);
    const trigger = triggerId ? document.getElementById(triggerId) : null;
    
    if (trigger) {
      trigger.setAttribute(this.config.attributes.expanded, 'false');
      trigger.focus(); // Return focus to trigger
    }

    this.state.activePopup = null;

    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('bottom-menu:popup-closed', {
      detail: { popup, trigger }
    }));
  }

  /**
   * Close all popups
   */
  closeAllPopups() {
    const activePopups = document.querySelectorAll(`.${this.config.classes.active}`);
    activePopups.forEach(popup => this.closePopup(popup));
  }

  /**
   * Focus the popup for accessibility
   * @param {HTMLElement} popup - Popup element
   */
  focusPopup(popup) {
    // Focus the close button if available, otherwise the popup itself
    const closeButton = popup.querySelector(this.config.selectors.close);
    const focusTarget = closeButton || popup;
    
    if (focusTarget) {
      focusTarget.focus();
    }
  }

  /**
   * Update cart counter badge (legacy method - now handled by updateCartBubble)
   */
  async updateCartCounter() {
    // Legacy method - cart updates are now handled by the cart bubble system
    // This method is kept for backward compatibility with other event listeners
    this.fetchCartCount();
  }

  /**
   * Update wishlist counter badge
   */
  updateWishlistCounter() {
    try {
      const wishlistBubble = document.querySelector('[data-wishlist-bubble]');
      const wishlistCount = document.querySelector('[data-wishlist-count]');
      const wishlistCountText = document.querySelector('[data-wishlist-count-text]');
      const wishlistIcon = document.querySelector('.bottom-menu__wishlist-icon');
      
      if (wishlistBubble && wishlistCount && wishlistCountText && wishlistIcon) {
        const count = window.wishlist && window.wishlist.getCount ? window.wishlist.getCount() : 0;
        
        // Update counter text
        wishlistCount.textContent = count;
        wishlistCountText.textContent = count;
        
        // Show/hide bubble based on count
        if (count > 0) {
          wishlistBubble.classList.remove('visually-hidden');
          wishlistIcon.classList.add('bottom-menu__wishlist-icon--has-items');
        } else {
          wishlistBubble.classList.add('visually-hidden');
          wishlistIcon.classList.remove('bottom-menu__wishlist-icon--has-items');
        }
      }
    } catch (error) {
      console.error('Failed to update wishlist counter:', error);
    }
  }

  /**
   * Update all counters
   */
  updateCounters() {
    this.fetchCartCount(); // Get current cart count for bottom menu bubble
    this.updateWishlistCounter();
  }

  /**
   * Check if item has a popup
   * @param {HTMLElement} item - Menu item element
   * @returns {boolean}
   */
  hasPopup(item) {
    return this.getPopupForItem(item) !== null;
  }

  /**
   * Get popup element for a menu item
   * @param {HTMLElement} item - Menu item element
   * @returns {HTMLElement|null}
   */
  getPopupForItem(item) {
    const link = item.querySelector(this.config.selectors.link);
    if (!link) return null;

    const controlsId = link.getAttribute(this.config.attributes.controls);
    if (controlsId) {
      return document.getElementById(controlsId);
    }

    // Fallback: look for popup with matching data attribute or class
    const itemType = item.dataset.type || item.className.match(/bottom-menu__item--(\w+)/)?.[1];
    if (itemType) {
      return document.querySelector(`[data-popup="${itemType}"], .bottom-menu__popup--${itemType}`);
    }

    return null;
  }

  /**
   * Check if popup is currently active
   * @param {HTMLElement} popup - Popup element
   * @returns {boolean}
   */
  isPopupActive(popup) {
    return popup && popup.classList.contains(this.config.classes.active);
  }

  /**
   * Destroy the component and clean up event listeners
   */
  destroy() {
    if (!this.state.isInitialized) return;

    // Remove event listeners
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('keydown', this.handleEscapeKey);
    document.removeEventListener('cart:updated', this.updateCartCounter);
    document.removeEventListener('wishlist:updated', this.updateWishlistCounter);
    document.removeEventListener('cart:update', this.handleCartUpdate);
    
    // Remove global openCartDrawer function
    if (window.openCartDrawer === this.openCartDrawer) {
      delete window.openCartDrawer;
    }

    // Remove menu-specific listeners
    const menu = document.querySelector(this.config.selectors.menu);
    if (menu) {
      const items = menu.querySelectorAll(this.config.selectors.item);
      items.forEach(item => {
        const link = item.querySelector(this.config.selectors.link);
        if (link) {
          link.removeEventListener('click', this.handleItemClick);
        }
      });
    }

    const closeButtons = document.querySelectorAll(this.config.selectors.close);
    closeButtons.forEach(button => {
      button.removeEventListener('click', this.handleCloseClick);
    });

    // Close all popups
    this.closeAllPopups();

    // Reset state
    this.state.isInitialized = false;
    this.state.activePopup = null;

    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('bottom-menu:destroyed'));
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const bottomMenu = new BottomMenu();
  bottomMenu.init();
  
  // Make available globally for debugging
  window.bottomMenu = bottomMenu;
});

// Handle page transitions if view transitions are enabled
document.addEventListener('astro:page-load', () => {
  if (window.bottomMenu) {
    window.bottomMenu.init();
  }
});