// Markdown-mikroparser for chat-output.
//
// Bot'en outputter en begrænset markdown-dialekt: paragrafer, **bold**,
// *italic*, nummererede og bullet-lister, og en citation-linje
// "→ /skrifter/<slug>" til sidst.
//
// Vi parser til en ren AST og rendrer derefter DOM via textContent +
// createElement. Ingen innerHTML, ingen XSS-vinduer.

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'strong'; children: Inline[] }
  | { kind: 'em'; children: Inline[] }
  | { kind: 'link'; href: string; text: string };

export type Block =
  | { kind: 'lede'; inlines: Inline[] }
  | { kind: 'paragraph'; inlines: Inline[] }
  | { kind: 'olist'; items: Inline[][] }
  | { kind: 'ulist'; items: Inline[][] }
  | { kind: 'citation'; slug: string };

export type Citations = Record<string, string>;

const SLUG_RE = /\/skrifter\/([a-z0-9\-]+)/i;
const CITATION_RE = /^→\s*\/skrifter\/([a-z0-9\-]+)\s*$/;

// ---------- Inline parser ----------

export function parseInlines(text: string): Inline[] {
  const result: Inline[] = [];
  let buf = '';
  let i = 0;

  const flush = (): void => {
    if (buf) {
      result.push({ kind: 'text', text: buf });
      buf = '';
    }
  };

  while (i < text.length) {
    // **bold**
    if (text[i] === '*' && text[i + 1] === '*') {
      const close = text.indexOf('**', i + 2);
      if (close > i + 2) {
        flush();
        const inner = text.slice(i + 2, close);
        result.push({ kind: 'strong', children: parseInlines(inner) });
        i = close + 2;
        continue;
      }
    }

    // *italic* (single asterisk, not followed by another)
    if (text[i] === '*' && text[i + 1] !== '*') {
      // Find closing single * — must not be part of **
      let close = -1;
      for (let j = i + 1; j < text.length; j++) {
        if (text[j] === '*' && text[j - 1] !== '*' && text[j + 1] !== '*') {
          close = j;
          break;
        }
      }
      if (close > i + 1) {
        flush();
        const inner = text.slice(i + 1, close);
        result.push({ kind: 'em', children: parseInlines(inner) });
        i = close + 1;
        continue;
      }
    }

    // /skrifter/<slug>
    const remaining = text.slice(i);
    const m = remaining.match(SLUG_RE);
    if (m && m.index === 0) {
      flush();
      result.push({ kind: 'link', href: m[0], text: m[0] });
      i += m[0].length;
      continue;
    }

    buf += text[i];
    i++;
  }
  flush();
  return result;
}

// ---------- Block parser ----------

export function parseMarkdown(text: string): Block[] {
  const trimmed = text.replace(/^\s+|\s+$/g, '');
  if (!trimmed) return [];

  const blockTexts = trimmed.split(/\n\s*\n/);
  const blocks: Block[] = [];
  let firstParaSeen = false;

  for (const raw of blockTexts) {
    const t = raw.trim();
    if (!t) continue;

    // Citation: → /skrifter/<slug> (single line)
    const citationMatch = t.match(CITATION_RE);
    if (citationMatch) {
      blocks.push({ kind: 'citation', slug: citationMatch[1]! });
      continue;
    }

    const lines = t.split(/\n/).map((l) => l.trim()).filter(Boolean);

    // Numbered list?
    if (lines.length > 0 && lines.every((l) => /^\d+\.\s+/.test(l))) {
      const items = lines.map((l) => parseInlines(l.replace(/^\d+\.\s+/, '')));
      blocks.push({ kind: 'olist', items });
      continue;
    }

    // Bullet list (- or *)?
    if (lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l))) {
      const items = lines.map((l) => parseInlines(l.replace(/^[-*]\s+/, '')));
      blocks.push({ kind: 'ulist', items });
      continue;
    }

    // Paragraph — fold linjeskift til mellemrum
    const inlines = parseInlines(t.replace(/\n/g, ' '));
    blocks.push({
      kind: firstParaSeen ? 'paragraph' : 'lede',
      inlines,
    });
    firstParaSeen = true;
  }

  return blocks;
}

// ---------- DOM rendering ----------

export function renderMarkdown(text: string, citations: Citations): DocumentFragment {
  const fragment = document.createDocumentFragment();
  for (const block of parseMarkdown(text)) {
    fragment.appendChild(renderBlock(block, citations));
  }
  return fragment;
}

