
#ifdef GL_ES
precision mediump float;
#endif
// from https://thebookofshaders.com/edit.php#10/matrix.frag

//#define FOG_DENSITY 0.025
#define FOG_DENSITY 0.005

uniform vec2 iResolution;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vNorm;
uniform float iGlobalTime;
uniform float logDepthBufFC;
varying float vFragDepth;
varying vec3 vViewPos;
varying vec3 vWorldPos;
uniform float scale;
 
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d) 
#pragma glslify: fog_exp = require(glsl-fog/exp) 
#pragma glslify: fog_exp2 = require(glsl-fog/exp2) 
float random(in float x){ return fract(sin(x)*43758.5453); }
float random(in vec3 st){ return fract(sin(dot(st.xyz ,vec3(12.9898,78.233, 123.321))) * 43758.5453); }

float randomChar(vec3 outer,vec3 inner){
    float grid = 5.;
    vec3 margin = vec3(.2,.05, .05);
    vec3 borders = step(margin,inner)*step(margin,1.-inner);
    vec3 ipos = floor(inner*grid);
    vec3 fpos = fract(inner*grid);
    return step(.5,random(outer*64.+ipos)) * borders.x * borders.y * borders.z * step(0.01,fpos.x) * step(0.01,fpos.y) * step(0.01,fpos.z);
}

void main(){
    vec3 st = vWorldPos * 0.09;
    vec4 color = vec4(0.0);

    float rows = 1.0;
    // rows = 3.0;
     rows = 12.0;
   //  rows = 24.0;
    vec3 ipos = floor(st*rows);
    vec3 fpos = fract(st*rows);

    ipos += vec3(0.,floor(iGlobalTime*30.*random(ipos.x+1.)),0.);

    float pct = 1.0;
    pct *= randomChar(ipos,fpos);
    pct *= random(ipos);

    color = vec4(pct * 0.15 * random(ipos), pct * random(ipos), pct , pct);

    gl_FragColor = vec4( color );
}
