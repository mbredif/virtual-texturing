/**
 * @author Francico Avila - http://franciscoavila.mx
 */

import { RenderWithVtShader } from './RenderWithVtShader.js';
import { VirtualTexture } from '../../src/VirtualTexture.js';
import { TileDeterminationDebug } from '../../src/TileDeterminationDebug.js';
import { IndirectionTableDebug } from '../../src/IndirectionTableDebug.js';
import { CacheDebug } from '../../src/CacheDebug.js';
import { Clock, WebGLRenderer, Scene, PerspectiveCamera, Mesh, TextureLoader } from '../jsm/three.module.js';
import { MapControls } from '../jsm/MapControls.js';
import { ShaderMaterial } from '../jsm/three.module.js';
import WebGL from '../jsm/WebGL.js';

function createStats() {
  var stats = new Stats();
  stats.setMode(0);

  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0';
  stats.domElement.style.top = '0';

  return stats;
}

export class APP {
  constructor(canvas) {
    this.domContainer = document.getElementById(canvas || "canvas_container");
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.clock = new Clock();
    this.stats = createStats();
    document.body.appendChild( this.stats.dom );

    this.virtualTexture = null;
    console.log("h: toggle debug last hits");
    console.log("l: toggle debug level");
    console.log("a: toggle tile determination debuger visibility");
    console.log("z: toggle indirection table debuger visibility");
    console.log("e: toggle cache debuger visibility");
    console.log("d: toggle debug tiles (resets cache)");
    console.log("k: reset cache");
    console.log("/: textureGrad filtering");
    console.log("*: textureLod  filtering");
    console.log("-: texture     filtering");
  }

  onKeyDown(event) {
    const vt = this.virtualTexture;
    const uniforms = this.material.uniforms;
    switch(event.key) {
      case "h": vt.debugLastHits = !vt.debugLastHits; break;
      case "l": vt.debugLevel = !vt.debugLevel; break;
      case "a": this.tileDeterminationDebug.hidden = !this.tileDeterminationDebug.hidden; break;
      case "z": this.indirectionTableDebug.hidden = !this.indirectionTableDebug.hidden; break;
      case "e": this.cacheDebug.hidden = !this.cacheDebug.hidden; break;
      case "d": vt.cache.debug = !vt.cache.debug; vt.resetCache(); break;
      case "k": vt.resetCache(); break;
      case "/": vt.textureMode = 0; console.log('textureGrad'); break;
      case "*": vt.textureMode = 1; console.log('textureLod'); break;
      case "-": vt.textureMode = 2; console.log('texture'); break;
      default :
        return;
    }
    vt.tileDetermination.visibleTileMaterial.uniforms.iTextureMode.value = vt.textureMode;
    uniforms.bDebugLevel.value = vt.debugLevel;
    uniforms.bDebugLastHits.value = vt.debugLastHits;
    uniforms.iTextureMode.value = vt.textureMode;
    event.preventDefault();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.virtualTexture) this.virtualTexture.tileDetermination.setSize(w, h);
  }

  render() {
    ++this.renderer.renderCount;
    if (this.virtualTexture) {
      this.virtualTexture.update(this.renderer, this.scene, this.camera);
      this.tileDeterminationDebug.update();
      this.indirectionTableDebug.update();
      this.cacheDebug.update();
    }
    this.renderer.render(this.scene, this.camera);
    this.stats.update();
  }

  run() {
    var delta = this.clock.getDelta();

    this.controls.update(delta);
    requestAnimationFrame(this.run.bind(this));

    this.render();
  }

  start() {

    if ( !WebGL.isWebGL2Available() ) {

      document.body.appendChild(WebGL.getWebGL2ErrorMessage());
      return false;

    }

    this.renderer = new WebGLRenderer();
    this.renderer.renderCount = 0;
    this.renderer.extensions.get("OES_texture_float_linear");
    this.domContainer.appendChild(this.renderer.domElement);

    // create a scene
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(60, 1, 0.01, 1000);
    this.camera.position.set(0.0, 0.0, 80.0);
    this.scene.add(this.camera);

  /**********************************************************************************/

    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.screenSpacePanning = true;

    window.addEventListener('resize', this.resize.bind(this), false);
    window.addEventListener('keydown', this.onKeyDown.bind(this), false);
    return true;
  }

  load(geometry, config) {

    this.material = new ShaderMaterial(RenderWithVtShader);
    this.virtualTexture = new VirtualTexture(config);
    this.material.uniforms.vt.value = this.virtualTexture;
    const mesh = new Mesh(geometry, this.material);
    this.scene.add(mesh);


    // init debug helpers
    this.tileDeterminationDebug = new TileDeterminationDebug(this.virtualTexture, {hidden: true});
    this.indirectionTableDebug = new IndirectionTableDebug(this.virtualTexture, {hidden: true});
    this.cacheDebug = new CacheDebug(this.virtualTexture, {hidden: true});

    this.resize();
  }
};
