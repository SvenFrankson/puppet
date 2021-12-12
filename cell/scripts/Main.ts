/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../lib/babylon.gui.d.ts"/>

var COS30 = Math.cos(Math.PI / 6);

class Main {

    public canvas: HTMLCanvasElement;
    public engine: BABYLON.Engine;
    public scene: BABYLON.Scene;
	public light: BABYLON.Light;
	public skyBox: BABYLON.Mesh;
	public environmentTexture: BABYLON.CubeTexture;

    constructor(canvasElement: string) {
        this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
	}
	
	public async initialize(): Promise<void> {
		await this.initializeScene();
	}

	public async loadMesh(modelName: string): Promise<BABYLON.Mesh> {
		return new Promise<BABYLON.Mesh> (
			resolve => {
				BABYLON.SceneLoader.ImportMesh(
					"",
					"./assets/models/" + modelName + ".babylon",
					"",
					this.scene,
					(meshes) => {
						let mesh = meshes[0];
						if (mesh instanceof BABYLON.Mesh) {
							mesh.position.copyFromFloats(0, - 10, 0);
							let mat = mesh.material;
							if (mat instanceof BABYLON.StandardMaterial) {
								mat.specularColor.copyFromFloats(0, 0, 0);
							}
							else if (mat instanceof BABYLON.MultiMaterial) {
								mat.subMaterials.forEach(sm => {
									if (sm instanceof BABYLON.StandardMaterial) {
										sm.specularColor.copyFromFloats(0, 0, 0);
									}
								})
							}
							resolve(mesh);
						}
					}
				)
			}
		);
	}

	public async loadMeshes(modelName: string, hide: boolean = true): Promise<BABYLON.Mesh[]> {
		return new Promise<BABYLON.Mesh[]> (
			resolve => {
				BABYLON.SceneLoader.ImportMesh(
					"",
					"./assets/models/" + modelName + ".babylon",
					"",
					this.scene,
					(meshes) => {
						if (hide) {
							meshes.forEach(m => {
								m.position.copyFromFloats(0, - 10, 0);
								let mat = m.material;
								if (mat instanceof BABYLON.StandardMaterial) {
									mat.specularColor.copyFromFloats(0, 0, 0);
								}
								else if (mat instanceof BABYLON.MultiMaterial) {
									mat.subMaterials.forEach(sm => {
										if (sm instanceof BABYLON.StandardMaterial) {
											sm.specularColor.copyFromFloats(0, 0, 0);
										}
									})
								}
							});
						}
						resolve(meshes as BABYLON.Mesh[]);
					}
				)
			}
		);
	}

    public async initializeScene(): Promise<void> {
		this.scene = new BABYLON.Scene(this.engine);

		let camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, 0, 30, BABYLON.Vector3.Zero(), this.scene);
		camera.attachControl(this.canvas);

		this.light = new BABYLON.HemisphericLight("AmbientLight", new BABYLON.Vector3(1, 3, 2), this.scene);

