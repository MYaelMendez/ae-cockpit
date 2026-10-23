import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {Script} from 'node:vm';

const root=new URL('../',import.meta.url);
const source=await readFile(new URL('cockpit/widgets.js',root),'utf8');
const {parseInvocation,mountWidgets}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const registry=JSON.parse(await readFile(new URL('registry/widgets.json',root),'utf8'));

test('new aliases and existing widget grammar resolve independently',()=>{
 for(const alias of ['$æææ','$aeaeae','>_æææ://','💬','💬://','$@ae 💬','$@ae aeaeae']){
  const parsed=parseInvocation(alias);
  assert.ok(parsed,alias);
  const widget=registry.widgets.find(w=>w.id===parsed.id)||registry.widgets.find(w=>w.icon===parsed.icon);
  assert.equal(widget?.id,'aeaeae',alias);
 }
 assert.equal(parseInvocation('$@ae github').id,'github');
 assert.equal(parseInvocation('$@ae 📧$æ').icon,'📧');
 for(const bad of ['$æææ execute','https://evil.example','$aeaeaex','💬://send','<script>'])assert.equal(parseInvocation(bad),null,bad);
});

test('widget selection renders a local story link with accurate connection state',()=>{
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attrs={};this.handlers={};}
  append(...els){this.children.push(...els);}
  prepend(...els){this.children.unshift(...els);}
  replaceChildren(...els){this.children=els;}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,v){this.handlers[k]=v;}
  querySelectorAll(tag){return this.children.flatMap(c=>[...(c.tagName===tag?[c]:[]),...c.querySelectorAll(tag)]);}
 }
 const saved={document:globalThis.document,history:globalThis.history,location:globalThis.location};
 try{
  let hash='';globalThis.document={createElement:tag=>new Element(tag)};
  globalThis.history={replaceState:(_s,_t,url)=>{hash=url;}};
  globalThis.location={hash:'#widget=aeaeae'};
  const el=new Element('main');mountWidgets(el,registry.widgets);
  const link=el.querySelectorAll('a')[0];assert.equal(link.href,'./aeaeae/workbench.html');
  assert.equal(el.querySelectorAll('a')[1].href,'./aeaeae/');
  assert.equal(hash,'#widget=aeaeae');
  const chat=el.querySelectorAll('button').find(b=>b.dataset.widget==='aeaeae');
  assert.equal(chat.attrs['aria-pressed'],'true');
  assert.ok(el.querySelectorAll('p').some(p=>p.textContent==='Local prototype only'));
  const form=el.querySelectorAll('form')[0],input=el.querySelectorAll('input')[0];
  input.value='$æææ';form.handlers.submit({preventDefault(){}});
  assert.equal(hash,'#widget=aeaeae');
 }finally{for(const [key,value] of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});

test('story assets exist and inline JavaScript parses',async()=>{
 const html=await readFile(new URL('aeaeae/index.html',root),'utf8');
 const scripts=[...html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)];
 new Script(scripts.at(-1)[1]);
 assert.equal((html.match(/class="scene"/g)||[]).length,6);
 for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  if(match[1].startsWith('#'))continue;
  await access(new URL(match[1],new URL('aeaeae/index.html',root)));
 }
});

test('example children have known parents and no claimed authority',async()=>{
 const tree=JSON.parse(await readFile(new URL('aeaeae/examples/conversation-tree.json',root),'utf8'));
 assert.equal(tree.authority,'none');
 const ids=new Set(tree.conversations.map(c=>c.id));
 assert.equal(ids.size,tree.conversations.length);
 assert.equal(tree.conversations.filter(c=>c.parent_id===null).length,1);
 for(const node of tree.conversations){if(node.parent_id!==null)assert.ok(ids.has(node.parent_id));}
});
