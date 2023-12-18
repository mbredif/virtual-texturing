import { FloatType, RedFormat, DataTextureLoader } from '../examples/jsm/three.module.js';

export class XBILLoader extends DataTextureLoader {
	constructor( manager ) {
		super( manager );
	}

  parse( buffer ) {
		return { data: new Float32Array(buffer) };
  }

	load( url, onLoad, onProgress, onError, options = {}) {
    const width = options.width || 256;
    const height = options.height || 256;
    const format = options.format || RedFormat;
    const type = options.type || FloatType;
    const internalFormat = options.internalFormat || "R32F";
		function onLoadCallback( texture, texData ) {
      texture.format = format;
      texture.internalFormat = internalFormat;
      texture.image.width = width;
      texture.image.height = height;
      texture.image.type = type;
			if ( onLoad ) onLoad( texture, texData );
		}
		return super.load( url, onLoadCallback, onProgress, onError );
	}
}
