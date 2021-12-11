class Cell {

    public static Colors: BABYLON.Color4[] = [
        BABYLON.Color4.FromHexString("#8AC33CFF"),
        BABYLON.Color4.FromHexString("#C33C8AFF"),
        BABYLON.Color4.FromHexString("#3C8AC3FF")
    ]
    public static Color: BABYLON.Color4 = new BABYLON.Color4(0, 0, 0, 1);
    //public static PickColor: BABYLON.Color4 = BABYLON.Color4.FromHexString("#FCFCFCFF");
    public static PickColor: BABYLON.Color4 = BABYLON.Color4.FromHexString("#FCFCFCFF");
    public static PickNeighborColor: BABYLON.Color4 = BABYLON.Color4.FromHexString("#004d1eff");
    public static LockedColor: BABYLON.Color4 = BABYLON.Color4.FromHexString("#A0A0A0FF");

    public neighbors: UniqueList<Cell> = new UniqueList<Cell>();
    public triangles: UniqueList<CellTriangle> = new UniqueList<CellTriangle>();

    public value: number = 0;
    public points: BABYLON.Vector2[];
    public radius: number = 1;
    public barycenter: BABYLON.Vector2;
    public shape: BABYLON.Mesh;
    public shapeLine: BABYLON.LinesMesh;

    public highlightStatus: number = 0;

    public forceLock: boolean = false;

    public isDisposed: boolean = false;

    constructor(
        public baseVertexPosition: BABYLON.Vector2,
        public network: CellNetwork
    ) {
        this.value = Math.floor(Math.random() * 3);
    }

    public reset(): void {
        this.neighbors = new UniqueList<Cell>();
        this.triangles = new UniqueList<CellTriangle>();
        this.points = [];
    }

    public dispose(): void {
        this.isDisposed = true;
        if (this.shape) {
            this.shape.dispose();
        }
        if (this.shapeLine) {
            this.shapeLine.dispose();
        }
    }

    private _barycenter3D: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public get barycenter3D(): BABYLON.Vector3 {
        if (this.barycenter) {
            this._barycenter3D.x = this.barycenter.x;
            this._barycenter3D.y = 0;
            this._barycenter3D.z = this.barycenter.y;
        }
        return this._barycenter3D;
    }

    public isBorder(): boolean {
        let c = 0;
        this.triangles.forEach(tri => {
            if (tri.isBorder()) {
                c++;
            }
        });
        return c >= 2;
    }

    public isHidden(): boolean {
        let l = true;
        this.neighbors.forEach(n => {
            if (!n.isLocked() && !n.isBorder()) {
                l = false;
            }
        });
        return l;
    }

    public isLocked(): boolean {
        if (this.forceLock) {
            return true;
        }
        let l = false;
        this.neighbors.forEach(n => {
            if (n.isBorder()) {
                l = true;
            }
        });
        return l;
    }

    public isSurrounded(): number {
        let surroundValue: number;
        this.neighbors.forEach(n => {
            if (isNaN(surroundValue) || surroundValue === n.value) {
                surroundValue = n.value;
            }
            else {
                surroundValue = - 1;
            }
        });
        return surroundValue;
    }

    public canRotate(): boolean {
        let l = true;
        this.neighbors.forEach(n => {
            if (n.isLocked()) {
                l = false;
            }
        });
        return l;
    }

    public sortTriangles(): void {
        this.triangles.sort((t1, t2) => {
            let a1 = Math2D.AngleFromTo(Math2D.AxisX, t1.barycenter.subtract(this.baseVertexPosition), true);
            let a2 = Math2D.AngleFromTo(Math2D.AxisX, t2.barycenter.subtract(this.baseVertexPosition), true);
            return a1 - a2;
        })
        this.points = [];
        this.barycenter = BABYLON.Vector2.Zero();
        this.triangles.forEach(tri => {
            let pp = tri.barycenter.clone();
            this.points.push(pp);
            this.barycenter.addInPlace(pp);
        });
        this.barycenter.scaleInPlace(1 / this.points.length);
        
        Cell.addPointsToLength(this.points, 8);

        for (let i = 0; i < this.points.length; i++) {
            this.radius += BABYLON.Vector2.Distance(this.barycenter, this.points[i]);
        }
        this.radius /= this.points.length;        
    }

    public sortNeighbours(): void {
        this.neighbors.sort((n1, n2) => {
            let a1 = Math2D.AngleFromTo(Math2D.AxisX, n1.baseVertexPosition.subtract(this.baseVertexPosition), true);
            let a2 = Math2D.AngleFromTo(Math2D.AxisX, n2.baseVertexPosition.subtract(this.baseVertexPosition), true);
            return a1 - a2;
        })
    }

    public updateShape(points: BABYLON.Vector2[] = this.points, c?: BABYLON.Color4): void {
        if (!this.shape) {
            this.shape = new BABYLON.Mesh("shape");
            let material = new BABYLON.StandardMaterial("shape-material", this.network.main.scene);
            material.diffuseColor.copyFromFloats(1, 1, 1);
            material.specularColor.copyFromFloats(0, 0, 0);
            this.shape.material = material;
        }
        if (!this.isBorder() && !this.isHidden() && !this.isLocked()) {
            
            let dOut = 0.1;
            let dIn = 0.3;
            if (this.isLocked()) {
                dOut = 0.1;
                dIn = 0.15;
            }
            let lineOut = Math2D.FattenShrinkEdgeShape(points, - dOut);
            let lineIn = Math2D.FattenShrinkEdgeShape(points, - dIn);
            //line = CellNetwork.Smooth(line, 5);
            //line = CellNetwork.Smooth(line, 3);
            //line = CellNetwork.Smooth(line, 1);
            lineOut.push(lineOut[0]);
            lineIn.push(lineIn[0]);

            let line3D: BABYLON.Vector3[] = [];
            let line3DColor: BABYLON.Color4[] = [];

            if (!c) {
                if (this.isLocked()) {
                    c = Cell.LockedColor; 
                }
                else {
                    c = Cell.Colors[this.value];
                }
            }

            let center = BABYLON.Vector2.Zero();
            for (let i = 0; i < points.length; i++) {
                center.addInPlace(points[i]);
            }
            center.scaleInPlace(1 / points.length);

            let data = new BABYLON.VertexData();
            let positions: number[] = [center.x, 0, center.y];
            let indices: number[] = [];
            let colors: number[] = [c.r * 1.3, c.g * 1.3, c.b * 1.3, 1];
            for (let i = 0; i < lineIn.length; i++) {
                line3D.push(new BABYLON.Vector3(lineOut[i].x, 0, lineOut[i].y));
                line3DColor.push(new BABYLON.Color4(c.r * 1.3, c.g * 1.3, c.b * 1.3, 1));
                positions.push(lineIn[i].x, 0, lineIn[i].y);
                colors.push(c.r, c.g, c.b, 1);
                if (i != lineIn.length - 1) {
                    indices.push(0, i, i + 1);
                }
                else {
                    indices.push(0, i, 1);
                }
            }
            data.positions = positions;
            data.indices = indices;
            data.colors = colors;
            data.applyToMesh(this.shape);

            if (!this.shapeLine) {
                this.shapeLine = BABYLON.MeshBuilder.CreateLines("shape-line", { points: line3D, colors: line3DColor, updatable: true });
            }
            BABYLON.MeshBuilder.CreateLines("", { points: line3D, colors: line3DColor, instance: this.shapeLine });
        }
    }

    public static addPointsToLength(points: BABYLON.Vector2[], newLength: number): void {
        
        let center = BABYLON.Vector2.Zero();
        for (let i = 0; i < points.length; i++) {
            center.addInPlace(points[i]);
        }
        center.scaleInPlace(1 / points.length);

        while (points.length < newLength) {
            let longestIndex = 0;
            let longestDistSquared = BABYLON.Vector2.DistanceSquared(points[0], points[1]);
            for (let i = 1; i < points.length; i++) {
                let p = points[i];
                let next = points[(i + 1) % points.length];
                let distSquared = BABYLON.Vector2.Distance(p, next);
                if (distSquared > longestDistSquared) {
                    longestDistSquared = distSquared;
                    longestIndex = i;
                }
            }
            let p0 = points[longestIndex];
            let p1 = points[(longestIndex + 1) % points.length];
            let p = p0.add(p1).scaleInPlace(0.5);
            //let n = p.subtract(center).normalize().scaleInPlace(0.05);
            //p.subtractInPlace(n);
            points.splice(longestIndex + 1, 0, p);
        }
    }

    public morphTo(other: Cell, callback?: () => void): void {
        let thisPoints = this.points.map(p => { return p.clone()});
        let otherPoints = other.points.map(p => { return p.clone()});

        Cell.addPointsToLength(thisPoints, otherPoints.length);
        Cell.addPointsToLength(otherPoints, thisPoints.length);

        this.updateShape(thisPoints);
        let n = 0;
        let duration = 60;
        let morphStep = () => {
            n++;
            let tmpPoints: BABYLON.Vector2[] = [];
            let dt = VMath.easeOutQuart(n / duration);
            for (let i = 0; i < otherPoints.length; i++) {
                tmpPoints[i] = thisPoints[i].scale(1 - dt).add(otherPoints[i].scale(dt));
            }
            let center = BABYLON.Vector2.Zero();
            for (let i = 0; i < tmpPoints.length; i++) {
                center.addInPlace(tmpPoints[i]);
            }
            center.scaleInPlace(1 / tmpPoints.length);
            
            //let st = (n - duration * 0.5) * (n - duration * 0.5) / (duration * 0.5 * duration * 0.5);
            let st = VMath.easeOutQuart(n / duration);
            st = (st - 0.5) * (st - 0.5) * 4;
            st = 0.8 * (1 - st) + st;
            center.scaleInPlace(1 - st);
            for (let i = 0; i < tmpPoints.length; i++) {
                tmpPoints[i].scaleInPlace(st).addInPlace(center);
            }

            this.updateShape(tmpPoints);
            if (n < duration) {
                requestAnimationFrame(morphStep);
            }
            else {
                if (callback) {
                    callback();
                }
            }
        }
        morphStep();
    }

    public morphValueTo(newValue: number, callback?: () => void): void {
        let n = 0;
        let duration = 40;
        let morphValueStep = () => {
            n++;
            let tmpPoints = this.points.map(p => { return p.clone()});
            let center = BABYLON.Vector2.Zero();
            for (let i = 0; i < tmpPoints.length; i++) {
                center.addInPlace(tmpPoints[i]);
            }
            center.scaleInPlace(1 / tmpPoints.length);
            
            //let st = (n - duration * 0.5) * (n - duration * 0.5) / (duration * 0.5 * duration * 0.5);
            let st = VMath.easeOutQuart(n / duration);
            st = ((st - 0.5) * (st - 0.5) * 4) * 0.9 + 0.1;
            center.scaleInPlace(1 - st);
            for (let i = 0; i < tmpPoints.length; i++) {
                tmpPoints[i].scaleInPlace(st).addInPlace(center);
            }

            if (n > duration * 0.5) {
                this.value = newValue;
            }
            this.updateShape(tmpPoints);
            if (n < duration) {
                requestAnimationFrame(morphValueStep);
            }
            else {
                if (callback) {
                    callback();
                }
            }
        }
        morphValueStep();
    }
}