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
    getMove2(player, depth = 0) {
        let bestGain = -Infinity;
        let opponent = player === 0 ? 2 : 0;
        let cloneNetwork = this.cellNetwork.clone();
        let scoreZero = this.cellNetwork.getScore(player);
        let availableCells = cloneNetwork.cells.filter(c => { return c.canRotate(); });
        availableCells = availableCells.filter(c => { return (c.value === player && !(c.isSurrounded() === player)); });
        let availableCellIndexes = availableCells.map(c => { return c.index; });
        let potentialMoves = [];
        for (let i = 0; i < availableCellIndexes.length; i++) {
            let gain = 0;
            this.cellNetwork.copyValues(cloneNetwork);
            let cell = cloneNetwork.cells[availableCellIndexes[i]];
            cloneNetwork.rotate(cell);
            if (depth === 0) {
                gain = cloneNetwork.getScore(player) - scoreZero;
            }
            if (depth === 1) {
                let opponentMove = this.getMove2(opponent, 0);
                if (opponentMove.cell) {
                    cloneNetwork.rotate(cloneNetwork.cells[opponentMove.cell.index], opponentMove.reverse);
                    gain = cloneNetwork.getScore(player) - scoreZero;
                }
            }
            if (depth === 2) {
                let opponentMove = this.getMove2(opponent, 1);
                if (opponentMove.cell) {
                    cloneNetwork.rotate(cloneNetwork.cells[opponentMove.cell.index], opponentMove.reverse);
                }
                let myNextMove = this.getMove2(player, 0);
                if (myNextMove.cell) {
                    cloneNetwork.rotate(cloneNetwork.cells[myNextMove.cell.index], myNextMove.reverse);
                    gain = cloneNetwork.getScore(player) - scoreZero;
                }
            }
            if (gain > bestGain) {
                bestGain = gain;
                let pickedCell = this.cellNetwork.cells[cell.index];
                if (pickedCell) {
                    potentialMoves = [
                        {
                            cell: pickedCell,
                            reverse: false
                        }
                    ];
                }
            }
            else if (gain === bestGain) {
                let pickedCell = this.cellNetwork.cells[cell.index];
                if (pickedCell && !potentialMoves.find(m => { return m.cell.index === cell.index; })) {
                    potentialMoves.push({
                        cell: pickedCell,
                        reverse: false
                    });
                }
            }
            gain = 0;
            this.cellNetwork.copyValues(cloneNetwork);
            cell = cloneNetwork.cells[availableCellIndexes[i]];
            cloneNetwork.rotate(cell, true);
            if (depth === 0) {
                gain = cloneNetwork.getScore(player) - scoreZero;
            }
            if (depth === 1) {
                let opponentMove = this.getMove2(opponent, 0);
                if (opponentMove.cell) {
                    cloneNetwork.rotate(cloneNetwork.cells[opponentMove.cell.index], opponentMove.reverse);
                    gain = cloneNetwork.getScore(player) - scoreZero;
                }
            }
            if (depth === 2) {
                let opponentMove = this.getMove2(opponent, 1);
                if (opponentMove.cell) {
                    cloneNetwork.rotate(cloneNetwork.cells[opponentMove.cell.index], opponentMove.reverse);
                }
                let myNextMove = this.getMove2(player, 0);
                if (myNextMove.cell) {
                    cloneNetwork.rotate(cloneNetwork.cells[myNextMove.cell.index], myNextMove.reverse);
                    gain = cloneNetwork.getScore(player) - scoreZero;
                }
            }
            if (gain > bestGain) {
                bestGain = gain;
                let pickedCell = this.cellNetwork.cells[cell.index];
                if (pickedCell) {
                    potentialMoves = [
                        {
                            cell: pickedCell,
                            reverse: true
                        }
                    ];
                }
            }
            else if (gain === bestGain) {
                let pickedCell = this.cellNetwork.cells[cell.index];
                if (pickedCell && !potentialMoves.find(m => { return m.cell.index === cell.index; })) {
                    potentialMoves.push({
                        cell: pickedCell,
                        reverse: true
                    });
                }
            }
        }
        if (potentialMoves.length > 0) {
            let m = potentialMoves[Math.floor(Math.random() * potentialMoves.length)];
            return m;
        }
        return {
            cell: undefined,
            reverse: false
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
        this.value = 2;
        this.radius = 1;
        this.highlightStatus = 0;
        this.forceLock = false;
        this.isDisposed = false;
        this._barycenter3D = BABYLON.Vector3.Zero();
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
            /*
            let material = new BABYLON.StandardMaterial("shape-material", this.network.main.scene);
            material.diffuseColor.copyFromFloats(1, 1, 1);
            material.specularColor.copyFromFloats(0, 0, 0);
            this.shape.material = material;
            */
            let material = new ToonMaterial("shape-material", false, this.network.main.scene);
            this.shape.material = material;
        }
        if (!this.isBorder() && !this.isHidden() && !this.isLocked()) {
            let dOut = 0.1;
            let dIn = 0.8;
            let lineOut = Math2D.FattenShrinkEdgeShape(points, -dOut);
            let lineIn = Math2D.FattenShrinkEdgeShape(points, -dIn);
            lineOut = CellNetworkDisplayed.Smooth(lineOut, 7);
            lineOut = CellNetworkDisplayed.Smooth(lineOut, 5);
            lineOut = CellNetworkDisplayed.Smooth(lineOut, 3);
            lineIn = CellNetworkDisplayed.Smooth(lineIn, 7);
            lineIn = CellNetworkDisplayed.Smooth(lineIn, 5);
            lineIn = CellNetworkDisplayed.Smooth(lineIn, 3);
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
            let normals = [0, 1, 0];
            let indices = [];
            let colors = [c.r, c.g, c.b, 1];
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
                let n = (lineOut[i].x - center.x) * (lineOut[i].x - center.x) + (lineOut[i].y - center.y) * (lineOut[i].y - center.y);
                n = Math.sqrt(n);
                normals.push((lineOut[i].x - center.x) / n, 0, (lineOut[i].y - center.y) / n);
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
        let t = 0;
        let duration = 100;
        let morphStep = () => {
            t += this.network.main.engine.getDeltaTime();
            t = Math.min(t, duration);
            let tmpPoints = [];
            let dt = VMath.easeOutQuart(t / duration);
            for (let i = 0; i < otherPoints.length; i++) {
                tmpPoints[i] = thisPoints[i].scale(1 - dt).add(otherPoints[i].scale(dt));
            }
            let center = BABYLON.Vector2.Zero();
            for (let i = 0; i < tmpPoints.length; i++) {
                center.addInPlace(tmpPoints[i]);
            }
            center.scaleInPlace(1 / tmpPoints.length);
            //let st = (n - duration * 0.5) * (n - duration * 0.5) / (duration * 0.5 * duration * 0.5);
            let st = VMath.easeOutQuart(t / duration);
            st = (st - 0.5) * (st - 0.5) * 4;
            st = 0.8 * (1 - st) + st;
            center.scaleInPlace(1 - st);
            for (let i = 0; i < tmpPoints.length; i++) {
                tmpPoints[i].scaleInPlace(st).addInPlace(center);
            }
            this.updateShape(tmpPoints);
            if (t < duration) {
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
        let t = 0;
        let duration = 100;
        let morphValueStep = () => {
            t += this.network.main.engine.getDeltaTime();
            t = Math.min(t, duration);
            let tmpPoints = this.points.map(p => { return p.clone(); });
            let center = BABYLON.Vector2.Zero();
            for (let i = 0; i < tmpPoints.length; i++) {
                center.addInPlace(tmpPoints[i]);
            }
            center.scaleInPlace(1 / tmpPoints.length);
            //let st = (n - duration * 0.5) * (n - duration * 0.5) / (duration * 0.5 * duration * 0.5);
            let st = VMath.easeOutQuart(t / duration);
            st = ((st - 0.5) * (st - 0.5) * 4) * 0.9 + 0.1;
            center.scaleInPlace(1 - st);
            for (let i = 0; i < tmpPoints.length; i++) {
                tmpPoints[i].scaleInPlace(st).addInPlace(center);
            }
            if (t > duration * 0.5) {
                this.value = newValue;
            }
            this.updateShape(tmpPoints);
            if (t < duration) {
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
    morphFromZero(callback) {
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
            st = 0.1 + 0.9 * st;
            center.scaleInPlace(1 - st);
            for (let i = 0; i < tmpPoints.length; i++) {
                tmpPoints[i].scaleInPlace(st).addInPlace(center);
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
    morphToZero(callback) {
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
            let st = 1 - VMath.easeOutQuart(n / duration);
            st = 0.1 + 0.9 * st;
            center.scaleInPlace(1 - st);
            for (let i = 0; i < tmpPoints.length; i++) {
                tmpPoints[i].scaleInPlace(st).addInPlace(center);
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
Cell.Colors = [
    new BABYLON.Color4(Math.random(), Math.random(), Math.random(), 1),
    new BABYLON.Color4(Math.random(), Math.random(), Math.random(), 1),
    new BABYLON.Color4(Math.random(), Math.random(), Math.random(), 1)
];
/*
Cell.Colors = [
    BABYLON.Color4.FromHexString("#73d2deff"),
    BABYLON.Color4.FromHexString("#fbb13cff"),
    BABYLON.Color4.FromHexString("#d81159ff")
]

Cell.Colors = [
    BABYLON.Color4.FromHexString("#e53d00ff"),
    BABYLON.Color4.FromHexString("#FFE900ff"),
    BABYLON.Color4.FromHexString("#21A0A0ff")
]
*/
Cell.Colors = [
    BABYLON.Color4.FromHexString("#B9FF00FF"),
    BABYLON.Color4.FromHexString("#FF00B9FF"),
    BABYLON.Color4.FromHexString("#00B9FFFF")
];
/*
Cell.Colors = [
    BABYLON.Color4.FromHexString("#00FF00FF"),
    BABYLON.Color4.FromHexString("#FF0000FF"),
    BABYLON.Color4.FromHexString("#0000FFFF")
]
*/
Cell.Colors = [
    BABYLON.Color4.FromHexString("#0ABB07FF"),
    BABYLON.Color4.FromHexString("#FFC800FF"),
    BABYLON.Color4.FromHexString("#FF1900FF")
];
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
    copyValues(target) {
        for (let i = 0; i < this.cells.length; i++) {
            target.cells[i].value = this.cells[i].value;
        }
    }
    rotate(cell, reverse) {
        let variances = [0, 0, 0];
        let values = [];
        let nCount = cell.neighbors.length;
        let inc = reverse ? 1 : -1;
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
            if (surroundN != -1 && surroundN != 1 && surroundN != n.value && !updatedCells.contains(n)) {
                variances[n.value]--;
                variances[surroundN]++;
                updatedCells.push(n);
            }
            n.neighbors.forEach((nn) => {
                let surroundNN = nn.isSurrounded();
                if (surroundNN != -1 && surroundNN != 1 && surroundN != nn.value && !updatedCells.contains(nn)) {
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
        return this.cells.filter(c => { return c.value === p; }).length - this.cells.filter(c => { return c.value === (p + 1) % 2; }).length;
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
        this.cells.forEach(v => {
            if (v.isLocked()) {
                v.value = -1;
            }
            v.morphFromZero();
        });
    }
    dispose() {
        this.cells.forEach(c => {
            c.dispose();
        });
        this.cells = [];
        this.cellTriangles = [];
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
    }
}
class CellSelector {
    constructor(network) {
        this.network = network;
        this.reverse = false;
        this._t = 0;
        this._dOut = 0;
        this._tmp = BABYLON.Vector2.Zero();
        this._lastReverse = false;
        this.updateShape = () => {
            if (this.highlightShape) {
                this.highlightShape.isVisible = false;
            }
            if (!this.selectedCell || this.network.lock) {
                this._dOut = -0.1;
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
            this._dOut = Math.min(this._dOut + 0.01, 0.05);
            let dIn = -0.1;
            [...neighbors.array(), this.selectedCell].forEach(c => {
                let lineOut = Math2D.FattenShrinkEdgeShape(c.points, this._dOut);
                let lineIn = Math2D.FattenShrinkEdgeShape(c.points, dIn);
                lineOut = CellNetworkDisplayed.Smooth(lineOut, 7);
                lineOut = CellNetworkDisplayed.Smooth(lineOut, 5);
                lineOut = CellNetworkDisplayed.Smooth(lineOut, 3);
                lineIn = CellNetworkDisplayed.Smooth(lineIn, 7);
                lineIn = CellNetworkDisplayed.Smooth(lineIn, 5);
                lineIn = CellNetworkDisplayed.Smooth(lineIn, 3);
                let l = lineIn.length;
                let offset = positions.length / 3;
                for (let i = 0; i < lineIn.length; i++) {
                    this._tmp.copyFrom(lineIn[i]);
                    this._tmp.subtractInPlace(this.selectedCell.barycenter);
                    let a = Math2D.AngleFromTo(Math2D.AxisX, this._tmp);
                    let color = (Math.cos(a - Math.PI * 2 * this._t * 0.4) + 1) * 0.5;
                    color = color * color;
                    if (color > 0.1) {
                        color = 0.75;
                    }
                    else {
                        color = 0;
                    }
                    if (c === this.selectedCell) {
                        color = 0;
                    }
                    positions.push(lineIn[i].x, 0, lineIn[i].y);
                    colors.push(color, color, color, 1);
                }
                for (let i = 0; i < lineOut.length; i++) {
                    this._tmp.copyFrom(lineOut[i]);
                    this._tmp.subtractInPlace(this.selectedCell.barycenter);
                    let a = Math2D.AngleFromTo(Math2D.AxisX, this._tmp);
                    let color = (Math.cos(a - Math.PI * 2 * this._t * 0.4) + 1) * 0.5;
                    color = color * color;
                    if (color > 0.1) {
                        color = 0.75;
                    }
                    else {
                        color = 0;
                    }
                    if (c === this.selectedCell) {
                        color = 0;
                    }
                    positions.push(lineOut[i].x, 0, lineOut[i].y);
                    colors.push(color, color, color, 1);
                    if (i != lineOut.length - 1) {
                        indices.push(offset + i + l, offset + i + 1, offset + i);
                        indices.push(offset + i + 1, offset + i + l, offset + i + l + 1);
                    }
                    else {
                        indices.push(offset + i + l, offset, offset + i);
                        indices.push(offset, offset + i + l, offset + l);
                    }
                }
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
        this.mainMenuContainer = document.getElementById("main-menu");
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
    }
    async initialize() {
        await this.initializeScene();
        this.initializeMainMenu();
    }
    resize() {
        let ratio = this.canvas.clientWidth / this.canvas.clientHeight;
        if (ratio >= 1) {
            this.camera.orthoTop = 40;
            this.camera.orthoRight = 40 * ratio;
            this.camera.orthoLeft = -40 * ratio;
            this.camera.orthoBottom = -40;
        }
        else {
            this.camera.orthoTop = 40 / ratio;
            this.camera.orthoRight = 40;
            this.camera.orthoLeft = -40;
            this.camera.orthoBottom = -40 / ratio;
        }
        this.centerMainMenu();
    }
    centerMainMenu() {
        let w = Math.max(this.canvas.clientWidth * 0.5, 600);
        let left = (this.canvas.clientWidth - w) * 0.5;
        this.mainMenuContainer.style.width = w.toFixed(0) + "px";
        this.mainMenuContainer.style.left = left.toFixed(0) + "px";
    }
    showMainMenu() {
        this.mainMenuContainer.style.display = "block";
    }
    hideMainMenu() {
        this.mainMenuContainer.style.display = "none";
    }
    xToLeft(x) {
        return (x - this.camera.orthoLeft) / this.sceneWidth;
    }
    xToRight(x) {
        return -(x - this.camera.orthoRight) / this.sceneWidth;
    }
    yToTop(y) {
        return -(y - this.camera.orthoTop) / this.sceneHeight;
    }
    yToBottom(y) {
        return (y - this.camera.orthoBottom) / this.sceneHeight;
    }
    get sceneWidth() {
        return this.camera.orthoRight - this.camera.orthoLeft;
    }
    get sceneHeight() {
        return this.camera.orthoTop - this.camera.orthoBottom;
    }
    async initializeScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 10, 0), this.scene);
        this.camera.rotation.x = Math.PI / 2;
        this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        this.resize();
        new BABYLON.DirectionalLight("light", BABYLON.Vector3.Down(), this.scene);
        window.onresize = () => {
            this.resize();
        };
        BABYLON.Engine.ShadersRepository = "./shaders/";
        this.scene.clearColor = BABYLON.Color4.FromHexString("#00000000");
        this.cellNetwork = new CellNetworkDisplayed(this);
        this.selected = new CellSelector(this.cellNetwork);
        let pickPlane = BABYLON.MeshBuilder.CreateGround("pick-plane", { width: 50, height: 50 }, this.scene);
        pickPlane.isVisible = false;
        /*
        let aiDepth = 1;

        let playSolo = false;
        this.scene.onPointerObservable.add((eventData: BABYLON.PointerInfo) => {
            let pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => { return m === pickPlane; });
            if (pick && pick.pickedPoint) {
                let cell = this.cellNetwork.worldPosToCell(pick.pickedPoint);
                if (cell.canRotate()) {
                    this.setPickedCell(cell);
                }
            }
            let reverse = false;
            if (this.pickedCell && pick.pickedPoint) {
                reverse = this.pickedCell.barycenter3D.x < pick.pickedPoint.x;
            }
            this.selected.reverse = reverse;
            if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                if (this.pickedCell) {
                    this.cellNetwork.morphCell(
                        0,
                        this.pickedCell,
                        reverse,
                        () => {
                            this.cellNetwork.checkSurround(
                                () => {
                                    scoreDisplay.update();
                                    if (playSolo) {
                                        return;
                                    }
                                    let aiMove = ai.getMove2(2, aiDepth);
                                    if (aiMove.cell) {
                                        this.cellNetwork.morphCell(
                                            2,
                                            aiMove.cell,
                                            aiMove.reverse,
                                            () => {
                                                this.cellNetwork.checkSurround(
                                                    () => {
                                                        scoreDisplay.update();
                                                    }
                                                );
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    );
                }
            }
        })
        */
    }
    initializeMainMenu() {
        document.getElementById("level-random-ai-vs-ai").addEventListener("pointerup", () => {
            this.currentLevel = new LevelRandomAIVsAI(this);
            this.currentLevel.initialize();
        });
    }
    setPickedCell(cell) {
        if (cell === this.pickedCell) {
            return;
        }
        if (cell && cell.value != 0) {
            return this.setPickedCell(undefined);
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
    document.getElementById("cell-network-info").style.display = "none";
    document.getElementById("meshes-info").style.display = "none";
    //document.getElementById("debug-info").style.display = "none";
    let debugColorP0 = document.getElementById("debug-p0-color");
    debugColorP0.addEventListener("input", (e) => {
        Cell.Colors[0] = BABYLON.Color4.FromHexString(e.currentTarget.value + "FF");
        console.log("Color 0 = " + Cell.Colors[0].toHexString());
        main.cellNetwork.cells.forEach(c => {
            c.updateShape();
        });
    });
    debugColorP0.value = Cell.Colors[0].toHexString().substring(0, 7);
    let debugColorP1 = document.getElementById("debug-p1-color");
    debugColorP1.addEventListener("input", (e) => {
        Cell.Colors[1] = BABYLON.Color4.FromHexString(e.currentTarget.value + "FF");
        console.log("Color 1 = " + Cell.Colors[1].toHexString());
        main.cellNetwork.cells.forEach(c => {
            c.updateShape();
        });
    });
    debugColorP1.value = Cell.Colors[1].toHexString().substring(0, 7);
    let debugColorP2 = document.getElementById("debug-p2-color");
    debugColorP2.addEventListener("input", (e) => {
        Cell.Colors[2] = BABYLON.Color4.FromHexString(e.currentTarget.value + "FF");
        console.log("Color 2 = " + Cell.Colors[2].toHexString());
        main.cellNetwork.cells.forEach(c => {
            c.updateShape();
        });
    });
    debugColorP2.value = Cell.Colors[2].toHexString().substring(0, 7);
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
    array() {
        return this._elements;
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
class Level {
    constructor(main) {
        this.main = main;
        this._update = () => {
            this.update();
        };
    }
    initialize() {
        this.main.hideMainMenu();
        this.main.scene.onBeforeRenderObservable.add(this._update);
    }
    update() {
    }
    dispose() {
        this.main.showMainMenu();
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
        this.main.cellNetwork.dispose();
    }
}
class LevelRandomAIVsAI extends Level {
    initialize() {
        super.initialize();
        this.scoreDisplay = new Score(3, this.main.cellNetwork);
        this.main.cellNetwork.generate(25, 300);
        this.main.cellNetwork.checkSurround(() => {
            this.scoreDisplay.update();
        });
        let aiPlayer0 = new AI(0, this.main.cellNetwork);
        let aiPlayer1 = new AI(1, this.main.cellNetwork);
        let step = async () => {
            this.scoreDisplay.update();
            await AsyncUtils.timeOut(50);
            let aiTestMove = aiPlayer0.getMove2(0, 1);
            if (aiTestMove.cell) {
                this.main.cellNetwork.morphCell(0, aiTestMove.cell, aiTestMove.reverse, () => {
                    this.main.cellNetwork.checkSurround(async () => {
                        this.scoreDisplay.update();
                        await AsyncUtils.timeOut(50);
                        let aiMove = aiPlayer1.getMove2(2, 1);
                        if (aiMove.cell) {
                            this.main.cellNetwork.morphCell(2, aiMove.cell, aiMove.reverse, () => {
                                this.main.cellNetwork.checkSurround(step);
                            });
                        }
                        else {
                            await AsyncUtils.timeOut(1000);
                            this.dispose();
                        }
                    });
                });
            }
            else {
                await AsyncUtils.timeOut(1000);
                this.dispose();
            }
        };
        setTimeout(step, 1000);
    }
    update() {
    }
    dispose() {
        super.dispose();
        if (this.scoreDisplay) {
            this.scoreDisplay.dispose();
        }
    }
}
class TerrainToonMaterial extends BABYLON.ShaderMaterial {
    constructor(name, color, scene) {
        super(name, scene, {
            vertex: "terrainToon",
            fragment: "terrainToon",
        }, {
            attributes: ["position", "normal", "uv", "color"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
        });
        this.setVector3("lightInvDirW", (new BABYLON.Vector3(0.5 + Math.random(), 2.5 + Math.random(), 1.5 + Math.random())).normalize());
        this.setColor3("colGrass", BABYLON.Color3.FromHexString("#47a632"));
        this.setColor3("colDirt", BABYLON.Color3.FromHexString("#a86f32"));
        this.setColor3("colRock", BABYLON.Color3.FromHexString("#8c8c89"));
        this.setColor3("colSand", BABYLON.Color3.FromHexString("#dbc67b"));
    }
}
class TerrainTileToonMaterial extends BABYLON.ShaderMaterial {
    constructor(name, scene) {
        super(name, scene, {
            vertex: "terrainTileToon",
            fragment: "terrainTileToon",
        }, {
            attributes: ["position", "normal", "uv"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
        });
        this.setVector3("lightInvDirW", (new BABYLON.Vector3(0.5, 2.5, 1.5)).normalize());
    }
    get diffuseTexture() {
        return this._diffuseTexture;
    }
    set diffuseTexture(tex) {
        this._diffuseTexture = tex;
        this.setTexture("diffuseTexture", this._diffuseTexture);
    }
}
class ToonMaterial extends BABYLON.ShaderMaterial {
    constructor(name, transparent, scene) {
        super(name, scene, {
            vertex: "toon",
            fragment: "toon",
        }, {
            attributes: ["position", "normal", "uv", "color"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"],
            needAlphaBlending: true
        });
        this.setTexture("pencil_texture", new BABYLON.Texture("assets/pencil.png", this.getScene()));
    }
}
class Score {
    constructor(playerCount = 2, network) {
        this.playerCount = playerCount;
        this.network = network;
        this.playerScoreMesh = [];
        this.playerScoreText = [];
        for (let i = 0; i < this.playerCount; i++) {
            this.playerScoreText[i] = document.getElementById("score-p" + i);
        }
        this.playerScoreText[0].style.right = (this.network.main.xToRight(-49) * 100).toFixed(0) + "%";
        this.playerScoreText[0].style.bottom = (this.network.main.yToBottom(-30) * 100).toFixed(0) + "%";
        this.playerScoreText[0].style.color = Cell.Colors[0].toHexString().substring(0, 7);
        this.playerScoreText[0].style.display = "block";
        for (let i = 1; i < this.playerCount - 1; i++) {
            this.playerScoreText[i].style.display = "none";
        }
        this.playerScoreText[this.playerCount - 1].style.right = (this.network.main.xToRight(-49) * 100).toFixed(0) + "%";
        this.playerScoreText[this.playerCount - 1].style.top = (this.network.main.yToTop(30) * 100).toFixed(0) + "%";
        this.playerScoreText[this.playerCount - 1].style.color = Cell.Colors[this.playerCount - 1].toHexString().substring(0, 7);
        this.playerScoreText[this.playerCount - 1].style.display = "block";
    }
    update() {
        let scores = [];
        for (let i = 0; i < this.playerCount; i++) {
            scores[i] = this.network.cells.filter(c => { return c.value === i; }).length;
            this.playerScoreText[i].innerText = scores[i].toFixed(0);
        }
        let scoreTotal = scores.reduce((s1, s2) => { return s1 + s2; });
        for (let p = 0; p < this.playerCount; p++) {
            if (scores[p] < 2) {
                if (this.playerScoreMesh[p]) {
                    this.playerScoreMesh[p].dispose();
                    continue;
                }
            }
            if (!this.playerScoreMesh[p] || this.playerScoreMesh[p].isDisposed()) {
                this.playerScoreMesh[p] = new BABYLON.Mesh("shape");
                this.playerScoreMesh[p].position.x = -45;
                this.playerScoreMesh[p].position.z = -30;
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
                new BABYLON.Vector2(3, yMax),
                new BABYLON.Vector2(-3, yMax),
                new BABYLON.Vector2(-3, yMin),
            ];
            let dOut = 0;
            let dIn = 0.7;
            let lineOut = Math2D.FattenShrinkEdgeShape(points, -dOut);
            let lineIn = Math2D.FattenShrinkEdgeShape(points, -dIn);
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
            let positions = [center.x, 0, center.y];
            let normals = [0, 1, 0];
            let indices = [];
            let colors = [...Cell.Colors[p].asArray()];
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
    dispose() {
        for (let p = 0; p < this.playerCount; p++) {
            if (this.playerScoreMesh[p]) {
                this.playerScoreMesh[p].dispose();
            }
            if (this.playerScoreText[p]) {
                this.playerScoreText[p].style.display = "none";
            }
        }
    }
}
class AsyncUtils {
    static async timeOut(delay, callback) {
        return new Promise(resolve => {
            setTimeout(() => {
                if (callback) {
                    callback();
                }
                resolve();
            }, delay);
        });
    }
}
