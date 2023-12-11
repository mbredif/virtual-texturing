/**
 * @author elfrank - http://franciscoavila.mx
 */

 import { Cache } from './Cache.js';
 import { TileDetermination } from './TileDetermination.js';
 import { IndirectionTable } from './IndirectionTable.js';
 import { TileQueue } from './TileQueue.js';
 import { UsageTable } from './UsageTable.js';
 import './VirtualTextureShader.js';
 import { UnsignedByteType, RGBAFormat } from '../examples/jsm/three.module.js';

export class VirtualTexture {
  constructor( params ) {
    if (!params) {
      console.error('\'params\' is not defined. Virtual Texturing cannot start.');
      return;
    }

    const source = params.source;
    const loader = params.loader;

    this.minMipMapLevel = source.minMipMapLevel;
    this.maxMipMapLevel = source.maxMipMapLevel;
    this.tileSize = [ source.width, source.height ];
    this.tilePadding = source.padding;
    this.pageCount = params.pageCount;
    this.useProgressiveLoading = true;
    this.name = params.name || "vt";

    // init tile queue
    this.tileQueue = new TileQueue(10, source, loader);

    this.format = source.format || RGBAFormat;
    this.type = source.type || UnsignedByteType;
    this.internalFormat = source.internalFormat;

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
      this.maxMipMapLevel,
      this.format,
      this.type,
      this.internalFormat
    );
    //this.internalFormat = this.cache.internalFormat;

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

    // update rendering uniforms
    this.padding = [ this.cache.padding/this.cache.realTileSize.x , this.cache.padding/this.cache.realTileSize.y ];
    this.texture = this.cache.texture;
    this.cacheIndirection = this.indirectionTable.texture;
    this.tileSize = [ this.cache.realTileSize.x , this.cache.realTileSize.y ];
    this.numPages = [ this.cache.pageCount.x , this.cache.pageCount.y ];
    this.anisotropy = this.texture.anisotropy;

    // update rendering uniforms
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
    vt.anisotropy = this.cache.texture.anisotropy;
    vt.id = 255;

  }
};
