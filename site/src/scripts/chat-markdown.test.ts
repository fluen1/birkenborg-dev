import { describe, it, expect } from 'vitest';
import {
  parseMarkdown,
  parseInlines,
  renderMarkdown,
  updateMarkdown,
  type Block,
} from './chat-markdown';

describe('parseInlines', () => {
  it('plain tekst → ét text-node', () => {
    expect(parseInlines('hej verden')).toEqual([
      { kind: 'text', text: 'hej verden' },
    ]);
  });

  it('parser **bold**', () => {
    const result = parseInlines('foo **bar** baz');
    expect(result).toEqual([
      { kind: 'text', text: 'foo ' },
      { kind: 'strong', children: [{ kind: 'text', text: 'bar' }] },
      { kind: 'text', text: ' baz' },
    ]);
  });

  it('parser *italic*', () => {
    const result = parseInlines('foo *bar* baz');
    expect(result).toEqual([
      { kind: 'text', text: 'foo ' },
      { kind: 'em', children: [{ kind: 'text', text: 'bar' }] },
      { kind: 'text', text: ' baz' },
    ]);
  });

  it('parser /skrifter/<slug> som link', () => {
    const result = parseInlines('se /skrifter/min-post for mere');
    expect(result).toEqual([
      { kind: 'text', text: 'se ' },
      { kind: 'link', href: '/skrifter/min-post', text: '/skrifter/min-post' },
      { kind: 'text', text: ' for mere' },
    ]);
  });

  it('uafsluttet ** falder tilbage til tekst', () => {
    const result = parseInlines('foo **bar baz');
    expect(result).toEqual([
      { kind: 'text', text: 'foo **bar baz' },
    ]);
  });

  it('uafsluttet * falder tilbage til tekst', () => {
    const result = parseInlines('foo *bar baz');
    expect(result).toEqual([
      { kind: 'text', text: 'foo *bar baz' },
    ]);
  });

  it('flere bolds i samme tekst', () => {
    const result = parseInlines('**a** og **b**');
    expect(result).toEqual([
      { kind: 'strong', children: [{ kind: 'text', text: 'a' }] },
      { kind: 'text', text: ' og ' },
      { kind: 'strong', children: [{ kind: 'text', text: 'b' }] },
    ]);
  });

  it('bold med italic indeni', () => {
    const result = parseInlines('**foo *bar* baz**');
    expect(result).toEqual([
      {
        kind: 'strong',
        children: [
          { kind: 'text', text: 'foo ' },
          { kind: 'em', children: [{ kind: 'text', text: 'bar' }] },
          { kind: 'text', text: ' baz' },
        ],
      },
    ]);
  });

  it('tom streng → tom array', () => {
    expect(parseInlines('')).toEqual([]);
  });
});

describe('parseMarkdown — blocks', () => {
  it('første paragraf bliver lede', () => {
    const blocks = parseMarkdown('Første paragraf.\n\nAnden paragraf.');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]!.kind).toBe('lede');
    expect(blocks[1]!.kind).toBe('paragraph');
  });

  it('enkelt paragraf bliver lede', () => {
    const blocks = parseMarkdown('Bare én paragraf.');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.kind).toBe('lede');
  });

  it('parser nummereret liste', () => {
    const blocks = parseMarkdown('1. Første\n2. Anden\n3. Tredje');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.kind).toBe('olist');
    const olist = blocks[0] as Block & { kind: 'olist' };
    expect(olist.items).toHaveLength(3);
    expect(olist.items[0]).toEqual([{ kind: 'text', text: 'Første' }]);
  });

  it('parser bullet-liste med dash', () => {
    const blocks = parseMarkdown('- Første\n- Anden');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.kind).toBe('ulist');
  });

  it('parser bullet-liste med asterisk', () => {
    const blocks = parseMarkdown('* Første\n* Anden');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.kind).toBe('ulist');
  });

  it('parser citation linje', () => {
    const blocks = parseMarkdown('→ /skrifter/min-post');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({ kind: 'citation', slug: 'min-post' });
  });

  it('citation efter paragraf', () => {
    const blocks = parseMarkdown('Paragraf.\n\n→ /skrifter/min-post');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]!.kind).toBe('lede');
    expect(blocks[1]!.kind).toBe('citation');
  });

  it('liste-item med bold', () => {
    const blocks = parseMarkdown('1. **Stærk** indledning');
    const olist = blocks[0] as Block & { kind: 'olist' };
    expect(olist.items[0]).toEqual([
      { kind: 'strong', children: [{ kind: 'text', text: 'Stærk' }] },
      { kind: 'text', text: ' indledning' },
    ]);
  });

  it('paragraf med multiple linjer foldes til én', () => {
    const blocks = parseMarkdown('linje 1\nlinje 2');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.kind).toBe('lede');
    const lede = blocks[0] as Block & { kind: 'lede' };
    expect(lede.inlines).toEqual([{ kind: 'text', text: 'linje 1 linje 2' }]);
  });

  it('komplet typisk respons', () => {
    const text = `Tre ting der ofte misforstås.

Jeg har skrevet om GDPR i klinikkæder.

1. **Dataansvar** deles ikke automatisk.
2. **Samtykke** er ikke en løsning.
3. **Sletning** er det hårde problem.

Det handler om rolle-fordeling.

→ /skrifter/gdpr-klinikkaeder`;
    const blocks = parseMarkdown(text);
    expect(blocks.map(b => b.kind)).toEqual([
      'lede',
      'paragraph',
      'olist',
      'paragraph',
      'citation',
    ]);
  });

  it('tom streng → tom array', () => {
    expect(parseMarkdown('')).toEqual([]);
  });

  it('whitespace only → tom array', () => {
    expect(parseMarkdown('   \n\n  ')).toEqual([]);
  });

  it('streaming-ufuldstændig: trailing **bold uden close', () => {
    const blocks = parseMarkdown('Halvfærdig **paragra');
    expect(blocks).toHaveLength(1);
    const lede = blocks[0] as Block & { kind: 'lede' };
    expect(lede.inlines).toEqual([
      { kind: 'text', text: 'Halvfærdig **paragra' },
    ]);
  });
});

