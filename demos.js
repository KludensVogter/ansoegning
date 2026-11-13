/* =====================================================================
   demos.js – kopier af brugerfladerne i RFAtool og KNtool.
   Opbygningen følger skærmbillederne af de rigtige apps. Alt indhold er
   eksempeldata (pladsholdere), og kopierne er mærket sådan på siden.
   Kopierne starter deres lille forløb, når de får hændelsen "demostart"
   fra main.js (når fokuspunktet kommer i fokus, eller demoen åbnes).
   ===================================================================== */
(() => {
  'use strict';

  const reduced = REDUCED_MOTION;
  const gsap = window.gsap;
  const animate = !reduced && !!gsap;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const frag = (markup) => { const t = document.createElement('template'); t.innerHTML = markup.trim(); return t.content; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const icon = (d, cls) => '<svg class="' + (cls || 'a-ico') + '" viewBox="0 0 16 16" aria-hidden="true"><path d="' + d + '"/></svg>';

  const ICON = {
    gear: 'M8 5.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8zM8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.4 3.4l1.3 1.3M11.3 11.3l1.3 1.3M3.4 12.6l1.3-1.3M11.3 4.7l1.3-1.3',
    chev: 'M4 6l4 4 4-4',
    doc: 'M4 1.5h5.5L12 4v10.5H4zM9.5 1.5V4H12M6 8h4M6 10.5h4',
    up: 'M8 10.5V2.5M5 5.5l3-3 3 3M3 10v3.5h10V10',
    down: 'M8 2.5v8M5 7.5l3 3 3-3M3 10v3.5h10V10',
    edit: 'M10.5 2.5l3 3-7.5 7.5H3v-3z',
    copy: 'M5.5 5.5h8v8h-8zM2.5 10.5v-8h8',
    trash: 'M3 4.5h10M6 4.5v-2h4v2M4.5 4.5l.5 9h6l.5-9',
    search: 'M7 2.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM10.4 10.4l3.1 3.1',
    star: 'M8 2l1.8 3.8 4.2.5-3.1 2.9.8 4.1L8 11.3l-3.7 2 .8-4.1L2 6.3l4.2-.5z',
    folder: 'M1.5 4h4.5l1.5 1.5h7v7.5h-13z',
    share: 'M11.5 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM4.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM11.5 14a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM6 7.3l4-2.6M6 8.7l4 2.6'
  };

  /* Bytter plads med en glidende bevægelse (FLIP), når noget filtreres */
  const flip = (items, change) => {
    if (!animate) { change(); return; }
    const first = new Map(items.map((el) => [el, el.hidden ? null : el.getBoundingClientRect()]));
    gsap.killTweensOf(items);
    gsap.set(items, { clearProps: 'transform,opacity' });
    change();
    items.forEach((el) => {
      if (el.hidden) return;
      const f = first.get(el);
      const l = el.getBoundingClientRect();
      if (!f) gsap.fromTo(el, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' });
      else if (Math.abs(f.left - l.left) > 0.5 || Math.abs(f.top - l.top) > 0.5) {
        gsap.fromTo(el, { x: f.left - l.left, y: f.top - l.top }, { x: 0, y: 0, duration: 0.6, ease: 'power3.out' });
      }
    });
  };

  /* ---------------------------------------------------------------
     RFAtool: indeks over families med søgning, kategorier og filtre
     --------------------------------------------------------------- */
  const FAMILIES = [
    ['Dør_Enkel_90x210', 'Doors', 'Producent A', 4], ['Dør_Enkel_100x210', 'Doors', 'Producent A', 4],
    ['Dør_Dobbelt_180x210', 'Doors', 'Producent A', 3], ['Dør_Skyde_90x210', 'Doors', 'Producent B', 2],
    ['Dør_Brand_EI30_90x210', 'Doors', 'Producent B', 2], ['Dør_Terrasse_90x220', 'Doors', 'Producent C', 3],
    ['Port_Ledhejs_300x300', 'Doors', 'Producent C', 2],
    ['Vindue_Fast_120x120', 'Windows', 'Producent A', 5], ['Vindue_Fast_60x120', 'Windows', 'Producent A', 5],
    ['Vindue_Dreje-Kip_90x120', 'Windows', 'Producent B', 4], ['Vindue_Topstyret_120x90', 'Windows', 'Producent B', 4],
    ['Vindue_Ovenlys_78x118', 'Windows', 'Producent C', 2], ['Vindue_Parti_240x220', 'Windows', '', 1],
    ['Køkken_Underskab_60', 'Casework', '', 6], ['Køkken_Overskab_60', 'Casework', '', 4],
    ['Køkken_Højskab_60', 'Casework', '', 3], ['Garderobe_Skab_100', 'Casework', '', 2],
    ['Bord_Arbejde_160x80', 'Furniture', '', 2], ['Stol_Kontor', 'Furniture', '', 1],
    ['Sanitet_WC_Væghængt', 'Plumbing Fixtures', 'Producent C', 1], ['Sanitet_Håndvask_60', 'Plumbing Fixtures', 'Producent C', 2],
    ['Sanitet_Bruseniche_90x90', 'Plumbing Fixtures', '', 1], ['Sanitet_Gulvafløb', 'Plumbing Fixtures', '', 1],
    ['Bjælke_Limtræ_90x315', 'Structural Framing', '', 3], ['Spær_Gitter_25gr', 'Structural Framing', '', 2],
    ['Fundament_Punkt_60x60', 'Generic Models', '', 1], ['Symbol_Nordpil', 'Generic Models', '', 1]
  ];
  const THUMB = {
    'Doors': 'M15 6h18v36H15zM29 24v3M9 42h30',
    'Windows': 'M8 10h32v28H8zM24 10v28M8 24h32',
    'Casework': 'M10 8h28v32H10zM24 8v32M20 22v4M28 22v4',
    'Furniture': 'M6 18h36M10 18v20M38 18v20M10 28h28',
    'Plumbing Fixtures': 'M10 20h28v5a11 11 0 0 1-11 11h-6a11 11 0 0 1-11-11zM24 20v-8h7',
    'Structural Framing': 'M4 36h40L24 14zM14 36l5-11M34 36l-5-11M24 14v22',
    'Generic Models': 'M24 6l16 9v18l-16 9-16-9V15zM8 15l16 9 16-9M24 24v18'
  };

  const initRfa = () => {
    const root = $('#app-rfa');
    if (!root) return;
    const total = FAMILIES.length;
    const cats = [...new Set(FAMILIES.map((f) => f[1]))].sort();
    const makers = ['Producent A', 'Producent B', 'Producent C', ''];
    const countBy = (i, v) => FAMILIES.filter((f) => f[i] === v).length;

    root.append(frag(`
      <aside class="a-side">
        <p class="a-brand"><b>RFAtool</b><span>Families</span></p>
        <div class="a-select">Families ${icon(ICON.chev)}</div>
        <p class="a-side-note">Standard</p>
        <button class="a-nav is-active" type="button" data-cat=""><span>Alle families</span><i>${total}</i></button>
        <p class="a-side-head"><span>3D</span><i>${total}</i></p>
        <div class="a-navlist">
          ${cats.map((c) => `<button class="a-nav a-nav-sub" type="button" data-cat="${esc(c)}"><span>${esc(c)}</span><i>${countBy(1, c)}</i></button>`).join('')}
        </div>
        <div class="a-side-foot"><div class="a-ghost">+ Tilføj bibliotek …</div>${icon(ICON.gear, 'a-ico a-gear')}</div>
      </aside>
      <div class="a-main">
        <header class="a-head">
          <div class="a-head-text"><p class="a-title">Families</p><p class="a-path">C:\\Eksempel\\Bibliotek\\Families</p></div>
          <div class="a-head-btns">
            <button class="a-btn" type="button" id="rfa-view">Liste</button>
            <span class="a-sep"></span>
            <span class="a-btn a-static a-hide-s">Regler</span>
            <button class="a-btn" type="button" id="rfa-reindex">Indeksér igen</button>
          </div>
        </header>
        <div class="a-bar">
          <label class="a-search">${icon(ICON.search)}<span class="visually-hidden">Søg i families</span>
            <input id="rfa-input" type="search" placeholder="Søg, fx vindue 120" autocomplete="off" spellcheck="false"></label>
          <button class="a-link" type="button" id="rfa-clear">Ryd filtre</button>
          <span class="a-link a-static a-hide-s">Gem som samling</span>
          <span class="a-pill" id="rfa-count" aria-live="polite"></span>
        </div>
        <div class="rfa-body">
          <div class="rfa-facets">
            <p class="a-caps">Manufacturer</p>
            ${makers.map((m) => `<label class="a-check"><input type="checkbox" data-maker="${esc(m)}"><span>${m ? esc(m) : 'Ikke angivet'}</span><i>${countBy(2, m)}</i></label>`).join('')}
            <hr>
            <label class="a-check"><input type="checkbox" id="rfa-fav"><span>Kun favoritter</span></label>
          </div>
          <div class="rfa-grid" id="rfa-grid">
            ${FAMILIES.map((f, i) => `
              <article class="rfa-card" data-i="${i}">
                <button class="rfa-star" type="button" aria-label="Favorit: ${esc(f[0])}" aria-pressed="false">${icon(ICON.star)}</button>
                <div class="rfa-thumb"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="${THUMB[f[1]]}"/></svg></div>
                <p class="rfa-name">${esc(f[0])}</p>
                <p class="rfa-meta">${esc(f[1])} · ${f[3]} ${f[3] === 1 ? 'type' : 'typer'}</p>
              </article>`).join('')}
            <p class="rfa-empty" hidden>Ingen families matcher.</p>
          </div>
        </div>
      </div>`));

    const input = $('#rfa-input', root);
    const grid = $('#rfa-grid', root);
    const count = $('#rfa-count', root);
    const empty = $('.rfa-empty', root);
    const navs = $$('.a-nav', root);
    const cards = $$('.rfa-card', root).map((el) => {
      const f = FAMILIES[Number(el.dataset.i)];
      return { el, cat: f[1], maker: f[2], fav: false, hay: (f[0] + ' ' + f[1] + ' ' + f[2]).toLowerCase().replace(/_/g, ' ') };
    });
    const els = cards.map((c) => c.el);
    const state = { cat: '', makers: new Set(), favOnly: false };

    const apply = () => {
      const tokens = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      let hits = 0;
      flip(els, () => {
        cards.forEach((c) => {
          const ok = tokens.every((t) => c.hay.includes(t)) &&
            (!state.cat || c.cat === state.cat) &&
            (!state.makers.size || state.makers.has(c.maker)) &&
            (!state.favOnly || c.fav);
          c.el.hidden = !ok;
          if (ok) hits++;
        });
        empty.hidden = hits > 0;
      });
      count.innerHTML = '<b>' + hits + '</b> af ' + total;
    };
    apply();

    input.addEventListener('input', apply);
    navs.forEach((b) => b.addEventListener('click', () => {
      state.cat = b.dataset.cat;
      navs.forEach((n) => n.classList.toggle('is-active', n === b));
      apply();
    }));
    $$('[data-maker]', root).forEach((cb) => cb.addEventListener('change', () => {
      if (cb.checked) state.makers.add(cb.dataset.maker); else state.makers.delete(cb.dataset.maker);
      apply();
    }));
    $('#rfa-fav', root).addEventListener('change', (e) => { state.favOnly = e.target.checked; apply(); });
    cards.forEach((c) => $('.rfa-star', c.el).addEventListener('click', (e) => {
      c.fav = !c.fav;
      e.currentTarget.setAttribute('aria-pressed', String(c.fav));
      c.el.classList.toggle('is-fav', c.fav);
      if (state.favOnly) apply();
    }));
    $('#rfa-clear', root).addEventListener('click', () => {
      input.value = ''; state.cat = ''; state.makers.clear(); state.favOnly = false;
      $$('input[type="checkbox"]', root).forEach((cb) => { cb.checked = false; });
      navs.forEach((n) => n.classList.toggle('is-active', n.dataset.cat === ''));
      apply();
    });
    const viewBtn = $('#rfa-view', root);
    viewBtn.addEventListener('click', () => {
      flip(els, () => grid.classList.toggle('is-list'));
      viewBtn.textContent = grid.classList.contains('is-list') ? 'Gitter' : 'Liste';
    });
    $('#rfa-reindex', root).addEventListener('click', () => {
      count.textContent = 'Indekserer …';
      setTimeout(apply, reduced ? 0 : 900);
      if (animate) gsap.fromTo(els.filter((el) => !el.hidden), { opacity: 0.25 }, { opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.03 });
    });

    /* Skriver selv "dør 9", første gang kopien kommer i fokus */
    if (reduced) return;
    let cancelled = false;
    const cancel = () => { cancelled = true; };
    root.addEventListener('pointerdown', cancel, { once: true });
    input.addEventListener('keydown', cancel, { once: true });
    root.closest('.demo').addEventListener('demostart', () => {
      const text = 'dør 9';
      let i = 0;
      const type = () => {
        if (cancelled) return;
        input.value = text.slice(0, ++i);
        apply();
        if (i < text.length) setTimeout(type, 170);
      };
      setTimeout(type, 500);
    }, { once: true });
  };

  /* ---------------------------------------------------------------
     KNtool: keynotes pr. projekt i træstruktur
     --------------------------------------------------------------- */
  const TREE = [
    { code: '2', name: 'Primære bygningsdele', kids: [
      { code: '21', name: 'Ydervægge', kids: [
        { code: '214', name: 'Udvendige skeletkonstruerede vægge', notes: [
          { title: 'Let ydervæg, type 1', lines: ['Beklædning', 'Afstandsliste og vindplade', 'Træskelet med isolering', 'Dampspærre og gipsplade'] }
        ] }
      ] },
      { code: '22', name: 'Indervægge', kids: [
        { code: '224', name: 'Indvendige skeletkonstruerede vægge', notes: [
          { title: 'Let skillevæg, type 1', lines: ['Gipsplade', 'Træskelet med isolering', 'Gipsplade'], chips: ['Brand: eksempel', 'Lyd: eksempel'], src: 'Kilde: eksempel' }
        ] }
      ] }
    ] },
    { code: '3', name: 'Kompletterende bygningsdele', kids: [] }
  ];
  const NEXT_NOTES = {
    '224': [{ title: 'Let skillevæg, type 2', lines: ['Gipsplade', 'Stålskelet med isolering', 'Gipsplade'], chips: ['Brand: eksempel', 'Lyd: eksempel'], src: 'Kilde: eksempel' }],
    '214': [{ title: 'Let ydervæg, type 2', lines: ['Beklædning', 'Vindplade', 'Træskelet med isolering', 'Gipsplade'] }]
  };

  const initKn = () => {
    const root = $('#app-kn');
    if (!root) return;

    const cardMarkup = (num, n) => `
      <article class="kn-card">
        <span class="kn-num">${esc(num)}</span>
        <div class="kn-body">
          <p class="kn-title">${esc(n.title)}</p>
          <p class="kn-lines">${n.lines.map(esc).join('<br>')}</p>
          ${n.chips ? '<p class="kn-chips">' + n.chips.map((c) => '<span>' + esc(c) + '</span>').join('') + '</p>' : ''}
          ${n.src ? '<p class="kn-src">' + esc(n.src) + '</p>' : ''}
        </div>
        <div class="kn-tools">${icon(ICON.doc)}${icon(ICON.up)}${icon(ICON.edit)}${icon(ICON.copy)}
          <button class="kn-del" type="button" aria-label="Slet ${esc(n.title)}">${icon(ICON.trash)}</button></div>
      </article>`;
    const nodeMarkup = (n, lvl) => `
      <div class="kn-node${n.kids && !n.kids.length ? ' is-empty' : ''}" data-code="${n.code}">
        <button class="kn-row kn-lvl-${lvl}" type="button" aria-expanded="${n.kids && !n.kids.length ? 'false' : 'true'}">
          <i class="kn-tri"></i><span class="kn-code">${n.code}</span><span class="kn-name">${esc(n.name)}</span>
        </button>
        <div class="kn-kids"><div class="kn-kids-in">
          ${n.notes
            ? n.notes.map((note, i) => cardMarkup(n.code + '.' + String(i + 1).padStart(2, '0'), note)).join('') +
              `<div class="kn-add-row"><button class="kn-add" type="button">+ Tilføj</button><span class="kn-add a-static">Importér ${icon(ICON.chev)}</span></div>`
            : (n.kids.length ? n.kids.map((k) => nodeMarkup(k, lvl + 1)).join('') : '<p class="kn-none">Ingen keynotes endnu.</p>')}
        </div></div>
      </div>`;

    root.append(frag(`
      <aside class="a-side">
        <p class="a-brand"><b>KNtool</b><span>BIM7AA 2022 DK</span></p>
        <div class="a-tabs"><span class="is-active">Projekter</span><span>Bibliotek</span></div>
        <p class="a-side-head"><span>Projekter</span><i>Manuel</i></p>
        <div class="a-navlist" id="kn-projects">
          <button class="a-nav a-proj is-active" type="button"><span>Eksempelprojekt 1</span>${icon(ICON.share)}</button>
          <button class="a-nav a-proj" type="button"><span>Eksempelprojekt 2</span></button>
          <button class="a-nav a-proj" type="button"><span>Eksempelprojekt 3</span></button>
        </div>
        <button class="a-new" type="button" id="kn-new">+ Nyt projekt</button>
        <div class="a-ghost">Åbn delt projekt …</div>
        <div class="a-side-foot"><span></span>${icon(ICON.gear, 'a-ico a-gear')}</div>
      </aside>
      <div class="a-main">
        <header class="a-head">
          <div class="a-head-text">
            <p class="a-title"><span id="kn-title">Eksempelprojekt 1</span> <span class="a-tag">Delt</span></p>
            <p class="a-path">${icon(ICON.folder, 'a-ico a-folder')}<span id="kn-path">C:\\Eksempel\\Eksempelprojekt 1 - Keynote.txt</span>
              <span class="a-warn" id="kn-changes" hidden></span></p>
          </div>
          <div class="a-head-btns">
            <span class="a-btn a-icon a-static a-hide-s">${icon(ICON.down)}</span>
            <span class="a-btn a-icon a-static a-hide-s">${icon(ICON.up)}</span>
            <button class="a-btn a-primary" type="button" id="kn-export">Eksportér</button>
          </div>
        </header>
        <div class="a-bar">
          <label class="a-search">${icon(ICON.search)}<span class="visually-hidden">Søg i keynotes</span>
            <input id="kn-input" type="search" placeholder="Søg, fx skillevæg, gips" autocomplete="off" spellcheck="false"></label>
          <label class="a-check a-check-inline"><input type="checkbox" id="kn-only" checked><span>Kun tilføjede</span></label>
          <button class="a-btn" type="button" id="kn-fold">Fold alt ind</button>
          <span class="a-pill" id="kn-count" aria-live="polite"></span>
        </div>
        <div class="kn-tree is-only" id="kn-tree">${TREE.map((n) => nodeMarkup(n, 1)).join('')}</div>
      </div>`));

    const tree = $('#kn-tree', root);
    const count = $('#kn-count', root);
    const changesEl = $('#kn-changes', root);
    const input = $('#kn-input', root);
    const foldBtn = $('#kn-fold', root);
    let changes = 0;
    let touched = false;

    const refresh = () => {
      const n = $$('.kn-card', tree).length;
      count.innerHTML = '<b>' + n + '</b> tilføjede elementer';
      changesEl.hidden = changes === 0;
      changesEl.textContent = changes + (changes === 1 ? ' ændring' : ' ændringer') + ' siden eksport';
    };
    const setOpen = (row, open) => row.setAttribute('aria-expanded', String(open));
    /* Træet kan kun rulle, når indholdet er højere end feltet. Ellers ruller musehjulet siden som normalt. */
    const syncScroll = () => tree.toggleAttribute('data-lenis-prevent', tree.scrollHeight > tree.clientHeight + 1);
    const syncSoon = () => { syncScroll(); setTimeout(syncScroll, 700); };
    const syncFold = () => {
      const anyOpen = $$('.kn-node:not(.is-empty) > .kn-row', tree).some((r) => r.getAttribute('aria-expanded') === 'true');
      foldBtn.textContent = anyOpen ? 'Fold alt ind' : 'Fold alt ud';
    };
    /* træet ruller selv, så det nye indhold kommer med i billedet */
    const reveal = (el, extra) => {
      const over = el.getBoundingClientRect().bottom + (extra || 0) - tree.getBoundingClientRect().bottom;
      if (over <= 0) return;
      if (animate) gsap.to(tree, { scrollTop: tree.scrollTop + over, duration: 0.6, ease: 'power3.out' });
      else tree.scrollTop += over;
    };

    const addNote = (node) => {
      const code = node.dataset.code;
      const row = $('.kn-add-row', node);
      const n = $$('.kn-card', node).length + 1;
      const note = (NEXT_NOTES[code] && NEXT_NOTES[code].shift()) ||
        { title: 'Ny keynote ' + n, lines: ['Lag 1', 'Lag 2', 'Lag 3'] };
      row.before(frag(cardMarkup(code + '.' + String(n).padStart(2, '0'), note)));
      const card = row.previousElementSibling;
      let p = node;
      while (p && p !== tree) { if (p.classList.contains('kn-node')) setOpen($('.kn-row', p), true); p = p.parentElement; }
      changes++;
      refresh(); syncFold(); syncSoon();
      reveal(row, 12);
      card.classList.add('is-new');
      if (animate) gsap.from(card, { height: 0, opacity: 0, marginBottom: 0, duration: 0.6, ease: 'power3.out', clearProps: 'height,opacity,marginBottom' });
    };

    tree.addEventListener('click', (e) => {
      const row = e.target.closest('.kn-row');
      const add = e.target.closest('button.kn-add');
      const del = e.target.closest('.kn-del');
      if (row) { setOpen(row, row.getAttribute('aria-expanded') !== 'true'); syncFold(); syncSoon(); }
      else if (add) addNote(add.closest('.kn-node'));
      else if (del) {
        const card = del.closest('.kn-card');
        const done = () => { card.remove(); changes++; refresh(); syncSoon(); };
        if (animate) gsap.to(card, { height: 0, opacity: 0, marginBottom: 0, duration: 0.2, ease: 'power3.out', onComplete: done });
        else done();
      }
    });
    foldBtn.addEventListener('click', () => {
      const open = foldBtn.textContent === 'Fold alt ud';
      $$('.kn-node:not(.is-empty) > .kn-row', tree).forEach((r) => setOpen(r, open));
      syncFold(); syncSoon();
    });
    $('#kn-only', root).addEventListener('change', (e) => tree.classList.toggle('is-only', e.target.checked));
    input.addEventListener('input', () => {
      const tokens = input.value.toLowerCase().split(',').map((t) => t.trim()).filter(Boolean);
      $$('.kn-card', tree).forEach((card) => {
        const hay = card.textContent.toLowerCase();
        card.hidden = !tokens.every((t) => hay.includes(t));
      });
      $$('.kn-node', tree).forEach((node) => {
        node.classList.toggle('is-filtered', tokens.length > 0 && !$$('.kn-card', node).some((c) => !c.hidden));
      });
    });
    $('#kn-export', root).addEventListener('click', (e) => {
      changes = 0; refresh();
      const btn = e.currentTarget;
      btn.textContent = 'Eksporteret';
      setTimeout(() => { btn.textContent = 'Eksportér'; }, 1400);
    });

    /* projekter i sidepanelet */
    const projects = $('#kn-projects', root);
    const pick = (btn) => {
      $$('.a-proj', projects).forEach((b) => b.classList.toggle('is-active', b === btn));
      const name = $('span', btn).textContent;
      $('#kn-title', root).textContent = name;
      $('#kn-path', root).textContent = 'C:\\Eksempel\\' + name + ' - Keynote.txt';
    };
    projects.addEventListener('click', (e) => { const b = e.target.closest('.a-proj'); if (b) pick(b); });
    $('#kn-new', root).addEventListener('click', () => {
      const n = $$('.a-proj', projects).length + 1;
      if (n > 6) return;
      projects.append(frag('<button class="a-nav a-proj" type="button"><span>Eksempelprojekt ' + n + '</span></button>'));
      pick(projects.lastElementChild);
    });

    refresh(); syncFold(); syncSoon();
    window.addEventListener('resize', syncScroll);

    /* Første nye keynote kommer af sig selv, når kopien kommer i fokus */
    if (reduced) return;
    root.addEventListener('pointerdown', () => { touched = true; }, { once: true });
    root.closest('.demo').addEventListener('demostart', () => {
      setTimeout(() => { if (!touched) addNote($('.kn-node[data-code="224"]', tree)); }, 700);
    }, { once: true });
  };

  initRfa();
  initKn();
})();
