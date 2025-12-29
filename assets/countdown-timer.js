class CountdownTimer extends HTMLElement {
  constructor() {
    super();
    this.section = this.closest('.shopify-section');
    this.countdownParent = this.closest('[data-countdown-block]') || this.section;
    this.expirationBehavior = this.getAttribute('data-expiration-behavior');
    this.time = this.querySelector('time');
    this.days = this.querySelector('[data-days]');
    this.hours = this.querySelector('[data-hours]');
    this.minutes = this.querySelector('[data-minutes]');
    this.seconds = this.querySelector('[data-seconds]');
    this.daysInMs = 86400000;
    this.hoursInMs = this.daysInMs / 24;
    this.minutesInMs = this.hoursInMs / 60;
    this.secondsInMs = this.minutesInMs / 60;
    this.shouldHideOnComplete = this.expirationBehavior === 'hide-section';
    this.shouldShowMessage = this.expirationBehavior === 'show-message';
    this.update = this.update.bind(this);
  }

  connectedCallback() {
    if (!this.time || !this.days || !this.hours || !this.minutes || !this.seconds) {
      return;
    }

    this.endDate = Date.parse(this.time.dateTime);

    if (Number.isNaN(this.endDate) || this.endDate <= Date.now()) {
      this.onComplete();
      return;
    }

    this.update();
    this.interval = setInterval(this.update, 1000);
  }

  disconnectedCallback() {
    this.stopTimer();
  }

  convertTime(milliseconds) {
    const days = this.formatDigits(parseInt(milliseconds / this.daysInMs, 10));
    milliseconds -= days * this.daysInMs;
    const hours = this.formatDigits(parseInt(milliseconds / this.hoursInMs, 10));
    milliseconds -= hours * this.hoursInMs;
    const minutes = this.formatDigits(parseInt(milliseconds / this.minutesInMs, 10));
    milliseconds -= minutes * this.minutesInMs;

    return {
      days,
      hours,
      minutes,
      seconds: this.formatDigits(parseInt(milliseconds / this.secondsInMs, 10)),
    };
  }

  formatDigits(value) {
    return value < 10 ? `0${value}` : `${value}`;
  }

  render({ days, hours, minutes, seconds }) {
    this.days.textContent = days;
    this.hours.textContent = hours;
    this.minutes.textContent = minutes;
    this.seconds.textContent = seconds;
  }

  stopTimer() {
    clearInterval(this.interval);
  }

  onComplete() {
    this.render({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    if (this.shouldHideOnComplete) {
      this.countdownParent?.classList.add('hidden');
      this.countdownParent?.dispatchEvent(
        new CustomEvent('theme:countdown:hide', { detail: { element: this }, bubbles: true }),
      );
    }

    if (this.shouldShowMessage) {
      this.classList?.add('show-message');
      this.countdownParent?.dispatchEvent(new CustomEvent('theme:countdown:expire', { bubbles: true }));
    }
  }

  update() {
    const now = Date.now();
    const diff = this.endDate - now;

    if (diff < 1000) {
      this.stopTimer();
      this.onComplete();
      return;
    }

    const display = this.convertTime(diff);
    this.render(display);
  }
}

if (!customElements.get('countdown-timer')) {
  customElements.define('countdown-timer', CountdownTimer);
}
