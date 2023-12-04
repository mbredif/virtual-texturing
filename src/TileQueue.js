//
//
//

export class TileQueue {
  constructor(maxLoading) {
    this.maxLoading = maxLoading;
    this.onLoading = 0;
    this.loadCount = 0;
    this.callback = null;
    this.tiles = [];
    this.sorted = false;
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
      const filePath = this.getTilePath(tile);
      if (!filePath) return scope.process();

      const image = new Image();
      image.crossOrigin = 'Anonymous';

      this.onLoading++;

      image.onload = function() {
        --scope.onLoading;
        ++scope.loadCount;

        tile.image = this;
        tile.loaded = true;
        tile.x0 = filePath.x0 || 0;
        tile.y0 = filePath.y0 || 0;

        scope.process();
        if (scope.callback) scope.callback(tile);
      };

      image.src = filePath.url;
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
};
