/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../lib/babylon.gui.d.ts"/>
var COS30 = Math.cos(Math.PI / 6);
class Main {
    constructor(canvasElement) {
        this.ratio = 1;
        this.canvas = document.getElementById(canvasElement);
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
    }
    async initialize() {
        await this.initializeScene();
    }
    resize() {
        this.resizeCamera();
    }
    resizeCamera() {
        let w = this.canvas.clientWidth;
        let h = this.canvas.clientHeight;
        let r = w / h;
        if (r > 1) {
            this.camera.orthoLeft = -10 * r;
            this.camera.orthoRight = 10 * r;
            this.camera.orthoTop = 10;
            this.camera.orthoBottom = -10;
        }
        else {
            this.camera.orthoLeft = -10;
            this.camera.orthoRight = 10;
            this.camera.orthoTop = 10 / r;
            this.camera.orthoBottom = -10 / r;
        }
    }
    async initializeScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor.copyFromFloats(158 / 255, 86 / 255, 55 / 255, 1);
        this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, -10), this.scene);
        this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        this.resize();
        new BABYLON.DirectionalLight("light", BABYLON.Vector3.Forward(), this.scene);
        window.onresize = () => {
            this.resize();
        };
        BABYLON.Engine.ShadersRepository = "./shaders/";
        let walker = new Walker(this.scene, this.canvas);
        let turret = new Turret(this.scene, this.canvas);
        turret.base.position.x = -5;
        turret.target = walker;
        for (let i = 0; i < 20; i++) {
            let rock = new Prop("rock_1", 0.80, 0.71, this.scene, this.canvas);
            rock.sprite.position.x = -20 + 40 * Math.random();
            rock.sprite.position.y = -20 + 40 * Math.random();
            rock.sprite.rotation.z = 2 * Math.PI * Math.random();
        }
    }
    animate() {
        this.engine.runRenderLoop(() => {
            this.resizeCamera();
            this.scene.render();
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
    static LerpFromToCircular(from, to, d = 0.5) {
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
        if (from <= to) {
            if (to - from > Math.PI) {
                to -= 2 * Math.PI;
            }
        }
        else {
            if (from - to > Math.PI) {
                to += 2 * Math.PI;
            }
        }
        let r = from * (1 - d) + to * d;
        while (r < 0) {
            r += 2 * Math.PI;
        }
        while (r >= 2 * Math.PI) {
            r -= 2 * Math.PI;
        }
        return r;
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
class Prop {
    constructor(name, w, h, scene, canvas) {
        this.name = name;
        this.w = w;
        this.h = h;
        this.scene = scene;
        this.canvas = canvas;
        this.sprite = BABYLON.MeshBuilder.CreatePlane(name, { width: w, height: h }, this.scene);
        this.sprite.position.z = 1;
        let spriteMaterial = new BABYLON.StandardMaterial("turret-sprite-material", this.scene);
        spriteMaterial.diffuseTexture = new BABYLON.Texture("assets/" + name + ".png", this.scene);
        spriteMaterial.diffuseTexture.hasAlpha = true;
        spriteMaterial.specularColor.copyFromFloats(0, 0, 0);
        spriteMaterial.alphaCutOff = 0.1;
        this.sprite.material = spriteMaterial;
    }
}
class Turret {
    constructor(scene, canvas) {
        this.scene = scene;
        this.canvas = canvas;
        this._t = 0;
        this._update = () => {
            this._t += this.scene.getEngine().getDeltaTime() / 1000;
            if (this.target) {
                let dir = new BABYLON.Vector2(this.canon.up.x, this.canon.up.y);
                let dirToTarget = new BABYLON.Vector2(this.target.body.position.x - this.base.position.x, this.target.body.position.y - this.base.position.y);
                let targetA = Math2D.AngleFromTo(new BABYLON.Vector2(0, 1), dirToTarget);
                this.body.rotation.z = Math2D.StepFromToCirular(this.body.rotation.z, targetA, 1 / 30 * 2 * Math.PI * this.scene.getEngine().getDeltaTime() / 1000);
                let aligned = Math2D.AreEqualsCircular(this.body.rotation.z, targetA, Math.PI / 180);
                if (aligned) {
                    this.canon.position.y = 0.6 + 0.05 * Math.cos(7 * this._t * 2 * Math.PI);
                    this.body.position.x = 0.03 * Math.cos(6 * this._t * 2 * Math.PI);
                    this.body.position.y = 0.03 * Math.cos(8 * this._t * 2 * Math.PI);
                }
                else {
                    this.canon.position.y = 0.6;
                    this.body.position.x = 0;
                    this.body.position.y = 0;
                }
            }
        };
        this.base = BABYLON.MeshBuilder.CreatePlane("turret-base", { width: 3.59, height: 3.56 }, this.scene);
        let baseMaterial = new BABYLON.StandardMaterial("turret-base-material", this.scene);
        baseMaterial.diffuseTexture = new BABYLON.Texture("assets/turret_base.png", this.scene);
        baseMaterial.diffuseTexture.hasAlpha = true;
        baseMaterial.specularColor.copyFromFloats(0, 0, 0);
        baseMaterial.alphaCutOff = 0.1;
        this.base.material = baseMaterial;
        this.body = BABYLON.MeshBuilder.CreatePlane("turret-body", { width: 1.70, height: 1.59 }, this.scene);
        this.body.position.z = -0.1;
        this.body.parent = this.base;
        let bodyMaterial = new BABYLON.StandardMaterial("turret-body-material", this.scene);
        bodyMaterial.diffuseTexture = new BABYLON.Texture("assets/turret_body.png", this.scene);
        bodyMaterial.diffuseTexture.hasAlpha = true;
        bodyMaterial.specularColor.copyFromFloats(0, 0, 0);
        bodyMaterial.alphaCutOff = 0.1;
        this.body.material = bodyMaterial;
        this.canon = BABYLON.MeshBuilder.CreatePlane("turret-canon", { width: 0.45, height: 2.92 }, this.scene);
        this.canon.position.y = 0.6;
        this.canon.position.z = -0.1;
        this.canon.parent = this.body;
        let canonMaterial = new BABYLON.StandardMaterial("turret-canon-material", this.scene);
        canonMaterial.diffuseTexture = new BABYLON.Texture("assets/turret_canon.png", this.scene);
        canonMaterial.diffuseTexture.hasAlpha = true;
        canonMaterial.specularColor.copyFromFloats(0, 0, 0);
        canonMaterial.alphaCutOff = 0.1;
        this.canon.material = canonMaterial;
        this.top = BABYLON.MeshBuilder.CreatePlane("turret-top", { width: 1.40, height: 0.96 }, this.scene);
        this.top.position.z = -0.2;
        this.top.parent = this.body;
        let topMaterial = new BABYLON.StandardMaterial("turret-top-material", this.scene);
        topMaterial.diffuseTexture = new BABYLON.Texture("assets/turret_top.png", this.scene);
        topMaterial.diffuseTexture.hasAlpha = true;
        topMaterial.specularColor.copyFromFloats(0, 0, 0);
        topMaterial.alphaCutOff = 0.1;
        this.top.material = topMaterial;
        this.scene.onBeforeRenderObservable.add(this._update);
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
class WalkerTarget extends BABYLON.Mesh {
    constructor(walker) {
        super("target");
        this.walker = walker;
        this.targets = [];
        let positions = [
            new BABYLON.Vector2(-1, 0),
            new BABYLON.Vector2(1, 0)
        ];
        for (let i = 0; i < walker.legCount; i++) {
            //let target = new BABYLON.Mesh("target-" + i);
            let target = BABYLON.MeshBuilder.CreateBox("target-" + i, { size: 0.05 });
            let red = new BABYLON.StandardMaterial("red", this.walker.scene);
            red.diffuseColor.copyFromFloats(1, 0, 0);
            red.specularColor.copyFromFloats(0, 0, 0);
            target.material = red;
            target.position.x = positions[i].x;
            target.position.y = positions[i].y;
            target.parent = this;
            this.targets[i] = target;
        }
    }
}
class Walker {
    constructor(scene, canvas) {
        this.scene = scene;
        this.canvas = canvas;
        this.legCount = 2;
        this.feet = [];
        this.arms = [];
        this._inputDirs = new UniqueList();
        this._movingLegCount = 0;
        this._movingLegs = new UniqueList();
        this._bodyT = 0;
        this._bodySpeed = 0.5;
        this._armT = 0;
        this._armSpeed = 1;
        this._update = () => {
            this._bodyT += this._bodySpeed * this.scene.getEngine().getDeltaTime() / 1000;
            this._armT += this._armSpeed * this.scene.getEngine().getDeltaTime() / 1000;
            this._bodySpeed = 1;
            this._armSpeed = 1;
            if (this._inputDirs.contains(0)) {
                this.target.position.addInPlace(this.target.right.scale(2 * this.scene.getEngine().getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(1)) {
                this.target.position.subtractInPlace(this.target.up.scale(1 * this.scene.getEngine().getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(2)) {
                this.target.position.subtractInPlace(this.target.right.scale(2 * this.scene.getEngine().getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(3)) {
                this.target.position.addInPlace(this.target.up.scale(3 * this.scene.getEngine().getDeltaTime() / 1000));
                this._bodySpeed = 3;
                this._armSpeed = 5;
            }
            if (this._inputDirs.contains(4)) {
                this.target.rotation.z += 0.4 * Math.PI * this.scene.getEngine().getDeltaTime() / 1000;
            }
            if (this._inputDirs.contains(5)) {
                this.target.rotation.z -= 0.4 * Math.PI * this.scene.getEngine().getDeltaTime() / 1000;
            }
            while (this.target.rotation.z < 0) {
                this.target.rotation.z += 2 * Math.PI;
            }
            while (this.target.rotation.z >= 2 * Math.PI) {
                this.target.rotation.z -= 2 * Math.PI;
            }
            this.body.position.copyFrom(this.feet[0].position);
            for (let i = 1; i < this.legCount; i++) {
                this.body.position.addInPlace(this.feet[i].position);
            }
            this.body.position.scaleInPlace(1 / this.legCount);
            this.body.position.x += Math.cos(1 * this._bodyT * Math.PI) * 0.1;
            this.body.position.y += Math.cos(1.1 * this._bodyT * Math.PI) * 0.1;
            this.body.position.z = 0;
            this.arms[0].rotation.z = Math.cos(1 * this._armT * Math.PI) * 0.15 - 0.3;
            this.arms[1].rotation.z = Math.cos(1.1 * this._armT * Math.PI) * 0.15 + 0.3;
            let rightDir = new BABYLON.Vector2(this.feet[1].absolutePosition.x - this.feet[0].absolutePosition.x, this.feet[1].absolutePosition.y - this.feet[0].absolutePosition.y);
            rightDir.normalize();
            let a = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), rightDir);
            this.body.rotation.z = Math2D.LerpFromToCircular(a, this.target.rotation.z, 0.5);
            if (this._movingLegCount <= 0) {
                let index = -1;
                let dist = 0;
                for (let i = 0; i < this.legCount; i++) {
                    if (!this._movingLegs.contains(i)) {
                        let iDist = BABYLON.Vector3.DistanceSquared(this.feet[i].position, this.target.targets[i].absolutePosition);
                        if (iDist > dist) {
                            dist = iDist;
                            index = i;
                        }
                    }
                }
                if (dist > 0.01) {
                    this._movingLegCount++;
                    this._moveLeg(index, this.target.targets[index].absolutePosition, this.target.rotation.z);
                }
            }
        };
        this.target = new WalkerTarget(this);
        let robotBody = BABYLON.MeshBuilder.CreatePlane("robot-body-2", { width: 1.80, height: 3.06 }, this.scene);
        robotBody.position.x = 5;
        robotBody.position.y = 5;
        let robotBodyMaterial = new BABYLON.StandardMaterial("robot-body-material", this.scene);
        robotBodyMaterial.diffuseTexture = new BABYLON.Texture("assets/robot_body_2.png", this.scene);
        robotBodyMaterial.diffuseTexture.hasAlpha = true;
        robotBodyMaterial.specularColor.copyFromFloats(0, 0, 0);
        robotBodyMaterial.alphaCutOff = 0.1;
        robotBody.material = robotBodyMaterial;
        this.body = robotBody;
        let robotArm_L = BABYLON.MeshBuilder.CreatePlane("robot-arm_L", { width: 1.38, height: 1.31 }, this.scene);
        robotArm_L.setPivotPoint((new BABYLON.Vector3(0.48, -0.43, 0)));
        robotArm_L.position.x = -1.1;
        robotArm_L.position.y = 0.7;
        robotArm_L.position.z = -0.1;
        robotArm_L.parent = robotBody;
        let robotArm_LMaterial = new BABYLON.StandardMaterial("robot-arm_L-material", this.scene);
        robotArm_LMaterial.diffuseTexture = new BABYLON.Texture("assets/robot_arm_L.png", this.scene);
        robotArm_LMaterial.diffuseTexture.hasAlpha = true;
        robotArm_LMaterial.specularColor.copyFromFloats(0, 0, 0);
        robotArm_LMaterial.alphaCutOff = 0.1;
        robotArm_L.material = robotArm_LMaterial;
        let robotArm_R = BABYLON.MeshBuilder.CreatePlane("robot-arm_R", { width: 1.34, height: 1.28 }, this.scene);
        robotArm_R.setPivotPoint((new BABYLON.Vector3(-0.47, -0.44, 0)));
        robotArm_R.position.x = 1.1;
        robotArm_R.position.y = 0.7;
        robotArm_R.position.z = -0.1;
        robotArm_R.parent = robotBody;
        let robotArm_RMaterial = new BABYLON.StandardMaterial("robot-arm_R-material", this.scene);
        robotArm_RMaterial.diffuseTexture = new BABYLON.Texture("assets/robot_arm_R.png", this.scene);
        robotArm_RMaterial.diffuseTexture.hasAlpha = true;
        robotArm_RMaterial.specularColor.copyFromFloats(0, 0, 0);
        robotArm_RMaterial.alphaCutOff = 0.1;
        robotArm_R.material = robotArm_RMaterial;
        let robotFoot_L = BABYLON.MeshBuilder.CreatePlane("robot-foot_L", { width: 1.60, height: 1.78 }, this.scene);
        robotFoot_L.position.x = -1.1;
        robotFoot_L.position.y = 0;
        robotFoot_L.position.z = 0.1;
        robotFoot_L.rotation.z = 0.3;
        let robotfoot_LMaterial = new BABYLON.StandardMaterial("robot-foot_L-material", this.scene);
        robotfoot_LMaterial.diffuseTexture = new BABYLON.Texture("assets/robot_foot_L.png", this.scene);
        robotfoot_LMaterial.diffuseTexture.hasAlpha = true;
        robotfoot_LMaterial.specularColor.copyFromFloats(0, 0, 0);
        robotfoot_LMaterial.alphaCutOff = 0.1;
        robotFoot_L.material = robotfoot_LMaterial;
        let robotFoot_R = BABYLON.MeshBuilder.CreatePlane("robot-foot_R", { width: 1.57, height: 1.76 }, this.scene);
        robotFoot_R.position.x = 1.1;
        robotFoot_R.position.y = 0;
        robotFoot_R.position.z = 0.1;
        robotFoot_R.rotation.z = -0.3;
        let robotfoot_RMaterial = new BABYLON.StandardMaterial("robot-foot_R-material", this.scene);
        robotfoot_RMaterial.diffuseTexture = new BABYLON.Texture("assets/robot_foot_R.png", this.scene);
        robotfoot_RMaterial.diffuseTexture.hasAlpha = true;
        robotfoot_RMaterial.specularColor.copyFromFloats(0, 0, 0);
        robotfoot_RMaterial.alphaCutOff = 0.1;
        robotFoot_R.material = robotfoot_RMaterial;
        this.feet = [robotFoot_L, robotFoot_R];
        this.arms = [robotArm_L, robotArm_R];
        this.scene.onBeforeRenderObservable.add(this._update);
        this.canvas.addEventListener("keydown", (e) => {
            if (e.code === "KeyD") {
                this._inputDirs.push(0);
            }
            if (e.code === "KeyS") {
                this._inputDirs.push(1);
            }
            if (e.code === "KeyA") {
                this._inputDirs.push(2);
            }
            if (e.code === "KeyW") {
                this._inputDirs.push(3);
            }
            if (e.code === "KeyQ") {
                this._inputDirs.push(4);
            }
            if (e.code === "KeyE") {
                this._inputDirs.push(5);
            }
        });
        this.canvas.addEventListener("keyup", (e) => {
            if (e.code === "KeyD") {
                this._inputDirs.remove(0);
            }
            if (e.code === "KeyS") {
                this._inputDirs.remove(1);
            }
            if (e.code === "KeyA") {
                this._inputDirs.remove(2);
            }
            if (e.code === "KeyW") {
                this._inputDirs.remove(3);
            }
            if (e.code === "KeyQ") {
                this._inputDirs.remove(4);
            }
            if (e.code === "KeyE") {
                this._inputDirs.remove(5);
            }
        });
    }
    get _inputDir() {
        return this._inputDirs.getLast();
    }
    async _moveLeg(legIndex, target, targetR) {
        return new Promise(resolve => {
            this._movingLegs.push(legIndex);
            let origin = this.feet[legIndex].position.clone();
            let originR = this.feet[legIndex].rotation.z;
            let l = target.subtract(origin).length();
            let duration = Math.floor(l / 3);
            duration *= 0.5;
            duration += 0.5;
            let t = 0;
            let step = () => {
                t += this.scene.getEngine().getDeltaTime() / 1000;
                let d = t / duration;
                d = d * d;
                d = Math.min(d, 1);
                this.feet[legIndex].position.copyFrom(origin.scale(1 - d).add(target.scale(d)));
                this.feet[legIndex].position.z = 0.1;
                this.feet[legIndex].rotation.z = Math2D.LerpFromToCircular(originR, targetR, d);
                if (d < 1) {
                    requestAnimationFrame(step);
                }
                else {
                    this._movingLegCount -= 1;
                    this._movingLegs.remove(legIndex);
                    resolve();
                }
            };
            step();
        });
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
class ArrayUtils {
    static shuffle(array) {
        let l = array.length;
        for (let i = 0; i < l * l; i++) {
            let i0 = Math.floor(Math.random() * l);
            let i1 = Math.floor(Math.random() * l);
            let e0 = array[i0];
            let e1 = array[i1];
            array[i0] = e1;
            array[i1] = e0;
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
