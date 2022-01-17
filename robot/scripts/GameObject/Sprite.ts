class Sprite extends BABYLON.Mesh {

    public static SHADOW_Y: number = 0.1;
    public static QUAD_Y: number = 0.2;
    public static LEVEL_STEP: number = 0.1;

    public shadowMesh: BABYLON.Mesh;
    public height: number = 1;

    public get spriteMaterial(): BABYLON.StandardMaterial {
        if (this.material instanceof BABYLON.StandardMaterial) {
            return this.material;
        }
    }

    private _pos2D: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public get pos2D(): BABYLON.Vector2 {
        this._pos2D.x = this.position.x;
        this._pos2D.y = this.position.z;

        return this._pos2D;
    }

    public get posX(): number {
        return this.position.x;
    }
    public set posX(x: number) {
        this.position.x = x;
    }

    public get posY(): number {
        return this.position.z;
    }
    public set posY(y: number) {
        this.position.z = y;
    }

    public get rot(): number {
        return this.rotation.y;
    }
    public set rot(r: number) {
        this.rotation.y = r;
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
            quadData = SpriteUtils.CreatePlaneData(length, size.height / 100, new BABYLON.Vector4(0, 0, length / (size.width / 100), 1));
        }
        else {
            quadData = BABYLON.VertexData.CreatePlane({ width: size.width / 100, height: size.height / 100 });
            quadData = SpriteUtils.CreatePlaneData(size.width / 100, size.height / 100);
        }
        quadData.applyToMesh(this);
        if (this.position.y === 0) {
            this.position.y = Sprite.QUAD_Y;
        }
        quadData.applyToMesh(this.shadowMesh);
        this.shadowMesh.position.y = Sprite.SHADOW_Y;
    }

    private _update = () => {
        this.shadowMesh.position.x = this.absolutePosition.x + 0.5 * this.height / 5;
        this.shadowMesh.position.z = this.absolutePosition.z - 0.3 * this.height / 5;
        this.shadowMesh.position.y = Sprite.SHADOW_Y;
        this.shadowMesh.rotation.y = this.rotation.y;
        let parent = this.parent;
        while (parent && parent instanceof BABYLON.Mesh) {
            this.shadowMesh.rotation.y += parent.rotation.y;
            parent = parent.parent;
        }
    }

    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void {
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
        this.shadowMesh.dispose(doNotRecurse, disposeMaterialAndTextures);
        this.getScene().onBeforeRenderObservable.removeCallback(this._update);
    }
}