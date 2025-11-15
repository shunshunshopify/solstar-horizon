/**
 * Global YouTube Manager
 * Centralizes YouTube API loading and player management to prevent multiple API loads
 */
class YouTubeManager {
  constructor() {
    /** @type {boolean} */
    this.isApiLoaded = false;
    /** @type {boolean} */
    this.isApiLoading = false;
    /** @type {Array<function(): void>} */
    this.pendingCallbacks = [];
    /** @type {Map<string, any>} */
    this.players = new Map();
    this.init();
  }

  init() {
    // Set up global callback if not already set
    // @ts-ignore - onYouTubeIframeAPIReady is added by YouTube API
    if (!window.onYouTubeIframeAPIReady) {
      // @ts-ignore - onYouTubeIframeAPIReady is added by YouTube API
      window.onYouTubeIframeAPIReady = () => {
        this.isApiLoaded = true;
        this.isApiLoading = false;
        console.log('YouTube API loaded successfully');
        
        // Execute all pending callbacks
        this.pendingCallbacks.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('Error executing YouTube callback:', error);
          }
        });
        this.pendingCallbacks = [];
      };
    }
  }

  /**
   * Load YouTube API if not already loaded
   * @returns {Promise<void>} Promise that resolves when API is ready
   */
  loadAPI() {
    return new Promise((resolve, reject) => {
      // API already loaded
      // @ts-ignore - YT is added to window by YouTube API
      if (this.isApiLoaded || (window.YT && window.YT.Player)) {
        this.isApiLoaded = true;
        resolve();
        return;
      }

      // Add to pending callbacks - wrap resolve to match expected signature
      this.pendingCallbacks.push(() => resolve());

      // API already loading, wait for it
      if (this.isApiLoading || document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        return;
      }

      // Load the API
      this.isApiLoading = true;
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.onerror = () => {
        this.isApiLoading = false;
        reject(new Error('Failed to load YouTube API'));
      };
      
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    });
  }

  /**
   * Create a YouTube player
   * @param {string} containerId - ID of the container element
   * @param {string} videoId - YouTube video ID
   * @param {Object} options - Player configuration options
   * @returns {Promise<any>} Promise that resolves with the player instance
   */
  async createPlayer(containerId, videoId, options = {}) {
    try {
      await this.loadAPI();

      const defaultOptions = {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          loop: 1,
          playlist: videoId, // Required for loop
          controls: 0,
          showinfo: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          fs: 0
        },
        events: {
          onReady: (/** @type {any} */ event) => {
            console.log(`YouTube player ready: ${containerId}`);
            event.target.mute();
            event.target.playVideo();
          },
          onError: (/** @type {any} */ event) => {
            console.error(`YouTube player error for ${containerId}:`, event.data);
            this.handlePlayerError(event.data, videoId, containerId);
          }
        }
      };

      // Merge with custom options
      const playerOptions = this.mergeOptions(defaultOptions, options);

      // Create player - YT is loaded by the YouTube API
      // @ts-ignore - YT is added to window by YouTube API
      const player = new window.YT.Player(containerId, playerOptions);
      
      // Store player reference
      this.players.set(containerId, {
        player: player,
        videoId: videoId,
        options: playerOptions
      });

      return player;
    } catch (error) {
      console.error(`Failed to create YouTube player for ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Handle player errors with graceful fallbacks
   * @param {number} errorCode - YouTube error code
   * @param {string} videoId - Video ID that failed
   * @param {string} containerId - Container ID
   */
  handlePlayerError(errorCode, videoId, containerId) {
    /** @type {Record<number, string>} */
    const errorMessages = {
      2: 'Invalid video ID',
      5: 'HTML5 player error',
      100: 'Video not found or private',
      101: 'Video not allowed to be embedded',
      150: 'Video not allowed to be embedded'
    };

    const message = errorMessages[errorCode] || 'Unknown error';
    console.error(`YouTube Error ${errorCode}: ${message} for video ${videoId}`);

    // Could implement fallback video here
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #000;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="text-align: center;">
            <p>Video unavailable</p>
            <small>${message}</small>
          </div>
        </div>
      `;
    }
  }

  /**
   * Deep merge options objects
   * @param {any} defaults - Default options
   * @param {any} custom - Custom options
   * @returns {any} Merged options
   */
  mergeOptions(defaults, custom) {
    const result = { ...defaults };
    
    Object.keys(custom).forEach(key => {
      const customValue = custom[key];
      const defaultValue = defaults[key];
      
      if (typeof customValue === 'object' && customValue !== null && !Array.isArray(customValue)) {
        result[key] = this.mergeOptions(defaultValue || {}, customValue);
      } else {
        result[key] = customValue;
      }
    });

    return result;
  }

  /**
   * Destroy a player and clean up references
   * @param {string} containerId - Container ID
   */
  destroyPlayer(containerId) {
    const playerData = this.players.get(containerId);
    if (playerData && playerData.player && typeof playerData.player.destroy === 'function') {
      try {
        playerData.player.destroy();
      } catch (error) {
        console.error(`Error destroying player ${containerId}:`, error);
      }
    }
    this.players.delete(containerId);
  }

  /**
   * Get player instance by container ID
   * @param {string} containerId - Container ID
   * @returns {Object|null} Player data or null
   */
  getPlayer(containerId) {
    return this.players.get(containerId) || null;
  }

  /**
   * Extract YouTube video ID from various URL formats
   * @param {string} url - YouTube URL
   * @returns {string|null} Video ID or null if not found
   */
  extractVideoId(url) {
    if (!url) return null;

    const patterns = [
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*&v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }
}

// Create global instance with proper type handling
// @ts-ignore - Adding YouTubeManager to window object
window.YouTubeManager = window.YouTubeManager || new YouTubeManager();

// @ts-ignore - Accessing YouTubeManager from window object
export default window.YouTubeManager;