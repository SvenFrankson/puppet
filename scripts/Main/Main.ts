/// <reference path="../../lib/babylon.d.ts"/>
/// <reference path="../../lib/babylon.gui.d.ts"/>

var COS30 = Math.cos(Math.PI / 6);

class Main {

    public static Canvas: HTMLCanvasElement;
    public static Engine: BABYLON.Engine;
    public static Scene: BABYLON.Scene;
	public static Light: BABYLON.Light;
	public static Skybox: BABYLON.Mesh;
	public static EnvironmentTexture: BABYLON.CubeTexture;
	public static GlowLayer: BABYLON.GlowLayer;

	private static _CameraPosition: BABYLON.Vector2;
	public static get CameraPosition(): BABYLON.Vector2 {
		if (!Main._CameraPosition) {
			Main._CameraPosition = BABYLON.Vector2.Zero();
		}
		return Main._CameraPosition;
	}
	public static set CameraPosition(p: BABYLON.Vector2) {
		Main._CameraPosition = p;
	}
	public static Camera: BABYLON.ArcRotateCamera;

	public static _redMaterial: BABYLON.StandardMaterial;
	public static get redMaterial(): BABYLON.StandardMaterial {
		if (!Main._redMaterial) {
			Main._redMaterial = new BABYLON.StandardMaterial("red-material", Main.Scene);
			Main._redMaterial.diffuseColor.copyFromFloats(0.9, 0.1, 0.1);
		}
		return Main._redMaterial;
	}

	public static _greenMaterial: BABYLON.StandardMaterial;
	public static get greenMaterial(): BABYLON.StandardMaterial {
		if (!Main._greenMaterial) {
			Main._greenMaterial = new BABYLON.StandardMaterial("green-material", Main.Scene);
			Main._greenMaterial.diffuseColor.copyFromFloats(0.1, 0.9, 0.1);
		}
		return Main._greenMaterial;
	}

	public static _blueMaterial: BABYLON.StandardMaterial;
	public static get blueMaterial(): BABYLON.StandardMaterial {
		if (!Main._blueMaterial) {
			Main._blueMaterial = new BABYLON.StandardMaterial("blue-material", Main.Scene);
			Main._blueMaterial.diffuseColor.copyFromFloats(0.1, 0.1, 0.9);
		}
		return Main._blueMaterial;
	}

	public static _whiteMaterial: BABYLON.StandardMaterial;
	public static get whiteMaterial(): BABYLON.StandardMaterial {
		if (!Main._whiteMaterial) {
			Main._whiteMaterial = new BABYLON.StandardMaterial("white-material", Main.Scene);
			Main._whiteMaterial.diffuseColor.copyFromFloats(0.9, 0.9, 0.9);
			Main._whiteMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
		}
		return Main._whiteMaterial;
	}

	public static _orbMaterial: BABYLON.StandardMaterial;
	public static get orbMaterial(): BABYLON.StandardMaterial {
		if (!Main._orbMaterial) {
			Main._orbMaterial = new BABYLON.StandardMaterial("blue-material", Main.Scene);
			Main._orbMaterial.emissiveColor.copyFromFloats(0.8, 0.8, 1);
		}
		return Main._orbMaterial;
	}

	public static _previewRedMaterial: BABYLON.StandardMaterial;
	public static get previewRedMaterial(): BABYLON.StandardMaterial {
		if (!Main._previewRedMaterial) {
			Main._previewRedMaterial = new BABYLON.StandardMaterial("preview-red-material", Main.Scene);
			Main._previewRedMaterial.diffuseColor.copyFromFloats(0.8, 0.2, 0.4);
			Main._previewRedMaterial.alpha = 0.7;
		}
		return Main._previewRedMaterial;
	}

	public static _previewBlueMaterial: BABYLON.StandardMaterial;
	public static get previewBlueMaterial(): BABYLON.StandardMaterial {
		if (!Main._previewBlueMaterial) {
			Main._previewBlueMaterial = new BABYLON.StandardMaterial("preview-blue-material", Main.Scene);
			Main._previewBlueMaterial.diffuseColor.copyFromFloats(0.4, 0.8, 0.9);
			Main._previewBlueMaterial.alpha = 0.7;
		}
		return Main._previewBlueMaterial;
	}

    constructor(canvasElement: string) {
        Main.Canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        Main.Engine = new BABYLON.Engine(Main.Canvas, true, { preserveDrawingBuffer: true, stencil: true });
	}
	
	public async initialize(): Promise<void> {
		await this.initializeScene();
	}

	public static EnableGlowLayer(): void {
		Main.DisableGlowLayer();	
		Main.GlowLayer = new BABYLON.GlowLayer("glow", Main.Scene);
		Main.GlowLayer.intensity = 1;
	}

	public static DisableGlowLayer(): void {
		if (Main.GlowLayer) {
			Main.GlowLayer.dispose();
			Main.GlowLayer = undefined;
		}
	}

	public static ToggleGlowLayer(): void {
		if (Main.GlowLayer) {
			Main.DisableGlowLayer();
		}
		else {
			Main.EnableGlowLayer();
		}
	}

