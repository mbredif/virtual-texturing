//
//
//

export class TileDeterminationDebug {
  constructor(virtualTexture, params) {
    this.virtualTexture = virtualTexture;
    this.hidden = params.hidden || false;

    var verticalPosition = 0;
    var horizontalPosition = 10;
    var position = "absolute";
    var zIndex = "100";
    var borderColor = "red";
    var borderStyle = "solid";
    var borderWidth = 0;

    var fontSize = 13; // in pixels
    var fontFamily = "Arial";
    var lineHeight = 20; // in pixels

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

    this.divTitle.innerHTML = "Visible Tiles (Feedback Buffer)";
    document.body.appendChild(this.divTitle);

    const width = 1;
    const height = 1;

    this.canvas = document.createElement('canvas');
    this.canvas.width =  width;
    this.canvas.height = height;
    this.canvas.style.top = "0px";
    this.canvas.style.left = "0px";
    this.canvas.style.width = "100%";
    this.canvas.style.position = position;
    this.canvas.style.zIndex = zIndex;
    this.canvas.style.borderColor = borderColor;
    this.canvas.style.borderStyle = borderStyle;
    this.canvas.style.borderWidth = borderWidth + "px";
    this.imgData = this.canvas.getContext('2d').createImageData(width, height);

    document.body.appendChild(this.canvas);
  }

  update() {
    this.canvas.hidden = this.hidden;
    this.divTitle.hidden = this.hidden;
    if(this.hidden) return;
    const tileDetermination = this.virtualTexture.tileDetermination;
    if (!tileDetermination.renderTarget) return;
    const width = tileDetermination.renderTarget.width;
    const height = tileDetermination.renderTarget.height;
    const data = tileDetermination.data;
    const maxMipMapLevel = this.virtualTexture.maxMipMapLevel;

    if(this.canvas.width != width || this.canvas.height != height) {
      this.canvas.width =  width;
      this.canvas.height = height;
      this.imgData = this.canvas.getContext('2d').createImageData(width, height);
    }

    // copy the flipped texture to data
    for(let x=0; x<width; ++x) {
      for(let y=0; y<height; ++y) {
        const i = 4 * (y*width + x);
        const j = 4 * ((height-1-y)*width + x);
        const z = maxMipMapLevel - data[j+2];
        const size = 1 << z;
        if (data[j+2] == 0) { // clear alpĥa is zero => no virtual texel here
          this.imgData.data[i+0] = 0;
          this.imgData.data[i+1] = 0;
          this.imgData.data[i+2] = 0;
        } else {
          this.imgData.data[i+0] = 255* z / maxMipMapLevel;
          this.imgData.data[i+1] = 255*(0.5+data[j+0])/size;
          this.imgData.data[i+2] = 255*(0.5+data[j+1])/size;
        }
        this.imgData.data[i+3] = 255;

      }
    }
    this.canvas.getContext('2d').putImageData(this.imgData, 0, 0);
  }
};
