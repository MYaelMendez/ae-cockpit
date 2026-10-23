import {createPrimitives, verifyEvidence} from './primitives.mjs';
const runtime = createPrimitives({principalId:'human:local-demo'});
const root = await runtime.createRoot({intent:'Prepare a workshop introduction',context:[{id:'brief',text:'The knowledge and tools belong to you.',source:'demo:fixture'}]});
for (const task of [
  {intent:'Inspect the brief',capability:'text.inspect',payload:{text:'The knowledge and tools belong to you.'}},
  {intent:'Make an introduction',capability:'draft.compose',payload:{title:'Our workshop',body:'The knowledge and tools belong to you.'}}
]) {
  const child = await runtime.proposeChild({parentId:root.id,contextIds:['brief'],...task});
  // Fixture simulates a local principal decision; it is not authenticated approval.
  const token = await runtime.approveLocal(child.id,{actor:'human:local-demo'});
  await runtime.executeLocal(child.id,token);
}
const result = await runtime.rejoin(root.id); await runtime.completeRoot({actor:'human:local-demo'});
const evidence = await runtime.exportEvidence();
if (!await verifyEvidence(evidence.events,evidence.anchor)) throw new Error('Evidence verification failed');
console.log(JSON.stringify({mode:'local-reference',result,anchor:evidence.anchor,evidenceVerified:true,externalEffects:false},null,2));
