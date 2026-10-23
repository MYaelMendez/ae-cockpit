import {createPrimitives, verifyEvidence} from './primitives.mjs';
const $ = id => document.getElementById(id);
let runtime, root, busy = false;
const approvals = new Map();
const element = (tag, value) => {const node = document.createElement(tag); if (value !== undefined) node.textContent = value; return node;};
async function act(work) {
  if (busy) return;
  busy = true; $('notice').textContent = '';
  document.querySelectorAll('button').forEach(button => button.disabled = true);
  try {await work();} catch (error) {$('notice').textContent = error.message;}
  finally {try {if (runtime) await render();} finally {busy = false; document.querySelectorAll('button').forEach(button => button.disabled = false); $('begin').disabled = !!root;}}
}
async function render() {
  const state = await runtime.exportEvidence(); $('tree').replaceChildren();
  const currentParent = $('parent').value; $('parent').replaceChildren();
  for (const node of state.nodes) {
    if (!['RETURNED','CANCELLED','EXPIRED'].includes(node.status)) {const option = element('option', `${'↳ '.repeat(node.depth)}${node.intent}`); option.value = node.id; $('parent').append(option);}
    const card = element('article'); card.append(element('h2', `${'↳ '.repeat(node.depth)}${node.parentId ? '💬' : '🫵'} ${node.intent}`));
    const status = element('p', `${node.status} · revision ${node.revision}`); status.className = 'state'; card.append(status);
    card.append(element('p', `Context: ${node.contextRefs.map(ref => ref.id).join(', ') || 'none'} · ${node.capability || 'intent container'}`));
    if (node.parentId && ['PROPOSED','QUEUED'].includes(node.status)) {
      card.append(element('pre', JSON.stringify(node.payload, null, 2)));
      const approve = element('button', '🫵 Approve this revision'); approve.type = 'button';
      approve.addEventListener('click', () => act(async () => {approvals.set(node.id, await runtime.approveLocal(node.id, {actor: state.principalId})); $('notice').textContent = 'Local approval recorded for this revision.';})); card.append(approve);
      const run = element('button', 'Run local task'); run.type = 'button';
      run.addEventListener('click', () => act(async () => {await runtime.executeLocal(node.id, approvals.get(node.id)); approvals.delete(node.id); $('notice').textContent = 'Result returned with a local receipt.';})); card.append(run);
    }
    if (node.result) card.append(element('pre', JSON.stringify(node.result, null, 2)));
    $('tree').append(card);
  }
  if ([...$('parent').options].some(option => option.value === currentParent)) $('parent').value = currentParent;
  $('ledger').textContent = state.events.map(event => `${event.sequence}. ${event.type} · ${event.hash.slice(0, 12)}`).join('\n');
  $('count').textContent = `(${state.events.length})`; $('child-form').hidden = !state.nodes.some(n => !['RETURNED','CANCELLED','EXPIRED'].includes(n.status));
  $('return-controls').hidden = false;
}
$('intent-form').addEventListener('submit', event => {event.preventDefault(); act(async () => {
  if (root) return;
  if (!globalThis.crypto?.getRandomValues) throw new Error('This browser cannot generate local conversation identifiers.');
  runtime = createPrimitives({principalId: 'human:local-tab'});
  root = await runtime.createRoot({intent: $('intent').value, context: [{id:'brief', text:$('brief').value, source:'human:provided-in-this-tab'}]});
  $('intent').readOnly = true; $('brief').readOnly = true; $('child-form').hidden = false;
});});
$('child-form').addEventListener('submit', event => {event.preventDefault(); act(async () => {
  const parent = await runtime.inspect($('parent').value); const ref = parent.contextRefs.find(r => r.id === 'brief');
  if (!$('share').checked) throw new Error('Select the brief to use it as context and task input.');
  if (!ref) throw new Error('This parent has no brief. Choose a parent that holds the context.');
  const capability = $('capability').value;
  await runtime.proposeChild({parentId:parent.id, intent:$('purpose').value, capability,
    payload:capability === 'text.inspect' ? {text:ref.text} : {title:$('purpose').value, body:ref.text}, contextIds:['brief']});
});});
$('rejoin').addEventListener('click', () => act(async () => {const result = await runtime.rejoin(root.id); $('result').replaceChildren(element('h2', result.complete ? 'All direct children returned' : 'Results with outstanding work'), element('pre', JSON.stringify(result.children, null, 2)));}));
$('complete').addEventListener('click', () => act(async () => {await runtime.completeRoot({actor:'human:local-tab'}); $('notice').textContent = 'Intent completed. Evidence is ready to export.';}));
$('cancel').addEventListener('click', () => act(async () => {await runtime.cancel(root.id, {actor:'human:local-tab'}); approvals.clear(); $('notice').textContent = 'Open conversations cancelled.';}));
$('export').addEventListener('click', () => act(async () => {
  const state = await runtime.exportEvidence(); if (!await verifyEvidence(state.events, state.anchor)) throw new Error('Local evidence verification failed');
  const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], {type:'application/json'})); const link = element('a'); link.href = url; link.download = 'aeaeae-local-evidence.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('notice').textContent = 'Exported locally computed evidence. Keep the head and count separately if you need to detect later truncation.';
}));
