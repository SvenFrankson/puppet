/// 

class CellNetwork {

    public radius: number = 1;

    public cells: Cell[] = [];
    private _baseTriangles: CellTriangle[] = [];

    private debugBase: BABYLON.Mesh;
    private _debugRedMaterial: BABYLON.StandardMaterial;
    private get debugRedMaterial(): BABYLON.StandardMaterial {
        if (!this._debugRedMaterial) {
            this._debugRedMaterial = new BABYLON.StandardMaterial("debug-red-material", this.main.scene);
            this._debugRedMaterial.diffuseColor.copyFromFloats(1, 0, 0);
            this._debugRedMaterial.specularColor.copyFromFloats(0, 0, 0);
        }
        return this._debugRedMaterial;
    }
    private _debugGreenMaterial: BABYLON.StandardMaterial;
    private get debugGreenMaterial(): BABYLON.StandardMaterial {
        if (!this._debugGreenMaterial) {
            this._debugGreenMaterial = new BABYLON.StandardMaterial("debug-green-material", this.main.scene);
            this._debugGreenMaterial.diffuseColor.copyFromFloats(0, 1, 0);
            this._debugGreenMaterial.specularColor.copyFromFloats(0, 0, 0);
        }
        return this._debugGreenMaterial;
    }

    constructor(
        public main: Main
    ) {

    }

    public declutterRec(vertices: BABYLON.Vector2[], boxMin: BABYLON.Vector2, boxMax: BABYLON.Vector2, minD: number): void {
        if (vertices.length > 16) {
            if (boxMax.x - boxMin.x > boxMax.y - boxMin.y) {
                // Split vertical
                let xSplit = (boxMax.x + boxMin.x) * 0.5;
                let leftVertices: BABYLON.Vector2[] = [];
                let rightVertices: BABYLON.Vector2[] = [];
                vertices.forEach(v => {
                    if (v.x < xSplit) {
                        leftVertices.push(v);
                    }
                    else {
                        rightVertices.push(v);
                    }
                });
                this.declutterRec(leftVertices, boxMin, new BABYLON.Vector2(xSplit, boxMax.y), minD);
                this.declutterRec(rightVertices, new BABYLON.Vector2(xSplit, boxMin.y), boxMax, minD);
            }
            else {
                // Split horizontal
                let ySplit = (boxMax.y + boxMin.y) * 0.5;
                let bottomVertices: BABYLON.Vector2[] = [];
                let topVertices: BABYLON.Vector2[] = [];
                vertices.forEach(v => {
                    if (v.y < ySplit) {
                        bottomVertices.push(v);
                    }
                    else {
                        topVertices.push(v);
                    }
                });
                this.declutterRec(bottomVertices, boxMin, new BABYLON.Vector2(boxMax.x, ySplit), minD);
                this.declutterRec(topVertices, new BABYLON.Vector2(boxMin.x, ySplit), boxMax, minD);
            }
        }
        else {
            let squaredMinD: number = minD * minD;
            for (let i = 0; i < vertices.length; i++) {
                for (let j = 0; j < vertices.length; j++) {
                    if (i != j) {
                        let v0 = vertices[i];
                        let v1 = vertices[j];
                        let distSquared = BABYLON.Vector2.DistanceSquared(v0, v1);
                        if (distSquared < squaredMinD) {
                            let d = Math.floor(distSquared);
                            let n = v1.subtract(v0).normalize();
                            n.scaleInPlace((minD - d) * 0.5);
                            v1.addInPlace(n);
                            v0.subtractInPlace(n);
                        }
                    }
                }
            }
        }
    }

    public generate(r: number, n: number): void {
        if (r <= 0) {
            return;
        }
        this.radius = r;
        let points: BABYLON.Vector2[] = [];
        for (let i = 0; i < n; i++) {
            let p: BABYLON.Vector2 = BABYLON.Vector2.Zero();
            let v = new Cell(p, this);
            
            p.copyFromFloats(
                - this.radius * 2 + 2 * this.radius * 2 * Math.random(),
                - this.radius * 2 + 2 * this.radius * 2 * Math.random()
            );
            points.push(p);

            if (Math.abs(p.x) > this.radius) {
                v.forceLock = true;
            }
            if (Math.abs(p.y) > this.radius) {
                v.forceLock = true;
            }

            this.declutterRec(points, new BABYLON.Vector2(- this.radius * (2 + Math.random()), - this.radius * (2 + Math.random())), new BABYLON.Vector2(this.radius * (2 + Math.random()), this.radius * (2 + Math.random())), 1.5);
            this.declutterRec(points, new BABYLON.Vector2(- this.radius * (2 + Math.random()), - this.radius * (2 + Math.random())), new BABYLON.Vector2(this.radius * (2 + Math.random()), this.radius * (2 + Math.random())), 1.5);
            this.cells.push(v);
        }

        this.triangulate();
        
        this.cells.forEach(v => {
            v.updateShape();
        })
    }

