import { Page } from './Page.js';
import { TileId } from './TileId.js';
import { Tile } from './Tile.js';
import { DataTexture, CanvasTexture, UVMapping, ClampToEdgeWrapping, LinearMipMapLinearFilter, LinearFilter, Vector2 } from '../examples/jsm/three.module.js';
import { RGBAFormat, RGBAIntegerFormat, RGFormat, RGIntegerFormat, RedFormat, RedIntegerFormat } from '../examples/jsm/three.module.js';
import { ByteType, ShortType, IntType, UnsignedByteType, UnsignedShortType, UnsignedIntType, FloatType } from '../examples/jsm/three.module.js';

function getChannelCount( format ) {
	switch ( format ) {
		case RGBAFormat: case RGBAIntegerFormat: return 4;
		case RGFormat  : case RGIntegerFormat  : return 2;
		case RedFormat : case RedIntegerFormat : return 1;
		default : throw new Error( "unsupported format in VirtualTexture" );
  }
}

function getTypedArray( type ) {
	switch ( type ) {
		case ByteType         : return Int8Array;
		case ShortType        : return Int16Array;
    case IntType          : return Int32Array;
    case UnsignedByteType : return Uint8Array;
		case UnsignedShortType: return Uint16Array;
		case UnsignedIntType  : return Uint32Array;
    case FloatType        : return Float32Array;
		default : throw new Error( "unsupported type in VirtualTexture" );
  }
}

function createDataTexture(image, x, y, z, l, lmax, x0, y0, pad, realTileSize, debug) {
  const tile  = 1 << l;
  const width = image.width >> l || 1;
  const height = image.height >> l || 1;
  const channels = image.data.length / (image.width * image.height);
  const data = new image.data.constructor(width * height * channels);
  for(let j=0; j<width; ++j) {
    for(let i=0; i<height; ++i) {
      for(let c=0; c<channels; ++c) {
        let s = 0;
        let n = 0;
        for(let l=j*tile; l<j*tile+tile && l < image.height; ++l) {
          for(let k=i*tile; k<i*tile+tile && k < image.width; ++k) {
            const v = image.data[(l*image.width+k)*channels+c];
            if (v === -9999) v = 0;
            s += v;
            n += 1;
          }
        }
        data[(j*width+i)*channels+c] = n>0 ? s / (1000*n) : 0;
      }
    }
  }
  const dataTexture = new DataTexture(data, width, height);
  dataTexture.needsUpdate = true;
  dataTexture.generateMipmaps = false;
  return dataTexture;
}

function createTexture(image, x, y, z, l, lmax, x0, y0, pad, realTileSize, debug) {
  if (image.data) return createDataTexture(image, x, y, z, l, lmax, x0, y0, pad, realTileSize, debug);
  const canvas = document.createElement( "canvas" );
  const context = canvas.getContext( "2d" );
  context.imageSmoothingEnabled = true;
  canvas.width = image.width >> l || 1;
  canvas.height = image.height >> l || 1;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  if(debug) {
    context.translate((pad-x0) >> l, (pad-y0) >> l);
    const t = Math.floor((z-l)*255/lmax);
    const color = "rgb("+t+',0,'+(255-t)+')';
    context.strokeStyle = color;
    context.fillStyle  = color;
    const w = (realTileSize.x-2*pad) >> l;
    const h = (realTileSize.y-2*pad) >> l;
    context.strokeRect(0, 0, w, h);
    context.translate(w >> 1, h >> 1);
    context.textAlign = "center";
    context.scale(canvas.width / 64, canvas.height / 64);
    context.fillText(x+','+y, 0,-5);
    context.fillText(z+'-'+l, 0, 5);
  }
  const canvasTexture = new CanvasTexture(canvas);
  canvasTexture.needsUpdate = true;
  canvasTexture.generateMipmaps = false;
  return canvasTexture;
}

export class Cache {

  constructor(tileSize, padding, pageCount, maxLevel, format, type, internalFormat) {
    this.realTileSize = {
      x: tileSize[0] + (2 * padding),
      y: tileSize[1] + (2 * padding)
    };

    this.maxLevel = maxLevel;
    this.pageCount = {
      x: pageCount[0],
      y: pageCount[1]
    };

    this.width = this.pageCount.x * this.realTileSize.x;
    this.height = this.pageCount.y * this.realTileSize.y;

    this.padding = padding;

    this.texture = null;

    this.cachedPages = {}; // tileId -> pageId
    this.newTiles = []; // Tile
    this.pages = []; // pageId -> Page

    const numPages = this.pageCount.x * this.pageCount.y;
    for (let i = 0; i < numPages; ++i) {
      this.pages.push(new Page());
    }

    this.format = format;
    this.type = type;
    //this.internalFormat = internalFormat;

    this.lastFrame = 0;
    this.debug = false;
    this.initTexture();
    this.clear();
  }

