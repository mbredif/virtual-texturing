//
//
//

export class Page {
  constructor() {
    this.valid = false;
    this.pending = false;
    this.z = 0;
    this.forced = false;
    this.tileId = null;
    this.lastFrame = 0;
    this.hits = 0;
  }
};
