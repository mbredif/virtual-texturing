export class IIPSource {
  constructor(config) {
    const scope = this;
    Object.assign(this, config);
    const url = config.iip + '?FIF=' + config.id;
    this.base = url+'&LYR=20&JTL=';
    this.promise = fetch(url + '&obj=IIP,1.0&obj=Max-size&obj=Tile-size&obj=Resolution-number')
    .then((response) => response.text())
    .then((txt) => Object.fromEntries(txt.split(/\r?\n/)
      .map((line) => line.split(':'))
      .filter((line) => line.length == 2)
      .map((entry) => {
        const values = entry[1].split(/\s+/).map((v) => parseInt(v, 10));
        return [entry[0], values];
      })
    ))
    .then((info) => {
      scope.size = info['Max-size'];
      const size = info['Tile-size'];
      scope.minMipMapLevel = 0;
      scope.maxMipMapLevel = info['Resolution-number']-1;
      scope.width = size[0];
      scope.height = size[1];
      scope.numTiles = [];
      for(let z=0; z<=scope.maxMipMapLevel; ++z) {
        const TW = scope.width  << (scope.maxMipMapLevel - z);
        const TH = scope.height << (scope.maxMipMapLevel - z);
        const W = Math.ceil(scope.size[0]/TW);
        const H = Math.ceil(scope.size[1]/TH);
        scope.numTiles[z] = [W, H];
      }
    });
  }
  getUrl(tile) {
    const W = this.numTiles[tile.z][0];
    const H = this.numTiles[tile.z][1];
    if ( tile.x >= W || tile.y >= H ) return null;
    return this.base+tile.z+','+(tile.x+W*tile.y);
  }
}