	public static async loadMesh(modelName: string): Promise<BABYLON.Mesh> {
		return new Promise<BABYLON.Mesh> (
			resolve => {
				BABYLON.SceneLoader.ImportMesh(
					"",
					"./assets/models/" + modelName + ".babylon",
					"",
					Main.Scene,
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

	public static async loadMeshes(modelName: string, hide: boolean = true): Promise<BABYLON.Mesh[]> {
		return new Promise<BABYLON.Mesh[]> (
			resolve => {
				BABYLON.SceneLoader.ImportMesh(
					"",
					"./assets/models/" + modelName + ".babylon",
					"",
					Main.Scene,
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
		Main.Scene = new BABYLON.Scene(Main.Engine);

		let ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, Main.Scene);
		let groundMaterial = new BABYLON.StandardMaterial("ground-material", Main.Scene);
		groundMaterial.diffuseTexture = new BABYLON.Texture("assets/textures/dirt.jpg", Main.Scene);
		groundMaterial.specularColor.copyFromFloats(0, 0, 0);
		ground.material = groundMaterial;

		/*
		let crawler = new Crawler();
		let camera = new CrawlerCamera();
		camera.attach(crawler);
		*/
		let camera = new BABYLON.ArcRotateCamera("camera", 0, Math.PI / 4, 20, BABYLON.Vector3.Zero(), Main.Scene);
		camera.attachControl(Main.Canvas);
		
		for (let i = 0; i < 5; i++) {
			
			let material = new BABYLON.StandardMaterial("preview-blue-material", Main.Scene);
			material.diffuseColor.copyFromFloats(Math.random(), Math.random(), Math.random());
			material.specularColor.copyFromFloats(0.1, 0.1, 0.1);

			let puppet = new Puppet(new BABYLON.Vector3(i *3, 0, 0), material);
			Main.Scene.onBeforeRenderObservable.add(() => {
				puppet.update();
			})
			let controler = new FlightPlanPuppetControler(puppet);
			controler.flightPlan = [
				new BABYLON.Vector2(i *3, 0),
				new BABYLON.Vector2(i *3 + 1, 10),
				new BABYLON.Vector2(i *3 , 15),
				new BABYLON.Vector2(i *3 - 1, 10),
				new BABYLON.Vector2(i *3 + 1, - 10),
				new BABYLON.Vector2(i *3 , - 15),
				new BABYLON.Vector2(i *3 - 1, - 10)
			]
			puppet.puppetControler = controler;
			puppet.puppetControler.initialize();
		}

		Main.EnableGlowLayer();

		Main.Light = new BABYLON.HemisphericLight("AmbientLight", new BABYLON.Vector3(1, 3, 2), Main.Scene);

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
        
		let depthMap = Main.Scene.enableDepthRenderer(camera).getDepthMap();
		
		let postProcess = new BABYLON.PostProcess("Edge", "Edge", ["width", "height"], ["depthSampler"], 1, camera);
		postProcess.onApply = (effect) => {
			effect.setTexture("depthSampler", depthMap);
			effect.setFloat("width", Main.Engine.getRenderWidth());
			effect.setFloat("height", Main.Engine.getRenderHeight());
		};
		
		/*
		Main.Skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 2000.0 }, Main.Scene);
		Main.Skybox.rotation.y = Math.PI / 2;
		Main.Skybox.infiniteDistance = true;
		let skyboxMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("skyBox", Main.Scene);
		skyboxMaterial.backFaceCulling = false;
		Main.EnvironmentTexture = new BABYLON.CubeTexture(
			"./assets/skyboxes/sky",
			Main.Scene,
			["-px.png", "-py.png", "-pz.png", "-nx.png", "-ny.png", "-nz.png"]);
		skyboxMaterial.reflectionTexture = Main.EnvironmentTexture;
		skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
		skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
		skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
		Main.Skybox.material = skyboxMaterial;

		Main.Scene.onBeforeRenderObservable.add(
			() => {
				Main.Skybox.rotation.y += 0.0001;
			}
		)
		*/

		Main.Scene.clearColor.copyFromFloats(122 / 255, 200 / 255, 222 / 255, 1);
	}
	
    public animate(): void {
		let fpsInfoElement = document.getElementById("fps-info");
		let meshesInfoTotalElement = document.getElementById("meshes-info-total");
		let meshesInfoNonStaticUniqueElement = document.getElementById("meshes-info-nonstatic-unique");
		let meshesInfoStaticUniqueElement = document.getElementById("meshes-info-static-unique");
		let meshesInfoNonStaticInstanceElement = document.getElementById("meshes-info-nonstatic-instance");
		let meshesInfoStaticInstanceElement = document.getElementById("meshes-info-static-instance");
        Main.Engine.runRenderLoop(() => {
			Main.Scene.render();
			fpsInfoElement.innerText = Main.Engine.getFps().toFixed(0) + " fps";
			let uniques = Main.Scene.meshes.filter(m => { return !(m instanceof BABYLON.InstancedMesh); });
			let uniquesNonStatic = uniques.filter(m => { return !m.isWorldMatrixFrozen; });
			let uniquesStatic = uniques.filter(m => { return m.isWorldMatrixFrozen; });
			let instances = Main.Scene.meshes.filter(m => { return m instanceof BABYLON.InstancedMesh; });
			let instancesNonStatic = instances.filter(m => { return !m.isWorldMatrixFrozen; });
			let instancesStatic = instances.filter(m => { return m.isWorldMatrixFrozen; });
			meshesInfoTotalElement.innerText = Main.Scene.meshes.length.toFixed(0).padStart(4, "0");
			meshesInfoNonStaticUniqueElement.innerText = uniquesNonStatic.length.toFixed(0).padStart(4, "0");
			meshesInfoStaticUniqueElement.innerText = uniquesStatic.length.toFixed(0).padStart(4, "0");
			meshesInfoNonStaticInstanceElement.innerText = instancesNonStatic.length.toFixed(0).padStart(4, "0");
			meshesInfoStaticInstanceElement.innerText = instancesStatic.length.toFixed(0).padStart(4, "0");
        });

        window.addEventListener("resize", () => {
            Main.Engine.resize();
        });
    }
}

window.addEventListener("load", async () => {
	let main: Main = new Main("render-canvas");
	await main.initialize();
	main.animate();
})