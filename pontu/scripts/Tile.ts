class Tile {

    public static Colors: BABYLON.Color4[] = [
        BABYLON.Color4.FromHexString("#0ABB07FF"),
        BABYLON.Color4.FromHexString("#FFC800FF"),
        BABYLON.Color4.FromHexString("#FF1900FF"),
        BABYLON.Color4.FromHexString("#070ABBFF")
    ]

    public color: number = - 1;
    public value: number = 0;

    public isInRange: boolean = true;
    public isPlayable: boolean = false;
    
    public points: BABYLON.Vector2[];
    public shape: BABYLON.Mesh;
    public text: HTMLDivElement;

    constructor(
        public i: number,
        public j: number,
        public board: Board
    ) {
        this.points = [
            new BABYLON.Vector2(- 2, - 2),
            new BABYLON.Vector2(2, - 2),
            new BABYLON.Vector2(2, 2),
            new BABYLON.Vector2(- 2, 2)
        ];
    }

    public reset(): void {
        this.color = - 1;
        this.value = 0;
        this.isInRange = true;
        this.isPlayable = false;
    }

    public dispose(): void {
        if (this.shape) {
            this.shape.dispose();
            this.shape = undefined;
        }
        if (this.text) {
            document.body.removeChild(this.text);
            this.text = undefined;
        }
    }

    public hide(): void {
        if (this.shape) {
            this.shape.isVisible = false;
        }
    }

    public updateShape(points: BABYLON.Vector2[] = this.points): void {
        if (!this.shape) {
            this.shape = new BABYLON.Mesh("shape_" + this.i + "_" + this.j);
            this.shape.position.x = (this.i - 5) * 4;
            this.shape.position.z = (this.j - 5) * 4;
            /*
            let material = new BABYLON.StandardMaterial("shape-material", this.network.main.scene);
            material.diffuseColor.copyFromFloats(1, 1, 1);
            material.specularColor.copyFromFloats(0, 0, 0);
            this.shape.material = material;
            */
           let material = new ToonMaterial("shape-material", false, this.board.main.scene);
           this.shape.material = material;
        }
        if (!this.text) {
            this.text = document.createElement("div");
            document.body.appendChild(this.text);
            this.text.classList.add("tile-text");
            this.text.style.right = (this.board.main.xToRight(this.shape.position.x + 2.5) * 100).toFixed(1) + "%";
            this.text.style.bottom = (this.board.main.yToBottom(this.shape.position.z - 3.5) * 100).toFixed(1) + "%";
        }
        if (this.value === 0) {
            this.text.innerText = "";
        }
        else {
            this.text.innerText = this.value.toFixed(0);
        }
        if (true) {
            if (!this.isInRange) {
                this.shape.isVisible = false;
                return;
            }
            this.shape.isVisible = true;
            
            let dOut = 0.1;
            let dIn = 0.8;

            let lineOut = Math2D.FattenShrinkEdgeShape(points, - dOut);
            let lineIn = Math2D.FattenShrinkEdgeShape(points, - dIn);
            lineOut = Math2D.Smooth(lineOut, 7);
            lineOut = Math2D.Smooth(lineOut, 5);
            lineOut = Math2D.Smooth(lineOut, 3);
            lineIn = Math2D.Smooth(lineIn, 7);
            lineIn = Math2D.Smooth(lineIn, 5);
            lineIn = Math2D.Smooth(lineIn, 3);

            let c: BABYLON.Color4;
            if (this.color < 0) {
                if (this.isPlayable) {
                    c = new BABYLON.Color4(0.8, 0.8, 0.8, 1);
                }
                else {
                    c = new BABYLON.Color4(0.3, 0.3, 0.3, 1);
                }
            }
            else {
                c = Tile.Colors[this.color];
            }

            let data = new BABYLON.VertexData();
            let positions: number[] = [0, 0, 0];
            let normals: number[] = [0, 1, 0];
            let indices: number[] = [];
            let colors: number[] = [c.r, c.g, c.b, 1];

            let l = lineIn.length;

            for (let i = 0; i < lineIn.length; i++) {

                positions.push(lineIn[i].x, 0, lineIn[i].y);
                normals.push(0, 1, 0);
                colors.push(c.r, c.g, c.b, 1);
                if (i != lineIn.length - 1) {
                    indices.push(0, i + 1, i + 2);
                }
                else {
                    indices.push(0, i + 1, 1);
                }
            }

            for (let i = 0; i < lineOut.length; i++) {
                positions.push(lineOut[i].x, 0, lineOut[i].y);
                let n = (lineOut[i].x) * (lineOut[i].x) + (lineOut[i].y) * (lineOut[i].y);
                n = Math.sqrt(n);
                normals.push((lineOut[i].x) / n, 0, (lineOut[i].y) / n);
                colors.push(c.r, c.g, c.b, 1);
                if (i != lineOut.length - 1) {
                    indices.push(i + l + 1, i + 2, i + 1);
                    indices.push(i + 2, i + l + 1, i + l + 2);
                }
                else {
                    indices.push(i + l + 1, 1, i + 1);
                    indices.push(1, i + l + 1, l + 1);
                }
            }

            data.positions = positions;
            data.normals = normals;
            data.indices = indices;
            data.colors = colors;
            data.applyToMesh(this.shape);
        }
    }
}