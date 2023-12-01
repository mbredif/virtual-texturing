//
//
//

export class CacheDebug {
  constructor(virtualTexture, params) {
    this.virtualTexture = virtualTexture;
    this.hidden = params.hidden || false;

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
    this.divTitle = document.createElement('div');

    this.divTitle.style.color = "#000000";
    this.divTitle.style.fontFamily = fontFamily;
    this.divTitle.style.fontSize = fontSize + "px";
    this.divTitle.style.fontWeight = "bold";
    this.divTitle.style.zIndex = 100;
    this.divTitle.style.position = "absolute";
    this.divTitle.style.top = verticalPosition + "px";
    this.divTitle.style.left = horizontalPosition + "px";

    this.divTitle.innerHTML = "Cached Tiles (Texture Pages)";
    document.body.appendChild(this.divTitle);

    const width = 512;
    const height = 512;

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
    this.canvas.hidden = this.hidden;
    this.divTitle.hidden = this.hidden;
    const cache = this.virtualTexture.cache;
    const sx = this.canvas.width/cache.pageCount.x;
    const sy = this.canvas.height/cache.pageCount.y;
    const ctx = this.canvas.getContext('2d');

    ctx.reset();
    for(const pageId in cache.pages) {
    	const page = cache.pages[pageId];
    	const x = cache.getPageX(pageId);
    	const y = cache.getPageY(pageId);
    	const z = cache.getPageZ(pageId);
    	ctx.save();
        ctx.textAlign = "center";
    	ctx.translate(x*sx, y*sy);
    	if(page.image) ctx.drawImage(page.image, 0, 0, sx, sy);
    	ctx.fillText(page.hits, sx>>1, sy*0.25);
    	ctx.fillText(page.lastHits, sx>>1, sy*0.75);
    	ctx.restore();
    }
    this.divTitle.innerHTML = "Cached Tiles (Texture Pages)" + JSON.stringify(cache.getStatus());
  }
};
