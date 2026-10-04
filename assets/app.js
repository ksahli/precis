/* precis — UI wiring. */
(() => {
  const $ = id => document.getElementById(id);
  const source = $('source');
  const result = $('result');
  const srcStats = $('src-stats');
  const outStats = $('out-stats');
  const lengthInput = $('length');
  const lengthOut = $('length-out');
  const copyBtn = $('copy');

  const DRAFT_KEY = 'precis:draft';
  const THEME_KEY = 'precis:theme';
  const MODE_KEY = 'precis:mode';

  let mode = 'summary';

  const SAMPLE = `The printing press did not simply make books cheaper. It changed what a book was for.
Before Gutenberg, a manuscript was a singular object, copied by hand and corrected by whoever happened
to be holding the pen. Two copies of the same text could disagree in hundreds of places, and no reader
had any way to know which was closer to the author's intent.

Print introduced something scribal culture had never managed at scale: identity between copies. A
thousand readers in a dozen cities could now point to the same page and the same line. Scholars could
cite each other precisely. Errors, once fixed, stayed fixed, and errata sheets became a genre of their
own. The fixity of the printed page is what made cumulative knowledge practical.

That fixity also hardened what it captured. A manuscript tradition absorbs correction continuously,
while an edition freezes a particular moment of understanding and sells five hundred copies of it.
Printers chose which dialect to set, which spelling to standardise, which commentary to bind alongside
the text. Those commercial decisions quietly became linguistic law.

The lesson is not that the technology dictated the outcome. It is that a change in how copies are made
rearranges who gets to decide what the copy says. Every medium since has repeated the pattern: the
mechanism of reproduction turns out to be a mechanism of authority.`;

  const store = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* private mode, blocked storage */ }
    },
  };

  /* ---------- rendering ---------- */

  function render() {
    const text = source.value.trim();
    const ratio = Number(lengthInput.value) / 100;

    const s = Precis.stats(text);
    srcStats.textContent = text
      ? `${s.words.toLocaleString()} words · ${s.sentences} sentences · ~${s.minutes} min read`
      : '0 words · 0 sentences';

    if (!text) {
      result.innerHTML = '<p class="empty">Your summary appears here as you type.</p>';
      outStats.textContent = '';
      return;
    }

    if (mode === 'terms') {
      renderTerms(text);
      return;
    }

    const picked = mode === 'outline' ? Precis.outline(text, ratio) : Precis.summary(text, ratio);

    if (!picked.length) {
      result.innerHTML = '<p class="empty">Not enough text to summarise yet.</p>';
      outStats.textContent = '';
      return;
    }

    if (mode === 'outline') {
      const list = document.createElement('ul');
      for (const sentence of picked) {
        const li = document.createElement('li');
        li.textContent = sentence.text;
        list.append(li);
      }
      result.replaceChildren(list);
    } else {
      result.replaceChildren(...picked.map(sentence => {
        const p = document.createElement('p');
        p.textContent = sentence.text;
        return p;
      }));
    }

    const kept = picked.reduce((n, sentence) => n + Precis.words(sentence.text).length, 0);
    const saved = s.words ? Math.round((1 - kept / s.words) * 100) : 0;
    outStats.textContent =
      `${picked.length} of ${s.sentences} sentences · ${kept.toLocaleString()} words · ${saved}% shorter`;
  }

  function renderTerms(text) {
    const terms = Precis.terms(text);
    if (!terms.length) {
      result.innerHTML = '<p class="empty">No term repeats often enough to stand out.</p>';
      outStats.textContent = '';
      return;
    }
    const list = document.createElement('ul');
    list.className = 'terms';
    for (const { term, n } of terms) {
      const li = document.createElement('li');
      li.textContent = term;
      const count = document.createElement('b');
      count.textContent = `×${n}`;
      li.append(count);
      list.append(li);
    }
    result.replaceChildren(list);
    outStats.textContent = `${terms.length} terms, ranked by how often they recur`;
  }

  /** Plain text of whatever is currently shown, for the clipboard. */
  function resultAsText() {
    if (mode === 'terms') {
      return [...result.querySelectorAll('.terms li')]
        .map(li => li.firstChild.textContent).join(', ');
    }
    const prefix = mode === 'outline' ? '— ' : '';
    return [...result.querySelectorAll('p, li')]
      .filter(el => !el.classList.contains('empty'))
      .map(el => prefix + el.textContent)
      .join('\n\n');
  }

  /* ---------- events ---------- */

  let pending;
  source.addEventListener('input', () => {
    clearTimeout(pending);
    pending = setTimeout(() => {
      render();
      store.set(DRAFT_KEY, source.value);
    }, 120);
  });

  lengthInput.addEventListener('input', () => {
    lengthOut.textContent = `${lengthInput.value}%`;
    render();
  });

  for (const tab of document.querySelectorAll('.mode')) {
    tab.addEventListener('click', () => {
      mode = tab.dataset.mode;
      for (const other of document.querySelectorAll('.mode')) {
        other.setAttribute('aria-selected', String(other === tab));
      }
      lengthInput.disabled = mode === 'terms';
      store.set(MODE_KEY, mode);
      render();
    });
  }

  copyBtn.addEventListener('click', async () => {
    const text = resultAsText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      flash(copyBtn, 'Copied');
    } catch {
      flash(copyBtn, 'Press ⌘/Ctrl+C');
    }
  });

  function flash(button, message) {
    const original = button.textContent;
    button.textContent = message;
    setTimeout(() => { button.textContent = original; }, 1400);
  }

  $('clear').addEventListener('click', () => {
    source.value = '';
    store.set(DRAFT_KEY, '');
    render();
    source.focus();
  });

  $('sample').addEventListener('click', () => {
    source.value = SAMPLE;
    store.set(DRAFT_KEY, source.value);
    render();
  });

  /* Drag a .txt / .md file onto the page. */
  for (const type of ['dragenter', 'dragover']) {
    document.addEventListener(type, event => {
      event.preventDefault();
      document.body.classList.add('dropping');
    });
  }
  for (const type of ['dragleave', 'drop']) {
    document.addEventListener(type, () => document.body.classList.remove('dropping'));
  }
  document.addEventListener('drop', async event => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    source.value = await file.text();
    store.set(DRAFT_KEY, source.value);
    render();
  });

  /* ---------- theme ---------- */

  const themeBtn = $('theme');
  const themeLabel = themeBtn.querySelector('[data-theme-label]');

  function applyTheme(value) {
    if (value === 'light' || value === 'dark') {
      document.documentElement.dataset.theme = value;
    } else {
      delete document.documentElement.dataset.theme;
    }
    themeLabel.textContent = value === 'dark' ? 'Dark' : value === 'light' ? 'Light' : 'System';
  }

  themeBtn.addEventListener('click', () => {
    const order = ['system', 'light', 'dark'];
    const current = document.documentElement.dataset.theme || 'system';
    const next = order[(order.indexOf(current) + 1) % order.length];
    store.set(THEME_KEY, next);
    applyTheme(next);
  });

  /* ---------- boot ---------- */

  applyTheme(store.get(THEME_KEY) || 'system');

  const savedMode = store.get(MODE_KEY);
  if (savedMode) {
    const tab = document.querySelector(`.mode[data-mode="${savedMode}"]`);
    if (tab) tab.click();
  }

  source.value = store.get(DRAFT_KEY) || '';
  lengthOut.textContent = `${lengthInput.value}%`;
  render();
})();
