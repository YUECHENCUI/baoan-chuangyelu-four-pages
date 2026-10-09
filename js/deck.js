(() => {
  const TOTAL = 4;
  let index = 0;
  let busy = false;

  const slides = [...document.querySelectorAll('.slide')];
  const dots = [...document.querySelectorAll('.dot')];
  const pageLabel = document.getElementById('pageLabel');

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function setHud() {
    dots.forEach((d, i) => d.classList.toggle('is-on', i === index));
    pageLabel.textContent = `${index + 1} / ${TOTAL}`;
  }

  function showSlide(i, { instant = false } = {}) {
    slides.forEach((s, n) => {
      s.classList.toggle('is-active', n === i);
      if (instant) s.style.transition = 'none';
    });
    if (instant) {
      void slides[0].offsetWidth;
      slides.forEach((s) => (s.style.transition = ''));
    }
    index = i;
    setHud();
  }

  async function fadeTo(target) {
    if (target === index) return;
    busy = true;
    slides[index].classList.remove('is-active');
    slides[target].classList.add('is-active');
    index = target;
    setHud();
    await wait(480);
    busy = false;
  }

  async function go(delta) {
    if (busy) return;
    const next = Math.max(0, Math.min(TOTAL - 1, index + delta));
    if (next === index) return;
    return fadeTo(next);
  }

  async function goTo(target) {
    if (busy || target === index) return;
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