    public triangulate(): void {

        this.cells.forEach(v => {
            v.reset();
        });
        this._baseTriangles = [];

        let coords: number[] = [];
        for (let i = 0; i < this.cells.length; i++) {
            let v = this.cells[i];
            coords.push(v.baseVertexPosition.x, v.baseVertexPosition.y);
        }
        let delaunay = new Delaunator(coords);
        let baseTriangles = delaunay.triangles;
        for (let i = 0; i < baseTriangles.length / 3; i++) {
            let i0 = baseTriangles[3 * i];
            let i1 = baseTriangles[3 * i + 1];
            let i2 = baseTriangles[3 * i + 2];

            let v0 = this.cells[i0];
            let v1 = this.cells[i1];
            let v2 = this.cells[i2];
            
            this._baseTriangles.push(CellTriangle.AddTriangle(v0, v1, v2));
        }

        this.cells.forEach(v => {
            if (!v.isBorder()) {
                v.sortTriangles();
                v.sortNeighbours();
            }
        });

        let additionalCells: UniqueList<Cell> = new UniqueList<Cell>();
        this.cells.forEach(v => {
            if (!v.isLocked()) {
                v.neighbors.forEach(n => {
                    additionalCells.push(n);
                })
            }
        })

        additionalCells.forEach(c => {
            c.forceLock = false;
        })
    }

    public worldPosToCell(w: BABYLON.Vector3): Cell {
        let closestSqrDist = BABYLON.Vector3.DistanceSquared(w, this.cells[0].barycenter3D);
        let closestIndex = 0;
        for (let i = 1; i < this.cells.length; i++) {
            let sqrDist = BABYLON.Vector3.DistanceSquared(w, this.cells[i].barycenter3D);
            if (sqrDist < closestSqrDist) {
                closestIndex = i;
                closestSqrDist = sqrDist;
            }
        }
        return this.cells[closestIndex];
    }

    public debugMorph(): void {
        let n = Math.floor(Math.random() * this.cells.length);
        let v = this.cells[n];
        let neighbors = v.neighbors;
        for (let i = 0; i < neighbors.length; i++) {
            let n1 = neighbors.get(i);
            let n2 = neighbors.get((i + 1) % neighbors.length);
            n1.morphTo(n2, () => {
                n1.updateShape();
            });

        }
    }

    public checkSurround(callback?: () => void): void {
        for (let i = 0; i < this.cells.length; i++) {
            let c = this.cells[i];
            let surround = c.isSurrounded();
            if (surround != -1 && c.value != surround) {
                this.lock++;
                c.morphValueTo(surround, () => {
                    this.lock--;
                    this.checkSurround(callback);
                });
                return;
            }
        }
        if (callback) {
            callback();
        }
    }

    public lock: number = 0;
    public morphCell(player: number, cell: Cell, inverse: boolean = false, callback?: () => void): void {
        if (this.lock > 0) {
            return;
        }
        if (cell.value < 2 && cell.value != player) {
            return;
        }
        if (cell.canRotate()) {
            let neighbors = cell.neighbors;
            for (let i = 0; i < neighbors.length; i++) {
                let n1 = neighbors.get(i);
                let n2: Cell;
                if (inverse) {
                    n2 = neighbors.get((i - 1 + neighbors.length) % neighbors.length);
                }
                else {
                    n2 = neighbors.get((i + 1) % neighbors.length);
                }
                let newValue = n1.value;
                this.lock++;
                n1.morphTo(n2, () => {
                    n2.value = newValue;
                    n1.updateShape();
                    n2.updateShape();
                    this.lock--;
                });
            }
        }
        if (callback) {
            let checkDone = () => {
                if (this.lock === 0) {
                    callback();
                }
                else {
                    requestAnimationFrame(checkDone);
                }
            }
            checkDone();
        }
        return;
        setTimeout(
            () => {
                let i = this.cells.indexOf(cell);
                let p = cell.baseVertexPosition.clone();
                let r = cell.radius;
                if (i != - 1) {
                    cell.dispose();
                    this.cells.splice(i, 1);
                }
                let newP = p;
                newP.x += (0.5 + Math.random());
                newP.y += (0.5 + Math.random());
                let newCell = new Cell(newP, this);
                this.cells.push(newCell);

                this.triangulate();
        
                this.cells.forEach(v => {
                    v.updateShape();
                })
            },
            1500
        )
    }

