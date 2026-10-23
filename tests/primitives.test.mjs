import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPrimitives, verifyEvidence, capabilities} from '../aeaeae/primitives.mjs';
import {sha256Hex} from '../aeaeae/sha256.mjs';
import {createHash} from 'node:crypto';

test('portable SHA-256 matches Node for empty, Unicode and multi-block vectors',() => {
  for (const value of ['', 'abc', '💬 æææ', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'abcde'.repeat(5000)]) {
    assert.equal(sha256Hex(new TextEncoder().encode(value)),createHash('sha256').update(value).digest('hex'));
  }
});

async function setup(options = {}) {
  let time = 1000000;
  const runtime = createPrimitives({principalId:'human:test', now:() => time, ...options});
  const root = await runtime.createRoot({intent:'Return useful work', context:[{id:'brief',text:'Human intent. Useful tools.',source:'test:fixture'}]});
  const propose = (extra = {}) => runtime.proposeChild({parentId:root.id,intent:'Inspect brief',capability:'text.inspect',payload:{text:'Human intent. Useful tools.'},contextIds:['brief'],...extra});
  const approve = id => runtime.approveLocal(id,{actor:'human:test'});
  return {runtime,root,propose,approve,advance:ms => {time += ms;}};
}

test('one real local cycle: intent, children, approval, results, rejoin, evidence',async () => {
  const {runtime,root,propose,approve} = await setup();
  const first = await propose(); const second = await propose({capability:'draft.compose',payload:{title:'Introduction',body:'Build tools you own.'}});
  const inspection = await runtime.executeLocal(first.id,await approve(first.id));
  assert.equal(inspection.result.words,4); assert.equal(inspection.receipt.payload.externalEffects,false);
  const draft = await runtime.executeLocal(second.id,await approve(second.id));
  assert.equal(draft.result.sent,false); assert.equal(draft.result.draft,'Introduction\n\nBuild tools you own.');
  const result = await runtime.rejoin(root.id); assert.equal(result.complete,true); assert.ok(result.children.every(child => child.evidenceRef));
  assert.equal((await runtime.completeRoot({actor:'human:test'})).status,'RETURNED');
  const exported = await runtime.exportEvidence(); assert.ok(await verifyEvidence(exported.events,exported.anchor));
});
test('selected context copies only requested references; payloads and snapshots are isolated',async () => {
  const {runtime,root,propose} = await setup(); const child = await propose({contextIds:[]});
  assert.deepEqual(child.contextRefs,[]); assert.equal(child.principalId,root.principalId);
  child.payload.text='changed'; const state = await runtime.exportEvidence(); state.nodes[1].payload.text='also changed';
  assert.equal((await runtime.inspect(child.id)).payload.text,'Human intent. Useful tools.');
  await assert.rejects(propose({contextIds:['missing']}),/Context unavailable/);
  await assert.rejects(propose({parentId:child.id,contextIds:['brief']}),/Context unavailable/);
});
test('context records and imported JSON cannot function as approvals',async () => {
  const {runtime,propose} = await setup(); const child = await propose();
  await assert.rejects(runtime.executeLocal(child.id,{actor:'human:test',approved:true}),/approval required/);
  const state = await runtime.inspect(child.id); assert.equal(state.status,'PROPOSED');
  const evidence = await runtime.exportEvidence(); assert.equal(evidence.events.at(-1).type,'execution.denied');
});
test('only the configured principal label can record a local decision',async () => {
  const {runtime,propose} = await setup(); const child = await propose();
  await assert.rejects(runtime.approveLocal(child.id,{actor:'agent:child'}),/Principal mismatch/);
  await assert.rejects(runtime.cancel(child.id,{actor:'agent:child'}),/Principal mismatch/);
});
test('revision invalidates the old payload-bound decision',async () => {
  const {runtime,propose,approve} = await setup(); const child = await propose(); const token = await approve(child.id);
  await runtime.revise(child.id,{payload:{text:'New text'}});
  await assert.rejects(runtime.executeLocal(child.id,token),/approval required/);
  const result = await runtime.executeLocal(child.id,await approve(child.id)); assert.equal(result.result.words,2);
});
test('approval expires and can be revoked',async () => {
  const {runtime,propose,advance} = await setup(); const child = await propose();
  let token = await runtime.approveLocal(child.id,{actor:'human:test',ttlMs:5}); advance(5);
  await assert.rejects(runtime.executeLocal(child.id,token),/approval required/);
  token = await runtime.approveLocal(child.id,{actor:'human:test'}); await runtime.revokeLocal(token);
  await assert.rejects(runtime.executeLocal(child.id,token),/approval required/);
});
test('approval cannot move to siblings or another runtime',async () => {
  const a = await setup(), b = await setup(); const first = await a.propose(), second = await a.propose(), foreign = await b.propose();
  const token = await a.approve(first.id); await a.approve(second.id); await b.approve(foreign.id);
  await assert.rejects(a.runtime.executeLocal(second.id,token),/approval required/);
  await assert.rejects(b.runtime.executeLocal(foreign.id,token),/approval required/);
});
test('concurrent replay cannot duplicate a local execution',async () => {
  const {runtime,propose,approve} = await setup(); const child = await propose(); const token = await approve(child.id);
  const results = await Promise.allSettled([runtime.executeLocal(child.id,token),runtime.executeLocal(child.id,token)]);
  assert.equal(results.filter(result => result.status==='fulfilled').length,1);
  const state = await runtime.exportEvidence(); assert.equal(state.events.filter(e => e.type==='result.returned').length,1);
});
test('depth, open task, total node and TTL bounds fail closed',async () => {
  const a = await setup({maxDepth:1}); const child = await a.propose();
  await assert.rejects(a.propose({parentId:child.id}),/Depth limit/);
  const b = await setup({maxOpen:1}); await b.propose(); await assert.rejects(b.propose(),/Open task limit/);
  const c = await setup({maxNodes:2}); const only = await c.propose(); await c.runtime.executeLocal(only.id,await c.approve(only.id)); await assert.rejects(c.propose(),/Node limit/);
  await assert.rejects(a.propose({ttlMs:-1}),/Invalid TTL/);
});
test('expiry is recorded and blocks descendants even with an existing approval',async () => {
  const {runtime,propose,approve,advance} = await setup(); const child = await propose({ttlMs:10}); const token = await approve(child.id); advance(10);
  await assert.rejects(runtime.executeLocal(child.id,token),/expired/);
  assert.equal((await runtime.inspect(child.id)).status,'EXPIRED');
});
test('cancelling a parent cancels open descendants and invalidates execution',async () => {
  const {runtime,root,propose,approve} = await setup(); const child = await propose(); const grandchild = await propose({parentId:child.id}); const token = await approve(grandchild.id);
  await runtime.cancel(root.id,{actor:'human:test'});
  assert.equal((await runtime.inspect(grandchild.id)).status,'CANCELLED');
  await assert.rejects(runtime.executeLocal(grandchild.id,token),/cancelled/);
});
test('parents cannot complete while descendants are pending or cancelled',async () => {
  const {runtime,root,propose,approve} = await setup(); const child = await propose(); const nested = await propose({parentId:child.id}); const token = await approve(child.id);
  await assert.rejects(runtime.executeLocal(child.id,token),/approval required/);
  assert.equal((await runtime.rejoin(root.id)).complete,false);
  await assert.rejects(runtime.completeRoot({actor:'human:test'}),/descendants/);
  await runtime.cancel(nested.id,{actor:'human:test'});
  await assert.rejects(runtime.executeLocal(child.id,token),/approval required/);
});
test('fixed registry rejects external actions and unknown payload fields',async () => {
  const {propose} = await setup(); assert.ok(capabilities.every(c => c.effect==='local'));
  await assert.rejects(propose({capability:'email.send',payload:{text:'send'}}),/Unsupported/);
  await assert.rejects(propose({payload:{text:'hello',authority:true}}),/Unsupported/);
});
test('evidence verifier detects mutation, reordering, truncation and malformed records against retained anchors',async () => {
  const {runtime,propose,approve} = await setup(); const child = await propose(); await runtime.executeLocal(child.id,await approve(child.id));
  const {events,anchor} = await runtime.exportEvidence(); assert.ok(await verifyEvidence(events,anchor));
  const tampered = structuredClone(events); tampered.at(-1).payload.result.words=999; assert.equal(await verifyEvidence(tampered,anchor),false);
  assert.equal(await verifyEvidence(events.slice(0,-1),anchor),false);
  const reordered = structuredClone(events); [reordered[0],reordered[1]]=[reordered[1],reordered[0]]; assert.equal(await verifyEvidence(reordered,anchor),false);
  assert.equal(await verifyEvidence([null],{head:'x',count:1}),false); assert.equal(await verifyEvidence(events),false);
});
test('invalid inputs cannot leave a partially created root or child',async () => {
  const runtime = createPrimitives({principalId:'human:test'});
  await assert.rejects(runtime.createRoot({intent:''}),/Invalid intent/);
  const root = await runtime.createRoot({intent:'Valid'}); await assert.rejects(runtime.createRoot({intent:'Another'}),/Root already/);
  await assert.rejects(runtime.proposeChild({parentId:root.id,intent:'bad',capability:'text.inspect',payload:{text:''}}),/Invalid text/);
  assert.equal((await runtime.exportEvidence()).nodes.length,1);
});
