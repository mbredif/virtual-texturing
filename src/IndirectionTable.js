//
//
//

/**
 * Mipmap table
 * level 0 has size*size entries
 * level 1 has (size>>1) * (size>>1)
 * level n-th has only 1 entry
*/
import { DataTexture, RGBAIntegerFormat, UnsignedByteType, UVMapping, ClampToEdgeWrapping, NearestFilter, NearestMipmapNearestFilter }
from '../examples/jsm/three.module.js';

import { TileId } from './TileId.js'

export class IndirectionTable {
  constructor(minlevel, maxLevel) {

    // quad-tree representation
    this.pageIds = null;
    this.minLevel = minlevel;
    this.maxLevel = maxLevel;
    this.size = 1 << maxLevel;
    this.offsets = null;

    // graphics and webgl stuff
    this.texture = null;
    this.dataArrays = null;

    this.init();
  }

  init () {
    this.offsets = new Array(this.maxLevel + 1);
    this.dataArrays = new Array(this.maxLevel + 1);

    let i, j, offset;
    let accumulator = 0;
    let numElements = this.size * this.size;
    for (i = this.maxLevel; i >= 0; --i) {

      this.offsets[i] = accumulator;
      this.dataArrays[i] = new Uint8Array(numElements * 4);
      accumulator += numElements;
      numElements >>= 2;
    }

    this.pageIds = [];
    for (i = 0; i < accumulator; ++i) {
      this.pageIds[i] = -1;
    }

    for (i = 0; i < this.dataArrays.length; ++i) {
      const numData = this.dataArrays[i].length;
      for (j = 0; j < numData; j += 4) {
        this.dataArrays[i][j] = 0.0;
        this.dataArrays[i][j + 1] = 0.0;
        this.dataArrays[i][j + 2] = 0.0;
        this.dataArrays[i][j + 3] = 255.0;
      }
    }
    this.texture = new DataTexture(
      null,
      this.size,
      this.size,
      RGBAIntegerFormat,
      UnsignedByteType,
      UVMapping,
      ClampToEdgeWrapping,
      ClampToEdgeWrapping,
      NearestFilter,
      NearestMipmapNearestFilter
    );
    this.texture.internalFormat = 'RGBA8UI';
    this.texture.name = 'indirection_table';
    this.texture.generateMipmaps = false;
    for( let l = 0; l <= this.maxLevel; ++l) {
      this.texture.mipmaps.push({
        data : this.dataArrays[this.maxLevel - l],
        width: 1 << (this.maxLevel - l),
        height: 1 << (this.maxLevel - l)
      });
    }
    this.texture.needsUpdate = true;
  }

  writeToTexture() {
    this.texture.needsUpdate = true;
  }

  setData(z, cache, renderCount) {
    const size = 1 << z;
    const size0 = size >> 1;
    for (let x = 0; x < size; ++x) {
      for (let y = 0; y <size; ++y) {
        const pageId = z == 0 ? 0 : cache.getPageId(x, y, z);
        const offset = (size*y + x) * 4 ;
        if (pageId === undefined) {
          const offset0 = (size0* (y >> 1) + (x >> 1)) * 4 ;
          this.dataArrays[z][offset    ] = this.dataArrays[z-1][offset0     ];
          this.dataArrays[z][offset + 1] = this.dataArrays[z-1][offset0 + 1 ];
          this.dataArrays[z][offset + 2] = this.dataArrays[z-1][offset0 + 2 ];
          this.dataArrays[z][offset + 3] = this.dataArrays[z-1][offset0 + 3 ];;
        } else {
          this.dataArrays[z][offset    ] = cache.getPageX(pageId);
          this.dataArrays[z][offset + 1] = cache.getPageY(pageId);
          this.dataArrays[z][offset + 2] = cache.getPageZ(pageId);
          this.dataArrays[z][offset + 3] = Math.min(255, renderCount - cache.pages[pageId].lastHits);
        }
      }
    }
  }


  update (cache, renderCount) {
    for( let l = this.minLevel; l <= this.maxLevel; ++l) {
      this.setData(l, cache, renderCount);
    }
    this.writeToTexture();
  }

  add (tileId, pageId) {
  //  console.log("add",tileId,pageId);
  }

  sub (tileId, pageId) {
  //  console.log("sub",tileId,pageId);
  }

  clear () {
  }
};
