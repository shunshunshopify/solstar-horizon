/**
 * Global YouTube Manager
 * Centralizes YouTube API loading and player management to prevent multiple API loads
 */
class YouTubeManager {
  constructor() {
    this.isApiLoaded = false;
    this.isApiLoading = false;
    this.pendingCallbacks = [];
    this.players = new Map();
    this.init();
  }

  init() {
    // Set up global callback if not already set
    if (!window.onYouTubeIframeAPIReady) {
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
   * @returns {Promise} Promise that resolves when API is ready
   */
  loadAPI() {
    return new Promise((resolve, reject) => {
      // API already loaded
      if (this.isApiLoaded || (window.YT && window.YT.Player)) {
        this.isApiLoaded = true;
        resolve();
        return;
      }

      // Add to pending callbacks
      this.pendingCallbacks.push(resolve);

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
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    });
  }

  /**
   * Create a YouTube player
   * @param {string} containerId - ID of the container element
   * @param {string} videoId - YouTube video ID
   * @param {Object} options - Player configuration options
   * @returns {Promise} Promise that resolves with the player instance
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
          onReady: (event) => {
            console.log(`YouTube player ready: ${containerId}`);
            event.target.mute();
            event.target.playVideo();
          },
          onError: (event) => {
            console.error(`YouTube player error for ${containerId}:`, event.data);
            this.handlePlayerError(event.data, videoId, containerId);
          }
        }
      };

      // Merge with custom options
      const playerOptions = this.mergeOptions(defaultOptions, options);

      // Create player
      const player = new YT.Player(containerId, playerOptions);
      
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
   * @param {Object} defaults - Default options
   * @param {Object} custom - Custom options
   * @returns {Object} Merged options
   */
  mergeOptions(defaults, custom) {
    const result = { ...defaults };
    
    Object.keys(custom).forEach(key => {
      if (typeof custom[key] === 'object' && custom[key] !== null && !Array.isArray(custom[key])) {
        result[key] = this.mergeOptions(defaults[key] || {}, custom[key]);
      } else {
        result[key] = custom[key];
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
      if (match) {
        return match[1];
      }
    }

    return null;
  }
}

// Create global instance
window.YouTubeManager = window.YouTubeManager || new YouTubeManager();

export default window.YouTubeManager;