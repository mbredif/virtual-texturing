export const VisibleTileShader =  {
  uniforms:  {
    "vt" : { value: {} },
    "iTextureMode" : { value: 0 },
  },
  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
    " vec4 mvPosition = (modelViewMatrix * vec4( position, 1.0 ));",
    " vUv = vec2(uv.x, 1. - uv.y);",
    " gl_Position = projectionMatrix * mvPosition;",
    "}"
  ].join("\n"),
  fragmentShader: [
    "#include <vt/pars_fragment>",
    "uniform VirtualTextureTiles vt;",
    "uniform int iTextureMode;",
    "varying vec2 vUv;",
    "void main() {",
      "vec2 uv = vUv;",
      "vec4 page = vec4(0.);",
      "switch (iTextureMode) {",
      "  case 0 : gl_FragColor = vec4(floor(vt_textureTileGrad(vt, uv, dFdx(uv), dFdy(uv))), vt.id)/255.; break;",
      "  case 1 : gl_FragColor = vec4(floor(vt_textureTileLod(vt, uv, vt_lod(vt, dFdx(uv), dFdy(uv)))), vt.id)/255.; break;",
      "  case 2 : gl_FragColor = vec4(floor(vt_textureTile(vt, uv)), vt.id)/255.; break;",
      "  default : discard; break; // nothing visible, no update ",
      "}",
    "}"
  ].join("\n")
};
