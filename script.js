/* =====================================================
   ASCENSION SOFTWARE — script.js
   ===================================================== */

'use strict';

/* =====================================================
   1. INTRO SCREEN — Gmail Mock + Warp Animation
   ===================================================== */
function initIntroScreen() {
  const introScreen    = document.getElementById('intro-screen');
  const gmailEmpty     = document.getElementById('gmail-empty');
  const gmailEmailList = document.getElementById('gmail-email-list');
  const gmailBadge     = document.getElementById('gmail-badge');
  const warpCanvas     = document.getElementById('warp-canvas');
  const warpFlash      = document.getElementById('warp-flash');

  if (!introScreen) {
    initScrollReveal();
    initFloatingStats();
    initStatsBannerComet();
    return;
  }

  /* ---- Build email row ---- */
  function createEmailRow() {
    const row = document.createElement('div');
    row.className = 'gmail-email-row';
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-label', 'Open email from Ascension Software');
    row.innerHTML = `
      <div class="gmail-email-row__checkbox" aria-hidden="true"></div>
      <div class="gmail-email-row__star" aria-hidden="true">☆</div>
      <div class="gmail-email-row__avatar" aria-hidden="true">A</div>
      <div class="gmail-email-row__content">
        <span class="gmail-email-row__sender">Chris @ Ascension</span>
        <span class="gmail-email-row__subject">&nbsp;— Your brand is leaving 30% revenue on the table</span>
        <span class="gmail-email-row__preview">Hi there, most e-commerce brands running paid ads are missing their biggest revenue lever...</span>
      </div>
      <div class="gmail-email-row__meta">
        <div class="gmail-email-row__unread-dot" aria-hidden="true"></div>
        <span class="gmail-email-row__time">Just now</span>
      </div>
    `;
    return row;
  }

  /* ---- Phase 1: Appear after 1s ---- */
  let emailRow = null;
  let warpStarted = false;

  setTimeout(() => {
    // Fade empty state out
    gmailEmpty.classList.add('is-hidden');

    // Inject + animate email row in
    emailRow = createEmailRow();
    gmailEmailList.appendChild(emailRow);

    // Double rAF ensures the initial hidden state is painted before the animation class is set
    requestAnimationFrame(() => requestAnimationFrame(() => {
      emailRow.classList.add('is-entering');
    }));

    // Show badge
    if (gmailBadge) {
      gmailBadge.textContent = '1';
      gmailBadge.classList.add('has-count');
    }

    // Add click hint below email
    const hint = document.createElement('div');
    hint.className = 'gmail-click-hint';
    hint.textContent = 'Click to open →';
    gmailEmailList.appendChild(hint);

    // Attach click / keyboard handler
    emailRow.addEventListener('click', startWarp);
    emailRow.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startWarp(); }
    });
  }, 1000);

  /* ---- Phase 2: Warp ---- */
  function startWarp() {
    if (warpStarted) return;
    warpStarted = true;

    emailRow.removeEventListener('click', startWarp);
    emailRow.classList.add('is-clicked');

    // Slight delay so the click glow is visible
    setTimeout(runWarpAnimation, 280);
  }

  function runWarpAnimation() {
    const ctx = warpCanvas.getContext('2d');
    warpCanvas.width  = window.innerWidth;
    warpCanvas.height = window.innerHeight;
    warpCanvas.classList.add('is-active');

    const cx = warpCanvas.width  / 2;
    const cy = warpCanvas.height / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy) * 1.35;

    const NUM_STREAKS = 110;
    const DURATION    = 900; // ms

    // Generate streak data
    const streaks = Array.from({ length: NUM_STREAKS }, (_, i) => ({
      angle:     (i / NUM_STREAKS) * Math.PI * 2 + (Math.random() - 0.5) * 0.12,
      speed:     0.45 + Math.random() * 0.55,
      baseWidth: 0.4  + Math.random() * 1.8,
      hue:       210  + Math.random() * 45,   // blue-violet range
      bright:    60   + Math.random() * 30,
    }));

    // CSS zoom animation starts slightly after canvas (visual layering)
    setTimeout(() => introScreen.classList.add('warp-active'), 120);

    const startTime = performance.now();

    function renderFrame(ts) {
      const elapsed  = ts - startTime;
      const rawProg  = Math.min(elapsed / DURATION, 1);
      // Cubic ease-in: slow start, explosive finish
      const eased    = rawProg * rawProg * rawProg;
      const midEased = rawProg * rawProg; // quadratic for secondary effects

      ctx.clearRect(0, 0, warpCanvas.width, warpCanvas.height);

      // Dark space behind streaks — deepens over time
      ctx.fillStyle = `rgba(0, 6, 28, ${Math.min(rawProg * 0.9, 0.88)})`;
      ctx.fillRect(0, 0, warpCanvas.width, warpCanvas.height);

      // Warp streaks
      streaks.forEach((s) => {
        const prog     = Math.min(eased * s.speed, 1);
        const headDist = maxR * prog * 1.1;
        const tailDist = headDist * (1 - Math.min(midEased * 0.5, 0.6));

        // Clamp to canvas bounds
        const sx = cx + Math.cos(s.angle) * Math.max(tailDist, 0);
        const sy = cy + Math.sin(s.angle) * Math.max(tailDist, 0);
        const ex = cx + Math.cos(s.angle) * Math.min(headDist, maxR * 1.3);
        const ey = cy + Math.sin(s.angle) * Math.min(headDist, maxR * 1.3);

        const alpha = Math.min(1, rawProg * 3.5) * s.speed;
        const lw    = s.baseWidth * (1 + eased * 3.5);

        const grad = ctx.createLinearGradient(sx, sy, ex, ey);
        grad.addColorStop(0,   `hsla(${s.hue}, 90%, ${s.bright}%, 0)`);
        grad.addColorStop(0.3, `hsla(${s.hue}, 90%, ${s.bright}%, ${alpha * 0.5})`);
        grad.addColorStop(1,   `hsla(${s.hue}, 95%, 90%, ${alpha})`);

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = lw;
        ctx.lineCap     = 'round';
        ctx.stroke();
      });

      // Central white-blue supernova grows in final 40%
      if (rawProg > 0.42) {
        const gProg  = (rawProg - 0.42) / 0.58;
        const gR     = maxR * gProg * 0.75;
        const gGrad  = ctx.createRadialGradient(cx, cy, 0, cx, cy, gR);
        gGrad.addColorStop(0,    `rgba(255, 255, 255, ${gProg * 1.0})`);
        gGrad.addColorStop(0.08, `rgba(207, 250, 254, ${gProg * 0.95})`);
        gGrad.addColorStop(0.2,  `rgba(153, 240, 255, ${gProg * 0.75})`); // blue-300
        gGrad.addColorStop(0.5,  `rgba(0,  217, 255, ${gProg * 0.45})`); // blue-500
        gGrad.addColorStop(1,    'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gGrad;
        ctx.fillRect(0, 0, warpCanvas.width, warpCanvas.height);
      }

      if (rawProg < 1) {
        requestAnimationFrame(renderFrame);
      } else {
        triggerFlash();
      }
    }

    requestAnimationFrame(renderFrame);
  }

  function triggerFlash() {
    // Full-screen blue-white flash
    warpFlash.classList.add('is-active');

    setTimeout(() => {
      // Fade the flash out
      warpFlash.style.transition = 'opacity 0.55s ease';
      warpFlash.classList.remove('is-active');

      // Remove intro screen (flash still fading over it)
      introScreen.style.display = 'none';

      // Ensure the page always starts at the very top
      window.scrollTo(0, 0);

      // Activate the custom cursor now that we're on the main site
      document.body.classList.add('has-custom-cursor');

      // Kick off scroll reveal, floating stats, and comet on the main site
      initScrollReveal();
      initFloatingStats();
      initStatsBannerComet();
    }, 160);
  }
}

