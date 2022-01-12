class Sprite extends BABYLON.Mesh {

    public shadowMesh: BABYLON.Mesh;
    public height: number = 1;

    public get spriteMaterial(): BABYLON.StandardMaterial {
        if (this.material instanceof BABYLON.StandardMaterial) {
            return this.material;
        }
    }

    private _position2D: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public get position2D(): BABYLON.Vector2 {
        this._position2D.x = this.position.x;
        this._position2D.y = this.position.y;

        return this._position2D;
    }

    constructor(
        name: string,
        url: string,
        scene: BABYLON.Scene,
        length?: number
    ) {
        super(name, scene);

        this.shadowMesh = new BABYLON.Mesh(name + "-shadow", scene);

		let material = new BABYLON.StandardMaterial(name + "-material", scene);
		let texture = new BABYLON.Texture(url, scene, false, true, undefined, () => {
            this.refreshMesh(length);
        });
        material.diffuseTexture = texture;
		material.diffuseTexture.hasAlpha = true;
        material.specularColor.copyFromFloats(0, 0, 0);
		material.alphaCutOff = 0.5

		this.material = material;

		let shadowMaterial = new BABYLON.StandardMaterial(name + "-material", scene);
        shadowMaterial.diffuseTexture = texture;
        shadowMaterial.diffuseColor.copyFromFloats(0, 0, 0);
		shadowMaterial.diffuseTexture.hasAlpha = true;
        shadowMaterial.specularColor.copyFromFloats(0, 0, 0);
		shadowMaterial.useAlphaFromDiffuseTexture = true;
        shadowMaterial.alpha = 0.8;

        this.shadowMesh.material = shadowMaterial;

        scene.onBeforeRenderObservable.add(this._update);
    }

    public refreshMesh(length?: number): void {
        let size = this.spriteMaterial.diffuseTexture.getBaseSize();
        let quadData: BABYLON.VertexData;
        if (isFinite(length)) {
            quadData = BABYLON.VertexData.CreatePlane({ width: length, height: size.height / 100, sideOrientation: 2, frontUVs: new BABYLON.Vector4(0, 0, length / (size.width / 100), 1) });
        }
        else {
            quadData = BABYLON.VertexData.CreatePlane({ width: size.width / 100, height: size.height / 100 });
        }
        quadData.applyToMesh(this);
        quadData.applyToMesh(this.shadowMesh);
    }

    private _update = () => {
        this.shadowMesh.position.x = this.absolutePosition.x + 0.5 * this.height / 5;
        this.shadowMesh.position.y = this.absolutePosition.y - 0.3 * this.height / 5;
        this.shadowMesh.position.z = 1.1;
        this.shadowMesh.rotation.z = this.rotation.z;
        let parent = this.parent;
        while (parent && parent instanceof BABYLON.Mesh) {
            this.shadowMesh.rotation.z += parent.rotation.z;
            parent = parent.parent;
        }
    }

    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void {
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
        this.shadowMesh.dispose(doNotRecurse, disposeMaterialAndTextures);
        this.getScene().onBeforeRenderObservable.removeCallback(this._update);
    }
}