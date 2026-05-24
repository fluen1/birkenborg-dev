function initReveal() {
  const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!elements.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    elements.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add('revealed');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 }
  );

  elements.forEach(el => observer.observe(el));
}

initReveal();
document.addEventListener('astro:page-load', initReveal);
