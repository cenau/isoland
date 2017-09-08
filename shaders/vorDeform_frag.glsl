varying vec2 vUv;
varying vec3 vNorm;
varying vec3 vNormal;
uniform float logDepthBufFC;
varying float vFragDepth;
varying vec3 deform;

void main() {
    vec3 color = normalize(deform);

    gl_FragColor = vec4(color,1.);
}
