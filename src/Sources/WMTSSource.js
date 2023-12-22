export class WMTSSource {
  constructor(config) {
    Object.assign(this, config);
    this.base = config.wmts + '?Service=WMTS&Request=GetTile'
    + '&Version=' + (config.version || '1.0.0')
    + '&Layer=' + config.layer
    + '&Format=' + (config.mimeType || 'image/jpeg')
    + '&Style=' + (config.style || 'normal')
    + '&TileMatrixSet=' + config.tileMatrixSet
    + '&TileMatrix=';
  }
  getUrl(tile) {
    if (this.tileMatrixSetLimits) {
      const limits = this.tileMatrixSetLimits[tile.z];
      if(!limits || tile.x < limits.minTileCol || tile.x > limits.maxTileCol || tile.y < limits.minTileRow || tile.y > limits.maxTileRow)
        return undefined;
    }
    return this.base+tile.z+'&TileRow='+tile.y+'&TileCol='+tile.x;
  }
}