/* =====================================================
   2. CUSTOM CURSOR + CANVAS TRACER (disabled)
   ===================================================== */
/* (function initCursorAndTracer() {
  const cursorEl    = document.getElementById('custom-cursor');
  const tracerCanvas = document.getElementById('tracer-canvas');
  if (!cursorEl || !tracerCanvas) return;

  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  if (isCoarse) {
    cursorEl.style.display = 'none';
    tracerCanvas.style.display = 'none';
    document.body.classList.remove('has-custom-cursor');
    return;
  }

  const ctx = tracerCanvas.getContext('2d');
  let targetX = window.innerWidth  / 2;
  let targetY = window.innerHeight / 2;
  let smoothX = targetX;
  let smoothY = targetY;
  const EASE  = 0.16;

  const trail    = [];
  const MAX_TRAIL = 42;

  function resizeCanvas() {
    tracerCanvas.width  = window.innerWidth;
    tracerCanvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    // Only show custom cursor after intro is dismissed
    if (document.body.classList.contains('has-custom-cursor')) {
      cursorEl.classList.add('is-visible');
    }
  }, { passive: true });

  function attachHoverListeners() {
    const sel = 'a, button, .faq-question, .pricing-card, .cta-button, .btn, .gmail-email-row';
    document.querySelectorAll(sel).forEach((el) => {
      el.addEventListener('mouseenter', () => cursorEl.classList.add('is-hovering'));
      el.addEventListener('mouseleave', () => cursorEl.classList.remove('is-hovering'));
    });
  }
  attachHoverListeners();
  // Re-attach after FAQ items are injected
  setTimeout(attachHoverListeners, 1500);

  function animate() {
    smoothX += (targetX - smoothX) * EASE;
    smoothY += (targetY - smoothY) * EASE;

    cursorEl.style.transform = `translate3d(${smoothX}px, ${smoothY}px, 0) translate(-50%, -50%)`;

    // Only render tracer on the main site (not during intro)
    if (document.body.classList.contains('has-custom-cursor')) {
      trail.push({ x: smoothX, y: smoothY });
      if (trail.length > MAX_TRAIL) trail.shift();

      ctx.clearRect(0, 0, tracerCanvas.width, tracerCanvas.height);
      if (trail.length > 1) {
        for (let i = 1; i < trail.length; i++) {
          const alpha = (i / trail.length) * 0.5;
          const width = (i / trail.length) * 2.5;
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.strokeStyle = `rgba(0, 217, 255, ${alpha})`;
          ctx.lineWidth   = width;
          ctx.lineCap     = 'round';
          ctx.lineJoin    = 'round';
          ctx.stroke();
        }
      }
    } else {
      // Clear any accidental marks and reset trail
      trail.length = 0;
      ctx.clearRect(0, 0, tracerCanvas.width, tracerCanvas.height);
    }
    requestAnimationFrame(animate);
  }
  animate();
})(); */


