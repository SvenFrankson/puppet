class CameraManager {

    public center: BABYLON.Vector2 = BABYLON.Vector2.Zero();
	public camera: BABYLON.ArcRotateCamera;
    public moveWhenPointerOnSide: boolean = false;
    public cameraMoveDistance: number = 80;
    public cameraSpeed: number = 15;

    constructor(
        public main: Main
    ) {

    }

    public initialize(): void {
		//this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, - 15), this.main.scene);
		this.camera = new BABYLON.ArcRotateCamera("camera", - Math.PI / 2, Math.PI / 4, 30, BABYLON.Vector3.Zero(), this.main.scene);
        this.camera.attachControl(this.main.canvas);

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
				float threshold = 0.3;
				
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
        
		let depthMap = this.main.scene.enableDepthRenderer(this.camera).getDepthMap();
		
		let postProcess = new BABYLON.PostProcess("Edge", "Edge", ["width", "height"], ["depthSampler"], 1, this.camera);
		postProcess.onApply = (effect) => {
			effect.setTexture("depthSampler", depthMap);
			effect.setFloat("width", this.main.engine.getRenderWidth());
			effect.setFloat("height", this.main.engine.getRenderHeight());
		};

        let noPostProcessCamera = new BABYLON.FreeCamera("no-post-process-camera", BABYLON.Vector3.Zero(), this.main.scene);
		noPostProcessCamera.parent = this.camera;
		noPostProcessCamera.layerMask = 0x10000000;
		
		this.main.scene.activeCameras = [this.camera, noPostProcessCamera];
        
        this.main.scene.onBeforeRenderObservable.add(this._update);

        this.main.canvas.onpointerleave = () => {
            this.moveWhenPointerOnSide = false;
        }
        this.main.canvas.onpointerenter = () => {
            this.moveWhenPointerOnSide = true;
        }
    }

	public resize(): void {
        /*
		let w = this.main.canvas.clientWidth;
		let h = this.main.canvas.clientHeight;

		let r = w / h;

		if (r > 1) {
			this.camera.orthoLeft = this.center.x - 10 * r;
			this.camera.orthoRight = this.center.x + 10 * r;
			this.camera.orthoTop = this.center.y + 10;
			this.camera.orthoBottom = this.center.y - 10;
		}
		else {
			this.camera.orthoLeft = this.center.x - 10;
			this.camera.orthoRight = this.center.x + 10;
			this.camera.orthoTop = this.center.y + 10 / r;
			this.camera.orthoBottom = this.center.y - 10 / r;
		}
        */
	}

    public moveCenter(dX: number, dY: number): void {
        this.camera.target.x += dX;
        this.camera.target.z += dY;
        this.resize();
    }

    public _update = () => {
        if (!this.moveWhenPointerOnSide) {
            return;
        }

        this.camera.target.y = 0;

        let dt = this.main.engine.getDeltaTime() / 1000;
        let pointerX = this.main.scene.pointerX;
        let pointerY = this.main.scene.pointerY;

		let w = this.main.canvas.clientWidth;
		let h = this.main.canvas.clientHeight;

        let distanceToEdge: number = Infinity;
        distanceToEdge = Math.min(pointerX, distanceToEdge);
        distanceToEdge = Math.min(pointerY, distanceToEdge);
        distanceToEdge = Math.min(w - pointerX, distanceToEdge);
        distanceToEdge = Math.min(h - pointerY, distanceToEdge);

        if (distanceToEdge < this.cameraMoveDistance) {
            let speed = this.cameraSpeed * (1 - distanceToEdge / this.cameraMoveDistance);
            let dir = new BABYLON.Vector2(pointerX - w * 0.5, pointerY - h * 0.5).normalize();
            this.moveCenter(dir.x * speed * dt, - dir.y * speed * dt);
        }
        /*
        if (pointerX < this.cameraMoveDistance) {
            dX = - this.cameraSpeed * dt * (1 - pointerX / this.cameraMoveDistance);
        }
        if (pointerX > w - this.cameraMoveDistance) {
            let d = w - pointerX;
            dX = this.cameraSpeed * dt * (1 - d / this.cameraMoveDistance);
        }
        if (pointerY < this.cameraMoveDistance) {
            dY = this.cameraSpeed * dt * (1 - pointerY / this.cameraMoveDistance);
        }
        if (pointerY > h - this.cameraMoveDistance) {
            let d = h - pointerY;
            dY = - this.cameraSpeed * dt * (1 - d / this.cameraMoveDistance);
        }
        */
    }
}