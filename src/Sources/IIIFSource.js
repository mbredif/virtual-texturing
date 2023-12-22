export class IIIFSource {
  constructor(config) {
    Object.assign(this, config);
    if(config.info) this.load(config.info);
  }
  init() {
    const scope = this;
    return fetch(this.id + '/info.json')
    .then((response) => response.json())
    .then((info) => { return scope.load(info); });
  }
  load(info, width = 256) {
    this.size = [ info.width, info.height ];
    this.minMipMapLevel = 0;
    let ok = false;
    if (info.tiles) {
      for(const tiles of info.tiles) {
        this.maxMipMapLevel = 0;
        this.width = tiles.width || width;
        this.height = tiles.height || tiles.width;
        const scaleFactors = tiles.scaleFactors;
        ok = true;
        for(let l=0; l<scaleFactors.length && ok; ++l) {
          if(scaleFactors[l] != 1 << l) ok = false;
          this.maxMipMapLevel = l;
          if (this.width<<l >= info.width && this.height<<l >= info.height) break;
        }
        if(ok) break;
      }
    }
    if (!ok) {
      this.width = width;
      this.height = width;
      this.maxMipMapLevel = 0;
      while (width < this.size[0] || width < this.size[1]) {
        this.maxMipMapLevel += 1;
        width = width << 1;
      }
    }
  }
  getUrl(tile) {
    // https://iiif.io/api/image/3.0/implementation/#3-tile-region-parameter-calculation
    const tw = this.width;
    const th = this.height;
    const n = tile.x;
    const m = tile.y;
    const s = 1 << (this.maxMipMapLevel-tile.z);
    const p = this.padding;

    const x0 = Math.max(0, (n * tw - p) * s);
    const y0 = Math.max(0, (m * th - p) * s);
    const x1 = Math.min(this.size[0], (n * tw + tw + p) * s);
    const y1 = Math.min(this.size[1], (m * th + th + p) * s);
    const wr = x1-x0;
    const hr = y1-y0;
    if ( wr <= 0 || hr <= 0 ) return undefined;

    const ws = Math.ceil(wr / s);
    const hs = Math.ceil(hr / s);
    return this.id+'/'+x0+','+y0+','+wr+','+hr+'/'+ws+','+hs+'/0/default.jpg';
  }
}
