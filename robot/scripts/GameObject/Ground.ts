class Ground extends BABYLON.Mesh {

    constructor(
        public width: number,
        public height: number,
        public main: Main
    ) {
        super("ground", main.scene);

        let data = new BABYLON.VertexData();
            
        let positions: number[] = [];
        let indices: number[] = [];
        let uvs: number[] = [];

        let lx = 2;
        let lz = Math.sin(Math.PI / 3) * lx;

        let x0 = - lx * (width + height * 0.5) * 0.5;
        let z0 = - lz * height * 0.5;

        for (let i = 0; i <= width; i++) {
            for (let j = 0; j <= height; j++) {
                let n = i + j * (width + 1);
                positions.push(x0 + i * lx + j * lx * 0.5, Math.random(), z0 + j * lz);
                uvs.push(2 * i / width, 2 * j / width);
                if (i < width && j < width) {
                    indices.push(n, n + width + 1, n + 1);
                    indices.push(n + 1, n + width + 1, n + width + 2);
                }
            }
        }

        let normals: number[] = [];
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);

        data.positions = positions;
        data.indices = indices;
        data.normals = normals;
        data.uvs = uvs;

        data.applyToMesh(this);

        let groundMaterial = new ToonMaterial("ground-material", false, this.main.scene);
        groundMaterial.setTexture("colorTexture", new BABYLON.Texture("assets/ground_2.png", this.main.scene));
        groundMaterial.setColor(BABYLON.Color3.White());
		
		this.material = groundMaterial;
    }
}