/* =====================================================
   3. MOBILE NAV TOGGLE
   ===================================================== */
(function initMobileNav() {
  const toggleBtn = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (!toggleBtn || !mobileNav) return;

  function closeNav() {
    mobileNav.classList.remove('is-open');
    toggleBtn.classList.remove('is-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
  }

  toggleBtn.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('is-open');
    toggleBtn.classList.toggle('is-open', isOpen);
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    mobileNav.setAttribute('aria-hidden', String(!isOpen));
  });

  mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));

  document.addEventListener('click', (e) => {
    if (!mobileNav.contains(e.target) && !toggleBtn.contains(e.target)) closeNav();
  });
})();


/* =====================================================
   4. HEADER SCROLL EFFECT
   ===================================================== */
(function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('is-scrolled', window.scrollY > 20);
  }, { passive: true });
})();


/* =====================================================
   5. SCROLL REVEAL — called after intro or immediately
   ===================================================== */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach((el) => observer.observe(el));
}


/* =====================================================
   6. FLOW VISUAL — Canvas Line + Active Stage
   ===================================================== */
/* =====================================================
   6b. STACKING CARDS — scroll-driven card stacking
   ===================================================== */
(function initStackingCards() {
  const section   = document.querySelector('.stacking-cards');
  const container = document.getElementById('stacking-cards-container');
  if (!section || !container) return;

  const cards = Array.from(container.querySelectorAll('.stacking-card'));
  if (!cards.length) return;

  // Skip scroll animation on small screens (cards are normal-flow there)
  if (window.innerWidth < 768) return;

  // Scroll distance allocated per card transition (cards 2 & 3 each get this much)
  var PX_PER_CARD = 600;

  // Easing — smooth ease-out so cards decelerate as they land
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function update() {
    var sectionRect = section.getBoundingClientRect();
    // How far we've scrolled past the point where the sticky wrapper locks
    var scrolled = Math.max(0, -sectionRect.top);

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];

      /* --- Slide-in progress ---
         Card 0 is always in position.
         Card 1 slides in during scroll [0, PX_PER_CARD].
         Card 2 slides in during scroll [PX_PER_CARD, 2*PX_PER_CARD]. */
      var slideRaw;
      if (i === 0) {
        slideRaw = 1;
      } else {
        var start = (i - 1) * PX_PER_CARD;
        slideRaw = Math.max(0, Math.min(1, (scrolled - start) / PX_PER_CARD));
      }
      var slideProgress = easeOutCubic(slideRaw);

      /* --- Cover progress (being covered by the next card) --- */
      var coverProgress = 0;
      if (i < cards.length - 1) {
        var coverStart = i * PX_PER_CARD;
        var coverRaw   = Math.max(0, Math.min(1, (scrolled - coverStart) / PX_PER_CARD));
        coverProgress  = easeOutCubic(coverRaw);
      }

      /* --- Apply transforms --- */
      var translateY  = (1 - slideProgress) * 110;   // 110% → 0%
      var scale       = 1 - coverProgress * 0.08;     // 1 → 0.92
      var brightness  = 100 - coverProgress * 50;      // 100% → 50%

      card.style.transform = 'translateY(' + translateY + '%) scale(' + scale + ')';
      card.style.filter    = 'brightness(' + brightness + '%)';

      /* --- Dynamic z-index: card 2 starts above card 3 so it reveals 3 behind it.
             Once card 3 begins sliding, it rises above card 2. --- */
      if (i > 0) {
        // Before sliding: earlier cards sit on top (reverse order).
        // Once sliding: natural order so later cards rise above earlier ones.
        card.style.zIndex = slideRaw > 0 ? (2 + i) : (2 + cards.length - 1 - i);
      }
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();


/* =====================================================
   7. FAQ ACCORDION
   ===================================================== */
(function initFAQ() {
  const faqs = [
    {
      q: 'What ROI do you typically generate for brands at our level?',
      a: 'Most brands see a meaningful lift within the first 30–60 days. Typical outcomes range from +15% to +40% increase in email/SMS attributed revenue, depending on current setup quality, traffic volume, and inventory depth. We average 9.4X ROI across our client portfolio.',
    },
    {
      q: 'How quickly can we go live?',
      a: 'Fast. Most brands are live in 7–14 days. Onboarding includes:\n\n• Account access + baseline audit\n• Flow fixes and quick wins first\n• Campaign engine setup (calendar + approvals)\n• Full system launch',
    },
    {
      q: 'Do you handle both campaigns and automations?',
      a: 'Yes. We handle:\n\n• Flows/automations — your retention backbone\n• Campaigns — your weekly revenue engine\n• List growth — so the system compounds over time',
    },
    {
      q: 'Will this actually increase LTV, or just send more emails?',
      a: "We're not here to \"send more.\" We're here to increase repeat purchase rate, retention, and lifetime value. More volume without strategy kills deliverability. We prioritize quality, relevance, and customer lifecycle above all else.",
    },
    {
      q: 'How do you avoid list fatigue and unsubscribes?',
      a: 'We protect your list aggressively:\n\n• Engagement-based sending (throttling unengaged users)\n• Smart frequency caps\n• Value-first campaign mix\n• Deliverability monitoring\n• Segmentation that prevents over-mailing',
    },
    {
      q: 'Can you match our brand voice and tone consistently?',
      a: 'Yes. We run a structured tone-matching process — we analyze your site, ads, social media, customer reviews, and existing emails, then build a consistent messaging style guide. Every email follows that voice.',
    },
    {
      q: 'Do you work with brands doing 7+ figures?',
      a: 'Yes. We typically work with brands doing $20k–$1M+/month. Our Scale and Elite tiers are built specifically for high-volume, high-complexity retention at the 7-figure+ level.',
    },
    {
      q: 'Do you handle SMS as well?',
      a: 'Yes — SMS is included in our Scale and Elite plans. We treat it as a complementary channel to email, not a replacement. We build coordinated sequences that prevent overlap and maximise revenue per contact.',
    },
    {
      q: 'How do you ensure deliverability stays high at scale?',
      a: 'Deliverability is built into the system:\n\n• Proper DNS setup (SPF / DKIM / DMARC + dedicated sending domain)\n• Engagement filtering\n• Smart warmup and ramping strategy\n• Bounce and complaint monitoring\n• Routine list cleaning and suppression management',
    },
    {
      q: 'What does your reporting look like?',
      a: 'Clear, actionable reporting tied to results:\n\n• Email + SMS revenue attribution\n• Campaign vs. flow split\n• Revenue per recipient\n• Deliverability and list health\n• Weekly/monthly highlights + next actions',
    },
  ];

  const faqList = document.getElementById('faq-list');
  if (!faqList) return;

  faqs.forEach(({ q, a }) => {
    const item = document.createElement('div');
    item.className = 'faq-item';
    item.innerHTML = `
      <button class="faq-question" aria-expanded="false">
        <span>${q}</span>
        <svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <div class="faq-answer" role="region" aria-hidden="true">
        <div class="faq-answer__inner">${a.replace(/\n/g, '<br>')}</div>
      </div>
    `;
    faqList.appendChild(item);
  });

  /* -- Inject FAQ + Organization JSON-LD for SEO -- */
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a.replace(/\n/g, ' '),
      },
    })),
  };

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ascension Software',
    url: 'https://ascensionsoftware.co',
    description: 'We build, run, and drive results through custom email retention systems for growing e-commerce brands.',
    email: 'chris@ascensionsoftware.co',
    areaServed: 'Worldwide',
    foundingLocation: 'United Kingdom',
  };

  [faqSchema, orgSchema].forEach((schema) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  });

  faqList.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-question');
    if (!btn) return;

    const item   = btn.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const isOpen = btn.classList.contains('is-open');

    faqList.querySelectorAll('.faq-question.is-open').forEach((openBtn) => {
      openBtn.classList.remove('is-open');
      openBtn.setAttribute('aria-expanded', 'false');
      openBtn.closest('.faq-item').querySelector('.faq-answer').classList.remove('is-open');
    });

    if (!isOpen) {
      btn.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      answer.classList.add('is-open');
    }
  });
})();


