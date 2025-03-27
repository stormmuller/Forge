#version 300 es
precision mediump float;

uniform vec2 u_resolution; // Screen resolution
uniform vec3 u_colorInner; // Center color
uniform vec3 u_colorOuter; // Outer color

void main() {
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = gl_FragCoord.xy / u_resolution;

    // Center of the screen
    vec2 center = vec2(0.5, 0.5);

    // Distance from current pixel to center
    float dist = distance(uv, center);

    // Interpolation factor (0.0 at center, 1.0 at edges)
    float t = clamp(dist / 0.5, 0.0, 1.0);

    // Interpolate between inner and outer color
    vec3 color = mix(u_colorInner, u_colorOuter, t);

    gl_FragColor = vec4(color, 1.0);
}
