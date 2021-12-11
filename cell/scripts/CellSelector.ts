class CellSelector {

    public lineMeshOut: BABYLON.LinesMesh;
    public lineMeshIn: BABYLON.LinesMesh;
    public highlightShape: BABYLON.Mesh;

    constructor(public network: CellNetwork) {
        
    }

    public update(cell: Cell): void {
        if (this.lineMeshIn) {
            this.lineMeshIn.dispose();
        }
        if (this.lineMeshOut) {
            this.lineMeshOut.dispose();
        }
        if (this.highlightShape) {
            this.highlightShape.dispose();
        }

        if (!cell) {
            return;
        }

        let neighborsCyclePoint: BABYLON.Vector2[] = [];
        let neighbors = cell.neighbors;
        neighbors.forEach(c => {
            neighborsCyclePoint.push(c.barycenter);
        });

        let neighborsCyclePointIn: BABYLON.Vector2[] = Math2D.FattenShrinkEdgeShape(neighborsCyclePoint, - 0.1);
        neighborsCyclePointIn.push(neighborsCyclePointIn[0]);
        let neighborsCyclePointOut: BABYLON.Vector2[] = Math2D.FattenShrinkEdgeShape(neighborsCyclePoint, 0.1);
        neighborsCyclePointOut.push(neighborsCyclePointOut[0]);
        let line3DIn: BABYLON.Vector3[] = [];
        let line3DOut: BABYLON.Vector3[] = [];
        let line3DColor: BABYLON.Color4[] = [];

        for (let i = 0; i < neighborsCyclePointIn.length; i++) {
            line3DIn.push(new BABYLON.Vector3(neighborsCyclePointIn[i].x, 0, neighborsCyclePointIn[i].y));
            line3DOut.push(new BABYLON.Vector3(neighborsCyclePointOut[i].x, 0, neighborsCyclePointOut[i].y));
            line3DColor.push(new BABYLON.Color4(1, 1, 1, 1));
        }
        
        this.lineMeshIn = BABYLON.MeshBuilder.CreateLines("shape-line", { points: line3DIn, colors: line3DColor, updatable: true });
        this.lineMeshOut = BABYLON.MeshBuilder.CreateLines("shape-line", { points: line3DOut, colors: line3DColor, updatable: true });

        
        let highLightData = new BABYLON.VertexData();
        let positions: number[] = [];
        let colors: number[] = [];
        let indices: number[] = [];
        neighbors.forEach(c => {
            let points = Math2D.FattenShrinkEdgeShape(c.points, - 0.1);
            points.push(points[0]);
            let l = positions.length / 3;
            positions.push(c.barycenter.x, 0, c.barycenter.y);
            colors.push(Cell.PickColor.r, Cell.PickColor.g, Cell.PickColor.b, Cell.PickColor.a);
            
            for (let i = 0; i < points.length; i++) {
                positions.push(points[i].x, 0, points[i].y);
                colors.push(Cell.PickColor.r, Cell.PickColor.g, Cell.PickColor.b, Cell.PickColor.a);
                if (i != points.length - 1) {
                    indices.push(l, l + i, l + i + 1);
                }
                else {
                    indices.push(l, l + i, l + 1);
                }
            }
        });
        highLightData.positions = positions;
        highLightData.colors = colors;
        highLightData.indices = indices;

        if (!this.highlightShape || this.highlightShape.isDisposed()) {
            this.highlightShape = new BABYLON.Mesh("highlight-shape");
            let material = new BABYLON.StandardMaterial("highlight-shape-material", this.network.main.scene);
            material.diffuseColor.copyFromFloats(1, 1, 1);
            material.alpha = 1;
            material.specularColor.copyFromFloats(0, 0, 0);
            this.highlightShape.material = material;
        }

        highLightData.applyToMesh(this.highlightShape)
        this.highlightShape.position.y = -0.01;
    }
}