/* =====================================================
   8. FOOTER YEAR
   ===================================================== */
(function setFooterYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* =====================================================
   8b. FOOTER SVG HOVER EFFECT
   ===================================================== */
(function initFooterHoverEffect() {
  const svg = document.getElementById('footer-hover-svg');
  if (!svg) return;

  const revealMask = document.getElementById('footerRevealMask');
  const ghostText = svg.querySelector('.hover-footer__svg-text--ghost');

  svg.addEventListener('mouseenter', function () {
    if (ghostText) ghostText.style.opacity = '0.7';
  });

  svg.addEventListener('mouseleave', function () {
    if (ghostText) ghostText.style.opacity = '0';
    // Reset gradient to center
    if (revealMask) {
      revealMask.setAttribute('cx', '50%');
      revealMask.setAttribute('cy', '50%');
    }
  });

  svg.addEventListener('mousemove', function (e) {
    if (!revealMask) return;
    const rect = svg.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * 100;
    const cy = ((e.clientY - rect.top) / rect.height) * 100;
    revealMask.setAttribute('cx', cx + '%');
    revealMask.setAttribute('cy', cy + '%');
  });
})();


/* =====================================================
   9. SMOOTH ANCHOR SCROLL
   ===================================================== */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const hash   = link.getAttribute('href');
      if (!hash || hash === '#') return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
      if (history.pushState) history.pushState(null, '', hash);
    });
  });
})();


