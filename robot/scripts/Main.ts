/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../lib/babylon.gui.d.ts"/>

var COS30 = Math.cos(Math.PI / 6);

class Main {

    public canvas: HTMLCanvasElement;
	public camera: BABYLON.FreeCamera;
    public engine: BABYLON.Engine;
    public scene: BABYLON.Scene;
	public gameObjects: GameObject[] = [];
	public playerAction: PlayerAction;

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

	public getPointerWorldPos(): BABYLON.Vector2 {
		let pointerX = this.scene.pointerX / this.canvas.clientWidth;
		let pointerY = 1 - this.scene.pointerY / this.canvas.clientHeight;
		let worldX = this.camera.orthoLeft + pointerX * (this.camera.orthoRight - this.camera.orthoLeft);
		let worldY = this.camera.orthoBottom + pointerY * (this.camera.orthoTop - this.camera.orthoBottom);
		document.getElementById("debug-pointer-xy").innerText = (pointerX * 100).toFixed(1) + " : " + (pointerY * 100).toFixed(1);
		return new BABYLON.Vector2(worldX, worldY);
	}

	public worldPosToPixel(w: BABYLON.Vector2): BABYLON.Vector2 {
		let px = (w.x - this.camera.orthoLeft) / (this.camera.orthoRight - this.camera.orthoLeft);
		let py = (w.y - this.camera.orthoBottom) / (this.camera.orthoTop - this.camera.orthoBottom);
		return new BABYLON.Vector2(
			px * this.canvas.clientWidth,
			(1 - py) * this.canvas.clientHeight
		);
	} 

    public async initializeScene(): Promise<void> {
		this.scene = new BABYLON.Scene(this.engine);
		this.scene.clearColor.copyFromFloats(158 / 255, 86 / 255, 55 / 255, 1);

		this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, - 10), this.scene);
		this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		this.resize();

		new BABYLON.DirectionalLight("light", BABYLON.Vector3.Forward(), this.scene);

		window.onresize = () => {
			this.resize();
		}

		BABYLON.Engine.ShadersRepository = "./shaders/";

		this.playerAction = new PlayerAction(this);

		let menu = new Menu(this);
		menu.initializeMenu();
		this.generateScene();
		menu.showIngameMenu();

		let test = new BABYLON.Mesh("test", this.scene);

		let testMaterial = new BABYLON.StandardMaterial("test-material", this.scene);
        testMaterial.diffuseTexture = new BABYLON.Texture("assets/building-loader-green.png", this.scene);
		testMaterial.diffuseTexture.hasAlpha = true;
        testMaterial.specularColor.copyFromFloats(0, 0, 0);
		testMaterial.alphaCutOff = 0.5

		test.material = testMaterial;

		test.position.x = 8;
		test.position.z = - 2;
		
		let test2 = new BABYLON.Mesh("test2", this.scene);

		let test2Material = new BABYLON.StandardMaterial("test2-material", this.scene);
        test2Material.diffuseTexture = new BABYLON.Texture("assets/building-loader-red.png", this.scene);
		test2Material.diffuseTexture.hasAlpha = true;
        test2Material.specularColor.copyFromFloats(0, 0, 0);
		test2Material.alphaCutOff = 0.5

		test2.material = test2Material;

		test2.position.x = 8;
		test2.position.z = - 2;

		let a = 0;
		ArcPlane.CreateVertexData(1.25, 0, a).applyToMesh(test);
		ArcPlane.CreateVertexData(1.25, a, 0).applyToMesh(test2);

		let div = document.createElement("div");
		div.innerText = "0";
		div.style.position = "fixed";
		div.style.width = "100px";
		div.style.height = "50px";
		div.style.color = "white";
		div.style.textAlign = "center";
		div.style.fontSize = "45px";
		let p = this.worldPosToPixel(new BABYLON.Vector2(8, 0));
		div.style.left = (p.x - 50).toFixed(0) + "px";
		div.style.top = (p.y - 25).toFixed(0) + "px";
		div.style.zIndex = "2";
		document.body.appendChild(div);

		setInterval(
			() => {
				a += 5 * Math.PI / 180;
				if (a > 2 * Math.PI) {
					a = 0;
				}
				ArcPlane.CreateVertexData(1.25, 0, a).applyToMesh(test);
				ArcPlane.CreateVertexData(1.25, a, 0).applyToMesh(test2);
				div.innerText = ((a / (2 * Math.PI)) * 100).toFixed(0);
			},
			30
		)
	}

	public generateScene(): void {
		let walker = new Walker(this);
		let turret = new Turret(this);
		turret.base.position.x = - 5;
		turret.target = walker;

		for (let i = 0; i < 20; i++) {
			let rock = new Prop("rock_1", this);
			rock.sprite.position.x = - 20 + 40 * Math.random();
			rock.sprite.position.y = - 20 + 40 * Math.random();
			rock.sprite.rotation.z = 2 * Math.PI * Math.random();
		}
		
		let wallNode1 = new WallNode(this);
		wallNode1.sprite.position.x = - 4;
		wallNode1.sprite.position.y = 5;
		
		let wallNode2 = new WallNode(this);
		wallNode2.sprite.position.x = 7;
		wallNode2.sprite.position.y = 3;
		
		let wallNode3 = new WallNode(this);
		wallNode3.sprite.position.x = 6;
		wallNode3.sprite.position.y = -4;

		let wall1 = new Wall(wallNode1, wallNode2, this);
		let wall2 = new Wall(wallNode2, wallNode3, this);
	}

	public disposeScene(): void {
		while (this.gameObjects.length > 0) {
			this.gameObjects.pop().dispose();
		}
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