/* ============================================
   PestiVizes — interakciók
   ============================================ */

(() => {
  // ---------- Sticky nav state ----------
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 8) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobile menu ----------
  const burger = document.getElementById('burger');
  const navMobile = document.getElementById('navMobile');
  if (burger && navMobile) {
    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      navMobile.hidden = open;
    });
    navMobile.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        burger.setAttribute('aria-expanded', 'false');
        navMobile.hidden = true;
      })
    );
  }

  // ---------- Reveal on scroll ----------
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            // small stagger if neighbors are in the same observer pass
            setTimeout(() => e.target.classList.add('is-in'), i * 50);
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-in'));
  }

  // ---------- Number counters ----------
  const counters = document.querySelectorAll('.counter');
  const animateCounter = el => {
    const target = parseInt(el.dataset.target, 10) || 0;
    const suffix = el.dataset.suffix || '';
    const dur = 1600;
    const start = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const step = now => {
      const p = Math.min(1, (now - start) / dur);
      const v = Math.floor(ease(p) * target);
      el.textContent = v + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const ioNum = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            animateCounter(e.target);
            ioNum.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(el => ioNum.observe(el));
  } else {
    counters.forEach(animateCounter);
  }

  // ---------- Smooth scroll offset for sticky nav ----------
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  // ---------- Reference cards: pair viewer ----------
  const refCards = document.querySelectorAll('.ref-card');
  const allRefImages = []; // flat list for lightbox (in pair order)

  refCards.forEach(card => {
    const slides = card.querySelectorAll('.ref-card__slide');
    const dots = card.querySelectorAll('.ref-card__dots button');
    const counter = card.querySelector('.ref-card__counter b');
    const prev = card.querySelector('.ref-card__nav--prev');
    const next = card.querySelector('.ref-card__nav--next');
    let idx = 0;

    // collect images for lightbox
    const startIdx = allRefImages.length;
    slides.forEach(s => {
      const img = s.querySelector('img');
      if (img) allRefImages.push({ src: img.src, alt: img.alt });
    });

    const goTo = i => {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === idx));
      dots.forEach((d, k) => d.classList.toggle('is-active', k === idx));
      if (counter) counter.textContent = idx + 1;
    };

    prev && prev.addEventListener('click', e => { e.stopPropagation(); goTo(idx - 1); });
    next && next.addEventListener('click', e => { e.stopPropagation(); goTo(idx + 1); });
    dots.forEach(d => d.addEventListener('click', e => {
      e.stopPropagation();
      goTo(parseInt(d.dataset.idx, 10));
    }));

    // Click slide → open lightbox at global index
    slides.forEach((s, localIdx) => {
      s.addEventListener('click', () => openLightbox(startIdx + localIdx));
    });

    // Swipe support
    let touchX = null;
    card.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    card.addEventListener('touchend', e => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) goTo(idx + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  });

  // ---------- Lightbox ----------
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbCounter = document.getElementById('lightboxCounter');
  const lbClose = document.getElementById('lightboxClose');
  const lbPrev = document.getElementById('lightboxPrev');
  const lbNext = document.getElementById('lightboxNext');
  let lbIdx = 0;

  function openLightbox(i) {
    if (!lb || !allRefImages.length) return;
    lbIdx = i;
    showLightbox();
    lb.hidden = false;
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function showLightbox() {
    const item = allRefImages[lbIdx];
    if (!item) return;
    lbImg.src = item.src;
    lbImg.alt = item.alt || '';
    if (lbCounter) lbCounter.textContent = `${lbIdx + 1} / ${allRefImages.length}`;
  }
  function closeLightbox() {
    if (!lb) return;
    lb.hidden = true;
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function lbNav(d) {
    lbIdx = (lbIdx + d + allRefImages.length) % allRefImages.length;
    showLightbox();
  }

  if (lb) {
    lbClose && lbClose.addEventListener('click', closeLightbox);
    lbPrev && lbPrev.addEventListener('click', () => lbNav(-1));
    lbNext && lbNext.addEventListener('click', () => lbNav(1));
    lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') lbNav(-1);
      else if (e.key === 'ArrowRight') lbNav(1);
    });
  }

  // ---------- Subtle parallax on hero card ----------
  const card = document.querySelector('.hero__card');
  if (card && window.matchMedia('(hover: hover)').matches) {
    const wrap = card.parentElement;
    wrap.addEventListener('mousemove', e => {
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        `perspective(1000px) rotateY(${x * -8}deg) rotateX(${y * 6}deg) translateY(${y * -4}px)`;
    });
    wrap.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  }
})();
