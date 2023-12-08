import { ShaderChunk } from '../examples/jsm/three.module.js';

ShaderChunk[ "vt/pars_fragment" ] = [
  "precision highp usampler2D;",

  "struct VirtualTexture {",
  " sampler2D texture;",
  " usampler2D cacheIndirection;",
  " vec2 padding;",
  " vec2 tileSize;",
  " vec2 numPages;",
  " float minMipMapLevel;",
  " float maxMipMapLevel;",
  " float anisotropy;",
  "};",

  "struct VirtualTextureTiles {",
  " vec2 tileSize;",
  " float minMipMapLevel;",
  " float maxMipMapLevel;",
  " float anisotropy;",
  " float id;",
  "};",

  "highp ivec2 textureSize(in VirtualTexture vt, in int lod) {",
    "return textureSize(vt.cacheIndirection, lod) * ivec2(vt.tileSize);",
  "}",

  "vec4 vt_textureCoords(in VirtualTexture vt, inout vec2 uv) {",
    // indirection table lookup
    "float bias = log2(min(vt.tileSize.x, vt.tileSize.y)) - 0.5;",
    "vec4 page = vec4(texture( vt.cacheIndirection, uv, bias ));",
    "float l = exp2(page.z);",
    "vec2 inPageUv = fract(uv * l);",
    "vec2 paddingScale = 1.-2.*vt.padding;",
    "inPageUv = vt.padding + inPageUv * paddingScale;",

    // cache texture uv
    "uv = (page.xy + inPageUv) / vt.numPages;",
    "return page;",
  "}",

  "vec4 vt_textureCoordsLod(in VirtualTexture vt, inout vec2 uv, inout float lod) {",
  // indirection table lookup
    "vec4 page = vec4(textureLod( vt.cacheIndirection, uv, lod - 0.5 ));",
    "float l = exp2(page.z);",
    "vec2 inPageUv = fract(uv * l);",
    "vec2 paddingScale = 1.-2.*vt.padding;",
    "inPageUv = vt.padding + inPageUv * paddingScale;",

    // compute lod and move inPageUv so that footprint stays in tile
    "lod = clamp(lod - (vt.maxMipMapLevel - page.z), vt.minMipMapLevel, vt.maxMipMapLevel);",
    "vec4 clamping;",
    "clamping.xy = min(vec2(0.5), exp2(lod)/vt.tileSize);",
    "clamping.zw = 1.-clamping.xy;",
    "inPageUv = clamp(inPageUv, clamping.xy, clamping.zw);",

    // cache texture uv
    "uv = (page.xy + inPageUv) / vt.numPages;",
    "return page;",
  "}",

  "vec4 vt_textureCoordsGrad(in VirtualTexture vt, inout vec2 uv, inout vec2 gx, inout vec2 gy) {",

    "vec2 dx = gx * vt.tileSize;",
    "vec2 dy = gy * vt.tileSize;",
    "float dx2 = dot(dx, dx);",
    "float dy2 = dot(dy, dy);",
    "float minLod = vt.maxMipMapLevel + 0.5 * log2( max( min(dx2, dy2), max(dx2, dy2)/vt.anisotropy ));",

  // indirection table lookup
    "vec4 page = vec4(textureLod( vt.cacheIndirection, uv, minLod - 0.5));",
    "float l = exp2(page.z);",
    "vec2 inPageUv = fract(uv * l);",
    "vec2 paddingScale = 1.-2.*vt.padding;",
    "inPageUv = vt.padding + inPageUv * paddingScale;",

    // compute lod
    "vec2 scale = l * paddingScale;",
    "gx *= scale;",
    "gy *= scale;",
    "float d = max(dot( gx, gx ), dot( gy, gy ) );",
    "float lod = clamp(0.5 * log2( d ) - vt.maxMipMapLevel, vt.minMipMapLevel, vt.maxMipMapLevel);",

    // clamp inPageUv
    "vec4 clamping;",
    "clamping.xy = min(vec2(0.5), exp2(lod)/vt.tileSize);",
    "clamping.zw = 1.-clamping.xy;",
    "inPageUv = clamp(inPageUv, clamping.xy, clamping.zw);",

    // compute gradients
    "gx /= vt.numPages;",
    "gy /= vt.numPages;",

    // clamp gradients
    "vec4 gminmax = clamping - inPageUv.xyxy;",
    "gminmax.xy = max(gminmax.xy, -gminmax.zw);",
    "gminmax.zw = -gminmax.xy;",
    "gx = clamp(gx, gminmax.xy, gminmax.zw);",
    "gy = clamp(gy, gminmax.xy, gminmax.zw);",

    // cache texture uv
    "uv = (page.xy + inPageUv) / vt.numPages;",
    "return page;",
  "}",

  "vec4 texture(in VirtualTexture vt, in vec2 uv, out vec4 page) {",
      "page = vt_textureCoords(vt, uv);",
      "return texture(vt.texture, uv);",
  "}",

  "vec4 textureLod(in VirtualTexture vt, in vec2 uv, in float lod, out vec4 page) {",
      "float _lod = lod;",
      "page = vt_textureCoordsLod(vt, uv, _lod);",
      "return textureLod(vt.texture, uv, _lod);",
  "}",

  "vec4 textureGrad(in VirtualTexture vt, in vec2 uv, in vec2 gx, in vec2 gy, out vec4 page) {",
      "vec2 _gx = gx;",
      "vec2 _gy = gy;",
      "page = vt_textureCoordsGrad(vt, uv, _gx, _gy);",
      "return textureGrad(vt.texture, uv, _gx, _gy);",
  "}",

  "vec4 texture(in VirtualTexture vt, in vec2 uv) { vec4 page; return texture(vt, uv, page); }",
  "vec4 textureLod(in VirtualTexture vt, in vec2 uv, in float lod) { vec4 page; return textureLod(vt, uv, lod, page); }",
  "vec4 textureGrad(in VirtualTexture vt, in vec2 uv, in vec2 gx, in vec2 gy) { vec4 page; return textureGrad(vt, uv, gx, gy, page); }",

  "vec3 vt_textureTile(in VirtualTextureTiles vt, in vec2 uv)",
  "{",
    "float bias = log2(min(vt.tileSize.x, vt.tileSize.y)) - 0.5;",
    "float z = clamp(floor(bias), vt.minMipMapLevel, vt.maxMipMapLevel);",
    "float size = floor(exp2(vt.maxMipMapLevel - z));",
    "vec2 xy = clamp(floor( uv * size ), 0., size-1.);",
    "return vec3(xy, z);",
  "}",

  "vec3 vt_textureTileGrad(in VirtualTextureTiles vt, in vec2 uv)",
  "{",
    "vec2 coordPixels = uv * vt.tileSize;",
    "vec2 dx = dFdx(coordPixels);",
    "vec2 dy = dFdy(coordPixels);",
    "float dx2 = dot(dx, dx);",
    "float dy2 = dot(dy, dy);",
    "float mipLevel = vt.maxMipMapLevel + 0.5 * log2( max( min(dx2, dy2), max(dx2, dy2)/vt.anisotropy ));",
    "float z = clamp(floor(mipLevel), vt.minMipMapLevel, vt.maxMipMapLevel);",
    "float size = floor(exp2(vt.maxMipMapLevel - z));",
    "vec2 xy = clamp(floor( uv * size ), 0., size-1.);",
    "return vec3(xy, z);",
  "}",

  "vec3 vt_textureTileLod(in VirtualTextureTiles vt, in vec2 uv)",
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
  "}",

  "float vt_lod(in vec2 gx, in vec2 gy) { return 0.5 * log2( max(dot( gx, gx ), dot( gy, gy ) ) ); }",
  "float vt_lod(in vec2 gx, in vec2 gy, in vec2 size, in float level) { return vt_lod(gx*size,gy*size) + level; }",

  "float vt_lod(in VirtualTextureTiles t, in vec2 gx, in vec2 gy) { return vt_lod(gx, gy, t.tileSize, t.maxMipMapLevel); }",
  "float vt_lod(in VirtualTexture      t, in vec2 gx, in vec2 gy) { return vt_lod(gx, gy, t.tileSize, t.maxMipMapLevel); }",
  "float vt_lod(in sampler2D           t, in vec2 gx, in vec2 gy) { return vt_lod(gx, gy); }",
  "float vt_lod(in VirtualTextureTiles t, in vec2 uv) { return vt_lod(t, dFdx(uv), dFdy(uv)); }",
  "float vt_lod(in VirtualTexture      t, in vec2 uv) { return vt_lod(t, dFdx(uv), dFdy(uv)); }",
  "float vt_lod(in sampler2D           t, in vec2 uv) { return vt_lod(dFdx(uv), dFdy(uv)); }",

].join("\n");
