#ifdef GL_ES
precision mediump float;
#endif


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

 
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d) 
#pragma glslify: fog_exp = require(glsl-fog/exp) 
#pragma glslify: fog_exp2 = require(glsl-fog/exp2) 
vec3 random2( vec3 p ) {
    return fract(sin(vec3(dot(p,vec3(127.1,311.7,111.3)),dot(p,vec3(269.5,183.3,105.1)),dot(p,vec3(98.2,231.3,173.7))))*43758.5453);
}

vec3 BRICK_COLOR = vec3(100.0 / 255.0, 106.0 / 255.0, 100.0 / 255.0);
vec3 WIERD_COLOR = vec3(200.0 / 255.0, 106.0 / 255.0, 100.0 / 255.0);

vec3 MORTAR_COLOR = vec3(200.0 / 255.0, 200.0 / 255.0, 195.0 / 255.0);

vec3 BRICK_SIZE = vec3(0.2, 0.2,0.2);

vec3 BRICK_PCT = vec3(0.95, 0.9, 0.9);

vec2 W_BRICK_SIZE = vec2(0.2, 0.2);

vec2 W_BRICK_PCT = vec2(0.95, 0.9);
vec3 wierds(vec2 st )
{
    
    vec2 position = st / W_BRICK_SIZE;
    
    if(fract(position.y * 0.5) > 0.5)
    {
     	position.x += 0.5;   
    }
    
    position = fract(position);
    
    vec2 useBrick = step(position, W_BRICK_PCT);
    
    
    vec3 color = mix(MORTAR_COLOR, WIERD_COLOR, useBrick.x * useBrick.y);
    
    
    
	return color;
}
vec3 bricks(vec3 st )
{
   
    st *= 0.05; 
    vec3 position = st / BRICK_SIZE;
    
    if(fract(position.y * 0.5) > 0.5)
    {
     //	position.x += 0.5;   
     	position.z += 0.5;   
    }
    
    position = fract(position);
    
    vec3 useBrick = step(position, BRICK_PCT);
    
    
    vec3 color = mix(MORTAR_COLOR, BRICK_COLOR, useBrick.x * useBrick.y * useBrick.z);
    
    
    
	return color;
}

void main() {

    vec3 st = vWorldPos; 
    // Scale 
    //st *= .12;
    st *= .01;
    
    // Tile the space
    vec3 i_st = floor(st);
    vec3 f_st = fract(st);

    float m_dist = 10.;  // minimun distance
    vec3 m_point;        // minimum point
    
    for (int j=-1; j<=1; j++ ) {
        for (int i=-1; i<=1; i++ ) {
        	for (int k=-1; k<=1; k++ ) {
            vec3 neighbor = vec3(float(i),float(j),float(k));
            vec3 point = random2(i_st + neighbor);
            point = 0.5 + 0.5*sin(6.2831*point);
            vec3 diff = neighbor + point - f_st;
            float dist = length(diff);

            if( dist < m_dist ) {
                m_dist = dist;
                m_point = point;
            }
	}
        }
    }

    vec3 color = vec3(0);
    // Assign a color using the closest point position
    color += dot(m_point,vec3(.3,.6,.9));
    
    // Add distance field to closest point center 
    color -= m_dist,8;

    // Show isolines
    //color -= abs(sin(40.0*m_dist))*0.07;
    
    // Draw cell center
    //color += 1.-step(.01, m_dist);
    
    // Draw grid
    //color.r += step(.98, f_st.x) + step(.98, f_st.y) + step(.98, f_st.z);

  //vec3 rock = vec3(0.5) * color +  1.2 * wierds(vNormal.xz); 
  vec3 rock = vec3(0.2) * color ; 
 
  color = vec3(snoise3(vNormal * 0.5)); 
  
  //vec3 grass = vec3(.3,.7,.3) * abs(color) * -wierds(vNormal.xy);
  //vec3 grass = vec3(.3,.7,.3) * abs(color) * snoise3(vWorldPos * 0.12);
  vec3 grass = vec3(.3,.9,.3) * 0.5;

  grass+= vec3(rock * vec3(0.,1.,0.));
  color = mix(grass,rock,smoothstep(0.,0.4,vWorldPos.y));  
float fogDistance = gl_FragCoord.z / gl_FragCoord.w;
  float fogAmount = fog_exp2(fogDistance, FOG_DENSITY);
  vec4 fogColor = vec4(1.,0.86,0.86,1.); // white 

    gl_FragColor = vec4(mix(vec4(color, 1.0),fogColor,fogAmount));
}
