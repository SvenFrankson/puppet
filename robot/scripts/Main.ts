/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../lib/babylon.gui.d.ts"/>

var COS30 = Math.cos(Math.PI / 6);

class Main {

    public canvas: HTMLCanvasElement;
	public camera: BABYLON.FreeCamera;
    public engine: BABYLON.Engine;
    public scene: BABYLON.Scene;

    constructor(canvasElement: string) {
        this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
	}
	
	public async initialize(): Promise<void> {
		await this.initializeScene();
	}

	public ratio: number = 1;

	public resize(): void {
		this.resizeCamera();
	}

	public resizeCamera(): void {
		let w = this.canvas.clientWidth;
		let h = this.canvas.clientHeight;

		let r = w / h;

		if (r > 1) {
			this.camera.orthoLeft = - 10 * r;
			this.camera.orthoRight = 10 * r;
			this.camera.orthoTop = 10;
			this.camera.orthoBottom = - 10;
		}
		else {
			this.camera.orthoLeft = - 10;
			this.camera.orthoRight = 10;
			this.camera.orthoTop = 10 / r;
			this.camera.orthoBottom = - 10 / r;
		}
	}

    public async initializeScene(): Promise<void> {
		this.scene = new BABYLON.Scene(this.engine);
		this.scene.clearColor.copyFromFloats(1, 1, 1, 1);

		this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, - 10), this.scene);
		this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		this.resize();

		new BABYLON.DirectionalLight("light", BABYLON.Vector3.Forward(), this.scene);

		window.onresize = () => {
			this.resize();
		}

		BABYLON.Engine.ShadersRepository = "./shaders/";

		let walker = new Walker(this.scene, this.canvas);
		let turret = new Turret(this.scene, this.canvas);
		turret.base.position.x = - 5;
		turret.target = walker;
	}
	
    public animate(): void {
        this.engine.runRenderLoop(() => {
			this.resizeCamera();
			this.scene.render();
        });

        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }
}

window.addEventListener("load", async () => {
	let main: Main = new Main("render-canvas");
	await main.initialize();
	main.animate();
})