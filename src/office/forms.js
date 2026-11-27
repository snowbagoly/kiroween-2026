// The paper on the office desk [design 8, R3.1, R3.4a, R3.6, R3.7, R4.2, R4.5b]: the telegram form
// (the message to send, or the blank form a received message is written on) and the paper tape, which
// shows each press as a dot or a dash and pencils the decoded letter under it.

export const MAX_TAPE_ITEMS = 120;
export const STAMPS = { send: 'Sent', receive: 'Received' };

// Splits a message into words of letters, keeping the letter index across words.
export function layoutText(text) {
  let index = 0;
  return String(text).toUpperCase().split(/\s+/).filter(Boolean).map((word) =>
    [...word.replace(/[^A-Z]/g, '')].map((letter) => ({ letter, index: index++ })));
}

// What a screen reader hears for the current state.
export function textRowStatus(text, { role = 'send', pos = 0, wrongAt = null } = {}) {
  const letters = layoutText(text).flat();
  if (pos >= letters.length) return role === 'receive' ? 'Message received' : 'Message sent';
  const where = `${pos + 1} of ${letters.length}`;
  if (role === 'receive') return `${wrongAt !== null ? 'Wrong. ' : ''}Letter ${where}: listen and type it`;
  return `${wrongAt !== null ? 'Wrong. ' : ''}Next letter ${letters[pos].letter}, ${where}`;
}

// The form's body: each word kept whole so it never breaks across lines, one span per letter.
// Sending shows every letter; receiving shows a blank for each letter not yet typed.
export function formBodyHtml(text, { role = 'send', pos = 0 } = {}) {
  return layoutText(text).map((word) => `<span class="tg-word">${word.map(({ letter, index }) => {
    const cls = index < pos ? 'sent' : index === pos ? 'current' : 'todo';
    const shown = role === 'receive' && index >= pos ? '' : letter;
    return `<span class="tg-char ${cls}${role === 'receive' && index >= pos ? ' blank' : ''}" data-i="${index}">${shown}</span>`;
  }).join('')}</span>`).join('<span class="tg-space"> </span>');
}

export function formHtml() {
  return `<article class="telegram empty" aria-label="Telegram">
  <header class="tg-head">
    <span class="tg-co">Marsh &amp; Western Telegraph Co.</span>
    <span class="tg-title">Telegram</span>
  </header>
  <dl class="tg-fields"><dt>To</dt><dd class="tg-to"></dd><dt>From</dt><dd class="tg-from"></dd></dl>
  <p class="tg-body" aria-hidden="true"></p>
  <p class="sr-only tg-status" aria-live="polite"></p>
  <footer class="tg-foot"><span class="tg-origin">Office of origin: Station 7</span><span class="tg-tally" title="Mistakes on this form"></span></footer>
  <div class="tg-stamp" aria-hidden="true"><span class="tg-stamp-word">Sent</span><small></small></div>
</article>`;
}

