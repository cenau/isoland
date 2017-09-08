#ifdef GL_ES
precision mediump float;
#endif
varying vec2 vUv;
varying vec3 vNorm;
varying vec3 vNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;
varying vec3 deform;
uniform float scale;
vec3 random2( vec3 p ) {
    return fract(sin(vec3(dot(p,vec3(127.1,311.7,111.3)),dot(p,vec3(269.5,183.3,105.1)),dot(p,vec3(98.2,231.3,173.7))))*43758.5453);
}

void main() {
  vUv = uv;
  vNorm = position.xyz;
  vWorldPos = vec4(modelMatrix * vec4(position,1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);

    vec3 st = vNorm; 
    st *= scale;
    
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
    color.r += step(.98, f_st.x) + step(.98, f_st.y) + step(.98, f_st.z);
  
  vec4 pos = vec4(position, 1.0);
  pos.xyz = pos.xyz + pos.xyz * color;
  deform = color;
  vec4 mpos = modelViewMatrix * pos;
  gl_Position = projectionMatrix *
              mpos;


}
