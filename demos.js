/* =====================================================================
   demos.js – de to interaktive illustrationer af RFAtool og KNtool.
   Navne og keynotes er opdigtede eksempler. Demoerne er mærket
   "Illustration" på siden.
   Rækkerne flyttes kun med transform og opacity, så intet i layoutet
   rykker sig.
   ===================================================================== */
(() => {
  'use strict';

  const reduced = REDUCED_MOTION;
  const $ = (s, r = document) => r.querySelector(s);
  const ROW = 36;            /* skal svare til --row-h i style.css */
  const MAX_ROWS = 9;

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const svg = (cls, d) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 16 16');
    s.setAttribute('class', cls);
    s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    s.append(p);
    return s;
  };
  const place = (node, index) => { node.style.transform = 'translateY(' + index * ROW + 'px)'; };
  const whenVisible = (node, fn) => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      fn();
    }, { threshold: 0.5 });
    io.observe(node);
  };

  /* ---------------------------------------------------------------
     RFAtool: søgning i families
     --------------------------------------------------------------- */
  const FAMILIES = [
    ['Dør_Enkel_90x210', 'Døre'], ['Dør_Enkel_100x210', 'Døre'], ['Dør_Dobbelt_180x210', 'Døre'],
    ['Dør_Skyde_90x210', 'Døre'], ['Dør_Brand_EI30_90x210', 'Døre'], ['Dør_Terrasse_90x220', 'Døre'],
    ['Port_Ledhejs_300x300', 'Døre'],
    ['Vindue_Fast_120x120', 'Vinduer'], ['Vindue_Fast_60x120', 'Vinduer'], ['Vindue_Dreje-Kip_90x120', 'Vinduer'],
    ['Vindue_Topstyret_120x90', 'Vinduer'], ['Vindue_Ovenlys_78x118', 'Vinduer'], ['Vindue_Parti_240x220', 'Vinduer'],
    ['Køkken_Underskab_60', 'Inventar'], ['Køkken_Overskab_60', 'Inventar'], ['Køkken_Højskab_60', 'Inventar'],
    ['Garderobe_Skab_100', 'Inventar'], ['Bord_Arbejde_160x80', 'Inventar'], ['Stol_Kontor', 'Inventar'],
    ['Sanitet_WC_Væghængt', 'Sanitet'], ['Sanitet_Håndvask_60', 'Sanitet'], ['Sanitet_Bruseniche_90x90', 'Sanitet'],
    ['Sanitet_Gulvafløb', 'Sanitet'],
    ['Bjælke_Limtræ_90x315', 'Konstruktion'], ['Søjle_Stål_HEB160', 'Konstruktion'], ['Spær_Gitter_25gr', 'Konstruktion'],
    ['Fundament_Punkt_60x60', 'Konstruktion'],
    ['Tag_Dør_Nummer', 'Annotation'], ['Tag_Rum_Areal', 'Annotation'], ['Symbol_Nordpil', 'Annotation']
  ];

  const initRfa = () => {
    const input = $('#rfa-input');
    const list = $('#rfa-list');
    if (!input || !list) return;
    const inner = $('.vlist-inner', list);
    const empty = $('.vlist-empty', list);
    const count = $('#rfa-count');

    const rows = FAMILIES.map(([name, folder]) => {
      const node = el('div', 'vrow');
      node.append(svg('ico', 'M3 2.5h6.5L13 6v7.5H3zM9.5 2.5V6H13'), el('b', '', name + '.rfa'), el('small', '', 'Families / ' + folder));
      inner.append(node);
      return { node, hay: (name + ' ' + folder).toLowerCase().replace(/_/g, ' ') };
    });

    const filter = (q) => {
      const tokens = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
      let hits = 0;
      let shown = 0;
      rows.forEach((r) => {
        const hit = tokens.every((t) => r.hay.includes(t));
        const show = hit && shown < MAX_ROWS;
        if (hit) hits++;
        if (show) { place(r.node, shown); shown++; }
        r.node.classList.toggle('is-hidden', !show);
        r.node.setAttribute('aria-hidden', String(!show));
      });
      empty.hidden = hits > 0;
      count.textContent = tokens.length
        ? hits + ' af ' + rows.length + ' families'
        : 'Viser ' + shown + ' af ' + rows.length + ' families';
    };
    filter('');
    input.addEventListener('input', () => filter(input.value));

    /* Skriver selv "dør 9", første gang demoen kommer frem */
    if (reduced) return;
    let cancelled = false;
    const cancel = () => { cancelled = true; };
    ['focus', 'pointerdown', 'keydown'].forEach((ev) => input.addEventListener(ev, cancel, { once: true }));
    whenVisible(list, () => {
      const text = 'dør 9';
      let i = 0;
      const type = () => {
        if (cancelled) return;
        input.value = text.slice(0, ++i);
        filter(input.value);
        if (i < text.length) setTimeout(type, 170);
      };
      setTimeout(type, 600);
    });
  };

  /* ---------------------------------------------------------------
     KNtool: keynotes i træstruktur
     --------------------------------------------------------------- */
  const GROUPS = [
    { key: '21', name: 'Ydervægge', items: [['21.1', 'Bagmur'], ['21.2', 'Isolering'], ['21.3', 'Formur']] },
    { key: '22', name: 'Indervægge', items: [['22.1', 'Gipsvæg'], ['22.2', 'Muret væg']] },
    { key: '23', name: 'Dæk', items: [['23.1', 'Terrændæk'], ['23.2', 'Etageadskillelse']] },
    { key: '27', name: 'Tage', items: [['27.1', 'Tagbelægning'], ['27.2', 'Undertag'], ['27.3', 'Spær']] },
    { key: '31', name: 'Vinduer og døre', items: [['31.1', 'Vinduer'], ['31.2', 'Yderdøre']] }
  ];
  const NEW_KEYNOTES = [
    ['21', '21.4', 'Murbindere'], ['27', '27.4', 'Tagrende'], ['22', '22.3', 'Glasvæg'],
    ['23', '23.3', 'Tagdæk'], ['31', '31.3', 'Indvendige døre']
  ];

  const initKn = () => {
    const list = $('#kn-list');
    const addBtn = $('#kn-add');
    if (!list || !addBtn) return;
    const inner = $('.vlist-inner', list);
    const count = $('#kn-count');
    let openKey = '21';
    const queue = NEW_KEYNOTES.slice();

    const makeItem = (key, name) => {
      const node = el('div', 'vrow kn-item');
      node.append(el('span', 'key', key), el('b', '', name));
      return node;
    };
    const groups = GROUPS.map((g) => {
      const head = el('button', 'vrow kn-group');
      head.type = 'button';
      const amount = el('small', '', '');
      head.append(svg('chev', 'M5 2.5 10.5 8 5 13.5'), el('b', '', g.key + ' ' + g.name), amount);
      inner.append(head);
      const group = { key: g.key, head, amount, items: [] };
      g.items.forEach(([k, n]) => {
        const node = makeItem(k, n);
        inner.append(node);
        group.items.push(node);
      });
      head.addEventListener('click', () => { openKey = openKey === g.key ? null : g.key; layout(); });
      return group;
    });

    const layout = () => {
      let i = 0;
      let total = 0;
      groups.forEach((g) => {
        const open = g.key === openKey;
        place(g.head, i++);
        g.head.setAttribute('aria-expanded', String(open));
        g.amount.textContent = String(g.items.length);
        total += g.items.length;
        g.items.forEach((node) => {
          /* lukkede rækker parkeres under gruppens overskrift, så de glider ud derfra */
          place(node, open ? i : i - 1);
          if (open) i++;
          node.classList.toggle('is-hidden', !open);
          node.setAttribute('aria-hidden', String(!open));
        });
      });
      count.textContent = total + ' keynotes';
    };
    layout();

    const add = () => {
      const next = queue.shift();
      if (!next) return;
      const [gKey, key, name] = next;
      const group = groups.find((g) => g.key === gKey);
      const node = makeItem(key, name);
      node.classList.add('is-hidden');
      group.items[group.items.length - 1].after(node);
      group.items.push(node);
      /* start under gruppens sidste række, og glid på plads */
      node.style.transform = group.items[group.items.length - 2].style.transform;
      void node.offsetWidth;
      openKey = gKey;
      layout();
      node.classList.add('is-new');
      if (!queue.length) { addBtn.disabled = true; addBtn.lastChild.textContent = 'Ikke flere eksempler'; }
    };
    addBtn.addEventListener('click', add);

    /* Første nye keynote kommer af sig selv, når demoen bliver synlig */
    if (reduced) return;
    let touched = false;
    list.addEventListener('pointerdown', () => { touched = true; }, { once: true });
    addBtn.addEventListener('pointerdown', () => { touched = true; }, { once: true });
    whenVisible(list, () => setTimeout(() => { if (!touched) add(); }, 900));
  };

  initRfa();
  initKn();
})();
