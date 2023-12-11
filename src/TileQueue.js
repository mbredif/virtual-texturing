//
//
//
import { TileId } from './TileId.js';
import { Tile } from './Tile.js';
import { TextureLoader } from '../examples/jsm/three.module.js';

export class TileQueue {
  constructor(maxLoading, source, loader, crossOrigin) {
    this.maxLoading = maxLoading;
    this.onLoading = 0;
    this.loadCount = 0;
    this.callback = null;
    this.tiles = [];
    this.sorted = false;
    this.pending = {};

    this.source = source;
    this.loader = loader || new TextureLoader();
    this.loader.crossOrigin = crossOrigin || 'Anonymous';
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
      const url = this.source.getUrl(tile);
      if (!url) return scope.process();


      function onLoad(texture) {
        --scope.onLoading;
        ++scope.loadCount;

        tile.texture = texture;
        texture.generateMipmaps = false;
        tile.x0 = tile.x0 || 0;
        tile.y0 = tile.y0 || 0;

        delete scope.pending[tile.id];
        scope.process();
        if (scope.callback) scope.callback(tile);
      };

      function onProgress(event) {console.warn(event);}
      function onError(event) {console.error(event);}

      this.onLoading++;
      this.loader.load(url, onLoad, onProgress, onError, this.source);
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
