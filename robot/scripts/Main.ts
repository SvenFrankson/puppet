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
	public ground: BABYLON.Mesh;
	public navGraphManager: NavGraphManager;
	public game: Game;
	public menu: Menu;

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
		let pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, m => { return m === this.ground; });
		let worldX = 0;
		let worldY = 0;
		if (pick && pick.hit) {
			worldX = pick.pickedPoint.x;
			worldY = pick.pickedPoint.z;
		}
		document.getElementById("debug-pointer-xy").innerText = (worldX).toFixed(1) + " : " + (worldY).toFixed(1);
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

		this.navGraphManager = new NavGraphManager(this);

		this.playerAction = new PlayerAction(this);

		this.menu = new Menu(this);
		this.menu.initializeMenu();
		this.menu.showIngameMenu();

		this.cameraManager = new CameraManager(this);
		this.cameraManager.initialize();
		//this.cameraManager.moveCenter(- 15, - 5);

		let light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, - 1), this.scene);
		
		BABYLON.Engine.ShadersRepository = "./shaders/";

		this.resize();

		window.onresize = () => {
			this.resize();
		}

		this.game = new Game(this);
		this.game.credit(300);

		this.ground = new BABYLON.Mesh("ground", this.scene);

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

		data.applyToMesh(this.ground);

		let groundMaterial = new BABYLON.StandardMaterial("ground-material", this.scene);
        //groundMaterial.diffuseTexture = new BABYLON.Texture("assets/ground_2.png", this.scene);
		groundMaterial.diffuseColor.copyFromFloats(0.83, 0.33, 0.1);
		groundMaterial.diffuseColor = groundMaterial.diffuseColor.scale(1.4);
        groundMaterial.specularColor.copyFromFloats(0, 0, 0);
		
		this.ground.material = groundMaterial;

		this.generateScene();
	}

	public generateScene(): void {
		for (let i = 0; i < 40; i++) {
			let n = Math.floor(2 * Math.random()) + 1;
			let rock = new Prop("rock_" + n.toFixed(0), this);
			rock.posX = - 40 + 80 * Math.random();
			rock.posY = - 40 + 80 * Math.random();
			rock.rot = 2 * Math.PI * Math.random();
		}

		let commandCenter = new CommandCenter(this);
		commandCenter.posX = - 30;
		commandCenter.posY = - 30;
		commandCenter.makeReady();

		/*
		let beacon = new Beacon(this);
		beacon.posX = 15;
		beacon.posY = 5;
		beacon.makeReady();
		*/

		let robot = new Robot(this);
		robot.mode = RobotMode.Run;
		this.cameraManager.camera.setTarget(robot.target);
		this.cameraManager.camera.beta = Math.PI / 3;
		this.cameraManager.camera.radius = 15;

		for (let i = 0; i < 1; i++) {
			new Robot(this);
		}
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