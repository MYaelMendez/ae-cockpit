import {renderTickers} from './tickers.js';
import {navigate} from './navigation.js';
import {mountWidgets} from './widgets.js';
const root=document.querySelector('#lanes');
try {
 const response=await fetch('./registry/widgets.json');
 if(!response.ok)throw Error('Widget registry unavailable');
 const data=await response.json();
 mountWidgets(root,data.widgets);
} catch(e){console.error(e)}
try {
 const response=await fetch('./registry/environments.json');
 if(!response.ok) throw Error('Registry unavailable');
 const data=await response.json();
 renderTickers(root,data.lanes,navigate);
} catch(e){root.textContent='Cockpit registry unavailable. Reload to retry.';console.error(e)}
const canvas=document.querySelector('#world'),gl=canvas.getContext('webgl',{alpha:false});
if(gl){
 const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
 try{
  const [vs,fs]=await Promise.all(['./shaders/vertex.vert','./shaders/background.frag'].map(async u=>{const r=await fetch(u);if(!r.ok)throw Error(u+' unavailable');return r.text()}));
  const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,vs));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));gl.useProgram(p);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const a=gl.getAttribLocation(p,'position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  const res=gl.getUniformLocation(p,'resolution'),time=gl.getUniformLocation(p,'time');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(t){if(document.hidden){if(!reduced)requestAnimationFrame(frame);return}const d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.floor(canvas.clientWidth*d)),h=Math.max(1,Math.floor(canvas.clientHeight*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}gl.uniform2f(res,w,h);gl.uniform1f(time,reduced?0:t/1000);gl.drawArrays(gl.TRIANGLES,0,6);if(!reduced)requestAnimationFrame(frame)}
  requestAnimationFrame(frame);
 }catch(e){console.warn('Shader unavailable; static background retained',e)}
}