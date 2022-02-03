class FlashParticle extends BABYLON.Mesh {

    private _timer: number = 0;
    private _flashUp: BABYLON.Vector3 = BABYLON.Vector3.Up();

    constructor(
        name: string,
        public scene: BABYLON.Scene,
        public size: number,
        public lifespan: number
    ) {
        super(name, scene);
        let template = BABYLON.MeshBuilder.CreatePlane("template", {size: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
        let data = BABYLON.VertexData.ExtractFromMesh(template);
        data.applyToMesh(this);
        template.dispose();
        let material = new BABYLON.StandardMaterial(name + "-material", scene);
        material.diffuseTexture = new BABYLON.Texture("./assets/" + name + ".png", scene);
        material.diffuseTexture.hasAlpha = true;
        material.diffuseColor = BABYLON.Color3.FromHexString("#ffae70");
        material.specularColor.copyFromFloats(0, 0, 0);
        material.emissiveColor = material.diffuseColor;
        this.material = material;
        this.scaling.copyFromFloats(0, 0, 0);
        this.layerMask = 1;
    }

    public destroy(): void {
        this.getScene().onBeforeRenderObservable.removeCallback(this._update);
        this.dispose();
    }

    public flash(
        position: BABYLON.Vector3,
        up: BABYLON.Vector3
    ) {
        if (this._timer > 0) {
            return;
        }
        this.position.copyFrom(position);
        this._flashUp.copyFrom(up);
        this.scaling.copyFromFloats(0, 0, 0);
        this.getScene().onBeforeRenderObservable.add(this._update);
    }

    public _update = () => {
        this._timer += this.getScene().getEngine().getDeltaTime() / 1000;
        let s = this.size * Math.sin(this._timer / this.lifespan * Math.PI);
        let target: BABYLON.Vector3;
        if (this.scene.activeCameras && this.scene.activeCameras[0]) {
            target = this.scene.activeCameras[0].globalPosition;
        }
        else {
            target = this.scene.activeCamera.globalPosition;
        }
        let y = this._flashUp;
        let z = this.position.subtract(target);
        let x = BABYLON.Vector3.Cross(y, z);
        z = BABYLON.Vector3.Cross(x, y);
        this.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(x, y, z);
        if (this._timer < this.lifespan) {
            this.scaling.copyFromFloats(s, s, s);
        }
        else {
            this.scaling.copyFromFloats(this.size, this.size, this.size);
            if (this._timer > this.lifespan) {
                this._timer = 0;
                this.scaling.copyFromFloats(0, 0, 0);
                this.getScene().onBeforeRenderObservable.removeCallback(this._update);
            }
        }
    }
}