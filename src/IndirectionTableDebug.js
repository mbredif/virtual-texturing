//
//
//

export class IndirectionTableDebug {
  constructor(virtualTexture, params) {
    this.virtualTexture = virtualTexture;
    this.hidden = params.hidden || false;
    this.canvas = [];
    this.imageData = [];
    const minLevel = this.virtualTexture.indirectionTable.minLevel;
    const maxLevel = this.virtualTexture.indirectionTable.maxLevel;

    var verticalPosition = (params && params.verticalPosition) ? params.verticalPosition : 0;
    var horizontalPosition = (params && params.horizontalPosition) ? params.horizontalPosition : 10;
    var position = (params && params.position) ? params.position : "absolute";
    var zIndex = (params && params.zIndex) ? params.zIndex : "100";
    var borderColor = (params && params.borderColor) ? params.borderColor : "blue";
    var borderStyle = (params && params.borderStyle) ? params.borderStyle : "solid";
    var borderWidth = (params && params.borderWidth) ? params.borderWidth : 1;
    var lineHeight = (params && params.lineHeight) ? params.lineHeight : 10; // in pixels
    var fontSize = (params && params.fontSize) ? params.fontSize : 13; // in pixels
    var fontFamily = (params && params.fontFamily) ? params.fontFamily : "Arial";

    // create div title
    this.divTitle = document.createElement('div');

    this.divTitle.style.color = "#000000";
    this.divTitle.style.fontFamily = fontFamily;
    this.divTitle.style.fontSize = fontSize + "px";
    this.divTitle.style.fontWeight = "bold";
    this.divTitle.style.zIndex = 100;
    this.divTitle.style.position = "absolute";
    this.divTitle.style.top = verticalPosition + "px";
    this.divTitle.style.left = horizontalPosition + "px";

    this.divTitle.innerHTML = "Indirection Table";
    document.body.appendChild(this.divTitle);
    verticalPosition += lineHeight;

    for( let l = minLevel; l <= maxLevel; ++l) {
      const canvas = document.createElement('canvas');
      this.canvas.push(canvas);
      canvas.width = 1 << l;
      canvas.height = 1 << l;
      this.imageData[l] = canvas.getContext('2d').createImageData(canvas.width, canvas.height);

      canvas.style.top = verticalPosition + lineHeight + "px";
      canvas.style.left = horizontalPosition + "px";
      canvas.style.position = position;
      canvas.style.zIndex = zIndex;
      canvas.style.borderColor = borderColor;
      canvas.style.borderStyle = borderStyle;
      canvas.style.borderWidth = borderWidth + "px";

      verticalPosition += canvas.height + 3*borderWidth;

      document.body.appendChild(canvas);
    }
  }

  update () {
    const dataArrays = this.virtualTexture.indirectionTable.dataArrays;
    const minLevel = this.virtualTexture.indirectionTable.minLevel;
    const maxLevel = this.virtualTexture.indirectionTable.maxLevel;
    const pageCount = this.virtualTexture.cache.pageCount;
    this.divTitle.hidden = this.hidden;
    for( let l = minLevel; l <= maxLevel; ++l) {
      this.canvas[l].hidden = this.hidden;
      if(this.hidden) continue;
      const data = dataArrays[l];
      for (let j = 0; j < data.length; j += 4) {
        this.imageData[l].data[j + 0] = data[j + 2] * 255 / maxLevel;
        this.imageData[l].data[j + 1] = data[j    ] * 255 / pageCount.x;
        this.imageData[l].data[j + 2] = data[j + 1] * 255 / pageCount.y;
        this.imageData[l].data[j + 3] = 255;//data[j + 3];
      }
      this.canvas[l].getContext('2d').putImageData(this.imageData[l], 0, 0);
    }
  }
};
