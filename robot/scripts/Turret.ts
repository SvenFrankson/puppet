class Turret {

    public base: BABYLON.Mesh;
    public body: BABYLON.Mesh;
    public canon: BABYLON.Mesh;
    public top: BABYLON.Mesh;

    public target: Walker;

    constructor(
        public scene: BABYLON.Scene,
        public canvas: HTMLCanvasElement
    ) {
        
        this.base = BABYLON.MeshBuilder.CreatePlane("turret-base", { width: 3.59, height: 3.56 }, this.scene);

		let baseMaterial = new BABYLON.StandardMaterial("turret-base-material", this.scene);
		baseMaterial.diffuseTexture = new BABYLON.Texture("assets/turret_base.png", this.scene);
		baseMaterial.diffuseTexture.hasAlpha = true;
        baseMaterial.specularColor.copyFromFloats(0, 0, 0);
		baseMaterial.alphaCutOff = 0.1

		this.base.material = baseMaterial;

        this.body = BABYLON.MeshBuilder.CreatePlane("turret-body", { width: 1.70, height: 1.59 }, this.scene);
        this.body.position.z = - 0.1;
        this.body.parent = this.base;

		let bodyMaterial = new BABYLON.StandardMaterial("turret-body-material", this.scene);
		bodyMaterial.diffuseTexture = new BABYLON.Texture("assets/turret_body.png", this.scene);
		bodyMaterial.diffuseTexture.hasAlpha = true;
        bodyMaterial.specularColor.copyFromFloats(0, 0, 0);
		bodyMaterial.alphaCutOff = 0.1

		this.body.material = bodyMaterial;

        this.canon = BABYLON.MeshBuilder.CreatePlane("turret-canon", { width: 0.45, height: 2.92 }, this.scene);
        this.canon.position.y = 0.6;
        this.canon.position.z = - 0.1;
        this.canon.parent = this.body;

		let canonMaterial = new BABYLON.StandardMaterial("turret-canon-material", this.scene);
		canonMaterial.diffuseTexture = new BABYLON.Texture("assets/turret_canon.png", this.scene);
		canonMaterial.diffuseTexture.hasAlpha = true;
        canonMaterial.specularColor.copyFromFloats(0, 0, 0);
		canonMaterial.alphaCutOff = 0.1

		this.canon.material = canonMaterial;

        this.top = BABYLON.MeshBuilder.CreatePlane("turret-top", { width: 1.40, height: 0.96 }, this.scene);
        this.top.position.z = - 0.2;
        this.top.parent = this.body;

		let topMaterial = new BABYLON.StandardMaterial("turret-top-material", this.scene);
		topMaterial.diffuseTexture = new BABYLON.Texture("assets/turret_top.png", this.scene);
		topMaterial.diffuseTexture.hasAlpha = true;
        topMaterial.specularColor.copyFromFloats(0, 0, 0);
		topMaterial.alphaCutOff = 0.1

		this.top.material = topMaterial;
		
        this.scene.onBeforeRenderObservable.add(this._update);
    }

    private _t: number = 0;
    private _update = () => {
        this._t += this.scene.getEngine().getDeltaTime() / 1000;
        
        if (this.target) {
            let dir = new BABYLON.Vector2(
                this.canon.up.x,
                this.canon.up.y
            );
            let dirToTarget = new BABYLON.Vector2(
                this.target.body.position.x - this.base.position.x,
                this.target.body.position.y - this.base.position.y
            );
            let targetA = Math2D.AngleFromTo(new BABYLON.Vector2(0, 1), dirToTarget);
            this.body.rotation.z = Math2D.StepFromToCirular(this.body.rotation.z, targetA, 1 / 30 * 2 *  Math.PI * this.scene.getEngine().getDeltaTime() / 1000);
            let aligned = Math2D.AreEqualsCircular(this.body.rotation.z, targetA, Math.PI / 180);
            if (aligned) {
                this.canon.position.y = 0.6 + 0.05 * Math.cos(7 * this._t * 2 * Math.PI);
                this.body.position.x = 0.03 * Math.cos(6 * this._t * 2 * Math.PI);
                this.body.position.y = 0.03 * Math.cos(8 * this._t * 2 * Math.PI);
            }
            else {
                this.canon.position.y = 0.6;
                this.body.position.x = 0;
                this.body.position.y = 0;
            }
        }

    }
}