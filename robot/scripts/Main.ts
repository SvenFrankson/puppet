/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../lib/babylon.gui.d.ts"/>

var COS30 = Math.cos(Math.PI / 6);

class Main {

    public canvas: HTMLCanvasElement;
    public engine: BABYLON.Engine;
    public scene: BABYLON.Scene;
	public cameraManager: CameraManager;
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
		this.cameraManager.resize();
	}

	public getPointerWorldPos(): BABYLON.Vector2 {
		let pointerX = this.scene.pointerX / this.canvas.clientWidth;
		let pointerY = 1 - this.scene.pointerY / this.canvas.clientHeight;
		let worldX = this.cameraManager.camera.orthoLeft + pointerX * (this.cameraManager.camera.orthoRight - this.cameraManager.camera.orthoLeft);
		let worldY = this.cameraManager.camera.orthoBottom + pointerY * (this.cameraManager.camera.orthoTop - this.cameraManager.camera.orthoBottom);
		document.getElementById("debug-pointer-xy").innerText = (pointerX * 100).toFixed(1) + " : " + (pointerY * 100).toFixed(1);
		return new BABYLON.Vector2(worldX, worldY);
	}

	public worldPosToPixel(w: BABYLON.Vector2): BABYLON.Vector2 {
		let px = (w.x - this.cameraManager.camera.orthoLeft) / (this.cameraManager.camera.orthoRight - this.cameraManager.camera.orthoLeft);
		let py = (w.y - this.cameraManager.camera.orthoBottom) / (this.cameraManager.camera.orthoTop - this.cameraManager.camera.orthoBottom);
		return new BABYLON.Vector2(
			px * this.canvas.clientWidth,
			(1 - py) * this.canvas.clientHeight
		);
	} 

    public async initializeScene(): Promise<void> {
		this.scene = new BABYLON.Scene(this.engine);
		this.scene.clearColor.copyFromFloats(158 / 255, 86 / 255, 55 / 255, 1);

		this.cameraManager = new CameraManager(this);
		this.cameraManager.initialize();

		this.resize();

		new BABYLON.DirectionalLight("light", BABYLON.Vector3.Forward(), this.scene);

		window.onresize = () => {
			this.resize();
		}

		this.playerAction = new PlayerAction(this);

		let menu = new Menu(this);
		menu.initializeMenu();
		this.generateScene();
		menu.showIngameMenu();

		let ground = new BABYLON.Mesh("ground", this.scene);

		let data = new BABYLON.VertexData();
        
        let positions: number[] = [];
        let indices: number[] = [];
        let uvs: number[] = [];

        positions.push(
            - 100, - 100, 0,
            - 100, 100, 0,
            100, 100, 0,
            100, - 100, 0
        );

        indices.push(
            0, 2, 1,
            0, 3, 2
        );

        uvs.push(
            0, 0,
            0, 15,
            15, 15,
            15, 0
        );

        data.positions = positions;
        data.indices = indices;
        data.uvs = uvs;

		data.applyToMesh(ground);

		ground.position.z = 2;

		let groundMaterial = new BABYLON.StandardMaterial("ground-material", this.scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture("assets/ground.png", this.scene);
        groundMaterial.specularColor.copyFromFloats(0, 0, 0);
		
		ground.material = groundMaterial;
	}

	public generateScene(): void {
		let walker = new Walker(this);
		let turret = new Turret(this);
		turret.base.position.x = - 5;
		turret.target = walker;

		for (let i = 0; i < 40; i++) {
			let n = Math.floor(2 * Math.random()) + 1;
			let rock = new Prop("rock_" + n.toFixed(0), this);
			rock.sprite.position.x = - 40 + 80 * Math.random();
			rock.sprite.position.y = - 40 + 80 * Math.random();
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