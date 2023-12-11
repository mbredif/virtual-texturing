//
//
//
import { TileId } from './TileId.js';
import { Tile } from './Tile.js';
import { TextureLoader } from '../examples/jsm/three.module.js';

import { FloatType, RedFormat, DataTextureLoader } from '../examples/jsm/three.module.js';
class XBILLoader extends DataTextureLoader {
	constructor( manager, width, height, format, type, internalFormat ) {
		super( manager );
		//this.format = format || RedFormat;
		this.type = type || FloatType;
		//this.internalFormat = internalFormat || "R32F";
	}

  parse( buffer ) {
    var enc = new TextDecoder("utf-8");
    if (buffer.length % 4 != 0) console.log(enc.decode(buffer));
		return {
      data: new Float32Array(buffer),
			width: this.width, height: this.height,
			type: this.type
		};
  }
}

export class TileQueue {
  constructor(maxLoading) {
    this.maxLoading = maxLoading;
    this.onLoading = 0;
    this.loadCount = 0;
    this.callback = null;
    this.tiles = [];
    this.sorted = false;
    this.pending = {};

    this.textureLoader = new XBILLoader();
    this.textureLoader.crossOrigin = 'Anonymous';
  }

  push(tile) {
    this.tiles.push(tile);
    this.sorted = false;
    this.process();
  }

  process() {

    if ((this.onLoading < this.maxLoading) && !this.empty()) {
      const scope = this;
      const tile = this.pop();
      this.pending[tile.id] = tile;
      const filePath = this.getTilePath(tile);
      if (!filePath) return scope.process();


      this.onLoading++;

      function onLoad(texture) {
        --scope.onLoading;
        ++scope.loadCount;

        tile.image = texture.image;
        tile.loaded = true;
        tile.x0 = filePath.x0 || 0;
        tile.y0 = filePath.y0 || 0;

        delete scope.pending[tile.id];
        scope.process();
        if (scope.callback) scope.callback(tile);
      };

      function onProgress(event) {console.warn(arguments);}
      function onError() {console.err(arguments);}
      this.textureLoader.load(filePath.url, onLoad, onProgress, onError);
    }
  }

  pop() {
    this.sort();
    return this.tiles.pop();
  }

  empty() {
    return 0 === this.tiles.length;
  }

  contains(id) {
    return this.tiles.findIndex(tile => id === tile.id) != -1;
  }

  pending(id) {
    return this.pending[id];
  }

  size() {
    return this.tiles.length;
  }

  top() {
    this.sort();
    return this.tiles[this.tiles.length - 1];
  }

  sort() {
    if ( this.sorted ) return;
    this.tiles.sort((a, b) => a.hits - b.hits);
    this.sorted = true;
  }

  clear(cancel = false) {
    this.tiles.length = 0;
    //todo : if cancel, cancel images that are currently loading or deconnect their onload
  }

  reset(z) {
    this.clear(true);
    const size = 1 << z;
    for (let y = 0; y < size; ++y) {
      for (let x = 0; x < size; ++x) {
        const id = TileId.create(x, y, z);
        const tile = new Tile(id, Number.MAX_VALUE, true);
        this.push(tile);
      }
    }
  }

  update(usageTable, cache) {
    this.clear();
    for (const tileId in usageTable) {
      if (!usageTable.hasOwnProperty(tileId)) continue;
      if(this.pending[tileId]===undefined && !cache.contains(tileId)) {
        const hits = usageTable[tileId];
        const tile = new Tile(tileId, hits);
        this.push(tile);
      }
    }
  }
};
