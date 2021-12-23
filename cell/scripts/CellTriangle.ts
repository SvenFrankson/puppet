class CellTriangle {

    public barycenter: BABYLON.Vector2;
    private _barycenter3D: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public get barycenter3D(): BABYLON.Vector3 {
        this._barycenter3D.x = this.barycenter.x;
        this._barycenter3D.y = 0;
        this._barycenter3D.z = this.barycenter.y;

        return this._barycenter3D;
    }

    public cells: Cell[] = [];
    public neighbors: UniqueList<CellTriangle> = new UniqueList<CellTriangle>();
    
    public isDisposed: boolean = false;

    constructor(public index: number) {

    }

    public clone(): CellTriangle {
        let cloneTriangle = new CellTriangle(this.index);
        cloneTriangle.barycenter = this.barycenter.clone();
        return cloneTriangle;
    }

    public dispose(): void {
        this.isDisposed = true;
        this.cells.forEach(cell => {
            cell.triangles.remove(this);
        })
        this.neighbors.forEach(nCell => {
            nCell.neighbors.remove(this);
        });
    }

    public static AddTriangle(index: number, v1: Cell, v2: Cell, v3: Cell): CellTriangle {
        let tri = new CellTriangle(index);
        tri.cells = [v1, v2, v3];
        tri.barycenter = v1.baseVertexPosition.add(v2.baseVertexPosition).addInPlace(v3.baseVertexPosition).scaleInPlace(1 / 3);

        v1.triangles.push(tri);
        v1.neighbors.push(v2);
        v1.neighbors.push(v3);
        
        v2.triangles.push(tri);
        v2.neighbors.push(v1);
        v2.neighbors.push(v3);
        
        v3.triangles.push(tri);
        v3.neighbors.push(v1);
        v3.neighbors.push(v2);

        v1.triangles.forEach(v1Tri => {
            if (v1Tri != tri) {
                if (v2.triangles.contains(v1Tri) || v3.triangles.contains(v1Tri)) {
                    tri.neighbors.push(v1Tri);
                    v1Tri.neighbors.push(tri);
                }
            }
        })

        v2.triangles.forEach(v2Tri => {
            if (v2Tri != tri) {
                if (v1.triangles.contains(v2Tri) || v3.triangles.contains(v2Tri)) {
                    tri.neighbors.push(v2Tri);
                    v2Tri.neighbors.push(tri);
                }
            }
        })

        v3.triangles.forEach(v3Tri => {
            if (v3Tri != tri) {
                if (v1.triangles.contains(v3Tri) || v2.triangles.contains(v3Tri)) {
                    tri.neighbors.push(v3Tri);
                    v3Tri.neighbors.push(tri);
                }
            }
        })

        return tri;
    }

    public isBorder(): boolean {
        return this.neighbors.length < 3;
    }
}