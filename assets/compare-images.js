const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const throttle = (callback, delay = 150) => {
  let timeoutId;
  let lastArgs;

  return (...args) => {
    lastArgs = args;

    if (timeoutId) return;

    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      callback(...lastArgs);
    }, delay);
  };
};

class CompareImages extends HTMLElement {
  #frame;
  #divider;
  #handle;
  #position = 50;
  #dragging = false;
  #activePointerId;
  #resizeHandler = throttle(() => {
    this.#applyPosition(this.#position);
  }, 200);

  connectedCallback() {
    this.#frame = this.querySelector('.compare__frame');
    this.#divider = this.querySelector('.compare__divider');
    this.#handle = this.querySelector('.compare__handle');

    if (!this.#frame || !this.#divider) return;

    this.#applyPosition(this.#position);

    this.addEventListener('pointerdown', this.#onPointerDown);
    this.addEventListener('click', this.#onClick);
    window.addEventListener('resize', this.#resizeHandler, { passive: true });

    if (this.#handle) {
      this.#handle.addEventListener('keydown', this.#onHandleKeyDown);
    }
  }

  disconnectedCallback() {
    this.removeEventListener('pointerdown', this.#onPointerDown);
    this.removeEventListener('click', this.#onClick);
    window.removeEventListener('resize', this.#resizeHandler);

    if (this.#handle) {
      this.#handle.removeEventListener('keydown', this.#onHandleKeyDown);
    }

    this.#stopDragging();
  }

  #onPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.preventDefault();
    this.#dragging = true;
    this.#activePointerId = event.pointerId;
    this.setPointerCapture?.(event.pointerId);
    this.#updateFromClientX(event.clientX);

    window.addEventListener('pointermove', this.#onPointerMove);
    window.addEventListener('pointerup', this.#onPointerUp);
    window.addEventListener('pointercancel', this.#onPointerUp);
  };

  #onPointerMove = (event) => {
    if (!this.#dragging) return;

    this.#updateFromClientX(event.clientX);
  };

  #onPointerUp = () => {
    this.#stopDragging();
  };

  #onClick = (event) => {
    if (this.#dragging) return;
    if (!(event.target instanceof HTMLElement)) return;

    const isHandle = event.target.closest('.compare__handle');
    if (isHandle) return;

    this.#updateFromClientX(event.clientX);
  };

  #onHandleKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    const delta = event.key === 'ArrowLeft' ? -5 : 5;
    this.#applyPosition(this.#position + delta);
    event.preventDefault();
  };

  #updateFromClientX(clientX) {
    const bounds = this.#frame.getBoundingClientRect();

    if (!bounds.width) return;

    const relativeX = clientX - bounds.left;
    const percent = clamp((relativeX / bounds.width) * 100);

    this.#applyPosition(percent);
  }

  #applyPosition(percent) {
    this.#position = clamp(percent);
    this.style.setProperty('--compare-position', `${this.#position}%`);
  }

  #stopDragging() {
    this.#dragging = false;
    if (
      typeof this.#activePointerId === 'number' &&
      this.hasPointerCapture?.(this.#activePointerId)
    ) {
      this.releasePointerCapture(this.#activePointerId);
    }

    this.#activePointerId = undefined;
    window.removeEventListener('pointermove', this.#onPointerMove);
    window.removeEventListener('pointerup', this.#onPointerUp);
    window.removeEventListener('pointercancel', this.#onPointerUp);
  }
}

if (!customElements.get('compare-images')) {
  customElements.define('compare-images', CompareImages);
}
