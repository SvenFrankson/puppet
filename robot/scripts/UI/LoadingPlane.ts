class LoadingPlane {

    public greenSprite: BABYLON.Mesh;
    public graySprite: BABYLON.Mesh;
    public valueMesh: BABYLON.Mesh;
    public valueMaterial: BABYLON.StandardMaterial;
    public valueTexture: BABYLON.DynamicTexture;

    private _timer: number = 0;

    constructor(
        public pos2D: BABYLON.Vector2,
        public duration: number,
        public onCompletionCallback: () => void,
        public main: Main
    ) {
        this.greenSprite = new BABYLON.Mesh("green-sprite", this.main.scene);
        this.greenSprite.renderingGroupId = 1;
        this.greenSprite.layerMask = 0x10000000;

		let greenSpriteMaterial = new BABYLON.StandardMaterial("green-sprite-material", this.main.scene);
        greenSpriteMaterial.diffuseTexture = new BABYLON.Texture("assets/building-loader-green.png", this.main.scene);
		greenSpriteMaterial.diffuseTexture.hasAlpha = true;
        greenSpriteMaterial.specularColor.copyFromFloats(0, 0, 0);
		greenSpriteMaterial.alphaCutOff = 0.5

		this.greenSprite.material = greenSpriteMaterial;

		this.greenSprite.position.x = this.pos2D.x;
		this.greenSprite.position.y = 0;
		this.greenSprite.position.z = this.pos2D.y;
		
		this.graySprite = new BABYLON.Mesh("graySprite", this.main.scene);
        this.graySprite.renderingGroupId = 1;
        this.graySprite.layerMask = 0x10000000;

		let graySpriteMaterial = new BABYLON.StandardMaterial("graySprite-material", this.main.scene);
        graySpriteMaterial.diffuseTexture = new BABYLON.Texture("assets/building-loader-gray.png", this.main.scene);
		graySpriteMaterial.diffuseTexture.hasAlpha = true;
        graySpriteMaterial.specularColor.copyFromFloats(0, 0, 0);
		graySpriteMaterial.alphaCutOff = 0.5

		this.graySprite.material = graySpriteMaterial;

		this.graySprite.position.x = this.pos2D.x;
		this.graySprite.position.y = 0;
		this.graySprite.position.z = this.pos2D.y;

		let a = 240 / 180 * Math.PI;
		CutPlane.CreateVerticalVertexData(2.5, 2.5, 0, 0).applyToMesh(this.greenSprite);
		CutPlane.CreateVerticalVertexData(2.5, 2.5, 0, 1).applyToMesh(this.graySprite);

        this.main.scene.onBeforeRenderObservable.add(this._update);

        this.valueMesh = new BABYLON.Mesh("value-mesh");
        this.valueMesh.renderingGroupId = 1;
        this.valueMesh.layerMask = 0x10000000;
        SpriteUtils.CreatePlaneData(2.5, 1.25).applyToMesh(this.valueMesh);

		this.valueMesh.position.x = this.pos2D.x + 0.3;
		this.valueMesh.position.y = 0;
		this.valueMesh.position.z = this.pos2D.y - 0.3;

        this.valueMaterial = new BABYLON.StandardMaterial("value-material", this.main.scene);
		this.valueMaterial.alphaCutOff = 0.5

        this.valueTexture = new BABYLON.DynamicTexture("value-texture", { width: 200, height: 100 }, this.main.scene, true);
        this.valueTexture.hasAlpha = true;

        this.valueMaterial.diffuseTexture = this.valueTexture

        this.valueMesh.material = this.valueMaterial;
    }

    public dispose(): void {
        this.graySprite.dispose();
        this.greenSprite.dispose();
        this.valueMesh.dispose();
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
    }

    public _update = () => {
        this._timer += this.main.engine.getDeltaTime() / 1000;

        let t = this._timer / this.duration;
        if (t < 1) {
            CutPlane.CreateVerticalVertexData(2.5, 2.5, 0, t).applyToMesh(this.greenSprite);
            CutPlane.CreateVerticalVertexData(2.5, 2.5, t, 1).applyToMesh(this.graySprite);

            let ctx = this.valueTexture.getContext();
            ctx.clearRect(0, 0, 200, 100);

            ctx.font = "65px Orbitron Medium"
            ctx.textAlign = "right"

            ctx.lineWidth = 10;
            ctx.strokeStyle = "black";
            ctx.strokeText((Math.floor(t * 10)).toFixed(0), 70, 75);
            ctx.strokeText((Math.floor(t * 100) % 10).toFixed(0), 125, 75);
            ctx.strokeText("%", 190, 75);

            ctx.fillStyle = "white";
            ctx.fillText((Math.floor(t * 10)).toFixed(0), 70, 75);
            ctx.fillText((Math.floor(t * 100) % 10).toFixed(0), 125, 75);
            ctx.fillText("%", 190, 75);
            this.valueTexture.update();
        }
        else {
            this.dispose();
            if (this.onCompletionCallback) {
                this.onCompletionCallback();
            }
        }
    }
}