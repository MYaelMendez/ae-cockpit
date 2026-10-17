precision mediump float;
uniform vec2 resolution;uniform float time;
void main(){vec2 uv=gl_FragCoord.xy/resolution.xy;vec2 p=uv-.5;p.x*=resolution.x/resolution.y;float d=length(p);float ripple=.5+.5*sin(d*27.-time*.7);float glow=exp(-d*4.)*(.04+.035*ripple);float grid=pow(max(0.,sin(p.x*50.)*sin(p.y*50.)),14.)*.03;vec3 c=vec3(.035,.043,.06)+vec3(.92,.69,.26)*(glow+grid);gl_FragColor=vec4(c,1.);}