#pragma glslify: edge = require('glsl-edge-detection') 
#pragma glslify: asciiFilter = require('glsl-ascii-filter') 
#pragma glslify: snoise2 = require('glsl-noise/simplex/2d') 

varying vec2 vUv;
uniform sampler2D tDiffuse; 
uniform vec2 iResolution;
uniform float iGlobalTime;
uniform float amount;

void main() {
    vec4 colour = texture2D(tDiffuse,vUv);
    vec4 colour2 = texture2D(tDiffuse,vUv);
    float blur = 0.0;
    float blur2 = 0.0;
    blur = (1.0 + sin(iGlobalTime*10.0)) * snoise2(vUv) * 0.02;
    blur *= 0.02 * amount;
    blur2 = (1.0 + sin(iGlobalTime*60.0)) * snoise2(vec2(vUv.x,sin(iGlobalTime)));
    blur2 = sin(blur2) * cos(iGlobalTime * 10.0);
    blur2 *= 0.02 * amount;



    float edges = edge(tDiffuse,vUv ,iResolution);
    float edges1 = edge(tDiffuse,vUv + vec2(blur),iResolution);
    float edges2 = edge(tDiffuse,vUv + vec2(blur2,blur2),iResolution);
    
    colour = vec4(edges);
    colour.r = edges1;
    colour.g = edges2;
    colour.b = edges2*0.4 + edges1 * 0.4;
    //colour -= 4.0 * vec4(length(vUv - vec2(0.5)));
    gl_FragColor = mix( colour2,vec4(colour + colour2 * 0.1),vec4(amount));
}
