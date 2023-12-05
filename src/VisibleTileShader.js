import { UniformsLib } from '../examples/jsm/three.module.js';

const uniforms = {
  "vt" : { value: {} },
  "iTextureMode" : { value: 0 },
};

const pars_vertex = [
  "varying vec2 vUv;",
].join("\n");

const vertex = [
  "vec4 mvPosition = (modelViewMatrix * vec4( position, 1.0 ));",
  "vUv = vec2(uv.x, 1. - uv.y);",
  "gl_Position = projectionMatrix * mvPosition;"
].join("\n");

const pars_fragment = [
  "#include <vt/pars_fragment>",
  "uniform VirtualTextureTiles vt;",
  "uniform int iTextureMode;",
  "varying vec2 vUv;",
].join("\n");

const fragment = [
  "switch (iTextureMode) {",
  "  case 0 : gl_FragColor = vec4(vt_textureTileGrad(vt, vUv), vt.id)/255.; break;",
  "  case 1 : gl_FragColor = vec4(vt_textureTileLod(vt, vUv), vt.id)/255.; break;",
  "  case 2 : gl_FragColor = vec4(vt_textureTile(vt, vUv), vt.id)/255.; break;",
  "  default : discard; break; // nothing visible, no update ",
  "}",
].join("\n");

UniformsLib[ "vt/visible_tiles" ] = uniforms;

export const VisibleTileShader =  {
  uniforms: uniforms,
  fragmentShader: [ pars_fragment, "void main() {", fragment, "}" ].join("\n"),
  vertexShader: [ pars_vertex, "void main() {", vertex, "}" ].join("\n")
};
