class LoadingPlane {

    public greenSprite: BABYLON.Mesh;
    public graySprite: BABYLON.Mesh;
    public valueElement: HTMLDivElement;
    public decimalElement: HTMLSpanElement;
    public unitElement: HTMLSpanElement;

    private _timer: number = 0;

    constructor(
        public pos2D: BABYLON.Vector2,
        public duration: number,
        public onCompletionCallback: () => void,
        public main: Main
    ) {
        this.greenSprite = new BABYLON.Mesh("green-sprite", this.main.scene);

		let greenSpriteMaterial = new BABYLON.StandardMaterial("green-sprite-material", this.main.scene);
        greenSpriteMaterial.diffuseTexture = new BABYLON.Texture("assets/building-loader-green.png", this.main.scene);
		greenSpriteMaterial.diffuseTexture.hasAlpha = true;
        greenSpriteMaterial.specularColor.copyFromFloats(0, 0, 0);
		greenSpriteMaterial.alphaCutOff = 0.5

		this.greenSprite.material = greenSpriteMaterial;

		this.greenSprite.position.x = this.pos2D.x;
		this.greenSprite.position.y = this.pos2D.y;
		this.greenSprite.position.z = - 2;
		
		this.graySprite = new BABYLON.Mesh("graySprite", this.main.scene);

		let graySpriteMaterial = new BABYLON.StandardMaterial("graySprite-material", this.main.scene);
        graySpriteMaterial.diffuseTexture = new BABYLON.Texture("assets/building-loader-gray.png", this.main.scene);
		graySpriteMaterial.diffuseTexture.hasAlpha = true;
        graySpriteMaterial.specularColor.copyFromFloats(0, 0, 0);
		graySpriteMaterial.alphaCutOff = 0.5

		this.graySprite.material = graySpriteMaterial;

		this.graySprite.position.x = this.pos2D.x;
		this.graySprite.position.y = this.pos2D.y;
		this.graySprite.position.z = - 2;

		let a = 240 / 180 * Math.PI;
		CutPlane.CreateVerticalVertexData(2.5, 2.5, 0, 0).applyToMesh(this.greenSprite);
		CutPlane.CreateVerticalVertexData(2.5, 2.5, 0, 1).applyToMesh(this.graySprite);

		this.valueElement = document.createElement("div");
		this.decimalElement = document.createElement("span");
		this.decimalElement.classList.add("building-loader-digit");
		this.valueElement.appendChild(this.decimalElement);
		this.unitElement = document.createElement("span");
		this.unitElement.classList.add("building-loader-digit");
		this.valueElement.appendChild(this.unitElement);
		let pc = document.createElement("span");
		pc.classList.add("building-loader-digit");
		pc.innerText = "%";
		this.valueElement.appendChild(pc);
		this.valueElement.classList.add("building-loader-value");
		let p = this.main.worldPosToPixel(this.pos2D);
		this.valueElement.style.left = (p.x - 35).toFixed(0) + "px";
		this.valueElement.style.top = (p.y - 5).toFixed(0) + "px";
		document.body.appendChild(this.valueElement);

        this.main.scene.onBeforeRenderObservable.add(this._update);
    }

    public dispose(): void {
        this.graySprite.dispose();
        this.greenSprite.dispose();
        document.body.removeChild(this.valueElement);
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
    }

    public _update = () => {
        this._timer += this.main.engine.getDeltaTime() / 1000;

        let t = this._timer / this.duration;
        if (t < 1) {
            
            let p = this.main.worldPosToPixel(this.pos2D);
            this.valueElement.style.left = (p.x - 35).toFixed(0) + "px";
            this.valueElement.style.top = (p.y - 5).toFixed(0) + "px";

            CutPlane.CreateVerticalVertexData(2.5, 2.5, 0, t).applyToMesh(this.greenSprite);
            CutPlane.CreateVerticalVertexData(2.5, 2.5, t, 1).applyToMesh(this.graySprite);
            this.decimalElement.innerText = (Math.floor(t * 10)).toFixed(0);
            this.unitElement.innerText = (Math.floor(t * 100) % 10).toFixed(0);
        }
        else {
            this.dispose();
            if (this.onCompletionCallback) {
                this.onCompletionCallback();
            }
        }
    }
}