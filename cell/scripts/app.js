class AI {
    constructor(player, cellNetwork) {
        this.player = player;
        this.cellNetwork = cellNetwork;
    }
    countValue(cells, v) {
        let count = 0;
        for (let i = 0; i < cells.length; i++) {
            if (cells[i].value === v) {
                count++;
            }
        }
        return count;
    }
    cellRotationGain(cell, reverse = false) {
        let values = [];
        cell.neighbors.forEach((c, i) => {
            values[i] = c.value;
        });
        let m = -1;
        if (reverse) {
            m = 1;
        }
        cell.neighbors.forEach((c, i) => {
            c.value = values[(i + m + values.length) % values.length];
        });
        let takenCell = new UniqueList();
        cell.neighbors.forEach(c => {
            if (c.value != this.player && c.isSurrounded() === this.player) {
                takenCell.push(c);
            }
            c.neighbors.forEach(n => {
                if (n.value != this.player && n.isSurrounded() === this.player) {
                    takenCell.push(n);
                }
            });
        });
        cell.neighbors.forEach((c, i) => {
            c.value = values[i];
        });
        return takenCell.length;
    }
    getMove2() {
        let bestGain = -Infinity;
        let pickedCellIndex = -1;
        let pickedReverse = false;
        let opponent = (this.player + 1) % 2;
        let playerBoardValueZero = this.cellNetwork.getBoardValueForPlayer(this.player);
        let opponentBoardValueZero = this.cellNetwork.getBoardValueForPlayer(opponent);
        let cloneNetwork = this.cellNetwork.clone();
        let availableCells = cloneNetwork.cells.filter(c => { return c.canRotate(); });
        availableCells = availableCells.filter(c => { return (c.value === this.player && !(c.isSurrounded() === this.player)) || c.value === 2; });
        let availableCellIndexes = availableCells.map(c => { return c.index; });
        for (let i = 0; i < availableCellIndexes.length; i++) {
            let gain = 0;
            cloneNetwork = this.cellNetwork.clone();
            let cell = cloneNetwork.cells[availableCellIndexes[i]];
            let variance = cloneNetwork.rotate(cell);
            gain += variance[this.player];
            gain += cloneNetwork.getBoardValueForPlayer(this.player) - playerBoardValueZero;
            gain -= cloneNetwork.getBoardValueForPlayer(opponent) - opponentBoardValueZero;
            if (gain > bestGain) {
                bestGain = gain;
                pickedCellIndex = cell.index;
                pickedReverse = false;
            }
            gain = 0;
            cloneNetwork = this.cellNetwork.clone();
            cell = cloneNetwork.cells[availableCellIndexes[i]];
            variance = cloneNetwork.rotate(cell, true);
            gain += variance[this.player];
            gain += cloneNetwork.getBoardValueForPlayer(this.player) - playerBoardValueZero;
            gain -= cloneNetwork.getBoardValueForPlayer(opponent) - opponentBoardValueZero;
            if (gain > bestGain) {
                bestGain = gain;
                pickedCellIndex = cell.index;
                pickedReverse = true;
            }
        }
        let pickedCell = undefined;
        if (pickedCellIndex != -1) {
            pickedCell = this.cellNetwork.cells[pickedCellIndex];
        }
        return {
            cell: pickedCell,
            reverse: pickedReverse
        };
    }
    getMove() {
        let cloneNetwork = this.cellNetwork.clone();
        console.log(cloneNetwork);
        let bestGain = -Infinity;
        let pickedCellIndex = -1;
        let pickedReverse = false;
        let availableCells = cloneNetwork.cells.filter(c => { return c.canRotate(); });
        console.log("Available cells = " + availableCells.length);
        availableCells = availableCells.filter(c => { return c.value === this.player || c.value === 2; });
        let noUselessMove = availableCells.filter(c => { return !(c.value === this.player && c.isSurrounded() === this.player); });
        if (noUselessMove.length != 0) {
            availableCells = noUselessMove;
        }
        console.log("Available cells = " + availableCells.length);
        for (let i = 0; i < availableCells.length; i++) {
            let cell = availableCells[i];
            // Check base rotation.
            let gain = this.cellRotationGain(cell, false);
            if (gain > bestGain) {
                bestGain = gain;
                pickedCellIndex = cell.index;
                pickedReverse = false;
            }
            // Check reverse rotation.
            gain = this.cellRotationGain(cell, true);
            if (gain > bestGain) {
                bestGain = gain;
                pickedCellIndex = cell.index;
                pickedReverse = true;
            }
        }
        console.log("BestGain = " + bestGain);
        if (bestGain === 0) {
            let rand = Math.floor(Math.random() * availableCells.length);
            let randomCell = availableCells[rand];
            pickedCellIndex = randomCell.index;
        }
        console.log("PickedCellIndex = " + pickedCellIndex);
        let pickedCell = undefined;
        if (pickedCellIndex != -1) {
            pickedCell = this.cellNetwork.cells[pickedCellIndex];
        }
        return {
            cell: pickedCell,
            reverse: pickedReverse
        };
    }
}
class Cell {
    constructor(baseVertexPosition, index, network) {
        this.baseVertexPosition = baseVertexPosition;
        this.index = index;
        this.network = network;
        this.neighbors = new UniqueList();
        this.triangles = new UniqueList();
        this.value = 0;
        this.radius = 1;
        this.highlightStatus = 0;
        this.forceLock = false;
        this.isDisposed = false;
        this._barycenter3D = BABYLON.Vector3.Zero();
        this.value = Math.floor(Math.random() * 3);
    }
    clone() {
        let cloneCell = new Cell(this.baseVertexPosition.clone(), this.index, this.network);
        if (this.barycenter) {
            cloneCell.barycenter = this.barycenter.clone();
        }
        cloneCell.points = this.points.map(p => { return p.clone(); });
        cloneCell.radius = this.radius;
        cloneCell.forceLock = this.forceLock;
        cloneCell.value = this.value;
        return cloneCell;
    }
    reset() {
        this.neighbors = new UniqueList();
        this.triangles = new UniqueList();
        this.points = [];
    }
    dispose() {
        this.isDisposed = true;
        if (this.shape) {
            this.shape.dispose();
        }
        if (this.shapeLine) {
            this.shapeLine.dispose();
        }
    }
    get barycenter3D() {
        if (this.barycenter) {
            this._barycenter3D.x = this.barycenter.x;
            this._barycenter3D.y = 0;
            this._barycenter3D.z = this.barycenter.y;
        }
        return this._barycenter3D;
    }
    isBorder() {
        let c = 0;
        this.triangles.forEach(tri => {
            if (tri.isBorder()) {
                c++;
            }
        });
        return c >= 2;
    }
    isHidden() {
        let l = true;
        this.neighbors.forEach(n => {
            if (!n.isLocked() && !n.isBorder()) {
                l = false;
            }
        });
        return l;
    }
    isLocked() {
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
    isSurrounded() {
        let surroundValue;
        this.neighbors.forEach(n => {
            if (isNaN(surroundValue) || surroundValue === n.value) {
                surroundValue = n.value;
            }
            else {
                surroundValue = -1;
            }
        });
        return surroundValue;
    }
    canRotate() {
        let l = true;
        this.neighbors.forEach(n => {
            if (n.isLocked()) {
                l = false;
            }
        });
        return l;
    }
    sortTriangles() {
        this.triangles.sort((t1, t2) => {
            let a1 = Math2D.AngleFromTo(Math2D.AxisX, t1.barycenter.subtract(this.baseVertexPosition), true);
            let a2 = Math2D.AngleFromTo(Math2D.AxisX, t2.barycenter.subtract(this.baseVertexPosition), true);
            return a1 - a2;
        });
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
    sortNeighbours() {
        this.neighbors.sort((n1, n2) => {
            let a1 = Math2D.AngleFromTo(Math2D.AxisX, n1.baseVertexPosition.subtract(this.baseVertexPosition), true);
            let a2 = Math2D.AngleFromTo(Math2D.AxisX, n2.baseVertexPosition.subtract(this.baseVertexPosition), true);
            return a1 - a2;
        });
    }
    updateShape(points = this.points, c) {
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
            let lineOut = Math2D.FattenShrinkEdgeShape(points, -dOut);
            let lineIn = Math2D.FattenShrinkEdgeShape(points, -dIn);
            //line = CellNetwork.Smooth(line, 5);
            //line = CellNetwork.Smooth(line, 3);
            //line = CellNetwork.Smooth(line, 1);
            lineOut.push(lineOut[0]);
            lineIn.push(lineIn[0]);
            let line3D = [];
            let line3DColor = [];
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
            let positions = [center.x, 0, center.y];
            let indices = [];
            let colors = [c.r * 1.3, c.g * 1.3, c.b * 1.3, 1];
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
    static addPointsToLength(points, newLength) {
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
    morphTo(other, callback) {
        let thisPoints = this.points.map(p => { return p.clone(); });
        let otherPoints = other.points.map(p => { return p.clone(); });
        Cell.addPointsToLength(thisPoints, otherPoints.length);
        Cell.addPointsToLength(otherPoints, thisPoints.length);
        this.updateShape(thisPoints);
        let n = 0;
        let duration = 60;
        let morphStep = () => {
            n++;
            let tmpPoints = [];
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
        };
        morphStep();
    }
    morphValueTo(newValue, callback) {
        let n = 0;
        let duration = 40;
        let morphValueStep = () => {
            n++;
            let tmpPoints = this.points.map(p => { return p.clone(); });
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
        };
        morphValueStep();
    }
}
Cell.Colors = [
    BABYLON.Color4.FromHexString("#8AC33CFF"),
    BABYLON.Color4.FromHexString("#C33C8AFF"),
    BABYLON.Color4.FromHexString("#3C8AC3FF")
];
Cell.Color = new BABYLON.Color4(0, 0, 0, 1);
//public static PickColor: BABYLON.Color4 = BABYLON.Color4.FromHexString("#FCFCFCFF");
Cell.PickColor = BABYLON.Color4.FromHexString("#FCFCFCFF");
Cell.PickNeighborColor = BABYLON.Color4.FromHexString("#004d1eff");
Cell.LockedColor = BABYLON.Color4.FromHexString("#A0A0A0FF");
class CellNetwork {
    constructor() {
        this.cells = [];
        this.cellTriangles = [];
    }
    clone() {
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
            });
            baseCell.triangles.forEach((t, j) => {
                newCell.triangles.set(j, cloneNetwork.cellTriangles[t.index]);
            });
        }
        for (let i = 0; i < this.cellTriangles.length; i++) {
            let baseTriangle = this.cellTriangles[i];
            let newTriangle = cloneNetwork.cellTriangles[i];
            baseTriangle.vertices.forEach((c, j) => {
                newTriangle.vertices[j] = cloneNetwork.cells[c.index];
            });
            baseTriangle.neighbors.forEach((t, j) => {
                newTriangle.neighbors.set(j, cloneNetwork.cellTriangles[t.index]);
            });
        }
        return cloneNetwork;
    }
    rotate(cell, reverse) {
        let variances = [0, 0, 0];
        let values = [];
        let nCount = cell.neighbors.length;
        let inc = reverse ? -1 : 1;
        cell.neighbors.forEach((n, i) => {
            values[i] = n.value;
        });
        cell.neighbors.forEach((n, i) => {
            n.value = values[(i + inc + nCount) % nCount];
        });
        cell.neighbors.forEach((n) => {
            let surroundN = n.isSurrounded();
            if (surroundN != -1 && surroundN != n.value) {
                variances[n.value]--;
                variances[surroundN]++;
                n.value = surroundN;
            }
            n.neighbors.forEach((nn) => {
                let surroundNN = nn.isSurrounded();
                if (surroundNN != -1 && surroundN != nn.value) {
                    variances[nn.value]--;
                    variances[surroundNN]++;
                    nn.value = surroundNN;
                }
            });
        });
        return variances;
    }
    getVariance(cell, reverse) {
        let variances = [0, 0, 0];
        let values = [];
        let nCount = cell.neighbors.length;
        let inc = reverse ? -1 : 1;
        cell.neighbors.forEach((n, i) => {
            values[i] = n.value;
        });
        cell.neighbors.forEach((n, i) => {
            n.value = values[(i + inc + nCount) % nCount];
        });
        let updatedCells = new UniqueList();
        cell.neighbors.forEach((n) => {
            let surroundN = n.isSurrounded();
            if (surroundN != -1 && surroundN != n.value && !updatedCells.contains(n)) {
                variances[n.value]--;
                variances[surroundN]++;
                updatedCells.push(n);
            }
            n.neighbors.forEach((nn) => {
                let surroundNN = nn.isSurrounded();
                if (surroundNN != -1 && surroundN != nn.value && !updatedCells.contains(nn)) {
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
    getScore(p) {
        return this.cells.filter(c => { return c.value === p; }).length;
    }
    getBoardValueForPlayer(p) {
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
}
class CellNetworkDisplayed extends CellNetwork {
    constructor(main) {
        super();
        this.main = main;
        this.radius = 1;
        this.lock = 0;
    }
    get debugRedMaterial() {
        if (!this._debugRedMaterial) {
            this._debugRedMaterial = new BABYLON.StandardMaterial("debug-red-material", this.main.scene);
            this._debugRedMaterial.diffuseColor.copyFromFloats(1, 0, 0);
            this._debugRedMaterial.specularColor.copyFromFloats(0, 0, 0);
        }
        return this._debugRedMaterial;
    }
    get debugGreenMaterial() {
        if (!this._debugGreenMaterial) {
            this._debugGreenMaterial = new BABYLON.StandardMaterial("debug-green-material", this.main.scene);
            this._debugGreenMaterial.diffuseColor.copyFromFloats(0, 1, 0);
            this._debugGreenMaterial.specularColor.copyFromFloats(0, 0, 0);
        }
        return this._debugGreenMaterial;
    }
    declutterRec(vertices, boxMin, boxMax, minD) {
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
                let leftVertices = [];
                let rightVertices = [];
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
                let bottomVertices = [];
                let topVertices = [];
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
    generate(r, n) {
        if (r <= 0) {
            return;
        }
        this.radius = r;
        let points = [];
        for (let i = 0; i < n; i++) {
            let p = BABYLON.Vector2.Zero();
            p.copyFromFloats(-this.radius * 2 + 2 * this.radius * 2 * Math.random(), -this.radius * 2 + 2 * this.radius * 2 * Math.random());
            points.push(p);
        }
        for (let i = 0; i < 10; i++) {
            this.declutterRec(points, new BABYLON.Vector2(-this.radius * (2 + Math.random()), -this.radius * (2 + Math.random())), new BABYLON.Vector2(this.radius * (2 + Math.random()), this.radius * (2 + Math.random())), 1.5);
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
        let clone = this.clone();
        this.cells = clone.cells;
        this.cellTriangles = clone.cellTriangles;
        this.cells.forEach(v => {
            if (v.isLocked()) {
                v.value = -1;
            }
            v.updateShape();
        });
    }
    triangulate() {
        this.cells.forEach(v => {
            v.reset();
        });
        this.cellTriangles = [];
        let coords = [];
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
        let additionalCells = new UniqueList();
        this.cells.forEach(v => {
            if (!v.isLocked()) {
                v.neighbors.forEach(n => {
                    additionalCells.push(n);
                });
            }
        });
        additionalCells.forEach(c => {
            c.forceLock = false;
        });
    }
    worldPosToCell(w) {
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
    debugMorph() {
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
    checkSurround(callback) {
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
    morphCell(player, cell, reverse = false, callback) {
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
                let n2;
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
            };
            checkDone();
        }
        return;
    }
    static Smooth(points, s = 6) {
        let newpoints = [];
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
    debugDrawBase() {
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
        let cellLines = [];
        let cellColors = [];
        for (let i = 0; i < this.cells.length; i++) {
            let v = this.cells[i];
            if (!v.isBorder()) {
                let c = new BABYLON.Color4(0, 1, 1, 1);
                let line = [];
                let color = [];
                this.cells[i].triangles.forEach(tri => {
                    let pp = tri.barycenter3D.clone();
                    line.push(pp);
                });
                line = CellNetworkDisplayed.Smooth(line);
                line = CellNetworkDisplayed.Smooth(line);
                line = CellNetworkDisplayed.Smooth(line);
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
class CellSelector {
    constructor(network) {
        this.network = network;
        this.reverse = false;
        this._t = 0;
        this._tmp = BABYLON.Vector2.Zero();
        this._lastReverse = false;
        this.updateShape = () => {
            if (this.highlightShape) {
                this.highlightShape.isVisible = false;
            }
            if (!this.selectedCell) {
                return;
            }
            let neighbors = this.selectedCell.neighbors;
            if (!this.reverse) {
                this._t += this.network.main.engine.getDeltaTime() / 1000;
            }
            else {
                this._t -= this.network.main.engine.getDeltaTime() / 1000;
            }
            let highLightData = new BABYLON.VertexData();
            let positions = [];
            let colors = [];
            let indices = [];
            let i = 0;
            neighbors.forEach(c => {
                let points = Math2D.FattenShrinkEdgeShape(c.points, -0.1);
                points.push(points[0]);
                let l = positions.length / 3;
                positions.push(c.barycenter.x, 0, c.barycenter.y);
                this._tmp.copyFrom(c.barycenter);
                this._tmp.subtractInPlace(this.selectedCell.barycenter);
                let a = Math2D.AngleFromTo(Math2D.AxisX, this._tmp);
                let color = (Math.cos(a - Math.PI * 2 * this._t * 0.6) + 1) * 0.5;
                color = 0.3 + color * color * 1.5;
                colors.push(color, color, color, 1);
                for (let i = 0; i < points.length; i++) {
                    this._tmp.copyFrom(points[i]);
                    this._tmp.subtractInPlace(this.selectedCell.barycenter);
                    a = Math2D.AngleFromTo(Math2D.AxisX, this._tmp);
                    color = (Math.cos(a - Math.PI * 2 * this._t * 0.6) + 1) * 0.5;
                    color = 0.3 + color * color * 1.5;
                    positions.push(points[i].x, 0, points[i].y);
                    colors.push(color, color, color, 1);
                    if (i != points.length - 1) {
                        indices.push(l, l + i, l + i + 1);
                    }
                    else {
                        indices.push(l, l + i, l + 1);
                    }
                }
                i++;
            });
            highLightData.positions = positions;
            highLightData.colors = colors;
            highLightData.indices = indices;
            if (!this.highlightShape) {
                this.highlightShape = new BABYLON.Mesh("highlight-shape");
                let material = new BABYLON.StandardMaterial("highlight-shape-material", this.network.main.scene);
                material.diffuseColor.copyFromFloats(1, 1, 1);
                material.alpha = 1;
                material.specularColor.copyFromFloats(0, 0, 0);
                this.highlightShape.material = material;
            }
            highLightData.applyToMesh(this.highlightShape);
            this.highlightShape.isVisible = true;
            this.highlightShape.position.y = -0.01;
        };
        network.main.scene.onBeforeRenderObservable.add(this.updateShape);
    }
    update(cell) {
        if (this.lineMeshIn) {
            this.lineMeshIn.dispose();
        }
        if (this.lineMeshOut) {
            this.lineMeshOut.dispose();
        }
        this.selectedCell = cell;
        if (!cell) {
            return;
        }
        return;
        let neighborsCyclePoint = [];
        let neighbors = cell.neighbors;
        neighbors.forEach(c => {
            neighborsCyclePoint.push(c.barycenter);
        });
        let neighborsCyclePointIn = Math2D.FattenShrinkEdgeShape(neighborsCyclePoint, -0.1);
        neighborsCyclePointIn.push(neighborsCyclePointIn[0]);
        let neighborsCyclePointOut = Math2D.FattenShrinkEdgeShape(neighborsCyclePoint, 0.1);
        neighborsCyclePointOut.push(neighborsCyclePointOut[0]);
        let line3DIn = [];
        let line3DOut = [];
        let line3DColor = [];
        for (let i = 0; i < neighborsCyclePointIn.length; i++) {
            line3DIn.push(new BABYLON.Vector3(neighborsCyclePointIn[i].x, 0, neighborsCyclePointIn[i].y));
            line3DOut.push(new BABYLON.Vector3(neighborsCyclePointOut[i].x, 0, neighborsCyclePointOut[i].y));
            line3DColor.push(new BABYLON.Color4(1, 1, 1, 1));
        }
        this.lineMeshIn = BABYLON.MeshBuilder.CreateLines("shape-line", { points: line3DIn, colors: line3DColor, updatable: true });
        this.lineMeshOut = BABYLON.MeshBuilder.CreateLines("shape-line", { points: line3DOut, colors: line3DColor, updatable: true });
    }
}
class CellTriangle {
    constructor(index) {
        this.index = index;
        this._barycenter3D = BABYLON.Vector3.Zero();
        this.vertices = [];
        this.neighbors = new UniqueList();
    }
    get barycenter3D() {
        this._barycenter3D.x = this.barycenter.x;
        this._barycenter3D.y = 0;
        this._barycenter3D.z = this.barycenter.y;
        return this._barycenter3D;
    }
    clone() {
        let cloneTriangle = new CellTriangle(this.index);
        cloneTriangle.barycenter = this.barycenter.clone();
        return cloneTriangle;
    }
    static AddTriangle(index, v1, v2, v3) {
        let tri = new CellTriangle(index);
        tri.vertices = [v1, v2, v3];
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
        });
        v2.triangles.forEach(v2Tri => {
            if (v2Tri != tri) {
                if (v1.triangles.contains(v2Tri) || v3.triangles.contains(v2Tri)) {
                    tri.neighbors.push(v2Tri);
                    v2Tri.neighbors.push(tri);
                }
            }
        });
        v3.triangles.forEach(v3Tri => {
            if (v3Tri != tri) {
                if (v1.triangles.contains(v3Tri) || v2.triangles.contains(v3Tri)) {
                    tri.neighbors.push(v3Tri);
                    v3Tri.neighbors.push(tri);
                }
            }
        });
        return tri;
    }
    isBorder() {
        return this.neighbors.length < 3;
    }
}
/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../lib/babylon.gui.d.ts"/>
var COS30 = Math.cos(Math.PI / 6);
class Main {
    constructor(canvasElement) {
        this.canvas = document.getElementById(canvasElement);
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
    }
    async initialize() {
        await this.initializeScene();
    }
    async loadMesh(modelName) {
        return new Promise(resolve => {
            BABYLON.SceneLoader.ImportMesh("", "./assets/models/" + modelName + ".babylon", "", this.scene, (meshes) => {
                let mesh = meshes[0];
                if (mesh instanceof BABYLON.Mesh) {
                    mesh.position.copyFromFloats(0, -10, 0);
                    let mat = mesh.material;
                    if (mat instanceof BABYLON.StandardMaterial) {
                        mat.specularColor.copyFromFloats(0, 0, 0);
                    }
                    else if (mat instanceof BABYLON.MultiMaterial) {
                        mat.subMaterials.forEach(sm => {
                            if (sm instanceof BABYLON.StandardMaterial) {
                                sm.specularColor.copyFromFloats(0, 0, 0);
                            }
                        });
                    }
                    resolve(mesh);
                }
            });
        });
    }
    async loadMeshes(modelName, hide = true) {
        return new Promise(resolve => {
            BABYLON.SceneLoader.ImportMesh("", "./assets/models/" + modelName + ".babylon", "", this.scene, (meshes) => {
                if (hide) {
                    meshes.forEach(m => {
                        m.position.copyFromFloats(0, -10, 0);
                        let mat = m.material;
                        if (mat instanceof BABYLON.StandardMaterial) {
                            mat.specularColor.copyFromFloats(0, 0, 0);
                        }
                        else if (mat instanceof BABYLON.MultiMaterial) {
                            mat.subMaterials.forEach(sm => {
                                if (sm instanceof BABYLON.StandardMaterial) {
                                    sm.specularColor.copyFromFloats(0, 0, 0);
                                }
                            });
                        }
                    });
                }
                resolve(meshes);
            });
        });
    }
    resize() {
        let ratio = this.canvas.clientWidth / this.canvas.clientHeight;
        if (ratio >= 1) {
            this.camera.orthoTop = 35;
            this.camera.orthoRight = 35 * ratio;
            this.camera.orthoLeft = -35 * ratio;
            this.camera.orthoBottom = -35;
        }
        else {
            this.camera.orthoTop = 35 / ratio;
            this.camera.orthoRight = 35;
            this.camera.orthoLeft = -35;
            this.camera.orthoBottom = -35 / ratio;
        }
    }
    async initializeScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 10, 0), this.scene);
        this.camera.rotation.x = Math.PI / 2;
        this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        this.resize();
        window.onresize = () => {
            this.resize();
        };
        this.light = new BABYLON.HemisphericLight("AmbientLight", new BABYLON.Vector3(1, 3, 2), this.scene);
        BABYLON.Effect.ShadersStore["EdgeFragmentShader"] = `
			#ifdef GL_ES
			precision highp float;
			#endif
			varying vec2 vUV;
			uniform sampler2D textureSampler;
			uniform sampler2D depthSampler;
			uniform float 		width;
			uniform float 		height;
			void make_kernel_color(inout vec4 n[9], sampler2D tex, vec2 coord)
			{
				float w = 1.0 / width;
				float h = 1.0 / height;
				n[0] = texture2D(tex, coord + vec2( -w, -h));
				n[1] = texture2D(tex, coord + vec2(0.0, -h));
				n[2] = texture2D(tex, coord + vec2(  w, -h));
				n[3] = texture2D(tex, coord + vec2( -w, 0.0));
				n[4] = texture2D(tex, coord);
				n[5] = texture2D(tex, coord + vec2(  w, 0.0));
				n[6] = texture2D(tex, coord + vec2( -w, h));
				n[7] = texture2D(tex, coord + vec2(0.0, h));
				n[8] = texture2D(tex, coord + vec2(  w, h));
			}
			void make_kernel_depth(inout float n[9], sampler2D tex, vec2 coord)
			{
				float w = 1.0 / width;
				float h = 1.0 / height;
				n[0] = texture2D(tex, coord + vec2( -w, -h)).r;
				n[1] = texture2D(tex, coord + vec2(0.0, -h)).r;
				n[2] = texture2D(tex, coord + vec2(  w, -h)).r;
				n[3] = texture2D(tex, coord + vec2( -w, 0.0)).r;
				n[4] = texture2D(tex, coord).r;
				n[5] = texture2D(tex, coord + vec2(  w, 0.0)).r;
				n[6] = texture2D(tex, coord + vec2( -w, h)).r;
				n[7] = texture2D(tex, coord + vec2(0.0, h)).r;
				n[8] = texture2D(tex, coord + vec2(  w, h)).r;
			}
			void main(void) 
			{
				vec4 d = texture2D(depthSampler, vUV);
				float depth = d.r * (2000.0 - 0.2) + 0.2;
				
				float nD[9];
				make_kernel_depth( nD, depthSampler, vUV );
				float sobel_depth_edge_h = nD[2] + (2.0*nD[5]) + nD[8] - (nD[0] + (2.0*nD[3]) + nD[6]);
				float sobel_depth_edge_v = nD[0] + (2.0*nD[1]) + nD[2] - (nD[6] + (2.0*nD[7]) + nD[8]);
				float sobel_depth = sqrt((sobel_depth_edge_h * sobel_depth_edge_h) + (sobel_depth_edge_v * sobel_depth_edge_v));
				float thresholdDepth = 0.002;

				vec4 n[9];
				make_kernel_color( n, textureSampler, vUV );
				vec4 sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
				vec4 sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);
				vec4 sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));
				float threshold = 0.2;
				
				gl_FragColor = vec4(n[4]) * 0.5;
				gl_FragColor.a = 1.0;
				if (sobel_depth < thresholdDepth || depth > 1000.) {
					if (max(sobel.r, max(sobel.g, sobel.b)) < threshold) {
						gl_FragColor = n[4];
					}
				}
			}
        `;
        BABYLON.Engine.ShadersRepository = "./shaders/";
        /*
        let depthMap = this.scene.enableDepthRenderer(camera).getDepthMap();
        
        let postProcess = new BABYLON.PostProcess("Edge", "Edge", ["width", "height"], ["depthSampler"], 1, camera);
        postProcess.onApply = (effect) => {
            effect.setTexture("depthSampler", depthMap);
            effect.setFloat("width", this.engine.getRenderWidth());
            effect.setFloat("height", this.engine.getRenderHeight());
        };
        */
        this.scene.clearColor = BABYLON.Color4.FromHexString("#3a2e47FF");
        //this.scene.clearColor = BABYLON.Color4.FromHexString("#D0FA00FF");
        let cellNetwork = new CellNetworkDisplayed(this);
        cellNetwork.generate(20, 300);
        cellNetwork.checkSurround();
        //cellNetwork.debugDrawBase();
        this.selected = new CellSelector(cellNetwork);
        let ai = new AI(1, cellNetwork);
        let testAI = new AI(0, cellNetwork);
        let pickPlane = BABYLON.MeshBuilder.CreateGround("pick-plane", { width: 50, height: 50 }, this.scene);
        pickPlane.isVisible = false;
        let A = new BABYLON.Vector3(2, 0, 1);
        let B = new BABYLON.Vector3(6, 0, 3);
        let C = new BABYLON.Vector3(2, 0, 3.5);
        let D = new BABYLON.Vector3(6.25, 0, 0);
        /*
        let move = () => {
            let aiTestMove = testAI.getMove2();
            if (aiTestMove.cell) {
                cellNetwork.morphCell(
                    0,
                    aiTestMove.cell,
                    aiTestMove.reverse,
                    () => {
                        cellNetwork.checkSurround(
                            () => {
                                
                                let aiMove = ai.getMove2();
                                if (aiMove.cell) {
                                    cellNetwork.morphCell(
                                        1,
                                        aiMove.cell,
                                        aiMove.reverse,
                                        () => {
                                            cellNetwork.checkSurround(move);
                                        }
                                    );
                                }
                            }
                        );
                    }
                );
            }
        }
        setTimeout(move, 3000);
        return;
        */
        this.scene.onPointerObservable.add((eventData) => {
            let pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => { return m === pickPlane; });
            if (pick && pick.pickedPoint) {
                let cell = cellNetwork.worldPosToCell(pick.pickedPoint);
                if (cell.canRotate()) {
                    this.setPickedCell(cell);
                }
            }
            let reverse = false;
            if (this.pickedCell && pick.pickedPoint) {
                reverse = this.pickedCell.barycenter3D.x < pick.pickedPoint.x;
                console.log(pick.pickedPoint.x);
            }
            this.selected.reverse = reverse;
            if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                if (this.pickedCell) {
                    cellNetwork.morphCell(0, this.pickedCell, reverse, () => {
                        cellNetwork.checkSurround(() => {
                            let aiMove = ai.getMove2();
                            if (aiMove.cell) {
                                cellNetwork.morphCell(1, aiMove.cell, aiMove.reverse, () => {
                                    cellNetwork.checkSurround();
                                });
                            }
                        });
                    });
                }
            }
        });
    }
    setPickedCell(cell) {
        if (cell === this.pickedCell) {
            return;
        }
        if (this.pickedCell) {
            if (!this.pickedCell.isDisposed) {
                this.pickedCell.highlightStatus = 0;
                this.pickedCell.updateShape();
                this.pickedCell.shape.position.y = 0;
                this.pickedCell.neighbors.forEach(n => {
                    n.highlightStatus = 0;
                    n.updateShape();
                    n.shape.position.y = 0;
                });
            }
        }
        this.pickedCell = cell;
        if (this.pickedCell) {
            if (!this.pickedCell.isDisposed) {
                this.pickedCell.highlightStatus = 2;
                this.pickedCell.updateShape();
                this.pickedCell.shape.position.y = 0.01;
                this.pickedCell.neighbors.forEach(n => {
                    n.highlightStatus = 1;
                    n.updateShape();
                    n.shape.position.y = 0.01 + Math.random() * 0.009;
                });
            }
        }
        this.selected.update(this.pickedCell);
    }
    animate() {
        let fpsInfoElement = document.getElementById("fps-info");
        let meshesInfoTotalElement = document.getElementById("meshes-info-total");
        let meshesInfoNonStaticUniqueElement = document.getElementById("meshes-info-nonstatic-unique");
        let meshesInfoStaticUniqueElement = document.getElementById("meshes-info-static-unique");
        let meshesInfoNonStaticInstanceElement = document.getElementById("meshes-info-nonstatic-instance");
        let meshesInfoStaticInstanceElement = document.getElementById("meshes-info-static-instance");
        this.engine.runRenderLoop(() => {
            this.scene.render();
            fpsInfoElement.innerText = this.engine.getFps().toFixed(0) + " fps";
            let uniques = this.scene.meshes.filter(m => { return !(m instanceof BABYLON.InstancedMesh); });
            let uniquesNonStatic = uniques.filter(m => { return !m.isWorldMatrixFrozen; });
            let uniquesStatic = uniques.filter(m => { return m.isWorldMatrixFrozen; });
            let instances = this.scene.meshes.filter(m => { return m instanceof BABYLON.InstancedMesh; });
            let instancesNonStatic = instances.filter(m => { return !m.isWorldMatrixFrozen; });
            let instancesStatic = instances.filter(m => { return m.isWorldMatrixFrozen; });
            meshesInfoTotalElement.innerText = this.scene.meshes.length.toFixed(0).padStart(4, "0");
            meshesInfoNonStaticUniqueElement.innerText = uniquesNonStatic.length.toFixed(0).padStart(4, "0");
            meshesInfoStaticUniqueElement.innerText = uniquesStatic.length.toFixed(0).padStart(4, "0");
            meshesInfoNonStaticInstanceElement.innerText = instancesNonStatic.length.toFixed(0).padStart(4, "0");
            meshesInfoStaticInstanceElement.innerText = instancesStatic.length.toFixed(0).padStart(4, "0");
        });
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }
}
window.addEventListener("load", async () => {
    let main = new Main("render-canvas");
    await main.initialize();
    main.animate();
});
class Math2D {
    static AreEqualsCircular(a1, a2, epsilon = Math.PI / 60) {
        while (a1 < 0) {
            a1 += 2 * Math.PI;
        }
        while (a1 >= 2 * Math.PI) {
            a1 -= 2 * Math.PI;
        }
        while (a2 < 0) {
            a2 += 2 * Math.PI;
        }
        while (a2 >= 2 * Math.PI) {
            a2 -= 2 * Math.PI;
        }
        return Math.abs(a1 - a2) < epsilon;
    }
    static StepFromToCirular(from, to, step = Math.PI / 60) {
        while (from < 0) {
            from += 2 * Math.PI;
        }
        while (from >= 2 * Math.PI) {
            from -= 2 * Math.PI;
        }
        while (to < 0) {
            to += 2 * Math.PI;
        }
        while (to >= 2 * Math.PI) {
            to -= 2 * Math.PI;
        }
        if (Math.abs(to - from) <= step) {
            return to;
        }
        if (Math.abs(to - from) >= 2 * Math.PI - step) {
            return to;
        }
        if (to - from >= 0) {
            if (Math.abs(to - from) <= Math.PI) {
                return from + step;
            }
            return from - step;
        }
        if (to - from < 0) {
            if (Math.abs(to - from) <= Math.PI) {
                return from - step;
            }
            return from + step;
        }
    }
    static LerpFromToCircular(from, to, amount = 0.5) {
        while (to < from) {
            to += 2 * Math.PI;
        }
        while (to - 2 * Math.PI > from) {
            to -= 2 * Math.PI;
        }
        return from + (to - from) * amount;
    }
    static BissectFromTo(from, to, amount = 0.5) {
        let aFrom = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), from, true);
        let aTo = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), to, true);
        let angle = Math2D.LerpFromToCircular(aFrom, aTo, amount);
        return new BABYLON.Vector2(Math.cos(angle), Math.sin(angle));
    }
    static Dot(vector1, vector2) {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }
    static Cross(vector1, vector2) {
        return vector1.x * vector2.y - vector1.y * vector2.x;
    }
    static DistanceSquared(from, to) {
        return (from.x - to.x) * (from.x - to.x) + (from.y - to.y) * (from.y - to.y);
    }
    static Distance(from, to) {
        return Math.sqrt(Math2D.DistanceSquared(from, to));
    }
    static AngleFromTo(from, to, keepPositive = false) {
        let dot = Math2D.Dot(from, to) / from.length() / to.length();
        let angle = Math.acos(dot);
        let cross = from.x * to.y - from.y * to.x;
        if (cross === 0) {
            cross = 1;
        }
        angle *= Math.sign(cross);
        if (keepPositive && angle < 0) {
            angle += Math.PI * 2;
        }
        return angle;
    }
    static Rotate(vector, alpha) {
        let v = vector.clone();
        Math2D.RotateInPlace(v, alpha);
        return v;
    }
    static RotateInPlace(vector, alpha) {
        let x = Math.cos(alpha) * vector.x - Math.sin(alpha) * vector.y;
        let y = Math.cos(alpha) * vector.y + Math.sin(alpha) * vector.x;
        vector.x = x;
        vector.y = y;
    }
    static get _Tmp0() {
        if (!Math2D.__Tmp0) {
            Math2D.__Tmp0 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp0;
    }
    static get _Tmp1() {
        if (!Math2D.__Tmp1) {
            Math2D.__Tmp1 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp1;
    }
    static get _Tmp2() {
        if (!Math2D.__Tmp2) {
            Math2D.__Tmp2 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp2;
    }
    static get _Tmp3() {
        if (!Math2D.__Tmp3) {
            Math2D.__Tmp3 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp3;
    }
    static PointSegmentABDistanceSquared(point, segA, segB) {
        Math2D._Tmp0.copyFrom(segB).subtractInPlace(segA).normalize();
        Math2D._Tmp1.copyFrom(point).subtractInPlace(segA);
        let projectionDistance = Math2D.Dot(Math2D._Tmp1, Math2D._Tmp0);
        if (projectionDistance < 0) {
            return Math2D.DistanceSquared(point, segA);
        }
        if (projectionDistance * projectionDistance > Math2D.DistanceSquared(segB, segA)) {
            return Math2D.DistanceSquared(point, segB);
        }
        Math2D._Tmp0.scaleInPlace(projectionDistance);
        return Math2D.Dot(Math2D._Tmp1, Math2D._Tmp1) - Math2D.Dot(Math2D._Tmp0, Math2D._Tmp0);
    }
    static PointSegmentAxAyBxByDistanceSquared(point, segAx, segAy, segBx, segBy) {
        Math2D._Tmp2.x = segAx;
        Math2D._Tmp2.y = segAy;
        Math2D._Tmp3.x = segBx;
        Math2D._Tmp3.y = segBy;
        return Math2D.PointSegmentABDistanceSquared(point, Math2D._Tmp2, Math2D._Tmp3);
    }
    static PointSegmentABUDistanceSquared(point, segA, segB, u) {
        Math2D._Tmp1.copyFrom(point).subtractInPlace(segA);
        let projectionDistance = Math2D.Dot(Math2D._Tmp1, u);
        if (projectionDistance < 0) {
            return Math2D.DistanceSquared(point, segA);
        }
        if (projectionDistance * projectionDistance > Math2D.DistanceSquared(segB, segA)) {
            return Math2D.DistanceSquared(point, segB);
        }
        Math2D._Tmp0.copyFrom(u).scaleInPlace(projectionDistance);
        return Math2D.Dot(Math2D._Tmp1, Math2D._Tmp1) - Math2D.Dot(Math2D._Tmp0, Math2D._Tmp0);
    }
    static IsPointInSegment(point, segA, segB) {
        if ((point.x - segA.x) * (segB.x - segA.x) + (point.y - segA.y) * (segB.y - segA.y) < 0) {
            return false;
        }
        if ((point.x - segB.x) * (segA.x - segB.x) + (point.y - segB.y) * (segA.y - segB.y) < 0) {
            return false;
        }
        return true;
    }
    static IsPointInRay(point, rayOrigin, rayDirection) {
        if ((point.x - rayOrigin.x) * rayDirection.x + (point.y - rayOrigin.y) * rayDirection.y < 0) {
            return false;
        }
        return true;
    }
    static IsPointInRegion(point, region) {
        let count = 0;
        let randomDir = Math.random() * Math.PI * 2;
        Math2D._Tmp0.x = Math.cos(randomDir);
        Math2D._Tmp0.y = Math.sin(randomDir);
        for (let i = 0; i < region.length; i++) {
            Math2D._Tmp1.x = region[i][0];
            Math2D._Tmp1.y = region[i][1];
            Math2D._Tmp2.x = region[(i + 1) % region.length][0];
            Math2D._Tmp2.y = region[(i + 1) % region.length][1];
            if (Math2D.RaySegmentIntersection(point, Math2D._Tmp0, Math2D._Tmp1, Math2D._Tmp2)) {
                count++;
            }
        }
        return count % 2 === 1;
    }
    static IsPointInPath(point, path) {
        let count = 0;
        let randomDir = Math.random() * Math.PI * 2;
        Math2D._Tmp0.x = Math.cos(randomDir);
        Math2D._Tmp0.y = Math.sin(randomDir);
        for (let i = 0; i < path.length; i++) {
            if (Math2D.RaySegmentIntersection(point, Math2D._Tmp0, path[i], path[(i + 1) % path.length])) {
                count++;
            }
        }
        return count % 2 === 1;
    }
    static SegmentShapeIntersection(segA, segB, shape) {
        let intersections = [];
        for (let i = 0; i < shape.length; i++) {
            let shapeA = shape[i];
            let shapeB = shape[(i + 1) % shape.length];
            let intersection = Math2D.SegmentSegmentIntersection(segA, segB, shapeA, shapeB);
            if (intersection) {
                intersections.push(intersection);
            }
        }
        return intersections;
    }
    static FattenShrinkPointShape(shape, distance) {
        let newShape = [];
        let edgesDirs = [];
        for (let i = 0; i < shape.length; i++) {
            let p = shape[i];
            let pNext = shape[(i + 1) % shape.length];
            edgesDirs[i] = pNext.subtract(p).normalize();
        }
        for (let i = 0; i < shape.length; i++) {
            let p = shape[i];
            let edgeDir = edgesDirs[i];
            let edgeDirPrev = edgesDirs[(i - 1 + shape.length) % shape.length];
            let bissection = Math2D.BissectFromTo(edgeDirPrev.scale(-1), edgeDir, 0.5);
            newShape[i] = p.add(bissection.scaleInPlace(distance));
        }
        return newShape;
    }
    static FattenShrinkEdgeShape(shape, distance) {
        let newShape = [];
        let edgesNormals = [];
        let edgesDirs = [];
        for (let i = 0; i < shape.length; i++) {
            let p = shape[i];
            let pNext = shape[(i + 1) % shape.length];
            edgesDirs[i] = pNext.subtract(p).normalize();
            edgesNormals[i] = Math2D.Rotate(edgesDirs[i], -Math.PI / 2).scaleInPlace(distance);
        }
        for (let i = 0; i < shape.length; i++) {
            let p = shape[i];
            let pNext = shape[(i + 1) % shape.length];
            let edgeDir = edgesDirs[i];
            let edgeDirNext = edgesDirs[(i + 1) % shape.length];
            p = p.add(edgesNormals[i]);
            pNext = pNext.add(edgesNormals[(i + 1) % shape.length]);
            if (Math.abs(Math2D.Cross(edgeDir, edgeDirNext)) < 0.01) {
                newShape[i] = pNext;
            }
            else {
                let newP = Math2D.LineLineIntersection(p, edgeDir, pNext, edgeDirNext);
                if (newP) {
                    newShape[i] = newP;
                }
                else {
                    newShape[i] = p;
                    console.warn("Oups 2");
                }
            }
        }
        return newShape;
    }
    static CatmullRomPath(path) {
        let interpolatedPoints = [];
        for (let i = 0; i < path.length; i++) {
            let p0 = path[(i - 1 + path.length) % path.length];
            let p1 = path[i];
            let p2 = path[(i + 1) % path.length];
            let p3 = path[(i + 2) % path.length];
            interpolatedPoints.push(BABYLON.Vector2.CatmullRom(p0, p1, p2, p3, 0.5));
        }
        for (let i = 0; i < interpolatedPoints.length; i++) {
            path.splice(2 * i + 1, 0, interpolatedPoints[i]);
        }
    }
    /*
    public static IsPointInShape(point: BABYLON.Vector2, shape: IShape): boolean {
        for (let i = 0; i < shape.regions.length; i++) {
            let region = shape.regions[i];
            if (Math2D.IsPointInRegion(point, region)) {
                return true;
            }
        }
        return false;
    }
    */
    static RayRayIntersection(ray1Origin, ray1Direction, ray2Origin, ray2Direction) {
        let x1 = ray1Origin.x;
        let y1 = ray1Origin.y;
        let x2 = x1 + ray1Direction.x;
        let y2 = y1 + ray1Direction.y;
        let x3 = ray2Origin.x;
        let y3 = ray2Origin.y;
        let x4 = x3 + ray2Direction.x;
        let y4 = y3 + ray2Direction.y;
        let det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (det !== 0) {
            let x = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
            let y = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
            let intersection = new BABYLON.Vector2(x / det, y / det);
            if (Math2D.IsPointInRay(intersection, ray1Origin, ray1Direction)) {
                if (Math2D.IsPointInRay(intersection, ray2Origin, ray2Direction)) {
                    return intersection;
                }
            }
        }
        return undefined;
    }
    static LineLineIntersection(line1Origin, line1Direction, line2Origin, line2Direction) {
        let x1 = line1Origin.x;
        let y1 = line1Origin.y;
        let x2 = x1 + line1Direction.x;
        let y2 = y1 + line1Direction.y;
        let x3 = line2Origin.x;
        let y3 = line2Origin.y;
        let x4 = x3 + line2Direction.x;
        let y4 = y3 + line2Direction.y;
        let det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (det !== 0) {
            let x = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
            let y = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
            return new BABYLON.Vector2(x / det, y / det);
        }
        return undefined;
    }
    static RaySegmentIntersection(rayOrigin, rayDirection, segA, segB) {
        let x1 = rayOrigin.x;
        let y1 = rayOrigin.y;
        let x2 = x1 + rayDirection.x;
        let y2 = y1 + rayDirection.y;
        let x3 = segA.x;
        let y3 = segA.y;
        let x4 = segB.x;
        let y4 = segB.y;
        let det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (det !== 0) {
            let x = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
            let y = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
            let intersection = new BABYLON.Vector2(x / det, y / det);
            if (Math2D.IsPointInRay(intersection, rayOrigin, rayDirection)) {
                if (Math2D.IsPointInSegment(intersection, segA, segB)) {
                    return intersection;
                }
            }
        }
        return undefined;
    }
    static SegmentSegmentIntersection(seg1A, seg1B, seg2A, seg2B) {
        let x1 = seg1A.x;
        let y1 = seg1A.y;
        let x2 = seg1B.x;
        let y2 = seg1B.y;
        let x3 = seg2A.x;
        let y3 = seg2A.y;
        let x4 = seg2B.x;
        let y4 = seg2B.y;
        let det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (det !== 0) {
            let x = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
            let y = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
            let intersection = new BABYLON.Vector2(x / det, y / det);
            if (Math2D.IsPointInSegment(intersection, seg1A, seg1B)) {
                if (Math2D.IsPointInSegment(intersection, seg2A, seg2B)) {
                    return intersection;
                }
            }
        }
        return undefined;
    }
    static PointRegionDistanceSquared(point, region) {
        let minimalSquaredDistance = Infinity;
        for (let i = 0; i < region.length; i++) {
            Math2D._Tmp1.x = region[i][0];
            Math2D._Tmp1.y = region[i][1];
            Math2D._Tmp2.x = region[(i + 1) % region.length][0];
            Math2D._Tmp2.y = region[(i + 1) % region.length][1];
            let distSquared = Math2D.PointSegmentAxAyBxByDistanceSquared(point, region[i][0], region[i][1], region[(i + 1) % region.length][0], region[(i + 1) % region.length][1]);
            minimalSquaredDistance = Math.min(minimalSquaredDistance, distSquared);
        }
        return minimalSquaredDistance;
    }
}
Math2D.AxisX = new BABYLON.Vector2(1, 0);
Math2D.AxisY = new BABYLON.Vector2(0, 1);
class UniqueList {
    constructor() {
        this._elements = [];
    }
    get length() {
        return this._elements.length;
    }
    get(i) {
        return this._elements[i];
    }
    set(i, e) {
        this._elements[i] = e;
    }
    getLast() {
        return this.get(this.length - 1);
    }
    push(e) {
        if (this._elements.indexOf(e) === -1) {
            this._elements.push(e);
        }
    }
    pop() {
        return this._elements.pop();
    }
    remove(e) {
        let i = this._elements.indexOf(e);
        if (i != -1) {
            this._elements.splice(i, 1);
        }
    }
    contains(e) {
        return this._elements.indexOf(e) != -1;
    }
    sort(sortFunction) {
        this._elements = this._elements.sort(sortFunction);
    }
    forEach(callbackfn) {
        this._elements.forEach(callbackfn);
    }
}
class VMath {
    // Method adapted from gre's work (https://github.com/gre/bezier-easing). Thanks !
    static easeOutElastic(t, b = 0, c = 1, d = 1) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) {
            return b;
        }
        if ((t /= d) == 1) {
            return b + c;
        }
        if (!p) {
            p = d * .3;
        }
        if (a < Math.abs(c)) {
            a = c;
            s = p / 4;
        }
        else {
            s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
    }
    static easeInOutCirc(x) {
        return x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
    }
    static easeOutBack(x) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }
    static easeOutQuart(x) {
        return 1 - Math.pow(1 - x, 4);
    }
    static ProjectPerpendicularAt(v, at) {
        let p = BABYLON.Vector3.Zero();
        let k = (v.x * at.x + v.y * at.y + v.z * at.z);
        k = k / (at.x * at.x + at.y * at.y + at.z * at.z);
        p.copyFrom(v);
        p.subtractInPlace(at.multiplyByFloats(k, k, k));
        return p;
    }
    static Angle(from, to) {
        let pFrom = BABYLON.Vector3.Normalize(from);
        let pTo = BABYLON.Vector3.Normalize(to);
        let angle = Math.acos(BABYLON.Vector3.Dot(pFrom, pTo));
        return angle;
    }
    static AngleFromToAround(from, to, around) {
        let pFrom = VMath.ProjectPerpendicularAt(from, around).normalize();
        let pTo = VMath.ProjectPerpendicularAt(to, around).normalize();
        let angle = Math.acos(BABYLON.Vector3.Dot(pFrom, pTo));
        if (BABYLON.Vector3.Dot(BABYLON.Vector3.Cross(pFrom, pTo), around) < 0) {
            angle = -angle;
        }
        return angle;
    }
    static StepAngle(from, to, step) {
        while (from < 0) {
            from += 2 * Math.PI;
        }
        while (to < 0) {
            to += 2 * Math.PI;
        }
        while (from >= 2 * Math.PI) {
            from -= 2 * Math.PI;
        }
        while (to >= 2 * Math.PI) {
            to -= 2 * Math.PI;
        }
        if (Math.abs(from - to) <= step) {
            return to;
        }
        if (to < from) {
            step *= -1;
        }
        if (Math.abs(from - to) > Math.PI) {
            step *= -1;
        }
        return from + step;
    }
    static LerpAngle(from, to, t) {
        while (from < 0) {
            from += 2 * Math.PI;
        }
        while (to < 0) {
            to += 2 * Math.PI;
        }
        while (from >= 2 * Math.PI) {
            from -= 2 * Math.PI;
        }
        while (to >= 2 * Math.PI) {
            to -= 2 * Math.PI;
        }
        if (Math.abs(from - to) > Math.PI) {
            if (from > Math.PI) {
                from -= 2 * Math.PI;
            }
            else {
                to -= 2 * Math.PI;
            }
        }
        return from * (1 - t) + to * t;
    }
    static AngularDistance(from, to) {
        while (from < 0) {
            from += 2 * Math.PI;
        }
        while (to < 0) {
            to += 2 * Math.PI;
        }
        while (from >= 2 * Math.PI) {
            from -= 2 * Math.PI;
        }
        while (to >= 2 * Math.PI) {
            to -= 2 * Math.PI;
        }
        let d = Math.abs(from - to);
        if (d > Math.PI) {
            d *= -1;
        }
        if (to < from) {
            d *= -1;
        }
        return d;
    }
    static CatmullRomPath(path) {
        let interpolatedPoints = [];
        for (let i = 0; i < path.length; i++) {
            let p0 = path[(i - 1 + path.length) % path.length];
            let p1 = path[i];
            let p2 = path[(i + 1) % path.length];
            let p3 = path[(i + 2) % path.length];
            interpolatedPoints.push(BABYLON.Vector3.CatmullRom(p0, p1, p2, p3, 0.5));
        }
        for (let i = 0; i < interpolatedPoints.length; i++) {
            path.splice(2 * i + 1, 0, interpolatedPoints[i]);
        }
    }
    static SetABDistance(a, b, dist) {
        let n = b.subtract(a);
        n.normalize().scaleInPlace(dist);
        return a.add(n);
    }
    static SetABDistanceInPlace(a, b, dist, keepAInPlace) {
        let n = b.subtract(a);
        let l = n.length();
        n.normalize();
        if (keepAInPlace) {
            b.copyFrom(n).scaleInPlace(dist).addInPlace(a);
        }
        else {
            let d = (l - dist) * 0.5;
            n.scaleInPlace(d);
            a.addInPlace(n);
            b.subtractInPlace(n);
        }
    }
}
class ButtonFactory {
    static MakeButton(left, top, text, callback) {
        let button = document.createElement("button");
        button.style.position = "fixed";
        button.style.top = (top * 100).toFixed(1) + "%";
        button.style.left = (left * 100).toFixed(1) + "%";
        button.textContent = text;
        button.addEventListener("pointerup", callback);
        document.body.appendChild(button);
        return button;
    }
}
