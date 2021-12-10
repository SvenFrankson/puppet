class CellSelector {

    public lineMeshOut: BABYLON.LinesMesh;
    public lineMeshIn: BABYLON.LinesMesh;

    public update(cell: Cell): void {
        if (this.lineMeshIn) {
            this.lineMeshIn.dispose();
        }
        if (this.lineMeshOut) {
            this.lineMeshOut.dispose();
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
    }
}