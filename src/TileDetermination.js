//
//
//
import { Scene, NearestFilter, RGBAFormat, WebGLRenderTarget } from '../examples/jsm/three.module.js';
import { VisibleTileShader } from './VisibleTileShader.js';
import { UniformsUtils, DoubleSide, ShaderMaterial, Color } from '../examples/jsm/three.module.js';

export class TileDetermination {
  constructor(ratio) {
    this.renderTarget = null;
    this.data = null;
    this.ratio = ratio;

    const uniforms = UniformsUtils.clone( VisibleTileShader.uniforms );
    const parameters = {
      uniforms: uniforms,
      fragmentShader: VisibleTileShader.fragmentShader,
      vertexShader: VisibleTileShader.vertexShader,
      side: DoubleSide
    };
    this.visibleTileMaterial = new ShaderMaterial(parameters);
  }

  setSize (width, height) {

    width = Math.floor(width * this.ratio);
    height = Math.floor(height * this.ratio);
    if (!this.renderTarget) {
      var renderTargetParameters = {
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        format: RGBAFormat,
        stencilBufer: false
      };

      this.renderTarget = new WebGLRenderTarget( width, height, renderTargetParameters );

    } else if ( width != this.renderTarget.width ||  height != this.renderTarget.height ) {

      this.renderTarget.setSize(width, height);

    } else {

      return;

    }

    this.data = new Uint8Array(width * height * 4);
  }

  // render the scene from the camera viewpoint and get the image of visible tile ids.
  update ( renderer, scene, camera ) {

    const overrideMaterial = scene.overrideMaterial; // save
    const clearAlpha = renderer.getClearAlpha();
    renderer.setClearAlpha(0);
    scene.overrideMaterial = this.visibleTileMaterial;
    renderer.setRenderTarget( this.renderTarget );
    if (!renderer.autoClearColor) renderer.clearColor();
    renderer.render( scene, camera );
    renderer.setRenderTarget( null );
    renderer.readRenderTargetPixels( this.renderTarget, 0, 0,
      this.renderTarget.width, this.renderTarget.height, this.data );
    scene.overrideMaterial = overrideMaterial; // restore
    renderer.setClearAlpha(clearAlpha);
  }

};