  initTexture() {
    this.texture = new DataTexture(
      null,
      this.width,
      this.height,
      this.format,
      this.type,
      UVMapping,
      ClampToEdgeWrapping,
      ClampToEdgeWrapping,
      LinearFilter,
      LinearMipMapLinearFilter
    );
    //if (this.internalFormat)
    //  this.texture.internalFormat = this.internalFormat;
    //else
    //  this.internalFormat = this.texture.internalFormat;
    this.texture.anisotropy = 4;
    this.texture.generateMipmaps = false;
    this.texture.needsUpdate = true;
    this.maxTileLevels = 1;
    //this.maxTileLevels = Math.floor(Math.log2(Math.max(this.realTileSize.x, this.realTileSize.y)));
    let width = this.width;
    let height = this.height;
    //for (let l = 0; l <= this.maxTileLevels; ++l) {
    const channels = getChannelCount(this.format);
    const typedArray = getTypedArray(this.type);

    while ( width > 0 || height > 0 ) {
      this.texture.mipmaps.push({
        data: new typedArray(width * height * channels),
        width: width || 1,
        height: height || 1
      });
      width >>= 1;
      height >>= 1;
    }
  }

  getPageX (pageId) {
    return pageId % this.pageCount.x;
  }

  getPageY (pageId) {
    return Math.floor(pageId / this.pageCount.x);
  }

  getPageZ (pageId) {
    if (this.pages[pageId] === undefined) {
      console.error("page on pageId " + pageId + " is undefined");
      return -1;
    }
    return this.pages[pageId].z;
  }

  getPageId (x, y, z) {
    const id = TileId.create(x, y, z);
    return this.cachedPages[id];
  }

  onPageDropped (id) {
    if (this.pageDroppedCallback) {
      this.pageDroppedCallback(id, this.cachedPages[id]);
    }
  }

  contains (id) {
    const pageId = this.cachedPages[id];
    if (pageId === undefined) return false;

    const page = this.pages[pageId];
    if (page === undefined) return false;

    return page.valid;
  }

  getStatus () {
    let validPages = this.pages.reduce((count, page) => count + page.valid , 0);
    return {
      valid: validPages,
      invalid: this.pages.length - validPages,
    }
  }

  clear () {
    this.cachedPages = {};

    for (let i = 0; i < this.pages.length; ++i) {
      this.pages[i].image = undefined;
      this.pages[i].valid = false;
    }
  }

  // find one pageId and free it
  // this function gets called when no pageIds are free
  freePage (id) {
    let pageId = undefined, lastFrame = Number.MAX_VALUE, hits = Number.MAX_VALUE;
    for (let i = 0; i < this.pages.length; ++i) {
      const page = this.pages[i];
      if (!page.valid || page.tileId==id) return i;
      if (page.forced || page.pending) continue;
      if (page.lastFrame < lastFrame || (page.lastFrame == lastFrame && page.hits < hits) ) {
        lastFrame = page.lastFrame;
        hits = page.hits;
        pageId = i;
      }
    }
    return pageId;
  }

  reservePage (id) {
    // get the next free page
    const pageId = this.freePage(id);

    // if valid, remove it now, (otherwise handles leak)
    const page = this.pages[pageId];
    if (page.valid) {
      this.onPageDropped(page.tileId);
      delete this.cachedPages[page.tileId];
    }

    // update pageId
    this.cachedPages[id] = pageId;
    page.z = TileId.getZ(id);
    page.tileId = id;
    page.valid = true;
    return pageId;
  }

  update(renderer, usageTable) {
    this.updateTiles(renderer);
    this.updateUsage(usageTable, renderer.renderCount);
  }

  copyTextureToTexture(renderer, tile, x, y, level) {
    const texture = createTexture(tile.texture.image, tile.x, tile.y, tile.z, level, this.maxLevel, tile.x0, tile.y0, this.padding, this.realTileSize, this.debug);
    const pos = new Vector2(x >> level, y >> level);
    renderer.initTexture(renderer.properties.get( this.texture ), this.texture); // workaround to force initialization
    renderer.copyTextureToTexture(pos, texture, this.texture, level);
  }

  updateTiles(renderer) {
    const scope = this;
    const pageIds = [];
    const tileIds = [];
    for(const tile of this.newTiles) {
      const pageId = this.reservePage(tile.id);
      if(pageId == undefined) break; // all pages are already used for the current frame
      const page = this.pages[pageId];
      page.forced = tile.forced;
      page.image = tile.texture.image;
      page.pending = true;
      pageIds.push(pageId);
      tileIds.push(tile.id);
      let x = this.realTileSize.x * this.getPageX(pageId)+tile.x0;
      let y = this.realTileSize.y * this.getPageY(pageId)+tile.y0;
      for(let level=0; level<=this.maxTileLevels; ++level)
        this.copyTextureToTexture(renderer, tile, x, y, level);
      this.callback(pageId,tile);
    }
    this.newTiles.length = 0;
    for(const pageId of pageIds) this.pages[pageId].pending=false;
  }

  updateUsage(usageTable, renderCount) {
    this.lastFrame = renderCount;
    for (let tileId in usageTable.table) {
      if (usageTable.table.hasOwnProperty(tileId)) {
        const pageId = this.cachedPages[tileId];
        if (pageId !== undefined) {
          this.pages[pageId].lastFrame = renderCount;
          this.pages[pageId].hits = usageTable.table[tileId];
        }
      }
    }
  }

  cacheTile (tile) {
    this.newTiles.push(tile);
  }
};
