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
      "switch (iTextureMode) {",
      "  case 0 : gl_FragColor = textureGrad(vt, uv, dFdx(uv), dFdy(uv)); break;",
      "  case 1 : gl_FragColor = textureLod (vt, uv, vt_lod(vt, dFdx(uv), dFdy(uv))); break;",
      "  case 2 : gl_FragColor = texture    (vt, uv); break;",
      "}",
      "if (bDebugLevel) switch (iTextureMode) {",
      "  case 0 : gl_FragColor.rgb = fract(vt_textureTileGrad(vt, uv, dFdx(uv), dFdy(uv))); break;",
      "  case 1 : gl_FragColor.rgb = fract(vt_textureTileLod (vt, uv, vt_lod(vt, dFdx(uv), dFdy(uv)))); break;",
      "  case 2 : gl_FragColor.rgb = fract(vt_textureTile    (vt, uv)); break;",
      "}",
      "vec2 gx = dFdx(uv);",
      "vec2 gy = dFdy(uv);",
      "float lod = vt_lod(vt, gx, gy);",
      "if (bDebugLastHits) switch (iTextureMode) {",
      "  case 0 : gl_FragColor.rg  = vt_textureCoordsGrad(vt, uv, gx, gy); break;",
      "  case 1 : gl_FragColor.rg  = vt_textureCoordsLod (vt, uv, lod); break;",
      "  case 2 : gl_FragColor.rg  = vt_textureCoords    (vt, uv); break;",
      "}",
    "}"

  ].join("\n"),
}
