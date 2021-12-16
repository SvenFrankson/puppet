class Score {

    public playerScoreMesh: BABYLON.Mesh[] = [];
    public playerScoreText: HTMLDivElement[] = [];

    constructor(public playerCount: number = 2, public network: CellNetworkDisplayed) {
        for (let i = 0; i < this.playerCount; i++) {
            this.playerScoreText[i] = document.getElementById("score-p" + i) as HTMLDivElement;
        }
        this.playerScoreText[0].style.right = (this.network.main.xToRight(- 49) * 100).toFixed(0) + "%";
        this.playerScoreText[0].style.bottom = (this.network.main.yToBottom(- 30) * 100).toFixed(0) + "%";
        this.playerScoreText[0].style.color = Cell.Colors[0].toHexString().substring(0, 7);
        
        this.playerScoreText[2].style.right = (this.network.main.xToRight(- 49) * 100).toFixed(0) + "%";
        this.playerScoreText[2].style.top = (this.network.main.yToTop(30) * 100).toFixed(0) + "%";
        this.playerScoreText[2].style.color = Cell.Colors[2].toHexString().substring(0, 7);
    }

    public update(): void {
        
        let scores: number[] = [];
        for (let i = 0; i < this.playerCount; i++) {
            scores[i] = this.network.cells.filter(c => { return c.value === i; }).length;
            this.playerScoreText[i].innerText = scores[i].toFixed(0);
        }
        let scoreTotal = scores.reduce((s1, s2) => { return s1 + s2; });
        console.log(scores);
        console.log(scoreTotal);
        
        for (let p = 0; p < this.playerCount; p++) {
            if (!this.playerScoreMesh[p]) {
                this.playerScoreMesh[p] = new BABYLON.Mesh("shape");
                this.playerScoreMesh[p].position.x = - 45;
                this.playerScoreMesh[p].position.z = - 30;
                /*
                let material = new BABYLON.StandardMaterial("shape-material", this.network.main.scene);
                material.diffuseColor.copyFromFloats(1, 1, 1);
                material.specularColor.copyFromFloats(0, 0, 0);
                this.playerScoreMesh[i].material = material;
                */
               let material = new ToonMaterial("shape-material", false, this.network.main.scene);
               this.playerScoreMesh[p].material = material;
            }

            let yMin = 0;
            for (let i = 0; i < p; i++) {
                yMin += scores[i] / scoreTotal * 60;
            }
            let yMax = yMin + scores[p] / scoreTotal * 60;

            let points = [
                new BABYLON.Vector2(3, yMin),
                new BABYLON.Vector2( 3, yMax),
                new BABYLON.Vector2(- 3, yMax),
                new BABYLON.Vector2(- 3, yMin),
            ]
    
            let dOut = 0;
            let dIn = 0.7;
    
            let lineOut = Math2D.FattenShrinkEdgeShape(points, - dOut);
            let lineIn = Math2D.FattenShrinkEdgeShape(points, - dIn);
            lineOut = CellNetworkDisplayed.Smooth(lineOut, 11);
            lineOut = CellNetworkDisplayed.Smooth(lineOut, 9);
            lineOut = CellNetworkDisplayed.Smooth(lineOut, 1);
            lineIn = CellNetworkDisplayed.Smooth(lineIn, 11);
            lineIn = CellNetworkDisplayed.Smooth(lineIn, 9);
            lineIn = CellNetworkDisplayed.Smooth(lineIn, 1);
    
            let center = BABYLON.Vector2.Zero();
            for (let i = 0; i < points.length; i++) {
                center.addInPlace(points[i]);
            }
            center.scaleInPlace(1 / points.length);
    
            let data = new BABYLON.VertexData();
            let positions: number[] = [center.x, 0, center.y];
            let normals: number[] = [0, 1, 0];
            let indices: number[] = [];
            let colors: number[] = [...Cell.Colors[p].asArray()];
    
            let l = lineIn.length;
    
            for (let i = 0; i < lineIn.length; i++) {
    
                positions.push(lineIn[i].x, 0, lineIn[i].y);
                normals.push(0, 1, 0);
                colors.push(...Cell.Colors[p].asArray());
                if (i != lineIn.length - 1) {
                    indices.push(0, i + 1, i + 2);
                }
                else {
                    indices.push(0, i + 1, 1);
                }
            }
    
            for (let i = 0; i < lineOut.length; i++) {
                positions.push(lineOut[i].x, 0, lineOut[i].y);
                let n = (lineOut[i].x - center.x) * (lineOut[i].x - center.x) + (lineOut[i].y - center.y) * (lineOut[i].y - center.y);
                n = Math.sqrt(n);
                normals.push((lineOut[i].x - center.x) / n, 0, (lineOut[i].y - center.y) / n);
                colors.push(...Cell.Colors[p].asArray());
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
            data.applyToMesh(this.playerScoreMesh[p]);
        }
    }
}