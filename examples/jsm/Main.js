/**
 * @author Francico Avila - http://franciscoavila.mx
 */

import { RenderWithVtShader } from './RenderWithVtShader.js';
import { VirtualTexture } from '../../src/VirtualTexture.js';
import { TileDeterminationDebug } from '../../src/TileDeterminationDebug.js';
import { IndirectionTableDebug } from '../../src/IndirectionTableDebug.js';
import { CacheDebug } from '../../src/CacheDebug.js';
import { Clock, WebGLRenderer, Scene, PerspectiveCamera, Mesh } from '../jsm/three.module.js';
import { MapControls } from '../jsm/OrbitControls.js';
import { WEBGL } from '../jsm/WebGL.js';

export class APP {
  constructor(canvas) {
    this.domContainer = document.getElementById(canvas || "canvas_container");
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.clock = new Clock();

    this.virtualTexture = null;
    console.log("h: toggle debug last hits")
    console.log("l: toggle debug level")
    console.log("e: toggle cache debuger visibility")
    console.log("a: toggle indirection table debuger visibility")
    console.log("z: toggle tile determination debuger visibility")
    console.log("d: toggle debug tiles (resets cache)")
    console.log("k: reset cache")
    console.log("t: change virtual texture filtering mode")
    console.log("i: show cache status")
  }

  onKeyDown(event) {
    const vt = this.virtualTexture;
    switch(event.key) {
      case "h": vt.debugLastHits = !vt.debugLastHits; break;
      case "l": vt.debugLevel = !vt.debugLevel; break;
      case "e": this.cacheDebug.hidden = !this.cacheDebug.hidden; break;
      case "a": this.indirectionTableDebug.hidden = !this.indirectionTableDebug.hidden; break;
      case "z": this.tileDeterminationDebug.hidden = !this.tileDeterminationDebug.hidden; break;
      case "d": vt.cache.debug = !vt.cache.debug; vt.resetCache(); break;
      case "k": vt.resetCache(); break;
      case "t":
        const textureModes = ["textureGrad", "textureLod", "textureBasic", "textureGradBasic"];//, "textureGrad0", "textureLod0"];
        vt.textureMode = (vt.textureMode +1) % textureModes.length;
        console.log(textureModes[vt.textureMode]);
        break;
      case "i": console.log(vt.cache.getStatus()); break;
      default: return; break;
    }
    vt.updateUniforms(this.material);
    event.preventDefault();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.virtualTexture.setSize(w, h);
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
  }

  run() {
    var delta = this.clock.getDelta();

    this.controls.update(delta);
    requestAnimationFrame(this.run.bind(this));

    this.render();
  }

  start() {

    if ( !WEBGL.isWebGL2Available() ) {

      document.body.appendChild(WEBGL.getWebGL2ErrorMessage());
      return false;

    }

    var width = window.innerWidth;
    var height = window.innerHeight;

    this.renderer = new WebGLRenderer();
    this.renderer.renderCount = 0;
    this.renderer.setSize(width, height);
    this.renderer.extensions.get("OES_texture_float_linear");
    this.domContainer.appendChild(this.renderer.domElement);

    // create a scene
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000);
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

    this.virtualTexture = new VirtualTexture(config);
    this.material = this.virtualTexture.createMaterial(RenderWithVtShader, 'vt');
    const mesh = new Mesh(geometry, this.material);
    this.scene.add(mesh);

    // init debug helpers
    this.tileDeterminationDebug = new TileDeterminationDebug(this.virtualTexture, {hidden: true});
    this.indirectionTableDebug = new IndirectionTableDebug(this.virtualTexture, {hidden: true});
    this.cacheDebug = new CacheDebug(this.virtualTexture, {hidden: true});
  }
};
