interface ICellNetwork {
    cells: Cell[];
    cellTriangles: CellTriangle[];
}

class CellNetwork implements ICellNetwork {

    public cells: Cell[] = [];
    public cellTriangles: CellTriangle[] = [];

    public clone(): CellNetwork {
        let cloneNetwork = new CellNetwork();

        for (let i = 0; i < this.cells.length; i++) {
            let newCell = this.cells[i].clone();
            cloneNetwork.cells[i] = newCell;
        }
        for (let i = 0; i < this.cellTriangles.length; i++) {
            let newTriangle = this.cellTriangles[i].clone();
            cloneNetwork.cellTriangles[i] = newTriangle;
        }

        for (let i = 0; i < this.cells.length; i++) {
            let baseCell = this.cells[i];
            let newCell = cloneNetwork.cells[i];

            baseCell.neighbors.forEach((c, j) => {
                newCell.neighbors.set(j, cloneNetwork.cells[c.index]);
            })
            baseCell.triangles.forEach((t, j) => {
                newCell.triangles.set(j, cloneNetwork.cellTriangles[t.index]);
            })
        }
        for (let i = 0; i < this.cellTriangles.length; i++) {
            let baseTriangle = this.cellTriangles[i];
            let newTriangle = cloneNetwork.cellTriangles[i];

            baseTriangle.cells.forEach((c, j) => {
                newTriangle.cells[j] = cloneNetwork.cells[c.index];
            })
            baseTriangle.neighbors.forEach((t, j) => {
                newTriangle.neighbors.set(j, cloneNetwork.cellTriangles[t.index]);
            })
        }

        return cloneNetwork;
    }

    public copyValues(target: CellNetwork): void {
        for (let i = 0; i < this.cells.length; i++) {
            target.cells[i].value = this.cells[i].value;
        }
    }

    public rotate(cell: Cell, reverse?: boolean): number[] {
        let variances = [0, 0, 0];
        let values: number[] = [];
        let nCount = cell.neighbors.length;
        let inc = reverse ? 1 : - 1;

        cell.neighbors.forEach((n, i) => {
            values[i] = n.value;
        });
        cell.neighbors.forEach((n, i) => {
            n.value = values[(i + inc + nCount) % nCount];
        });

        cell.neighbors.forEach((n) => {
            let surroundN = n.isSurrounded();
            if (surroundN != - 1 && surroundN != n.value) {
                variances[n.value]--;
                variances[surroundN]++;
                n.value = surroundN;
            }
            n.neighbors.forEach((nn) => {
                let surroundNN = nn.isSurrounded();
                if (surroundNN != - 1 && surroundN != nn.value) {
                    variances[nn.value]--;
                    variances[surroundNN]++;
                    nn.value = surroundNN;
                }
            });
        });

        return variances;
    }

    public getVariance(cell: Cell, reverse?: boolean): number [] {
        let variances = [0, 0, 0];
        let values: number[] = [];
        let nCount = cell.neighbors.length;
        let inc = reverse ? - 1 : 1;

        cell.neighbors.forEach((n, i) => {
            values[i] = n.value;
        });
        cell.neighbors.forEach((n, i) => {
            n.value = values[(i + inc + nCount) % nCount];
        });

        let updatedCells: UniqueList<Cell> = new UniqueList<Cell>();
        cell.neighbors.forEach((n) => {
            let surroundN = n.isSurrounded();
            if (surroundN != - 1 && surroundN != 1 && surroundN != n.value && !updatedCells.contains(n)) {
                variances[n.value]--;
                variances[surroundN]++;
                updatedCells.push(n);
            }
            n.neighbors.forEach((nn) => {
                let surroundNN = nn.isSurrounded();
                if (surroundNN != - 1 && surroundNN != 1 && surroundN != nn.value && !updatedCells.contains(nn)) {
                    variances[nn.value]--;
                    variances[surroundNN]++;
                    updatedCells.push(nn);
                }
            });
        });

        cell.neighbors.forEach((n, i) => {
            n.value = values[i];
        });

        return variances;
    }

    public getScore(p: number): number {
        return this.cells.filter(c => { return c.value === p; }).length - this.cells.filter(c => { return c.value === (p + 1) % 2; }).length;
    }

    public getBoardValueForPlayer(p: number): number {
        let possibleGain = 0;
        
        let availableCells = this.cells.filter(c => { return c.canRotate(); });
        availableCells = availableCells.filter(c => { return (c.value === p && !(c.isSurrounded() === p)) || c.value === 2; });
        
        availableCells.forEach(c => {
            let variance = this.getVariance(c);
            if (variance[p] > 0) {
                possibleGain += variance[p];
            }
            let varianceReverse = this.getVariance(c, true);
            if (varianceReverse[p] > 0) {
                possibleGain += varianceReverse[p];
            }
        });

        return possibleGain;
    }

    public removeHiddenCells(): void {
        console.log("Cells count = " + this.cells.length);
        let hits: Cell[] = [];
        this.cells.forEach(cell => {
            if (cell.isHidden()) {
                hits.push(cell);
            }
        });
        while (hits.length > 0) {
            hits.pop().dispose();
        }
        let i = 0;
        while (i < this.cells.length) {
            if (this.cells[i].isDisposed) {
                this.cells.splice(i, 1);
            }
            else {
                i++;
            }
        }
        i = 0;
        while (i < this.cellTriangles.length) {
            if (this.cellTriangles[i].isDisposed) {
                this.cellTriangles.splice(i, 1);
            }
            else {
                i++;
            }
        }
        this.reIndex();
        console.log("Cells count = " + this.cells.length);
    }

