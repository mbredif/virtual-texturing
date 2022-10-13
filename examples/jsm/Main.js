/**
 * @author Francico Avila - http://franciscoavila.mx
 */

import { RenderWithVtShader } from './RenderWithVtShader.js';
import { VirtualTexture } from '../../src/VirtualTexture.js';
import { TileDeterminationDebug } from '../../src/TileDeterminationDebug.js';
import { IndirectionTableDebug } from '../../src/IndirectionTableDebug.js';
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
    console.log("c: toggle debug cache")
    console.log("a: toggle indirection table debuger visibility")
    console.log("z: toggle tile determination debuger visibility")
    console.log("k: reset cache")
    console.log("t: change virtual texture filtering mode")
    console.log("i: show cache status")
  }

  onKeyDown(event) {
    switch(event.key) {
      case "h": this.virtualTexture.debugLastHits = !this.virtualTexture.debugLastHits; break;
      case "l": this.virtualTexture.debugLevel = !this.virtualTexture.debugLevel; break;
      case "c": this.virtualTexture.debugCache = !this.virtualTexture.debugCache; break;
      case "z": this.tileDeterminationDebug.hidden = !this.tileDeterminationDebug.hidden; break;
      case "a": this.indirectionTableDebug.hidden = !this.indirectionTableDebug.hidden; break;
      case "k": this.virtualTexture.resetCache(); break;
      case "t":
        const textureModes = ["textureGrad", "textureLod", "textureBasic", "textureGradBasic"];//, "textureGrad0", "textureLod0"];
        this.virtualTexture.textureMode = (this.virtualTexture.textureMode +1) % textureModes.length;
        console.log(textureModes[this.virtualTexture.textureMode]);
        break;
      case "i": console.log(this.virtualTexture.cache.getStatus()); break;
      default: return; break;
    }
    this.virtualTexture.updateUniforms(this.material);
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
  }
};