describe('renderMarkdown — DOM-construction', () => {
  it('lede paragraf får class="lede"', () => {
    const fragment = renderMarkdown('Første.', {});
    const p = fragment.firstChild as HTMLElement;
    expect(p.tagName).toBe('P');
    expect(p.className).toBe('lede');
    expect(p.textContent).toBe('Første.');
  });

  it('almindelig paragraf får ingen class', () => {
    const fragment = renderMarkdown('Lede.\n\nAlmindelig.', {});
    const paragraphs = Array.from(fragment.children) as HTMLElement[];
    expect(paragraphs[0]!.className).toBe('lede');
    expect(paragraphs[1]!.className).toBe('');
  });

  it('renderer **bold** som <strong>', () => {
    const fragment = renderMarkdown('foo **bar** baz', {});
    const strong = (fragment.firstChild as HTMLElement).querySelector('strong')!;
    expect(strong.textContent).toBe('bar');
  });

  it('renderer *italic* som <em>', () => {
    const fragment = renderMarkdown('foo *bar* baz', {});
    const em = (fragment.firstChild as HTMLElement).querySelector('em')!;
    expect(em.textContent).toBe('bar');
  });

  it('renderer /skrifter/<slug> som <a>', () => {
    const fragment = renderMarkdown('Se /skrifter/min-post', {});
    const a = (fragment.firstChild as HTMLElement).querySelector('a')!;
    expect(a.getAttribute('href')).toBe('/skrifter/min-post');
    expect(a.textContent).toBe('/skrifter/min-post');
  });

  it('renderer nummereret liste', () => {
    const fragment = renderMarkdown('1. Første\n2. Anden', {});
    const ol = fragment.querySelector('ol')!;
    expect(ol.children).toHaveLength(2);
    expect(ol.children[0]!.tagName).toBe('LI');
  });

  it('renderer citation med titel fra map', () => {
    const fragment = renderMarkdown('→ /skrifter/min-post', {
      'min-post': 'Min Post Titel',
    });
    const caption = fragment.querySelector('.caption')!;
    expect(caption.querySelector('.meta')!.textContent).toBe('Læs mere');
    expect(caption.querySelector('.source-title')!.textContent).toBe('Min Post Titel');
    expect(caption.querySelector('a')!.getAttribute('href')).toBe('/skrifter/min-post');
  });

  it('citation uden matchende titel: viser kun slug-link', () => {
    const fragment = renderMarkdown('→ /skrifter/ukendt', {});
    const caption = fragment.querySelector('.caption')!;
    expect(caption.querySelector('.source-title')).toBeNull();
    expect(caption.querySelector('a')!.getAttribute('href')).toBe('/skrifter/ukendt');
  });

  it('XSS: html-tags renderes som tekst, ikke elementer', () => {
    const evilText = 'foo <script>alert(1)</script> bar';
    const fragment = renderMarkdown(evilText, {});
    const p = fragment.firstChild as HTMLElement;
    expect(p.querySelector('script')).toBeNull();
    expect(p.textContent).toContain('<script>');
  });

  it('XSS: javascript: i citation slug afvises af regex', () => {
    const fragment = renderMarkdown('→ /skrifter/javascript:alert(1)', {});
    const caption = fragment.querySelector('.caption');
    expect(caption).toBeNull();
  });
});

