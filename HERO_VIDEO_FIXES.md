# Hero Video Section - Recommended Fixes

## Critical Issues to Fix

### 1. CSS Height System Cleanup
**Problem**: Duplicate and conflicting height rules
**Solution**: Consolidate height system

```css
/* Remove mobile-first heights, use single responsive system */
.hero--450px { height: 450px; }
.hero--550px { height: 550px; }
.hero--650px { height: 650px; }
.hero--750px { height: 750px; }
.hero--100vh { height: 100vh; }
.hero--16-9 { height: 0; padding-bottom: 56.25%; position: relative; }

@media (max-width: 589px) {
  .hero--450px { height: 292.5px; }
  .hero--550px { height: 357.5px; }
  .hero--650px { height: 422.5px; }
  .hero--750px { height: 487.5px; }
  .hero--100vh { height: 90vh; }
}
```

### 2. Remove Unused CSS
**Problem**: Unused classes increase file size
**Solution**: Remove these unused classes:

```css
/* REMOVE THESE */
.hero--natural[data-natural]
[data-mobile-natural=true]
[data-mobile-natural=false]
[data-dots=true]
.icon-ng
```

### 3. Centralize YouTube API Loading
**Problem**: Multiple sections loading same API
**Solution**: Create global YouTube manager

```javascript
// Create global YouTube manager
window.HeroVideoManager = {
  apiLoaded: false,
  pendingPlayers: [],
  
  loadAPI() {
    if (!this.apiLoaded && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      
      window.onYouTubeIframeAPIReady = () => {
        this.apiLoaded = true;
        this.pendingPlayers.forEach(player => player.init());
        this.pendingPlayers = [];
      };
    }
  },
  
  addPlayer(playerConfig) {
    if (this.apiLoaded) {
      playerConfig.init();
    } else {
      this.pendingPlayers.push(playerConfig);
      this.loadAPI();
    }
  }
};
```

### 4. Fix Inline Styles
**Problem**: Too many inline styles
**Solution**: Move to external CSS with CSS custom properties

```css
/* In hero-video.css */
.hero-section {
  --title-size-mobile: 40px;
  --title-size-desktop: 80px;
  --subtitle-size-mobile: 16px;
  --subtitle-size-desktop: 40px;
  --overlay-opacity: 0;
}

.hero-section .hero__title {
  font-size: var(--title-size-mobile);
  margin: 30px 0 0 0;
}

@media (min-width: 769px) {
  .hero-section .hero__title {
    font-size: var(--title-size-desktop);
  }
}
```

### 5. Improve Video ID Extraction
**Problem**: Edge cases not handled
**Solution**: Robust extraction function

```liquid
{% comment %} Improved video ID extraction {% endcomment %}
{% assign video_id = '' %}
{% assign clean_url = current_video_url | strip %}

{% if clean_url contains 'youtu.be/' %}
  {% assign url_parts = clean_url | split: 'youtu.be/' %}
  {% if url_parts.size > 1 %}
    {% assign id_part = url_parts[1] | split: '?' | first | split: '&' | first | split: '#' | first %}
    {% if id_part.size == 11 %}
      {% assign video_id = id_part %}
    {% endif %}
  {% endif %}
{% elsif clean_url contains 'youtube.com' %}
  {% if clean_url contains 'v=' %}
    {% assign url_parts = clean_url | split: 'v=' %}
    {% if url_parts.size > 1 %}
      {% assign id_part = url_parts[1] | split: '&' | first | split: '#' | first %}
      {% if id_part.size == 11 %}
        {% assign video_id = id_part %}
      {% endif %}
    {% endif %}
  {% elsif clean_url contains 'embed/' %}
    {% assign url_parts = clean_url | split: 'embed/' %}
    {% if url_parts.size > 1 %}
      {% assign id_part = url_parts[1] | split: '?' | first | split: '&' | first | split: '/' | first %}
      {% if id_part.size == 11 %}
        {% assign video_id = id_part %}
      {% endif %}
    {% endif %}
  {% endif %}
{% endif %}
```

### 6. Add Accessibility Features
**Problem**: Missing accessibility support
**Solution**: Add ARIA labels and reduced motion support

```liquid
<!-- Add to video elements -->
<video 
  id="Mp4Video-{{ section.id }}"
  class="video-div"
  src="{{ current_video_url }}"
  aria-label="Background video for {{ section.settings.title | default: 'hero section' }}"
  loop muted playsinline autoplay>
</video>
```

```css
/* Add reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .hero__media video,
  .youtube-video-container iframe {
    animation: none;
  }
  
  /* Pause videos for users who prefer reduced motion */
  .hero__media video {
    animation-play-state: paused;
  }
}
```

### 7. Improve Error Handling
**Problem**: No fallback for failed videos
**Solution**: Add comprehensive error handling

```javascript
// Add to YouTube player creation
function createPlayerWithFallback() {
  try {
    const player = new YT.Player('youtube-player-{{ section.id }}', {
      // ... existing config
      events: {
        onError: function(event) {
          console.error('YouTube player error:', event.data);
          
          // Fallback to default video if custom video fails
          if (event.data === 100 || event.data === 101 || event.data === 150) {
            console.log('Loading fallback video...');
            loadFallbackVideo();
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to create YouTube player:', error);
    loadFallbackVideo();
  }
}

function loadFallbackVideo() {
  const container = document.getElementById('youtube-player-{{ section.id }}');
  container.innerHTML = '<div class="video-error">Video temporarily unavailable</div>';
}
```

## Performance Optimizations

### 1. Lazy Load YouTube API
Only load when hero video is in viewport

### 2. Preload Critical CSS
Move critical hero video styles to inline CSS in `<head>`

### 3. Optimize Video Loading
Add loading="lazy" for videos below the fold

### 4. Debounce Resize Events
Prevent excessive resize calculations

```javascript
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedResize = debounce(resizeVideo, 100);
window.addEventListener('resize', debouncedResize);
```

## Code Quality Improvements

### 1. Add TypeScript Definitions
Create type definitions for better development experience

### 2. Add JSDoc Comments
Document all functions and parameters

### 3. Use Modern JavaScript
Replace var with const/let, use arrow functions consistently

### 4. Add CSS Custom Properties
Make the section more themeable and maintainable

### 5. Improve Naming Conventions
Use BEM methodology for CSS classes