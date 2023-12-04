/**
 * @author elfrank - http://franciscoavila.mx
 */

 import { Cache } from './Cache.js';
 import { TileDetermination } from './TileDetermination.js';
 import { IndirectionTable } from './IndirectionTable.js';
 import { TileQueue } from './TileQueue.js';
 import { UsageTable } from './UsageTable.js';
 import { VirtualTextureShader } from './VirtualTextureShader.js';
 import { UniformsUtils, ShaderMaterial } from '../examples/jsm/three.module.js';

export class VirtualTexture {
  constructor( params ) {
    if (!params) {
      console.error('\'params\' is not defined. Virtual Texturing cannot start.');
      return;
    }

    this.minMipMapLevel = params.minMipMapLevel;
    this.maxMipMapLevel = params.maxMipMapLevel;
    this.tileSize = params.tileSize;
    this.tilePadding = params.tilePadding;
    this.pageCount = params.pageCount;
    this.useProgressiveLoading = true;

    // init tile queue
    this.tileQueue = new TileQueue(10);
    this.tileQueue.getTilePath = params.getTilePath;

    this.tileCount = 1 << this.maxMipMapLevel;
    this.size = [ this.tileSize[0] * this.tileCount, this.tileSize[1] * this.tileCount];

    console.log('Virtual Texture: width: ' + this.size[0] + ' height: ' + this.size[1]);


    // init tile determination program
    this.tileDetermination = new TileDetermination(params.tileDeterminationRatio);

    // init page table
    this.indirectionTable = new IndirectionTable(this.minMipMapLevel, this.maxMipMapLevel);
    console.log("Indirection table size: " + this.tileCount);

    // init page cache
    this.cache = new Cache(
      this.tileSize,
      this.tilePadding,
      this.pageCount,
      this.maxMipMapLevel
    );

    const scope = this;
    this.cache.pageDroppedCallback = function (tileId, PageId) {
      scope.indirectionTable.sub(tileId, PageId);
    };

    // init usage table
    this.usageTable = new UsageTable(this.maxMipMapLevel);

    this.tileQueue.callback = function (tile) {
      scope.cache.cacheTile(tile);
    };

    this.cache.callback = function (pageId, tile) {
      scope.indirectionTable.add(tile.id, pageId);
    };

    this.needsUpdate = false;
    this.debugLevel = false;
    this.debugLastHits = false;
    this.textureMode = 0;
    this.init();
    this.setSize(window.innerWidth, window.innerHeight);
  }

  setSize( width, height ) {

    this.tileDetermination.setSize(width, height);

  }

  init() {

    this.resetCache();
    this.needsUpdate = true;

  }

  resetCache () {

    this.cache.clear();
    this.tileQueue.reset(this.minMipMapLevel);
    this.indirectionTable.clear();

  }

  update (renderer, scene, camera) {

    this.updateVisibleTileMaterial();
    this.tileDetermination.update( renderer, scene, camera );
    this.usageTable.update( this.tileDetermination.data );
    this.cache.update( renderer, this.usageTable );
    this.tileQueue.update( this.usageTable.table, this.cache);
    this.indirectionTable.update( this.cache, renderer.renderCount );

  }

  updateVisibleTileMaterial ( ) {

    const uniforms = this.tileDetermination.visibleTileMaterial.uniforms;
    const vt = uniforms.vt.value;
    vt.tileSize =  [ this.cache.realTileSize.x * this.tileDetermination.ratio , this.cache.realTileSize.y* this.tileDetermination.ratio ];
    vt.minMipMapLevel = this.minMipMapLevel;
    vt.maxMipMapLevel = this.maxMipMapLevel;
    vt.maxAniso = this.cache.texture.anisotropy;
    vt.id = 255;
    uniforms.iTextureMode.value = this.textureMode;

  }

  createMaterial ( parameters, textureName ) {

    const material = new ShaderMaterial( parameters );
    const uniforms = VirtualTextureShader.uniforms;
    material.uniforms = UniformsUtils.merge( [ uniforms, material.uniforms ] ),
    material.virtualTextureName = textureName;
    this.updateUniforms( material );
    return material;

  }

  updateUniforms ( material ) {

    const uniforms = material.uniforms;
    const vt = uniforms[material.virtualTextureName].value;
    vt.texture = this.cache.texture;
    vt.cacheIndirection = this.indirectionTable.texture;
    vt.padding = [ this.cache.padding/this.cache.realTileSize.x , this.cache.padding/this.cache.realTileSize.y ];
    vt.tileSize = [ this.cache.realTileSize.x , this.cache.realTileSize.y ];
    vt.numPages = [ this.cache.pageCount.x , this.cache.pageCount.y ];
    vt.minMipMapLevel = this.minMipMapLevel;
    vt.maxMipMapLevel = this.maxMipMapLevel;
    vt.maxAniso = vt.texture.anisotropy;
    uniforms.bDebugLevel.value = this.debugLevel;
    uniforms.bDebugLastHits.value = this.debugLastHits;
    uniforms.iTextureMode.value = this.textureMode;

  }
};
