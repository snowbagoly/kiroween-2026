// Text for sounds, shown when "Captions" is on [design 9 Captions, R10.3].
export const CAPTION_MS = 2000;

export const CAPTIONS = {
  thunder: '[thunder]',
  bell: '[the counter bell]',
  crow: '[a crow caws]',
  scream: '[a distant scream]',
  knock: '[knocking at the door]',
  static: '[static on the line]',
};

export const captionFor = (name) => CAPTIONS[name] ?? null;

// A caption line near the top of the screen. `show(name)` does nothing while captions are off.
export function mountCaptions(parent, { enabled = () => false } = {}) {
  const el = parent.ownerDocument.createElement('p');
  el.className = 'caption-line';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  parent.append(el);
  let timer = null;
  return {
    el,
    show(name) {
      const text = captionFor(name);
      if (!text || !enabled()) return false;
      el.textContent = text;
      el.classList.add('on');
      clearTimeout(timer);
      timer = setTimeout(() => { el.classList.remove('on'); el.textContent = ''; }, CAPTION_MS);
      return true;
    },
    clear() { clearTimeout(timer); el.classList.remove('on'); el.textContent = ''; },
  };
}
