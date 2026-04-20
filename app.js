/**
 * =========================================================
 *  NFA → DFA Converter — Subset Construction Simulator
 *  Full interactive application with visual state diagrams,
 *  step-by-step conversion, and string testing.
 * =========================================================
 */

/* ── Utility ────────────────────────────────────────────── */

function notify(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `notification ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

function setKey(arr) {
  return [...arr].sort().join(',');
}

function prettySet(arr) {
  if (!arr || arr.length === 0) return '∅';
  return '{' + [...arr].sort().join(', ') + '}';
}

const EPSILON = 'ε';

/* ── NFA DATA MODEL ─────────────────────────────────────── */

const nfa = {
  states: [],
  alphabet: [],
  transitions: [],  // {from, symbol, to}
  startState: '',
  acceptStates: [],
};

let dfaResult = null;   // populated after conversion
let conversionSteps = [];

/* ── EXAMPLES ───────────────────────────────────────────── */

const EXAMPLES = [
  {
    name: 'Strings ending with "ab"',
    desc: 'L = { w ∈ {a,b}* | w ends with ab }',
    alphabet: ['a', 'b'],
    states: ['q0', 'q1', 'q2'],
    start: 'q0',
    accept: ['q2'],
    transitions: [
      { from: 'q0', symbol: 'a', to: 'q0' },
      { from: 'q0', symbol: 'b', to: 'q0' },
      { from: 'q0', symbol: 'a', to: 'q1' },
      { from: 'q1', symbol: 'b', to: 'q2' },
    ],
  },
  {
    name: 'Contains substring "01"',
    desc: 'L = { w ∈ {0,1}* | w contains 01 }',
    alphabet: ['0', '1'],
    states: ['q0', 'q1', 'q2'],
    start: 'q0',
    accept: ['q2'],
    transitions: [
      { from: 'q0', symbol: '0', to: 'q0' },
      { from: 'q0', symbol: '1', to: 'q0' },
      { from: 'q0', symbol: '0', to: 'q1' },
      { from: 'q1', symbol: '1', to: 'q2' },
      { from: 'q2', symbol: '0', to: 'q2' },
      { from: 'q2', symbol: '1', to: 'q2' },
    ],
  },
  {
    name: 'ε-NFA: a* ∪ b*',
    desc: 'Union of a* and b* using epsilon transitions',
    alphabet: ['a', 'b'],
    states: ['q0', 'q1', 'q2', 'q3', 'q4'],
    start: 'q0',
    accept: ['q1', 'q3'],
    transitions: [
      { from: 'q0', symbol: EPSILON, to: 'q1' },
      { from: 'q0', symbol: EPSILON, to: 'q3' },
      { from: 'q1', symbol: 'a', to: 'q2' },
      { from: 'q2', symbol: 'a', to: 'q2' },
      { from: 'q2', symbol: EPSILON, to: 'q1' },
      { from: 'q3', symbol: 'b', to: 'q4' },
      { from: 'q4', symbol: 'b', to: 'q4' },
      { from: 'q4', symbol: EPSILON, to: 'q3' },
    ],
  },
  {
    name: 'Strings of length ≡ 0 (mod 2) or (mod 3)',
    desc: 'L = { w | |w| divisible by 2 or 3 } over {a}',
    alphabet: ['a'],
    states: ['q0', 'q1', 'q2', 'q3', 'q4', 'q5'],
    start: 'q0',
    accept: ['q1', 'q3'],
    transitions: [
      { from: 'q0', symbol: EPSILON, to: 'q1' },
      { from: 'q0', symbol: EPSILON, to: 'q3' },
      { from: 'q1', symbol: 'a', to: 'q2' },
      { from: 'q2', symbol: 'a', to: 'q1' },
      { from: 'q3', symbol: 'a', to: 'q4' },
      { from: 'q4', symbol: 'a', to: 'q5' },
      { from: 'q5', symbol: 'a', to: 'q3' },
    ],
  },
  {
    name: 'Ends with "aa" or "bb"',
    desc: 'L = { w ∈ {a,b}* | w ends with aa or bb }',
    alphabet: ['a', 'b'],
    states: ['q0', 'q1', 'q2', 'q3', 'q4'],
    start: 'q0',
    accept: ['q2', 'q4'],
    transitions: [
      { from: 'q0', symbol: 'a', to: 'q0' },
      { from: 'q0', symbol: 'b', to: 'q0' },
      { from: 'q0', symbol: 'a', to: 'q1' },
      { from: 'q0', symbol: 'b', to: 'q3' },
      { from: 'q1', symbol: 'a', to: 'q2' },
      { from: 'q3', symbol: 'b', to: 'q4' },
    ],
  },
];

/* ── DOM REFS ───────────────────────────────────────────── */

const dom = {
  inputAlphabet: document.getElementById('inputAlphabet'),
  inputStateName: document.getElementById('inputStateName'),
  btnAddState: document.getElementById('btnAddState'),
  statesChips: document.getElementById('statesChips'),
  selectStartState: document.getElementById('selectStartState'),
  selectAcceptState: document.getElementById('selectAcceptState'),
  btnAddAccept: document.getElementById('btnAddAccept'),
  acceptChips: document.getElementById('acceptChips'),
  selectTransFrom: document.getElementById('selectTransFrom'),
  selectTransSymbol: document.getElementById('selectTransSymbol'),
  selectTransTo: document.getElementById('selectTransTo'),
  btnAddTransition: document.getElementById('btnAddTransition'),
  transitionsList: document.getElementById('transitionsList'),
  btnConvert: document.getElementById('btnConvert'),
  btnClearAll: document.getElementById('btnClearAll'),
  btnTestString: document.getElementById('btnTestString'),
  inputTestString: document.getElementById('inputTestString'),
  testResults: document.getElementById('testResults'),
  nfaCanvas: document.getElementById('nfaCanvas'),
  dfaCanvas: document.getElementById('dfaCanvas'),
  nfaTableContainer: document.getElementById('nfaTableContainer'),
  dfaTableContainer: document.getElementById('dfaTableContainer'),
  stepsTimeline: document.getElementById('stepsTimeline'),
  examplesGrid: document.getElementById('examplesGrid'),
  speedSlider: document.getElementById('speedSlider'),
  nfaCanvasContainer: document.getElementById('nfaCanvasContainer'),
  dfaCanvasContainer: document.getElementById('dfaCanvasContainer'),
};

/* ── INIT ────────────────────────────────────────────────── */

function init() {
  renderExamples();
  wireEvents();
  resizeCanvases();
  window.addEventListener('resize', resizeCanvases);
  refreshUI();
}

function wireEvents() {
  dom.btnAddState.addEventListener('click', addState);
  dom.inputStateName.addEventListener('keydown', e => { if (e.key === 'Enter') addState(); });
  dom.btnAddAccept.addEventListener('click', addAcceptState);
  dom.btnAddTransition.addEventListener('click', addTransition);
  dom.btnConvert.addEventListener('click', runConversion);
  dom.btnClearAll.addEventListener('click', clearAll);
  dom.btnTestString.addEventListener('click', testString);
  dom.inputTestString.addEventListener('keydown', e => { if (e.key === 'Enter') testString(); });
  dom.inputAlphabet.addEventListener('change', onAlphabetChange);
}

/* ── EXAMPLES RENDER ────────────────────────────────────── */

function renderExamples() {
  dom.examplesGrid.innerHTML = '';
  EXAMPLES.forEach((ex, i) => {
    const card = document.createElement('div');
    card.className = 'example-card';
    card.innerHTML = `<div class="example-name">${ex.name}</div><div class="example-desc">${ex.desc}</div>`;
    card.addEventListener('click', () => loadExample(i));
    dom.examplesGrid.appendChild(card);
  });
}

function loadExample(idx) {
  const ex = EXAMPLES[idx];
  nfa.states = [...ex.states];
  nfa.alphabet = [...ex.alphabet];
  nfa.startState = ex.start;
  nfa.acceptStates = [...ex.accept];
  nfa.transitions = ex.transitions.map(t => ({ ...t }));
  dom.inputAlphabet.value = nfa.alphabet.join(', ');
  dfaResult = null;
  conversionSteps = [];
  refreshUI();
  notify(`Loaded: ${ex.name}`, 'success');
}

/* ── ALPHABET ────────────────────────────────────────────── */

function getAlphabet() {
  return dom.inputAlphabet.value.split(',').map(s => s.trim()).filter(Boolean);
}

function onAlphabetChange() {
  nfa.alphabet = getAlphabet();
  nfa.transitions = [];   
  refreshSymbolSelect();
  refreshUI();           
}

/* ── STATE MANAGEMENT ────────────────────────────────────── */

function addState() {
  const name = dom.inputStateName.value.trim();
  if (!name) return notify('Enter a state name.', 'error');
  if (nfa.states.includes(name)) return notify(`State "${name}" already exists.`, 'error');
  nfa.states.push(name);
  dom.inputStateName.value = '';
  if (nfa.states.length === 1) nfa.startState = name;
  refreshUI();
}

function removeState(name) {
  nfa.states = nfa.states.filter(s => s !== name);
  nfa.acceptStates = nfa.acceptStates.filter(s => s !== name);
  nfa.transitions = nfa.transitions.filter(t => t.from !== name && t.to !== name);
  if (nfa.startState === name) nfa.startState = nfa.states[0] || '';
  refreshUI();
}

function addAcceptState() {
  const val = dom.selectAcceptState.value;
  if (!val) return;
  if (nfa.acceptStates.includes(val)) return notify('Already an accept state.', 'error');
  nfa.acceptStates.push(val);
  refreshUI();
}

function removeAcceptState(name) {
  nfa.acceptStates = nfa.acceptStates.filter(s => s !== name);
  refreshUI();
}

/* ── TRANSITION MANAGEMENT ───────────────────────────────── */

function addTransition() {
  dom.selectTransSymbol.blur();
  const from = dom.selectTransFrom.value;
  const symbol = dom.selectTransSymbol.value;
  const to = dom.selectTransTo.value;
  if (!from || symbol === '' || !to) return notify('Fill all transition fields.', 'error');
  const duplicate = nfa.transitions.some(t => t.from === from && t.symbol === symbol && t.to === to);
  if (duplicate) return notify('Transition already exists.', 'error');
  nfa.transitions.push({ from, symbol, to });
  refreshUI();
}

function removeTransition(idx) {
  nfa.transitions.splice(idx, 1);
  refreshUI();
}

/* ── CLEAR ───────────────────────────────────────────────── */

function clearAll() {
  nfa.states = [];
  nfa.alphabet = [];
  nfa.transitions = [];
  nfa.startState = '';
  nfa.acceptStates = [];

  dom.inputAlphabet.value = '';
  dom.inputStateName.value = '';

  dfaResult = null;
  conversionSteps = [];
  dom.testResults.innerHTML = '';
  refreshUI();
  notify('Cleared all data.', 'info');
}

/* ══════════════════════════════════════════════════════════
 *  SUBSET CONSTRUCTION ALGORITHM
 * ══════════════════════════════════════════════════════════ */

function epsilonClosure(stateSet) {
  const stack = [...stateSet];
  const closure = new Set(stateSet);
  while (stack.length) {
    const st = stack.pop();
    nfa.transitions.forEach(t => {
      if (t.from === st && t.symbol === EPSILON && !closure.has(t.to)) {
        closure.add(t.to);
        stack.push(t.to);
      }
    });
  }
  return [...closure].sort();
}

function move(stateSet, symbol) {
  const result = new Set();
  stateSet.forEach(st => {
    nfa.transitions.forEach(t => {
      if (t.from === st && t.symbol === symbol) {
        result.add(t.to);
      }
    });
  });
  return [...result].sort();
}

function subsetConstruction() {
  const steps = [];
  const alpha = nfa.alphabet.filter(s => s !== EPSILON);

  // Step 1: Epsilon closure of start state
  const startClosure = epsilonClosure([nfa.startState]);
  steps.push({
    type: 'epsilon-closure',
    title: 'ε-closure of start state',
    detail: `ε-closure({${nfa.startState}}) = ${prettySet(startClosure)}`,
    set: startClosure,
  });

  const dfaStatesMap = new Map(); // key → { states[], isAccept, transitions: {symbol: key} }
  const startKey = setKey(startClosure);
  const isStartAccept = startClosure.some(s => nfa.acceptStates.includes(s));
  dfaStatesMap.set(startKey, {
    states: startClosure,
    isAccept: isStartAccept,
    transitions: {},
  });

  const unmarked = [startKey];
  let stepNum = 1;

  while (unmarked.length) {
    const currentKey = unmarked.shift();
    const currentSet = dfaStatesMap.get(currentKey).states;

    for (const sym of alpha) {
      stepNum++;
      const moved = move(currentSet, sym);
      const closed = moved.length ? epsilonClosure(moved) : [];
      const newKey = closed.length ? setKey(closed) : '∅';

      steps.push({
        type: 'move',
        title: `Process ${prettySet(currentSet)} on "${sym}"`,
        detail: `move(${prettySet(currentSet)}, ${sym}) = ${prettySet(moved)}` +
          (moved.length ? ` → ε-closure = ${prettySet(closed)}` : ''),
        from: currentKey,
        symbol: sym,
        toSet: closed,
        toKey: newKey,
        isNew: !dfaStatesMap.has(newKey) && newKey !== '∅',
      });

      dfaStatesMap.get(currentKey).transitions[sym] = newKey;

      if (newKey !== '∅' && !dfaStatesMap.has(newKey)) {
        const isAccept = closed.some(s => nfa.acceptStates.includes(s));
        dfaStatesMap.set(newKey, {
          states: closed,
          isAccept,
          transitions: {},
        });
        unmarked.push(newKey);
        steps.push({
          type: 'new-state',
          title: `New DFA state discovered`,
          detail: `${prettySet(closed)}${isAccept ? ' (ACCEPT)' : ''}`,
          key: newKey,
        });
      }
    }
  }

  // Handle dead/trap state
  let hasDead = false;
  dfaStatesMap.forEach(entry => {
    alpha.forEach(sym => {
      if (!entry.transitions[sym] || entry.transitions[sym] === '∅') {
        entry.transitions[sym] = '∅';
        hasDead = true;
      }
    });
  });

  if (hasDead) {
    if (!dfaStatesMap.has('∅')) {
      dfaStatesMap.set('∅', {
        states: [],
        isAccept: false,
        transitions: {},
      });
      alpha.forEach(sym => {
        dfaStatesMap.get('∅').transitions[sym] = '∅';
      });
    }
    steps.push({
      type: 'dead-state',
      title: 'Dead/Trap state added',
      detail: 'State ∅ added for undefined transitions',
    });
  }

  // Build name mapping
  const nameMap = new Map();
  let idx = 0;
  dfaStatesMap.forEach((_, key) => {
    if (key === '∅') {
      nameMap.set(key, 'D_trap');
    } else {
      nameMap.set(key, `D${idx}`);
      idx++;
    }
  });

  // Build result
  const dfaStates = [];
  const dfaTransitions = [];
  const dfaAcceptStates = [];
  const dfaStartState = nameMap.get(startKey);

  dfaStatesMap.forEach((entry, key) => {
    const name = nameMap.get(key);
    dfaStates.push({
      name,
      nfaStates: entry.states,
      key,
    });
    if (entry.isAccept) dfaAcceptStates.push(name);

    alpha.forEach(sym => {
      const toKey = entry.transitions[sym] || '∅';
      dfaTransitions.push({
        from: name,
        symbol: sym,
        to: nameMap.get(toKey) || 'D_trap',
      });
    });
  });

  steps.push({
    type: 'complete',
    title: 'Conversion complete!',
    detail: `DFA has ${dfaStates.length} states, ${dfaAcceptStates.length} accept state(s)`,
  });

  return {
    dfa: {
      states: dfaStates,
      alphabet: alpha,
      transitions: dfaTransitions,
      startState: dfaStartState,
      acceptStates: dfaAcceptStates,
    },
    steps,
    nameMap,
  };
}

/* ── RUN CONVERSION ──────────────────────────────────────── */

async function runConversion() {
  if (!nfa.states.length) return notify('Add at least one state.', 'error');
  if (!nfa.startState) return notify('Set a start state.', 'error');
  if (!nfa.acceptStates.length) return notify('Set at least one accept state.', 'error');
  nfa.alphabet = getAlphabet();
  if (!nfa.alphabet.length) return notify('Define an alphabet.', 'error');

  dom.stepsTimeline.innerHTML = '';
  dom.dfaTableContainer.innerHTML = '<div class="empty-state"><div class="conversion-spinner"></div></div>';

  const result = subsetConstruction();
  dfaResult = result.dfa;
  conversionSteps = result.steps;

  // Animate steps
  const speed = 11 - parseInt(dom.speedSlider.value);
  const delay = speed * 80;

  for (let i = 0; i < conversionSteps.length; i++) {
    await new Promise(r => setTimeout(r, delay));
    appendStep(conversionSteps[i], i);
  }

  renderDFATable();
  drawDFA();
  notify('Conversion complete! ✓', 'success');
}

function appendStep(step, idx) {
  const el = document.createElement('div');
  const typeClass = step.type === 'complete' ? 'completed' : (step.type === 'new-state' ? 'active' : '');
  el.className = `step-item ${typeClass}`;
  el.style.animationDelay = `${idx * 0.05}s`;

  let icon = '→';
  if (step.type === 'epsilon-closure') icon = 'ε';
  else if (step.type === 'new-state') icon = '★';
  else if (step.type === 'dead-state') icon = '⊘';
  else if (step.type === 'complete') icon = '✓';

  el.innerHTML = `
    <div class="step-number">${icon}</div>
    <div class="step-content">
      <div class="step-title">${step.title}</div>
      <div class="step-detail">${step.detail}</div>
    </div>
  `;
  dom.stepsTimeline.appendChild(el);
  dom.stepsTimeline.scrollTop = dom.stepsTimeline.scrollHeight;
}

/* ══════════════════════════════════════════════════════════
 *  STRING TESTING
 * ══════════════════════════════════════════════════════════ */

function testString() {
  const input = dom.inputTestString.value;
  nfa.alphabet = getAlphabet();
  const alpha = nfa.alphabet.filter(s => s !== EPSILON);

  // Validate input
  for (const ch of input) {
    if (!alpha.includes(ch)) {
      notify(`Symbol "${ch}" not in alphabet.`, 'error');
      return;
    }
  }

  const nfaRes = simulateNFA(input);
  let dfaRes = null;
  if (dfaResult) {
    dfaRes = simulateDFA(input);
  }

  renderTestResults(input, nfaRes, dfaRes);
}

function simulateNFA(input) {
  let currentStates = new Set(epsilonClosure([nfa.startState]));
  const trace = [{ symbol: 'start', states: [...currentStates] }];

  for (const ch of input) {
    let nextStates = new Set();
    currentStates.forEach(st => {
      nfa.transitions.forEach(t => {
        if (t.from === st && t.symbol === ch) {
          epsilonClosure([t.to]).forEach(s => nextStates.add(s));
        }
      });
    });
    currentStates = nextStates;
    trace.push({ symbol: ch, states: [...currentStates] });
  }

  const accepted = [...currentStates].some(s => nfa.acceptStates.includes(s));
  return { accepted, trace };
}

function simulateDFA(input) {
  let currentState = dfaResult.startState;
  const trace = [{ symbol: 'start', state: currentState }];

  for (const ch of input) {
    const trans = dfaResult.transitions.find(t => t.from === currentState && t.symbol === ch);
    currentState = trans ? trans.to : null;
    trace.push({ symbol: ch, state: currentState });
    if (!currentState) break;
  }

  const accepted = currentState && dfaResult.acceptStates.includes(currentState);
  return { accepted, trace };
}

function renderTestResults(input, nfaRes, dfaRes) {
  let html = '';
  const displayInput = input || 'ε (empty string)';

  // NFA result
  html += `<div class="test-result ${nfaRes.accepted ? 'accepted' : 'rejected'}">
    <span>${nfaRes.accepted ? '✓' : '✗'}</span>
    <span>NFA ${nfaRes.accepted ? 'ACCEPTS' : 'REJECTS'} "${displayInput}"</span>
  </div>`;

  // NFA trace
  html += `<div class="test-trace"><strong>NFA Trace:</strong><br>`;
  nfaRes.trace.forEach((step, i) => {
    if (i > 0) html += ` <span class="trace-arrow">──<span class="trace-symbol">${step.symbol}</span>──▶</span> `;
    html += `<span class="trace-state">${prettySet(step.states)}</span>`;
  });
  html += `</div>`;

  // DFA result
  if (dfaRes) {
    html += `<div class="test-result ${dfaRes.accepted ? 'accepted' : 'rejected'}">
      <span>${dfaRes.accepted ? '✓' : '✗'}</span>
      <span>DFA ${dfaRes.accepted ? 'ACCEPTS' : 'REJECTS'} "${displayInput}"</span>
    </div>`;

    html += `<div class="test-trace"><strong>DFA Trace:</strong><br>`;
    dfaRes.trace.forEach((step, i) => {
      if (i > 0) html += ` <span class="trace-arrow">──<span class="trace-symbol">${step.symbol}</span>──▶</span> `;
      html += `<span class="trace-state">${step.state || '∅'}</span>`;
    });
    html += `</div>`;

    // Equivalence check
    if (nfaRes.accepted === dfaRes.accepted) {
      html += `<div class="info-box" style="margin-top: 10px;">
        <strong>✓ Equivalence verified:</strong> Both NFA and DFA ${nfaRes.accepted ? 'accept' : 'reject'} this input.
      </div>`;
    } else {
      html += `<div class="test-result rejected" style="margin-top: 10px;">
        ⚠ Mismatch: NFA and DFA give different results!
      </div>`;
    }
  }

  dom.testResults.innerHTML = html;
}

/* ══════════════════════════════════════════════════════════
 *  RENDERING — TABLES
 * ══════════════════════════════════════════════════════════ */

function renderNFATable() {
  const alpha = getAlphabet();
  const hasEps = nfa.transitions.some(t => t.symbol === EPSILON);
  const symbols = [...alpha];
  if (hasEps) symbols.push(EPSILON);

  if (!nfa.states.length) {
    dom.nfaTableContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">Define states and transitions to see the NFA table.</div></div>`;
    return;
  }

  let html = '<table class="data-table"><thead><tr>';
  html += '<th>State</th>';
  symbols.forEach(s => {
    html += `<th>${s === EPSILON ? '<span class="epsilon">ε</span>' : s}</th>`;
  });
  html += '</tr></thead><tbody>';

  nfa.states.forEach(state => {
    const isStart = state === nfa.startState;
    const isAccept = nfa.acceptStates.includes(state);
    let prefix = '';
    if (isStart && isAccept) prefix = '<span class="start-marker">→</span><span class="accept-marker">*</span> ';
    else if (isStart) prefix = '<span class="start-marker">→</span> ';
    else if (isAccept) prefix = '<span class="accept-marker">*</span> ';

    html += `<tr><td class="state-cell">${prefix}${state}</td>`;
    symbols.forEach(sym => {
      const targets = nfa.transitions.filter(t => t.from === state && t.symbol === sym).map(t => t.to);
      const display = targets.length ? prettySet(targets) : '∅';
      html += `<td>${display}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  dom.nfaTableContainer.innerHTML = html;
}

function renderDFATable() {
  if (!dfaResult) {
    dom.dfaTableContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">Convert the NFA to see the DFA table.</div></div>`;
    return;
  }

  const alpha = dfaResult.alphabet;
  let html = '<table class="data-table"><thead><tr>';
  html += '<th>DFA State</th><th>NFA States</th>';
  alpha.forEach(s => { html += `<th>${s}</th>`; });
  html += '</tr></thead><tbody>';

  dfaResult.states.forEach(st => {
    const isStart = st.name === dfaResult.startState;
    const isAccept = dfaResult.acceptStates.includes(st.name);
    let prefix = '';
    if (isStart && isAccept) prefix = '<span class="start-marker">→</span><span class="accept-marker">*</span> ';
    else if (isStart) prefix = '<span class="start-marker">→</span> ';
    else if (isAccept) prefix = '<span class="accept-marker">*</span> ';

    html += `<tr class="${isAccept ? 'highlight-row' : ''}"><td class="state-cell">${prefix}${st.name}</td>`;
    html += `<td class="state-set">${prettySet(st.nfaStates)}</td>`;
    alpha.forEach(sym => {
      const trans = dfaResult.transitions.find(t => t.from === st.name && t.symbol === sym);
      html += `<td>${trans ? trans.to : '—'}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  dom.dfaTableContainer.innerHTML = html;
}

/* ══════════════════════════════════════════════════════════
 *  RENDERING — CANVAS STATE DIAGRAMS
 * ══════════════════════════════════════════════════════════ */

function resizeCanvases() {
  resizeCanvas(dom.nfaCanvas, dom.nfaCanvasContainer);
  resizeCanvas(dom.dfaCanvas, dom.dfaCanvasContainer);
  drawNFA();
  if (dfaResult) drawDFA();
}

function resizeCanvas(canvas, container) {
  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();
  const w = rect.width;
  const h = Math.max(rect.height, 350);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/* ── Auto layout using force sim ──────────────────────── */

function computeLayout(states, transitions, width, height) {
  if (!states.length) return [];

  const padding = 70;
  const W = width - padding * 2;
  const H = height - padding * 2;
  const cx = width / 2;
  const cy = height / 2;

  // Initialize positions in circle
  const positions = states.map((_, i) => {
    const angle = (2 * Math.PI * i) / states.length - Math.PI / 2;
    const r = Math.min(W, H) * 0.35;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      vx: 0,
      vy: 0,
    };
  });

  // Simple force simulation
  const iterations = 120;
  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;
    // Repulsion between nodes
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        let dx = positions[j].x - positions[i].x;
        let dy = positions[j].y - positions[i].y;
        let d = Math.sqrt(dx * dx + dy * dy) || 1;
        const repulsion = 8000 / (d * d);
        const fx = (dx / d) * repulsion * alpha;
        const fy = (dy / d) * repulsion * alpha;
        positions[i].x -= fx;
        positions[i].y -= fy;
        positions[j].x += fx;
        positions[j].y += fy;
      }
    }

    // Attraction along edges
    transitions.forEach(t => {
      const fromIdx = states.indexOf(t.from);
      const toIdx = states.indexOf(t.to);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
      let dx = positions[toIdx].x - positions[fromIdx].x;
      let dy = positions[toIdx].y - positions[fromIdx].y;
      let d = Math.sqrt(dx * dx + dy * dy) || 1;
      const attraction = (d - 130) * 0.01 * alpha;
      const fx = (dx / d) * attraction;
      const fy = (dy / d) * attraction;
      positions[fromIdx].x += fx;
      positions[fromIdx].y += fy;
      positions[toIdx].x -= fx;
      positions[toIdx].y -= fy;
    });

    // Center gravity
    positions.forEach(p => {
      p.x += (cx - p.x) * 0.01 * alpha;
      p.y += (cy - p.y) * 0.01 * alpha;
    });

    // Bounds
    positions.forEach(p => {
      p.x = Math.max(padding, Math.min(width - padding, p.x));
      p.y = Math.max(padding, Math.min(height - padding, p.y));
    });
  }

  return positions;
}

/* ── Drawing helpers ──────────────────────────────────── */

function drawArrow(ctx, x1, y1, x2, y2, r, color) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const endX = x2 - r * Math.cos(angle);
  const endY = y2 - r * Math.sin(angle);
  const startX = x1 + r * Math.cos(angle);
  const startY = y1 + r * Math.sin(angle);

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Arrowhead
  const headLen = 10;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - headLen * Math.cos(angle - 0.35), endY - headLen * Math.sin(angle - 0.35));
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - headLen * Math.cos(angle + 0.35), endY - headLen * Math.sin(angle + 0.35));
  ctx.stroke();
}

function drawCurvedArrow(ctx, x1, y1, x2, y2, r, color, label, curveDir = 1) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;

  // Perpendicular offset
  const offset = Math.min(d * 0.3, 50) * curveDir;
  const mx = (x1 + x2) / 2 + (-dy / d) * offset;
  const my = (y1 + y2) / 2 + (dx / d) * offset;

  // Start and end adjusted for radius
  const startAngle = Math.atan2(my - y1, mx - x1);
  const endAngle = Math.atan2(my - y2, mx - x2);
  const sx = x1 + r * Math.cos(startAngle);
  const sy = y1 + r * Math.sin(startAngle);
  const ex = x2 + r * Math.cos(endAngle);
  const ey = y2 + r * Math.sin(endAngle);

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(mx, my, ex, ey);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Arrowhead at end
  const headLen = 10;
  // Tangent at end of curve
  const tx = 2 * (ex - mx);
  const ty = 2 * (ey - my);
  const ta = Math.atan2(ty, tx);
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - headLen * Math.cos(ta - 0.35), ey - headLen * Math.sin(ta - 0.35));
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - headLen * Math.cos(ta + 0.35), ey - headLen * Math.sin(ta + 0.35));
  ctx.stroke();

  // Label
  if (label) {
    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Background
    const metrics = ctx.measureText(label);
    const lw = metrics.width + 8;
    ctx.fillStyle = 'rgba(10, 14, 26, 0.85)';
    ctx.fillRect(mx - lw / 2, my - 9, lw, 18);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(label, mx, my);
  }
}

function drawSelfLoop(ctx, x, y, r, color, label) {
  const loopR = 18;
  const lx = x;
  const ly = y - r - loopR;

  // Gap at bottom of loop (closest to node)
  const gapAngle = 0.3;
  const startAngle = Math.PI / 2 + gapAngle;
  const endAngle = Math.PI / 2 - gapAngle;

  ctx.beginPath();
  // Clockwise (false) from left-of-gap through top to right-of-gap = nearly full circle
  ctx.arc(lx, ly, loopR, startAngle, endAngle, false);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Arrowhead at end of arc (right side of gap, pointing into the node)
  const headLen = 8;
  const ax = lx + loopR * Math.cos(endAngle);
  const ay = ly + loopR * Math.sin(endAngle);
  // Clockwise arc tangent at endpoint points toward the node
  const tangent = endAngle + Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - headLen * Math.cos(tangent - 0.5), ay - headLen * Math.sin(tangent - 0.5));
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - headLen * Math.cos(tangent + 0.5), ay - headLen * Math.sin(tangent + 0.5));
  ctx.stroke();

  // Label
  if (label) {
    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(label);
    const lw = metrics.width + 8;
    ctx.fillStyle = 'rgba(10, 14, 26, 0.85)';
    ctx.fillRect(lx - lw / 2, ly - loopR - 13, lw, 16);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(label, lx, ly - loopR - 5);
  }
}

function drawStateNode(ctx, x, y, r, name, isStart, isAccept, colors) {
  // Glow
  const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2);
  glow.addColorStop(0, isAccept ? 'rgba(251, 191, 36, 0.12)' : 'rgba(129, 140, 248, 0.08)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 2, 0, Math.PI * 2);
  ctx.fill();

  // Accept double circle
  if (isAccept) {
    ctx.beginPath();
    ctx.arc(x, y, r + 5, 0, Math.PI * 2);
    ctx.strokeStyle = colors.accept;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Main circle
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = colors.fill;
  ctx.fill();
  ctx.strokeStyle = isAccept ? colors.accept : colors.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Start arrow
  if (isStart) {
    const arrowX = x - r - 30;
    ctx.beginPath();
    ctx.moveTo(arrowX, y);
    ctx.lineTo(x - r, y);
    ctx.strokeStyle = colors.start;
    ctx.lineWidth = 2;
    ctx.stroke();

    const headLen = 10;
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.lineTo(x - r - headLen, y - 5);
    ctx.moveTo(x - r, y);
    ctx.lineTo(x - r - headLen, y + 5);
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = colors.text;
  ctx.font = '600 13px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x, y);
}

/* ── Draw NFA ────────────────────────────────────────────── */

function drawNFA() {
  const canvas = dom.nfaCanvas;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  ctx.clearRect(0, 0, w, h);

  if (!nfa.states.length) return;

  const stateNames = nfa.states;
  const positions = computeLayout(stateNames, nfa.transitions, w, h);
  const R = 26;

  const colors = {
    fill: 'rgba(129, 140, 248, 0.1)',
    border: 'rgba(129, 140, 248, 0.6)',
    accept: '#fbbf24',
    start: '#34d399',
    text: '#e2e8f0',
    edge: 'rgba(148, 163, 184, 0.5)',
  };

  // Group transitions by (from, to) for merged labels
  const edgeGroups = {};
  nfa.transitions.forEach(t => {
    const key = t.from + '→' + t.to;
    if (!edgeGroups[key]) edgeGroups[key] = [];
    edgeGroups[key].push(t.symbol === EPSILON ? 'ε' : t.symbol);
  });

  // Track bidirectional edges
  const biDirectional = new Set();
  Object.keys(edgeGroups).forEach(key => {
    const [from, to] = key.split('→');
    const reverseKey = to + '→' + from;
    if (from !== to && edgeGroups[reverseKey]) {
      biDirectional.add(key);
    }
  });

  // Draw edges
  Object.entries(edgeGroups).forEach(([key, symbols]) => {
    const [from, to] = key.split('→');
    const fi = stateNames.indexOf(from);
    const ti = stateNames.indexOf(to);
    if (fi === -1 || ti === -1) return;

    const label = symbols.join(', ');

    if (from === to) {
      drawSelfLoop(ctx, positions[fi].x, positions[fi].y, R, colors.edge, label);
    } else if (biDirectional.has(key)) {
      const curveDir = key < (to + '→' + from) ? 1 : -1;
      drawCurvedArrow(ctx, positions[fi].x, positions[fi].y, positions[ti].x, positions[ti].y, R, colors.edge, label, curveDir);
    } else {
      // Straight with label
      const mx = (positions[fi].x + positions[ti].x) / 2;
      const my = (positions[fi].y + positions[ti].y) / 2;
      drawArrow(ctx, positions[fi].x, positions[fi].y, positions[ti].x, positions[ti].y, R, colors.edge);
      // Label on edge
      const dx = positions[ti].x - positions[fi].x;
      const dy = positions[ti].y - positions[fi].y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const offsetX = (-dy / d) * 14;
      const offsetY = (dx / d) * 14;
      ctx.fillStyle = 'rgba(10, 14, 26, 0.85)';
      const metrics = ctx.measureText(label);
      ctx.fillRect(mx + offsetX - metrics.width / 2 - 4, my + offsetY - 8, metrics.width + 8, 16);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, mx + offsetX, my + offsetY);
    }
  });

  // Draw states
  stateNames.forEach((name, i) => {
    drawStateNode(
      ctx,
      positions[i].x,
      positions[i].y,
      R,
      name,
      name === nfa.startState,
      nfa.acceptStates.includes(name),
      colors
    );
  });
}

/* ── Draw DFA ────────────────────────────────────────────── */

function drawDFA() {
  const canvas = dom.dfaCanvas;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  ctx.clearRect(0, 0, w, h);

  if (!dfaResult) return;

  const stateNames = dfaResult.states.map(s => s.name);
  const positions = computeLayout(stateNames, dfaResult.transitions, w, h);
  const R = 26;

  const colors = {
    fill: 'rgba(52, 211, 153, 0.1)',
    border: 'rgba(52, 211, 153, 0.6)',
    accept: '#fbbf24',
    start: '#34d399',
    text: '#e2e8f0',
    edge: 'rgba(148, 163, 184, 0.5)',
  };

  // Group transitions
  const edgeGroups = {};
  dfaResult.transitions.forEach(t => {
    const key = t.from + '→' + t.to;
    if (!edgeGroups[key]) edgeGroups[key] = [];
    edgeGroups[key].push(t.symbol);
  });

  const biDirectional = new Set();
  Object.keys(edgeGroups).forEach(key => {
    const [from, to] = key.split('→');
    const reverseKey = to + '→' + from;
    if (from !== to && edgeGroups[reverseKey]) {
      biDirectional.add(key);
    }
  });

  // Edges
  Object.entries(edgeGroups).forEach(([key, symbols]) => {
    const [from, to] = key.split('→');
    const fi = stateNames.indexOf(from);
    const ti = stateNames.indexOf(to);
    if (fi === -1 || ti === -1) return;

    const label = symbols.join(', ');

    if (from === to) {
      drawSelfLoop(ctx, positions[fi].x, positions[fi].y, R, colors.edge, label);
    } else if (biDirectional.has(key)) {
      const curveDir = key < (to + '→' + from) ? 1 : -1;
      drawCurvedArrow(ctx, positions[fi].x, positions[fi].y, positions[ti].x, positions[ti].y, R, colors.edge, label, curveDir);
    } else {
      const mx = (positions[fi].x + positions[ti].x) / 2;
      const my = (positions[fi].y + positions[ti].y) / 2;
      drawArrow(ctx, positions[fi].x, positions[fi].y, positions[ti].x, positions[ti].y, R, colors.edge);
      const dx = positions[ti].x - positions[fi].x;
      const dy = positions[ti].y - positions[fi].y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const offsetX = (-dy / d) * 14;
      const offsetY = (dx / d) * 14;
      ctx.fillStyle = 'rgba(10, 14, 26, 0.85)';
      const metrics = ctx.measureText(label);
      ctx.fillRect(mx + offsetX - metrics.width / 2 - 4, my + offsetY - 8, metrics.width + 8, 16);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, mx + offsetX, my + offsetY);
    }
  });

  // Draw state nodes with NFA state set as subtitle
  stateNames.forEach((name, i) => {
    const stObj = dfaResult.states.find(s => s.name === name);
    drawStateNode(
      ctx,
      positions[i].x,
      positions[i].y,
      R,
      name,
      name === dfaResult.startState,
      dfaResult.acceptStates.includes(name),
      colors
    );
    // Subtitle showing NFA states
    if (stObj) {
      ctx.fillStyle = 'rgba(34, 211, 238, 0.7)';
      ctx.font = '500 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(prettySet(stObj.nfaStates), positions[i].x, positions[i].y + R + 6);
    }
  });
}

/* ══════════════════════════════════════════════════════════
 *  UI REFRESH
 * ══════════════════════════════════════════════════════════ */

function refreshUI() {
  refreshStateChips();
  refreshAcceptChips();
  refreshStateSelects();
  refreshSymbolSelect();
  refreshTransitions();
  renderNFATable();
  drawNFA();
  if (dfaResult) {
    renderDFATable();
    drawDFA();
  }
}

function refreshStateChips() {
  dom.statesChips.innerHTML = '';
  nfa.states.forEach(s => {
    const chip = document.createElement('span');
    const isStart = s === nfa.startState;
    const isAccept = nfa.acceptStates.includes(s);
    chip.className = `chip ${isStart ? 'chip-start' : isAccept ? 'chip-accept' : 'chip-state'}`;
    chip.innerHTML = `${isStart ? '→ ' : ''}${isAccept ? '* ' : ''}${s} <span class="chip-remove" data-state="${s}">✕</span>`;
    chip.querySelector('.chip-remove').addEventListener('click', () => removeState(s));
    dom.statesChips.appendChild(chip);
  });
}

function refreshAcceptChips() {
  dom.acceptChips.innerHTML = '';
  nfa.acceptStates.forEach(s => {
    const chip = document.createElement('span');
    chip.className = 'chip chip-accept';
    chip.innerHTML = `* ${s} <span class="chip-remove" data-state="${s}">✕</span>`;
    chip.querySelector('.chip-remove').addEventListener('click', () => removeAcceptState(s));
    dom.acceptChips.appendChild(chip);
  });
}

function refreshStateSelects() {
  const selects = [dom.selectStartState, dom.selectAcceptState, dom.selectTransFrom, dom.selectTransTo];
  selects.forEach(sel => {
    const val = sel.value;
    sel.innerHTML = '<option value="">—</option>';
    nfa.states.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      sel.appendChild(opt);
    });
    sel.value = val;
  });
  dom.selectStartState.value = nfa.startState;
  dom.selectStartState.onchange = () => {
    nfa.startState = dom.selectStartState.value;
    refreshUI();
  };
}

function refreshSymbolSelect() {
  const alpha = getAlphabet();
  const val = dom.selectTransSymbol.value;
  dom.selectTransSymbol.innerHTML = '<option value="">—</option>';
  alpha.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    dom.selectTransSymbol.appendChild(opt);
  });
  // Add epsilon option
  const epsOpt = document.createElement('option');
  epsOpt.value = EPSILON;
  epsOpt.textContent = 'ε (epsilon)';
  dom.selectTransSymbol.appendChild(epsOpt);
  dom.selectTransSymbol.value = val;
}

function refreshTransitions() {
  dom.transitionsList.innerHTML = '';
  if (!nfa.transitions.length) {
    dom.transitionsList.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:0.82rem;padding:1rem;">No transitions defined yet.</div>';
    return;
  }
  nfa.transitions.forEach((t, i) => {
    const item = document.createElement('div');
    item.className = 'transition-item';
    item.innerHTML = `
      <span>
        <span class="state-cell">${t.from}</span>
        <span class="transition-arrow">──</span>
        <span class="transition-symbol">${t.symbol === EPSILON ? 'ε' : t.symbol}</span>
        <span class="transition-arrow">──▶</span>
        <span class="state-cell">${t.to}</span>
      </span>
      <button class="btn btn-sm btn-icon btn-danger" data-idx="${i}" title="Remove">✕</button>
    `;
    item.querySelector('button').addEventListener('click', () => removeTransition(i));
    dom.transitionsList.appendChild(item);
  });
}

/* ── BOOT ────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', init);
