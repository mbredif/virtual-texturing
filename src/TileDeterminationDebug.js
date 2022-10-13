export class TileDeterminationDebug {
  constructor(tileDetermination) {
    this.tileDetermination = tileDetermination;
    this.canvas = null;
    this.imgData = null;

    var verticalPosition = 0;
    var horizontalPosition = 10;
    var position = "absolute";
    var zIndex = "100";
    var borderColor = "red";
    var borderStyle = "solid";
    var borderWidth = 1;

    var fontSize = 13; // in pixels
    var fontFamily = "Arial";
    var lineHeight = 20; // in pixels

    // create div title
    var divTitle = document.createElement('div');

    divTitle.style.color = "#000000";
    divTitle.style.fontFamily = fontFamily;
    divTitle.style.fontSize = fontSize + "px";
    divTitle.style.fontWeight = "bold";
    divTitle.style.zIndex = 100;
    divTitle.style.position = "absolute";
    divTitle.style.top = verticalPosition + "px";
    divTitle.style.left = horizontalPosition + "px";

    divTitle.innerHTML = "Visible Tiles (Feedback Buffer)";
    document.body.appendChild(divTitle);

    const width = 1;
    const height = 1;

    this.canvas = document.createElement('canvas');
    this.canvas.width =  width;
    this.canvas.height = height;
    this.canvas.style.top = verticalPosition + lineHeight + "px";
    this.canvas.style.left = horizontalPosition + "px";
    this.canvas.style.position = position;
    this.canvas.style.zIndex = zIndex;
    this.canvas.style.borderColor = borderColor;
    this.canvas.style.borderStyle = borderStyle;
    this.canvas.style.borderWidth = borderWidth + "px";
    this.imgData = this.canvas.getContext('2d').createImageData(width, height);

    document.body.appendChild(this.canvas);
  }

  update() {
    const width = this.tileDetermination.renderTarget.width;
    const height = this.tileDetermination.renderTarget.height;
    const data = this.tileDetermination.data;

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
        this.imgData.data[i+0] = 255 - (data[j+2] * 255 / 9);
        this.imgData.data[i+1] = data[j+0];
        this.imgData.data[i+2] = data[j+1];
        this.imgData.data[i+3] = 255;
      }
    }
    this.canvas.getContext('2d').putImageData(this.imgData, 0, 0);
  }
};
