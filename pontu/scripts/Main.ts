/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../lib/babylon.gui.d.ts"/>

var COS30 = Math.cos(Math.PI / 6);

class Main {

    public canvas: HTMLCanvasElement;
	public camera: BABYLON.FreeCamera;
    public engine: BABYLON.Engine;
    public scene: BABYLON.Scene;
	public board: Board;
	public mainMenuContainer: HTMLDivElement;
	public currentLevel: Level;

    constructor(canvasElement: string) {
        this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
		this.mainMenuContainer = document.getElementById("main-menu") as HTMLDivElement;
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
	}
	
	public async initialize(): Promise<void> {
		await this.initializeScene();
		this.initializeMainMenu();
	}

	public resize(): void {
		let ratio = this.canvas.clientWidth / this.canvas.clientHeight;
		if (ratio >= 1) {
			this.camera.orthoTop = - 6 * 4;
			this.camera.orthoRight = - 6 * 4 * ratio;
			this.camera.orthoLeft = 6 * 4 * ratio;
			this.camera.orthoBottom = 6 * 4;
		}
		else {
			this.camera.orthoTop = - 6 * 4 / ratio;
			this.camera.orthoRight = - 6 * 4;
			this.camera.orthoLeft = 6 * 4;
			this.camera.orthoBottom = 6 * 4 / ratio;
		}
		this.centerMainMenu();
	}

	public centerMainMenu(): void {
		let w = Math.max(this.canvas.clientWidth * 0.5, 600);
		let left = (this.canvas.clientWidth - w) * 0.5;

		this.mainMenuContainer.style.width = w.toFixed(0) + "px";
		this.mainMenuContainer.style.left = left.toFixed(0) + "px";
	}

	public showMainMenu(): void {
		this.mainMenuContainer.style.display = "block";
	}

	public hideMainMenu(): void {
		this.mainMenuContainer.style.display = "none";
	}

	public xToLeft(x: number): number {
		return 1 - (x - this.camera.orthoLeft) / this.sceneWidth;
	}

	public xToRight(x: number): number {
		return 1 + (x - this.camera.orthoRight) / this.sceneWidth;
	}

	public yToTop(y: number): number {
		return 1 + (y - this.camera.orthoTop) / this.sceneHeight;
	}

	public yToBottom(y: number): number {
		return 1 - (y - this.camera.orthoBottom) / this.sceneHeight;
	}

	public get sceneWidth(): number {
		return this.camera.orthoRight - this.camera.orthoLeft;
	}

	public get sceneHeight(): number {
		return this.camera.orthoTop - this.camera.orthoBottom;
	}

    public async initializeScene(): Promise<void> {
		this.scene = new BABYLON.Scene(this.engine);

		this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 10, 0), this.scene);
		this.camera.rotation.x = Math.PI / 2 - 0.1;
		this.camera.rotation.z = Math.PI;
		this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		this.resize();

		new BABYLON.DirectionalLight("light", BABYLON.Vector3.Down(), this.scene);

		window.onresize = () => {
			this.resize();
		}

		BABYLON.Engine.ShadersRepository = "./shaders/";
        
		this.scene.clearColor = BABYLON.Color4.FromHexString("#00000000");

		this.board = new Board(this);

		let pickPlane = BABYLON.MeshBuilder.CreateGround("pick-plane", { width: 50, height: 50 }, this.scene);
		pickPlane.isVisible = false;

		/*
		let aiDepth = 1;

		let playSolo = false;
		this.scene.onPointerObservable.add((eventData: BABYLON.PointerInfo) => {
			let pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => { return m === pickPlane; });
			if (pick && pick.pickedPoint) {
				let cell = this.cellNetwork.worldPosToCell(pick.pickedPoint);
				if (cell.canRotate()) {
					this.setPickedCell(cell);
				}
			}
			let reverse = false;
			if (this.pickedCell && pick.pickedPoint) {
				reverse = this.pickedCell.barycenter3D.x < pick.pickedPoint.x;
			}
			this.selected.reverse = reverse;
			if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
				if (this.pickedCell) {
					this.cellNetwork.morphCell(
						0,
						this.pickedCell,
						reverse,
						() => {
							this.cellNetwork.checkSurround(
								() => {
									scoreDisplay.update();
									if (playSolo) {
										return;
									}
									let aiMove = ai.getMove2(2, aiDepth);
									if (aiMove.cell) {
										this.cellNetwork.morphCell(
											2,
											aiMove.cell,
											aiMove.reverse,
											() => {
												this.cellNetwork.checkSurround(
													() => {
														scoreDisplay.update();
													}
												);
											}
										);
									}
								}
							);
						}
					);
				}
			}
		})
		*/
	}

	public initializeMainMenu(): void {
		document.getElementById("level-solo").addEventListener("pointerup", () => {
			this.currentLevel = new LevelRandomSolo(this);
			this.currentLevel.initialize();
		});
		document.getElementById("level-vs-ai").addEventListener("pointerup", () => {
			this.currentLevel = new LevelHumanVsAI(this);
			this.currentLevel.initialize();
		});
	}
	
    public animate(): void {
		let fpsInfoElement = document.getElementById("fps-info");
		let meshesInfoTotalElement = document.getElementById("meshes-info-total");
		let meshesInfoNonStaticUniqueElement = document.getElementById("meshes-info-nonstatic-unique");
		let meshesInfoStaticUniqueElement = document.getElementById("meshes-info-static-unique");
		let meshesInfoNonStaticInstanceElement = document.getElementById("meshes-info-nonstatic-instance");
		let meshesInfoStaticInstanceElement = document.getElementById("meshes-info-static-instance");
        this.engine.runRenderLoop(() => {
			this.scene.render();
			fpsInfoElement.innerText = this.engine.getFps().toFixed(0) + " fps";
			let uniques = this.scene.meshes.filter(m => { return !(m instanceof BABYLON.InstancedMesh); });
			let uniquesNonStatic = uniques.filter(m => { return !m.isWorldMatrixFrozen; });
			let uniquesStatic = uniques.filter(m => { return m.isWorldMatrixFrozen; });
			let instances = this.scene.meshes.filter(m => { return m instanceof BABYLON.InstancedMesh; });
			let instancesNonStatic = instances.filter(m => { return !m.isWorldMatrixFrozen; });
			let instancesStatic = instances.filter(m => { return m.isWorldMatrixFrozen; });
			meshesInfoTotalElement.innerText = this.scene.meshes.length.toFixed(0).padStart(4, "0");
			meshesInfoNonStaticUniqueElement.innerText = uniquesNonStatic.length.toFixed(0).padStart(4, "0");
			meshesInfoStaticUniqueElement.innerText = uniquesStatic.length.toFixed(0).padStart(4, "0");
			meshesInfoNonStaticInstanceElement.innerText = instancesNonStatic.length.toFixed(0).padStart(4, "0");
			meshesInfoStaticInstanceElement.innerText = instancesStatic.length.toFixed(0).padStart(4, "0");
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

	document.getElementById("cell-network-info").style.display = "none";
	document.getElementById("meshes-info").style.display = "none";
	//document.getElementById("debug-info").style.display = "none";
})