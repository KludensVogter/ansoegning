/* =====================================================================
   main.js – indstillinger, animationer og interaktioner
   Bevægelsessystem: 0,2 s / 0,6 s / 0,9–1,2 s · power3.out / expo.out
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
  const ST = window.ScrollTrigger;
  const animate = !reduced && !!gsap && !!ST;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (!animate) root.classList.remove('anim');
  else gsap.registerPlugin(ST);

  const safe = (name, fn) => {
    try { fn(); } catch (err) { console.error('[' + name + ']', err); }
  };
  const showAll = () => {
    root.classList.remove('anim');
    $$('[data-reveal], [data-intro], [data-mask] > span, .hero-title .line > span').forEach((el) => {
      el.style.opacity = 1; el.style.transform = 'none';
    });
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

  /* Billeder, der kun vises, hvis filerne findes */
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

  /* ---------------------------------------------------------------
     2. Blød scroll (Lenis) koblet til ScrollTrigger
     --------------------------------------------------------------- */
  let lenis = null;
  safe('lenis', () => {
    if (!animate || !window.Lenis) return;
    lenis = new window.Lenis({ duration: 1.1, easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  });

  const scrollToEl = (el) => {
    if (lenis) lenis.scrollTo(el, { duration: 1.2 });
    else el.scrollIntoView({ behavior: 'auto', block: 'start' });
  };

  /* ---------------------------------------------------------------
     3. Topbjælke, statuslinje, aktivt menupunkt, mobilmenu
     --------------------------------------------------------------- */
  let menuOpen = false;
  const setMenu = (open) => {
    menuOpen = open;
    root.classList.toggle('menu-open', open);
    const burger = $('#burger');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Luk menu' : 'Åbn menu');
    $('#menu').setAttribute('aria-hidden', String(!open));
    $('#indhold').inert = open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
  };

  safe('topbar', () => {
    const topbar = $('#topbar');
    const bar = $('#progress');
    let lastY = window.scrollY;
    let max = 1;
    const measure = () => { max = Math.max(1, root.scrollHeight - window.innerHeight); };
    const onScroll = () => {
      const y = window.scrollY;
      bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, y / max)) + ')';
      topbar.classList.toggle('is-scrolled', y > 24);
      if (Math.abs(y - lastY) > 6) {
        const hide = y > lastY && y > 200 && !menuOpen && !topbar.contains(document.activeElement);
        topbar.classList.toggle('is-hidden', hide);
        lastY = y;
      }
    };
    measure();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { measure(); onScroll(); });
    new ResizeObserver(() => { measure(); onScroll(); }).observe(document.body);
    topbar.addEventListener('focusin', () => topbar.classList.remove('is-hidden'));

    /* Aktivt menupunkt følger sektionen */
    const links = $$('.nav a');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => {
          if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -54% 0px' });
    $$('[data-section]').forEach((s) => io.observe(s));
    const heroIo = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) links.forEach((a) => a.removeAttribute('aria-current'));
    }, { rootMargin: '-45% 0px -54% 0px' });
    heroIo.observe($('#top'));

    /* Ankerlinks med blød scroll */
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      if (menuOpen) setMenu(false);
      scrollToEl(target);
      if (a.classList.contains('skip')) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
    });

    $('#burger').addEventListener('click', () => setMenu(!menuOpen));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuOpen) { setMenu(false); $('#burger').focus(); }
    });
    matchMedia('(min-width: 1040px)').addEventListener('change', (e) => { if (e.matches && menuOpen) setMenu(false); });
  });

  /* ---------------------------------------------------------------
     4. Intro ved indlæsning + afsløringer ved scroll
     --------------------------------------------------------------- */
  if (animate) {
    try {
      gsap.to('.hero-title .line > span', { y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1 });
      gsap.fromTo('[data-intro]', { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08, delay: 0.15 });

      gsap.set('[data-reveal]', { y: 24 });
      ST.batch('[data-reveal]', {
        start: 'top 90%', once: true,
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08, overwrite: true })
      });
      $$('[data-mask]').forEach((h) => {
        ST.create({
          trigger: h, start: 'top 90%', once: true,
          onEnter: () => gsap.to(h.firstElementChild, { y: 0, duration: 0.9, ease: 'expo.out' })
        });
      });
    } catch (err) { console.error('[afsløringer]', err); showAll(); }
  }

  /* Nøgleudsagn: ordene lyser op ét ad gangen */
  safe('udsagn', () => {
    if (!animate) return;
    const el = $('#statement');
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      el.append(s, i < words.length - 1 ? ' ' : '');
    });
    const spans = $$('.w', el);
    gsap.set(spans, { opacity: 0.16 });
    gsap.to(spans, {
      opacity: 1, ease: 'none', stagger: 0.2,
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'top 36%', scrub: true }
    });
  });

  /* ---------------------------------------------------------------
     5. Tidslinje: vandret og fastgjort på desktop, lodret på mobil
     --------------------------------------------------------------- */
  safe('tidslinje', () => {
    const stations = $$('.tl-station');
    if (!animate) { stations.forEach((s) => s.classList.add('is-in')); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.3 });
    stations.forEach((s) => io.observe(s));

    const track = $('#tl-track');
    const line = $('#tl-line');
    const mm = gsap.matchMedia();

    mm.add('(min-width: 960px) and (min-height: 620px)', () => {
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.tl-pin', pin: true, start: 'top top',
          end: () => '+=' + dist(), scrub: true, invalidateOnRefresh: true, anticipatePin: 1
        }
      });
      tl.to(track, { x: () => -dist(), ease: 'none' }, 0)
        .fromTo(line, { scaleX: 0, scaleY: 1 }, { scaleX: 1, ease: 'none' }, 0);
    });

    mm.add('(max-width: 959.98px), (max-height: 619.98px)', () => {
      gsap.fromTo(line, { scaleY: 0, scaleX: 1 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '.tl-list', start: 'top 75%', end: 'bottom 65%', scrub: true }
      });
    });
  });

  /* ---------------------------------------------------------------
     6. Kort: åbn/luk, tilt mod musen og lysskær
     --------------------------------------------------------------- */
  safe('kort', () => {
    $$('.card').forEach((card) => {
      const btn = $('.card-toggle', card);
      btn.addEventListener('click', () => {
        const open = !card.classList.contains('is-open');
        card.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });

      if (!animate || !finePointer) return;
      const glow = $('.card-glow', card);
      gsap.set(card, { transformPerspective: 1000 });
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      const gx = gsap.quickTo(glow, 'x', { duration: 0.6, ease: 'power3.out' });
      const gy = gsap.quickTo(glow, 'y', { duration: 0.6, ease: 'power3.out' });
      card.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * 12); rx(-py * 12);                 /* højst 6° */
        gx(e.clientX - r.left); gy(e.clientY - r.top);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  });

  /* ---------------------------------------------------------------
     7. Kompetencer: filter med FLIP-animation
     --------------------------------------------------------------- */
  safe('filter', () => {
    const list = $('#tags');
    const tags = $$('.tag', list);
    const buttons = $$('.filter');
    let current = 'alle';
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
      current = cat;
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
          /* forlader: tages ud af flowet og toner ud */
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
    buttons.forEach((b) => b.addEventListener('click', () => { if (b.dataset.filter !== current) apply(b.dataset.filter); }));
  });

  /* ---------------------------------------------------------------
     8. Terminal: afspiller den rigtige git-historik
     --------------------------------------------------------------- */
  safe('terminal', () => {
    const body = $('#term-body');
    const cmdText = 'git log --oneline --reverse';
    const line = (cls) => { const d = document.createElement('div'); d.className = 'term-line ' + cls; return d; };
    const span = (cls, text) => { const s = document.createElement('span'); s.className = cls; s.textContent = text; return s; };

    const cmd = line('term-cmd');
    const cmdMsg = span('msg', animate ? '' : cmdText);
    cmd.append(span('prompt', '$'), cmdMsg);
    body.append(cmd);
    const rows = COMMITS.map(([hash, msg]) => {
      const d = line('is-wait');
      d.append(span('hash', hash), span('msg', msg));
      body.append(d);
      return d;
    });
    const end = line('term-cmd is-wait');
    const caret = document.createElement('span');
    caret.className = 'term-caret';
    end.append(span('prompt', '$'), caret);
    body.append(end);
    $('#term').setAttribute('aria-label', 'Terminalvindue med sidens git-historik: ' + COMMITS.map((c) => c[1]).join('. '));

    if (!animate) return;
    ST.create({
      trigger: '#term', start: 'top 75%', once: true,
      onEnter: () => {
        let i = 0;
        const type = () => {
          cmdMsg.textContent = cmdText.slice(0, ++i);
          if (i < cmdText.length) setTimeout(type, 38);
          else gsap.to([...rows, end], { opacity: 1, duration: 0.2, ease: 'power3.out', stagger: 0.14, delay: 0.3 });
        };
        setTimeout(type, 300);
      }
    });
  });

  /* ---------------------------------------------------------------
     9. Kontakt: kopiér e-mail + magnetiske knapper
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
     10. Skærmbilleder af værktøjerne (kun hvis filerne findes) + lightbox
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
        if (animate) ST.refresh();
      });
    });
  });

  /* ---------------------------------------------------------------
     11. 3D-huset: lagknapper, adskil/saml og scroll. Indlæses efter siden.
     --------------------------------------------------------------- */
  safe('hus', () => {
    const stage = $('#stage');
    const state = { layers: { konstruktion: true, arkitekt: true, mep: true, tag: true }, manual: reduced, scroll: 0 };
    let api = null;

    /* Statisk SVG-udgave, hvis WebGL ikke virker */
    const svgApi = {
      setLayer: (name, on) => $$('#house-svg [data-layer="' + name + '"]').forEach((g) => g.classList.toggle('is-off', !on)),
      setManual: () => svgApi.sync(),
      setScroll: () => svgApi.sync(),
      sync: () => stage.classList.toggle('is-exploded', state.manual || state.scroll > 0.5)
    };
    const applyState = () => {
      if (!api) return;
      Object.keys(state.layers).forEach((k) => api.setLayer(k, state.layers[k]));
      api.setManual(state.manual);
      api.setScroll(state.scroll);
    };

    $$('.layer[data-layer]').forEach((b) => {
      b.addEventListener('click', () => {
        const k = b.dataset.layer;
        state.layers[k] = !state.layers[k];
        b.setAttribute('aria-pressed', String(state.layers[k]));
        if (api) api.setLayer(k, state.layers[k]);
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
      if (api) api.setManual(state.manual);
    });

    if (animate) {
      const mm = gsap.matchMedia();
      const onUpdate = (self) => { state.scroll = self.progress; if (api) api.setScroll(state.scroll); };
      mm.add('(min-width: 960px)', () => {
        ST.create({ trigger: '#top', start: 'top top', end: () => '+=' + window.innerHeight * 0.5, onUpdate, onRefresh: onUpdate });
      });
      mm.add('(max-width: 959.98px)', () => {
        ST.create({ trigger: stage, start: 'top 50%', end: 'top 12%', onUpdate, onRefresh: onUpdate });
      });
    }

    const load = () => {
      import('./house.js')
        .then((m) => {
          api = m.init(stage, { reduced, label: $('#house-label') });
          stage.classList.add('is-3d');
          applyState();
        })
        .catch((err) => {
          console.warn('3D-modellen kunne ikke vises. Bruger tegningen i stedet.', err);
          stage.classList.add('is-fallback');
          api = svgApi;
          applyState();
        });
    };
    requestAnimationFrame(() => setTimeout(load, 0));
  });

  /* Genberegn positioner, når skrifttyperne er indlæst */
  if (animate && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ST.refresh());
  }
})();
