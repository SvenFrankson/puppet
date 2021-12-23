/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../lib/babylon.gui.d.ts"/>

var COS30 = Math.cos(Math.PI / 6);

class Main {

    public canvas: HTMLCanvasElement;
	public camera: BABYLON.FreeCamera;
    public engine: BABYLON.Engine;
    public scene: BABYLON.Scene;
	public cellNetwork: CellNetworkDisplayed;
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
			this.camera.orthoTop = 40;
			this.camera.orthoRight = 40 * ratio;
			this.camera.orthoLeft = - 40 * ratio;
			this.camera.orthoBottom = - 40;
		}
		else {
			this.camera.orthoTop = 40 / ratio;
			this.camera.orthoRight = 40;
			this.camera.orthoLeft = - 40;
			this.camera.orthoBottom = - 40 / ratio;
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
		return (x - this.camera.orthoLeft) / this.sceneWidth;
	}

	public xToRight(x: number): number {
		return - (x - this.camera.orthoRight) / this.sceneWidth;
	}

	public yToTop(y: number): number {
		return - (y - this.camera.orthoTop) / this.sceneHeight;
	}

	public yToBottom(y: number): number {
		return (y - this.camera.orthoBottom) / this.sceneHeight;
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
		this.camera.rotation.x = Math.PI / 2;
		this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		this.resize();

		new BABYLON.DirectionalLight("light", BABYLON.Vector3.Down(), this.scene);

		window.onresize = () => {
			this.resize();
		}

		BABYLON.Engine.ShadersRepository = "./shaders/";
        
		this.scene.clearColor = BABYLON.Color4.FromHexString("#00000000");

		this.cellNetwork = new CellNetworkDisplayed(this);
		this.selected = new CellSelector(this.cellNetwork);

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
		document.getElementById("level-random-solo-s").addEventListener("pointerup", () => {
			this.currentLevel = new LevelRandomSolo(this, 150);
			this.currentLevel.initialize();
		});
		document.getElementById("level-random-solo-m").addEventListener("pointerup", () => {
			this.currentLevel = new LevelRandomSolo(this, 300);
			this.currentLevel.initialize();
		});
		document.getElementById("level-random-solo-l").addEventListener("pointerup", () => {
			this.currentLevel = new LevelRandomSolo(this, 450);
			this.currentLevel.initialize();
		});
		document.getElementById("level-random-ai-vs-ai-s").addEventListener("pointerup", () => {
			this.currentLevel = new LevelRandomAIVsAI(this, 150);
			this.currentLevel.initialize();
		});
		document.getElementById("level-random-ai-vs-ai-m").addEventListener("pointerup", () => {
			this.currentLevel = new LevelRandomAIVsAI(this, 300);
			this.currentLevel.initialize();
		});
		document.getElementById("level-random-ai-vs-ai-l").addEventListener("pointerup", () => {
			this.currentLevel = new LevelRandomAIVsAI(this, 450);
			this.currentLevel.initialize();
		});
	}

	public selected: CellSelector;
	public pickedCell: Cell;
	public setPickedCell(cell: Cell): void {
		if (cell === this.pickedCell) {
			return;
		}
		if (cell && cell.value != 0) {
			return this.setPickedCell(undefined);
		}
		if (this.pickedCell) {
			if (!this.pickedCell.isMeshDisposed) {
				this.pickedCell.highlightStatus = 0;
				this.pickedCell.updateShape();
				this.pickedCell.shape.position.y = 0;
				this.pickedCell.neighbors.forEach(n => {
					n.highlightStatus = 0;
					n.updateShape();
					n.shape.position.y = 0;
				})
			}
		}
		this.pickedCell = cell;
		if (this.pickedCell) {
			if (!this.pickedCell.isMeshDisposed) {
				this.pickedCell.highlightStatus = 2;
				this.pickedCell.updateShape();
				this.pickedCell.shape.position.y = 0.01;
				this.pickedCell.neighbors.forEach(n => {
					n.highlightStatus = 1;
					n.updateShape();
					n.shape.position.y = 0.01 + Math.random() * 0.009;
				})
			}
		}
		this.selected.update(this.pickedCell);
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

	let debugColorP0 = document.getElementById("debug-p0-color") as HTMLInputElement;
	debugColorP0.addEventListener("input", (e) => {
		Cell.Colors[0] = BABYLON.Color4.FromHexString((e.currentTarget as HTMLInputElement).value + "FF");
		console.log("Color 0 = " + Cell.Colors[0].toHexString());
		main.cellNetwork.cells.forEach(c => {
			c.updateShape();
		})
	});
	debugColorP0.value = Cell.Colors[0].toHexString().substring(0, 7);
	
	let debugColorP1 = document.getElementById("debug-p1-color") as HTMLInputElement;
	debugColorP1.addEventListener("input", (e) => {
		Cell.Colors[1] = BABYLON.Color4.FromHexString((e.currentTarget as HTMLInputElement).value + "FF");
		console.log("Color 1 = " + Cell.Colors[1].toHexString());
		main.cellNetwork.cells.forEach(c => {
			c.updateShape();
		})
	});
	debugColorP1.value = Cell.Colors[1].toHexString().substring(0, 7);

	let debugColorP2 = document.getElementById("debug-p2-color") as HTMLInputElement;
	debugColorP2.addEventListener("input", (e) => {
		Cell.Colors[2] = BABYLON.Color4.FromHexString((e.currentTarget as HTMLInputElement).value + "FF");
		console.log("Color 2 = " + Cell.Colors[2].toHexString());
		main.cellNetwork.cells.forEach(c => {
			c.updateShape();
		})
	});
	debugColorP2.value = Cell.Colors[2].toHexString().substring(0, 7);
})