// The form, with the same controls as the Day Shift text row (show, setPos, wrong, clear, setStrange,
// state), plus stamp() for a finished message.
export function mountForm(parent) {
  parent.insertAdjacentHTML('beforeend', formHtml());
  const el = parent.lastElementChild;
  parent.insertAdjacentHTML('beforeend', '<p class="waiting" aria-live="polite"></p>');
  const spike = parent.lastElementChild;
  const $ = (sel) => el.querySelector(sel);
  let cur = { text: '', role: 'send', pos: 0, wrongAt: null };
  let mistakes = 0;

  const draw = () => {
    $('.tg-body').innerHTML = cur.text ? formBodyHtml(cur.text, cur) : '<span class="tg-none">No traffic waiting</span>';
    $('.tg-status').textContent = cur.text ? textRowStatus(cur.text, cur) : '';
  };

  return {
    el,
    show(text, role = 'send', { to = '', from = '' } = {}) {
      cur = { text, role, pos: 0, wrongAt: null };
      mistakes = 0;
      $('.tg-to').textContent = to;
      $('.tg-from').textContent = from;
      $('.tg-tally').textContent = '';
      $('.tg-origin').textContent = role === 'receive' ? 'Received at: Station 7' : 'Office of origin: Station 7';
      $('.tg-stamp-word').textContent = STAMPS[role];
      el.classList.toggle('incoming', role === 'receive');
      el.classList.remove('sent', 'arrive', 'empty');
      void el.offsetWidth; // restart the slide-in
      el.classList.add('arrive');
      draw();
    },
    setPos(pos) { cur.pos = pos; cur.wrongAt = null; draw(); },
    // A wrong letter: a red tally mark, and the letter shakes [R3.6, R4.4].
    wrong() {
      cur.wrongAt = cur.pos;
      mistakes += 1;
      $('.tg-tally').textContent = '/'.repeat(mistakes);
      $('.tg-status').textContent = textRowStatus(cur.text, cur);
      const c = $(`.tg-char[data-i="${cur.pos}"]`);
      if (!c) return;
      c.classList.remove('wrong');
      void c.offsetWidth;
      c.classList.add('wrong');
    },
    // The SENT or RECEIVED stamp, with the time [R3.7, R4.5b].
    stamp(time) {
      $('.tg-stamp small').textContent = time;
      el.classList.add('sent');
    },
    clear() {
      cur = { text: '', role: 'send', pos: 0, wrongAt: null };
      $('.tg-to').textContent = '';
      $('.tg-from').textContent = '';
      $('.tg-tally').textContent = '';
      el.classList.remove('sent', 'arrive', 'incoming', 'strange');
      el.classList.add('empty');
      draw();
    },
    setStrange(on) { el.classList.toggle('strange', !!on); },
    // Telegrams waiting on the spike show as more forms under this one [R9.7c].
    setWaiting(n) {
      el.classList.toggle('stacked', n > 0);
      el.classList.toggle('many', n > 1);
      spike.textContent = n > 0 ? `${n} more waiting on the spike` : '';
    },
    get state() { return { ...cur }; },
  };
}

// The paper tape: each press as a dot or a dash, the decoded letter pencilled under each group
// (a red ? when the pattern is no letter), a red strike through a letter that was wrong [R3.4a, R3.6].
export function mountTape(parent) {
  parent.insertAdjacentHTML('beforeend', '<section class="tape" aria-hidden="true"><div class="tape-inner"></div></section>');
  const box = parent.lastElementChild;
  const inner = box.firstElementChild;
  const doc = parent.ownerDocument;
  let letterEl = null;

  const push = (node) => {
    inner.append(node);
    while (inner.childElementCount > MAX_TAPE_ITEMS) inner.firstElementChild.remove();
  };

  return {
    el: box,
    symbol(symbol) {
      if (!letterEl) {
        letterEl = doc.createElement('span');
        letterEl.className = 'letter';
        letterEl.innerHTML = '<span class="code"></span><span class="char"></span>';
        push(letterEl);
      }
      const s = doc.createElement('span');
      s.className = symbol === '-' ? 'sym dash' : 'sym';
      s.textContent = symbol === '-' ? '_' : '.';
      letterEl.firstElementChild.append(s);
    },
    letter(char) {
      if (!letterEl) return;
      const c = letterEl.lastElementChild;
      c.textContent = char ?? '?';
      if (!char) c.classList.add('unknown');
      this.last = letterEl;
      letterEl = null;
    },
    wrong() { this.last?.classList.add('wrong'); },
    gap() {
      if (!inner.lastElementChild?.classList.contains('letter')) return;
      const g = doc.createElement('span');
      g.className = 'gap';
      push(g);
    },
    // Backspace tears the tape off.
    tear() {
      letterEl = null;
      this.last = null;
      box.classList.remove('torn');
      void box.offsetWidth;
      box.classList.add('torn');
      inner.replaceChildren();
    },
    get count() { return inner.querySelectorAll('.letter').length; },
    last: null,
  };
}

// Where a new word starts on the tape: the letter indexes that begin a word, after the first.
export function wordStarts(text) {
  return new Set(layoutText(text).slice(1).map((w) => w[0]?.index).filter((i) => i !== undefined));
}

export const formatTime = (minutes) => {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
