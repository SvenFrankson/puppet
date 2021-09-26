class BabylonPlus {
    static CreateInstanceDeep(target) {
        let instance;
        if (target.geometry) {
            instance = target.createInstance(target.name + "-instance");
        }
        else {
            instance = new BABYLON.Mesh(target.name + "-instance");
        }
        let children = target.getChildMeshes();
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (child instanceof BABYLON.Mesh) {
                let childInstance = child.createInstance(child.name + "-instance");
                childInstance.parent = instance;
            }
        }
        return instance;
    }
}
class UniqueList {
    constructor() {
        this._elements = [];
    }
    length() {
        return this._elements.length;
    }
    get(i) {
        return this._elements[i];
    }
    getLast() {
        return this.get(this.length() - 1);
    }
    push(e) {
        if (this._elements.indexOf(e) === -1) {
            this._elements.push(e);
        }
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
}
class Character {
    constructor() {
        this.basePower = 10;
        this.baseSmoothness = 10;
        this.baseResilience = 10;
        this.baseConnectivity = 10;
        this.baseIntelligence = 10;
        this.baseExpertise = 10;
    }
    get currentPower() {
        return this.basePower;
    }
    get currentSmoothness() {
        return this.baseSmoothness;
    }
    get currentResilience() {
        return this.baseResilience;
    }
    get currentConnectivity() {
        return this.baseConnectivity;
    }
    get currentIntelligence() {
        return this.baseIntelligence;
    }
    get currentExpertise() {
        return this.baseExpertise;
    }
}
class Target extends BABYLON.Mesh {
    constructor(crawler) {
        super("target");
        this.crawler = crawler;
        this.targets = [];
        let a1 = 45 * Math.PI / 180;
        let cosA1 = Math.cos(a1);
        let sinA1 = Math.sin(a1);
        let a2 = 15 * Math.PI / 180;
        let cosA2 = Math.cos(a2);
        let sinA2 = Math.sin(a2);
        let positions = [
            new BABYLON.Vector3(-5 * cosA1, 0, 5 * sinA1),
            new BABYLON.Vector3(-5 * cosA2, 0, 5 * sinA2),
            new BABYLON.Vector3(-5 * cosA2, 0, -5 * sinA2),
            new BABYLON.Vector3(-5 * cosA1, 0, -5 * sinA1),
            new BABYLON.Vector3(5 * cosA1, 0, -5 * sinA1),
            new BABYLON.Vector3(5 * cosA2, 0, -5 * sinA2),
            new BABYLON.Vector3(5 * cosA2, 0, 5 * sinA2),
            new BABYLON.Vector3(5 * cosA1, 0, 5 * sinA1),
        ];
        for (let i = 0; i < crawler.legCount; i++) {
            //let target = new BABYLON.Mesh("target-" + i);
            let target = BABYLON.MeshBuilder.CreateBox("target-" + i, { size: 0.05 });
            target.material = Main.redMaterial;
            target.position.copyFrom(positions[i]);
            target.parent = this;
            this.targets[i] = target;
        }
    }
}
class Crawler {
    constructor() {
        this.legCount = 8;
        this.feet = [];
        this.legs = [];
        this.lowerLegs = [];
        this.hipJoints = [];
        this._inputDirs = new UniqueList();
        this._movingLegCount = 0;
        this._movingLegs = new UniqueList();
        this._update = () => {
            if (this._inputDirs.contains(0)) {
                this.target.position.addInPlace(this.target.right.scale(5 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(1)) {
                this.target.position.subtractInPlace(this.target.forward.scale(5 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(2)) {
                this.target.position.subtractInPlace(this.target.right.scale(5 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(3)) {
                this.target.position.addInPlace(this.target.forward.scale(5 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(4)) {
                this.target.rotation.y -= 0.5 * Math.PI * Main.Engine.getDeltaTime() / 1000;
            }
            if (this._inputDirs.contains(5)) {
                this.target.rotation.y += 0.5 * Math.PI * Main.Engine.getDeltaTime() / 1000;
            }
            this.body.position.copyFrom(this.feet[0].position);
            for (let i = 1; i < this.legCount; i++) {
                this.body.position.addInPlace(this.feet[i].position);
            }
            this.body.position.scaleInPlace(1 / this.legCount);
            this.body.position.y += 1.5;
            let left = BABYLON.Vector3.Zero();
            for (let i = 0; i < 4; i++) {
                left.addInPlace(this.feet[i].absolutePosition);
            }
            left.scaleInPlace(0.25);
            let right = BABYLON.Vector3.Zero();
            for (let i = 4; i < 8; i++) {
                right.addInPlace(this.feet[i].absolutePosition);
            }
            right.scaleInPlace(0.25);
            let rightDir = right.subtract(left).normalize();
            let forward = BABYLON.Vector3.Cross(rightDir, BABYLON.Axis.Y);
            this.body.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(rightDir, BABYLON.Axis.Y, forward);
            for (let i = 0; i < this.legCount; i++) {
                let knee = this.hipJoints[i].absolutePosition.add(this.feet[i].absolutePosition).scale(0.5);
                knee.y += 1;
                for (let j = 0; j < 3; j++) {
                    let legN = knee.subtract(this.hipJoints[i].absolutePosition).normalize();
                    knee = this.hipJoints[i].absolutePosition.add(legN.scale(3));
                    let lowerLegN = knee.subtract(this.feet[i].absolutePosition).normalize();
                    knee = this.feet[i].absolutePosition.add(lowerLegN.scale(3));
                }
                this.legs[i].position = this.hipJoints[i].absolutePosition;
                this.legs[i].lookAt(knee);
                this.lowerLegs[i].position = knee;
                this.lowerLegs[i].lookAt(this.feet[i].absolutePosition);
            }
            if (this._movingLegCount < 0.5) {
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
                    this._moveLeg(index, this.target.targets[index].absolutePosition);
                }
            }
        };
        this.target = new Target(this);
        this.body = BABYLON.MeshBuilder.CreateSphere("body", { diameterX: 1, diameterY: 0.5, diameterZ: 1 }, Main.Scene);
        this.cameraTarget = new BABYLON.Mesh("camera-target");
        this.cameraTarget.parent = this.body;
        this.cameraTarget.position.copyFromFloats(5, 25, -25);
        this.cameraTarget.rotation.x = Math.PI / 4;
        let a1 = 30 * Math.PI / 180;
        let cosA1 = Math.cos(a1);
        let sinA1 = Math.sin(a1);
        let a2 = 10 * Math.PI / 180;
        let cosA2 = Math.cos(a2);
        let sinA2 = Math.sin(a2);
        let positions = [
            new BABYLON.Vector3(-1 * cosA1, 0, 1 * sinA1),
            new BABYLON.Vector3(-1 * cosA2, 0, 1 * sinA2),
            new BABYLON.Vector3(-1 * cosA2, 0, -1 * sinA2),
            new BABYLON.Vector3(-1 * cosA1, 0, -1 * sinA1),
            new BABYLON.Vector3(1 * cosA1, 0, -1 * sinA1),
            new BABYLON.Vector3(1 * cosA2, 0, -1 * sinA2),
            new BABYLON.Vector3(1 * cosA2, 0, 1 * sinA2),
            new BABYLON.Vector3(1 * cosA1, 0, 1 * sinA1),
        ];
        for (let i = 0; i < this.legCount; i++) {
            let hipJoint = BABYLON.MeshBuilder.CreateBox("hipJoint-" + i, { size: 0.1 });
            hipJoint.material = Main.greenMaterial;
            hipJoint.position.copyFrom(positions[i]);
            hipJoint.parent = this.body;
            this.hipJoints[i] = hipJoint;
        }
        for (let i = 0; i < this.legCount; i++) {
            let foot = BABYLON.MeshBuilder.CreateBox("target-" + i, { size: 0.05 });
            foot.material = Main.blueMaterial;
            foot.position.copyFrom(this.target.targets[i].absolutePosition);
            this.feet[i] = foot;
        }
        for (let i = 0; i < this.legCount; i++) {
            let leg = new BABYLON.Mesh("leg-" + i);
            this.legs[i] = leg;
            let lowerLeg = new BABYLON.Mesh("lower-leg-" + i);
            this.lowerLegs[i] = lowerLeg;
        }
        BABYLON.SceneLoader.ImportMesh("", "assets/models/crawler.babylon", "", Main.Scene, (meshes) => {
            let body = meshes.find(m => { return m.name === "body"; });
            let leg = meshes.find(m => { return m.name === "leg"; });
            let lowerLeg = meshes.find(m => { return m.name === "lower-leg"; });
            if (body && leg && lowerLeg) {
                let bodyMesh = BABYLON.VertexData.ExtractFromMesh(body);
                bodyMesh.applyToMesh(this.body);
                let legMesh = BABYLON.VertexData.ExtractFromMesh(leg);
                let lowerLegMesh = BABYLON.VertexData.ExtractFromMesh(lowerLeg);
                for (let i = 0; i < this.legCount; i++) {
                    legMesh.applyToMesh(this.legs[i]);
                    lowerLegMesh.applyToMesh(this.lowerLegs[i]);
                }
                body.dispose();
                leg.dispose();
                lowerLeg.dispose();
            }
        });
        Main.Scene.onBeforeRenderObservable.add(this._update);
        Main.Canvas.addEventListener("keydown", (e) => {
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
        Main.Canvas.addEventListener("keyup", (e) => {
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
    async _moveLeg(legIndex, target) {
        return new Promise(resolve => {
            this._movingLegs.push(legIndex);
            let origin = this.feet[legIndex].position.clone();
            let i = 0;
            let count = 10;
            let step = () => {
                i++;
                this._movingLegCount -= 1 / count;
                this.feet[legIndex].position.copyFrom(origin.scale(1 - i / count).add(target.scale(i / count)));
                this.feet[legIndex].position.y = 0.25 * Math.sin(Math.PI * i / count);
                if (i < count) {
                    requestAnimationFrame(step);
                }
                else {
                    this._movingLegs.remove(legIndex);
                    resolve();
                }
            };
            step();
        });
    }
}
class CrawlerCamera extends BABYLON.FreeCamera {
    constructor() {
        super("crawler-camera", BABYLON.Vector3.Zero(), Main.Scene);
        this._update = () => {
            this.position.scaleInPlace(0.95).addInPlace(this.crawler.cameraTarget.absolutePosition.scale(0.05));
            let targetQuaternion = BABYLON.Quaternion.FromEulerVector(this.crawler.target.rotation).multiplyInPlace(BABYLON.Quaternion.RotationAxis(BABYLON.Axis.X, Math.PI / 4));
            BABYLON.Quaternion.SlerpToRef(this.rotationQuaternion, targetQuaternion, 0.05, this.rotationQuaternion);
        };
        this.rotationQuaternion = BABYLON.Quaternion.Identity();
    }
    attach(crawler) {
        this.crawler = crawler;
        Main.Scene.onBeforeRenderObservable.add(this._update);
    }
}
class HumanTarget extends BABYLON.Mesh {
    constructor(human) {
        super("target");
        this.human = human;
        this.targets = [];
        let positions = [
            new BABYLON.Vector3(-1, 0, 0),
            new BABYLON.Vector3(1, 0, 0)
        ];
        for (let i = 0; i < human.legCount; i++) {
            //let target = new BABYLON.Mesh("target-" + i);
            let target = BABYLON.MeshBuilder.CreateBox("target-" + i, { size: 0.05 });
            target.material = Main.redMaterial;
            target.position.copyFrom(positions[i]);
            target.parent = this;
            this.targets[i] = target;
        }
    }
}
class Human {
    constructor() {
        this.legCount = 2;
        this.legs = [];
        this.lowerLegs = [];
        this.feet = [];
        this.hipJoints = [];
        this.bodyVelocity = BABYLON.Vector3.Zero();
        this._inputDirs = new UniqueList();
        this._movingLegCount = 0;
        this._movingLegs = new UniqueList();
        this._update = () => {
            let dt = Main.Engine.getDeltaTime() / 1000;
            if (this._inputDirs.contains(0)) {
                this.target.position.addInPlace(this.target.right.scale(3 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(1)) {
                this.target.position.subtractInPlace(this.target.forward.scale(2 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(2)) {
                this.target.position.subtractInPlace(this.target.right.scale(3 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(3)) {
                this.target.position.addInPlace(this.target.forward.scale(5 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(4)) {
                this.target.rotation.y -= 0.5 * Math.PI * Main.Engine.getDeltaTime() / 1000;
            }
            if (this._inputDirs.contains(5)) {
                this.target.rotation.y += 0.5 * Math.PI * Main.Engine.getDeltaTime() / 1000;
            }
            let bodyTargetPosition = this.target.position.clone();
            bodyTargetPosition.y += 4;
            bodyTargetPosition = VMath.SetABDistance(this.feet[0].position, bodyTargetPosition, 4);
            bodyTargetPosition = VMath.SetABDistance(this.feet[1].position, bodyTargetPosition, 4);
            let f = bodyTargetPosition.subtract(this.body.position);
            this.bodyVelocity.addInPlace(f.scale(10 * dt));
            this.bodyVelocity.scaleInPlace(0.95);
            this.body.position.addInPlace(this.bodyVelocity.scale(dt));
            let left = BABYLON.Vector3.Zero();
            for (let i = 0; i < 1; i++) {
                left.addInPlace(this.feet[i].absolutePosition);
            }
            let right = BABYLON.Vector3.Zero();
            for (let i = 1; i < 2; i++) {
                right.addInPlace(this.feet[i].absolutePosition);
            }
            let rightDir = right.subtract(left).normalize();
            let forward = BABYLON.Vector3.Cross(rightDir, BABYLON.Axis.Y);
            this.body.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(rightDir, BABYLON.Axis.Y, forward);
            let q = BABYLON.Quaternion.FromEulerVector(this.target.rotation);
            this.body.rotationQuaternion = BABYLON.Quaternion.Slerp(this.body.rotationQuaternion, q, 0.75);
            this.feet[0].rotationQuaternion = this.body.rotationQuaternion;
            this.feet[1].rotationQuaternion = this.body.rotationQuaternion;
            for (let i = 0; i < this.legCount; i++) {
                let knee = this.hipJoints[i].absolutePosition.add(this.feet[i].absolutePosition).scale(0.5);
                let targetForward = this.target.forward;
                knee.addInPlace(targetForward.scale(1));
                for (let j = 0; j < 3; j++) {
                    let legN = knee.subtract(this.hipJoints[i].absolutePosition).normalize();
                    knee = this.hipJoints[i].absolutePosition.add(legN.scale(2));
                    let lowerLegN = knee.subtract(this.feet[i].absolutePosition).normalize();
                    knee = this.feet[i].absolutePosition.add(lowerLegN.scale(2));
                }
                this.legs[i].position = this.hipJoints[i].absolutePosition;
                this.legs[i].lookAt(knee);
                this.lowerLegs[i].position = knee;
                this.lowerLegs[i].lookAt(this.feet[i].absolutePosition);
            }
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
                    this._moveLeg(index, this.target.targets[index].absolutePosition);
                }
            }
        };
        this.target = new HumanTarget(this);
        this.body = BABYLON.MeshBuilder.CreateSphere("body", { diameterX: 1, diameterY: 0.5, diameterZ: 1 }, Main.Scene);
        this.cameraTarget = new BABYLON.Mesh("camera-target");
        this.cameraTarget.parent = this.body;
        this.cameraTarget.position.copyFromFloats(0, 20, -20);
        this.cameraTarget.rotation.x = Math.PI / 4;
        let positions = [
            new BABYLON.Vector3(-1, 0, 0),
            new BABYLON.Vector3(1, 0, 0)
        ];
        for (let i = 0; i < this.legCount; i++) {
            let hipJoint = BABYLON.MeshBuilder.CreateBox("hipJoint-" + i, { size: 0.1 });
            hipJoint.material = Main.greenMaterial;
            hipJoint.position.copyFrom(positions[i]);
            hipJoint.parent = this.body;
            this.hipJoints[i] = hipJoint;
        }
        for (let i = 0; i < this.legCount; i++) {
            let foot = new BABYLON.Mesh("foot-" + i);
            foot.material = Main.blueMaterial;
            foot.position.copyFrom(this.target.targets[i].absolutePosition);
            this.feet[i] = foot;
        }
        for (let i = 0; i < this.legCount; i++) {
            let leg = new BABYLON.Mesh("leg-" + i);
            this.legs[i] = leg;
            let lowerLeg = new BABYLON.Mesh("lower-leg-" + i);
            this.lowerLegs[i] = lowerLeg;
            let foot = new BABYLON.Mesh("foot-" + i);
            this.feet[i] = foot;
        }
        BABYLON.SceneLoader.ImportMesh("", "assets/models/peon.babylon", "", Main.Scene, (meshes) => {
            let body = meshes.find(m => { return m.name === "body"; });
            let leg = meshes.find(m => { return m.name === "leg"; });
            let lowerLeg = meshes.find(m => { return m.name === "lower-leg"; });
            let foot = meshes.find(m => { return m.name === "foot"; });
            if (body && leg && lowerLeg && foot) {
                let bodyMesh = BABYLON.VertexData.ExtractFromMesh(body);
                bodyMesh.applyToMesh(this.body);
                let legMesh = BABYLON.VertexData.ExtractFromMesh(leg);
                let lowerLegMesh = BABYLON.VertexData.ExtractFromMesh(lowerLeg);
                let footMesh = BABYLON.VertexData.ExtractFromMesh(foot);
                for (let i = 0; i < this.legCount; i++) {
                    legMesh.applyToMesh(this.legs[i]);
                    lowerLegMesh.applyToMesh(this.lowerLegs[i]);
                    footMesh.applyToMesh(this.feet[i]);
                }
                body.dispose();
                leg.dispose();
                lowerLeg.dispose();
                foot.dispose();
            }
        });
        Main.Scene.onBeforeRenderObservable.add(this._update);
        Main.Canvas.addEventListener("keydown", (e) => {
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
        Main.Canvas.addEventListener("keyup", (e) => {
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
    async _moveLeg(legIndex, target) {
        return new Promise(resolve => {
            this._movingLegs.push(legIndex);
            let origin = this.feet[legIndex].position.clone();
            let l = target.subtract(origin).length();
            let duration = Math.floor(l / 3);
            duration *= 0.5;
            duration += 0.5;
            let t = 0;
            let step = () => {
                t += Main.Engine.getDeltaTime() / 1000;
                let d = t / duration;
                d = d * d;
                d = Math.min(d, 1);
                this.feet[legIndex].position.copyFrom(origin.scale(1 - d).add(target.scale(d)));
                this.feet[legIndex].position.y += 1.5 * Math.sin(Math.PI * d);
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
/// <reference path="../../lib/babylon.d.ts"/>
/// <reference path="../../lib/babylon.gui.d.ts"/>
var COS30 = Math.cos(Math.PI / 6);
class Main {
    constructor(canvasElement) {
        Main.Canvas = document.getElementById(canvasElement);
        Main.Engine = new BABYLON.Engine(Main.Canvas, true, { preserveDrawingBuffer: true, stencil: true });
    }
    static get CameraPosition() {
        if (!Main._CameraPosition) {
            Main._CameraPosition = BABYLON.Vector2.Zero();
        }
        return Main._CameraPosition;
    }
    static set CameraPosition(p) {
        Main._CameraPosition = p;
    }
    static get redMaterial() {
        if (!Main._redMaterial) {
            Main._redMaterial = new BABYLON.StandardMaterial("red-material", Main.Scene);
            Main._redMaterial.diffuseColor.copyFromFloats(0.9, 0.1, 0.1);
        }
        return Main._redMaterial;
    }
    static get greenMaterial() {
        if (!Main._greenMaterial) {
            Main._greenMaterial = new BABYLON.StandardMaterial("green-material", Main.Scene);
            Main._greenMaterial.diffuseColor.copyFromFloats(0.1, 0.9, 0.1);
        }
        return Main._greenMaterial;
    }
    static get blueMaterial() {
        if (!Main._blueMaterial) {
            Main._blueMaterial = new BABYLON.StandardMaterial("blue-material", Main.Scene);
            Main._blueMaterial.diffuseColor.copyFromFloats(0.1, 0.1, 0.9);
        }
        return Main._blueMaterial;
    }
    static get whiteMaterial() {
        if (!Main._whiteMaterial) {
            Main._whiteMaterial = new BABYLON.StandardMaterial("white-material", Main.Scene);
            Main._whiteMaterial.diffuseColor.copyFromFloats(0.9, 0.9, 0.9);
            Main._whiteMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
        }
        return Main._whiteMaterial;
    }
    static get orbMaterial() {
        if (!Main._orbMaterial) {
            Main._orbMaterial = new BABYLON.StandardMaterial("blue-material", Main.Scene);
            Main._orbMaterial.emissiveColor.copyFromFloats(0.8, 0.8, 1);
        }
        return Main._orbMaterial;
    }
    static get previewRedMaterial() {
        if (!Main._previewRedMaterial) {
            Main._previewRedMaterial = new BABYLON.StandardMaterial("preview-red-material", Main.Scene);
            Main._previewRedMaterial.diffuseColor.copyFromFloats(0.8, 0.2, 0.4);
            Main._previewRedMaterial.alpha = 0.7;
        }
        return Main._previewRedMaterial;
    }
    static get previewBlueMaterial() {
        if (!Main._previewBlueMaterial) {
            Main._previewBlueMaterial = new BABYLON.StandardMaterial("preview-blue-material", Main.Scene);
            Main._previewBlueMaterial.diffuseColor.copyFromFloats(0.4, 0.8, 0.9);
            Main._previewBlueMaterial.alpha = 0.7;
        }
        return Main._previewBlueMaterial;
    }
    async initialize() {
        await this.initializeScene();
    }
    static EnableGlowLayer() {
        Main.DisableGlowLayer();
        Main.GlowLayer = new BABYLON.GlowLayer("glow", Main.Scene);
        Main.GlowLayer.intensity = 1;
    }
    static DisableGlowLayer() {
        if (Main.GlowLayer) {
            Main.GlowLayer.dispose();
            Main.GlowLayer = undefined;
        }
    }
    static ToggleGlowLayer() {
        if (Main.GlowLayer) {
            Main.DisableGlowLayer();
        }
        else {
            Main.EnableGlowLayer();
        }
    }
    static async loadMesh(modelName) {
        return new Promise(resolve => {
            BABYLON.SceneLoader.ImportMesh("", "./assets/models/" + modelName + ".babylon", "", Main.Scene, (meshes) => {
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
    static async loadMeshes(modelName, hide = true) {
        return new Promise(resolve => {
            BABYLON.SceneLoader.ImportMesh("", "./assets/models/" + modelName + ".babylon", "", Main.Scene, (meshes) => {
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
    async initializeScene() {
        Main.Scene = new BABYLON.Scene(Main.Engine);
        let ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, Main.Scene);
        let groundMaterial = new BABYLON.StandardMaterial("ground-material", Main.Scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture("assets/textures/dirt.jpg", Main.Scene);
        groundMaterial.specularColor.copyFromFloats(0, 0, 0);
        ground.material = groundMaterial;
        /*
        let crawler = new Crawler();
        let camera = new CrawlerCamera();
        camera.attach(crawler);
        */
        let camera = new BABYLON.ArcRotateCamera("camera", 0, Math.PI / 4, 20, BABYLON.Vector3.Zero(), Main.Scene);
        camera.attachControl(Main.Canvas);
        for (let i = 0; i < 5; i++) {
            let material = new BABYLON.StandardMaterial("preview-blue-material", Main.Scene);
            material.diffuseColor.copyFromFloats(Math.random(), Math.random(), Math.random());
            material.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            let puppet = new Puppet(new BABYLON.Vector3(i * 3, 0, 0), material);
            Main.Scene.onBeforeRenderObservable.add(() => {
                puppet.update();
            });
            let controler = new FlightPlanPuppetControler(puppet);
            controler.flightPlan = [
                new BABYLON.Vector2(i * 3, 0),
                new BABYLON.Vector2(i * 3 + 1, 10),
                new BABYLON.Vector2(i * 3, 15),
                new BABYLON.Vector2(i * 3 - 1, 10),
                new BABYLON.Vector2(i * 3 + 1, -10),
                new BABYLON.Vector2(i * 3, -15),
                new BABYLON.Vector2(i * 3 - 1, -10)
            ];
            puppet.puppetControler = controler;
            puppet.puppetControler.initialize();
        }
        Main.EnableGlowLayer();
        Main.Light = new BABYLON.HemisphericLight("AmbientLight", new BABYLON.Vector3(1, 3, 2), Main.Scene);
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
        let depthMap = Main.Scene.enableDepthRenderer(camera).getDepthMap();
        let postProcess = new BABYLON.PostProcess("Edge", "Edge", ["width", "height"], ["depthSampler"], 1, camera);
        postProcess.onApply = (effect) => {
            effect.setTexture("depthSampler", depthMap);
            effect.setFloat("width", Main.Engine.getRenderWidth());
            effect.setFloat("height", Main.Engine.getRenderHeight());
        };
        /*
        Main.Skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 2000.0 }, Main.Scene);
        Main.Skybox.rotation.y = Math.PI / 2;
        Main.Skybox.infiniteDistance = true;
        let skyboxMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("skyBox", Main.Scene);
        skyboxMaterial.backFaceCulling = false;
        Main.EnvironmentTexture = new BABYLON.CubeTexture(
            "./assets/skyboxes/sky",
            Main.Scene,
            ["-px.png", "-py.png", "-pz.png", "-nx.png", "-ny.png", "-nz.png"]);
        skyboxMaterial.reflectionTexture = Main.EnvironmentTexture;
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        Main.Skybox.material = skyboxMaterial;

        Main.Scene.onBeforeRenderObservable.add(
            () => {
                Main.Skybox.rotation.y += 0.0001;
            }
        )
        */
        Main.Scene.clearColor.copyFromFloats(122 / 255, 200 / 255, 222 / 255, 1);
    }
    animate() {
        let fpsInfoElement = document.getElementById("fps-info");
        let meshesInfoTotalElement = document.getElementById("meshes-info-total");
        let meshesInfoNonStaticUniqueElement = document.getElementById("meshes-info-nonstatic-unique");
        let meshesInfoStaticUniqueElement = document.getElementById("meshes-info-static-unique");
        let meshesInfoNonStaticInstanceElement = document.getElementById("meshes-info-nonstatic-instance");
        let meshesInfoStaticInstanceElement = document.getElementById("meshes-info-static-instance");
        Main.Engine.runRenderLoop(() => {
            Main.Scene.render();
            fpsInfoElement.innerText = Main.Engine.getFps().toFixed(0) + " fps";
            let uniques = Main.Scene.meshes.filter(m => { return !(m instanceof BABYLON.InstancedMesh); });
            let uniquesNonStatic = uniques.filter(m => { return !m.isWorldMatrixFrozen; });
            let uniquesStatic = uniques.filter(m => { return m.isWorldMatrixFrozen; });
            let instances = Main.Scene.meshes.filter(m => { return m instanceof BABYLON.InstancedMesh; });
            let instancesNonStatic = instances.filter(m => { return !m.isWorldMatrixFrozen; });
            let instancesStatic = instances.filter(m => { return m.isWorldMatrixFrozen; });
            meshesInfoTotalElement.innerText = Main.Scene.meshes.length.toFixed(0).padStart(4, "0");
            meshesInfoNonStaticUniqueElement.innerText = uniquesNonStatic.length.toFixed(0).padStart(4, "0");
            meshesInfoStaticUniqueElement.innerText = uniquesStatic.length.toFixed(0).padStart(4, "0");
            meshesInfoNonStaticInstanceElement.innerText = instancesNonStatic.length.toFixed(0).padStart(4, "0");
            meshesInfoStaticInstanceElement.innerText = instancesStatic.length.toFixed(0).padStart(4, "0");
        });
        window.addEventListener("resize", () => {
            Main.Engine.resize();
        });
    }
}
window.addEventListener("load", async () => {
    let main = new Main("render-canvas");
    await main.initialize();
    main.animate();
});
class PuppetParameters {
    constructor() {
        this.bodyGravity = new BABYLON.Vector3(0, 0, -1);
        this.torsoSpringK = 10;
        this.kneeMass = 0.1;
        this.kneeRGravity = new BABYLON.Vector3(0.5, 0, 1);
        this.kneeGravityFactor = 20;
        this.footMass = 0.8;
        this.footTargetDistance = 0.5;
        this.legSpringK = 10;
        this.footSpringK = 10;
        this.elbowMass = 0.05;
        this.elbowRGravity = new BABYLON.Vector3(1, -0.5, -1);
        this.elbowGravityFactor = 5;
        this.armSpringK = 10;
        this.foreArmSpringK = 10;
        this.handAnchorPosition = new BABYLON.Vector3(0.75, -0.5, 0);
    }
    randomize() {
        console.log(Object.keys(this));
        Object.keys(this).forEach((k) => {
            let v = this[k];
            console.log(v);
            if (v instanceof BABYLON.Vector3) {
                let l = v.length();
                let r = new BABYLON.Vector3(-1 + 2 * Math.random(), -1 + 2 * Math.random(), -1 + 2 * Math.random());
                r.normalize();
                r.scaleInPlace(l);
                r.scaleInPlace(0.5 + Math.random());
                r.scaleInPlace(0.5);
                this[k].addInPlace(r);
            }
            if (typeof (v) === "number") {
                this[k] = v * (0.5 + Math.random());
            }
        });
        console.log(this);
    }
}
class PuppetTarget extends BABYLON.Mesh {
    constructor(puppet) {
        super("target");
        this.puppet = puppet;
        this.anchorFootRTarget = BABYLON.MeshBuilder.CreateBox("anchorFootRTarget", { size: 0.05 });
        this.anchorFootRTarget.material = Main.redMaterial;
        this.anchorFootRTarget.position.copyFromFloats(this.puppet.pupperParams.footTargetDistance, 5, 0);
        this.anchorFootRTarget.parent = this;
        this.anchorFootLTarget = BABYLON.MeshBuilder.CreateBox("anchorFootLTarget", { size: 0.05 });
        this.anchorFootLTarget.material = Main.redMaterial;
        this.anchorFootLTarget.position.copyFromFloats(-this.puppet.pupperParams.footTargetDistance, 5, 0);
        this.anchorFootLTarget.parent = this;
    }
}
class Puppet {
    constructor(initialPosition, material) {
        this.pupperParams = new PuppetParameters();
        this.nodes = [];
        this.links = [];
        this.t = 0;
        this._movingLegCount = 0;
        this.pupperParams.randomize();
        this.target = new PuppetTarget(this);
        this.target.position.x = initialPosition.x;
        this.target.position.z = initialPosition.z;
        let body = new PuppetNode(initialPosition, false);
        body.gravity = () => {
            let n = this.pupperParams.bodyGravity.clone();
            this.target.getDirectionToRef(n, n);
            n.normalize().scaleInPlace(30 * body.mass);
            return n;
        };
        let kneeR = new PuppetNode(initialPosition, false);
        kneeR.mass = this.pupperParams.kneeMass;
        kneeR.gravity = () => {
            let n = this.pupperParams.kneeRGravity.clone();
            this.target.getDirectionToRef(n, n);
            n.normalize().scaleInPlace(this.pupperParams.kneeGravityFactor * kneeR.mass);
            return n;
        };
        let footR = new PuppetNode(initialPosition, false);
        footR.mass = this.pupperParams.footMass;
        let kneeL = new PuppetNode(initialPosition, false);
        kneeL.mass = this.pupperParams.kneeMass;
        kneeL.gravity = () => {
            let n = this.pupperParams.kneeRGravity.clone();
            n.x *= -1;
            this.target.getDirectionToRef(n, n);
            n.normalize().scaleInPlace(this.pupperParams.kneeGravityFactor * kneeL.mass);
            return n;
        };
        let footL = new PuppetNode(initialPosition, false);
        footL.mass = this.pupperParams.footMass;
        let shoulder = new PuppetNode(initialPosition, false);
        let elbowR = new PuppetNode(initialPosition, false);
        elbowR.mass = this.pupperParams.elbowMass;
        elbowR.gravity = () => {
            let n = this.pupperParams.elbowRGravity.clone();
            this.target.getDirectionToRef(n, n);
            n.normalize().scaleInPlace(this.pupperParams.elbowGravityFactor * elbowR.mass);
            return n;
        };
        let elbowL = new PuppetNode(initialPosition, false);
        elbowL.mass = this.pupperParams.elbowMass;
        elbowL.gravity = () => {
            let n = this.pupperParams.elbowRGravity.clone();
            n.x *= -1;
            this.target.getDirectionToRef(n, n);
            n.normalize().scaleInPlace(this.pupperParams.elbowGravityFactor * elbowL.mass);
            return n;
        };
        let handR = new PuppetNode(initialPosition, false);
        let handL = new PuppetNode(initialPosition, false);
        this.links.push(PuppetSpring.Connect(body, kneeR, this.pupperParams.legSpringK));
        this.links.push(PuppetSpring.Connect(body, kneeL, this.pupperParams.legSpringK));
        this.links.push(PuppetSpring.Connect(kneeR, footR, this.pupperParams.footSpringK));
        this.links.push(PuppetSpring.Connect(kneeL, footL, this.pupperParams.footSpringK));
        let torso = PuppetSpring.Connect(body, shoulder, this.pupperParams.torsoSpringK);
        this.links.push(torso);
        this.links.push(PuppetSpring.Connect(shoulder, elbowR, this.pupperParams.armSpringK, 0.8));
        this.links.push(PuppetSpring.Connect(shoulder, elbowL, this.pupperParams.armSpringK, 0.8));
        this.links.push(PuppetSpring.Connect(elbowR, handR, this.pupperParams.foreArmSpringK, 0.8));
        this.links.push(PuppetSpring.Connect(elbowL, handL, this.pupperParams.foreArmSpringK, 0.8));
        this.anchorFootR = new PuppetNode();
        this.anchorFootR.position.copyFromFloats(0.5, 5, 0).addInPlace(initialPosition);
        this.links.push(PuppetRope.Connect(footR, this.anchorFootR));
        this.anchorFootL = new PuppetNode();
        this.anchorFootL.position.copyFromFloats(-0.5, 5, 0).addInPlace(initialPosition);
        this.links.push(PuppetRope.Connect(footL, this.anchorFootL));
        this.anchorHead = new PuppetNode();
        this.anchorHead.position.copyFromFloats(0, 5, 0).addInPlace(initialPosition);
        let headRope = PuppetRope.Connect(shoulder, this.anchorHead);
        headRope.l0 = 2;
        this.links.push(headRope);
        this.anchorHandR = new PuppetNode();
        this.anchorHandR.position.copyFrom(this.anchorHead.position);
        this.anchorHandR.position.addInPlace(this.pupperParams.handAnchorPosition);
        let handRRope = PuppetRope.Connect(handR, this.anchorHandR);
        handRRope.l0 = 3;
        this.links.push(handRRope);
        this.anchorHandL = new PuppetNode();
        this.anchorHandL.position.copyFrom(this.pupperParams.handAnchorPosition);
        this.anchorHandL.position.x *= -1;
        this.anchorHandL.position.addInPlace(this.anchorHead.position);
        let handLRope = PuppetRope.Connect(handL, this.anchorHandL);
        handLRope.l0 = 3;
        this.links.push(handLRope);
        this.nodes = [body, shoulder, kneeR, kneeL, footR, footL, elbowR, elbowL, handR, handL];
        this.bodyMesh = new BABYLON.Mesh("bodymesh");
        this.bodyMesh.position.copyFrom(initialPosition);
        this.bodyMesh.material = material;
        this.legRMesh = new BABYLON.Mesh("legRMesh");
        this.legRMesh.position.copyFrom(initialPosition);
        this.legRMesh.material = material;
        this.legLMesh = new BABYLON.Mesh("legLMesh");
        this.legLMesh.position.copyFrom(initialPosition);
        this.legLMesh.material = material;
        this.footRMesh = new BABYLON.Mesh("footRMesh");
        this.footRMesh.position.copyFrom(initialPosition);
        this.footRMesh.material = material;
        this.footLMesh = new BABYLON.Mesh("footLMesh");
        this.footLMesh.position.copyFrom(initialPosition);
        this.footLMesh.material = material;
        this.armRMesh = new BABYLON.Mesh("armRMesh");
        this.armRMesh.position.copyFrom(initialPosition);
        this.armRMesh.material = material;
        this.armLMesh = new BABYLON.Mesh("armLMesh");
        this.armLMesh.position.copyFrom(initialPosition);
        this.armLMesh.material = material;
        this.foreArmRMesh = new BABYLON.Mesh("foreArmRMesh");
        this.foreArmRMesh.position.copyFrom(initialPosition);
        this.foreArmRMesh.material = material;
        this.foreArmLMesh = new BABYLON.Mesh("foreArmLMesh");
        this.foreArmLMesh.position.copyFrom(initialPosition);
        this.foreArmLMesh.material = material;
        BABYLON.SceneLoader.ImportMesh("", "assets/models/puppet.babylon", "", Main.Scene, (meshes) => {
            let body = meshes.find(m => { return m.name === "body"; });
            let leg = meshes.find(m => { return m.name === "leg"; });
            let foot = meshes.find(m => { return m.name === "foot"; });
            let arm = meshes.find(m => { return m.name === "arm"; });
            let foreArm = meshes.find(m => { return m.name === "forearm"; });
            if (body && leg && foot) {
                let bodyMeshData = BABYLON.VertexData.ExtractFromMesh(body);
                bodyMeshData.applyToMesh(this.bodyMesh);
                let legMeshData = BABYLON.VertexData.ExtractFromMesh(leg);
                let footMeshData = BABYLON.VertexData.ExtractFromMesh(foot);
                let armMeshData = BABYLON.VertexData.ExtractFromMesh(arm);
                let foreArmMeshData = BABYLON.VertexData.ExtractFromMesh(foreArm);
                legMeshData.applyToMesh(this.legRMesh);
                legMeshData.applyToMesh(this.legLMesh);
                footMeshData.applyToMesh(this.footRMesh);
                footMeshData.applyToMesh(this.footLMesh);
                armMeshData.applyToMesh(this.armRMesh);
                armMeshData.applyToMesh(this.armLMesh);
                foreArmMeshData.applyToMesh(this.foreArmRMesh);
                foreArmMeshData.applyToMesh(this.foreArmLMesh);
                body.dispose();
                leg.dispose();
                arm.dispose();
                foreArm.dispose();
            }
        });
        /*
        setTimeout(() => {
            this._moveLeg(0, new BABYLON.Vector3(0.5, 5, 1.5));
        }, 3000);
        setTimeout(() => {
            this._moveLeg(1, new BABYLON.Vector3(- 0.5, 5, 3));
        }, 6000);
        setTimeout(() => {
            this._moveLeg(0, new BABYLON.Vector3(0.5, 5, 4.5));
        }, 9000);
        setTimeout(() => {
            this._moveLeg(1, new BABYLON.Vector3(- 0.5, 5, 6));
        }, 12000);
        setTimeout(() => {
            this._moveLeg(0, new BABYLON.Vector3(0.5, 5, 6));
        }, 15000);
        */
    }
    update() {
        this.t += Main.Engine.getDeltaTime() / 1000;
        if (this.puppetControler) {
            if (this.puppetControler.inputDirs.contains(0)) {
                this.target.position.addInPlace(this.target.right.scale(3 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this.puppetControler.inputDirs.contains(1)) {
                this.target.position.subtractInPlace(this.target.forward.scale(2 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this.puppetControler.inputDirs.contains(2)) {
                this.target.position.subtractInPlace(this.target.right.scale(3 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this.puppetControler.inputDirs.contains(3)) {
                this.target.position.addInPlace(this.target.forward.scale(5 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this.puppetControler.inputDirs.contains(4)) {
                this.target.rotation.y -= 0.5 * Math.PI * Main.Engine.getDeltaTime() / 1000;
            }
            if (this.puppetControler.inputDirs.contains(5)) {
                this.target.rotation.y += 0.5 * Math.PI * Main.Engine.getDeltaTime() / 1000;
            }
        }
        let extend = this.target.position.subtract(this.bodyMesh.position);
        extend.y = 0;
        if (extend.length() > 3) {
            extend.normalize();
            extend.scaleInPlace(3);
        }
        this.target.position.x = this.bodyMesh.position.x + extend.x;
        this.target.position.z = this.bodyMesh.position.z + extend.z;
        if (this._movingLegCount <= 0) {
            let distR = BABYLON.Vector3.Distance(this.anchorFootR.position, this.target.anchorFootRTarget.absolutePosition);
            let distL = BABYLON.Vector3.Distance(this.anchorFootL.position, this.target.anchorFootLTarget.absolutePosition);
            let maxDist = Math.max(2, Math.min(4, 2 + Math.abs(distR - distL)));
            if (distR > 0.01 || distL > 0.01) {
                if (distR > distL) {
                    this._movingLegCount++;
                    let t = this.target.anchorFootRTarget.absolutePosition.clone();
                    if (distR > maxDist) {
                        t = this.target.anchorFootRTarget.absolutePosition.subtract(this.anchorFootR.position).normalize().scaleInPlace(maxDist).addInPlace(this.anchorFootR.position);
                    }
                    this._moveLeg(0, t).then(() => {
                        this._movingLegCount--;
                    });
                }
                else {
                    this._movingLegCount++;
                    let t = this.target.anchorFootLTarget.absolutePosition.clone();
                    if (distL > maxDist) {
                        t = this.target.anchorFootLTarget.absolutePosition.subtract(this.anchorFootL.position).normalize().scaleInPlace(maxDist).addInPlace(this.anchorFootL.position);
                    }
                    this._moveLeg(1, t).then(() => {
                        this._movingLegCount--;
                    });
                }
            }
        }
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].update();
        }
        for (let i = 0; i < this.links.length; i++) {
            this.links[i].update();
        }
        let bodyPos = this.nodes[0].position.clone();
        let shoulderPos = this.nodes[1].position.clone();
        let kneeRPos = this.nodes[2].position.clone();
        let kneeLPos = this.nodes[3].position.clone();
        let footRPos = this.nodes[4].position.clone();
        let footLPos = this.nodes[5].position.clone();
        let elbowRPos = this.nodes[6].position.clone();
        let elbowLPos = this.nodes[7].position.clone();
        let handRPos = this.nodes[8].position.clone();
        let handLPos = this.nodes[9].position.clone();
        let bodyKneeDist = Math.sqrt(0.35 * 0.35 + 1 * 1);
        for (let i = 0; i < 3; i++) {
            VMath.SetABDistanceInPlace(shoulderPos, bodyPos, 1, true);
            VMath.SetABDistanceInPlace(footRPos, kneeRPos, 1, true);
            VMath.SetABDistanceInPlace(footLPos, kneeLPos, 1, true);
            VMath.SetABDistanceInPlace(kneeRPos, bodyPos, bodyKneeDist);
            VMath.SetABDistanceInPlace(kneeLPos, bodyPos, bodyKneeDist);
            let shoulderRPos = new BABYLON.Vector3(0.35, 1, 0);
            this.bodyMesh.getDirectionToRef(shoulderRPos, shoulderRPos);
            shoulderRPos.addInPlace(this.bodyMesh.position);
            VMath.SetABDistanceInPlace(elbowRPos, shoulderRPos, 0.8);
            let shoulderLPos = new BABYLON.Vector3(-0.35, 1, 0);
            this.bodyMesh.getDirectionToRef(shoulderLPos, shoulderLPos);
            shoulderLPos.addInPlace(this.bodyMesh.position);
            VMath.SetABDistanceInPlace(elbowLPos, shoulderLPos, 0.8);
            VMath.SetABDistanceInPlace(handRPos, elbowRPos, 0.8, true);
            VMath.SetABDistanceInPlace(handLPos, elbowLPos, 0.8, true);
        }
        this.bodyMesh.position.copyFrom(bodyPos);
        let up = shoulderPos.subtract(bodyPos).normalize();
        let forward = this.target.forward;
        let right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.bodyMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        this.footRMesh.position.copyFrom(kneeRPos);
        up = kneeRPos.subtract(footRPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.footRMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        this.footLMesh.position.copyFrom(kneeLPos);
        up = kneeLPos.subtract(footLPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.footLMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        this.legRMesh.position.copyFromFloats(0.35, 0, 0);
        this.bodyMesh.getDirectionToRef(this.legRMesh.position, this.legRMesh.position);
        this.legRMesh.position.addInPlace(this.bodyMesh.position);
        up = this.legRMesh.position.subtract(kneeRPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.legRMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        this.legLMesh.position.copyFromFloats(-0.35, 0, 0);
        this.bodyMesh.getDirectionToRef(this.legLMesh.position, this.legLMesh.position);
        this.legLMesh.position.addInPlace(this.bodyMesh.position);
        up = this.legLMesh.position.subtract(kneeLPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.legLMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        this.foreArmRMesh.position.copyFrom(elbowRPos);
        up = elbowRPos.subtract(handRPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.foreArmRMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        this.foreArmLMesh.position.copyFrom(elbowLPos);
        up = elbowLPos.subtract(handLPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.foreArmLMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        this.armRMesh.position.copyFromFloats(0.35, 1, 0);
        this.bodyMesh.getDirectionToRef(this.armRMesh.position, this.armRMesh.position);
        this.armRMesh.position.addInPlace(this.bodyMesh.position);
        up = this.armRMesh.position.subtract(elbowRPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.armRMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        this.armLMesh.position.copyFromFloats(-0.35, 1, 0);
        this.bodyMesh.getDirectionToRef(this.armLMesh.position, this.armLMesh.position);
        this.armLMesh.position.addInPlace(this.bodyMesh.position);
        up = this.armLMesh.position.subtract(elbowLPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.armLMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
    }
    async _moveLeg(legIndex, target) {
        return new Promise(resolve => {
            let foot = this.anchorFootR;
            if (legIndex === 1) {
                foot = this.anchorFootL;
            }
            let origin = foot.position.clone();
            let l = target.subtract(origin).length();
            let duration = Math.max(0.5, Math.min(l, 1.5));
            duration *= 0.5;
            let t = 0;
            let step = () => {
                t += Main.Engine.getDeltaTime() / 1000;
                let d = t / duration;
                let df = d * 2;
                df = Math.min(df, 1);
                foot.position.copyFrom(origin.scale(1 - d).add(target.scale(d)));
                foot.position.y = 5 + Math.sin(Math.PI * d) * (duration / 3);
                this.anchorHead.position.x = (this.anchorFootR.position.x + this.anchorFootL.position.x) * 0.5;
                this.anchorHead.position.z = (this.anchorFootR.position.z + this.anchorFootL.position.z) * 0.5;
                let f = this.target.forward;
                let r = this.target.right;
                let dR = BABYLON.Vector3.Dot(f, this.anchorFootR.position.subtract(this.anchorHead.position));
                this.anchorHandR.position.copyFrom(this.anchorHead.position);
                this.anchorHandR.position.addInPlace(r.scale(this.pupperParams.handAnchorPosition.x)).addInPlace(f.scale(this.pupperParams.handAnchorPosition.z - 0.8 * dR));
                let dL = BABYLON.Vector3.Dot(f, this.anchorFootL.position.subtract(this.anchorHead.position));
                this.anchorHandL.position.copyFrom(this.anchorHead.position);
                this.anchorHandL.position.addInPlace(r.scale(-this.pupperParams.handAnchorPosition.x)).addInPlace(f.scale(this.pupperParams.handAnchorPosition.z - 0.8 * dL));
                if (d < 1) {
                    requestAnimationFrame(step);
                }
                else {
                    resolve();
                }
            };
            step();
        });
    }
}
class PuppetNode {
    constructor(position = BABYLON.Vector3.Zero(), showMesh = true) {
        this.showMesh = showMesh;
        this.mass = 0.1;
        this.position = BABYLON.Vector3.Zero();
        this.velocity = BABYLON.Vector3.Zero();
        this.links = [];
        this.gravity = () => {
            return new BABYLON.Vector3(0, -9.8 * this.mass, 0);
        };
        this.position.copyFromFloats(-1 + Math.random() * 2, -1 + Math.random() * 2 + 2, -1 + Math.random() * 2);
        this.position.addInPlace(position);
        if (this.showMesh) {
            this.mesh = BABYLON.MeshBuilder.CreateBox("box", { size: 0.2 });
        }
    }
    update() {
        let dt = Main.Engine.getDeltaTime() / 1000;
        let force = this.gravity();
        for (let i = 0; i < this.links.length; i++) {
            if (!(this.links[i] instanceof PuppetRope)) {
                force.addInPlace(this.links[i].getForceOn(this));
            }
        }
        if (this.position.y < 0.1) {
            force.x -= this.velocity.x * 0.5;
            force.y -= this.velocity.y * 0.08;
            force.z -= this.velocity.z * 0.5;
        }
        else {
            force.x -= this.velocity.x * 0.08;
            force.y -= this.velocity.y * 0.08;
            force.z -= this.velocity.z * 0.08;
        }
        let a = force.scaleInPlace(1 / this.mass);
        this.velocity.addInPlace(a.scaleInPlace(dt));
        this.position.addInPlace(this.velocity.scale(dt));
        for (let i = 0; i < this.links.length; i++) {
            let link = this.links[i];
            if (link instanceof PuppetRope) {
                let l = BABYLON.Vector3.Distance(link.nodeA.position, link.nodeB.position);
                if (l > link.l0) {
                    VMath.SetABDistanceInPlace(link.nodeB.position, link.nodeA.position, link.l0, true);
                }
            }
        }
        if (this.showMesh) {
            this.mesh.position.copyFrom(this.position);
        }
    }
}
class PuppetLink {
    update() {
        if (this.mesh) {
            this.mesh.dispose();
        }
        this.mesh = BABYLON.MeshBuilder.CreateLines("line", { points: [this.nodeA.position, this.nodeB.position] });
    }
}
class PuppetSpring extends PuppetLink {
    constructor() {
        super(...arguments);
        this.k = 10;
        this.l0 = 1;
    }
    static Connect(nodeA, nodeB, k = 10, l0) {
        let link = new PuppetSpring();
        if (isFinite(l0)) {
            link.l0 = l0;
        }
        link.nodeA = nodeA;
        link.nodeB = nodeB;
        link.nodeA.links.push(link);
        link.nodeB.links.push(link);
        return link;
    }
    getForceOn(node) {
        let other;
        if (node === this.nodeA) {
            other = this.nodeB;
        }
        if (node === this.nodeB) {
            other = this.nodeA;
        }
        if (!node) {
            console.warn("Requesting getForceOn on inadequate PuppetNode.");
            return BABYLON.Vector3.Zero();
        }
        let n = node.position.subtract(other.position);
        let l = n.length();
        n.scaleInPlace(1 / l);
        return n.scaleInPlace(this.l0 - l).scaleInPlace(this.k);
    }
}
class PuppetRope extends PuppetLink {
    constructor() {
        super(...arguments);
        this.k = 400;
        this.l0 = 5;
    }
    static Connect(nodeA, nodeB) {
        let link = new PuppetRope();
        link.nodeA = nodeA;
        link.nodeB = nodeB;
        link.nodeA.links.push(link);
        link.nodeB.links.push(link);
        return link;
    }
    getForceOn(node) {
        return BABYLON.Vector3.Zero();
    }
}
class PuppetControler {
    constructor(puppet) {
        this.puppet = puppet;
        this.inputDirs = new UniqueList();
    }
    initialize() {
    }
}
class FlightPlanPuppetControler extends PuppetControler {
    constructor() {
        super(...arguments);
        this.flightPlan = [];
        this.waypointIndex = 0;
        this.update = () => {
            let target = this.flightPlan[this.waypointIndex];
            let d = new BABYLON.Vector2(this.puppet.target.position.x - target.x, this.puppet.target.position.z - target.y);
            if (d.length() < 1) {
                this.waypointIndex = (this.waypointIndex + 1) % this.flightPlan.length;
                return;
            }
            d.normalize();
            let f = new BABYLON.Vector2(this.puppet.target.forward.x, this.puppet.target.forward.z);
            let cross = d.x * f.y - d.y * f.x;
            if (cross < 0) {
                this.inputDirs.push(5);
                this.inputDirs.remove(4);
            }
            else if (cross > 0) {
                this.inputDirs.remove(5);
                this.inputDirs.push(4);
            }
            this.inputDirs.push(3);
        };
    }
    initialize() {
        Main.Scene.onBeforeRenderObservable.add(this.update);
    }
}
class WalkAroundPuppetControler extends PuppetControler {
    constructor() {
        super(...arguments);
        this.target = BABYLON.Vector2.Zero();
        this.update = () => {
            let d = new BABYLON.Vector2(this.puppet.target.position.x - this.target.x, this.puppet.target.position.z - this.target.y);
            if (d.length() < 1) {
                this.target.x = -20 + 40 * Math.random();
                this.target.y = -20 + 40 * Math.random();
                let debug = BABYLON.MeshBuilder.CreateBox("debug", { size: 1 });
                debug.position.x = this.target.x;
                debug.position.z = this.target.y;
            }
            d.normalize();
            let f = new BABYLON.Vector2(this.puppet.target.forward.x, this.puppet.target.forward.z);
            let cross = d.x * f.y - d.y * f.x;
            if (cross < 0) {
                this.inputDirs.push(5);
                this.inputDirs.remove(4);
            }
            else if (cross > 0) {
                this.inputDirs.remove(5);
                this.inputDirs.push(4);
            }
            this.inputDirs.push(3);
        };
    }
    initialize() {
        Main.Scene.onBeforeRenderObservable.add(this.update);
    }
}
class KeyBoardPuppetControler extends PuppetControler {
    initialize() {
        Main.Canvas.addEventListener("keydown", (e) => {
            if (e.code === "KeyD") {
                this.inputDirs.push(0);
            }
            if (e.code === "KeyS") {
                this.inputDirs.push(1);
            }
            if (e.code === "KeyA") {
                this.inputDirs.push(2);
            }
            if (e.code === "KeyW") {
                this.inputDirs.push(3);
            }
            if (e.code === "KeyQ") {
                this.inputDirs.push(4);
            }
            if (e.code === "KeyE") {
                this.inputDirs.push(5);
            }
        });
        Main.Canvas.addEventListener("keyup", (e) => {
            if (e.code === "KeyD") {
                this.inputDirs.remove(0);
            }
            if (e.code === "KeyS") {
                this.inputDirs.remove(1);
            }
            if (e.code === "KeyA") {
                this.inputDirs.remove(2);
            }
            if (e.code === "KeyW") {
                this.inputDirs.remove(3);
            }
            if (e.code === "KeyQ") {
                this.inputDirs.remove(4);
            }
            if (e.code === "KeyE") {
                this.inputDirs.remove(5);
            }
        });
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
            new BABYLON.Vector3(-1, 0.4, 0),
            new BABYLON.Vector3(1, 0.4, 0)
        ];
        for (let i = 0; i < walker.legCount; i++) {
            //let target = new BABYLON.Mesh("target-" + i);
            let target = BABYLON.MeshBuilder.CreateBox("target-" + i, { size: 0.05 });
            target.material = Main.redMaterial;
            target.position.copyFrom(positions[i]);
            target.parent = this;
            this.targets[i] = target;
        }
    }
}
class Walker {
    constructor() {
        this.legCount = 2;
        this.legs = [];
        this.lowerLegs = [];
        this.feet = [];
        this.hipJoints = [];
        this._inputDirs = new UniqueList();
        this._movingLegCount = 0;
        this._movingLegs = new UniqueList();
        this._update = () => {
            if (this._inputDirs.contains(0)) {
                this.target.position.addInPlace(this.target.right.scale(3 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(1)) {
                this.target.position.subtractInPlace(this.target.forward.scale(2 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(2)) {
                this.target.position.subtractInPlace(this.target.right.scale(3 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(3)) {
                this.target.position.addInPlace(this.target.forward.scale(5 * Main.Engine.getDeltaTime() / 1000));
            }
            if (this._inputDirs.contains(4)) {
                this.target.rotation.y -= 0.5 * Math.PI * Main.Engine.getDeltaTime() / 1000;
            }
            if (this._inputDirs.contains(5)) {
                this.target.rotation.y += 0.5 * Math.PI * Main.Engine.getDeltaTime() / 1000;
            }
            this.body.position.copyFrom(this.feet[0].position);
            for (let i = 1; i < this.legCount; i++) {
                this.body.position.addInPlace(this.feet[i].position);
            }
            this.body.position.scaleInPlace(1 / this.legCount);
            this.body.position.y += 3;
            let left = BABYLON.Vector3.Zero();
            for (let i = 0; i < 1; i++) {
                left.addInPlace(this.feet[i].absolutePosition);
            }
            let right = BABYLON.Vector3.Zero();
            for (let i = 1; i < 2; i++) {
                right.addInPlace(this.feet[i].absolutePosition);
            }
            let rightDir = right.subtract(left).normalize();
            let forward = BABYLON.Vector3.Cross(rightDir, BABYLON.Axis.Y);
            this.body.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(rightDir, BABYLON.Axis.Y, forward);
            let q = BABYLON.Quaternion.FromEulerVector(this.target.rotation);
            this.body.rotationQuaternion = BABYLON.Quaternion.Slerp(this.body.rotationQuaternion, q, 0.75);
            this.feet[0].rotationQuaternion = this.body.rotationQuaternion;
            this.feet[1].rotationQuaternion = this.body.rotationQuaternion;
            for (let i = 0; i < this.legCount; i++) {
                let knee = this.hipJoints[i].absolutePosition.add(this.feet[i].absolutePosition).scale(0.5);
                let targetForward = this.target.forward;
                knee.subtractInPlace(targetForward.scale(3));
                for (let j = 0; j < 3; j++) {
                    let legN = knee.subtract(this.hipJoints[i].absolutePosition).normalize();
                    knee = this.hipJoints[i].absolutePosition.add(legN.scale(2));
                    let lowerLegN = knee.subtract(this.feet[i].absolutePosition).normalize();
                    knee = this.feet[i].absolutePosition.add(lowerLegN.scale(2));
                }
                this.legs[i].position = this.hipJoints[i].absolutePosition;
                this.legs[i].lookAt(knee);
                this.lowerLegs[i].position = knee;
                this.lowerLegs[i].lookAt(this.feet[i].absolutePosition);
            }
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
                    this._moveLeg(index, this.target.targets[index].absolutePosition);
                }
            }
        };
        this.target = new WalkerTarget(this);
        this.body = BABYLON.MeshBuilder.CreateSphere("body", { diameterX: 1, diameterY: 0.5, diameterZ: 1 }, Main.Scene);
        this.cameraTarget = new BABYLON.Mesh("camera-target");
        this.cameraTarget.parent = this.body;
        this.cameraTarget.position.copyFromFloats(0, 20, -20);
        this.cameraTarget.rotation.x = Math.PI / 4;
        let positions = [
            new BABYLON.Vector3(-1, 0, 0),
            new BABYLON.Vector3(1, 0, 0)
        ];
        for (let i = 0; i < this.legCount; i++) {
            let hipJoint = BABYLON.MeshBuilder.CreateBox("hipJoint-" + i, { size: 0.1 });
            hipJoint.material = Main.greenMaterial;
            hipJoint.position.copyFrom(positions[i]);
            hipJoint.parent = this.body;
            this.hipJoints[i] = hipJoint;
        }
        for (let i = 0; i < this.legCount; i++) {
            let foot = new BABYLON.Mesh("foot-" + i);
            foot.material = Main.blueMaterial;
            foot.position.copyFrom(this.target.targets[i].absolutePosition);
            this.feet[i] = foot;
        }
        for (let i = 0; i < this.legCount; i++) {
            let leg = new BABYLON.Mesh("leg-" + i);
            this.legs[i] = leg;
            let lowerLeg = new BABYLON.Mesh("lower-leg-" + i);
            this.lowerLegs[i] = lowerLeg;
            let foot = new BABYLON.Mesh("foot-" + i);
            this.feet[i] = foot;
        }
        BABYLON.SceneLoader.ImportMesh("", "assets/models/walker.babylon", "", Main.Scene, (meshes) => {
            let body = meshes.find(m => { return m.name === "body"; });
            let leg = meshes.find(m => { return m.name === "leg"; });
            let lowerLeg = meshes.find(m => { return m.name === "lower-leg"; });
            let foot = meshes.find(m => { return m.name === "foot"; });
            if (body && leg && lowerLeg && foot) {
                let bodyMesh = BABYLON.VertexData.ExtractFromMesh(body);
                bodyMesh.applyToMesh(this.body);
                let legMesh = BABYLON.VertexData.ExtractFromMesh(leg);
                let lowerLegMesh = BABYLON.VertexData.ExtractFromMesh(lowerLeg);
                let footMesh = BABYLON.VertexData.ExtractFromMesh(foot);
                for (let i = 0; i < this.legCount; i++) {
                    legMesh.applyToMesh(this.legs[i]);
                    lowerLegMesh.applyToMesh(this.lowerLegs[i]);
                    footMesh.applyToMesh(this.feet[i]);
                }
                body.dispose();
                leg.dispose();
                lowerLeg.dispose();
                foot.dispose();
            }
        });
        Main.Scene.onBeforeRenderObservable.add(this._update);
        Main.Canvas.addEventListener("keydown", (e) => {
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
        Main.Canvas.addEventListener("keyup", (e) => {
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
    async _moveLeg(legIndex, target) {
        return new Promise(resolve => {
            this._movingLegs.push(legIndex);
            let origin = this.feet[legIndex].position.clone();
            let l = target.subtract(origin).length();
            let duration = Math.floor(l / 3);
            duration *= 0.5;
            duration += 0.5;
            let t = 0;
            let step = () => {
                t += Main.Engine.getDeltaTime() / 1000;
                let d = t / duration;
                d = d * d;
                d = Math.min(d, 1);
                this.feet[legIndex].position.copyFrom(origin.scale(1 - d).add(target.scale(d)));
                this.feet[legIndex].position.y += 0.5 * Math.sin(Math.PI * d);
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
