(() => {
  const TOTAL = 4;
  let index = 0; // 0-based
  let busy = false;

  const slides = [...document.querySelectorAll('.slide')];
  const bridge = document.getElementById('zoomBridge');
  const bridgeImg = bridge.querySelector('.zoom-img');
  const dots = [...document.querySelectorAll('.dot')];
  const pageLabel = document.getElementById('pageLabel');
  const hud = document.querySelector('.hud');

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const onEnd = (el, prop) =>
    new Promise((resolve) => {
      const handler = (e) => {
        if (prop && e.propertyName !== prop) return;
        el.removeEventListener('transitionend', handler);
        resolve();
      };
      el.addEventListener('transitionend', handler);
    });

  function setHud() {
    dots.forEach((d, i) => d.classList.toggle('is-on', i === index));
    pageLabel.textContent = `${index + 1} / ${TOTAL}`;
  }

  function showSlide(i, { instant = false } = {}) {
    slides.forEach((s, n) => {
      s.classList.toggle('is-active', n === i);
      s.classList.remove('is-beneath');
      if (instant) s.style.transition = 'none';
    });
    if (instant) {
      // force reflow then restore
      void slides[0].offsetWidth;
      slides.forEach((s) => (s.style.transition = ''));
    }
    index = i;
    setHud();
  }

  async function zoomToBaozhong() {
    busy = true;
    document.body.classList.add('is-zooming');

    // Keep page1 visible under bridge at start
    slides[0].classList.add('is-active');
    slides[1].classList.remove('is-active');

    bridge.classList.remove('is-zoomed', 'is-reverse');
    bridgeImg.style.transition = 'none';
    bridgeImg.style.transform = 'scale(1) translate(0, 0)';
    bridge.classList.add('is-on');
    void bridgeImg.offsetWidth;

    bridge.classList.add('is-animating');
    bridgeImg.style.transition = '';
    // next frame: zoom
    await wait(30);
    bridge.classList.add('is-zoomed');

    await Promise.race([
      onEnd(bridgeImg, 'transform'),
      wait(1600),
    ]);

    // Settle on baozhong
    slides[1].classList.add('is-active');
    slides[0].classList.remove('is-active');
    await wait(280);

    bridge.classList.remove('is-on', 'is-animating', 'is-zoomed');
    bridgeImg.style.transition = 'none';
    bridgeImg.style.transform = 'scale(1) translate(0, 0)';

    index = 1;
    setHud();
    document.body.classList.remove('is-zooming');
    busy = false;
  }

  async function zoomBackToOverview() {
    busy = true;
    document.body.classList.add('is-zooming');

    // Start bridge already zoomed, with baozhong still visible beneath
    bridge.classList.remove('is-reverse');
    bridgeImg.style.transition = 'none';
    bridge.classList.add('is-on', 'is-zoomed');
    void bridgeImg.offsetWidth;

    // Reveal overview under while zooming out
    slides[0].classList.add('is-beneath');
    slides[0].classList.add('is-active');

    bridge.classList.add('is-animating', 'is-reverse');
    bridgeImg.style.transition = '';
    await wait(30);
    bridge.classList.remove('is-zoomed');

    await Promise.race([
      onEnd(bridgeImg, 'transform'),
      wait(1600),
    ]);

    slides[1].classList.remove('is-active');
    slides[0].classList.add('is-active');
    slides[0].classList.remove('is-beneath');

    await wait(180);
    bridge.classList.remove('is-on', 'is-animating', 'is-reverse');
    bridgeImg.style.transition = 'none';

    index = 0;
    setHud();
    document.body.classList.remove('is-zooming');
    busy = false;
  }

  async function fadeTo(target) {
    if (target === index) return;
    busy = true;
    const prev = index;
    slides[prev].classList.remove('is-active');
    slides[target].classList.add('is-active');
    index = target;
    setHud();
    await wait(560);
    busy = false;
  }

  async function go(delta) {
    if (busy) return;
    const next = Math.max(0, Math.min(TOTAL - 1, index + delta));
    if (next === index) return;

    if (index === 0 && next === 1) return zoomToBaozhong();
    if (index === 1 && next === 0) return zoomBackToOverview();
    return fadeTo(next);
  }

  async function goTo(target) {
    if (busy || target === index) return;
    if (index === 0 && target === 1) return zoomToBaozhong();
    if (index === 1 && target === 0) return zoomBackToOverview();
    // If jumping across the zoom boundary, use fade for simplicity
    return fadeTo(target);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(TOTAL - 1);
    }
  });

  dots.forEach((d) => {
    d.addEventListener('click', () => {
      const t = Number(d.dataset.to);
      if (!Number.isNaN(t)) goTo(t);
    });
  });

  // Touch swipe
  let touchX = null;
  document.addEventListener(
    'touchstart',
    (e) => {
      touchX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );
  document.addEventListener(
    'touchend',
    (e) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) < 50) return;
      go(dx < 0 ? 1 : -1);
    },
    { passive: true }
  );

  showSlide(0, { instant: true });
})();
