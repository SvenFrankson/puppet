class Board {
    constructor(main) {
        this.main = main;
        this.tiles = [];
        for (let i = 0; i < 11; i++) {
            this.tiles[i] = [];
            for (let j = 0; j < 11; j++) {
                this.tiles[i][j] = new Tile(i, j, this);
            }
        }
        this.tiles[5][5].isPlayable = true;
    }
    generateRandom() {
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                if (Math.random() > 0.5) {
                    this.tiles[i][j].color = Math.floor(4 * Math.random());
                    this.tiles[i][j].value = 1 + Math.floor(9 * Math.random());
                }
            }
        }
        this.tiles[0][0].color = 0;
        this.tiles[0][0].value = 9;
        this.tiles[10][0].color = 1;
        this.tiles[10][0].value = 9;
        this.updateShapes();
    }
    updateRangeAndPlayable() {
        let iMin = 5;
        let jMin = 5;
        let iMax = 5;
        let jMax = 5;
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                if (this.tiles[i][j].value > 0) {
                    iMin = Math.min(i, iMin);
                    jMin = Math.min(j, jMin);
                    iMax = Math.max(i, iMax);
                    jMax = Math.max(j, jMax);
                    for (let ii = -1; ii <= 1; ii++) {
                        for (let jj = -1; jj <= 1; jj++) {
                            if (i + ii >= 0 && i + ii < 11 && j + jj >= 0 && j + jj < 11) {
                                this.tiles[i + ii][j + jj].isPlayable = true;
                            }
                        }
                    }
                }
            }
        }
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                if (i >= iMin + 6) {
                    this.tiles[i][j].isInRange = false;
                }
                if (j >= jMin + 6) {
                    this.tiles[i][j].isInRange = false;
                }
                if (i <= iMax - 6) {
                    this.tiles[i][j].isInRange = false;
                }
                if (j <= jMax - 6) {
                    this.tiles[i][j].isInRange = false;
                }
            }
        }
    }
    updateShapes() {
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                this.tiles[i][j].updateShape();
            }
        }
    }
    reset() {
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                this.tiles[i][j].reset();
            }
        }
    }
    play(color, value, i, j) {
        if (i >= 0 && i < 11 && j >= 0 && j < 11) {
            let tile = this.tiles[i][j];
            if (tile.isInRange && tile.value < value) {
                tile.color = color;
                tile.value = value;
                this.updateRangeAndPlayable();
                this.updateShapes();
                return true;
            }
        }
        return false;
    }
}
class Card {
    constructor(value, color) {
        this.value = value;
        this.color = color;
    }
}
class Deck {
    constructor() {
        this.cards = [];
    }
    draw() {
        return this.cards.pop();
    }
    shuffle() {
        let l = this.cards.length;
        for (let n = 0; n < l * l; n++) {
            let i0 = Math.floor(Math.random() * l);
            let i1 = Math.floor(Math.random() * l);
            let c0 = this.cards[i0];
            let c1 = this.cards[i1];
            this.cards[i0] = c1;
            this.cards[i1] = c0;
        }
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
            this.camera.orthoTop = -6 * 4;
            this.camera.orthoRight = -6 * 4 * ratio;
            this.camera.orthoLeft = 6 * 4 * ratio;
            this.camera.orthoBottom = 6 * 4;
        }
        else {
            this.camera.orthoTop = -6 * 4 / ratio;
            this.camera.orthoRight = -6 * 4;
            this.camera.orthoLeft = 6 * 4;
            this.camera.orthoBottom = 6 * 4 / ratio;
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
        return 1 - (x - this.camera.orthoLeft) / this.sceneWidth;
    }
    xToRight(x) {
        return 1 + (x - this.camera.orthoRight) / this.sceneWidth;
    }
    yToTop(y) {
        return 1 + (y - this.camera.orthoTop) / this.sceneHeight;
    }
    yToBottom(y) {
        return 1 - (y - this.camera.orthoBottom) / this.sceneHeight;
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
        this.camera.rotation.x = Math.PI / 2 - 0.1;
        this.camera.rotation.z = Math.PI;
        this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        this.resize();
        new BABYLON.DirectionalLight("light", BABYLON.Vector3.Down(), this.scene);
        window.onresize = () => {
            this.resize();
        };
        BABYLON.Engine.ShadersRepository = "./shaders/";
        this.scene.clearColor = BABYLON.Color4.FromHexString("#00000000");
        this.board = new Board(this);
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
        document.getElementById("level-random-solo-s").addEventListener("pointerup", () => {
            this.currentLevel = new LevelRandomSolo(this);
            this.currentLevel.initialize();
        });
        document.getElementById("level-random-solo-m").addEventListener("pointerup", () => {
            this.currentLevel = new LevelRandomSolo(this);
            this.currentLevel.initialize();
        });
        document.getElementById("level-random-solo-l").addEventListener("pointerup", () => {
            this.currentLevel = new LevelRandomSolo(this);
            this.currentLevel.initialize();
        });
        document.getElementById("level-random-ai-vs-ai-s").addEventListener("pointerup", () => {
            this.currentLevel = new LevelRandomAIVsAI(this);
            this.currentLevel.initialize();
        });
        document.getElementById("level-random-ai-vs-ai-m").addEventListener("pointerup", () => {
            this.currentLevel = new LevelRandomAIVsAI(this);
            this.currentLevel.initialize();
        });
        document.getElementById("level-random-ai-vs-ai-l").addEventListener("pointerup", () => {
            this.currentLevel = new LevelRandomAIVsAI(this);
            this.currentLevel.initialize();
        });
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
class Tile {
    constructor(i, j, board) {
        this.i = i;
        this.j = j;
        this.board = board;
        this.color = -1;
        this.value = 0;
        this.isInRange = true;
        this.isPlayable = false;
        this.points = [
            new BABYLON.Vector2(-2, -2),
            new BABYLON.Vector2(2, -2),
            new BABYLON.Vector2(2, 2),
            new BABYLON.Vector2(-2, 2)
        ];
    }
    reset() {
        this.color = -1;
        this.value = 0;
        this.isInRange = true;
        this.isPlayable = false;
    }
    updateShape(points = this.points) {
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
            let lineOut = Math2D.FattenShrinkEdgeShape(points, -dOut);
            let lineIn = Math2D.FattenShrinkEdgeShape(points, -dIn);
            lineOut = Math2D.Smooth(lineOut, 7);
            lineOut = Math2D.Smooth(lineOut, 5);
            lineOut = Math2D.Smooth(lineOut, 3);
            lineIn = Math2D.Smooth(lineIn, 7);
            lineIn = Math2D.Smooth(lineIn, 5);
            lineIn = Math2D.Smooth(lineIn, 3);
            let c;
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
            let positions = [0, 0, 0];
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
Tile.Colors = [
    BABYLON.Color4.FromHexString("#0ABB07FF"),
    BABYLON.Color4.FromHexString("#FFC800FF"),
    BABYLON.Color4.FromHexString("#FF1900FF"),
    BABYLON.Color4.FromHexString("#070ABBFF")
];
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
        this.main.board.reset();
    }
}
class LevelRandomAIVsAI extends Level {
    constructor(main) {
        super(main);
    }
    initialize() {
        super.initialize();
    }
    update() {
    }
    dispose() {
        super.dispose();
    }
}
class LevelRandomSolo extends Level {
    constructor(main) {
        super(main);
        this.pickedCard = -1;
        this.pointerEvent = (eventData) => {
            if (eventData.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                console.log("Alpha");
                if (eventData.pickInfo.pickedMesh) {
                    console.log("Bravo " + eventData.pickInfo.pickedMesh.name);
                    if (eventData.pickInfo.pickedMesh.name === "shape_12_0") {
                        console.log("Charly");
                        this.pickedCard = 0;
                    }
                    else if (eventData.pickInfo.pickedMesh.name === "shape_13_0") {
                        this.pickedCard = 1;
                    }
                }
            }
            else if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                let ok = false;
                if (eventData.pickInfo.pickedMesh) {
                    let split = eventData.pickInfo.pickedMesh.name.split("_");
                    if (split.length === 3) {
                        let i = parseInt(split[1]);
                        let j = parseInt(split[2]);
                        if (isFinite(i) && isFinite(j)) {
                            ok = true;
                            let value = 0;
                            let color = -1;
                            if (this.pickedCard === 0) {
                                value = this.hand0.value;
                                color = this.hand0.color;
                            }
                            if (this.pickedCard === 1) {
                                value = this.hand1.value;
                                color = this.hand1.color;
                            }
                            if (this.main.board.play(color, value, i, j)) {
                                if (this.pickedCard === 0) {
                                    this.hand0.reset();
                                }
                                if (this.pickedCard === 1) {
                                    this.hand1.reset();
                                }
                                this.pickedCard = -1;
                                this.draw();
                            }
                        }
                    }
                }
                if (!ok) {
                    this.pickedCard = -1;
                }
            }
        };
    }
    initialize() {
        super.initialize();
        this.deckSolo = new Deck();
        for (let c = 0; c < 4; c++) {
            for (let v = 1; v <= 9; v++) {
                for (let n = 0; n < 2; n++) {
                    let card = new Card(v, c);
                    this.deckSolo.cards.push(card);
                }
            }
        }
        this.deckSolo.shuffle();
        this.hand0 = new Tile(12, 0, this.main.board);
        this.hand1 = new Tile(13, 0, this.main.board);
        this.draw();
        this.main.board.updateShapes();
        this.main.scene.onPointerObservable.add(this.pointerEvent);
    }
    draw() {
        if (this.hand0.value === 0) {
            let c = this.deckSolo.draw();
            if (c) {
                this.hand0.color = c.color;
                this.hand0.value = c.value;
                this.hand0.updateShape();
            }
        }
        if (this.hand1.value === 0) {
            let c = this.deckSolo.draw();
            if (c) {
                this.hand1.color = c.color;
                this.hand1.value = c.value;
                this.hand1.updateShape();
            }
        }
    }
    update() {
    }
    dispose() {
        super.dispose();
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