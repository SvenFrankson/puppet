class Ground extends BABYLON.Mesh {

    public heightMap: number[][] = [];

    constructor(
        public width: number,
        public height: number,
        public main: Main
    ) {
        super("ground", main.scene);
    }

    public async instantiate(): Promise<void> {
        return new Promise<void>(resolve => {
            let image = new Image(1024, 1024);
            image.onload = () => {
                let canvas = document.createElement("canvas");
                canvas.width = 1024;
                canvas.height = 1024;
                
                let ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0);

                let imageData = ctx.getImageData(0, 0, 1024, 1024);

                let data = new BABYLON.VertexData();
                
                let positions: number[] = [];
                let indices: number[] = [];
                let uvs: number[] = [];

                let lx = 2;
                let lz = Math.sin(Math.PI / 3) * lx;

                let x0 = - lx * (this.width + this.height * 0.5) * 0.5;
                let z0 = - lz * this.height * 0.5;

                for (let i = 0; i <= this.width; i++) {
                    this.heightMap[i] = [];
                    for (let j = 0; j <= this.height; j++) {
                        let n = i + j * (this.width + 1);
                        let di = Math.floor(i / this.width * 64);
                        let dj = Math.floor(j / this.height * 64);
                        let h = imageData.data[4 * (di + 1024 * dj)];
                        this.heightMap[i][j] = h / 256 * 80 - 40;
                        positions.push(x0 + i * lx + j * lx * 0.5, this.heightMap[i][j], z0 + j * lz);
                        uvs.push(2 * i / this.width, 2 * j / this.width);
                        if (i < this.width && j < this.width) {
                            indices.push(n, n + this.width + 1, n + 1);
                            indices.push(n + 1, n + this.width + 1, n + this.width + 2);
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
                resolve();
            }
            image.src = "assets/ground.png";

            let groundMaterial = new ToonMaterial("ground-material", false, this.main.scene);
            groundMaterial.setTexture("colorTexture", new BABYLON.Texture("assets/ground_2.png", this.main.scene));
            groundMaterial.setColor(BABYLON.Color3.White());
            
            this.material = groundMaterial;
        });
    }

    public flatten(posI: number, posJ: number, h: number, r: number): void {
        this.heightMap[posI][posJ] = h;
        for (let d = 1; d <= r; d++) {
            let f = (1 - d / r) * 2;
            f = Math.min(1, f);
            let iIndexes = [
                posI + d,
                posI + d,
                posI,
                posI - d,
                posI - d,
                posI
            ];
            let jIndexes = [
                posJ,
                posJ - d,
                posJ - d,
                posJ,
                posJ + d,
                posJ + d
            ];
            for (let p = 0; p < 6; p++) {
                let pi = iIndexes[p];
                let pj = jIndexes[p];
                let piNext = iIndexes[(p + 1) % 6];
                let pjNext = jIndexes[(p + 1) % 6];
                let di = (piNext - pi) / d;
                let dj = (pjNext - pj) / d;
                for (let n = 0; n < d; n++) {
                    if (this.heightMap[pi + di * n]) {
                        if (isFinite(this.heightMap[pi + di * n][pj + dj * n])) {
                            let th = this.heightMap[pi + di * n][pj + dj * n]
                            this.heightMap[pi + di * n][pj + dj * n] = h * f + th * (1 - f);
                        }
                    }
                }
            }
        }

        let data = new BABYLON.VertexData();
                
        let positions: number[] = [];
        let indices: number[] = [];
        let uvs: number[] = [];

        let lx = 2;
        let lz = Math.sin(Math.PI / 3) * lx;

        let x0 = - lx * (this.width + this.height * 0.5) * 0.5;
        let z0 = - lz * this.height * 0.5;

        for (let i = 0; i <= this.width; i++) {
            for (let j = 0; j <= this.height; j++) {
                let n = i + j * (this.width + 1);
                positions.push(x0 + i * lx + j * lx * 0.5, this.heightMap[i][j], z0 + j * lz);
                uvs.push(2 * i / this.width, 2 * j / this.width);
                if (i < this.width && j < this.width) {
                    indices.push(n, n + this.width + 1, n + 1);
                    indices.push(n + 1, n + this.width + 1, n + this.width + 2);
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
    }

    public pos2DToIJ(pos2D: BABYLON.Vector2): { i: number, j: number } {
        let lx = 2;
        let lz = Math.sin(Math.PI / 3) * lx;

        let x0 = - lx * (this.width + this.height * 0.5) * 0.5;
        let z0 = - lz * this.height * 0.5;

        let j = Math.round((pos2D.y - z0) / lz);
        let i = Math.round((pos2D.x - j * lx / 2 - x0) / lx);

        return { i: i, j: j};
    }

    public getHeightAt(pos2D: BABYLON.Vector2): number;
    public getHeightAt(pos3D: BABYLON.Vector3): number;
    public getHeightAt(a: any): number {
        let pos2D: BABYLON.Vector2;
        if (a instanceof BABYLON.Vector2) {
            pos2D = a;
        }
        else if (a instanceof BABYLON.Vector3) {
            pos2D = new BABYLON.Vector2(a.x, a.z);
        }
        let ray = new BABYLON.Ray(new BABYLON.Vector3(pos2D.x, 100, pos2D.y), BABYLON.Vector3.Down(), 200);
        let hit = ray.intersectsMesh(this.main.ground);
        if (hit.hit) {
            return hit.pickedPoint.y;
        }
        return 0;
    }
}