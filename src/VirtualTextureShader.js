import { ShaderChunk } from '../examples/jsm/three.module.js';

ShaderChunk[ "vt/pars_fragment" ] = [
  "precision highp usampler2D;",

  "struct VirtualTexture {",
  " sampler2D texture;",
  " usampler2D cacheIndirection;",
  " vec2 padding;",
  " vec2 tileSize;",
  " vec2 numPages;",
  " vec2 scaling;",
  " float minMipMapLevel;",
  " float maxMipMapLevel;",
  " float anisotropy;",
  "};",

  "struct VirtualTextureTiles {",
  " vec2 tileSize;",
  " float minMipMapLevel;",
  " float maxMipMapLevel;",
  " float anisotropy;",
  " vec2 scaling;",
  " float id;",
  "};",

  "highp ivec2 textureSize(in VirtualTexture vt, in int lod) { return textureSize(vt.cacheIndirection, lod) * ivec2(vt.tileSize); }",

  "float vt_lod(in vec2 gx, in vec2 gy) { ",
    "return 0.5 * log2( max(dot( gx, gx ), dot( gy, gy ) ) );",
  " }",

  "float vt_lodGrad(in vec2 gx, in vec2 gy, in float anisotropy)",
  "{",
    "float dx2 = dot(gx,gx);",
    "float dy2 = dot(gy,gy);",
    "return 0.5 * log2( max( min(dx2, dy2), max(dx2, dy2)/anisotropy ));",
  "}",

  "float vt_lod(in vec2 gx, in vec2 gy, in vec2 size) { return vt_lod(gx * size, gy * size); }",
  "float vt_lod(in VirtualTextureTiles t, in vec2 gx, in vec2 gy) { return vt_lod(gx, gy, t.tileSize*t.scaling) + t.maxMipMapLevel; }",
  "float vt_lod(in VirtualTexture      t, in vec2 gx, in vec2 gy) { return vt_lod(gx, gy, t.tileSize*t.scaling) + t.maxMipMapLevel; }",
  "float vt_lod(in sampler2D           t, in vec2 gx, in vec2 gy) { return vt_lod(gx, gy, vec2(textureSize(t,0))); }",
  "float vt_lod(in VirtualTextureTiles t, in vec2 uv) { uv *= t.tileSize*t.scaling; return vt_lod(dFdx(uv), dFdy(uv)) + t.maxMipMapLevel; }",
  "float vt_lod(in VirtualTexture      t, in vec2 uv) { uv *= t.tileSize*t.scaling; return vt_lod(dFdx(uv), dFdy(uv)) + t.maxMipMapLevel; }",
  "float vt_lod(in sampler2D           t, in vec2 uv) { uv *= vec2(textureSize(t,0)); return vt_lod(dFdx(uv), dFdy(uv)); }",

  "float vt_lodGrad(in vec2 gx, in vec2 gy, in float anisotropy, in vec2 size) { return vt_lodGrad(gx * size, gy * size, anisotropy); }",
  "float vt_lodGrad(in VirtualTextureTiles vt, in vec2 gx, in vec2 gy) { return vt_lodGrad(gx, gy, vt.anisotropy, vt.tileSize*vt.scaling) + vt.maxMipMapLevel; }",
  "float vt_lodGrad(in VirtualTexture      vt, in vec2 gx, in vec2 gy) { return vt_lodGrad(gx, gy, vt.anisotropy, vt.tileSize*vt.scaling) + vt.maxMipMapLevel; }",

  "vec3 vt_textureTileLod(in float minMipMapLevel, in float maxMipMapLevel, in vec2 uv, in float lod)",
  "{",
    "lod = clamp(lod, 0., maxMipMapLevel-minMipMapLevel);",
    "return vec3(uv * exp2(maxMipMapLevel - floor(lod)), lod);",
  "}",

  "vec3 vt_textureTileLod(in VirtualTexture       vt, in vec2 uv, in float lod) { return vt_textureTileLod(vt.minMipMapLevel, vt.maxMipMapLevel, uv*vt.scaling, lod); }",
  "vec3 vt_textureTileLod(in VirtualTextureTiles  vt, in vec2 uv, in float lod) { return vt_textureTileLod(vt.minMipMapLevel, vt.maxMipMapLevel, uv*vt.scaling, lod); }",
  "vec3 vt_textureTile(in VirtualTexture          vt, in vec2 uv) { return vt_textureTileLod(vt, uv, vt_lod(vt, uv)); }",
  "vec3 vt_textureTile(in VirtualTextureTiles     vt, in vec2 uv) { return vt_textureTileLod(vt, uv, vt_lod(vt, uv)); }",
  "vec3 vt_textureTileGrad(in VirtualTextureTiles vt, in vec2 uv, in vec2 gx, in vec2 gy) { return vt_textureTileLod(vt, uv, vt_lodGrad(vt, gx, gy)); }",
  "vec3 vt_textureTileGrad(in VirtualTexture      vt, in vec2 uv, in vec2 gx, in vec2 gy) { return vt_textureTileLod(vt, uv, vt_lodGrad(vt, gx, gy)); }",

  // Fragment shader only
  "vec2 vt_textureCoords(in VirtualTexture vt, in vec2 uv) {",
    // indirection table lookup
    "uv *= vt.scaling;",
    "float bias = log2(min(vt.tileSize.x, vt.tileSize.y)) - 0.5;",
    "vec4 page = vec4(texture( vt.cacheIndirection, uv, bias ));", // to do : set up min and max lod to 0,1
    "float l = exp2(page.z);",
    "vec2 inPageUv = fract(uv * l);",
    "vec2 paddingScale = 1.-2.*vt.padding;",
    "inPageUv = vt.padding + inPageUv * paddingScale;",

    // cache texture uv
    "return (page.xy + inPageUv) / vt.numPages;",
  "}",

  "vec2 vt_textureCoordsLod(in VirtualTexture vt, in vec2 uv, inout float lod) {",
    // indirection table lookup
    "vec3 coords = vt_textureTileLod(vt, uv, lod);",
    "vec4 page = vec4(texelFetch( vt.cacheIndirection, ivec2(floor(coords.xy)), int(floor(coords.z))));",
    "float l = exp2(page.z);",
    "uv *= vt.scaling;",
    "vec2 inPageUv = fract(uv * l);",
    "vec2 paddingScale = 1.-2.*vt.padding;",
    "inPageUv = vt.padding + inPageUv * paddingScale;",

    // compute lod and move inPageUv so that footprint stays in tile
    "lod = clamp(coords.z-vt.maxMipMapLevel+page.z,0.,1.);",

    "vec4 clamping;",
    "clamping.xy = min(vec2(0.5), exp2(lod)/vt.tileSize);",
    "clamping.zw = 1.-clamping.xy;",
    "inPageUv = clamp(inPageUv, clamping.xy, clamping.zw);",

    // cache texture uv
    "return (page.xy + inPageUv) / vt.numPages;",
  "}",


  "vec2 vt_textureCoordsGrad(in VirtualTexture vt, in vec2 uv, inout vec2 gx, inout vec2 gy) {",
    // indirection table lookup
    "vec3 coords = vt_textureTileGrad(vt, uv, gx, gy);",
    "vec4 page = vec4(texelFetch( vt.cacheIndirection, ivec2(floor(coords.xy)), int(floor(coords.z))));",
    "float l = exp2(page.z);",
    "uv *= vt.scaling;",
    "gx *= vt.scaling;",
    "gy *= vt.scaling;",
    "vec2 inPageUv = fract(uv * l);",
    "vec2 paddingScale = 1.-2.*vt.padding;",
    "inPageUv = vt.padding + inPageUv * paddingScale;",

    // compute lod
    "float lod = clamp(coords.z-vt.maxMipMapLevel+page.z,0.,1.);",

    // clamp inPageUv
    "vec4 clamping;",
    "clamping.xy = min(vec2(0.5), exp2(lod)/vt.tileSize);",
    "clamping.zw = 1.-clamping.xy;",
    "inPageUv = clamp(inPageUv, clamping.xy, clamping.zw);",

    // compute gradients
    "gx *= l/vt.numPages;",
    "gy *= l/vt.numPages;",

    // clamp gradients
    "vec4 gminmax = clamping - inPageUv.xyxy;",
    "gminmax.xy = max(gminmax.xy, -gminmax.zw);",
    "gminmax.zw = -gminmax.xy;",
    "gx = clamp(gx, gminmax.xy, gminmax.zw);",
    "gy = clamp(gy, gminmax.xy, gminmax.zw);",

    // cache texture uv
    "return (page.xy + inPageUv) / vt.numPages;",
  "}",

  "vec4 texture(in VirtualTexture vt, in vec2 uv) {",
      "uv = vt_textureCoords(vt, uv);",
      "return texture(vt.texture, uv);",
  "}",

  "vec4 textureLod(in VirtualTexture vt, in vec2 uv, in float lod) {",
      "uv = vt_textureCoordsLod(vt, uv, lod);",
      "return textureLod(vt.texture, uv, lod);",
  "}",

  "vec4 textureGrad(in VirtualTexture vt, in vec2 uv, in vec2 gx, in vec2 gy) {",
      "vec2 _gx = gx;",
      "vec2 _gy = gy;",
      "uv = vt_textureCoordsGrad(vt, uv, _gx, _gy);",
      "return textureGrad(vt.texture, uv, _gx, _gy);",
  "}",

].join("\n");
