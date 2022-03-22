/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../lib/babylon.gui.d.ts"/>
var COS30 = Math.cos(Math.PI / 6);
class Main {
    constructor(canvasElement) {
        this.canvas = document.getElementById(canvasElement);
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
    }
    async initialize() {
        await this.initializeScene();
    }
    async initializeScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor.copyFromFloats(158 / 255, 86 / 255, 55 / 255, 1);
        this.camera = new BABYLON.FreeCamera("camera", BABYLON.Vector3.Zero(), this.scene);
        BABYLON.Engine.ShadersRepository = "./shaders/";
    }
    animate() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }
}
window.addEventListener("load", async () => {
    let main = new Main("render-canvas");
    await main.initialize();
    main.animate();
});
function quickPow2(n) {
    if (n === 4) {
        return 16;
    }
    else if (n === 3) {
        return 8;
    }
    else if (n === 2) {
        return 4;
    }
    else if (n === 1) {
        return 2;
    }
    return Math.pow(2, n);
}
class OctreeNode {
    constructor(level, parent) {
        this.level = level;
        this.parent = parent;
    }
}
class Octree extends OctreeNode {
    constructor(maxLevel = 4) {
        super(maxLevel, undefined);
        this.maxLevel = maxLevel;
        this._size = Math.pow(2, this.maxLevel);
    }
    get size() {
        return this._size;
    }
}