		BABYLON.Effect.ShadersStore["EdgeFragmentShader"] = `
			#ifdef GL_ES
			precision highp float;
			#endif
			varying vec2 vUV;
			uniform sampler2D textureSampler;
			uniform sampler2D depthSampler;
			uniform float 		width;
			uniform float 		height;
			void make_kernel_color(inout vec4 n[9], sampler2D tex, vec2 coord)
			{
				float w = 1.0 / width;
				float h = 1.0 / height;
				n[0] = texture2D(tex, coord + vec2( -w, -h));
				n[1] = texture2D(tex, coord + vec2(0.0, -h));
				n[2] = texture2D(tex, coord + vec2(  w, -h));
				n[3] = texture2D(tex, coord + vec2( -w, 0.0));
				n[4] = texture2D(tex, coord);
				n[5] = texture2D(tex, coord + vec2(  w, 0.0));
				n[6] = texture2D(tex, coord + vec2( -w, h));
				n[7] = texture2D(tex, coord + vec2(0.0, h));
				n[8] = texture2D(tex, coord + vec2(  w, h));
			}
			void make_kernel_depth(inout float n[9], sampler2D tex, vec2 coord)
			{
				float w = 1.0 / width;
				float h = 1.0 / height;
				n[0] = texture2D(tex, coord + vec2( -w, -h)).r;
				n[1] = texture2D(tex, coord + vec2(0.0, -h)).r;
				n[2] = texture2D(tex, coord + vec2(  w, -h)).r;
				n[3] = texture2D(tex, coord + vec2( -w, 0.0)).r;
				n[4] = texture2D(tex, coord).r;
				n[5] = texture2D(tex, coord + vec2(  w, 0.0)).r;
				n[6] = texture2D(tex, coord + vec2( -w, h)).r;
				n[7] = texture2D(tex, coord + vec2(0.0, h)).r;
				n[8] = texture2D(tex, coord + vec2(  w, h)).r;
			}
			void main(void) 
			{
				vec4 d = texture2D(depthSampler, vUV);
				float depth = d.r * (2000.0 - 0.2) + 0.2;
				
				float nD[9];
				make_kernel_depth( nD, depthSampler, vUV );
				float sobel_depth_edge_h = nD[2] + (2.0*nD[5]) + nD[8] - (nD[0] + (2.0*nD[3]) + nD[6]);
				float sobel_depth_edge_v = nD[0] + (2.0*nD[1]) + nD[2] - (nD[6] + (2.0*nD[7]) + nD[8]);
				float sobel_depth = sqrt((sobel_depth_edge_h * sobel_depth_edge_h) + (sobel_depth_edge_v * sobel_depth_edge_v));
				float thresholdDepth = 0.002;

				vec4 n[9];
				make_kernel_color( n, textureSampler, vUV );
				vec4 sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
				vec4 sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);
				vec4 sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));
				float threshold = 0.2;
				
				gl_FragColor = vec4(n[4]) * 0.5;
				gl_FragColor.a = 1.0;
				if (sobel_depth < thresholdDepth || depth > 1000.) {
					if (max(sobel.r, max(sobel.g, sobel.b)) < threshold) {
						gl_FragColor = n[4];
					}
				}
			}
        `;
		BABYLON.Engine.ShadersRepository = "./shaders/";
        
		/*
		let depthMap = this.scene.enableDepthRenderer(camera).getDepthMap();
		
		let postProcess = new BABYLON.PostProcess("Edge", "Edge", ["width", "height"], ["depthSampler"], 1, camera);
		postProcess.onApply = (effect) => {
			effect.setTexture("depthSampler", depthMap);
			effect.setFloat("width", this.engine.getRenderWidth());
			effect.setFloat("height", this.engine.getRenderHeight());
		};
		*/

		this.scene.clearColor = BABYLON.Color4.FromHexString("#3a2e47FF");
		//this.scene.clearColor = BABYLON.Color4.FromHexString("#D0FA00FF");

		let cellNetwork = new CellNetwork(this);
		cellNetwork.generate(20, 350);
		cellNetwork.checkSurround();
		//cellNetwork.debugDrawBase();

		this.selected = new CellSelector(cellNetwork);

		let ai = new AI(cellNetwork);

		let pickPlane = BABYLON.MeshBuilder.CreateGround("pick-plane", { width: 50, height: 50 }, this.scene);
		pickPlane.isVisible = false;

		let A = new BABYLON.Vector3(2, 0, 1);
		let B = new BABYLON.Vector3(6, 0, 3);
		let C = new BABYLON.Vector3(2, 0, 3.5);
		let D = new BABYLON.Vector3(6.25, 0, 0);

		this.scene.onPointerObservable.add((eventData: BABYLON.PointerInfo) => {
			let pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => { return m === pickPlane; });
			if (pick && pick.pickedPoint) {
				let cell = cellNetwork.worldPosToCell(pick.pickedPoint);
				if (cell.canRotate()) {
					this.setPickedCell(cell);
				}
			}
			let reverse = false;
			if (this.pickedCell && pick.pickedPoint) {
				reverse = this.pickedCell.barycenter3D.x > pick.pickedPoint.x;
			}
			this.selected.reverse = reverse;
			if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
				if (this.pickedCell) {
					cellNetwork.morphCell(
						0,
						this.pickedCell,
						reverse,
						() => {
							cellNetwork.checkSurround(
								() => {
									let aiMove = ai.getMove();
									if (aiMove.cell) {
										cellNetwork.morphCell(
											1,
											aiMove.cell,
											aiMove.reverse,
											() => {
												cellNetwork.checkSurround();
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
	}

	public selected: CellSelector;
	public pickedCell: Cell;
	public setPickedCell(cell: Cell): void {
		if (cell === this.pickedCell) {
			return;
		}
		if (this.pickedCell) {
			if (!this.pickedCell.isDisposed) {
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
			if (!this.pickedCell.isDisposed) {
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
})