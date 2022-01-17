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

		let light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, - 1), this.scene);

		this.resize();

		window.onresize = () => {
			this.resize();
		}

		this.playerAction = new PlayerAction(this);

		let navgraphManager = new NavGraphManager(this);

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
            - 100, 0, - 100,
            - 100, 0, 100,
            100, 0, 100,
            100, 0, - 100
        );

        indices.push(
            0, 2, 1,
            0, 3, 2
        );

        uvs.push(
            0, 0,
            0, 7,
            7, 7,
            7, 0
        );

        data.positions = positions;
        data.indices = indices;
        data.uvs = uvs;

		data.applyToMesh(ground);

		ground.position.z = 2;

		let groundMaterial = new BABYLON.StandardMaterial("ground-material", this.scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture("assets/ground_2.png", this.scene);
		groundMaterial.diffuseColor.copyFromFloats(0.83, 0.33, 0.1);
		groundMaterial.diffuseColor = groundMaterial.diffuseColor.scale(1.4);
        groundMaterial.specularColor.copyFromFloats(0, 0, 0);
		
		ground.material = groundMaterial;

		BABYLON.SceneLoader.ImportMesh(
			"",
			"assets/command-center.babylon",
			"",
			this.scene,
			(meshes) => {
				let root = new BABYLON.Mesh("root");
				for (let i = 0; i < meshes.length; i++) {
					let mesh = meshes[i];
					mesh.parent = root;
					console.log(mesh.name);
				}
			}
		)
	}

	public generateScene(): void {
		let walker = new Walker(this);
		let turret = new Turret(this);
		turret.posX = - 5;
		turret.target = walker;
		turret.makeReady();

		for (let i = 0; i < 40; i++) {
			let n = Math.floor(2 * Math.random()) + 1;
			let rock = new Prop("rock_" + n.toFixed(0), this);
			rock.posX = - 40 + 80 * Math.random();
			rock.posY = - 40 + 80 * Math.random();
			rock.rot = 2 * Math.PI * Math.random();
		}
		
		let wallNode1 = new WallNode(this);
		wallNode1.posX = - 4;
		wallNode1.posY = 5;
		wallNode1.makeReady();
		
		let wallNode2 = new WallNode(this);
		wallNode2.posX = 7;
		wallNode2.posY = 3;
		wallNode2.makeReady();
		
		let wallNode3 = new WallNode(this);
		wallNode3.posX = 6;
		wallNode3.posY = -4;
		wallNode3.makeReady();

		let wall1 = new Wall(wallNode1, wallNode2, this);
		wall1.makeReady();
		let wall2 = new Wall(wallNode2, wallNode3, this);
		wall2.makeReady();
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