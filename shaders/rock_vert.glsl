#ifdef GL_ES
precision mediump float;
#endif
varying vec2 vUv;
varying vec3 vNorm;
varying vec3 vNormal;
varying vec3 vViewPos;

void main() {
  vUv = uv;
  vNorm = position.xyz;
  vec4 pos = vec4(position, 1.0);
  pos.y = max(pos.y,0.);
  vec4 mpos = modelViewMatrix * pos;
  vViewPos = -mpos.xyz;
  vNormal = normalize(normalMatrix * normal);

  gl_Position = projectionMatrix *
              mpos;


}
