document.documentElement.classList.add('js');

const header = document.querySelector('.site-header');
const heroVideo = document.querySelector('.hero__media');
const trailer = document.querySelector('#trailer-video');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

if (heroVideo && 'IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver(([entry]) => {
    if (reducedMotion.matches) {
      heroVideo.pause();
    } else if (entry.isIntersecting) {
      heroVideo.play().catch(() => {});
    } else {
      heroVideo.pause();
    }
  }, { threshold: 0.05 });
  videoObserver.observe(heroVideo);
}

const motionChange = () => {
  if (!heroVideo) return;
  if (reducedMotion.matches) heroVideo.pause();
  else heroVideo.play().catch(() => {});
};
reducedMotion.addEventListener?.('change', motionChange);
motionChange();

for (const button of document.querySelectorAll('[data-play-trailer]')) {
  button.addEventListener('click', (event) => {
    if (!trailer) return;
    event.preventDefault();
    trailer.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
    trailer.play().catch(() => {});
  });
}

const dialog = document.querySelector('.lightbox');
const dialogImage = dialog?.querySelector('img');
const dialogCaption = dialog?.querySelector('.lightbox__caption');
for (const button of document.querySelectorAll('.gallery-button')) {
  button.addEventListener('click', () => {
    if (!dialog || !dialogImage || !dialogCaption) return;
    dialogImage.src = button.dataset.full;
    dialogImage.alt = button.dataset.caption;
    dialogCaption.textContent = button.dataset.caption;
    dialog.showModal();
    document.body.classList.add('dialog-open');
  });
}

const closeDialog = () => {
  dialog?.close();
  document.body.classList.remove('dialog-open');
};
dialog?.querySelector('.lightbox__close')?.addEventListener('click', closeDialog);
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) closeDialog();
});
dialog?.addEventListener('close', () => document.body.classList.remove('dialog-open'));

const toast = document.querySelector('.toast');
let toastTimer;
const showToast = (message) => {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
};

for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    const success = document.documentElement.lang === 'ja' ? 'URLをコピーしました' : '链接已复制';
    const failure = document.documentElement.lang === 'ja' ? 'コピーできませんでした。アドレスバーからURLをコピーしてください。' : '未能自动复制，请从地址栏复制链接。';
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(success);
    } catch {
      showToast(failure);
    }
  });
}
