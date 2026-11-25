// Message row above the desk [design 8, R3.1, R4.2].
// Sending: the whole text shows, sent letters fade, the next letter is highlighted. No Morse pattern is shown.
// Receiving: one blank per letter; each blank fills in when the player types it right.

// Splits a message into words of letters, keeping the letter index across words.
export function layoutText(text) {
  let index = 0;
  return String(text).toUpperCase().split(/\s+/).filter(Boolean).map((word) =>
    [...word.replace(/[^A-Z]/g, '')].map((letter) => ({ letter, index: index++ })));
}

// `role` is 'send' or 'receive'. `pos` is the index of the next letter. `wrongAt` marks a mistake.
export function textRowHtml(text, { role = 'send', pos = 0, wrongAt = null } = {}) {
  const words = layoutText(text).map((word) => {
    const cells = word.map(({ letter, index }) => {
      const cls = index < pos ? 'done' : index === pos ? 'next' : 'todo';
      const wrong = index === wrongAt ? ' wrong' : '';
      const shown = role === 'receive' && index >= pos ? '' : letter;
      return `<span class="cell ${cls}${wrong}">${shown}</span>`;
    }).join('');
    return `<span class="word">${cells}</span>`;
  }).join('');
  const tag = role === 'receive' ? 'Incoming: listen and type' : 'Outgoing: tap it out with Space';
  return `<p class="row-role ${role}" aria-hidden="true">${tag}</p><div class="text-row ${role}" aria-hidden="true">${words}</div>`;
}

// What a screen reader hears for the current state.
export function textRowStatus(text, { role = 'send', pos = 0, wrongAt = null } = {}) {
  const letters = layoutText(text).flat();
  if (pos >= letters.length) return role === 'receive' ? 'Message received' : 'Message sent';
  const where = `${pos + 1} of ${letters.length}`;
  if (role === 'receive') return `${wrongAt !== null ? 'Wrong. ' : ''}Letter ${where}: listen and type it`;
  return `${wrongAt !== null ? 'Wrong. ' : ''}Next letter ${letters[pos].letter}, ${where}`;
}

export function mountTextRow(parent) {
  const doc = parent.ownerDocument;
  const box = doc.createElement('div');
  box.className = 'text-row-box';
  const visual = doc.createElement('div');
  const status = doc.createElement('p');
  status.className = 'sr-only';
  status.setAttribute('aria-live', 'polite'); // the live region stays in place, only its text changes
  box.append(visual, status);
  parent.prepend(box);
  let cur = { text: '', role: 'send', pos: 0, wrongAt: null };
  const setStrangeClass = (on) => box.classList.toggle('strange', !!on);
  let timer = null;
  const draw = () => {
    visual.innerHTML = cur.text ? textRowHtml(cur.text, cur) : '';
    status.textContent = cur.text ? textRowStatus(cur.text, cur) : '';
  };
  return {
    show(text, role = 'send') { cur = { text, role, pos: 0, wrongAt: null }; draw(); },
    setPos(pos) { cur.pos = pos; cur.wrongAt = null; draw(); },
    // Shows the mistake on the current letter for a moment [R3.6, R4.4].
    wrong() {
      cur.wrongAt = cur.pos;
      draw();
      clearTimeout(timer);
      timer = setTimeout(() => { cur.wrongAt = null; visual.innerHTML = textRowHtml(cur.text, cur); }, 600);
    },
    clear() { cur.text = ''; draw(); },
    setStrange(on) { setStrangeClass(on); },
    get state() { return { ...cur }; },
  };
}
