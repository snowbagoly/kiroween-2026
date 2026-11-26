// Options menu: one modal dialog, opened by the button in the upper right or by Esc [design 11, R10.1, R10.1a].
// While it is open the game should pause: listen to `onOpenChange(open)`.

export const END_GAME_QUESTION = 'End your game? Your current run will be lost.';

export function optionsHtml() {
  return `<button type="button" class="options-btn" aria-haspopup="dialog" aria-controls="options-dialog">Options</button>
  <div class="options-backdrop" hidden></div>
  <div id="options-dialog" class="options-dialog" role="dialog" aria-modal="true" aria-labelledby="options-title" hidden>
    <h2 id="options-title">Options</h2>
    <div class="opt-main">
      <label class="opt-row">Music volume <input type="range" name="musicVol" min="0" max="1" step="0.05"></label>
      <label class="opt-row">Effects volume <input type="range" name="sfxVol" min="0" max="1" step="0.05"></label>
      <label class="opt-row opt-check"><input type="checkbox" name="mute"> Mute</label>
      <label class="opt-row opt-check"><input type="checkbox" name="reduceFlashing"> Reduce flashing</label>
      <label class="opt-row opt-check"><input type="checkbox" name="captions"> Captions</label>
      <label class="opt-row opt-check"><input type="checkbox" name="showLivesNumber"> Show lives as a number</label>
      <label class="opt-row">Start with tutorial
        <select name="tutorial"><option value="ask">Ask on start</option><option value="never">Never</option></select></label>
      <div class="opt-row"><span class="hand-now"></span><button type="button" class="forget-hand-btn">Forget my hand</button></div>
      <div class="opt-buttons">
        <button type="button" class="end-game-btn">End game</button>
        <button type="button" class="close-btn">Close</button>
      </div>
    </div>
    <div class="opt-confirm" hidden>
      <p>${END_GAME_QUESTION}</p>
      <div class="opt-buttons">
        <button type="button" class="confirm-end">End game</button>
        <button type="button" class="cancel-end">Keep playing</button>
      </div>
    </div>
  </div>`;
}

const FOCUSABLE = 'button:not([hidden]):not([disabled]), input, select';

// `getData()` returns the saved data, `setValue(key, value)` changes one setting,
// `inRun()` says whether "End game" should show, `onEndGame()` runs after the player confirms.
// `onForgetHand()` goes back to a new player's hand and returns the new speed line [R3.3a].
export function mountOptions(root, { getData, setValue, inRun = () => false, onEndGame = () => {}, onOpenChange = () => {}, onForgetHand = () => '', handLine = () => '', keyTarget = window } = {}) {
  root.insertAdjacentHTML('beforeend', optionsHtml());
  const btn = root.querySelector('.options-btn');
  const dialog = root.querySelector('#options-dialog');
  const backdrop = root.querySelector('.options-backdrop');
  const main = dialog.querySelector('.opt-main');
  const confirm = dialog.querySelector('.opt-confirm');
  const endBtn = dialog.querySelector('.end-game-btn');
  let lastFocus = null;

  function fill() {
    const s = getData().settings;
    for (const el of dialog.querySelectorAll('[name]')) {
      if (el.type === 'checkbox') el.checked = !!s[el.name];
      else el.value = String(s[el.name]);
    }
    endBtn.hidden = !inRun();
    dialog.querySelector('.hand-now').textContent = handLine();
  }

  function visible() {
    return [...dialog.querySelectorAll(FOCUSABLE)].filter((el) => !el.closest('[hidden]') && !el.hidden);
  }

  const api = {
    get isOpen() { return !dialog.hidden; },
    open() {
      if (api.isOpen) return;
      lastFocus = root.ownerDocument.activeElement;
      fill();
      main.hidden = false;
      confirm.hidden = true;
      dialog.hidden = false;
      backdrop.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      visible()[0]?.focus();
      onOpenChange(true);
    },
    close() {
      if (!api.isOpen) return;
      dialog.hidden = true;
      backdrop.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      (lastFocus && lastFocus.isConnected ? lastFocus : btn).focus();
      onOpenChange(false);
    },
    toggle() { if (api.isOpen) api.close(); else api.open(); },
    refresh: fill,
  };

  btn.addEventListener('click', () => api.toggle());
  backdrop.addEventListener('click', () => api.close());
  dialog.querySelector('.close-btn').addEventListener('click', () => api.close());
  endBtn.addEventListener('click', () => {
    main.hidden = true;
    confirm.hidden = false;
    confirm.querySelector('.cancel-end').focus();
  });
  confirm.querySelector('.cancel-end').addEventListener('click', () => {
    confirm.hidden = true;
    main.hidden = false;
    endBtn.focus();
  });
  confirm.querySelector('.confirm-end').addEventListener('click', () => { api.close(); onEndGame(); });
  dialog.querySelector('.forget-hand-btn').addEventListener('click', () => {
    dialog.querySelector('.hand-now').textContent = onForgetHand() || handLine();
  });

  for (const el of dialog.querySelectorAll('[name]')) {
    const ev = el.type === 'range' ? 'input' : 'change';
    el.addEventListener(ev, () => {
      const value = el.type === 'checkbox' ? el.checked : el.type === 'range' ? Number(el.value) : el.value;
      setValue(el.name, value);
    });
  }

  keyTarget.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (api.isOpen && !confirm.hidden) confirm.querySelector('.cancel-end').click();
      else api.toggle();
      return;
    }
    if (e.key === 'Tab' && api.isOpen) {
      // Focus trap: Tab and Shift+Tab stay inside the dialog.
      const items = visible();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = root.ownerDocument.activeElement;
      if (e.shiftKey && (active === first || !dialog.contains(active))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (active === last || !dialog.contains(active))) { e.preventDefault(); first.focus(); }
    }
  }, true);

  return api;
}
