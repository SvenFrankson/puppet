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
	public endGamePanel: HTMLDivElement;
	public currentLevel: Level;

    constructor(canvasElement: string) {
        this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
		this.mainMenuContainer = document.getElementById("main-menu-panel") as HTMLDivElement;
		this.endGamePanel = document.getElementById("end-game-panel") as HTMLDivElement;
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
	}
	
	public async initialize(): Promise<void> {
		await this.initializeScene();
		this.initializeMainMenu();
	}

	public ratio: number = 1;

	public resize(): void {
		this.ratio = this.canvas.clientWidth / this.canvas.clientHeight;
		let n = 6;
		if (Math.abs(this.ratio - 1) < 1 / 6) {
			n = 8;
		}
		else if (Math.abs(this.ratio - 1) < 1 / 3) {
			n = 7;
		}
		if (this.ratio >= 1) {
			this.camera.orthoTop = - n * 4;
			this.camera.orthoRight = - n * 4 * this.ratio;
			this.camera.orthoLeft = n * 4 * this.ratio;
			this.camera.orthoBottom = n * 4;
		}
		else {
			this.camera.orthoTop = - n * 4 / this.ratio;
			this.camera.orthoRight = - n * 4;
			this.camera.orthoLeft = n * 4;
			this.camera.orthoBottom = n * 4 / this.ratio;
		}
		this.centerMainMenu();
	}

	public centerMainMenu(): void {
		let w = Math.max(this.canvas.clientWidth * 0.5, 350);
		let left = (this.canvas.clientWidth - w) * 0.5;

		this.mainMenuContainer.style.width = w.toFixed(0) + "px";
		this.mainMenuContainer.style.left = left.toFixed(0) + "px";

		this.endGamePanel.style.width = w.toFixed(0) + "px";
		this.endGamePanel.style.left = left.toFixed(0) + "px";
	}

	public showMainMenu(): void {
		this.mainMenuContainer.style.display = "block";
		this.hideEndGame();
	}

	public hideMainMenu(): void {
		this.mainMenuContainer.style.display = "none";
	}

	public showEndGame(result: number): void {
		if (result === 0) {
			document.getElementById("end-game-result").innerText = "you win ! :)";
		}
		if (result === 1) {
			document.getElementById("end-game-result").innerText = "you loose... :(";
		}
		if (result === 2) {
			document.getElementById("end-game-result").innerText = "draw";
		}
		this.endGamePanel.style.display = "block";
	}

	public hideEndGame(): void {
		this.endGamePanel.style.display = "none";
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
		document.getElementById("end-game-back").addEventListener("pointerup", () => {
			if (this.currentLevel) {
				this.currentLevel.dispose();
			}
			this.showMainMenu();
		});
		document.getElementById("coder").addEventListener("pointerup", () => {
			window.open("https://svenfrankson.github.io/");
		});
		document.getElementById("author").addEventListener("pointerup", () => {
			window.open("https://fr.wikipedia.org/wiki/Bernhard_Weber");
		});
		document.getElementById("owner").addEventListener("pointerup", () => {
			window.open("https://www.gamefactory-spiele.com/punto");
		})
		this.showMainMenu();
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