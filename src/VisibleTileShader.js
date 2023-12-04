import { UniformsLib, ShaderChunk } from '../examples/jsm/three.module.js';

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

  "struct VirtualTexture {",
  " vec2 tileSize;",
  " float minMipMapLevel;",
  " float maxMipMapLevel;",
  " float maxAniso;",
  " float id;",
  "};",
  "uniform VirtualTexture vt;",
  "uniform int iTextureMode;",

  "varying vec2 vUv;",

  "vec3 vt_textureTileGrad(in VirtualTexture vt, in vec2 uv)",
  "{",
    "vec2 coordPixels = uv * vt.tileSize;",
    "vec2 dx = dFdx(coordPixels);",
    "vec2 dy = dFdy(coordPixels);",
    "float dx2 = dot(dx, dx);",
    "float dy2 = dot(dy, dy);",
    "float mipLevel = vt.maxMipMapLevel + 0.5 * log2( max( min(dx2, dy2), max(dx2, dy2)/vt.maxAniso ));",
    "float z = clamp(floor(mipLevel), vt.minMipMapLevel, vt.maxMipMapLevel);",
    "float size = floor(exp2(vt.maxMipMapLevel - z));",
    "vec2 xy = clamp(floor( uv * size ), 0., size-1.);",
    "return vec3(xy, z);",
  "}",

  "vec3 vt_textureTileLod(in VirtualTexture vt, in vec2 uv)",
  "{",
    "vec2 coordPixels = uv * vt.tileSize;",
    "vec2 dx = dFdx(coordPixels);",
    "vec2 dy = dFdy(coordPixels);",
    "float dx2 = dot(dx, dx);",
    "float dy2 = dot(dy, dy);",
    "float mipLevel = vt.maxMipMapLevel + 0.5 * log2(max(dx2, dy2));",
    "float z = clamp(floor(mipLevel), vt.minMipMapLevel, vt.maxMipMapLevel);",
    "float size = floor(exp2(vt.maxMipMapLevel - z));",
    "vec2 xy = clamp(floor( uv * size ), 0., size-1.);",
    "return vec3(xy, z);",
  "}"

].join("\n");

const fragment = [
  "switch (iTextureMode) {",
  "  case 0 : gl_FragColor = vec4(vt_textureTileGrad(vt, vUv), vt.id)/255.; break;",
  "  case 1 : gl_FragColor = vec4(vt_textureTileLod(vt, vUv), vt.id)/255.; break;",
  "}",
].join("\n");


UniformsLib[ "vt/visible_tiles" ] = uniforms;
ShaderChunk[ "vt/visible_tiles/pars_vertex" ] = pars_vertex;
ShaderChunk[ "vt/visible_tiles/pars_fragment" ] = pars_fragment;
ShaderChunk[ "vt/visible_tiles/fragment" ] = fragment;
ShaderChunk[ "vt/visible_tiles/vertex" ] = vertex;

export const VisibleTileShader =  {
  uniforms: uniforms,
  fragmentShader: [ pars_fragment, "void main() {", fragment, "}" ].join("\n"),
  vertexShader: [ pars_vertex, "void main() {", vertex, "}" ].join("\n")
};