describe('updateMarkdown — diff-rendering', () => {
  it('første kald: alle blokke får block-appear class', () => {
    const target = document.createElement('div');
    updateMarkdown(target, 'Første.\n\nAnden.', {});
    const ps = target.querySelectorAll('p');
    expect(ps).toHaveLength(2);
    expect(ps[0]!.classList.contains('block-appear')).toBe(true);
    expect(ps[1]!.classList.contains('block-appear')).toBe(true);
  });

  it('andet kald uden ændring: samme element-instans bevares', () => {
    const target = document.createElement('div');
    updateMarkdown(target, 'Første.', {});
    const firstP = target.querySelector('p')!;
    updateMarkdown(target, 'Første.', {});
    const sameP = target.querySelector('p')!;
    expect(sameP).toBe(firstP);
  });

  it('andet kald med text-tilføjelse: paragraph-element bevares', () => {
    const target = document.createElement('div');
    updateMarkdown(target, 'Halv', {});
    const p = target.querySelector('p')!;
    updateMarkdown(target, 'Halvfærdig sætning.', {});
    const sameP = target.querySelector('p')!;
    expect(sameP).toBe(p);
    expect(sameP.textContent).toBe('Halvfærdig sætning.');
  });

  it('ny blok tilføjet: kun den nye får block-appear', () => {
    const target = document.createElement('div');
    updateMarkdown(target, 'Første.', {});
    const firstP = target.querySelector('p')!;
    // Class fjernes typisk efter animation, men her testes kun initialt
    firstP.classList.remove('block-appear');

    updateMarkdown(target, 'Første.\n\nAnden.', {});
    const ps = target.querySelectorAll('p');
    expect(ps).toHaveLength(2);
    expect(ps[0]).toBe(firstP);
    expect(ps[0]!.classList.contains('block-appear')).toBe(false);
    expect(ps[1]!.classList.contains('block-appear')).toBe(true);
  });

  it('blok-kind ændres (paragraph → olist): erstattes med ny element', () => {
    const target = document.createElement('div');
    updateMarkdown(target, 'Halvfærdig 1', {});
    expect(target.querySelector('p')).toBeTruthy();
    expect(target.querySelector('ol')).toBeNull();

    updateMarkdown(target, '1. Liste-item', {});
    expect(target.querySelector('p')).toBeNull();
    expect(target.querySelector('ol')).toBeTruthy();
  });

  it('liste-item tilføjes: eksisterende li bevares, ny tilføjes', () => {
    const target = document.createElement('div');
    updateMarkdown(target, '1. Første\n2. Anden', {});
    const firstLi = target.querySelector('ol li')!;

    updateMarkdown(target, '1. Første\n2. Anden\n3. Tredje', {});
    const lis = target.querySelectorAll('ol li');
    expect(lis).toHaveLength(3);
    expect(lis[0]).toBe(firstLi);
  });

  it('liste-items opdaterer indhold på plads', () => {
    const target = document.createElement('div');
    updateMarkdown(target, '1. Halv', {});
    const firstLi = target.querySelector('li')!;

    updateMarkdown(target, '1. Halvfærdig liste-item', {});
    expect(target.querySelector('li')).toBe(firstLi);
    expect(firstLi.textContent).toBe('Halvfærdig liste-item');
  });

  it('lede-class bevares mellem opdateringer', () => {
    const target = document.createElement('div');
    updateMarkdown(target, 'Lede starter.', {});
    const lede = target.querySelector('p')!;
    expect(lede.classList.contains('lede')).toBe(true);

    updateMarkdown(target, 'Lede starter.\n\nNæste.', {});
    const stillLede = target.children[0] as HTMLElement;
    expect(stillLede).toBe(lede);
    expect(stillLede.classList.contains('lede')).toBe(true);

    const nextP = target.children[1] as HTMLElement;
    expect(nextP.classList.contains('lede')).toBe(false);
  });

  it('citation-blok tilføjes uden at fjerne foregående', () => {
    const target = document.createElement('div');
    updateMarkdown(target, 'Svar.\n\n1. Punkt', {});
    const ol = target.querySelector('ol')!;

    updateMarkdown(target, 'Svar.\n\n1. Punkt\n\n→ /skrifter/min-post', {
      'min-post': 'Min Post',
    });
    expect(target.querySelector('ol')).toBe(ol);
    expect(target.querySelector('.caption')).toBeTruthy();
    expect(target.querySelector('.caption .source-title')!.textContent).toBe('Min Post');
  });
});
