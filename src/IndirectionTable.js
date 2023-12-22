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

    this.minLevel = minlevel;
    this.maxLevel = maxLevel;
    this.size = 1 << maxLevel;

    // create all mipmaps even if the level<minLevel are unused
    this.dataArrays = {};
    for (let i = 0; i <= this.maxLevel; ++i)
      this.dataArrays[i] = new Uint8Array(1 << (2*i +2));

    for (let level in this.dataArrays) {
      const data = this.dataArrays[level];
      for (let j = 0; j < data.length; j += 4) {
        data[j    ] = 0.0;
        data[j + 1] = 0.0;
        data[j + 2] = 0.0;
        data[j + 3] = 255.0;
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
    for( let l = this.maxLevel; l >= 0; --l) {
      this.texture.mipmaps.push({
        data : this.dataArrays[l],
        width: 1 << l,
        height: 1 << l
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
        let pageId = cache.getPageId(x, y, z);
        if (pageId === undefined && z == this.minLevel) pageId = 0;
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
          this.dataArrays[z][offset + 3] = Math.min(255, renderCount - cache.pages[pageId].lastFrame);
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
