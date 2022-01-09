class Prop {

    public sprite: BABYLON.Mesh;

    constructor(
        public name: string,
        public w: number,
        public h: number,
        public scene: BABYLON.Scene,
        public canvas: HTMLCanvasElement
    ) {
        this.sprite = BABYLON.MeshBuilder.CreatePlane(name, { width: w, height: h }, this.scene);
        this.sprite.position.z = 1;

		let spriteMaterial = new BABYLON.StandardMaterial("turret-sprite-material", this.scene);
		spriteMaterial.diffuseTexture = new BABYLON.Texture("assets/" + name + ".png", this.scene);
		spriteMaterial.diffuseTexture.hasAlpha = true;
        spriteMaterial.specularColor.copyFromFloats(0, 0, 0);
		spriteMaterial.alphaCutOff = 0.1

		this.sprite.material = spriteMaterial;
    }
}