class Ground extends BABYLON.Mesh {

    public heightMap: number[][] = [];
    public colorMap: BABYLON.Color3[][] = [];
    public dirtMesh: BABYLON.Mesh;

    constructor(
        public size: number,
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

                for (let i = 0; i <= this.size; i++) {
                    this.heightMap[i] = [];
                    this.colorMap[i] = [];
                    for (let j = 0; j <= this.size; j++) {
                        let di = Math.floor(i / this.size * 64);
                        let dj = Math.floor(j / this.size * 64);
                        let h = imageData.data[4 * (di + 1024 * dj)];

                        this.heightMap[i][j] = h / 256 * 80 - 40;
                        this.colorMap[i][j] = BABYLON.Color3.White();
                    }
                }

                this.refreshMesh();
                
                resolve();
            }
            image.src = "assets/ground.png";

            let groundMaterial = new TerrainMaterial("ground-material", false, this.main.scene);
            groundMaterial.setTexture("colorTexture", new BABYLON.Texture("assets/ground_2.png", this.main.scene));
            
            this.material = groundMaterial;
        });
    }

    public do(posI: number, posJ: number, r: number, callback: (i: number, j: number, d: number) => void): void {
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
                    if (pi + di * n > 0 && pi + di * n <= this.size) {
                        if (pj + dj * n > 0 && pj + dj * n <= this.size) {
                            callback(pi + di * n, pj + dj * n, d);
                        }
                    }
                }
            }
        }
    }

    public flatten(posI: number, posJ: number, h: number, r: number): void {
        this.heightMap[posI][posJ] = h;
        this.do(posI, posJ, r, (i, j, d) => {
            let f = (1 - d / r) * 2;
            f = Math.min(1, f);
            let th = this.heightMap[i][j]
            this.heightMap[i][j] = h * f + th * (1 - f);
        });

        this.refreshMesh();
    }

    public colorize(posI: number, posJ: number, r: number, c: BABYLON.Color3): void {
        this.colorMap[posI][posJ].copyFrom(c);
        this.do(posI, posJ, r, (i, j, d) => {
            this.colorMap[i][j].copyFrom(c);
        });

        this.refreshMesh();
    }

    public refreshMesh(): void {
        let data = new BABYLON.VertexData();
                
        let positions: number[] = [];
        let indices: number[] = [];
        let uvs: number[] = [];
        let colors: number[] = [];

        let lx = 2;
        let lz = Math.sin(Math.PI / 3) * lx;

        let x0 = - lx * (this.size + this.size * 0.5) * 0.5;
        let z0 = - lz * this.size * 0.5;

        for (let i = 0; i <= this.size; i++) {
            for (let j = 0; j <= this.size; j++) {
                let n = i + j * (this.size + 1);
                positions.push(x0 + i * lx + j * lx * 0.5, this.heightMap[i][j], z0 + j * lz);
                uvs.push(2 * i / this.size, 2 * j / this.size);
                if (i < this.size && j < this.size) {
                    indices.push(n, n + this.size + 1, n + 1);
                    indices.push(n + 1, n + this.size + 1, n + this.size + 2);
                }
                let c = this.colorMap[i][j];
                colors.push(c.r, c.g, c.b, 1);
            }
        }

        for (let it = 0; it < 2; it++) {
            let newColors: number[] = [];
            for (let i = 0; i <= this.size; i++) {
                for (let j = 0; j <= this.size; j++) {
                    let n = i + j * (this.size + 1);
                    let r = colors[4 * n];
                    let g = colors[4 * n + 1];
                    let b = colors[4 * n + 2];
                    let iIndexes = [
                        i + 1,
                        i + 1,
                        i,
                        i - 1,
                        i - 1,
                        i
                    ];
                    let jIndexes = [
                        j,
                        j - 1,
                        j - 1,
                        j,
                        j + 1,
                        j + 1
                    ];
                    let count = 1;
                    for (let p = 0; p < 6; p++) {
                        let pi = iIndexes[p];
                        let pj = jIndexes[p];
                        let pn = pi + pj * (this.size + 1);
                        if (pn >= 0 && 4 * pn < colors.length) {
                            r += colors[4 * pn];
                            g += colors[4 * pn + 1];
                            b += colors[4 * pn + 2];
                            count++;
                        }
                    }
                    newColors[4 * n] = r / count;
                    newColors[4 * n + 1] = g / count;
                    newColors[4 * n + 2] = b / count;         
                }
            }
            colors = newColors;
        }

        let normals: number[] = [];
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);

        data.positions = positions;
        data.indices = indices;
        data.normals = normals;
        data.uvs = uvs;
        data.colors = colors;

        data.applyToMesh(this);
    }

    public pos2DToIJ(pos2D: BABYLON.Vector2): { i: number, j: number } {
        let lx = 2;
        let lz = Math.sin(Math.PI / 3) * lx;

        let x0 = - lx * (this.size + this.size * 0.5) * 0.5;
        let z0 = - lz * this.size * 0.5;

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