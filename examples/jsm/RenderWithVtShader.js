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
      "vec2 gx = dFdx(uv);",
      "vec2 gy = dFdy(uv);",
      "vec2 vt_size = exp2(vt.maxMipMapLevel) * vt.tileSize;",
      "vec4 page = vec4(0.);",
      "switch (iTextureMode) {",
      "  case 0 : gl_FragColor = textureGrad(vt, uv, gx, gy, page); break;",
      "  case 1 : gl_FragColor = textureLod(vt, uv, vt_lod(gx, gy, vt_size), page); break;",
      "  case 2 : gl_FragColor = texture(vt, uv, page); break;",
      "  case 3 : gl_FragColor = texture(vt.texture, uv); break;",
      "  case 4 : gl_FragColor = vec4(texture(vt.cacheIndirection, uv).xyz,255)/255.; break;",
      "}",
      "if (bDebugLevel) gl_FragColor.r = page.z / vt.maxMipMapLevel;",
      "if (bDebugLastHits) gl_FragColor.g = 1. - (page.w / 255.);",
    "}"

  ].join("\n"),
}
