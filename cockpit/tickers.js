export function renderTickers(root,lanes,onSelect){
 for(const lane of lanes){
  const section=document.createElement('section');section.className='lane';
  const label=document.createElement('h2');label.className='label';label.textContent=lane.label;
  const viewport=document.createElement('div');viewport.className='viewport';
  const track=document.createElement('div');track.className='track';track.style.setProperty('--speed',Math.max(20,lane.actions.length*6)+'s');
  for(let copy=0;copy<2;copy++){
   const group=document.createElement('div');group.className='group';if(copy)group.setAttribute('aria-hidden','true');
   for(const action of lane.actions){
    const btn=document.createElement('button');btn.className='action';btn.type='button';btn.textContent=action.title;btn.tabIndex=copy?-1:0;
    btn.addEventListener('click',()=>{section.classList.add('paused');onSelect(lane,action)});
    group.append(btn);
   }track.append(group);
  }
  viewport.append(track);section.append(label,viewport);root.append(section);
 }
}