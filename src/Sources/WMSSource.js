export class WMSSource {
  constructor(config) {
    Object.assign(this, config);
    this.base = config.wms + '?Service=WMS&Request=GetMap'
    + '&Version=' + (config.version || '1.3.0')
    + '&Layers=' + config.layer
    + '&Format=' + (config.mimeType || 'image/jpeg')
    + '&CRS=' + config.crs
    + '&Width=' + (this.width+2*this.padding)
    + '&Height='+ (this.height+2*this.padding)
    + '&BBox=';
  }
  getUrl(tile) {
    const bbox = this.bbox;
    const padding = this.padding;
    const w = (bbox[2]-bbox[0]) / (1 << tile.z);
    const h = (bbox[3]-bbox[1]) / (1 << tile.z);
    const x = bbox[0]+w*tile.x;
    const y = bbox[3]-h*tile.y;
    const a = w*padding/this.width;
    const b = h*padding/this.height;
    return this.base+(y-h-b)+','+(x-a)+','+(y+b)+','+(x+w+a);
  }
}
