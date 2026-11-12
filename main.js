/* =====================================================================
   main.js – indstillinger, fokuspunkter og interaktioner
   Bevægelsessystem: 0,2 s / 0,6 s / 0,9–1,2 s · power3.out / expo.out

   Siden er en række fokuspunkter. Hvert fokuspunkt fylder én skærm.
   Når man scroller, zoomer det næste fokuspunkt ind og kommer i fokus,
   mens det forrige flyver forbi. Scroll lander altid på et fokuspunkt.
   ===================================================================== */
(() => {
  'use strict';

  /* De rigtige commit-beskeder fra repoets git-historik (ældste først).
     Opdateres med:  git log --reverse --format="%h|%s"                  */
  const COMMITS = [
    ['293eaa0', 'Opsætning: brief, sidestruktur, indhold og designsystem'],
    ['1d96ff0', 'Interaktioner: menu, tidslinje, kort, filter, terminal og kontakt'],
    ['cf01cad', 'Værktøjsdemoer og 3D-hus: fagmodeller, lagknapper og adskilt visning'],
    ['589f2a7', 'Finpudsning: to runder designgennemgang, delingsbillede og beslutningslog']
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = REDUCED_MOTION;
  const gsap = window.gsap;
  const animate = !reduced && !!gsap;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const expoOut = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  if (!animate) root.classList.remove('anim');

  const safe = (name, fn) => {
    try { fn(); } catch (err) { console.error('[' + name + ']', err); }
  };

  /* ---------------------------------------------------------------
     1. Indstillinger: CONFIG + ?v= og ?s= i linket
     --------------------------------------------------------------- */
  safe('config', () => {
    const params = new URLSearchParams(location.search);
    const clean = (v) => (v || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 60);
    const pick = (key, cfg) => {
      const fromUrl = clean(params.get(key));
      if (fromUrl) return fromUrl;
      const c = clean(cfg);
      return c && c.toUpperCase() !== 'XXX' ? c : '';
    };
    const virksomhed = pick('v', CONFIG.virksomhed);
    const stilling = pick('s', CONFIG.stilling);

    $$('[data-cfg]').forEach((el) => {
      const v = CONFIG[el.dataset.cfg];
      if (v) el.textContent = v;
    });
    $('#mail-btn').href = 'mailto:' + CONFIG.email;
    $('#tel-btn').href = 'tel:' + CONFIG.telefon.replace(/[^\d+]/g, '');

    const tail = ', fordi jeg vil arbejde med det, jeg interesserer mig for: de digitale processer bag projekteringen.';
    let lead = 'Jeg søger en stilling inden for IKT og BIM-koordinering';
    if (stilling && virksomhed) lead = 'Jeg søger stillingen som ' + stilling + ' hos ' + virksomhed;
    else if (stilling) lead = 'Jeg søger stillingen som ' + stilling;
    else if (virksomhed) lead = 'Jeg søger en stilling inden for IKT og BIM-koordinering hos ' + virksomhed;
    $('#motivation').textContent = lead + tail;

    $('#hero-label').textContent = stilling ? 'Ansøgning · ' + stilling : 'Ansøgning';
    if (virksomhed) document.title = CONFIG.navn + ' · Ansøgning til ' + virksomhed;

    if (CONFIG.github) {
      $('#github-link').href = CONFIG.github;
      $('#github-wrap').hidden = false;
    }
  });

  /* Billeder, der kun vises, hvis stien er udfyldt og filen findes */
  const probe = (src) => new Promise((res) => {
    if (!src) return res(false);
    const img = new Image();
    img.onload = () => res(img.naturalWidth > 0);
    img.onerror = () => res(false);
    img.src = src;
  });

  safe('foto', () => {
    probe(CONFIG.foto).then((ok) => {
      if (!ok) return;
      const img = new Image();
      img.alt = 'Portræt af ' + CONFIG.navn;
      img.src = CONFIG.foto;
      $('#avatar').append(img);
    });
  });

  /* Nøgleudsagnet deles i ord, så de kan lyse op ét ad gangen */
  safe('udsagn', () => {
    const el = $('#statement');
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.style.setProperty('--w', i);
      s.textContent = w;
      el.append(s, i < words.length - 1 ? ' ' : '');
    });
  });

  /* ---------------------------------------------------------------
     2. Blød scroll (Lenis)
     --------------------------------------------------------------- */
  let lenis = null;
  safe('lenis', () => {
    if (!animate || !window.Lenis) return;
    lenis = new window.Lenis({ duration: 1.0, easing: expoOut });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  });

  /* ---------------------------------------------------------------
     3. Fokuspunkter: zoom ved scroll, og scroll lander på et punkt
     --------------------------------------------------------------- */
  const scenes = $$('[data-scene]').map((el) => ({
    el, inner: $('.scene-inner', el), steps: Number(el.dataset.steps) || 1,
    start: 0, seen: false, op: -1, sc: -1, near: null
  }));
  let totalStops = 0;
  scenes.forEach((s) => { s.start = totalStops; totalStops += s.steps; });
  const sceneOfStop = (n) => scenes.find((s) => n >= s.start && n < s.start + s.steps) || scenes[0];

  const spacer = $('#spacer');
  const counter = $('#counter');
  const progressBar = $('#progress');
  const topbar = $('#topbar');
  const navLinks = $$('.nav a');
  const NAV_OF = { kntool: 'vaerktoejer' };

  let sceneMode = false;
  let stopH = 1;
  let current = null;
  let menuOpen = false;
  let houseApi = null;
  const houseState = { layers: { konstruktion: true, arkitekt: true, mep: true, tag: true }, manual: reduced, scroll: 0, active: true };

  /* Tidslinjen: fem stop inde i ét fokuspunkt */
  const tl = {
    scene: scenes.find((s) => s.el.id === 'erfaring'),
    track: $('#tl-track'), line: $('#tl-line'),
    stations: $$('.tl-station').map((el) => ({ el, more: $('.tl-more', el), cx: 0 })),
    width: 1, vp: 1, last: -1
  };
  const measureTimeline = () => {
    tl.stations.forEach((st) => { st.cx = st.el.offsetLeft + st.el.offsetWidth / 2; });
    tl.width = tl.track.offsetWidth || 1;
    tl.vp = root.clientWidth;
    tl.last = -1;
  };
  const renderTimeline = (s) => {
    if (Math.abs(s - tl.last) < 0.0005) return;
    tl.last = s;
    const n = tl.stations.length;
    const j0 = clamp(Math.floor(s), 0, n - 1);
    const j1 = Math.min(n - 1, j0 + 1);
    const cx = tl.stations[j0].cx + (tl.stations[j1].cx - tl.stations[j0].cx) * (s - j0);
    tl.track.style.transform = 'translate3d(' + (tl.vp / 2 - cx).toFixed(2) + 'px,0,0)';
    tl.line.style.transform = 'scaleX(' + (cx / tl.width).toFixed(4) + ')';
    tl.stations.forEach((st, j) => {
      const dist = Math.min(1, Math.abs(j - s));
      st.el.style.transform = 'scale(' + (1 - 0.3 * dist).toFixed(4) + ')';
      st.el.style.opacity = (1 - 0.55 * dist).toFixed(3);
      st.more.style.opacity = Math.max(0, 1 - dist * 2.4).toFixed(3);
      st.el.classList.toggle('is-focus', dist < 0.4);
      if (dist < 0.6) st.el.classList.add('is-in');
    });
  };
  const clearTimeline = () => {
    [tl.track, tl.line].forEach((el) => { el.style.transform = ''; });
    tl.stations.forEach((st) => {
      st.el.style.transform = ''; st.el.style.opacity = ''; st.more.style.opacity = '';
      st.el.classList.add('is-in');
    });
  };

  const activate = (scene) => {
    current = scene;
    const idx = scenes.indexOf(scene);
    scenes.forEach((s) => { s.el.inert = sceneMode && s !== scene; });
    document.body.classList.toggle('tone-panel', sceneMode && scene.el.dataset.tone === 'panel');
    const navId = NAV_OF[scene.el.id] || scene.el.id;
    navLinks.forEach((a) => {
      if (a.getAttribute('href') === '#' + navId) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    counter.firstElementChild.textContent = String(idx + 1).padStart(2, '0');
    counter.children[1].textContent = '/ ' + String(scenes.length).padStart(2, '0');
    counter.lastElementChild.textContent = scene.el.dataset.title || '';
    $$('.tool.is-demo-open').forEach((t) => { if (!scene.el.contains(t)) t.classList.remove('is-demo-open'); });
  };
  const markSeen = (s) => {
    if (s.seen) return;
    s.seen = true;
    s.el.classList.add('is-seen');
    s.el.dispatchEvent(new CustomEvent('sceneenter'));
  };

  const render = () => {
    if (!sceneMode) return;
    const p = window.scrollY / stopH;
    scenes.forEach((s) => {
      const q = p - s.start;
      let d = 0;
      if (q < 0) d = q;
      else if (q > s.steps - 1) d = q - (s.steps - 1);
      let sc = 1;
      let op = 1;
      if (d < 0) {                      /* på vej ind: lille og utydelig → fuld størrelse */
        const t = clamp((d + 0.5) / 0.36, 0, 1);
        const e = 1 - Math.pow(1 - t, 3);
        sc = 0.8 + 0.2 * e; op = e;
      } else if (d > 0) {               /* på vej ud: flyver forbi kameraet */
        const t = clamp((d - 0.14) / 0.36, 0, 1);
        sc = 1 + 0.4 * t * t; op = 1 - t;
      }
      const near = op > 0.001;
      if (near !== s.near) {
        s.near = near; s.el.classList.toggle('is-near', near);
        if (!near) { s.op = 0; s.inner.style.opacity = '0'; }
      }
      if (near && (Math.abs(op - s.op) > 0.001 || Math.abs(sc - s.sc) > 0.0005)) {
        s.op = op; s.sc = sc;
        s.inner.style.opacity = op.toFixed(3);
        s.inner.style.transform = 'scale(' + sc.toFixed(4) + ')';
      }
      if (op > 0.45) markSeen(s);

      if (s === scenes[0]) {            /* huset adskilles, mens man flyver igennem */
        houseState.scroll = clamp(d / 0.5, 0, 1);
        houseState.active = near;
        if (houseApi) { houseApi.setScroll(houseState.scroll); houseApi.setActive(near); }
      }
      if (s === tl.scene && near) renderTimeline(clamp(q, 0, s.steps - 1));
    });
    const scene = sceneOfStop(clamp(Math.round(p), 0, totalStops - 1));
    if (scene !== current) activate(scene);
    progressBar.style.transform = 'scaleX(' + clamp(p / (totalStops - 1), 0, 1).toFixed(4) + ')';
  };

  let navUntil = 0;                 /* mens et hop er i gang, må snap ikke blande sig */
  const goStop = (n, fast) => {
    const y = clamp(Math.round(n), 0, totalStops - 1) * stopH;
    navUntil = Date.now() + (fast ? 700 : 1000) + 80;
    if (lenis) lenis.scrollTo(y, { duration: fast ? 0.7 : 1.0, easing: expoOut });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };
  const goScene = (el) => {
    const scene = scenes.find((s) => s.el === el || s.el.contains(el));
    if (!scene) return;
    if (sceneMode) goStop(scene.start);
    else scene.el.scrollIntoView({ behavior: 'auto', block: 'start' });
  };

  /* Scenetilstand kræver animationer og et vindue, der er højt nok til indholdet */
  const wantScenes = () => animate && window.innerHeight >= 560 && (window.innerWidth < 960 || window.innerHeight >= 620);
  const setMode = () => {
    const on = wantScenes();
    if (on !== sceneMode) {
      sceneMode = on;
      root.classList.toggle('scenes', on);
      if (!on) {
        scenes.forEach((s) => {
          s.inner.style.opacity = ''; s.inner.style.transform = '';
          s.el.classList.remove('is-near'); s.el.inert = false;
          s.op = -1; s.sc = -1; s.near = null;
          markSeen(s);
        });
        spacer.style.height = '';
        document.body.classList.remove('tone-panel');
        clearTimeline();
        if (houseApi) { houseApi.setScroll(0); houseApi.setActive(true); }
      }
    }
    if (sceneMode) {
      stopH = Math.round(window.innerHeight * 0.9);
      spacer.style.height = ((totalStops - 1) * stopH + window.innerHeight) + 'px';
      measureTimeline();
      current = null;
      render();
    }
  };

  safe('fokuspunkter', () => {
    if (!animate) { scenes.forEach(markSeen); tl.stations.forEach((st) => st.el.classList.add('is-in')); }
    setMode();

    /* Scroll lander på nærmeste fokuspunkt i den retning, man bevægede sig */
    let idle;
    let touching = false;
    let lastY = window.scrollY;
    let dir = 1;
    const snap = () => {
      if (!sceneMode || touching || menuOpen) return;
      if (Date.now() < navUntil) { clearTimeout(idle); idle = setTimeout(snap, 160); return; }
      const p = window.scrollY / stopH;
      const f = p - Math.floor(p);
      if (f < 0.004 || f > 0.996) return;
      const target = dir > 0 ? (f > 0.1 ? Math.ceil(p) : Math.floor(p)) : (f < 0.9 ? Math.floor(p) : Math.ceil(p));
      goStop(target, true);
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 0.5) { dir = y > lastY ? 1 : -1; lastY = y; }
      if (sceneMode) {
        render();
        clearTimeout(idle);
        idle = setTimeout(snap, 140);
      } else {
        const max = Math.max(1, root.scrollHeight - window.innerHeight);
        progressBar.style.transform = 'scaleX(' + clamp(y / max, 0, 1) + ')';
        topbar.classList.toggle('is-scrolled', y > 24);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', () => { touching = true; clearTimeout(idle); }, { passive: true });
    window.addEventListener('touchend', () => { touching = false; clearTimeout(idle); idle = setTimeout(snap, 140); }, { passive: true });
    window.addEventListener('touchcancel', () => { touching = false; }, { passive: true });

    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w === lastW && Math.abs(h - lastH) < 150) return;   /* adresselinjen på mobil */
      const keep = sceneMode ? Math.round(window.scrollY / stopH) : null;
      lastW = w; lastH = h;
      setMode();
      if (sceneMode && keep !== null) {
        if (lenis) lenis.scrollTo(keep * stopH, { immediate: true });
        else window.scrollTo(0, keep * stopH);
      }
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (sceneMode) { measureTimeline(); render(); } });

    let navTarget = null;
    let navTime = 0;
    /* Tastatur: pil ned/op, PageDown/PageUp, mellemrum, Home og End */
    document.addEventListener('keydown', (e) => {
      if (!sceneMode || menuOpen || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      const typing = t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      const onControl = t instanceof HTMLElement && /^(BUTTON|A)$/.test(t.tagName);
      /* flere tryk i træk tæller videre fra det stop, man er på vej til */
      const here = (Date.now() - navTime < 900 && navTarget !== null) ? navTarget : Math.round(window.scrollY / stopH);
      let to = null;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') to = here + 1;
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') to = here - 1;
      else if (e.key === ' ' && !onControl) to = here + (e.shiftKey ? -1 : 1);
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = totalStops - 1;
      if (to === null || typing) return;
      e.preventDefault();
      navTarget = clamp(to, 0, totalStops - 1); navTime = Date.now();
      goStop(navTarget);
    });

    /* Klik på en station på tidslinjen bringer den i fokus */
    tl.stations.forEach((st, j) => {
      $('.tl-jump', st.el).addEventListener('click', () => { if (sceneMode) goStop(tl.scene.start + j); });
    });
  });

  /* ---------------------------------------------------------------
     4. Topbjælke og mobilmenu
     --------------------------------------------------------------- */
  const setMenu = (open) => {
    menuOpen = open;
    root.classList.toggle('menu-open', open);
    const burger = $('#burger');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Luk menu' : 'Åbn menu');
    $('#menu').setAttribute('aria-hidden', String(!open));
    $('#indhold').inert = open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
  };

  safe('menu', () => {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      if (menuOpen) setMenu(false);
      if (a.classList.contains('skip')) { target.tabIndex = -1; target.focus({ preventScroll: true }); return; }
      goScene(target);
    });
    $('#burger').addEventListener('click', () => setMenu(!menuOpen));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuOpen) { setMenu(false); $('#burger').focus(); }
    });
    matchMedia('(min-width: 1040px)').addEventListener('change', (e) => { if (e.matches && menuOpen) setMenu(false); });
  });

  /* ---------------------------------------------------------------
     5. Intro ved indlæsning
     --------------------------------------------------------------- */
  if (animate) {
    safe('intro', () => {
      gsap.to('.hero-title .line > span', { y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1 });
      gsap.fromTo('[data-intro]', { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08, delay: 0.15 });
    });
  }

  /* ---------------------------------------------------------------
     6. Faner: detaljer bag knap eller hover
     --------------------------------------------------------------- */
  safe('faner', () => {
    $$('[data-tabs]').forEach((group, g) => {
      const tabs = $$('.tab', group);
      const panels = $$('.tab-panel', group);
      const select = (i) => {
        tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
        panels.forEach((p, k) => p.classList.toggle('is-active', k === i));
      };
      tabs.forEach((t, i) => {
        const id = 'fane-' + g + '-' + i;
        panels[i].id = id;
        t.setAttribute('aria-controls', id);
        t.addEventListener('click', () => select(i));
        t.addEventListener('focus', () => select(i));
        t.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') select(i); });
        t.addEventListener('keydown', (e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          e.preventDefault(); e.stopPropagation();
          tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length].focus();
        });
      });
      select(0);
    });
  });

  /* ---------------------------------------------------------------
     7. Kort, der åbner sig ved hover eller klik. Vipper let mod musen.
     --------------------------------------------------------------- */
  safe('kort', () => {
    const cards = $$('.xcard');
    const open = (card) => {
      cards.forEach((c) => {
        const on = c === card;
        c.classList.toggle('is-active', on);
        $('.xcard-btn', c).setAttribute('aria-expanded', String(on));
      });
    };
    cards.forEach((card) => {
      const btn = $('.xcard-btn', card);
      btn.addEventListener('click', () => open(card));
      btn.addEventListener('focus', () => open(card));
      card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') open(card); });

      if (!animate || !finePointer) return;
      const glow = $('.card-glow', card);
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      const gx = gsap.quickTo(glow, 'x', { duration: 0.6, ease: 'power3.out' });
      const gy = gsap.quickTo(glow, 'y', { duration: 0.6, ease: 'power3.out' });
      card.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * 8); rx(-py * 8);                   /* højst 4° */
        gx(e.clientX - r.left); gy(e.clientY - r.top);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  });

  /* ---------------------------------------------------------------
     8. Værktøjsdemoer: starter, når de kommer i fokus eller åbnes
     --------------------------------------------------------------- */
  safe('demoer', () => {
    const wide = matchMedia('(min-width: 900px)');
    $$('.tool').forEach((tool) => {
      const demo = $('.demo', tool);
      const scene = tool.closest('[data-scene]');
      let started = false;
      const start = (delay) => {
        if (started) return;
        started = true;
        setTimeout(() => demo.dispatchEvent(new CustomEvent('demostart')), delay);
      };
      $('.demo-open', tool).addEventListener('click', () => { tool.classList.add('is-demo-open'); start(500); });
      $('.demo-close', tool).addEventListener('click', () => { tool.classList.remove('is-demo-open'); $('.demo-open', tool).focus(); });

      if (!animate) return;
      scene.addEventListener('sceneenter', () => {
        if (!sceneMode) return;
        if (wide.matches) start(700);
      });
      /* Uden fokuspunkter (lavt vindue): start, når demoen er rullet ind i billedet */
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting || sceneMode) return;
        io.disconnect();
        start(400);
      }, { threshold: 0.5 });
      io.observe(demo);
    });
  });

  /* ---------------------------------------------------------------
     9. Kompetencer: filter med FLIP-animation
     --------------------------------------------------------------- */
  safe('filter', () => {
    const list = $('#tags');
    const tags = $$('.tag', list);
    const buttons = $$('.filter');
    let current2 = 'alle';
    const matches = (el, cat) => cat === 'alle' || el.dataset.cat.split(' ').includes(cat);

    const reserve = () => {
      const hiddenNow = tags.map((t) => t.hidden);
      tags.forEach((t) => { t.hidden = false; });
      list.style.minHeight = '';
      list.style.minHeight = list.offsetHeight + 'px';
      tags.forEach((t, i) => { t.hidden = hiddenNow[i]; });
    };
    reserve();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(reserve, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserve);

    const apply = (cat) => {
      current2 = cat;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === cat)));
      if (!animate) { tags.forEach((t) => { t.hidden = !matches(t, cat); }); return; }

      const box = list.getBoundingClientRect();
      const first = new Map(tags.map((t) => [t, t.hidden ? null : t.getBoundingClientRect()]));
      gsap.killTweensOf(tags);
      gsap.set(tags, { clearProps: 'all' });

      tags.forEach((t) => {
        const show = matches(t, cat);
        const f = first.get(t);
        if (!show && f) {
          gsap.set(t, { position: 'absolute', left: f.left - box.left, top: f.top - box.top, margin: 0 });
          gsap.to(t, { opacity: 0, scale: 0.9, duration: 0.2, ease: 'power3.out', onComplete: () => { t.hidden = true; gsap.set(t, { clearProps: 'all' }); } });
        } else {
          t.hidden = !show;
        }
      });
      tags.forEach((t) => {
        if (!matches(t, cat)) return;
        const f = first.get(t);
        const l = t.getBoundingClientRect();
        if (!f) gsap.fromTo(t, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' });
        else gsap.fromTo(t, { x: f.left - l.left, y: f.top - l.top }, { x: 0, y: 0, duration: 0.6, ease: 'power3.out' });
      });
    };
    buttons.forEach((b) => b.addEventListener('click', () => { if (b.dataset.filter !== current2) apply(b.dataset.filter); }));

    const hint = $('.tags-hint');
    if (hint && !finePointer) hint.textContent = 'Tryk på et værktøj med en prik for at se mere.';
  });

  /* ---------------------------------------------------------------
     10. Terminal: afspiller den rigtige git-historik
     --------------------------------------------------------------- */
  safe('terminal', () => {
    const body = $('#term-body');
    const cmdText = 'git log --oneline --reverse';
    const line = (cls) => { const d = document.createElement('div'); d.className = 'term-line ' + cls; return d; };
    const span = (cls, text) => { const s = document.createElement('span'); s.className = cls; s.textContent = text; return s; };
    const play = animate && sceneMode;

    const cmd = line('term-cmd');
    const cmdMsg = span('msg', play ? '' : cmdText);
    cmd.append(span('prompt', '$'), cmdMsg);
    body.append(cmd);
    const rows = COMMITS.map(([hash, msg]) => {
      const d = line(play ? 'is-wait' : '');
      d.append(span('hash', hash), span('msg', msg));
      body.append(d);
      return d;
    });
    const end = line('term-cmd' + (play ? ' is-wait' : ''));
    const caret = document.createElement('span');
    caret.className = 'term-caret';
    end.append(span('prompt', '$'), caret);
    body.append(end);
    $('#term').setAttribute('aria-label', 'Terminalvindue med sidens git-historik: ' + COMMITS.map((c) => c[1]).join('. '));

    if (!play) return;
    $('#saadan').addEventListener('sceneenter', () => {
      let i = 0;
      const type = () => {
        cmdMsg.textContent = cmdText.slice(0, ++i);
        if (i < cmdText.length) setTimeout(type, 38);
        else gsap.to([...rows, end], { opacity: 1, duration: 0.2, ease: 'power3.out', stagger: 0.16, delay: 0.3 });
      };
      setTimeout(type, 700);
    }, { once: true });
  });

  /* ---------------------------------------------------------------
     11. Kontakt: kopiér e-mail + magnetiske knapper
     --------------------------------------------------------------- */
  safe('kontakt', () => {
    const btn = $('#copy-btn');
    const text = $('#copy-text');
    const status = $('#copy-status');
    let timer;
    const fallbackCopy = (value) => {
      const ta = document.createElement('textarea');
      ta.value = value; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-999px;top:0;opacity:0';
      document.body.append(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    };
    btn.addEventListener('click', async () => {
      let ok = true;
      try { await navigator.clipboard.writeText(CONFIG.email); }
      catch (e) { ok = fallbackCopy(CONFIG.email); }
      const msg = ok ? 'Kopieret' : 'Kunne ikke kopiere';
      text.textContent = msg;
      status.textContent = ok ? 'E-mailadressen er kopieret' : msg;
      clearTimeout(timer);
      timer = setTimeout(() => { text.textContent = 'Kopiér e-mail'; status.textContent = ''; }, 2200);
    });

    if (!animate || !finePointer) return;
    $$('.magnetic').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.22);
        y((e.clientY - r.top - r.height / 2) * 0.3);
      });
      el.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  });

  /* ---------------------------------------------------------------
     12. Skærmbilleder af værktøjerne (kun hvis stien er udfyldt) + lightbox
     --------------------------------------------------------------- */
  safe('skærmbilleder', () => {
    const box = $('#lightbox');
    const big = $('img', box);
    let opener = null;
    const close = () => {
      box.classList.remove('is-open');
      setTimeout(() => { box.hidden = true; }, reduced ? 0 : 600);
      if (lenis) lenis.start();
      if (opener) opener.focus();
    };
    const open = (src, alt, from) => {
      opener = from;
      big.src = src; big.alt = alt;
      box.hidden = false;
      void box.offsetWidth;
      box.classList.add('is-open');
      if (lenis) lenis.stop();
      $('.lightbox-close', box).focus();
    };
    box.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) close(); });

    [['#shot-rfatool', CONFIG.skaermRFAtool], ['#shot-kntool', CONFIG.skaermKNtool]].forEach(([sel, src]) => {
      probe(src).then((ok) => {
        if (!ok) return;
        const b = $(sel);
        const img = $('img', b);
        img.src = src;
        b.hidden = false;
        b.addEventListener('click', () => open(src, img.alt, b));
      });
    });
  });

  /* ---------------------------------------------------------------
     13. 3D-huset: lagknapper og adskil/saml. Indlæses efter siden.
     --------------------------------------------------------------- */
  safe('hus', () => {
    const stage = $('#stage');
    const state = houseState;

    /* Statisk SVG-udgave, hvis WebGL ikke virker */
    const svgApi = {
      setLayer: (name, on) => $$('#house-svg [data-layer="' + name + '"]').forEach((g) => g.classList.toggle('is-off', !on)),
      setManual: () => svgApi.sync(),
      setScroll: () => svgApi.sync(),
      setActive: () => {},
      sync: () => stage.classList.toggle('is-exploded', state.manual || state.scroll > 0.5)
    };
    const applyState = () => {
      if (!houseApi) return;
      Object.keys(state.layers).forEach((k) => houseApi.setLayer(k, state.layers[k]));
      houseApi.setManual(state.manual);
      houseApi.setScroll(state.scroll);
      houseApi.setActive(state.active);
    };

    $$('.layer[data-layer]').forEach((b) => {
      b.addEventListener('click', () => {
        const k = b.dataset.layer;
        state.layers[k] = !state.layers[k];
        b.setAttribute('aria-pressed', String(state.layers[k]));
        if (houseApi) houseApi.setLayer(k, state.layers[k]);
      });
    });
    const explode = $('#explode');
    const syncExplode = () => {
      explode.setAttribute('aria-pressed', String(state.manual));
      explode.textContent = state.manual ? 'Saml' : 'Adskil';
    };
    syncExplode();
    explode.addEventListener('click', () => {
      state.manual = !state.manual;
      syncExplode();
      if (houseApi) houseApi.setManual(state.manual);
    });

    const load = () => {
      import('./house.js')
        .then((m) => {
          houseApi = m.init(stage, { reduced, label: $('#house-label') });
          stage.classList.add('is-3d');
          applyState();
        })
        .catch((err) => {
          console.warn('3D-modellen kunne ikke vises. Bruger tegningen i stedet.', err);
          stage.classList.add('is-fallback');
          houseApi = svgApi;
          applyState();
        });
    };
    requestAnimationFrame(() => setTimeout(load, 0));
  });
})();
