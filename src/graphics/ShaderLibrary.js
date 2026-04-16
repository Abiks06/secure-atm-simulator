/**
 * ShaderLibrary.js
 * Custom GLSL Shaders for Phong and Gouraud lighting.
 */

// ============================================================================
// PHONG SHADING (Per-Fragment) - Applied to ATM Chassis
// ============================================================================

export const phongVertexShader = `
  // Phong Vertex Shader
  // Passes interpolated normals and positions to fragment shader
  // The actual lighting calculation happens per-fragment for smooth results
  
  varying vec3 vNormal;       // Interpolated normal for fragment shader
  varying vec3 vPosition;     // World-space position for fragment shader
  varying vec2 vUv;           // Texture coordinates
  
  void main() {
    // Transform normal to world space
    // Normal matrix = transpose(inverse(modelViewMatrix))
    // Three.js provides normalMatrix which is already this computation
    vNormal = normalize(normalMatrix * normal);
    
    // World-space position for lighting calculations
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    
    // Pass through UVs
    vUv = uv;
    
    // Standard vertex transformation: MVP × position
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const phongFragmentShader = `
  // Phong Fragment Shader
  // Computes lighting per-fragment using interpolated normals
  // This gives smooth specular highlights compared to Gouraud
  
  uniform vec3 uLightPosition;    // Light position in view space
  uniform vec3 uLightColor;       // Light RGB color
  uniform vec3 uAmbientColor;     // Ambient light color
  uniform vec3 uDiffuseColor;     // Material diffuse color
  uniform vec3 uSpecularColor;    // Material specular color
  uniform float uShininess;       // Specular exponent (higher = tighter highlight)
  uniform float uOpacity;         // Material opacity
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  
  void main() {
    // Normalize interpolated normal (interpolation can un-normalize)
    vec3 N = normalize(vNormal);
    
    // Light direction: from surface point to light
    vec3 L = normalize(uLightPosition - vPosition);
    
    // View direction: from surface point to camera (camera at origin in view space)
    vec3 V = normalize(-vPosition);
    
    // Reflection vector: R = 2(N·L)N - L
    vec3 R = reflect(-L, N);
    
    // === AMBIENT COMPONENT ===
    // I_ambient = I_a × k_a
    vec3 ambient = uAmbientColor * uDiffuseColor;
    
    // === DIFFUSE COMPONENT (Lambert's Cosine Law) ===
    // I_diffuse = I_d × k_d × max(0, N·L)
    float NdotL = max(dot(N, L), 0.0);
    vec3 diffuse = uLightColor * uDiffuseColor * NdotL;
    
    // === SPECULAR COMPONENT (Phong Reflection) ===
    // I_specular = I_s × k_s × max(0, R·V)^n
    float RdotV = max(dot(R, V), 0.0);
    vec3 specular = uLightColor * uSpecularColor * pow(RdotV, uShininess);
    
    // Only add specular if surface faces the light
    if (NdotL <= 0.0) {
      specular = vec3(0.0);
    }
    
    // === FINAL COLOR ===
    // I_total = I_ambient + I_diffuse + I_specular
    vec3 finalColor = ambient + diffuse + specular;
    
    gl_FragColor = vec4(finalColor, uOpacity);
  }
`;


// ============================================================================
// GOURAUD SHADING (Per-Vertex) - Applied to ATM Buttons
// ============================================================================

export const gouraudVertexShader = `
  // Gouraud Vertex Shader
  // Computes lighting per-vertex; color is then interpolated across the face
  // This is computationally cheaper but produces less accurate specular highlights
  
  uniform vec3 uLightPosition;
  uniform vec3 uLightColor;
  uniform vec3 uAmbientColor;
  uniform vec3 uDiffuseColor;
  uniform vec3 uSpecularColor;
  uniform float uShininess;
  
  varying vec3 vColor;  // Computed color passed to fragment shader
  varying vec2 vUv;
  
  void main() {
    // Transform to view space
    vec3 mvPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vec3 N = normalize(normalMatrix * normal);
    
    // Light direction
    vec3 L = normalize(uLightPosition - mvPosition);
    
    // View direction
    vec3 V = normalize(-mvPosition);
    
    // Reflection vector
    vec3 R = reflect(-L, N);
    
    // === Per-vertex Phong lighting calculation ===
    
    // Ambient
    vec3 ambient = uAmbientColor * uDiffuseColor;
    
    // Diffuse (Lambert)
    float NdotL = max(dot(N, L), 0.0);
    vec3 diffuse = uLightColor * uDiffuseColor * NdotL;
    
    // Specular (Phong)
    float RdotV = max(dot(R, V), 0.0);
    vec3 specular = vec3(0.0);
    if (NdotL > 0.0) {
      specular = uLightColor * uSpecularColor * pow(RdotV, uShininess);
    }
    
    // The key difference from Phong: color is computed HERE at the vertex
    // and will be linearly interpolated across the triangle by the rasterizer
    vColor = ambient + diffuse + specular;
    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const gouraudFragmentShader = `
  // Gouraud Fragment Shader
  // Simply outputs the interpolated vertex color
  // No per-fragment lighting computation (that's the whole point of Gouraud)
  
  uniform float uOpacity;
  varying vec3 vColor;
  varying vec2 vUv;
  
  void main() {
    // Direct output of interpolated color from vertex shader
    gl_FragColor = vec4(vColor, uOpacity);
  }
`;


// ============================================================================
// SHADER MATERIAL CONFIGURATIONS
// ============================================================================

/**
 * Default uniform values for the Phong shader (ATM chassis)
 * Dark metallic appearance with sharp specular highlights
 */
export const phongChassisUniforms = {
  uLightPosition: { value: [5.0, 8.0, 5.0] },
  uLightColor: { value: [1.0, 0.98, 0.95] },
  uAmbientColor: { value: [0.15, 0.15, 0.18] },
  uDiffuseColor: { value: [0.25, 0.28, 0.32] },
  uSpecularColor: { value: [0.8, 0.8, 0.85] },
  uShininess: { value: 64.0 },
  uOpacity: { value: 1.0 },
};

/**
 * Default uniform values for the Gouraud shader (ATM buttons)
 * Rubber/plastic appearance with subtle highlights
 */
export const gouraudButtonUniforms = {
  uLightPosition: { value: [5.0, 8.0, 5.0] },
  uLightColor: { value: [1.0, 0.98, 0.95] },
  uAmbientColor: { value: [0.12, 0.12, 0.15] },
  uDiffuseColor: { value: [0.35, 0.38, 0.42] },
  uSpecularColor: { value: [0.3, 0.3, 0.35] },
  uShininess: { value: 16.0 },
  uOpacity: { value: 1.0 },
};

/**
 * Create Three.js ShaderMaterial uniforms with proper Three.js Vector3 types
 * This bridges our manual uniform definitions with Three.js's uniform system
 */
export function createThreeUniforms(uniformConfig, THREE) {
  const uniforms = {};
  for (const [key, val] of Object.entries(uniformConfig)) {
    if (Array.isArray(val.value) && val.value.length === 3) {
      uniforms[key] = { value: new THREE.Vector3(...val.value) };
    } else {
      uniforms[key] = { value: val.value };
    }
  }
  return uniforms;
}