// Diff-baseret opdatering: opdaterer eksisterende DOM på plads i stedet for
// at smide alt væk og rebygge. Stabile blokke flickerer ikke. Nye blokke
// får class="block-appear" så CSS kan animere dem ind.
export function updateMarkdown(
  target: HTMLElement,
  text: string,
  citations: Citations,
): void {
  const blocks = parseMarkdown(text);
  const existing = Array.from(target.children) as HTMLElement[];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!;
    const existingEl = existing[i];

    if (existingEl) {
      if (!updateBlockInPlace(existingEl, block, citations)) {
        // Block-kind ændret (fx paragraph → olist): erstat
        const fresh = renderBlock(block, citations);
        fresh.classList.add('block-appear');
        existingEl.replaceWith(fresh);
      }
    } else {
      // Helt ny blok
      const fresh = renderBlock(block, citations);
      fresh.classList.add('block-appear');
      target.appendChild(fresh);
    }
  }

  // Fjern overskydende blokke (sker normalt ikke under streaming)
  for (let i = blocks.length; i < existing.length; i++) {
    existing[i]!.remove();
  }
}

// Opdater eksisterende blok-element til ny block-AST. Returner false hvis
// element-typen ikke matcher (caller skal erstatte).
function updateBlockInPlace(el: HTMLElement, block: Block, citations: Citations): boolean {
  switch (block.kind) {
    case 'lede':
    case 'paragraph': {
      if (el.tagName !== 'P') return false;
      const isLede = el.classList.contains('lede');
      const wantLede = block.kind === 'lede';
      if (isLede !== wantLede) return false;
      el.replaceChildren();
      appendInlines(el, block.inlines);
      return true;
    }
    case 'olist': {
      if (el.tagName !== 'OL') return false;
      syncListItems(el, block.items);
      return true;
    }
    case 'ulist': {
      if (el.tagName !== 'UL') return false;
      syncListItems(el, block.items);
      return true;
    }
    case 'citation': {
      if (!el.classList.contains('caption')) return false;
      const a = el.querySelector('a');
      if (a?.getAttribute('href') === `/skrifter/${block.slug}`) return true;
      return false; // andet slug → erstat hele blokken
    }
  }
}

function syncListItems(listEl: HTMLElement, items: Inline[][]): void {
  const existingItems = Array.from(listEl.children) as HTMLElement[];
  for (let i = 0; i < items.length; i++) {
    let li = existingItems[i];
    if (!li) {
      li = document.createElement('li');
      listEl.appendChild(li);
    } else {
      li.replaceChildren();
    }
    appendInlines(li, items[i]!);
  }
  for (let i = items.length; i < existingItems.length; i++) {
    existingItems[i]!.remove();
  }
}

function renderBlock(block: Block, citations: Citations): HTMLElement {
  switch (block.kind) {
    case 'lede': {
      const p = document.createElement('p');
      p.className = 'lede';
      appendInlines(p, block.inlines);
      return p;
    }
    case 'paragraph': {
      const p = document.createElement('p');
      appendInlines(p, block.inlines);
      return p;
    }
    case 'olist': {
      const ol = document.createElement('ol');
      for (const itemInlines of block.items) {
        const li = document.createElement('li');
        appendInlines(li, itemInlines);
        ol.appendChild(li);
      }
      return ol;
    }
    case 'ulist': {
      const ul = document.createElement('ul');
      for (const itemInlines of block.items) {
        const li = document.createElement('li');
        appendInlines(li, itemInlines);
        ul.appendChild(li);
      }
      return ul;
    }
    case 'citation': {
      const wrapper = document.createElement('div');
      wrapper.className = 'caption';

      const inner = document.createElement('div');

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = 'Læs mere';
      inner.appendChild(meta);

      const title = citations[block.slug];
      if (title) {
        const t = document.createElement('div');
        t.className = 'source-title';
        t.textContent = title;
        inner.appendChild(t);
      }

      const a = document.createElement('a');
      a.href = `/skrifter/${block.slug}`;
      a.textContent = `/skrifter/${block.slug}`;
      inner.appendChild(a);

      wrapper.appendChild(inner);
      return wrapper;
    }
  }
}

function appendInlines(parent: HTMLElement, inlines: Inline[]): void {
  for (const inline of inlines) {
    parent.appendChild(renderInline(inline));
  }
}

function renderInline(inline: Inline): Node {
  switch (inline.kind) {
    case 'text':
      return document.createTextNode(inline.text);
    case 'strong': {
      const el = document.createElement('strong');
      appendInlines(el, inline.children);
      return el;
    }
    case 'em': {
      const el = document.createElement('em');
      appendInlines(el, inline.children);
      return el;
    }
    case 'link': {
      const a = document.createElement('a');
      a.href = inline.href;
      a.textContent = inline.text;
      return a;
    }
  }
}
