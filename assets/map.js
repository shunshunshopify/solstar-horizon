const MAP_STYLES = {
  basic: [],
  light: [
    { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] }
  ],
  white_label: [
    { elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#b1b1b1' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#f2f2f2' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ededed' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e3e3e3' }] }
  ],
  dark_label: [
    { elementType: 'geometry', stylers: [{ color: '#1f1f1f' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1f1f1f' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
    { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#444444' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b3b3b3' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#111111' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#5f5f5f' }] }
  ]
};

const loadGoogleMaps = (apiKey) => {
  if (window.google && window.google.maps) return Promise.resolve(window.google.maps);

  if (!window.__googleMapsLoadingPromise) {
    window.__googleMapsLoadingPromise = new Promise((resolve, reject) => {
      const callbackName = `initMapCallback_${Date.now()}`;
      window[callbackName] = () => {
        resolve(window.google.maps);
        delete window[callbackName];
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error('Google Maps failed to load'));
      document.head.appendChild(script);
    }).catch((error) => {
      console.error('[Map] Google Maps load error', error);
      throw error;
    });
  }

  return window.__googleMapsLoadingPromise;
};

class MapComponent extends HTMLElement {
  constructor() {
    super();
    this.handleResize = this.handleResize.bind(this);
  }

  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;
    this.initMap();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
  }

  async initMap() {
    const apiKey = this.dataset.apiKey;
    if (!apiKey) {
      console.error('[Map] Missing Google Maps API key');
      return;
    }

    try {
      const maps = await loadGoogleMaps(apiKey);
      const location = await this.resolveLocation(maps);

      if (!location) {
        console.error('[Map] No valid location provided');
        return;
      }

      const mapStyle = MAP_STYLES[this.dataset.style] || MAP_STYLES.basic;
      const zoom = Number(this.dataset.zoom) || 14;

      this.map = new maps.Map(this, {
        center: location,
        zoom,
        disableDefaultUI: true,
        styles: mapStyle,
        backgroundColor: 'transparent'
      });

      this.marker = new maps.Marker({
        position: location,
        map: this.map
      });

      window.addEventListener('resize', this.handleResize);
    } catch (error) {
      console.error('[Map] Unable to initialize', error);
    }
  }

  handleResize() {
    if (!this.map || !this.marker) return;
    const position = this.marker.getPosition();
    this.map.setCenter(position);
  }

  async resolveLocation(maps) {
    const useLatLong = this.dataset.latlongCorrection === 'true';
    const lat = Number(this.dataset.lat);
    const lng = Number(this.dataset.long);

    if (useLatLong && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng };
    }

    const address = this.dataset.address;
    if (!address) return null;

    const geocoder = new maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results.length > 0) {
          resolve(results[0].geometry.location);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }
}

customElements.define('map-component', MapComponent);
