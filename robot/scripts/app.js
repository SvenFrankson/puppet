/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../lib/babylon.gui.d.ts"/>
var COS30 = Math.cos(Math.PI / 6);
class Main {
    constructor(canvasElement) {
        this.gameObjects = [];
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
    getPointerWorldPos() {
        let pointerX = this.scene.pointerX / this.canvas.clientWidth;
        let pointerY = 1 - this.scene.pointerY / this.canvas.clientHeight;
        let worldX = this.camera.orthoLeft + pointerX * (this.camera.orthoRight - this.camera.orthoLeft);
        let worldY = this.camera.orthoBottom + pointerY * (this.camera.orthoTop - this.camera.orthoBottom);
        document.getElementById("debug-pointer-xy").innerText = (pointerX * 100).toFixed(1) + " : " + (pointerY * 100).toFixed(1);
        return new BABYLON.Vector2(worldX, worldY);
    }
    worldPosToPixel(w) {
        let px = (w.x - this.camera.orthoLeft) / (this.camera.orthoRight - this.camera.orthoLeft);
        let py = (w.y - this.camera.orthoBottom) / (this.camera.orthoTop - this.camera.orthoBottom);
        return new BABYLON.Vector2(px * this.canvas.clientWidth, (1 - py) * this.canvas.clientHeight);
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
        this.playerAction = new PlayerAction(this);
        let menu = new Menu(this);
        menu.initializeMenu();
        this.generateScene();
        menu.showIngameMenu();
        let loadingPlane = new LoadingPlane(new BABYLON.Vector2(5, -4), 3, () => { }, this);
    }
    generateScene() {
        let walker = new Walker(this);
        let turret = new Turret(this);
        turret.base.position.x = -5;
        turret.target = walker;
        for (let i = 0; i < 20; i++) {
            let rock = new Prop("rock_1", this);
            rock.sprite.position.x = -20 + 40 * Math.random();
            rock.sprite.position.y = -20 + 40 * Math.random();
            rock.sprite.rotation.z = 2 * Math.PI * Math.random();
        }
        let wallNode1 = new WallNode(this);
        wallNode1.sprite.position.x = -4;
        wallNode1.sprite.position.y = 5;
        let wallNode2 = new WallNode(this);
        wallNode2.sprite.position.x = 7;
        wallNode2.sprite.position.y = 3;
        let wallNode3 = new WallNode(this);
        wallNode3.sprite.position.x = 6;
        wallNode3.sprite.position.y = -4;
        let wall1 = new Wall(wallNode1, wallNode2, this);
        let wall2 = new Wall(wallNode2, wallNode3, this);
    }
    disposeScene() {
        while (this.gameObjects.length > 0) {
            this.gameObjects.pop().dispose();
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
class GameObject {
    constructor(main) {
        this.main = main;
        this.isDisposed = false;
        main.gameObjects.push(this);
    }
    dispose() {
        this.isDisposed = true;
    }
}
/// <reference path="GameObject.ts"/>
class Prop extends GameObject {
    constructor(name, main) {
        super(main);
        this.name = name;
        this.sprite = new Sprite(name, "assets/" + name + ".png", this.main.scene);
        this.sprite.position.z = 1;
    }
    dispose() {
        super.dispose();
        this.sprite.dispose();
    }
}
class Sprite extends BABYLON.Mesh {
    constructor(name, url, scene, length) {
        super(name, scene);
        this.height = 1;
        this._pos2D = BABYLON.Vector2.Zero();
        this._update = () => {
            this.shadowMesh.position.x = this.absolutePosition.x + 0.5 * this.height / 5;
            this.shadowMesh.position.y = this.absolutePosition.y - 0.3 * this.height / 5;
            this.shadowMesh.position.z = 1.1;
            this.shadowMesh.rotation.z = this.rotation.z;
            let parent = this.parent;
            while (parent && parent instanceof BABYLON.Mesh) {
                this.shadowMesh.rotation.z += parent.rotation.z;
                parent = parent.parent;
            }
        };
        this.shadowMesh = new BABYLON.Mesh(name + "-shadow", scene);
        let material = new BABYLON.StandardMaterial(name + "-material", scene);
        let texture = new BABYLON.Texture(url, scene, false, true, undefined, () => {
            this.refreshMesh(length);
        });
        material.diffuseTexture = texture;
        material.diffuseTexture.hasAlpha = true;
        material.specularColor.copyFromFloats(0, 0, 0);
        material.alphaCutOff = 0.5;
        this.material = material;
        let shadowMaterial = new BABYLON.StandardMaterial(name + "-material", scene);
        shadowMaterial.diffuseTexture = texture;
        shadowMaterial.diffuseColor.copyFromFloats(0, 0, 0);
        shadowMaterial.diffuseTexture.hasAlpha = true;
        shadowMaterial.specularColor.copyFromFloats(0, 0, 0);
        shadowMaterial.useAlphaFromDiffuseTexture = true;
        shadowMaterial.alpha = 0.8;
        this.shadowMesh.material = shadowMaterial;
        scene.onBeforeRenderObservable.add(this._update);
    }
    get spriteMaterial() {
        if (this.material instanceof BABYLON.StandardMaterial) {
            return this.material;
        }
    }
    get pos2D() {
        this._pos2D.x = this.position.x;
        this._pos2D.y = this.position.y;
        return this._pos2D;
    }
    get posX() {
        return this.position.x;
    }
    set posX(x) {
        this.position.x = x;
    }
    get posY() {
        return this.position.y;
    }
    set posY(y) {
        this.position.y = y;
    }
    refreshMesh(length) {
        let size = this.spriteMaterial.diffuseTexture.getBaseSize();
        let quadData;
        if (isFinite(length)) {
            quadData = BABYLON.VertexData.CreatePlane({ width: length, height: size.height / 100, sideOrientation: 2, frontUVs: new BABYLON.Vector4(0, 0, length / (size.width / 100), 1) });
        }
        else {
            quadData = BABYLON.VertexData.CreatePlane({ width: size.width / 100, height: size.height / 100 });
        }
        quadData.applyToMesh(this);
        quadData.applyToMesh(this.shadowMesh);
    }
    dispose(doNotRecurse, disposeMaterialAndTextures) {
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
        this.shadowMesh.dispose(doNotRecurse, disposeMaterialAndTextures);
        this.getScene().onBeforeRenderObservable.removeCallback(this._update);
    }
}
class Turret extends GameObject {
    constructor(main) {
        super(main);
        this.isReady = true;
        this._t = 0;
        this._update = () => {
            if (!this.isReady) {
                return;
            }
            this._t += this.main.scene.getEngine().getDeltaTime() / 1000;
            if (!this.target) {
                let walker = this.main.gameObjects.find(g => { return g instanceof Walker; });
                if (walker) {
                    this.target = walker;
                }
            }
            if (this.target) {
                let dirToTarget = new BABYLON.Vector2(this.target.body.posX - this.base.posX, this.target.body.posY - this.base.posY);
                let targetA = Math2D.AngleFromTo(new BABYLON.Vector2(0, 1), dirToTarget);
                this.body.rotation.z = Math2D.StepFromToCirular(this.body.rotation.z, targetA, 1 / 30 * 2 * Math.PI * this.main.scene.getEngine().getDeltaTime() / 1000);
                let aligned = Math2D.AreEqualsCircular(this.body.rotation.z, targetA, Math.PI / 180);
                if (aligned) {
                    this.canon.posY = 0.6 + 0.05 * Math.cos(7 * this._t * 2 * Math.PI);
                    this.body.posX = 0.03 * Math.cos(6 * this._t * 2 * Math.PI);
                    this.body.posY = 0.03 * Math.cos(8 * this._t * 2 * Math.PI);
                }
                else {
                    this.canon.posY = 0.6;
                    this.body.posX = 0;
                    this.body.posY = 0;
                }
            }
        };
        this.base = new Sprite("turret-base", "assets/turret_base.png", this.main.scene);
        this.base.height = 1;
        this.body = new Sprite("turret-body", "assets/turret_body.png", this.main.scene);
        this.body.height = 3;
        this.body.position.z = -0.1;
        this.body.parent = this.base;
        this.canon = new Sprite("turret-canon", "assets/turret_canon.png", this.main.scene);
        this.canon.height = 5;
        this.canon.posY = 0.6;
        this.canon.position.z = -0.1;
        this.canon.parent = this.body;
        this.top = new Sprite("turret-top", "assets/turret_top.png", this.main.scene);
        this.top.height = 5;
        this.top.position.z = -0.2;
        this.top.parent = this.body;
        this.main.scene.onBeforeRenderObservable.add(this._update);
    }
    dispose() {
        super.dispose();
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
        this.base.dispose();
        this.body.dispose();
        this.canon.dispose();
        this.top.dispose();
    }
    setDarkness(d) {
        this.base.spriteMaterial.diffuseColor.copyFromFloats(d, d, d);
        this.body.spriteMaterial.diffuseColor.copyFromFloats(d, d, d);
        this.canon.spriteMaterial.diffuseColor.copyFromFloats(d, d, d);
        this.top.spriteMaterial.diffuseColor.copyFromFloats(d, d, d);
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
            let target = new BABYLON.Mesh("target-" + i);
            target.position.x = positions[i].x;
            target.position.y = positions[i].y;
            target.parent = this;
            this.targets[i] = target;
        }
    }
}
class Walker extends GameObject {
    constructor(main) {
        super(main);
        this.legCount = 2;
        this.arms = [];
        this.feet = [];
        this._inputDirs = new UniqueList();
        this._movingLegCount = 0;
        this._movingLegs = new UniqueList();
        this._bodyT = 0;
        this._bodySpeed = 0.5;
        this._armT = 0;
        this._armSpeed = 1;
        this._update = () => {
            this._bodyT += this._bodySpeed * this.main.scene.getEngine().getDeltaTime() / 1000;
            this._armT += this._armSpeed * this.main.scene.getEngine().getDeltaTime() / 1000;
            this._bodySpeed = 1;
            this._armSpeed = 1;
            if (this._inputDirs.contains(0)) {
                this.target.position.addInPlace(this.target.right.scale(2 * this.main.scene.getEngine().getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(1)) {
                this.target.position.subtractInPlace(this.target.up.scale(1 * this.main.scene.getEngine().getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(2)) {
                this.target.position.subtractInPlace(this.target.right.scale(2 * this.main.scene.getEngine().getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(3)) {
                this.target.position.addInPlace(this.target.up.scale(3 * this.main.scene.getEngine().getDeltaTime() / 1000));
                this._bodySpeed = 3;
                this._armSpeed = 5;
            }
            if (this._inputDirs.contains(4)) {
                this.target.rotation.z += 0.4 * Math.PI * this.main.scene.getEngine().getDeltaTime() / 1000;
            }
            if (this._inputDirs.contains(5)) {
                this.target.rotation.z -= 0.4 * Math.PI * this.main.scene.getEngine().getDeltaTime() / 1000;
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
                if (dist > 0.1) {
                    this._movingLegCount++;
                    this._moveLeg(index, this.target.targets[index].absolutePosition, this.target.rotation.z);
                }
            }
        };
        this.target = new WalkerTarget(this);
        let robotBody = new Sprite("robot-body", "assets/robot_body_2.png", this.main.scene);
        robotBody.height = 2;
        robotBody.position.x = 5;
        robotBody.position.y = 5;
        this.body = robotBody;
        let robotArm_L = new Sprite("robot-arm_L", "assets/robot_arm_L.png", this.main.scene);
        robotArm_L.height = 3;
        robotArm_L.setPivotPoint((new BABYLON.Vector3(0.48, -0.43, 0)));
        robotArm_L.position.x = -1.1;
        robotArm_L.position.y = 0.7;
        robotArm_L.position.z = -0.1;
        robotArm_L.parent = robotBody;
        let robotArm_R = new Sprite("robot-arm_R", "assets/robot_arm_R.png", this.main.scene);
        robotArm_R.height = 3;
        robotArm_R.setPivotPoint((new BABYLON.Vector3(-0.48, -0.43, 0)));
        robotArm_R.position.x = 1.1;
        robotArm_R.position.y = 0.7;
        robotArm_R.position.z = -0.1;
        robotArm_R.parent = robotBody;
        let robotFoot_L = new Sprite("robot-foot_L", "assets/robot_foot_L.png", this.main.scene);
        robotFoot_L.height = 1;
        robotFoot_L.position.x = -1.1;
        robotFoot_L.position.y = 0;
        robotFoot_L.position.z = 0.1;
        robotFoot_L.rotation.z = 0.3;
        let robotFoot_R = new Sprite("robot-foot_R", "assets/robot_foot_R.png", this.main.scene);
        robotFoot_R.height = 1;
        robotFoot_R.position.x = 1.1;
        robotFoot_R.position.y = 0;
        robotFoot_R.position.z = 0.1;
        robotFoot_R.rotation.z = -0.3;
        this.feet = [robotFoot_L, robotFoot_R];
        this.arms = [robotArm_L, robotArm_R];
        this.main.scene.onBeforeRenderObservable.add(this._update);
        this.main.canvas.addEventListener("keydown", (e) => {
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
        this.main.canvas.addEventListener("keyup", (e) => {
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
    dispose() {
        super.dispose();
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
        this.body.dispose();
        this.arms.forEach(a => {
            a.dispose();
        });
        this.feet.forEach(f => {
            f.dispose();
        });
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
                t += this.main.scene.getEngine().getDeltaTime() / 1000;
                let d = t / duration;
                d = d * d;
                d = Math.min(d, 1);
                this.feet[legIndex].position.copyFrom(origin.scale(1 - d).add(target.scale(d)));
                this.feet[legIndex].height = 1 + 3 * Math.sin(Math.PI * d);
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
class WallNode extends GameObject {
    constructor(main) {
        super(main);
        this.isReady = true;
        this.sprite = new Sprite("wall", "assets/wall_node_base.png", this.main.scene);
        this.sprite.position.z = 0;
        this.sprite.height = 1;
        this.top = new Sprite("wall-top", "assets/wall_top.png", this.main.scene);
        this.top.position.z = -0.2;
        this.top.parent = this.sprite;
        this.top.height = 5;
    }
    dispose() {
        super.dispose();
        this.sprite.dispose();
        this.top.dispose();
    }
    setDarkness(d) {
        this.sprite.spriteMaterial.diffuseColor.copyFromFloats(d, d, d);
        this.top.spriteMaterial.diffuseColor.copyFromFloats(d, d, d);
    }
}
class Wall extends GameObject {
    constructor(node1, node2, main) {
        super(main);
        this.node1 = node1;
        this.node2 = node2;
        this.refreshMesh();
    }
    refreshMesh() {
        let n = this.node2.sprite.position.subtract(this.node1.sprite.position);
        let l = n.length();
        if (this.sprite) {
            this.sprite.refreshMesh(l);
        }
        else {
            if (l > 0) {
                this.sprite = new Sprite("wall", "assets/wall.png", this.main.scene, l);
                this.sprite.height = 5;
            }
            else {
                console.log("ouf");
            }
        }
        this.sprite.setPivotPoint(new BABYLON.Vector3(-l * 0.5, 0, 0));
        this.sprite.position.z = -0.1;
        this.sprite.position.x = this.node1.sprite.position.x + l * 0.5;
        this.sprite.position.y = this.node1.sprite.position.y;
        this.sprite.rotation.z = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), new BABYLON.Vector2(n.x, n.y));
    }
    dispose() {
        super.dispose();
        this.sprite.dispose();
    }
    setDarkness(d) {
        this.sprite.spriteMaterial.diffuseColor.copyFromFloats(d, d, d);
    }
}
class ArcPlane {
    static CreateVertexData(r, from, to) {
        while (to < from) {
            to += 2 * Math.PI;
        }
        let a = from;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        let data = new BABYLON.VertexData();
        let px = cosa;
        let py = sina;
        if (px > Math.SQRT2 * 0.5) {
            py /= px;
            px = 1;
        }
        else if (py > Math.SQRT2 * 0.5) {
            px /= py;
            py = 1;
        }
        else if (px < -Math.SQRT2 * 0.5) {
            py /= -px;
            px = -1;
        }
        else if (py < -Math.SQRT2 * 0.5) {
            px /= -py;
            py = -1;
        }
        let positions = [0, 0, 0, r * px, r * py, 0];
        let indices = [];
        let uvs = [0.5, 0.5, px * 0.5 + 0.5, py * 0.5 + 0.5];
        let l = 2;
        while (a < to) {
            a = Math.min(to, a + Math.PI / 32);
            cosa = Math.cos(a);
            sina = Math.sin(a);
            let px = cosa;
            let py = sina;
            if (px > Math.SQRT2 * 0.5) {
                py /= px;
                px = 1;
            }
            else if (py > Math.SQRT2 * 0.5) {
                px /= py;
                py = 1;
            }
            else if (px < -Math.SQRT2 * 0.5) {
                py /= -px;
                px = -1;
            }
            else if (py < -Math.SQRT2 * 0.5) {
                px /= -py;
                py = -1;
            }
            positions.push(r * px, r * py, 0);
            uvs.push(px * 0.5 + 0.5, py * 0.5 + 0.5);
            indices.push(l, 0, l - 1);
            l++;
        }
        data.positions = positions;
        data.indices = indices;
        data.uvs = uvs;
        return data;
    }
}
class CutPlane {
    static CreateVerticalVertexData(w, h, from, to) {
        let data = new BABYLON.VertexData();
        let positions = [];
        let indices = [];
        let uvs = [];
        let ww = 0.5 * w;
        let hh = 0.5 * h;
        positions.push(-ww, -hh + h * from, 0, -ww, -hh + h * to, 0, ww, -hh + h * to, 0, ww, -hh + h * from, 0);
        indices.push(0, 2, 1, 0, 3, 2);
        uvs.push(0, from, 0, to, 1, to, 1, from);
        data.positions = positions;
        data.indices = indices;
        data.uvs = uvs;
        return data;
    }
}
class LoadingPlane {
    constructor(pos2D, duration, onCompletionCallback, main) {
        this.pos2D = pos2D;
        this.duration = duration;
        this.onCompletionCallback = onCompletionCallback;
        this.main = main;
        this._timer = 0;
        this._update = () => {
            this._timer += this.main.engine.getDeltaTime() / 1000;
            let t = this._timer / this.duration;
            if (t < 1) {
                CutPlane.CreateVerticalVertexData(2.5, 2.5, 0, t).applyToMesh(this.greenSprite);
                CutPlane.CreateVerticalVertexData(2.5, 2.5, t, 1).applyToMesh(this.graySprite);
                this.decimalElement.innerText = (Math.floor(t * 10)).toFixed(0);
                this.unitElement.innerText = (Math.floor(t * 100) % 10).toFixed(0);
            }
            else {
                this.dispose();
                if (this.onCompletionCallback) {
                    this.onCompletionCallback();
                }
            }
        };
        this.greenSprite = new BABYLON.Mesh("green-sprite", this.main.scene);
        let greenSpriteMaterial = new BABYLON.StandardMaterial("green-sprite-material", this.main.scene);
        greenSpriteMaterial.diffuseTexture = new BABYLON.Texture("assets/building-loader-green.png", this.main.scene);
        greenSpriteMaterial.diffuseTexture.hasAlpha = true;
        greenSpriteMaterial.specularColor.copyFromFloats(0, 0, 0);
        greenSpriteMaterial.alphaCutOff = 0.5;
        this.greenSprite.material = greenSpriteMaterial;
        this.greenSprite.position.x = this.pos2D.x;
        this.greenSprite.position.y = this.pos2D.y;
        this.greenSprite.position.z = -2;
        this.graySprite = new BABYLON.Mesh("graySprite", this.main.scene);
        let graySpriteMaterial = new BABYLON.StandardMaterial("graySprite-material", this.main.scene);
        graySpriteMaterial.diffuseTexture = new BABYLON.Texture("assets/building-loader-gray.png", this.main.scene);
        graySpriteMaterial.diffuseTexture.hasAlpha = true;
        graySpriteMaterial.specularColor.copyFromFloats(0, 0, 0);
        graySpriteMaterial.alphaCutOff = 0.5;
        this.graySprite.material = graySpriteMaterial;
        this.graySprite.position.x = this.pos2D.x;
        this.graySprite.position.y = this.pos2D.y;
        this.graySprite.position.z = -2;
        let a = 240 / 180 * Math.PI;
        CutPlane.CreateVerticalVertexData(2.5, 2.5, 0, 0).applyToMesh(this.greenSprite);
        CutPlane.CreateVerticalVertexData(2.5, 2.5, 0, 1).applyToMesh(this.graySprite);
        this.valueElement = document.createElement("div");
        this.decimalElement = document.createElement("span");
        this.decimalElement.classList.add("building-loader-digit");
        this.valueElement.appendChild(this.decimalElement);
        this.unitElement = document.createElement("span");
        this.unitElement.classList.add("building-loader-digit");
        this.valueElement.appendChild(this.unitElement);
        let pc = document.createElement("span");
        pc.classList.add("building-loader-digit");
        pc.innerText = "%";
        this.valueElement.appendChild(pc);
        this.valueElement.classList.add("building-loader-value");
        let p = this.main.worldPosToPixel(pos2D);
        this.valueElement.style.left = (p.x - 35).toFixed(0) + "px";
        this.valueElement.style.top = (p.y - 5).toFixed(0) + "px";
        document.body.appendChild(this.valueElement);
        this.main.scene.onBeforeRenderObservable.add(this._update);
    }
    dispose() {
        this.graySprite.dispose();
        this.greenSprite.dispose();
        document.body.removeChild(this.valueElement);
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
    }
}
class Menu {
    constructor(main) {
        this.main = main;
    }
    initializeMenu() {
        this.mainMenuContainer = document.getElementById("main-menu");
        let mainTitle = SpacePanel.CreateSpacePanel();
        mainTitle.addTitle1("MARS AT WAR");
        mainTitle.classList.add("menu-title-panel");
        let mainPlay = SpacePanel.CreateSpacePanel();
        mainPlay.addTitle2("PLAY");
        mainPlay.classList.add("menu-element-panel");
        mainPlay.onpointerup = () => {
            this.showPlayMenu();
        };
        let mainOption = SpacePanel.CreateSpacePanel();
        mainOption.addTitle2("OPTIONS");
        mainOption.classList.add("menu-element-panel");
        let mainCredit = SpacePanel.CreateSpacePanel();
        mainCredit.addTitle2("CREDITS");
        mainCredit.classList.add("menu-element-panel");
        this.mainMenuContainer.appendChild(mainTitle);
        this.mainMenuContainer.appendChild(mainPlay);
        this.mainMenuContainer.appendChild(mainOption);
        this.mainMenuContainer.appendChild(mainCredit);
        this.playMenuContainer = document.getElementById("play-menu");
        let playTitle = SpacePanel.CreateSpacePanel();
        playTitle.addTitle1("MARS AT WAR");
        playTitle.classList.add("menu-title-panel");
        let playTest = SpacePanel.CreateSpacePanel();
        playTest.addTitle2("TEST");
        playTest.classList.add("menu-element-panel");
        playTest.onpointerup = () => {
            this.main.generateScene();
            this.showIngameMenu();
        };
        let playBack = SpacePanel.CreateSpacePanel();
        playBack.addTitle2("BACK");
        playBack.classList.add("menu-element-panel");
        playBack.onpointerup = () => {
            this.showMainMenu();
        };
        this.playMenuContainer.appendChild(playTitle);
        this.playMenuContainer.appendChild(playTest);
        this.playMenuContainer.appendChild(playBack);
        this.buildingMenuContainer = document.getElementById("building-menu");
        let buildingMenu = SpacePanel.CreateSpacePanel();
        buildingMenu.classList.add("building-menu");
        /*
        buildingShowMenu.addTitle2("MENU");
        buildingShowMenu.onpointerup = () => {
            this.showPauseMenu();
        }
        */
        let buildingButtons = buildingMenu.addSquareButtons(["TOWER", "WALL"], [
            () => { this.main.playerAction.addTurret(buildingButtons[0]); },
            () => { this.main.playerAction.addWall(buildingButtons[1]); }
        ]);
        buildingButtons[0].style.backgroundImage = "url(assets/icons/tower.png)";
        buildingButtons[1].style.backgroundImage = "url(assets/icons/wall.png)";
        this.buildingMenuContainer.appendChild(buildingMenu);
        this.ingameMenuContainer = document.getElementById("ingame-menu");
        let ingameMenu = SpacePanel.CreateSpacePanel();
        ingameMenu.classList.add("ingame-menu");
        /*
        ingameShowMenu.addTitle2("MENU");
        ingameShowMenu.onpointerup = () => {
            this.showPauseMenu();
        }
        */
        ingameMenu.addLargeButton("MENU", () => {
            this.showPauseMenu();
        });
        ingameMenu.addTitle3("740");
        this.ingameMenuContainer.appendChild(ingameMenu);
        this.pauseMenuContainer = document.getElementById("pause-menu");
        let pauseResume = SpacePanel.CreateSpacePanel();
        pauseResume.addTitle2("RESUME GAME");
        pauseResume.classList.add("menu-element-panel");
        pauseResume.onpointerup = () => {
            this.showIngameMenu();
        };
        let pauseExit = SpacePanel.CreateSpacePanel();
        pauseExit.addTitle2("EXIT");
        pauseExit.classList.add("menu-element-panel");
        pauseExit.onpointerup = () => {
            this.main.disposeScene();
            this.showMainMenu();
        };
        this.pauseMenuContainer.appendChild(pauseResume);
        this.pauseMenuContainer.appendChild(pauseExit);
        this.debugContainer = document.getElementById("debug-menu");
        let debugPanel = SpacePanel.CreateSpacePanel();
        debugPanel.addTitle2("DEBUG");
        debugPanel.classList.add("debug-panel");
        debugPanel.onpointerup = () => {
            this.showIngameMenu();
        };
        debugPanel.addTitle3("X : Y").id = "debug-pointer-xy";
        this.showMainMenu();
    }
    showMainMenu() {
        this.mainMenuContainer.style.display = "block";
        this.playMenuContainer.style.display = "none";
        this.buildingMenuContainer.style.display = "none";
        this.ingameMenuContainer.style.display = "none";
        this.pauseMenuContainer.style.display = "none";
    }
    showPlayMenu() {
        this.mainMenuContainer.style.display = "none";
        this.playMenuContainer.style.display = "block";
        this.buildingMenuContainer.style.display = "none";
        this.ingameMenuContainer.style.display = "none";
        this.pauseMenuContainer.style.display = "none";
    }
    showIngameMenu() {
        this.mainMenuContainer.style.display = "none";
        this.playMenuContainer.style.display = "none";
        this.buildingMenuContainer.style.display = "block";
        this.ingameMenuContainer.style.display = "block";
        this.pauseMenuContainer.style.display = "none";
    }
    showPauseMenu() {
        this.mainMenuContainer.style.display = "none";
        this.playMenuContainer.style.display = "none";
        this.pauseMenuContainer.style.display = "block";
    }
}
class SpacePanel extends HTMLElement {
    constructor() {
        super();
        this._initialized = false;
        this._htmlLines = [];
        this._isVisible = true;
        this._update = () => {
            if (!this._target) {
                return;
            }
            /*
            let dView = this._target.position.subtract(Main.Camera.position);
            let n = BABYLON.Vector3.Cross(dView, new BABYLON.Vector3(0, 1, 0));
            n.normalize();
            n.scaleInPlace(- this._target.groundWidth * 0.5);
            let p0 = this._target.position;
            let p1 = this._target.position.add(n);
            let p2 = p1.clone();
            p2.y += this._target.groundWidth * 0.5 + this._target.height;
            let screenPos = BABYLON.Vector3.Project(
                p2,
                BABYLON.Matrix.Identity(),
                this._target.getScene().getTransformMatrix(),
                Main.Camera.viewport.toGlobal(1, 1)
            );
            this.style.left = (screenPos.x * Main.Canvas.width - this.clientWidth * 0.5) + "px";
            this.style.bottom = ((1 - screenPos.y) * Main.Canvas.height) + "px";
            this._line.setVerticesData(
                BABYLON.VertexBuffer.PositionKind,
                [...p0.asArray(), ...p2.asArray()]
            );
            */
        };
    }
    static CreateSpacePanel() {
        let panel = document.createElement("space-panel");
        document.body.appendChild(panel);
        return panel;
    }
    connectedCallback() {
        if (this._initialized) {
            return;
        }
        this._innerBorder = document.createElement("div");
        this._innerBorder.classList.add("space-panel-inner-border");
        this.appendChild(this._innerBorder);
        /*
        this._toggleVisibilityInput = document.createElement("button");
        this._toggleVisibilityInput.classList.add("space-panel-toggle-visibility");
        this._toggleVisibilityInput.textContent = "^";
        this._toggleVisibilityInput.addEventListener("click", () => {
            if (this._isVisible) {
                this.hide();
            }
            else {
                this.show();
            }
        });
        this._innerBorder.appendChild(this._toggleVisibilityInput);
        */
        this._initialized = true;
    }
    dispose() {
        if (this._target) {
            this._target.getScene().onBeforeRenderObservable.removeCallback(this._update);
        }
        if (this._line) {
            this._line.dispose();
        }
        document.body.removeChild(this);
    }
    show() {
        this._toggleVisibilityInput.textContent = "^";
        this._isVisible = true;
        console.log("SHOW");
        this._htmlLines.forEach((l) => {
            l.style.display = "block";
        });
    }
    hide() {
        this._toggleVisibilityInput.textContent = "v";
        this._isVisible = false;
        console.log("HIDE");
        this._htmlLines.forEach((l) => {
            l.style.display = "none";
        });
    }
    setTarget(mesh) {
        this.style.position = "fixed";
        this._target = mesh;
        this._line = BABYLON.MeshBuilder.CreateLines("line", {
            points: [
                BABYLON.Vector3.Zero(),
                BABYLON.Vector3.Zero()
            ],
            updatable: true,
            colors: [
                new BABYLON.Color4(0, 1, 0, 1),
                new BABYLON.Color4(0, 1, 0, 1)
            ]
        }, this._target.getScene());
        this._line.renderingGroupId = 1;
        this._line.layerMask = 0x10000000;
        this._target.getScene().onBeforeRenderObservable.add(this._update);
    }
    addTitle1(title) {
        let titleLine = document.createElement("div");
        titleLine.classList.add("space-title-1-line");
        let e = document.createElement("h1");
        e.classList.add("space-title-1");
        e.textContent = title;
        titleLine.appendChild(e);
        let eShadow = document.createElement("span");
        eShadow.classList.add("space-title-1-shadow");
        eShadow.textContent = title;
        titleLine.appendChild(eShadow);
        this._innerBorder.appendChild(titleLine);
    }
    addTitle2(title) {
        let titleLine = document.createElement("div");
        titleLine.classList.add("space-title-2-line");
        let e = document.createElement("h2");
        e.classList.add("space-title-2");
        e.textContent = title;
        titleLine.appendChild(e);
        let eShadow = document.createElement("span");
        eShadow.classList.add("space-title-2-shadow");
        eShadow.textContent = title;
        titleLine.appendChild(eShadow);
        this._innerBorder.appendChild(titleLine);
    }
    addTitle3(title) {
        let e = document.createElement("h3");
        e.classList.add("space-title-3");
        e.textContent = title;
        this._innerBorder.appendChild(e);
        this._htmlLines.push(e);
        return e;
    }
    addNumberInput(label, value, onInputCallback, precision = 1) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-input", "space-input-number");
        inputElement.setAttribute("type", "number");
        inputElement.value = value.toFixed(precision);
        let step = 1 / (Math.pow(2, Math.round(precision)));
        inputElement.setAttribute("step", step.toString());
        inputElement.addEventListener("input", (ev) => {
            if (ev.srcElement instanceof HTMLInputElement) {
                let v = parseFloat(ev.srcElement.value);
                if (isFinite(v)) {
                    if (onInputCallback) {
                        onInputCallback(v);
                    }
                }
            }
        });
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputElement;
    }
    addTextInput(label, text, onInputCallback) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-input", "space-input-text");
        inputElement.setAttribute("type", "text");
        inputElement.value = text;
        inputElement.addEventListener("input", (ev) => {
            if (ev.srcElement instanceof HTMLInputElement) {
                if (onInputCallback) {
                    onInputCallback(ev.srcElement.value);
                }
            }
        });
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputElement;
    }
    addSquareButtons(values, onClickCallbacks) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let inputs = [];
        for (let i = 0; i < values.length; i++) {
            let inputElement1 = document.createElement("input");
            inputElement1.classList.add("space-button-square");
            inputElement1.setAttribute("type", "button");
            inputElement1.value = values[i];
            let callback = onClickCallbacks[i];
            inputElement1.addEventListener("pointerup", () => {
                if (callback) {
                    callback();
                }
            });
            lineElement.appendChild(inputElement1);
            inputs.push(inputElement1);
        }
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputs;
    }
    addLargeButton(value, onClickCallback) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-button-lg");
        inputElement.setAttribute("type", "button");
        inputElement.value = value;
        inputElement.addEventListener("click", () => {
            onClickCallback();
        });
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputElement;
    }
    addConditionalButton(label, value, onClickCallback) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-button-inline");
        inputElement.setAttribute("type", "button");
        inputElement.value = value();
        inputElement.addEventListener("click", () => {
            onClickCallback();
            inputElement.value = value();
        });
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputElement;
    }
    addMediumButtons(value1, onClickCallback1, value2, onClickCallback2) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let inputElement1 = document.createElement("input");
        inputElement1.classList.add("space-button");
        inputElement1.setAttribute("type", "button");
        inputElement1.value = value1;
        inputElement1.addEventListener("click", () => {
            onClickCallback1();
        });
        lineElement.appendChild(inputElement1);
        let inputs = [inputElement1];
        if (value2 && onClickCallback2) {
            let inputElement2 = document.createElement("input");
            inputElement2.classList.add("space-button");
            inputElement2.setAttribute("type", "button");
            inputElement2.value = value2;
            inputElement2.addEventListener("click", () => {
                onClickCallback2();
            });
            lineElement.appendChild(inputElement2);
            inputs.push(inputElement2);
        }
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputs;
    }
    addCheckBox(label, value, onToggleCallback) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-input", "space-input-toggle");
        inputElement.setAttribute("type", "checkbox");
        inputElement.addEventListener("input", (ev) => {
            if (ev.srcElement instanceof HTMLInputElement) {
                onToggleCallback(ev.srcElement.checked);
            }
        });
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        this._htmlLines.push(lineElement);
        return inputElement;
    }
}
window.customElements.define("space-panel", SpacePanel);
class SpacePanelLabel extends HTMLElement {
    constructor() {
        super();
    }
}
window.customElements.define("space-panel-label", SpacePanelLabel);
class PlayerAction {
    constructor(main) {
        this.main = main;
        this._updateAddingTurret = () => {
            if (this._selectedTurret) {
                let world = this.main.getPointerWorldPos();
                this._selectedTurret.base.posX = world.x;
                this._selectedTurret.base.position.y = world.y;
            }
        };
        this._pointerUpAddingTurret = (eventData) => {
            if (this._selectedTurret) {
                if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                    let newTurret = this._selectedTurret;
                    this._selectedTurret = undefined;
                    this.main.scene.onBeforeRenderObservable.removeCallback(this._updateAddingTurret);
                    this.main.scene.onPointerObservable.removeCallback(this._pointerUpAddingTurret);
                    this._currentActionButton.classList.remove("selected");
                    new LoadingPlane(newTurret.base.pos2D, 10, () => {
                        newTurret.isReady = true;
                        newTurret.setDarkness(1);
                    }, this.main);
                }
            }
        };
        this._updateAddingWall = () => {
            if (this._selectedWallNode1 && !this._selectedWallNode2) {
                let world = this.main.getPointerWorldPos();
                this._selectedWallNode1.sprite.posX = world.x;
                this._selectedWallNode1.sprite.position.y = world.y;
            }
            else if (this._selectedWallNode1 && this._selectedWallNode2 && this._selectedWall) {
                let world = this.main.getPointerWorldPos();
                if (this._selectedWallNode2.sprite.pos2D.x != world.x || this._selectedWallNode2.sprite.pos2D.y != world.y) {
                    this._selectedWallNode2.sprite.posX = world.x;
                    this._selectedWallNode2.sprite.position.y = world.y;
                    this._selectedWall.refreshMesh();
                }
            }
        };
        this._pointerUpAddingWall = (eventData) => {
            if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                if (this._selectedWallNode1 && !this._selectedWallNode2) {
                    let world = this.main.getPointerWorldPos();
                    let existingWallNode = this.main.gameObjects.find(g => {
                        if (g instanceof WallNode) {
                            if (g != this._selectedWallNode1) {
                                if (BABYLON.Vector2.DistanceSquared(world, g.sprite.pos2D) < 1.5 * 1.5) {
                                    return true;
                                }
                            }
                        }
                    });
                    if (existingWallNode) {
                        this._selectedWallNode1.dispose();
                        this._selectedWallNode1 = existingWallNode;
                    }
                    else {
                        this._selectedWallNode1.sprite.posX = world.x;
                        this._selectedWallNode1.sprite.position.y = world.y;
                    }
                    this._selectedWallNode2 = new WallNode(this.main);
                    this._selectedWallNode2.isReady = false;
                    this._selectedWallNode2.setDarkness(0.5);
                    this._selectedWall = new Wall(this._selectedWallNode1, this._selectedWallNode2, this.main);
                    this._selectedWall.setDarkness(0.5);
                }
                else if (this._selectedWallNode1 && this._selectedWallNode2) {
                    let world = this.main.getPointerWorldPos();
                    let existingWallNode = this.main.gameObjects.find(g => {
                        if (g instanceof WallNode) {
                            if (g != this._selectedWallNode1 && g != this._selectedWallNode2) {
                                if (BABYLON.Vector2.DistanceSquared(world, g.sprite.pos2D) < 1.5 * 1.5) {
                                    return true;
                                }
                            }
                        }
                    });
                    if (existingWallNode) {
                        this._selectedWallNode2.dispose();
                        this._selectedWallNode2 = existingWallNode;
                    }
                    else {
                        this._selectedWallNode2.sprite.posX = world.x;
                        this._selectedWallNode2.sprite.position.y = world.y;
                    }
                    this._selectedWall.node2 = this._selectedWallNode2;
                    let newWall = this._selectedWall;
                    let newNode1 = this._selectedWallNode1;
                    let newNode2 = this._selectedWallNode2;
                    new LoadingPlane(newNode1.sprite.pos2D.add(newNode2.sprite.pos2D).scale(0.5), 5, () => {
                        newWall.setDarkness(1);
                        newNode1.isReady = true;
                        newNode1.setDarkness(1);
                        newNode2.isReady = true;
                        newNode2.setDarkness(1);
                    }, this.main);
                    this._selectedWallNode1 = undefined;
                    this._selectedWallNode2 = undefined;
                    this._selectedWall = undefined;
                    this.main.scene.onBeforeRenderObservable.removeCallback(this._updateAddingWall);
                    this.main.scene.onPointerObservable.removeCallback(this._pointerUpAddingWall);
                    this._currentActionButton.classList.remove("selected");
                }
            }
        };
    }
    addTurret(actionButton) {
        if (this._selectedTurret) {
            return;
        }
        this._currentActionButton = actionButton;
        this._currentActionButton.classList.add("selected");
        this._selectedTurret = new Turret(this.main);
        this._selectedTurret.isReady = false;
        this._selectedTurret.setDarkness(0.5);
        this.main.scene.onBeforeRenderObservable.add(this._updateAddingTurret);
        this.main.scene.onPointerObservable.add(this._pointerUpAddingTurret);
    }
    addWall(actionButton) {
        if (this._selectedWallNode1 || this._selectedWallNode2) {
            return;
        }
        this._currentActionButton = actionButton;
        this._currentActionButton.classList.add("selected");
        this._selectedWallNode1 = new WallNode(this.main);
        this._selectedWallNode1.isReady = false;
        this._selectedWallNode1.setDarkness(0.5);
        this.main.scene.onBeforeRenderObservable.add(this._updateAddingWall);
        this.main.scene.onPointerObservable.add(this._pointerUpAddingWall);
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
class SpriteUtils {
    static MakeShadow(sprite, w, h) {
        let shadowSprite = BABYLON.MeshBuilder.CreatePlane(sprite.name + "-shadow", { width: w, height: h }, sprite.getScene());
        shadowSprite.position.z = 1;
        let shadowSpriteMaterial = new BABYLON.StandardMaterial(sprite.material.name + "-shadow", sprite.getScene());
        let spriteMaterial = sprite.material;
        shadowSpriteMaterial.diffuseTexture = spriteMaterial.diffuseTexture;
        shadowSpriteMaterial.diffuseColor.copyFromFloats(0, 0, 0);
        shadowSpriteMaterial.diffuseTexture.hasAlpha = true;
        shadowSpriteMaterial.specularColor.copyFromFloats(0, 0, 0);
        shadowSpriteMaterial.alphaCutOff = 0.1;
        shadowSprite.material = shadowSpriteMaterial;
        return shadowSprite;
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
