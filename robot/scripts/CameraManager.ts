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
		this.camera = new BABYLON.ArcRotateCamera("camera", - Math.PI / 2, Math.PI / 8, 30, BABYLON.Vector3.Zero(), this.main.scene);
        this.camera.attachControl(this.main.canvas);

        let noPostProcessCamera = new BABYLON.FreeCamera("no-post-process-camera", BABYLON.Vector3.Zero(), this.main.scene);
		noPostProcessCamera.parent = this.camera;
		noPostProcessCamera.layerMask = 0x10000000;
		
		this.main.scene.activeCameras.push(this.camera, noPostProcessCamera);
        
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