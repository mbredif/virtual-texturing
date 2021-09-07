import { UniformsLib, ShaderChunk } from '../examples/jsm/three.module.js';

const uniforms = {
  "vt":  { value: {} },
  "vt_id": { value: 255.0 }
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
  " float minMipMapLevel;",
  " float maxMipMapLevel;",
  " vec2 size;",
  "};",
  "#include <vt/miplevel>",
  "uniform VirtualTexture vt;",
  "uniform float vt_id;",
  "varying vec2 vUv;",
].join("\n");

const fragment = [
  "float mipLevel  = floor( MipLevel( vUv, vt.size ));",
  "mipLevel = clamp(mipLevel, vt.minMipMapLevel, vt.maxMipMapLevel);",
  "float size = floor(exp2(vt.maxMipMapLevel-mipLevel));",
  "vec2 id = floor( vUv.xy * size );",
  "id = clamp(id, 0., size-1.);",
  "gl_FragColor = vec4(id, mipLevel, vt_id)/255.0;"
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
