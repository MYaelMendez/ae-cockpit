const safeId = value => /^[a-z][a-z0-9-]*$/.test(value);
export function parseInvocation(raw){
 const value=String(raw||'').trim();
 if(/^(?:\$æææ|\$aeaeae|>_æææ:\/\/|💬(?::\/\/)?)$/iu.test(value))return {icon:'💬',id:'aeaeae'};
 if(/^(?:\$æææ|\$aeaeae)/iu.test(value))return null;
 const m=value.match(/^(?:\$@ae|\$ae|\$æ|\$_a_e:\/\/)(?:\s+|\/)?(?:([\p{Extended_Pictographic}\uFE0F]+)\s*)?(?:\$æ\s*)?([a-z][a-z0-9-]*)?$/iu);
 return m?{icon:m[1]||null,id:m[2]||null}:null;
}
export function mountWidgets(root,items){
 const section=document.createElement('section');section.className='widgets';
 const title=document.createElement('h2');title.className='label';title.textContent='🛸 WIDGET FLEET · $@ae';
 const grid=document.createElement('div');grid.className='widget-grid';
 const detail=document.createElement('div');detail.className='widget-detail';detail.setAttribute('role','status');detail.setAttribute('aria-live','polite');
 const prompt=document.createElement('form');prompt.className='invocation-form';
 const input=document.createElement('input');input.placeholder='$@ae 📧$æ';input.setAttribute('aria-label','Widget invocation');input.autocomplete='off';
 const submit=document.createElement('button');submit.textContent='OPEN';submit.type='submit';
 function select(w){if(!w)return;history.replaceState(null,'','#widget='+encodeURIComponent(w.id));detail.replaceChildren();
 const name=document.createElement('strong');name.textContent=w.icon+' '+w.label;
 const description=document.createElement('p');description.textContent=w.description||'';
 const status=document.createElement('p');status.textContent=w.connection==='connected'?'Connected capability':w.connection==='local-prototype'?'Local prototype only':'Not connected — no external action will run';
 detail.append(name,description,status);
 if(w.id==='aeaeae'){const link=document.createElement('a');link.href='./aeaeae/';link.textContent='Open 💬 $æææ · 12-second origin story';detail.append(link);}
 grid.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.widget===w.id)));}
 for(const w of items){if(!safeId(w.id))continue;const b=document.createElement('button');b.type='button';b.className='widget';b.dataset.widget=w.id;b.textContent='🛸 '+w.icon+' '+w.label;b.addEventListener('click',()=>select(w));grid.append(b)}
 prompt.addEventListener('submit',e=>{e.preventDefault();const raw=input.value.trim();const parsed=parseInvocation(raw);const selected=parsed&&(items.find(w=>w.id===parsed.id)||items.find(w=>w.icon===parsed.icon));if(selected)select(selected);else detail.textContent='Unknown widget. Try $æææ, $@ae 📧$æ or $@ae github.'});
 prompt.append(input,submit);section.append(title,grid,prompt,detail);root.prepend(section);
 const hash=new URLSearchParams(location.hash.slice(1)).get('widget');if(hash){const selected=items.find(w=>w.id===hash);if(selected)select(selected)}
}
