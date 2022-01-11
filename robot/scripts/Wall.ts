class WallNode {

    public sprite: BABYLON.Mesh;
    public top: BABYLON.Mesh;

    constructor(
        public name: string,
        public scene: BABYLON.Scene,
        public canvas: HTMLCanvasElement
    ) {
        this.sprite = BABYLON.MeshBuilder.CreatePlane(name, { width: 2.82, height: 2.75 }, this.scene);
        this.sprite.position.z = 0;

		let spriteMaterial = new BABYLON.StandardMaterial("wall-sprite-material", this.scene);
		spriteMaterial.diffuseTexture = new BABYLON.Texture("assets/wall_node_base.png", this.scene);
		spriteMaterial.diffuseTexture.hasAlpha = true;
        spriteMaterial.specularColor.copyFromFloats(0, 0, 0);
		spriteMaterial.alphaCutOff = 0.1

		this.sprite.material = spriteMaterial;
        
        this.top = BABYLON.MeshBuilder.CreatePlane(name, { width: 1.15, height: 1.11 }, this.scene);
        this.top.position.z = -0.2;
        this.top.parent = this.sprite;

		let topMaterial = new BABYLON.StandardMaterial("wall-top-material", this.scene);
		topMaterial.diffuseTexture = new BABYLON.Texture("assets/wall_top.png", this.scene);
		topMaterial.diffuseTexture.hasAlpha = true;
        topMaterial.specularColor.copyFromFloats(0, 0, 0);
		topMaterial.alphaCutOff = 0.1

		this.top.material = topMaterial;
    }
}

class Wall {
    public sprite: BABYLON.Mesh;

    constructor(
        public node1: WallNode,
        public node2: WallNode,
        public scene: BABYLON.Scene,
        public canvas: HTMLCanvasElement
    ) {
        let n = node2.sprite.position.subtract(node1.sprite.position);
        let l = n.length();
        this.sprite = BABYLON.MeshBuilder.CreatePlane("wall", { width: l, height: 0.85, sideOrientation:2 , frontUVs: new BABYLON.Vector4(0, 0, l / 2.17, 1)}, this.scene);
        this.sprite.setPivotPoint(new BABYLON.Vector3(- l * 0.5, 0, 0));
        this.sprite.position.z = - 0.1;

		let spriteMaterial = new BABYLON.StandardMaterial("wall-material", this.scene);
		spriteMaterial.diffuseTexture = new BABYLON.Texture("assets/wall.png", this.scene);
		spriteMaterial.diffuseTexture.hasAlpha = true;
        spriteMaterial.specularColor.copyFromFloats(0, 0, 0);
		spriteMaterial.alphaCutOff = 0.1

		this.sprite.material = spriteMaterial;

        this.sprite.position.x = this.node1.sprite.position.x + l * 0.5;
        this.sprite.position.y = this.node1.sprite.position.y;

        this.sprite.rotation.z = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), new BABYLON.Vector2(n.x, n.y));
    }
}