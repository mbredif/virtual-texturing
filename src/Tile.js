//
//
//
import { TileId } from './TileId.js'

export class Tile {
  constructor(id, hits, forced = false) {
    this.id = id;
    this.hits = (undefined !== hits) ? hits : 0;
    this.x = TileId.getX(id);
    this.y = TileId.getY(id);
    this.z = TileId.getZ(id);
    this.texture = undefined;
    this.forced = forced;
  }
};
