export const RenderWithVtShader = {
  uniforms: {
    "vt"            : { value: {} },
    "bDebugLevel"   : { value: false },
    "bDebugLastHits": { value: false },
    "iTextureMode"  : { value: 0 }
  },
  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
      "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
      "vUv = vec2(uv.x, 1. - uv.y);",
      "gl_Position = projectionMatrix * mvPosition;",
    "}"

  ].join("\n"),
  fragmentShader: [
    "#include <vt/pars_fragment>",
    "varying vec2 vUv;",
    "uniform bool bDebugLevel;",
    "uniform bool bDebugLastHits;",
    "uniform int iTextureMode;",
    "uniform VirtualTexture vt;",
    "void main() ",
    "{",
      "vec2 uv = vUv;",
      "vec4 page = vec4(0.);",
      "switch (iTextureMode) {",
      "  case 0 : gl_FragColor = textureGrad(vt, uv, dFdx(uv), dFdy(uv), page); break;",
      "  case 1 : gl_FragColor = textureLod(vt, uv, vt_lod(vt, dFdx(uv), dFdy(uv)), page); break;",
      "  case 2 : gl_FragColor = texture(vt, uv, page); break;",
      "}",
      "if (bDebugLevel) gl_FragColor.b = page.z / vt.maxMipMapLevel;",
      "if (bDebugLastHits) gl_FragColor.g = 1. - (page.w / 255.);",
    "}"

  ].join("\n"),
}