    public reIndex(): void {
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i].index = i;
        }
        for (let i = 0; i < this.cellTriangles.length; i++) {
            this.cellTriangles[i].index = i;
        }
    }
}

class CellNetworkDisplayed extends CellNetwork {

    public radius: number = 1;

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
        super();
    }

    public declutterRec(vertices: BABYLON.Vector2[], boxMin: BABYLON.Vector2, boxMax: BABYLON.Vector2, minD: number): void {
        for (let i = 0; i < vertices.length; i++) {
            boxMin.x = Math.min(boxMin.x, vertices[i].x);
            boxMin.y = Math.min(boxMin.y, vertices[i].y);
            boxMax.x = Math.max(boxMax.x, vertices[i].x);
            boxMax.y = Math.max(boxMax.y, vertices[i].y);
        }
        if (vertices.length > 32) {
            if (boxMax.x - boxMin.x > boxMax.y - boxMin.y) {
                // Split vertical
                let r = Math.random() * 0.5 + 0.25;
                let xSplit = boxMax.x * r + boxMin.x * (1 - r);
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
                let r = Math.random() * 0.5 + 0.25;
                let ySplit = boxMax.y * r + boxMin.y * (1 - r);
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
            /*
            // Force based version.
            let C = 100;
            let forces: BABYLON.Vector2[] = [];
            for (let i = 0; i < vertices.length; i++) {
                let v0 = vertices[i];
                forces[i] = BABYLON.Vector2.Zero();
                for (let j = 0; j < vertices.length; j++) {
                    if (i != j) {
                        let v1 = vertices[j];
                        let n = v1.subtract(v0).normalize();
                        let d = BABYLON.Vector2.Distance(v0, v1);
                        let f = n.scaleInPlace(C / (d * d));
                        forces[i].addInPlace(f);
                    }
                }
            }
            for (let i = 0; i < vertices.length; i++) {
                let v = vertices[i];
                let f = forces[i];
                v.addInPlace(f);
            }
            */
            
            // Merge based version
            for (let i = 0; i < vertices.length; i++) {
                let v0 = vertices[i];
                for (let j = 0; j < vertices.length; j++) {
                    if (i != j) {
                        let v1 = vertices[j];
                        let dd = BABYLON.Vector2.DistanceSquared(v0, v1);
                        if (dd < 8) {
                            v1.x = Infinity;
                            v1.y = Infinity;
                            vertices.splice(j, 1);
                        }
                    }
                }
            }
        }
    }

    public random(seed: number, n: number): number {
        while (n > 10000) {
            n-= 10000;
        }
        return 0.5 * (Math.cos(seed + 13 * n) + 1);
    }

    public generate(r: number, n: number): void {
        let seed = 0;
        let iterator = 0;
        if (r <= 0) {
            return;
        }
        this.radius = r;
        let points: BABYLON.Vector2[] = [];
        for (let i = 0; i < n; i++) {
            let p: BABYLON.Vector2 = BABYLON.Vector2.Zero();
            
            p.copyFromFloats(
                - this.radius * 2 + 2 * this.radius * 2 * this.random(seed, iterator++),
                - this.radius * 2 + 2 * this.radius * 2 * this.random(seed, iterator++)
            );
            points.push(p);
        }

        for (let i = 0; i < 10; i++) {
            this.declutterRec(points, new BABYLON.Vector2(- this.radius * (2 + Math.random()), - this.radius * (2 + Math.random())), new BABYLON.Vector2(this.radius * (2 + Math.random()), this.radius * (2 + Math.random())), 1.5);
            points = points.filter(p => { return isFinite(p.x) && isFinite(p.y); });
        }

        for (let i = 0; i < points.length; i++) {
            let p = points[i];

            let v = new Cell(p, i, this);
    
            if (Math.abs(p.x) > this.radius) {
                v.forceLock = true;
            }
            if (Math.abs(p.y) > this.radius) {
                v.forceLock = true;
            }

            this.cells.push(v);
        }

        this.triangulate();

        let unassignedCells = this.cells.filter(c => { return !c.isLocked(); });
        let l = unassignedCells.length;
        let c = Math.floor(l / 3);
        for (let i = 0; i < c; i++) {
            let r = Math.floor(Math.random() * unassignedCells.length);
            unassignedCells.splice(r, 1)[0].value = 0;
        }
        for (let i = 0; i < c; i++) {
            let r = Math.floor(Math.random() * unassignedCells.length);
            unassignedCells.splice(r, 1)[0].value = 1;
        }

        let clone = this.clone();
        this.cells = clone.cells;
        this.cellTriangles = clone.cellTriangles;

        this.removeHiddenCells();
        
        this.cells.forEach(v => {
            if (v.isLocked()) {
                v.value = - 1;
            }
            v.morphFromZero();
        })

        console.log("!");
    }

    public dispose(): void {
        this.cells.forEach(c => {
            c.disposeMesh();
        })
        this.cells = [];
        this.cellTriangles = [];
    }

    public triangulate(): void {

        this.cells.forEach(v => {
            v.reset();
        });
        this.cellTriangles = [];

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
            
            this.cellTriangles.push(CellTriangle.AddTriangle(i, v0, v1, v2));
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
            if (surround != -1 && surround != 1 && c.value != surround) {
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
    public morphCell(player: number, cell: Cell, reverse: boolean = false, callback?: () => void): void {
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
                if (reverse) {
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
    }

    public static Smooth(points: BABYLON.Vector2[], s: number = 6): BABYLON.Vector2[] {
        let newpoints: BABYLON.Vector2[] = [];
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
    }
}