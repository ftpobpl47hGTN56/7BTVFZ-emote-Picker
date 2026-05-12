

// sep_overlay_align_v2.js 12.05.2026
// сеп оверлей алайнер  12.05.2026


(function () {
  'use strict';

  const STORE_KEY = 'sep_overlay_align_v3';
  const STYLE_ID  = 'sep-oa-css';
  const PANEL_ID  = 'sep-oa-panel';

  if (document.getElementById(PANEL_ID)) return;

  // ── Defaults ─────────────────────────────────────────────
  const DEFAULTS = {
    // обычный оверлей
    wrapVerticalAlign : 'bottom',
    baseJustify       : 'flex-start',
    baseAlign         : 'flex-end',
    nudgeX            : 0,
    nudgeY            : 0,
    // оверлей с модификатором
    modVerticalAlign  : 'bottom',
    modJustify        : 'flex-start',
    modAlign          : 'flex-end',
    modNudgeX         : 0,
    modNudgeY         : 0,
    modMarginRight    : 0,   // отступ после враппера с модом (чтобы не лезли)
  };

  // ── Storage ──────────────────────────────────────────────
  function load() {
    try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(STORE_KEY))); }
    catch { return { ...DEFAULTS }; }
  }
  function save(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch {}
  }

  // ── CSS ──────────────────────────────────────────────────
  function applyCSS(s) {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = `
/* ── 1. Обычный оверлей (без sep-mod-* на base) ── */
.sep-emote-wrap:has(.sep-emote-overlay):not(:has([class*="sep-mod-"])) {
  display         : inline-flex            !important;
  vertical-align  : ${s.wrapVerticalAlign} !important;
  justify-content : ${s.baseJustify}       !important;
  align-items     : ${s.baseAlign}         !important;
}
.sep-emote-wrap:has(.sep-emote-overlay):not(:has([class*="sep-mod-"])) .sep-emote-base {
  flex-shrink : 0 !important;
  position    : relative !important;
  transform   : translateX(${s.nudgeX}px) translateY(${s.nudgeY}px) !important;
}
.sep-emote-wrap:has(.sep-emote-overlay):not(:has([class*="sep-mod-"])) .sep-emote-overlay {
  position : absolute !important;
}

/* ── 2. Оверлей с модификатором (sep-mod-ffzW и др.) ── */
.sep-emote-wrap:has(.sep-emote-overlay):has([class*="sep-mod-"]) {
  display         : inline-flex           !important;
  vertical-align  : ${s.modVerticalAlign} !important;
  justify-content : ${s.modJustify}       !important;
  align-items     : ${s.modAlign}         !important;
  /* Расширяем враппер до реальной ширины base-img (--sep-wide-w).
     Без этого base-img (140px) вылезает из враппера (64px)
     и перекрывает соседний ffzW эмоут. */
  width           : var(--sep-wide-w)     !important;
  margin-right    : ${s.modMarginRight}px !important;
}
.sep-emote-wrap:has(.sep-emote-overlay):has([class*="sep-mod-"]) .sep-emote-base {
  flex-shrink : 0 !important;
  position    : relative !important;
  transform   : translateX(${s.modNudgeX}px) translateY(${s.modNudgeY}px) !important;
}
.sep-emote-wrap:has(.sep-emote-overlay):has([class*="sep-mod-"]) .sep-emote-overlay {
    position: absolute !important;
    max-height: 64px !important;
    max-width: 150px !important; 
    height: 64px !important;
}
  `;
  }

  // ── Panel markup ─────────────────────────────────────────
  const panelEl = document.createElement('div');
  panelEl.id = PANEL_ID;
  panelEl.innerHTML = `
<div id="sep-oa-hdr">
  <span>⚙ SEP Overlay Align</span>
  <div style="display:flex;gap:5px">
    <button id="sep-oa-min" title="Свернуть">−</button>
    <button id="sep-oa-x"   title="Закрыть">✕</button>
  </div>
</div>
<div id="sep-oa-body">

  <!-- ── Секция 1: обычный оверлей ── -->
  <div class="sep-oa-section">
    <div class="sep-oa-section-hdr">
      <span class="sep-oa-section-dot" style="background:#a78bfa"></span>
      Обычный оверлей
      <span class="sep-oa-section-sel">:not(:has(sep-mod-*))</span>
    </div>
    <div class="sep-oa-gt">Враппер в строке чата</div>
    <div class="sep-oa-row">
      <span class="sep-oa-lbl">vertical-align</span>
      <select id="sep-oa-va">
        <option value="bottom">bottom</option>
        <option value="middle">middle</option>
        <option value="top">top</option>
        <option value="baseline">baseline</option>
        <option value="text-bottom">text-bottom</option>
        <option value="text-top">text-top</option>
        <option value="sub">sub</option>
      </select>
    </div>
    <div class="sep-oa-gt">Base внутри враппера (flex)</div>
    <div class="sep-oa-row">
      <span class="sep-oa-lbl">horizontal</span>
      <select id="sep-oa-jc">
        <option value="flex-start">flex-start (←)</option>
        <option value="center">center</option>
        <option value="flex-end">flex-end (→)</option>
      </select>
    </div>
    <div class="sep-oa-row">
      <span class="sep-oa-lbl">vertical</span>
      <select id="sep-oa-ai">
        <option value="flex-start">flex-start (↑)</option>
        <option value="center">center</option>
        <option value="flex-end">flex-end (↓)</option>
        <option value="stretch">stretch</option>
      </select>
    </div>
    <div class="sep-oa-gt">Nudge</div>
    <div class="sep-oa-row">
      <span class="sep-oa-lbl">nudge X</span>
      <input type="range" id="sep-oa-nx" min="-30" max="30" step="1">
      <span class="sep-oa-v" id="sep-oa-nx-v"></span>
    </div>
    <div class="sep-oa-row">
      <span class="sep-oa-lbl">nudge Y</span>
      <input type="range" id="sep-oa-ny" min="-30" max="30" step="1">
      <span class="sep-oa-v" id="sep-oa-ny-v"></span>
    </div>
  </div>

  <!-- ── Секция 2: оверлей с модификатором ── -->
  <div class="sep-oa-section" style="margin-top:4px">
    <div class="sep-oa-section-hdr">
      <span class="sep-oa-section-dot" style="background:#34d399"></span>
      С модификатором
      <span class="sep-oa-section-sel">:has(sep-mod-*)</span>
    </div>
    <div class="sep-oa-gt">Враппер в строке чата</div>
    <div class="sep-oa-row">
      <span class="sep-oa-lbl">vertical-align</span>
      <select id="sep-oa-mva">
        <option value="bottom">bottom</option>
        <option value="middle">middle</option>
        <option value="top">top</option>
        <option value="baseline">baseline</option>
        <option value="text-bottom">text-bottom</option>
        <option value="text-top">text-top</option>
        <option value="sub">sub</option>
      </select>
    </div>
    <div class="sep-oa-gt">Base внутри враппера (flex)</div>
    <div class="sep-oa-row">
      <span class="sep-oa-lbl">horizontal</span>
      <select id="sep-oa-mjc">
        <option value="flex-start">flex-start (←)</option>
        <option value="center">center</option>
        <option value="flex-end">flex-end (→)</option>
      </select>
    </div>
    <div class="sep-oa-row">
      <span class="sep-oa-lbl">vertical</span>
      <select id="sep-oa-mai">
        <option value="flex-start">flex-start (↑)</option>
        <option value="center">center</option>
        <option value="flex-end">flex-end (↓)</option>
        <option value="stretch">stretch</option>
      </select>
    </div>
    <div class="sep-oa-gt">Nudge</div>
    <div class="sep-oa-row">
      <span class="sep-oa-lbl">nudge X</span>
      <input type="range" id="sep-oa-mnx" min="-30" max="30" step="1">
      <span class="sep-oa-v" id="sep-oa-mnx-v"></span>
    </div>
    <div class="sep-oa-row">
      <span class="sep-oa-lbl">nudge Y</span>
      <input type="range" id="sep-oa-mny" min="-30" max="30" step="1">
      <span class="sep-oa-v" id="sep-oa-mny-v"></span>
    </div>
    <div class="sep-oa-gt" style="margin-top:2px">Расстояние до соседнего эмоута</div>
    <div class="sep-oa-row">
      <span class="sep-oa-lbl">margin-right</span>
      <input type="range" id="sep-oa-mmr" min="-30" max="80" step="1">
      <span class="sep-oa-v" id="sep-oa-mmr-v"></span>
    </div>
    <div class="sep-oa-note">
      ↑ враппер авто-расширяется до --sep-wide-w,<br>
      ползунок добавляет отступ справа
    </div>
  </div>

  <div id="sep-oa-btns">
    <button id="sep-oa-reset">↺ Сброс</button>
    <button id="sep-oa-save">💾 Сохранить</button>
  </div>
  <div id="sep-oa-ok">✅ Сохранено!</div>
  <div id="sep-oa-hint">base-only враппер — не трогаем</div>
</div>`;

  // ── Styles ───────────────────────────────────────────────
  const styleEl = document.createElement('style');
  styleEl.textContent = `
#sep-oa-panel{position:fixed;top:80px;right:20px;z-index:2147483647;width:330px;
  background:#111827;border:1px solid #374151;border-radius:10px;
  box-shadow:0 8px 32px #0009;font:12px 'Segoe UI',system-ui,sans-serif;
  color:#d1d5db;user-select:none;overflow:hidden}
#sep-oa-hdr{background:#1f2937;padding:8px 10px;display:flex;align-items:center;
  justify-content:space-between;cursor:grab;border-bottom:1px solid #374151}
#sep-oa-hdr:active{cursor:grabbing}
#sep-oa-hdr>span{font-weight:700;color:#a78bfa;letter-spacing:.3px}
#sep-oa-hdr button{background:transparent;border:none;color:#6b7280;font-size:13px;
  cursor:pointer;padding:0 3px;line-height:1;transition:color .15s}
#sep-oa-hdr button:hover{color:#e5e7eb}
#sep-oa-body{padding:8px 12px;overflow-y:auto;max-height:88vh;
  transition:max-height .2s,padding .2s}
#sep-oa-body.sep-collapsed{max-height:0;padding-top:0;padding-bottom:0}
.sep-oa-section{border:1px solid #1f2937;border-radius:7px;padding:8px 10px;
  margin-bottom:6px}
.sep-oa-section-hdr{display:flex;align-items:center;gap:6px;margin-bottom:8px;
  font-size:11px;font-weight:700;color:#e5e7eb}
.sep-oa-section-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.sep-oa-section-sel{font-size:9px;color:#4b5563;font-weight:400;
  font-family:monospace;margin-left:auto}
.sep-oa-gt{font-size:9px;text-transform:uppercase;letter-spacing:1px;
  color:#6b7280;margin-bottom:6px}
.sep-oa-row{display:flex;align-items:center;gap:7px;margin-bottom:7px}
.sep-oa-lbl{width:80px;flex-shrink:0;color:#9ca3af;font-size:11px}
.sep-oa-row select{flex:1;background:#1f2937;color:#d1d5db;border:1px solid #374151;
  padding:3px 6px;border-radius:5px;font-size:11px;cursor:pointer;outline:none}
.sep-oa-row select:focus{border-color:#a78bfa}
.sep-oa-row input[type=range]{flex:1;accent-color:#a78bfa;height:4px;cursor:pointer}
.sep-oa-v{width:36px;text-align:right;color:#a78bfa;font-weight:700;
  font-variant-numeric:tabular-nums}
.sep-oa-note{font-size:9px;color:#4b5563;line-height:1.5;
  padding:4px 0 2px;border-top:1px solid #1f2937;margin-top:2px}
#sep-oa-btns{display:flex;gap:7px;margin-top:8px}
#sep-oa-btns button{flex:1;padding:7px 0;border:none;border-radius:6px;
  font-size:12px;font-weight:700;cursor:pointer;transition:background .15s}
#sep-oa-save{background:#7c3aed;color:#fff}
#sep-oa-save:hover{background:#6d28d9}
#sep-oa-reset{background:#1f2937;color:#6b7280;border:1px solid #374151}
#sep-oa-reset:hover{background:#374151;color:#d1d5db}
#sep-oa-ok{text-align:center;color:#34d399;font-size:11px;padding:5px 0 0;display:none}
#sep-oa-hint{font-size:9px;color:#4b5563;text-align:center;padding-top:6px}`;

  document.head.appendChild(styleEl);
  document.body.appendChild(panelEl);

  // ── Refs ─────────────────────────────────────────────────
  const elVA   = document.getElementById('sep-oa-va');
  const elJC   = document.getElementById('sep-oa-jc');
  const elAI   = document.getElementById('sep-oa-ai');
  const elNX   = document.getElementById('sep-oa-nx');   const elNXV  = document.getElementById('sep-oa-nx-v');
  const elNY   = document.getElementById('sep-oa-ny');   const elNYV  = document.getElementById('sep-oa-ny-v');
  const elMVA  = document.getElementById('sep-oa-mva');
  const elMJC  = document.getElementById('sep-oa-mjc');
  const elMAI  = document.getElementById('sep-oa-mai');
  const elMNX  = document.getElementById('sep-oa-mnx');  const elMNXV = document.getElementById('sep-oa-mnx-v');
  const elMNY  = document.getElementById('sep-oa-mny');  const elMNYV = document.getElementById('sep-oa-mny-v');
  const elMMR  = document.getElementById('sep-oa-mmr');  const elMMRV = document.getElementById('sep-oa-mmr-v');
  const elSaveB = document.getElementById('sep-oa-save');
  const elRstB  = document.getElementById('sep-oa-reset');
  const elOk    = document.getElementById('sep-oa-ok');
  const elMin   = document.getElementById('sep-oa-min');
  const elClose = document.getElementById('sep-oa-x');
  const elBody  = document.getElementById('sep-oa-body');
  const elHdr   = document.getElementById('sep-oa-hdr');

  function populateUI(s) {
    elVA.value  = s.wrapVerticalAlign; elJC.value  = s.baseJustify;  elAI.value  = s.baseAlign;
    elNX.value  = s.nudgeX;   elNXV.textContent  = s.nudgeX  + 'px';
    elNY.value  = s.nudgeY;   elNYV.textContent  = s.nudgeY  + 'px';
    elMVA.value = s.modVerticalAlign;  elMJC.value = s.modJustify;   elMAI.value = s.modAlign;
    elMNX.value = s.modNudgeX; elMNXV.textContent = s.modNudgeX + 'px';
    elMNY.value = s.modNudgeY; elMNYV.textContent = s.modNudgeY + 'px';
    elMMR.value = s.modMarginRight; elMMRV.textContent = s.modMarginRight + 'px';
  }

  function collect() {
    return {
      wrapVerticalAlign : elVA.value,  baseJustify : elJC.value,  baseAlign : elAI.value,
      nudgeX : +elNX.value,  nudgeY : +elNY.value,
      modVerticalAlign  : elMVA.value, modJustify  : elMJC.value, modAlign  : elMAI.value,
      modNudgeX : +elMNX.value, modNudgeY : +elMNY.value,
      modMarginRight : +elMMR.value,
    };
  }

  function onInput() {
    const s = collect();
    elNXV.textContent  = s.nudgeX        + 'px'; elNYV.textContent  = s.nudgeY        + 'px';
    elMNXV.textContent = s.modNudgeX     + 'px'; elMNYV.textContent = s.modNudgeY     + 'px';
    elMMRV.textContent = s.modMarginRight + 'px';
    applyCSS(s);
  }

  [elVA,elJC,elAI,elMVA,elMJC,elMAI].forEach(el => el.addEventListener('change', onInput));
  [elNX,elNY,elMNX,elMNY,elMMR].forEach(el => el.addEventListener('input', onInput));

  elSaveB.addEventListener('click', () => {
    save(collect());
    elOk.style.display = 'block';
    setTimeout(() => { elOk.style.display = 'none'; }, 2200);
  });
  elRstB.addEventListener('click', () => { populateUI(DEFAULTS); applyCSS(DEFAULTS); });
  elMin.addEventListener('click', () => {
    const c = elBody.classList.toggle('sep-collapsed');
    elMin.textContent = c ? '+' : '−';
  });
  elClose.addEventListener('click', () => panelEl.remove());

  // ── Drag ─────────────────────────────────────────────────
  let drag = false, ox = 0, oy = 0;
  elHdr.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    drag = true;
    const r = panelEl.getBoundingClientRect();
    ox = e.clientX - r.left; oy = e.clientY - r.top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!drag) return;
    panelEl.style.right = 'auto';
    panelEl.style.left  = Math.max(0, Math.min(e.clientX - ox, window.innerWidth  - panelEl.offsetWidth))  + 'px';
    panelEl.style.top   = Math.max(0, Math.min(e.clientY - oy, window.innerHeight - panelEl.offsetHeight)) + 'px';
  });
  document.addEventListener('mouseup', () => { drag = false; });

  // ── Init ─────────────────────────────────────────────────
  const saved = load();
  populateUI(saved);
  applyCSS(saved);

})();