/* =====================================================
   10. STATS BANNER COMET
   ===================================================== */
function initStatsBannerComet() {
  const banner = document.querySelector('.stats-banner__inner');
  if (!banner) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'stats-comet-canvas';
  banner.appendChild(canvas);

  const RADIUS   = 22;   // matches CSS border-radius
  const SPEED    = 1 / 19000; // one revolution every 19 seconds
  const TAIL_N   = 32;   // number of tail segments
  const TAIL_LEN = 0.05; // tail length as fraction of perimeter

  function resize() {
    canvas.width  = banner.offsetWidth  + 2;
    canvas.height = banner.offsetHeight + 2;
  }
  resize();
  window.addEventListener('resize', resize);

  // Returns the (x, y) position at fraction t (0–1) clockwise
  // around a rounded rectangle: origin (0,0), size (w×h), radius r
  function pointOnPath(t, w, h, r) {
    const sw  = w - 2 * r;   // straight horizontal length
    const sh  = h - 2 * r;   // straight vertical length
    const arc = 0.5 * Math.PI * r;
    const total = 2 * sw + 2 * sh + 4 * arc;
    let d = ((t % 1) + 1) % 1 * total;

    // Top edge (left → right)
    if (d < sw)   return { x: r + d,       y: 0 };
    d -= sw;
    // Top-right corner
    if (d < arc) { const a = -Math.PI/2 + (d/arc)*Math.PI/2; return { x: w-r + Math.cos(a)*r, y: r + Math.sin(a)*r }; }
    d -= arc;
    // Right edge (top → bottom)
    if (d < sh)   return { x: w,           y: r + d };
    d -= sh;
    // Bottom-right corner
    if (d < arc) { const a = (d/arc)*Math.PI/2; return { x: w-r + Math.cos(a)*r, y: h-r + Math.sin(a)*r }; }
    d -= arc;
    // Bottom edge (right → left)
    if (d < sw)   return { x: w-r - d,     y: h };
    d -= sw;
    // Bottom-left corner
    if (d < arc) { const a = Math.PI/2 + (d/arc)*Math.PI/2; return { x: r + Math.cos(a)*r, y: h-r + Math.sin(a)*r }; }
    d -= arc;
    // Left edge (bottom → top)
    if (d < sh)   return { x: 0,           y: h-r - d };
    d -= sh;
    // Top-left corner
    const a = Math.PI + (d/arc)*Math.PI/2;
    return { x: r + Math.cos(a)*r, y: r + Math.sin(a)*r };
  }

  let t = 0;
  let last = performance.now();

  function draw(now) {
    const dt = now - last;
    last = now;
    t = (t + SPEED * dt) % 1;

    const ctx = canvas.getContext('2d');
    const w   = canvas.width;
    const h   = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw fading tail
    for (let i = TAIL_N; i >= 1; i--) {
      const tt    = ((t - (i / TAIL_N) * TAIL_LEN) + 1) % 1;
      const pos   = pointOnPath(tt, w, h, RADIUS);
      const alpha = (1 - i / TAIL_N) * 0.55;
      const size  = (1 - i / TAIL_N) * 2.2 + 0.4;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(153, 240, 255, ${alpha})`;
      ctx.fill();
    }

    // Draw comet head glow
    const head = pointOnPath(t, w, h, RADIUS);
    const grd  = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 9);
    grd.addColorStop(0,   'rgba(207, 250, 254, 0.95)');
    grd.addColorStop(0.3, 'rgba(51,  225, 255, 0.55)');
    grd.addColorStop(1,   'rgba(0,  217, 255, 0)');
    ctx.beginPath();
    ctx.arc(head.x, head.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Bright core dot
    ctx.beginPath();
    ctx.arc(head.x, head.y, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(236, 254, 255, 1)';
    ctx.fill();

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

/* =====================================================
   11. FLOATING STATS — DVD-logo bounce + drag
   ===================================================== */
function initFloatingStats() {
  if (window.innerWidth < 900) return;

  const statsData = [
    { value: '$2M+',    label: 'Revenue Generated'  },
    { value: '20+',     label: 'E-commerce Brands'  },
    { value: '30%',     label: 'Avg. Revenue Lift'  },
    { value: '14 Days', label: 'To Go Live'          },
  ];

  const overlay = document.createElement('div');
  overlay.id = 'floating-stats-overlay';
  document.body.appendChild(overlay);

  const CARD_W    = 160;
  const CARD_H    = 84;
  const HEADER_H  = 72;
  const MIN_SPEED = 1.35;
  const MAX_SPEED = 24;
  const FRICTION  = 0.979;

  const vw0 = window.innerWidth;
  const vh0 = window.innerHeight;

  // Stats banner used as the bottom boundary; hero section used to detect scroll-out
  const statsBanner = document.querySelector('.stats-banner');
  const heroSection = document.querySelector('#hero');

  function getBounds() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let maxY = vh - CARD_H;
    if (statsBanner) {
      const br = statsBanner.getBoundingClientRect();
      if (br.top < vh) maxY = Math.max(HEADER_H + CARD_H, br.top - CARD_H - 6);
    }
    return { minX: 0, maxX: vw - CARD_W, minY: HEADER_H, maxY };
  }

  const startPositions = [
    { x: vw0 * 0.06, y: HEADER_H + 40 },
    { x: vw0 * 0.70, y: HEADER_H + 50 },
    { x: vw0 * 0.10, y: vh0 * 0.60 },
    { x: vw0 * 0.74, y: vh0 * 0.56 },
  ];
  const startAngles = [
    Math.PI * 0.28,
    Math.PI * 1.15,
    Math.PI * 1.72,
    Math.PI * 0.62,
  ];

  const cards = statsData.map((stat, i) => {
    const el = document.createElement('div');
    el.className = 'floating-stat';
    el.innerHTML = `<span class="floating-stat__value">${stat.value}</span>` +
                   `<span class="floating-stat__label">${stat.label}</span>`;
    overlay.appendChild(el);

    const speed = MIN_SPEED + i * 0.14;
    const card = {
      el,
      x: startPositions[i].x,
      y: startPositions[i].y,
      vx: Math.cos(startAngles[i]) * speed,
      vy: Math.sin(startAngles[i]) * speed,
      dragging: false,
      dragOffX: 0, dragOffY: 0,
      velSamples: [],
      _prevX: 0, _prevY: 0, _prevT: 0,
    };

    el.style.pointerEvents = 'auto';
    el.style.cursor        = 'grab';
    el.style.userSelect    = 'none';

    function dragStart(e) {
      e.preventDefault();
      card.dragging    = true;
      card.velSamples  = [];
      el.style.cursor  = 'grabbing';
      el.style.zIndex  = '202';
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      card.dragOffX = cx - card.x;
      card.dragOffY = cy - card.y;
      card._prevX   = cx;
      card._prevY   = cy;
      card._prevT   = performance.now();
    }

    el.addEventListener('mousedown',  dragStart);
    el.addEventListener('touchstart', dragStart, { passive: false });
    return card;
  });

  // Global pointer-move and pointer-up
  function onMove(e) {
    const card = cards.find(c => c.dragging);
    if (!card) return;

    const cx  = e.touches ? e.touches[0].clientX : e.clientX;
    const cy  = e.touches ? e.touches[0].clientY : e.clientY;
    const now = performance.now();
    const dt  = now - card._prevT;

    if (dt > 0 && dt < 100) {
      card.velSamples.push({
        vx: (cx - card._prevX) / dt * 16.67,
        vy: (cy - card._prevY) / dt * 16.67,
        t:  now,
      });
      if (card.velSamples.length > 6) card.velSamples.shift();
    }
    card._prevX = cx;
    card._prevY = cy;
    card._prevT = now;

    const { minX, maxX, minY, maxY } = getBounds();
    card.x = Math.max(minX, Math.min(maxX, cx - card.dragOffX));
    card.y = Math.max(minY, Math.min(maxY, cy - card.dragOffY));
    card.el.style.transform = `translate(${card.x}px, ${card.y}px)`;
  }

  function onUp() {
    const card = cards.find(c => c.dragging);
    if (!card) return;
    card.dragging   = false;
    card.el.style.cursor = 'grab';
    card.el.style.zIndex = '';

    // Average recent velocity samples for throw
    const recent = card.velSamples.filter(s => performance.now() - s.t < 120);
    if (recent.length > 0) {
      let tvx = recent.reduce((s, v) => s + v.vx, 0) / recent.length;
      let tvy = recent.reduce((s, v) => s + v.vy, 0) / recent.length;
      const spd = Math.sqrt(tvx * tvx + tvy * tvy);
      const scale = spd > MAX_SPEED ? MAX_SPEED / spd : 1;
      card.vx = tvx * scale;
      card.vy = tvy * scale;
    }

    // Guarantee minimum movement so it never sits still
    const spd = Math.sqrt(card.vx * card.vx + card.vy * card.vy);
    if (spd < MIN_SPEED) {
      const angle = Math.atan2(card.vy || 0.5, card.vx || 0.5);
      card.vx = Math.cos(angle) * MIN_SPEED;
      card.vy = Math.sin(angle) * MIN_SPEED;
    }
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup',   onUp);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend',  onUp);

  const heroContent = document.querySelector('.hero__content');
  let running = true;

  function cleanup() {
    if (!running) return;   // guard against double-call
    running = false;
    overlay.style.opacity = '0';
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup',   onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend',  onUp);
    setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 520);
  }

  // Use IntersectionObserver — fires the instant the hero leaves the viewport
  if (heroSection) {
    const heroObserver = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) {
        cleanup();
        heroObserver.disconnect();
      }
    }, { threshold: 0 });
    heroObserver.observe(heroSection);
  }

  function tick() {
    if (!running) return;

    const { minX, maxX, minY, maxY } = getBounds();

    const heroRect = heroContent ? heroContent.getBoundingClientRect() : null;

    cards.forEach(card => {
      if (card.dragging) return;

      // Apply friction above min speed, then clamp floor
      const spd = Math.sqrt(card.vx * card.vx + card.vy * card.vy);
      if (spd > MIN_SPEED) {
        card.vx *= FRICTION;
        card.vy *= FRICTION;
        const newSpd = Math.sqrt(card.vx * card.vx + card.vy * card.vy);
        if (newSpd < MIN_SPEED) {
          const s = newSpd > 0.001 ? newSpd : MIN_SPEED;
          card.vx = (card.vx / s) * MIN_SPEED;
          card.vy = (card.vy / s) * MIN_SPEED;
        }
      }

      card.x += card.vx;
      card.y += card.vy;

      if (card.x <= minX) { card.x = minX; card.vx =  Math.abs(card.vx); }
      if (card.x >= maxX) { card.x = maxX; card.vx = -Math.abs(card.vx); }
      if (card.y <= minY) { card.y = minY; card.vy =  Math.abs(card.vy); }
      if (card.y >= maxY) { card.y = maxY; card.vy = -Math.abs(card.vy); }

      card.el.style.transform = `translate(${card.x}px, ${card.y}px)`;

      // Fade when centre drifts over hero text
      if (heroRect) {
        const cx       = card.x + CARD_W / 2;
        const cy       = card.y + CARD_H / 2;
        const overText = cx > heroRect.left + 30 && cx < heroRect.right  - 30 &&
                         cy > heroRect.top  + 50 && cy < heroRect.bottom - 50;
        card.el.style.opacity = overText ? '0.18' : '1';
      }
    });

    requestAnimationFrame(tick);
  }

  tick();
}


/* =====================================================
   12. HERO TEXT CYCLING
   ===================================================== */
(function initHeroCycle() {
  const texts = document.querySelectorAll('.hero__cycle-text');
  if (texts.length < 2) return;

  let current = 0;
  const DISPLAY_MS = 2500;

  setInterval(() => {
    const prev = current;
    current = (current + 1) % texts.length;

    // Exit old text (slide up and out)
    texts[prev].classList.remove('is-active');
    texts[prev].classList.add('is-exiting');

    // Wait for exit to finish, then enter new text
    setTimeout(() => {
      texts[current].classList.remove('is-exiting');
      texts[current].classList.add('is-active');
    }, 500);
  }, DISPLAY_MS);
})();


/* =====================================================
   13. HERO 3D DASHBOARD — counters, donut, mouse follow
   ===================================================== */
(function initHeroDashboard() {
  const dashboard = document.getElementById('hero-dashboard');
  const wrapper   = document.getElementById('hero-dashboard-wrapper');
  if (!dashboard || !wrapper) return;

  /* -- Animated counters -- */
  function heroDashCounter(el, target, prefix, suffix, decimals) {
    if (!el) return;
    const duration = 2000;
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = prefix + current.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // Start counters after a short delay
  setTimeout(function () {
    heroDashCounter(document.getElementById('hero-kpi-revenue'), 247.8, '$', 'k', 1);
    heroDashCounter(document.getElementById('hero-kpi-open'), 52.4, '', '%', 1);
    heroDashCounter(document.getElementById('hero-kpi-click'), 6.8, '', '%', 1);
    heroDashCounter(document.getElementById('hero-kpi-subs'), 28420, '', '', 0);
  }, 300);

  /* -- Donut chart -- */
  (function () {
    var data = [
      { label: 'Welcome',       value: 42, color: '#00e5ff' },
      { label: 'Cart Recovery',  value: 38, color: '#b388ff' },
      { label: 'Win-Back',       value: 24, color: '#00e676' },
      { label: 'Post-Purchase',  value: 18, color: '#ffab00' },
      { label: 'Browse Abandon', value: 12, color: '#ff4081' },
    ];
    var total = data.reduce(function (s, d) { return s + d.value; }, 0);
    var svg    = document.getElementById('hero-donut-svg');
    var legend = document.getElementById('hero-donut-legend');
    if (!svg || !legend) return;

    var cx = 60, cy = 60, r = 44;
    var circumference = 2 * Math.PI * r;
    var offset = 0;

    data.forEach(function (d, i) {
      var pct     = d.value / total;
      var dashLen = circumference * pct;
      var gap     = circumference - dashLen + 2;

      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', r);
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', d.color);
      circle.setAttribute('stroke-width', '8');
      circle.setAttribute('stroke-linecap', 'round');
      circle.setAttribute('stroke-dasharray', (dashLen - 3) + ' ' + (gap + 3));
      circle.setAttribute('stroke-dashoffset', '' + (-offset));
      circle.style.opacity = '0';
      circle.style.animation = 'hero-dash-donut-draw 0.8s ease-out ' + (0.8 + i * 0.15) + 's forwards';
      circle.style.setProperty('--circumference', circumference + 'px');
      svg.appendChild(circle);
      offset += dashLen;

      var item = document.createElement('div');
      item.className = 'hero-dash-donut-legend-item';
      item.innerHTML = '<div class="hero-dash-donut-legend-dot" style="background:' + d.color + '"></div>' +
                       d.label +
                       '<span class="hero-dash-donut-legend-value">$' + d.value + 'k</span>';
      legend.appendChild(item);
    });

    setTimeout(function () {
      heroDashCounter(document.getElementById('hero-donut-total'), total, '$', 'k', 0);
    }, 800);
  })();

  /* -- Mouse-follow tilt (only when hovering) -- */
  var isHovering = false;
  var baseRotY = -6;
  var baseRotX = 3;
  var currentRotY = baseRotY;
  var currentRotX = baseRotX;
  var targetRotY = baseRotY;
  var targetRotX = baseRotX;
  var rafId = null;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animateTilt() {
    currentRotY = lerp(currentRotY, targetRotY, 0.08);
    currentRotX = lerp(currentRotX, targetRotX, 0.08);
    dashboard.style.transform =
      'rotateY(' + currentRotY.toFixed(2) + 'deg) rotateX(' + currentRotX.toFixed(2) + 'deg)';

    if (Math.abs(currentRotY - targetRotY) > 0.01 || Math.abs(currentRotX - targetRotX) > 0.01) {
      rafId = requestAnimationFrame(animateTilt);
    } else {
      rafId = null;
    }
  }

  function startRaf() {
    if (!rafId) rafId = requestAnimationFrame(animateTilt);
  }

  wrapper.addEventListener('mouseenter', function () {
    isHovering = true;
    dashboard.classList.add('is-hovering');
  });

  wrapper.addEventListener('mouseleave', function () {
    isHovering = false;
    dashboard.classList.remove('is-hovering');
    targetRotY = baseRotY;
    targetRotX = baseRotX;
    startRaf();
  });

  wrapper.addEventListener('mousemove', function (e) {
    if (!isHovering) return;
    var rect = wrapper.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width;   // 0..1
    var y = (e.clientY - rect.top)  / rect.height;   // 0..1
    // Map to small tilt range around the base tilt
    targetRotY = baseRotY + (x - 0.5) * 10;  // +/-5 deg
    targetRotX = baseRotX + (0.5 - y) * 8;   // +/-4 deg
    startRaf();
  });
})();


/* =====================================================
   14. STICKY MOBILE CTA — show after scrolling past hero
   ===================================================== */
(function initStickyMobileCta() {
  const cta = document.getElementById('sticky-mobile-cta');
  const hero = document.getElementById('hero');
  if (!cta || !hero) return;

  const observer = new IntersectionObserver((entries) => {
    // Show CTA when hero is NOT intersecting (scrolled past it)
    cta.classList.toggle('is-visible', !entries[0].isIntersecting);
  }, { threshold: 0 });

  observer.observe(hero);
})();


/* =====================================================
   INIT — start with intro screen
   ===================================================== */
// initIntroScreen();  // Gmail intro temporarily disabled

// Go straight to the main site
initScrollReveal();
// initFloatingStats();  // floating stats disabled
initStatsBannerComet();
