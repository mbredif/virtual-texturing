export class IIPSource {
  constructor(config) {
    Object.assign(this, config);
    this.base = this.iip + '?FIF=' + this.id+'&LYR=20&JTL=';
    if(config.info) this.load(config.info);
  }
  init() {
    const scope = this;
    return fetch(this.iip + '?FIF=' + this.id + '&obj=IIP,1.0&obj=Max-size&obj=Tile-size&obj=Resolution-number')
    .then((response) => response.text())
    .then((txt) => Object.fromEntries(txt.split(/\r?\n/)
      .map((line) => line.split(':'))
      .filter((line) => line.length == 2)
      .map((entry) => {
        const values = entry[1].split(/\s+/).map((v) => parseInt(v, 10));
        return [entry[0], values];
      })
    ))
    .then((info) => { scope.load(info); });
  }
  load(info) {
    this.size = info['Max-size'];
    const size = info['Tile-size'];
    this.minMipMapLevel = 0;
    this.maxMipMapLevel = info['Resolution-number']-1;
    this.width = size[0];
    this.height = size[1];
    this.numTiles = [];
    for(let z=0; z<=this.maxMipMapLevel; ++z) {
      const TW = this.width  << (this.maxMipMapLevel - z);
      const TH = this.height << (this.maxMipMapLevel - z);
      const W = Math.ceil(this.size[0]/TW);
      const H = Math.ceil(this.size[1]/TH);
      this.numTiles[z] = [W, H];
    }
  }
  getUrl(tile) {
    const W = this.numTiles[tile.z][0];
    const H = this.numTiles[tile.z][1];
    if ( tile.x >= W || tile.y >= H ) return undefined;
    return this.base+tile.z+','+(tile.x+W*tile.y);
  }
}