    public static Smooth(points: BABYLON.Vector3[], s: number = 6): BABYLON.Vector3[] {
        let newpoints: BABYLON.Vector3[] = [];
        for (let i = 0; i < points.length; i++) {
            let next = points[(i + 1) % points.length];
            newpoints.push(points[i], points[i].add(next).scaleInPlace(0.5));
        }
        points = newpoints;
        newpoints = [];
        for (let i = 0; i < points.length; i++) {
            let prev = points[(i - 1 + points.length) % points.length];
            let p = points[i];
            let next = points[(i + 1) % points.length];
            newpoints[i] = prev.add(p.scale(s)).add(next).scaleInPlace(1 / (s + 2));
        }
        return newpoints;
    }

    public debugDrawBase(): void {
        if (this.debugBase) {
            this.debugBase.dispose();
        }
        this.debugBase = new BABYLON.Mesh("debug-base-vertices-container");
        /*
        this.debugBase = BABYLON.MeshBuilder.CreateCylinder("debug-base-vertices-container", { height: 1, diameter: 2 * this.radius }, this.main.scene);
        this.debugBase.material = this.debugGreenMaterial;
        this.debugBase.position.y = - 0.5;
        for (let i = 0; i < this._baseVertices.length; i++) {
            let debugBaseVertexMesh = BABYLON.MeshBuilder.CreateBox("debug-base-vertex", { size: 0.05 });
            debugBaseVertexMesh.material = this.debugRedMaterial;
            debugBaseVertexMesh.position.copyFrom(this._baseVertices[i].position);
            debugBaseVertexMesh.position.y = 0.55;
            debugBaseVertexMesh.parent = this.debugBase;
        }
        */

        /*
        let lines: BABYLON.Vector3[][] = [];
        let colors: BABYLON.Color4[][] = [];
        for (let i = 0; i < this._baseTriangles.length; i++) {
            let b = this._baseTriangles[i].barycenter.scale(0.05);
            let p0 = this._baseTriangles[i].vertices[0].position.scale(0.95).addInPlace(b);
            let p1 = this._baseTriangles[i].vertices[1].position.scale(0.95).addInPlace(b);
            let p2 = this._baseTriangles[i].vertices[2].position.scale(0.95).addInPlace(b);

            let line: BABYLON.Vector3[] = [p0, p1, p2, p0];
            let c = new BABYLON.Color4(1, 1, 1, 1);
            if (this._baseTriangles[i].neighbors.length === 3) {
                c.copyFromFloats(1, 0, 0, 1);
            }
            else if (this._baseTriangles[i].neighbors.length === 2) {
                c.copyFromFloats(0, 0, 1, 1);
            }
            let color: BABYLON.Color4[] = [c, c, c, c];
            lines.push(line);
            colors.push(color);
        }
        let debugBaseEdges = BABYLON.MeshBuilder.CreateLineSystem("debug-base-edges", { lines: lines, colors: colors }, this.main.scene);
        debugBaseEdges.position.y = 0.55;
        debugBaseEdges.parent = this.debugBase;
        */
        

        let cellLines: BABYLON.Vector3[][] = [];
        let cellColors: BABYLON.Color4[][] = [];
        for (let i = 0; i < this.cells.length; i++) {
            let v = this.cells[i];
            if (!v.isBorder()) {
                let c = new BABYLON.Color4(0, 1, 1, 1);
                let line: BABYLON.Vector3[] = [];
                let color: BABYLON.Color4[] = [];
                this.cells[i].triangles.forEach(tri => {
                    let pp = tri.barycenter3D.clone();
                    line.push(pp);
                });
                line = CellNetwork.Smooth(line);
                line = CellNetwork.Smooth(line);
                line = CellNetwork.Smooth(line);
                line.push(line[0]);
                for (let i = 0; i < line.length; i++) {
                    color.push(c);
                }
                cellLines.push(line);
                cellColors.push(color);
            }
        }
        let debugCells = BABYLON.MeshBuilder.CreateLineSystem("debug-cells", { lines: cellLines, colors: cellColors }, this.main.scene);
        debugCells.position.y = 0.55;
        debugCells.parent = this.debugBase;
    }
}