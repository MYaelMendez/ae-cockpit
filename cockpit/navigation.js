export function navigate(lane,action){
 if(action.href){
  const url=new URL(action.href,location.href);
  if(!['http:','https:'].includes(url.protocol))return;
  location.assign(url.href);return;
 }
 window.alert(lane.label+' / '+action.title+': prototype entry point. Connect an authorized tool before execution.');
}