class CameraManager {
    constructor(main) {
        this.main = main;
        this.center = BABYLON.Vector2.Zero();
        this.moveWhenPointerOnSide = false;
        this.cameraMoveDistance = 80;
        this.cameraSpeed = 15;
        this._update = () => {
            if (!this.moveWhenPointerOnSide) {
                return;
            }
            this.camera.target.y = 0;
            let dt = this.main.engine.getDeltaTime() / 1000;
            let pointerX = this.main.scene.pointerX;
            let pointerY = this.main.scene.pointerY;
            let w = this.main.canvas.clientWidth;
            let h = this.main.canvas.clientHeight;
            let distanceToEdge = Infinity;
            distanceToEdge = Math.min(pointerX, distanceToEdge);
            distanceToEdge = Math.min(pointerY, distanceToEdge);
            distanceToEdge = Math.min(w - pointerX, distanceToEdge);
            distanceToEdge = Math.min(h - pointerY, distanceToEdge);
            if (distanceToEdge < this.cameraMoveDistance) {
                let speed = this.cameraSpeed * (1 - distanceToEdge / this.cameraMoveDistance);
                let dir = new BABYLON.Vector2(pointerX - w * 0.5, pointerY - h * 0.5).normalize();
                this.moveCenter(dir.x * speed * dt, -dir.y * speed * dt);
            }
            /*
            if (pointerX < this.cameraMoveDistance) {
                dX = - this.cameraSpeed * dt * (1 - pointerX / this.cameraMoveDistance);
            }
            if (pointerX > w - this.cameraMoveDistance) {
                let d = w - pointerX;
                dX = this.cameraSpeed * dt * (1 - d / this.cameraMoveDistance);
            }
            if (pointerY < this.cameraMoveDistance) {
                dY = this.cameraSpeed * dt * (1 - pointerY / this.cameraMoveDistance);
            }
            if (pointerY > h - this.cameraMoveDistance) {
                let d = h - pointerY;
                dY = - this.cameraSpeed * dt * (1 - d / this.cameraMoveDistance);
            }
            */
        };
    }
    initialize() {
        //this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, - 15), this.main.scene);
        this.camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 4, 30, BABYLON.Vector3.Zero(), this.main.scene);
        this.camera.attachControl(this.main.canvas);
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
				float threshold = 0.3;
				
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
        let depthMap = this.main.scene.enableDepthRenderer(this.camera).getDepthMap();
        let postProcess = new BABYLON.PostProcess("Edge", "Edge", ["width", "height"], ["depthSampler"], 1, this.camera);
        postProcess.onApply = (effect) => {
            effect.setTexture("depthSampler", depthMap);
            effect.setFloat("width", this.main.engine.getRenderWidth());
            effect.setFloat("height", this.main.engine.getRenderHeight());
        };
        let noPostProcessCamera = new BABYLON.FreeCamera("no-post-process-camera", BABYLON.Vector3.Zero(), this.main.scene);
        noPostProcessCamera.parent = this.camera;
        noPostProcessCamera.layerMask = 0x10000000;
        this.main.scene.activeCameras = [this.camera, noPostProcessCamera];
        this.main.scene.onBeforeRenderObservable.add(this._update);
        this.main.canvas.onpointerleave = () => {
            this.moveWhenPointerOnSide = false;
        };
        this.main.canvas.onpointerenter = () => {
            this.moveWhenPointerOnSide = true;
        };
    }
    resize() {
        /*
        let w = this.main.canvas.clientWidth;
        let h = this.main.canvas.clientHeight;

        let r = w / h;

        if (r > 1) {
            this.camera.orthoLeft = this.center.x - 10 * r;
            this.camera.orthoRight = this.center.x + 10 * r;
            this.camera.orthoTop = this.center.y + 10;
            this.camera.orthoBottom = this.center.y - 10;
        }
        else {
            this.camera.orthoLeft = this.center.x - 10;
            this.camera.orthoRight = this.center.x + 10;
            this.camera.orthoTop = this.center.y + 10 / r;
            this.camera.orthoBottom = this.center.y - 10 / r;
        }
        */
    }
    moveCenter(dX, dY) {
        this.camera.target.x += dX;
        this.camera.target.z += dY;
        this.resize();
    }
}
class Game {
    constructor(main) {
        this.main = main;
        this.gold = 0;
        this._update = () => {
        };
        this.main.scene.onBeforeRenderObservable.add(this._update);
    }
    pay(amount) {
        if (this.canPay(amount)) {
            this.gold -= amount;
            this.main.menu.setGold(this.gold);
            return true;
        }
        return false;
    }
    canPay(amount) {
        if (amount <= this.gold) {
            return true;
        }
        return false;
    }
    credit(amount) {
        this.gold += amount;
        this.main.menu.setGold(this.gold);
    }
}
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
        this.cameraManager.resize();
    }
    getPointerWorldPos() {
        let pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, m => { return m === this.ground; });
        let worldX = 0;
        let worldY = 0;
        if (pick && pick.hit) {
            worldX = pick.pickedPoint.x;
            worldY = pick.pickedPoint.z;
        }
        return new BABYLON.Vector2(worldX, worldY);
    }
    worldPosToPixel(w) {
        let px = (w.x - this.cameraManager.camera.orthoLeft) / (this.cameraManager.camera.orthoRight - this.cameraManager.camera.orthoLeft);
        let py = (w.y - this.cameraManager.camera.orthoBottom) / (this.cameraManager.camera.orthoTop - this.cameraManager.camera.orthoBottom);
        return new BABYLON.Vector2(px * this.canvas.clientWidth, (1 - py) * this.canvas.clientHeight);
    }
    async initializeScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor.copyFromFloats(158 / 255, 86 / 255, 55 / 255, 1);
        this.navGraphManager = new NavGraphManager(this);
        this.playerAction = new PlayerAction(this);
        this.menu = new Menu(this);
        this.menu.initializeMenu();
        this.menu.showIngameMenu();
        this.cameraManager = new CameraManager(this);
        this.cameraManager.initialize();
        //this.cameraManager.moveCenter(- 15, - 5);
        let light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, -1), this.scene);
        BABYLON.Engine.ShadersRepository = "./shaders/";
        this.resize();
        window.onresize = () => {
            this.resize();
        };
        this.game = new Game(this);
        this.game.credit(300);
        this.ground = new Ground(50, this);
        this.ground.instantiate().then(() => {
            this.generateTestMainScene();
        });
    }
    generateTestMainScene() {
        /*
        for (let i = 0; i < 40; i++) {
            let n = Math.floor(2 * Math.random()) + 1;
            let rock = new Prop("rock_" + n.toFixed(0), this);
            rock.posX = - 40 + 80 * Math.random();
            rock.posY = - 40 + 80 * Math.random();
            rock.rot = 2 * Math.PI * Math.random();
        }
        */
        for (let i = 0; i < 10; i++) {
            //this.ground.colorize(Math.round(Math.random() * 49), Math.round(Math.random() * 49), Math.round(Math.random() * 10), BABYLON.Color3.Red());
            //this.ground.colorize(Math.round(Math.random() * 49), Math.round(Math.random() * 49), Math.round(Math.random() * 10), BABYLON.Color3.Green());
        }
        this.ground.material.setColor4("vColorR", BABYLON.Color4.FromHexString("#d4290fff"));
        this.ground.material.setColor4("vColorG", BABYLON.Color4.FromHexString("#d4570fff"));
        this.ground.material.setColor4("vColorB", BABYLON.Color4.FromHexString("#d49f0fff"));
        this.ground.material.setColor4("vColorW", BABYLON.Color4.FromHexString("#b59e77ff"));
        let commandCenter = new CommandCenter(this);
        commandCenter.posX = -30;
        commandCenter.posY = -30;
        commandCenter.instantiate();
        commandCenter.makeReady();
        commandCenter.flattenGround(8);
        for (let i = 0; i < 10; i++) {
            let rock = new Rock(this);
            rock.posX = -25 + 50 * Math.random();
            rock.posY = -25 + 50 * Math.random();
            rock.instantiate();
            rock.makeReady();
        }
        this.cameraManager.camera.beta = Math.PI / 4;
        this.cameraManager.camera.radius = 30;
        for (let i = 0; i < 3; i++) {
            let p = new BABYLON.Vector2(-20 + 40 * Math.random(), -20 + 40 * Math.random());
            let meteor = new Meteor(1, p, this, BABYLON.Color3.FromHexString("#cb221b"), () => {
                let robot = new Robot(this);
                robot.instantiate().then(() => {
                    robot.foldAt(p);
                });
            });
            meteor.instantiate();
        }
        let turret1 = new Canon(this);
        turret1.posX = -20;
        turret1.posY = -20;
        turret1.instantiate();
        turret1.makeReady();
        turret1.flattenGround(3);
    }
    generateTestMeteorScene() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                let p = new BABYLON.Vector2(0, 0);
                let meteor = new Meteor(1, p, this, BABYLON.Color3.FromHexString("#cb221b"), () => {
                    let robot = new Robot(this);
                    robot.instantiate().then(() => {
                        robot.foldAt(p);
                        console.log(this.scene.meshes.map(m => { return m.name; }));
                    });
                    setTimeout(() => {
                        robot.dispose();
                    }, 8000);
                });
                meteor.instantiate();
            }, 10000 * i);
        }
    }
    disposeScene() {
        while (this.gameObjects.length > 0) {
            this.gameObjects.pop().dispose();
        }
    }
    animate() {
        this.engine.runRenderLoop(() => {
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
        this.isInstantiated = false;
        main.gameObjects.push(this);
    }
    get pos2D() {
        if (this.sprite) {
            return this.sprite.pos2D;
        }
        if (!this._pos2D) {
            this._pos2D = BABYLON.Vector2.Zero();
        }
        return this._pos2D;
    }
    get posX() {
        return this.pos2D.x;
    }
    set posX(x) {
        this.sprite.posX = x;
    }
    get posY() {
        return this.pos2D.y;
    }
    set posY(y) {
        this.sprite.posY = y;
    }
    get rot() {
        return this.sprite.rot;
    }
    set rot(r) {
        this.sprite.rot = r;
    }
    dispose() {
        this.isDisposed = true;
        this.isInstantiated = false;
        let index = this.main.gameObjects.indexOf(this);
        if (index != -1) {
            this.main.gameObjects.splice(index, 1);
        }
    }
}
/// <reference path="GameObject.ts"/>
class Building extends GameObject {
    constructor(main) {
        super(main);
        this.base = new BABYLON.Mesh("building", this.main.scene);
    }
    get pos2D() {
        if (!this._pos2D) {
            this._pos2D = BABYLON.Vector2.Zero();
        }
        this._pos2D.x = this.base.position.x;
        this._pos2D.y = this.base.position.z;
        return this._pos2D;
    }
    get posX() {
        return this.base.position.x;
    }
    set posX(x) {
        this.base.position.x = x;
        this.base.position.y = this.main.ground.getHeightAt(this.pos2D);
    }
    get posY() {
        return this.base.position.z;
    }
    set posY(y) {
        this.base.position.z = y;
        this.base.position.y = this.main.ground.getHeightAt(this.pos2D);
    }
    dispose() {
        super.dispose();
        if (this.base) {
            this.base.dispose();
        }
    }
    flattenGround(radius) {
        let height = this.base.position.y;
        let ij = this.main.ground.pos2DToIJ(this.pos2D);
        this.main.ground.flatten(ij.i, ij.j, height, radius);
    }
    makeReady() {
        this.isReady = true;
    }
}
class CommandCenter extends Building {
    constructor(main) {
        super(main);
    }
    async instantiate() {
        return new Promise(resolve => {
            BABYLON.SceneLoader.ImportMesh("", "assets/command-center.babylon", "", this.main.scene, (meshes) => {
                for (let i = 0; i < meshes.length; i++) {
                    let mesh = meshes[i];
                    mesh.parent = this.base;
                    if (mesh instanceof BABYLON.Mesh) {
                        mesh.instances.forEach((instancedMesh) => {
                            instancedMesh.parent = this.base;
                        });
                    }
                    if (mesh.material instanceof BABYLON.PBRMaterial) {
                        let toonMaterial = new ToonMaterial(mesh.material.name + "-toon", false, this.main.scene);
                        if (mesh.material.name === "EnergyCellMaterial") {
                            toonMaterial.setTexture("colorTexture", new BABYLON.Texture("assets/energy-cell-texture.png", this.main.scene));
                        }
                        if (mesh.material.name === "CommandCenterMaterial") {
                            toonMaterial.setTexture("colorTexture", new BABYLON.Texture("assets/command-center-texture.png", this.main.scene));
                        }
                        toonMaterial.setColor(mesh.material.albedoColor);
                        mesh.material = toonMaterial;
                    }
                    else if (mesh.material instanceof BABYLON.MultiMaterial) {
                        let newSubmaterials = [];
                        mesh.material.subMaterials.forEach((m, i) => {
                            let toonMaterial = new ToonMaterial("toon-material", false, this.main.scene);
                            toonMaterial.setColor(m.albedoColor);
                            newSubmaterials.push(toonMaterial);
                        });
                        mesh.material.subMaterials = newSubmaterials;
                    }
                }
                this.isInstantiated = true;
                resolve();
            });
        });
    }
    makeReady() {
        super.makeReady();
        if (!this.obstacle) {
            this.obstacle = Obstacle.CreateHexagon(this.posX, this.posY, 3);
            NavGraphManager.AddObstacle(this.obstacle);
        }
    }
}
class Beacon extends Building {
    constructor(main) {
        super(main);
        this._t = Infinity;
        this._n = 0;
        this._update = () => {
            if (this._n > 5) {
                return;
            }
            this._t += this.main.engine.getDeltaTime() / 1000;
            if (this._t > 5) {
                this._t = 0;
                this._n++;
                let walker = new Walker(this.main);
                walker.forcePosRot(this.posX, this.posY, -Math.PI / 2);
            }
        };
        this.main.scene.onBeforeRenderObservable.add(this._update);
    }
    async instantiate() {
        return new Promise(resolve => {
            BABYLON.SceneLoader.ImportMesh("", "assets/beacon.babylon", "", this.main.scene, (meshes) => {
                for (let i = 0; i < meshes.length; i++) {
                    let mesh = meshes[i];
                    mesh.parent = this.base;
                    if (mesh instanceof BABYLON.Mesh) {
                        mesh.instances.forEach((instancedMesh) => {
                            instancedMesh.parent = this.base;
                        });
                    }
                }
                this.isInstantiated = true;
                resolve();
            });
        });
    }
    dispose() {
        super.dispose();
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
    }
}
class Rock extends Building {
    async instantiate() {
        return new Promise(resolve => {
            BABYLON.SceneLoader.ImportMesh("", "assets/rock.babylon", "", this.main.scene, (meshes) => {
                let r = Math.floor(Math.random() * meshes.length);
                for (let i = 0; i < meshes.length; i++) {
                    let mesh = meshes[i];
                    if (i === r) {
                        mesh.parent = this.base;
                        let s = 0.5 + 2 * Math.random();
                        mesh.rotation.copyFromFloats(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
                        mesh.scaling.copyFromFloats(s, s, s);
                        let toonMaterial = new ToonMaterial(mesh.material.name + "-toon", false, this.main.scene);
                        toonMaterial.setColor(BABYLON.Color3.Gray());
                        mesh.material = toonMaterial;
                    }
                    else {
                        mesh.dispose();
                    }
                }
                this.isInstantiated = true;
                resolve();
            });
        });
    }
}
class Canon extends Building {
    constructor(main) {
        super(main);
        this.cooldown = 1;
        this.counter = 0;
        this._t = 0;
        this._update = () => {
            if (this.isReady && this.isInstantiated) {
                this._updateTarget();
                this._updateMesh();
                this._t += this.main.engine.getDeltaTime() / 1000;
                this.counter -= this.main.engine.getDeltaTime() / 1000;
                if (this.counter < 0 && this.target && this.target.isInstantiated) {
                    let d = this.target.body.position.subtract(this.head.absolutePosition);
                    let a = VMath.Angle(this.canon.forward, d);
                    if (Math.abs(a) < Math.PI / 50) {
                        this.counter = this.cooldown;
                        this.target.wound(1);
                        this._shoot();
                    }
                }
            }
        };
        this.counter = Math.random() * this.cooldown;
    }
    async instantiate() {
        return new Promise(resolve => {
            BABYLON.SceneLoader.ImportMesh("", "assets/canon.babylon", "", this.main.scene, (meshes) => {
                let p = this.base.position;
                if (this.base) {
                    this.base.dispose();
                }
                this.base = meshes.find(m => { return m.name === "base"; });
                this.base.position.copyFrom(p);
                this.body = meshes.find(m => { return m.name === "body"; });
                this.head = meshes.find(m => { return m.name === "head"; });
                this.canon = meshes.find(m => { return m.name === "canon"; });
                for (let i = 0; i < meshes.length; i++) {
                    let mesh = meshes[i];
                    if (mesh.material instanceof BABYLON.PBRMaterial) {
                        let toonMaterial = new ToonMaterial(mesh.material.name + "-toon", false, this.main.scene);
                        if (mesh.material.name === "CanonMaterial") {
                            toonMaterial.setTexture("colorTexture", new BABYLON.Texture("assets/canon-texture-dark.png", this.main.scene));
                        }
                        toonMaterial.setColor(mesh.material.albedoColor);
                        mesh.material = toonMaterial;
                    }
                }
                this.flashParticle = new FlashParticle("pew", this.main.scene, 1.5, 0.1);
                this.main.scene.onBeforeRenderObservable.add(this._update);
                this.isInstantiated = true;
                resolve();
            });
        });
    }
    dispose() {
        super.dispose();
        this.body.dispose();
        this.head.dispose();
        this.canon.dispose();
        this.flashParticle.dispose();
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
    }
    _updateTarget() {
        if (!this.target || this.target.isDisposed) {
            this.target = this.main.gameObjects.find(g => { return g instanceof Robot; });
        }
    }
    async _shoot() {
        return new Promise(resolve => {
            this.flashParticle.flash(this.canon.absolutePosition.add(this.canon.forward.scale(3.5)), this.canon.forward);
            let duration = 0.2;
            let t = 0;
            let step = () => {
                t += this.main.scene.getEngine().getDeltaTime() / 1000;
                let d = t / duration;
                d = Math.min(d, 1);
                if (d < 1) {
                    if (d < 0.1) {
                        this.canon.position.z = -0.5 * d / 0.1;
                        this.head.position.z = -0.2 * d / 0.1;
                    }
                    else {
                        let dd = (d - 0.1) / (1 - 0.1);
                        this.canon.position.z = -0.5 * (1 - dd);
                        this.head.position.z = -0.2 * (1 - dd);
                    }
                    requestAnimationFrame(step);
                }
                else {
                    resolve();
                }
            };
            step();
        });
    }
    _updateMesh() {
        if (this.target && this.target.isInstantiated) {
            let dt = this.main.engine.getDeltaTime() / 1000;
            let a = BABYLON.Vector3.GetAngleBetweenVectors(BABYLON.Axis.Z, this.target.body.position.subtract(this.body.absolutePosition), BABYLON.Axis.Y);
            this.body.rotation.y = Math2D.StepFromToCirular(this.body.rotation.y, a, Math.PI / 8 * dt);
            let d = this.target.body.position.subtract(this.head.absolutePosition);
            let sinb = d.y / d.length();
            let b = -Math.asin(sinb);
            //let b = BABYLON.Vector3.GetAngleBetweenVectors(this.body.forward, this.target.body.position.subtract(this.head.absolutePosition), this.body.right);
            this.head.rotation.x = Math2D.StepFromToCirular(this.head.rotation.x, b, Math.PI / 8 * dt);
        }
    }
}
class FlashParticle extends BABYLON.Mesh {
    constructor(name, scene, size, lifespan) {
        super(name, scene);
        this.scene = scene;
        this.size = size;
        this.lifespan = lifespan;
        this._timer = 0;
        this._flashUp = BABYLON.Vector3.Up();
        this._disposeAfterFlash = false;
        this._update = () => {
            this._timer += this.getScene().getEngine().getDeltaTime() / 1000;
            let s = this.size * Math.sin(this._timer / this.lifespan * Math.PI);
            let target;
            if (this.scene.activeCameras && this.scene.activeCameras[0]) {
                target = this.scene.activeCameras[0].globalPosition;
            }
            else {
                target = this.scene.activeCamera.globalPosition;
            }
            let y = this._flashUp;
            let z = this.position.subtract(target);
            let x = BABYLON.Vector3.Cross(y, z);
            z = BABYLON.Vector3.Cross(x, y);
            this.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(x, y, z);
            if (this._timer < this.lifespan) {
                this.scaling.copyFromFloats(s, s, s);
            }
            else {
                this.scaling.copyFromFloats(this.size, this.size, this.size);
                if (this._timer > this.lifespan) {
                    this._timer = 0;
                    this.scaling.copyFromFloats(0, 0, 0);
                    this.getScene().onBeforeRenderObservable.removeCallback(this._update);
                    if (this._disposeAfterFlash) {
                        this.dispose();
                    }
                }
            }
        };
        let template = BABYLON.MeshBuilder.CreatePlane("template", { size: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
        let data = BABYLON.VertexData.ExtractFromMesh(template);
        data.applyToMesh(this);
        template.dispose();
        let material = new BABYLON.StandardMaterial(name + "-material", scene);
        material.diffuseTexture = new BABYLON.Texture("./assets/" + name + ".png", scene);
        material.diffuseTexture.hasAlpha = true;
        material.diffuseColor = BABYLON.Color3.FromHexString("#ffae70");
        material.specularColor.copyFromFloats(0, 0, 0);
        material.emissiveColor = material.diffuseColor;
        this.material = material;
        this.scaling.copyFromFloats(0, 0, 0);
        this.layerMask = 1;
    }
    destroy() {
        this.getScene().onBeforeRenderObservable.removeCallback(this._update);
        this.dispose();
    }
    flash(position, up, thenDispose) {
        if (this._timer > 0) {
            return;
        }
        this.position.copyFrom(position);
        this._flashUp.copyFrom(up);
        this._disposeAfterFlash = thenDispose;
        this.scaling.copyFromFloats(0, 0, 0);
        this.getScene().onBeforeRenderObservable.add(this._update);
    }
}
class Ground extends BABYLON.Mesh {
    constructor(size, main) {
        super("ground", main.scene);
        this.size = size;
        this.main = main;
        this.heightMap = [];
        this.colorMap = [];
    }
    async instantiate() {
        return new Promise(resolve => {
            let image = new Image(1024, 1024);
            image.onload = () => {
                let canvas = document.createElement("canvas");
                canvas.width = 1024;
                canvas.height = 1024;
                let ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0);
                let imageData = ctx.getImageData(0, 0, 1024, 1024);
                for (let i = 0; i <= this.size; i++) {
                    this.heightMap[i] = [];
                    this.colorMap[i] = [];
                    for (let j = 0; j <= this.size; j++) {
                        let di = Math.floor(i / this.size * 64);
                        let dj = Math.floor(j / this.size * 64);
                        let h = imageData.data[4 * (di + 1024 * dj)];
                        this.heightMap[i][j] = h / 256 * 60 - 30;
                        di = Math.floor(i / this.size * 32 + 128);
                        dj = Math.floor(j / this.size * 32 + 128);
                        let c = imageData.data[4 * (di + 1024 * dj)];
                        this.colorMap[i][j] = BABYLON.Color3.White();
                        c = c % 16;
                        c = Math.sin(c / 16 * Math.PI);
                        c = Math.round(c * c);
                        this.colorMap[i][j] = BABYLON.Color3.Lerp(this.colorMap[i][j], BABYLON.Color3.Green(), c);
                        if (h < 122) {
                            //this.colorMap[i][j] = BABYLON.Color3.Blue();
                        }
                    }
                }
                this.refreshMesh();
                resolve();
            };
            image.src = "assets/ground.png";
            let groundMaterial = new TerrainMaterial("ground-material", false, this.main.scene);
            groundMaterial.setTexture("colorTexture", new BABYLON.Texture("assets/ground_2.png", this.main.scene));
            this.material = groundMaterial;
        });
    }
    do(posI, posJ, r, callback) {
        for (let d = 1; d <= r; d++) {
            let f = (1 - d / r) * 2;
            f = Math.min(1, f);
            let iIndexes = [
                posI + d,
                posI + d,
                posI,
                posI - d,
                posI - d,
                posI
            ];
            let jIndexes = [
                posJ,
                posJ - d,
                posJ - d,
                posJ,
                posJ + d,
                posJ + d
            ];
            for (let p = 0; p < 6; p++) {
                let pi = iIndexes[p];
                let pj = jIndexes[p];
                let piNext = iIndexes[(p + 1) % 6];
                let pjNext = jIndexes[(p + 1) % 6];
                let di = (piNext - pi) / d;
                let dj = (pjNext - pj) / d;
                for (let n = 0; n < d; n++) {
                    if (pi + di * n >= 0 && pi + di * n <= this.size) {
                        if (pj + dj * n >= 0 && pj + dj * n <= this.size) {
                            callback(pi + di * n, pj + dj * n, d);
                        }
                    }
                }
            }
        }
    }
    flatten(posI, posJ, h, r) {
        this.heightMap[posI][posJ] = h;
        this.do(posI, posJ, r, (i, j, d) => {
            let f = (1 - d / r) * 2;
            f = Math.min(1, f);
            let th = this.heightMap[i][j];
            this.heightMap[i][j] = h * f + th * (1 - f);
        });
        this.refreshMesh();
    }
    colorize(posI, posJ, r, c) {
        this.colorMap[posI][posJ].copyFrom(c);
        this.do(posI, posJ, r, (i, j, d) => {
            this.colorMap[i][j].copyFrom(c);
        });
        this.refreshMesh();
    }
    refreshMesh() {
        let data = new BABYLON.VertexData();
        let positions = [];
        let indices = [];
        let uvs = [];
        let colors = [];
        let lx = 2;
        let lz = Math.sin(Math.PI / 3) * lx;
        let x0 = -lx * (this.size + this.size * 0.5) * 0.5;
        let z0 = -lz * this.size * 0.5;
        for (let i = 0; i <= this.size; i++) {
            for (let j = 0; j <= this.size; j++) {
                let n = i + j * (this.size + 1);
                positions.push(x0 + i * lx + j * lx * 0.5, this.heightMap[i][j], z0 + j * lz);
                uvs.push(2 * i / this.size, 2 * j / this.size);
                if (i < this.size && j < this.size) {
                    indices.push(n, n + this.size + 1, n + 1);
                    indices.push(n + 1, n + this.size + 1, n + this.size + 2);
                }
                let c = this.colorMap[i][j];
                colors.push(c.r, c.g, c.b, 1);
            }
        }
        for (let it = 0; it < 2; it++) {
            let newColors = [];
            for (let i = 0; i <= this.size; i++) {
                for (let j = 0; j <= this.size; j++) {
                    let n = i + j * (this.size + 1);
                    let r = colors[4 * n] * 3;
                    let g = colors[4 * n + 1] * 3;
                    let b = colors[4 * n + 2] * 3;
                    let iIndexes = [
                        i + 1,
                        i + 1,
                        i,
                        i - 1,
                        i - 1,
                        i
                    ];
                    let jIndexes = [
                        j,
                        j - 1,
                        j - 1,
                        j,
                        j + 1,
                        j + 1
                    ];
                    let count = 3;
                    for (let p = 0; p < 6; p++) {
                        let pi = iIndexes[p];
                        let pj = jIndexes[p];
                        let pn = pi + pj * (this.size + 1);
                        if (pn >= 0 && 4 * pn < colors.length) {
                            r += colors[4 * pn];
                            g += colors[4 * pn + 1];
                            b += colors[4 * pn + 2];
                            count++;
                        }
                    }
                    newColors[4 * n] = r / count;
                    newColors[4 * n + 1] = g / count;
                    newColors[4 * n + 2] = b / count;
                }
            }
            colors = newColors;
        }
        let normals = [];
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
        data.positions = positions;
        data.indices = indices;
        data.normals = normals;
        data.uvs = uvs;
        data.colors = colors;
        data.applyToMesh(this);
    }
    pos2DToIJ(pos2D) {
        let lx = 2;
        let lz = Math.sin(Math.PI / 3) * lx;
        let x0 = -lx * (this.size + this.size * 0.5) * 0.5;
        let z0 = -lz * this.size * 0.5;
        let j = Math.round((pos2D.y - z0) / lz);
        let i = Math.round((pos2D.x - j * lx / 2 - x0) / lx);
        return { i: i, j: j };
    }
    getHeightAt(a) {
        let pos2D;
        if (a instanceof BABYLON.Vector2) {
            pos2D = a;
        }
        else if (a instanceof BABYLON.Vector3) {
            pos2D = new BABYLON.Vector2(a.x, a.z);
        }
        let ray = new BABYLON.Ray(new BABYLON.Vector3(pos2D.x, 100, pos2D.y), BABYLON.Vector3.Down(), 200);
        let hit = ray.intersectsMesh(this.main.ground);
        if (hit.hit) {
            return hit.pickedPoint.y;
        }
        return 0;
    }
}
class Meteor extends BABYLON.Mesh {
    constructor(radius, destination2D, main, color, onLandCallback) {
        super("meteor", main.scene);
        this.radius = radius;
        this.main = main;
        this.color = color;
        this.onLandCallback = onLandCallback;
        this.landFlashes = [];
        this._update = () => {
            let dt = this.main.engine.getDeltaTime() / 1000;
            let dv = this.destination.subtract(this.position).normalize().scale(120 * dt);
            if (dv.y < 0) {
                this.position.addInPlace(dv);
            }
            else {
                if (this.onLandCallback) {
                    this.onLandCallback();
                }
                this.landDustParticleSystem.emitter = this.destination.add(new BABYLON.Vector3(0, 0.5, 0));
                this.landDustParticleSystem.createSphereEmitter(1, 0.5);
                this.landDustParticleSystem.start();
                //this.landFlashParticleSystem.emitter = this.destination.add(new BABYLON.Vector3(0, 0.3, 0));
                //this.landFlashParticleSystem.start();
                this.dispose();
                for (let i = 0; i < this.landFlashes.length; i++) {
                    let flashParticle = this.landFlashes[i];
                    let alpha = Math.random() * Math.PI * 2;
                    alpha = (i / this.landFlashes.length) * Math.PI * 2;
                    let cosa = Math.cos(alpha);
                    let sina = Math.sin(alpha);
                    let beta = Math.random() * Math.PI / 4;
                    let cosb = Math.cos(beta);
                    let sinb = Math.sin(beta);
                    let dir = new BABYLON.Vector3(cosa * cosb, sinb, sina * cosb);
                    flashParticle.flash(this.destination.add(new BABYLON.Vector3(cosa, 0, sina)), dir, true);
                }
            }
        };
        this.destination = new BABYLON.Vector3(destination2D.x, this.main.ground.getHeightAt(destination2D), destination2D.y);
        this.position.copyFrom(this.destination);
        this.position.x += -10 + 20 * Math.random();
        this.position.y += 50;
        this.position.z += -10 + 20 * Math.random();
        this.landDustParticleSystem = new BABYLON.ParticleSystem("land-dust", 70, this.main.scene);
        this.landDustParticleSystem.particleTexture = new BABYLON.Texture("assets/dust.png", this.main.scene);
        this.landDustParticleSystem.targetStopDuration = 1;
        this.landDustParticleSystem.maxLifeTime = 0.75;
        this.landDustParticleSystem.maxLifeTime = 1.5;
        this.landDustParticleSystem.minAngularSpeed = Math.PI / 4;
        this.landDustParticleSystem.maxAngularSpeed = Math.PI;
        this.landDustParticleSystem.addSizeGradient(0, 0.4 * this.radius);
        this.landDustParticleSystem.addSizeGradient(0.05, 2 * this.radius);
        this.landDustParticleSystem.addSizeGradient(1, 0.1 * this.radius);
        this.landDustParticleSystem.color1 = new BABYLON.Color4(1, 1, 1, 1);
        this.landDustParticleSystem.color2 = new BABYLON.Color4(1, 1, 1, 1);
        this.landDustParticleSystem.emitRate = 1000;
        this.landDustParticleSystem.startDirectionFunction = (worldMatrix, directionToUpdate, particle) => {
            directionToUpdate.copyFromFloats(-0.5 + Math.random(), 0.4 * Math.random(), -0.5 + Math.random()).scaleInPlace(4 * this.radius);
        };
        /*
        this.landFlashParticleSystem = new BABYLON.ParticleSystem("land-flash", 100, this.main.scene);
        this.landFlashParticleSystem.particleTexture = new BABYLON.Texture("assets/bang.png", this.main.scene);
        this.landFlashParticleSystem.targetStopDuration = 0.1;

        this.landFlashParticleSystem.isBillboardBased = true;

        this.landFlashParticleSystem.minLifeTime = 0.3 * 0.5;
        this.landFlashParticleSystem.maxLifeTime = 0.3 * 0.5;

        this.landFlashParticleSystem.minAngularSpeed = 0;
        this.landFlashParticleSystem.maxAngularSpeed = 0;

        this.landFlashParticleSystem.minSize = 0.2;
        this.landFlashParticleSystem.maxSize = 0.4;

        this.landFlashParticleSystem.addColorGradient(0, new BABYLON.Color4(1, 0, 0, 1));
        this.landFlashParticleSystem.addColorGradient(1, new BABYLON.Color4(1, 0, 0, 1));

        this.landFlashParticleSystem.emitRate = 1000;

        this.landFlashParticleSystem.startDirectionFunction = (worldMatrix: BABYLON.Matrix, directionToUpdate: BABYLON.Vector3, particle: BABYLON.Particle) => {
            let alpha = Math.random() * Math.PI * 2;
            let cosa = Math.cos(alpha);
            let sina = Math.sin(alpha);
            let beta = Math.random() * Math.PI / 8;
            let cosb = Math.cos(beta);
            let sinb = Math.sin(beta);
            directionToUpdate.copyFromFloats(
                cosa * cosb,
                sinb,
                sina * cosb
            ).scaleInPlace((12 + Math.random() * 12) * this.radius);
        }
        */
        for (let i = 0; i < 25; i++) {
            this.landFlashes.push(new FlashParticle("pew", this.main.scene, 6 + 3 * Math.random(), 0.2 + 0.1 * Math.random()));
        }
    }
    instantiate() {
        BABYLON.VertexData.CreateSphere({ diameter: 2 * this.radius }).applyToMesh(this);
        let meteorMaterial = new ToonMaterial("meteor-material", false, this.main.scene);
        if (this.color) {
            meteorMaterial.setColor(this.color);
        }
        this.material = meteorMaterial;
        this.main.scene.onBeforeRenderObservable.add(this._update);
    }
    dispose(doNotRecurse, disposeMaterialAndTextures) {
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
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
var RobotMode;
(function (RobotMode) {
    RobotMode[RobotMode["Walk"] = 0] = "Walk";
    RobotMode[RobotMode["Run"] = 1] = "Run";
})(RobotMode || (RobotMode = {}));
class RobotTarget extends BABYLON.Mesh {
    constructor(robot) {
        super("target");
        this.robot = robot;
        this._pos2D = BABYLON.Vector2.Zero();
        this.targets = [];
        let positions = [
            new BABYLON.Vector2(0.8, 0),
            new BABYLON.Vector2(-0.8, 0)
        ];
        for (let i = 0; i < 2; i++) {
            let target = new BABYLON.Mesh("target-" + i);
            target.position.x = positions[i].x;
            target.position.z = positions[i].y;
            target.parent = this;
            this.targets[i] = target;
            //BABYLON.VertexData.CreateBox({ width: 0.2, height: 20, depth: 0.2 }).applyToMesh(target);
        }
    }
    get pos2D() {
        this._pos2D.x = this.position.x;
        this._pos2D.y = this.position.z;
        return this._pos2D;
    }
    get posX() {
        return this.position.x;
    }
    set posX(x) {
        this.position.x = x;
    }
    get posY() {
        return this.position.z;
    }
    set posY(y) {
        this.position.z = y;
    }
    get rot() {
        return this.rotation.y;
    }
    set rot(r) {
        this.rotation.y = r;
    }
    dispose(doNotRecurse, disposeMaterialAndTextures) {
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
        for (let i = 0; i < this.targets.length; i++) {
            this.targets[i].dispose();
        }
    }
}
class Robot extends GameObject {
    constructor(main) {
        super(main);
        this.meshes = [];
        this.mode = RobotMode.Walk;
        this._inputDirs = new UniqueList();
        this._inputForwardAxis = 0;
        this._inputSideAxis = 0;
        this._inputRotateAxis = 0;
        this.hitpoint = 10;
        this.hitpointMax = 10;
        this._update = () => {
            this._generateInputs();
            this._updateLegTarget();
            this._updateLegMove();
            this._updatePath();
            this._updateCollisions();
            this._updateMesh();
        };
        this._movingLegCount = 0;
        this._movingLegs = new UniqueList();
        this._abortLegMove = false;
        this._currentLegIndex = 0;
        this._bodyVelocity = BABYLON.Vector3.Zero();
        this._handVelocities = [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()];
        this._dragFactor = 1;
        this.target = new RobotTarget(this);
        this.footImpactParticle = new BABYLON.ParticleSystem("particles", 20, this.main.scene);
        this.footImpactParticle.particleTexture = new BABYLON.Texture("assets/dust.png", this.main.scene);
        this.footImpactParticle.targetStopDuration = 0.3;
        this.footImpactParticle.maxLifeTime = 0.3;
        this.footImpactParticle.addSizeGradient(0, 0);
        this.footImpactParticle.addSizeGradient(0.1, 0);
        this.footImpactParticle.addSizeGradient(0.2, 1);
        this.footImpactParticle.addSizeGradient(1, 0);
        this.footImpactParticle.addVelocityGradient(0, 5);
        this.footImpactParticle.addVelocityGradient(0.1, 5);
        this.footImpactParticle.addVelocityGradient(0.2, 1);
        this.footImpactParticle.addVelocityGradient(1, 0.5);
        this.footImpactParticle.minAngularSpeed = Math.PI / 4;
        this.footImpactParticle.maxAngularSpeed = Math.PI;
        this.footImpactParticle.color1 = new BABYLON.Color4(1, 1, 1, 1);
        this.footImpactParticle.color2 = new BABYLON.Color4(1, 1, 1, 1);
        this.footImpactParticle.emitRate = 1000;
    }
    async instantiate() {
        return new Promise(resolve => {
            BABYLON.SceneLoader.ImportMesh("", "assets/robot.babylon", "", this.main.scene, (meshes) => {
                this.meshes = [];
                this.head = meshes.find(m => { return m.name === "head"; });
                this.meshes.push(this.head);
                this.body = meshes.find(m => { return m.name === "body"; });
                this.meshes.push(this.body);
                this.feet = [
                    meshes.find(m => { return m.name === "foot-right"; }),
                    meshes.find(m => { return m.name === "foot-left"; })
                ];
                this.meshes.push(...this.feet);
                this.feet[0].rotationQuaternion = BABYLON.Quaternion.Identity();
                this.feet[1].rotationQuaternion = BABYLON.Quaternion.Identity();
                this.legs = [
                    meshes.find(m => { return m.name === "leg-right"; }),
                    meshes.find(m => { return m.name === "leg-left"; })
                ];
                this.meshes.push(...this.legs);
                this.upperLegs = [
                    meshes.find(m => { return m.name === "upper-leg-right"; }),
                    meshes.find(m => { return m.name === "upper-leg-left"; })
                ];
                this.meshes.push(...this.upperLegs);
                this.upperLegsRoot = [
                    new BABYLON.Mesh("upper-leg-root-0"),
                    new BABYLON.Mesh("upper-leg-root-1"),
                ];
                this.meshes.push(...this.upperLegsRoot);
                this.upperLegsRoot[0].position.copyFrom(this.upperLegs[0].position);
                this.upperLegsRoot[0].parent = this.body;
                this.upperLegsRoot[1].position.copyFrom(this.upperLegs[1].position);
                this.upperLegsRoot[1].parent = this.body;
                this.upperLegs[0].parent = undefined;
                this.upperLegs[1].parent = undefined;
                this.hands = [
                    meshes.find(m => { return m.name === "hand-right"; }),
                    meshes.find(m => { return m.name === "hand-left"; })
                ];
                this.meshes.push(...this.hands);
                this.arms = [
                    meshes.find(m => { return m.name === "arm-right"; }),
                    meshes.find(m => { return m.name === "arm-left"; })
                ];
                this.meshes.push(...this.arms);
                this.upperArms = [
                    meshes.find(m => { return m.name === "upper-arm-right"; }),
                    meshes.find(m => { return m.name === "upper-arm-left"; })
                ];
                this.meshes.push(...this.upperArms);
                this.upperArmsRoot = [
                    new BABYLON.Mesh("upper-arm-root-0"),
                    new BABYLON.Mesh("upper-arm-root-1"),
                ];
                this.meshes.push(...this.upperArmsRoot);
                this.upperArmsRoot[0].position.copyFrom(this.upperArms[0].position);
                this.upperArmsRoot[0].parent = this.body;
                this.upperArmsRoot[1].position.copyFrom(this.upperArms[1].position);
                this.upperArmsRoot[1].parent = this.body;
                this.upperArms[0].parent = undefined;
                this.upperArms[1].parent = undefined;
                for (let i = 0; i < meshes.length; i++) {
                    let mesh = meshes[i];
                    if (mesh.material instanceof BABYLON.PBRMaterial) {
                        let toonMaterial = new ToonMaterial(mesh.material.name + "-toon", false, this.main.scene);
                        if (mesh.material.name === "RobotMaterial") {
                            toonMaterial.setTexture("colorTexture", new BABYLON.Texture("assets/robot-texture.png", this.main.scene));
                        }
                        toonMaterial.setColor(mesh.material.albedoColor);
                        mesh.material = toonMaterial;
                    }
                }
                this.main.scene.onBeforeRenderObservable.add(this._update);
                this.isInstantiated = true;
                resolve();
            });
        });
    }
    dispose() {
        super.dispose();
        this._abortLegMove = true;
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
        this.target.dispose();
        this.footImpactParticle.dispose();
        for (let i = 0; i < this.meshes.length; i++) {
            this.meshes[i].dispose();
        }
    }
    _generateInputs() {
        if (this.currentPath && this.currentPath.length > 0) {
            let next = this.currentPath[0];
            let distanceToNext = Math2D.Distance(this.target.pos2D, next);
            if (distanceToNext <= 1) {
                this.currentPath.splice(0, 1);
                return this._generateInputs();
            }
            let stepToNext = next.subtract(this.target.pos2D).normalize();
            let targetRot = -Math2D.AngleFromTo(new BABYLON.Vector2(0, 1), stepToNext);
            let dRot = -Math2D.AngularDistance(this.target.rotation.y, targetRot);
            let dRotFactor = Math.abs(dRot) / (Math.PI * (this.mode === RobotMode.Walk ? 0.5 : 1.5));
            dRotFactor = Math.min(Math.max(1 - dRotFactor, 0), 1);
            this._inputForwardAxis = dRotFactor;
            this._inputDirs.remove(4);
            this._inputDirs.remove(5);
            if (dRot < 0) {
                this._inputDirs.push(5);
            }
            if (dRot > 0) {
                this._inputDirs.push(4);
            }
        }
    }
    _updateLegTarget() {
        let forwardSpeed = 0;
        if (this._inputForwardAxis > 0) {
            forwardSpeed = (1 + (this.mode === RobotMode.Run ? 3 : 0)) * this._inputForwardAxis;
        }
        else if (this._inputForwardAxis < 0) {
            forwardSpeed = -0.5 * this._inputForwardAxis;
        }
        forwardSpeed *= this._dragFactor;
        let rotateSpeed = this._inputRotateAxis * 0.1;
        let sideSpeed = 2 * this._inputSideAxis;
        if (this._inputDirs.contains(0)) {
            sideSpeed = 2;
        }
        if (this._inputDirs.contains(1)) {
            forwardSpeed = -0.5;
        }
        if (this._inputDirs.contains(2)) {
            sideSpeed = -2;
        }
        if (this._inputDirs.contains(3)) {
            forwardSpeed = 1;
        }
        if (this._inputDirs.contains(4)) {
            rotateSpeed = 0.4;
        }
        if (this._inputDirs.contains(5)) {
            rotateSpeed = -0.4;
        }
        this.target.position.addInPlace(this.target.forward.scale(forwardSpeed * this.main.scene.getEngine().getDeltaTime() / 1000));
        this.target.position.addInPlace(this.target.right.scale(sideSpeed * this.main.scene.getEngine().getDeltaTime() / 1000));
        this.target.rotation.y -= rotateSpeed * Math.PI * this.main.scene.getEngine().getDeltaTime() / 1000;
        let f0ry = VMath.AngleFromToAround(BABYLON.Axis.Z, this.feet[0].forward, BABYLON.Axis.Y);
        let f1ry = VMath.AngleFromToAround(BABYLON.Axis.Z, this.feet[1].forward, BABYLON.Axis.Y);
        this.target.rotation.y = Math2D.AngularClamp(f1ry - Math.PI / 8, f0ry + Math.PI / 8, this.target.rotation.y);
        while (this.target.rotation.y < 0) {
            this.target.rotation.y += 2 * Math.PI;
        }
        while (this.target.rotation.y >= 2 * Math.PI) {
            this.target.rotation.y -= 2 * Math.PI;
        }
    }
    async _moveLeg(legIndex, target, targetQ) {
        return new Promise(resolve => {
            this._movingLegs.push(legIndex);
            let origin = this.feet[legIndex].position.clone();
            let originQ = this.feet[legIndex].rotationQuaternion.clone();
            let l = target.subtract(origin).length();
            let duration = 1.5;
            if (this.mode === RobotMode.Run) {
                duration = 0.6;
            }
            let t = 0;
            let step = () => {
                if (this._abortLegMove) {
                    requestAnimationFrame(() => {
                        this._abortLegMove = false;
                        this._movingLegCount -= 1;
                        this._movingLegs.remove(legIndex);
                    });
                    return;
                }
                t += this.main.scene.getEngine().getDeltaTime() / 1000;
                let d = t / duration;
                if (this.mode === RobotMode.Walk) {
                    d = d * d;
                }
                else {
                    d = Math.pow(d, 1.5);
                }
                d = Math.min(d, 1);
                this.feet[legIndex].position.copyFrom(origin.scale(1 - d).add(target.scale(d)));
                if (legIndex === 0) {
                    this.feet[legIndex].position.addInPlace(this.target.right.scale((this.mode === RobotMode.Walk ? 1 : 0.6) * Math.sin(Math.PI * d)));
                }
                else {
                    this.feet[legIndex].position.addInPlace(this.target.right.scale(-(this.mode === RobotMode.Walk ? 1 : 0.6) * Math.sin(Math.PI * d)));
                }
                this.feet[legIndex].position.y += (this.mode === RobotMode.Walk ? 0.65 : 0.4) * Math.sin(Math.PI * d) * this._dragFactor;
                this.feet[legIndex].rotationQuaternion = BABYLON.Quaternion.Slerp(originQ, targetQ, d);
                if (d < 1) {
                    requestAnimationFrame(step);
                }
                else {
                    this._movingLegCount -= 1;
                    this._movingLegs.remove(legIndex);
                    this.footImpactParticle.emitter = this.feet[legIndex].position.subtract(this.feet[legIndex].up.scale(0.4));
                    this.footImpactParticle.startDirectionFunction = (worldMatrix, directionToUpdate, particle) => {
                        let a = 2 * Math.PI * Math.random();
                        let b = Math.PI / 16;
                        let right = this.feet[legIndex].right.scale(Math.cos(a) * Math.cos(b));
                        let up = this.feet[legIndex].up.scale(Math.sin(b));
                        let forward = this.feet[legIndex].forward.scale(Math.sin(a) * Math.cos(b));
                        directionToUpdate.copyFrom(right).addInPlace(up).addInPlace(forward).scaleInPlace(1);
                    };
                    this.footImpactParticle.start();
                    resolve();
                }
            };
            step();
        });
    }
    _updateLegMove() {
        if (this._movingLegCount <= 0) {
            let fp = this.feet[this._currentLegIndex].position.clone();
            fp.y = 0;
            let ft = this.target.targets[this._currentLegIndex].absolutePosition.clone();
            ft.y = 0;
            let dist = BABYLON.Vector3.DistanceSquared(fp, ft);
            if (dist > 0.05) {
                let ray = new BABYLON.Ray(this.target.targets[this._currentLegIndex].absolutePosition.add(BABYLON.Axis.Y.scale(100)), BABYLON.Vector3.Down(), 200);
                let hit = ray.intersectsMesh(this.main.ground);
                if (hit.hit) {
                    this._movingLegCount++;
                    let fy = hit.getNormal(true, true);
                    let fz = this.target.forward;
                    let fx = BABYLON.Vector3.Cross(fy, fz);
                    fz = BABYLON.Vector3.Cross(fx, fy);
                    this._moveLeg(this._currentLegIndex, hit.pickedPoint.add(new BABYLON.Vector3(0, 0.4, 0)), BABYLON.Quaternion.RotationQuaternionFromAxis(fx, fy, fz).multiply(BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, (this._currentLegIndex === 0 ? 1 : -1) * Math.PI / 6)));
                    this._currentLegIndex = (this._currentLegIndex + 1) % 2;
                }
            }
        }
    }
    _updatePath() {
        /*
        if (!this.currentTarget) {
            this.currentTarget = this.main.gameObjects.find(go => { return go instanceof CommandCenter; });
        }
        if (this.currentTarget) {
            let navGraph = NavGraphManager.GetForRadius(2);
            navGraph.update();
            this.currentPath = navGraph.computePathFromTo(this.target.pos2D, this.currentTarget.pos2D);
        }
        */
        if (!this.currentPath || this.currentPath.length === 0) {
            let navGraph = NavGraphManager.GetForRadius(2);
            navGraph.update();
            let rand = new BABYLON.Vector2(-30 + 60 * Math.random(), -30 + 60 * Math.random());
            this.currentPath = navGraph.computePathFromTo(this.target.pos2D, rand);
        }
    }
    _updateCollisions() {
        let robots = this.main.gameObjects.filter(g => { return g instanceof Robot; });
        let d = BABYLON.Vector3.Zero();
        let n = 0;
        for (let i = 0; i < robots.length; i++) {
            let other = robots[i];
            if (other != this && other.body) {
                let bp = this.body.position.clone();
                bp.y = 0;
                let op = other.body.position.clone();
                op.y = 0;
                let sqrDist = BABYLON.Vector3.Distance(bp, op);
                if (sqrDist < 4) {
                    let l = Math.sqrt(sqrDist);
                    let v = bp.subtract(op).normalize().scaleInPlace(2 - l);
                    d.addInPlace(v);
                    n++;
                }
            }
        }
        if (n > 0) {
            d.scaleInPlace(1 / n);
            d.scaleInPlace(0.5);
            this.body.position.addInPlace(d);
            this.feet[0].position.addInPlace(d);
            this.feet[1].position.addInPlace(d);
            d.scaleInPlace(0.5);
            this.target.position.addInPlace(d);
        }
    }
    _updateMesh() {
        if (this.isDisposed) {
            return;
        }
        let dt = this.main.engine.getDeltaTime() / 1000;
        this._dragFactor = Math.min(this._dragFactor + 0.25 * dt, 1);
        let bodyH = this.mode === RobotMode.Walk ? 1.8 : 1.6;
        let targetBody = this.feet[0].absolutePosition.add(this.feet[1].absolutePosition).scaleInPlace(0.5);
        targetBody.addInPlace(this.body.forward.scale(this.mode === RobotMode.Walk ? 0.5 : 1.2));
        targetBody.y += bodyH;
        let fBody = targetBody.subtract(this.body.position);
        this._bodyVelocity.addInPlace(fBody.scaleInPlace((this.mode === RobotMode.Walk ? 0.5 : 2) * dt));
        this._bodyVelocity.scaleInPlace((this.mode === RobotMode.Walk ? 0.97 : 0.9) * this._dragFactor);
        this.body.position.addInPlace(this._bodyVelocity);
        let dot = BABYLON.Vector3.Dot(this.feet[1].position.subtract(this.feet[0].position).normalize(), this.body.forward);
        let dy = this.feet[0].position.y - this.feet[1].position.y;
        let targetRotX = (this.body.position.y - Math.min(this.feet[0].position.y, this.feet[1].position.y) - bodyH) * Math.PI / 10;
        this.body.rotation.x = Math2D.LerpFromToCircular(this.body.rotation.x, targetRotX, 0.1);
        this.body.rotation.y = Math2D.LerpFromToCircular(this.body.rotation.y, this.target.rotation.y + dot * (this.mode === RobotMode.Walk ? Math.PI / 10 : Math.PI / 6), 0.2);
        this.body.rotation.z = dy * Math.PI / 10;
        this.head.position.copyFrom(this.body.position);
        this.head.position.addInPlace(this.body.forward.scale(1.1));
        if (this.currentPath && this.currentPath[0]) {
            let z = new BABYLON.Vector3(this.currentPath[0].x, 0.5, this.currentPath[0].y).subtract(this.head.position);
            let x = BABYLON.Vector3.Cross(BABYLON.Axis.Y, z);
            let y = BABYLON.Vector3.Cross(z, x);
            let targetQ = BABYLON.Quaternion.RotationQuaternionFromAxis(x, y, z);
            let a = VMath.Angle(this.body.forward, z);
            let bodyQ = BABYLON.Quaternion.FromEulerVector(this.body.rotation);
            let f = Math.min(1, (Math.PI / 4) / a);
            targetQ = BABYLON.Quaternion.Slerp(bodyQ, targetQ, f);
            if (!this.head.rotationQuaternion) {
                this.head.rotationQuaternion = targetQ;
            }
            this.head.rotationQuaternion = BABYLON.Quaternion.Slerp(this.head.rotationQuaternion, targetQ, 0.1);
        }
        let handTargets = [this.body.position.clone(), this.body.position.clone()];
        handTargets[0].addInPlace(this.body.right.scale(1.2));
        handTargets[0].addInPlace(BABYLON.Axis.Y.scale(-0.8));
        handTargets[0].addInPlace(this.body.forward.scale(1.5 + 0.5 * dot));
        handTargets[1].addInPlace(this.body.right.scale(-1.2));
        handTargets[1].addInPlace(BABYLON.Axis.Y.scale(-0.8));
        handTargets[1].addInPlace(this.body.forward.scale(1.5 - 0.5 * dot));
        for (let i = 0; i < 2; i++) {
            let fHand = handTargets[i].subtract(this.hands[i].position);
            this._handVelocities[i].addInPlace(fHand.scaleInPlace(3 * dt));
            this._handVelocities[i].scaleInPlace(0.7 * this._dragFactor);
            this.hands[i].position.addInPlace(this._handVelocities[i]);
        }
        let kneeTargets = [this.body.position.clone(), this.body.position.clone()];
        kneeTargets[0].addInPlace(this.body.forward.scale(-5));
        kneeTargets[0].addInPlace(this.body.right.scale(2.5));
        kneeTargets[1].addInPlace(this.body.forward.scale(-5));
        kneeTargets[1].addInPlace(this.body.right.scale(-2.5));
        let upperLegLength = 1.17;
        let legLength = 1.25;
        let elbowTargets = [this.body.position.clone(), this.body.position.clone()];
        elbowTargets[0].addInPlace(this.body.forward.scale(-2.5));
        elbowTargets[0].addInPlace(this.body.right.scale(5));
        elbowTargets[1].addInPlace(this.body.forward.scale(-2.5));
        elbowTargets[1].addInPlace(this.body.right.scale(-5));
        let upperArmLength = 0.72;
        let armLength = 0.77;
        for (let i = 0; i < 2; i++) {
            let k = kneeTargets[i];
            let h = this.upperLegsRoot[i].absolutePosition;
            let f = this.feet[i].position;
            for (let n = 0; n < 3; n++) {
                let hk = k.subtract(h).normalize().scale(upperLegLength);
                k = h.add(hk);
                let fk = k.subtract(f).normalize().scale(legLength);
                k = f.add(fk);
            }
            let upperLegY = k.subtract(f);
            let upperLegZ = k.subtract(h);
            let upperLegX = BABYLON.Vector3.Cross(upperLegY, upperLegZ);
            upperLegY = BABYLON.Vector3.Cross(upperLegZ, upperLegX);
            BABYLON.Vector3.LerpToRef(this.upperLegs[i].position, h, 1, this.upperLegs[i].position);
            if (!this.upperLegs[i].rotationQuaternion) {
                this.upperLegs[i].rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(upperLegX, upperLegY, upperLegZ);
            }
            BABYLON.Quaternion.SlerpToRef(this.upperLegs[i].rotationQuaternion, BABYLON.Quaternion.RotationQuaternionFromAxis(upperLegX, upperLegY, upperLegZ), 1, this.upperLegs[i].rotationQuaternion);
            let legY = h.subtract(k);
            let legZ = f.subtract(k);
            let legX = BABYLON.Vector3.Cross(legY, legZ);
            legY = BABYLON.Vector3.Cross(legZ, legX);
            BABYLON.Vector3.LerpToRef(this.legs[i].position, k, 1, this.legs[i].position);
            if (!this.legs[i].rotationQuaternion) {
                this.legs[i].rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(legX, legY, legZ);
            }
            BABYLON.Quaternion.SlerpToRef(this.legs[i].rotationQuaternion, BABYLON.Quaternion.RotationQuaternionFromAxis(legX, legY, legZ), 1, this.legs[i].rotationQuaternion);
            let e = elbowTargets[i];
            let s = this.upperArmsRoot[i].absolutePosition;
            let ha = this.hands[i].position;
            for (let n = 0; n < 3; n++) {
                let se = e.subtract(s).normalize().scale(upperArmLength);
                e = s.add(se);
                let hae = e.subtract(ha).normalize().scale(armLength);
                e = ha.add(hae);
            }
            let upperArmY = e.subtract(ha);
            let upperArmZ = e.subtract(s);
            let upperArmX = BABYLON.Vector3.Cross(upperArmY, upperArmZ);
            upperArmY = BABYLON.Vector3.Cross(upperArmZ, upperArmX);
            this.upperArms[i].position.copyFrom(s);
            this.upperArms[i].rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(upperArmX, upperArmY, upperArmZ);
            let armY = e.subtract(s);
            let armZ = ha.subtract(e);
            let armX = BABYLON.Vector3.Cross(armY, armZ);
            armY = BABYLON.Vector3.Cross(armZ, armX);
            this.arms[i].position.copyFrom(e);
            this.arms[i].rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(armX, armY, armZ);
            this.hands[i].rotationQuaternion = this.arms[i].rotationQuaternion;
        }
    }
    foldAt(pos2D) {
        let h = this.main.ground.getHeightAt(pos2D);
        this.body.position.x = pos2D.x;
        this.body.position.y = h;
        this.body.position.z = pos2D.y;
        this.feet[0].position.copyFrom(this.body.position);
        this.feet[1].position.copyFrom(this.body.position);
        this.feet[0].position.addInPlace(this.body.right.scale(0.5));
        this.feet[1].position.subtractInPlace(this.body.right.scale(0.5));
        this.hands[0].position.copyFrom(this.body.position);
        this.hands[1].position.copyFrom(this.body.position);
        this.body.position.y += 0.6;
        this.feet[0].position.y = this.main.ground.getHeightAt(this.feet[0].position) + 0.4;
        this.feet[1].position.y = this.main.ground.getHeightAt(this.feet[1].position) + 0.4;
        this.target.posX = pos2D.x;
        this.target.posY = pos2D.y;
        this.target.computeWorldMatrix(true);
        this._abortLegMove = true;
        this._dragFactor = 0;
    }
    wound(n) {
        this.hitpoint -= n;
        if (this.hitpoint <= 0) {
            this.main.game.credit(10);
            this.dispose();
        }
    }
}
class Sprite extends BABYLON.Mesh {
    constructor(name, url, scene, length) {
        super(name, scene);
        this.height = 1;
        this._pos2D = BABYLON.Vector2.Zero();
        this._update = () => {
            this.shadowMesh.position.x = this.absolutePosition.x + 0.5 * this.height / 5;
            this.shadowMesh.position.z = this.absolutePosition.z - 0.3 * this.height / 5;
            this.shadowMesh.position.y = Sprite.SHADOW_Y;
            this.shadowMesh.rotation.y = this.rotation.y;
            let parent = this.parent;
            while (parent && parent instanceof BABYLON.Mesh) {
                this.shadowMesh.rotation.y += parent.rotation.y;
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
        this._pos2D.y = this.position.z;
        return this._pos2D;
    }
    get posX() {
        return this.position.x;
    }
    set posX(x) {
        this.position.x = x;
    }
    get posY() {
        return this.position.z;
    }
    set posY(y) {
        this.position.z = y;
    }
    get rot() {
        return this.rotation.y;
    }
    set rot(r) {
        this.rotation.y = r;
    }
    refreshMesh(length) {
        let size = this.spriteMaterial.diffuseTexture.getBaseSize();
        let quadData;
        if (isFinite(length)) {
            quadData = SpriteUtils.CreatePlaneData(length, size.height / 100, new BABYLON.Vector4(0, 0, length / (size.width / 100), 1));
        }
        else {
            quadData = BABYLON.VertexData.CreatePlane({ width: size.width / 100, height: size.height / 100 });
            quadData = SpriteUtils.CreatePlaneData(size.width / 100, size.height / 100);
        }
        quadData.applyToMesh(this);
        if (this.position.y === 0) {
            this.position.y = Sprite.QUAD_Y;
        }
        quadData.applyToMesh(this.shadowMesh);
        this.shadowMesh.position.y = Sprite.SHADOW_Y;
    }
    dispose(doNotRecurse, disposeMaterialAndTextures) {
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
        this.shadowMesh.dispose(doNotRecurse, disposeMaterialAndTextures);
        this.getScene().onBeforeRenderObservable.removeCallback(this._update);
    }
}
Sprite.SHADOW_Y = 0.1;
Sprite.QUAD_Y = 0.2;
Sprite.LEVEL_STEP = 0.1;
class ToonMaterial extends BABYLON.ShaderMaterial {
    constructor(name, transparent, scene) {
        super(name, scene, {
            vertex: "toon",
            fragment: "toon",
        }, {
            attributes: ["position", "normal", "uv"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"],
            samplers: ["colorTexture"]
        });
        this.setTexture("colorTexture", new BABYLON.Texture("assets/empty.png", scene));
        this.setVector3("lightInvDirW", (new BABYLON.Vector3(-1, 1, -1)).normalize());
    }
    setColor(color) {
        this.setColor3("mColor", color);
    }
}
class TerrainMaterial extends BABYLON.ShaderMaterial {
    constructor(name, transparent, scene) {
        super(name, scene, {
            vertex: "terrain-toon",
            fragment: "terrain-toon",
        }, {
            attributes: ["position", "normal", "uv", "color"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "vColorW", "vColorR", "vColorG", "vColorB", "vColorU"],
            samplers: ["colorTexture"]
        });
        this.setTexture("colorTexture", new BABYLON.Texture("assets/empty.png", scene));
        this.setVector3("lightInvDirW", (new BABYLON.Vector3(-1, 1, -1)).normalize());
        this.setColor4("vColorW", new BABYLON.Color4(1, 1, 1, 1));
        this.setColor4("vColorR", new BABYLON.Color4(95 / 255, 16 / 255, 10 / 255, 1));
        this.setColor4("vColorG", new BABYLON.Color4(144 / 255, 24 / 255, 11 / 255, 1));
        this.setColor4("vColorB", new BABYLON.Color4(211 / 255, 113 / 255, 63 / 255, 1));
        this.setColor4("vColorU", new BABYLON.Color4(30 / 255, 30 / 255, 30 / 255, 1));
    }
}
class WalkerTarget extends BABYLON.Mesh {
    constructor(walker) {
        super("target");
        this.walker = walker;
        this._pos2D = BABYLON.Vector2.Zero();
        this.targets = [];
        let positions = [
            new BABYLON.Vector2(-1, 0),
            new BABYLON.Vector2(1, 0)
        ];
        for (let i = 0; i < walker.legCount; i++) {
            let target = new BABYLON.Mesh("target-" + i);
            target.position.x = positions[i].x;
            target.position.z = positions[i].y;
            target.parent = this;
            this.targets[i] = target;
        }
    }
    get pos2D() {
        this._pos2D.x = this.position.x;
        this._pos2D.y = this.position.z;
        return this._pos2D;
    }
    get posX() {
        return this.position.x;
    }
    set posX(x) {
        this.position.x = x;
    }
    get posY() {
        return this.position.z;
    }
    set posY(y) {
        this.position.z = y;
    }
    get rot() {
        return this.rotation.y;
    }
    set rot(r) {
        this.rotation.y = r;
    }
}
class Walker extends GameObject {
    constructor(main) {
        super(main);
        this.legCount = 2;
        this.arms = [];
        this.feet = [];
        this._inputDirs = new UniqueList();
        this._inputForwardAxis = 0;
        this._inputSideAxis = 0;
        this._inputRotateAxis = 0;
        this.hitpoint = 10;
        this.hitpointMax = 10;
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
            let forwardSpeed = 0;
            if (this._inputForwardAxis > 0) {
                forwardSpeed = 1 * this._inputForwardAxis;
                this._bodySpeed = 1 + 2 * this._inputForwardAxis;
                this._armSpeed = 1 + 4 * this._inputForwardAxis;
            }
            else if (this._inputForwardAxis < 0) {
                forwardSpeed = -0.5 * this._inputForwardAxis;
            }
            let rotateSpeed = this._inputRotateAxis * 0.4;
            let sideSpeed = 2 * this._inputSideAxis;
            if (this._inputDirs.contains(0)) {
                sideSpeed = 2;
            }
            if (this._inputDirs.contains(1)) {
                forwardSpeed = -0.5;
            }
            if (this._inputDirs.contains(2)) {
                sideSpeed = -2;
            }
            if (this._inputDirs.contains(3)) {
                forwardSpeed = 1;
                this._bodySpeed = 3;
                this._armSpeed = 5;
            }
            if (this._inputDirs.contains(4)) {
                rotateSpeed = 0.4;
            }
            if (this._inputDirs.contains(5)) {
                rotateSpeed = -0.4;
            }
            this.target.position.addInPlace(this.target.forward.scale(forwardSpeed * this.main.scene.getEngine().getDeltaTime() / 1000));
            this.target.position.addInPlace(this.target.right.scale(sideSpeed * this.main.scene.getEngine().getDeltaTime() / 1000));
            this.target.rotation.y -= rotateSpeed * Math.PI * this.main.scene.getEngine().getDeltaTime() / 1000;
            while (this.target.rotation.y < 0) {
                this.target.rotation.y += 2 * Math.PI;
            }
            while (this.target.rotation.y >= 2 * Math.PI) {
                this.target.rotation.y -= 2 * Math.PI;
            }
            this.sprite.position.copyFrom(this.feet[0].position);
            for (let i = 1; i < this.legCount; i++) {
                this.sprite.position.addInPlace(this.feet[i].position);
            }
            this.sprite.position.scaleInPlace(1 / this.legCount);
            this.sprite.position.x += Math.cos(1 * this._bodyT * Math.PI) * 0.1;
            this.sprite.position.z += Math.cos(1.1 * this._bodyT * Math.PI) * 0.1;
            this.sprite.position.y = Sprite.QUAD_Y + Sprite.LEVEL_STEP;
            this.arms[0].rotation.y = Math.cos(1 * this._armT * Math.PI) * 0.15 - 0.3;
            this.arms[1].rotation.y = Math.cos(1.1 * this._armT * Math.PI) * 0.15 + 0.3;
            let rightDir = new BABYLON.Vector2(this.feet[1].absolutePosition.x - this.feet[0].absolutePosition.x, this.feet[1].absolutePosition.z - this.feet[0].absolutePosition.z);
            rightDir.normalize();
            let a = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), rightDir);
            this.sprite.rotation.y = Math2D.LerpFromToCircular(-a, this.target.rotation.y, 0.5);
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
                    this._moveLeg(index, this.target.targets[index].absolutePosition, this.target.rotation.y);
                }
            }
            if (!this.currentPath || this.currentPath.length === 0) {
                this._updatePath();
            }
            this.moveOnPath();
        };
        this._updatePath = () => {
            if (!this.currentTarget) {
                this.currentTarget = this.main.gameObjects.find(go => { return go instanceof CommandCenter; });
            }
            if (this.currentTarget) {
                let navGraph = NavGraphManager.GetForRadius(2);
                navGraph.update();
                this.currentPath = navGraph.computePathFromTo(this.target.pos2D, this.currentTarget.pos2D);
            }
        };
        this.target = new WalkerTarget(this);
        let robotBody = new Sprite("robot-body", "assets/robot_body_2.png", this.main.scene);
        robotBody.height = 2;
        robotBody.position.x = 5;
        robotBody.position.z = 5;
        robotBody.position.y = Sprite.QUAD_Y + Sprite.LEVEL_STEP;
        this.sprite = robotBody;
        let robotArm_L = new Sprite("robot-arm_L", "assets/robot_arm_L.png", this.main.scene);
        robotArm_L.height = 3;
        robotArm_L.setPivotPoint((new BABYLON.Vector3(0.48, -0.43, 0)));
        robotArm_L.position.x = -1.1;
        robotArm_L.position.z = 0.7;
        robotArm_L.position.y = Sprite.LEVEL_STEP;
        robotArm_L.parent = robotBody;
        let robotArm_R = new Sprite("robot-arm_R", "assets/robot_arm_R.png", this.main.scene);
        robotArm_R.height = 3;
        robotArm_R.setPivotPoint((new BABYLON.Vector3(-0.48, -0.43, 0)));
        robotArm_R.position.x = 1.1;
        robotArm_R.position.z = 0.7;
        robotArm_R.position.y = Sprite.LEVEL_STEP;
        robotArm_R.parent = robotBody;
        let robotFoot_L = new Sprite("robot-foot_L", "assets/robot_foot_L.png", this.main.scene);
        robotFoot_L.height = 1;
        robotFoot_L.position.x = -1.1;
        robotFoot_L.position.z = 0;
        robotFoot_L.position.y = Sprite.QUAD_Y;
        robotFoot_L.rotation.y = 0.3;
        let robotFoot_R = new Sprite("robot-foot_R", "assets/robot_foot_R.png", this.main.scene);
        robotFoot_R.height = 1;
        robotFoot_R.position.x = 1.1;
        robotFoot_R.position.z = 0;
        robotFoot_L.position.y = Sprite.QUAD_Y;
        robotFoot_R.rotation.y = -0.3;
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
        this.main.navGraphManager.onObstacleListUpdated.add(this._updatePath);
    }
    get _inputDir() {
        return this._inputDirs.getLast();
    }
    dispose() {
        super.dispose();
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
        this.sprite.dispose();
        this.arms.forEach(a => {
            a.dispose();
        });
        this.feet.forEach(f => {
            f.dispose();
        });
        this.main.navGraphManager.onObstacleListUpdated.removeCallback(this._updatePath);
    }
    forcePosRot(x, y, r) {
        let right = new BABYLON.Vector2(Math.cos(-r), Math.sin(-r));
        this.target.posX = x;
        this.target.posY = y;
        this.target.rot = r;
        this.feet[0].posX = x - right.x * 1.1;
        this.feet[0].posY = y - right.y * 1.1;
        this.feet[0].rot = r;
        this.feet[1].posX = x + right.x * 1.1;
        this.feet[1].posY = y + right.y * 1.1;
        this.feet[1].rot = r;
    }
    async _moveLeg(legIndex, target, targetR) {
        return new Promise(resolve => {
            this._movingLegs.push(legIndex);
            let origin = this.feet[legIndex].position.clone();
            let originR = this.feet[legIndex].rotation.y;
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
                this.feet[legIndex].position.y = Sprite.QUAD_Y;
                ;
                this.feet[legIndex].rotation.y = Math2D.LerpFromToCircular(originR, targetR, d);
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
    moveOnPath() {
        if (this.currentPath && this.currentPath.length > 0) {
            let next = this.currentPath[0];
            if (!this.nextDebugMesh) {
                this.nextDebugMesh = BABYLON.MeshBuilder.CreateBox("next-debug-mesh", { size: 0.5 });
            }
            this.nextDebugMesh.position.x = next.x;
            this.nextDebugMesh.position.z = next.y;
            let distanceToNext = Math2D.Distance(this.target.pos2D, next);
            if (distanceToNext <= 1) {
                this.currentPath.splice(0, 1);
                return this.moveOnPath();
            }
            let stepToNext = next.subtract(this.target.pos2D).normalize();
            let targetRot = -Math2D.AngleFromTo(new BABYLON.Vector2(0, 1), stepToNext);
            let dRot = -Math2D.AngularDistance(this.target.rotation.y, targetRot);
            let dRotFactor = Math.abs(dRot) / (Math.PI * 0.5);
            dRotFactor = Math.min(Math.max(1 - dRotFactor, 0), 1);
            this._inputForwardAxis = dRotFactor;
            this._inputDirs.remove(4);
            this._inputDirs.remove(5);
            if (dRot < 0) {
                this._inputDirs.push(5);
            }
            if (dRot > 0) {
                this._inputDirs.push(4);
            }
            document.getElementById("distance-to-next").innerText = distanceToNext.toFixed(1) + (Math.random() > 0.5 ? " ." : "");
            document.getElementById("target-rot").innerText = (this.target.rotation.y / Math.PI * 180).toFixed(1) + "??" + (dRot / Math.PI * 180).toFixed(1) + "??";
        }
    }
    wound(n) {
        this.hitpoint -= n;
        if (this.hitpoint <= 0) {
            this.main.game.credit(10);
            this.dispose();
        }
    }
}
class WallNode extends GameObject {
    constructor(main) {
        super(main);
        this.sprite = new Sprite("wall", "assets/wall_node_base.png", this.main.scene);
        this.sprite.height = 1;
        this.top = new Sprite("wall-top", "assets/wall_top.png", this.main.scene);
        this.top.position.y = Sprite.LEVEL_STEP;
        this.top.parent = this.sprite;
        this.top.height = 5;
        this.setDarkness(0.5);
    }
    dispose() {
        super.dispose();
        this.sprite.dispose();
        this.top.dispose();
    }
    makeReady() {
        this.isReady = true;
        this.setDarkness(1);
        if (!this.obstacle) {
            //this.obstacle = Obstacle.CreateHexagon(this.base.posX, this.base.posY, 2);
            this.obstacle = Obstacle.CreateRect(this.sprite.posX, this.sprite.posY, 2, 2, 0);
            this.obstacle.shape.rotation2D = Math.PI / 4;
            NavGraphManager.AddObstacle(this.obstacle);
        }
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
        this.setDarkness(0.5);
    }
    dispose() {
        super.dispose();
        this.sprite.dispose();
    }
    makeReady() {
        this.isReady = true;
        this.setDarkness(1);
        this.refreshObstacle();
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
        this.sprite.position.y = Sprite.QUAD_Y + 0.5 * Sprite.LEVEL_STEP;
        this.sprite.position.x = this.node1.sprite.position.x + l * 0.5;
        this.sprite.position.z = this.node1.sprite.position.z;
        this.sprite.rotation.y = -Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), new BABYLON.Vector2(n.x, n.z));
    }
    refreshObstacle() {
        let c = this.node1.sprite.pos2D.add(this.node2.sprite.pos2D).scaleInPlace(0.5);
        let n = this.node2.sprite.pos2D.subtract(this.node1.sprite.pos2D);
        let l = n.length();
        let a = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), n);
        if (this.obstacle) {
            NavGraphManager.RemoveObstacle(this.obstacle);
        }
        this.obstacle = Obstacle.CreateRect(c.x, c.y, l, 0.5, a);
        NavGraphManager.AddObstacle(this.obstacle);
    }
    setDarkness(d) {
        this.sprite.spriteMaterial.diffuseColor.copyFromFloats(d, d, d);
    }
}
class NavGraph {
    constructor(main) {
        this.main = main;
        this.offset = 0.5;
        this.obstacles = [];
    }
    setStart(s) {
        if (!this.start) {
            this.start = new NavGraphPoint(0, undefined, undefined);
        }
        this.start.position = s;
    }
    setEnd(e) {
        if (!this.end) {
            this.end = new NavGraphPoint(1, undefined, undefined);
        }
        this.end.position = e;
    }
    update() {
        this.points = [];
        let counter = 2;
        this.obstacles.forEach((o) => {
            o.computePath(this.offset);
        });
        for (let i = 0; i < this.obstacles.length; i++) {
            let o = this.obstacles[i];
            let path = o.getPath(this.offset);
            let ngPoints = [];
            for (let j = 0; j < path.length; j++) {
                let ngPoint = new NavGraphPoint(counter++, o, path);
                ngPoint.position = path[j];
                this.obstacles.forEach((otherObstacle) => {
                    if (otherObstacle !== o) {
                        if (Math2D.IsPointInPath(ngPoint.position, otherObstacle.getPath(this.offset))) {
                            ngPoint.unreachable = true;
                        }
                    }
                });
                ngPoints.push(ngPoint);
            }
            for (let j = 0; j < ngPoints.length; j++) {
                let p1 = ngPoints[j];
                let p2 = ngPoints[(j + 1) % ngPoints.length];
                if (!p1.unreachable && !p2.unreachable) {
                    let crossesAnotherShape = false;
                    for (let k = 0; k < this.obstacles.length; k++) {
                        let otherObstacle = this.obstacles[k];
                        if (o !== otherObstacle) {
                            let intersections = Math2D.SegmentShapeIntersection(p1.position, p2.position, otherObstacle.getPath(this.offset));
                            if (intersections.length > 0) {
                                crossesAnotherShape = true;
                                break;
                            }
                        }
                    }
                    if (!crossesAnotherShape) {
                        NavGraphPoint.Connect(p1, p2);
                    }
                }
                // Deal with case where [P1P2] crosses another shape
                if (!p1.unreachable) {
                    this.points.push(p1);
                }
            }
        }
        for (let i = 0; i < this.points.length; i++) {
            for (let j = i + 1; j < this.points.length; j++) {
                let p1 = this.points[i];
                let p2 = this.points[j];
                if (p1.path !== p2.path || (!p1.path && !p2.path)) {
                    let d = p2.position.subtract(p1.position);
                    // Check if segment intersects p1.shape
                    let p1ShapeSelfIntersect = true;
                    if (p1.path) {
                        let index = p1.path.indexOf(p1.position);
                        let sNext = p1.path[(index + 1) % p1.path.length].subtract(p1.position);
                        let sPrev = p1.path[(index - 1 + p1.path.length) % p1.path.length].subtract(p1.position);
                        if (Math2D.AngleFromTo(sPrev, d, true) <= Math2D.AngleFromTo(sPrev, sNext, true)) {
                            p1ShapeSelfIntersect = false;
                        }
                    }
                    else {
                        p1ShapeSelfIntersect = false;
                    }
                    if (!p1ShapeSelfIntersect) {
                        // Check if segment intersects p2.shape
                        d.scaleInPlace(-1);
                        let p2ShapeSelfIntersect = true;
                        if (p2.path) {
                            let index = p2.path.indexOf(p2.position);
                            let sNext = p2.path[(index + 1) % p2.path.length].subtract(p2.position);
                            let sPrev = p2.path[(index - 1 + p2.path.length) % p2.path.length].subtract(p2.position);
                            if (Math2D.AngleFromTo(sPrev, d, true) <= Math2D.AngleFromTo(sPrev, sNext, true)) {
                                p2ShapeSelfIntersect = false;
                            }
                        }
                        else {
                            p2ShapeSelfIntersect = false;
                        }
                        if (!p2ShapeSelfIntersect) {
                            let crossOtherShape = false;
                            for (let i = 0; i < this.obstacles.length; i++) {
                                let o = this.obstacles[i];
                                if (o !== p1.obstacle && o !== p2.obstacle) {
                                    let path = o.getPath(this.offset);
                                    for (let j = 0; j < path.length; j++) {
                                        let s1 = path[j];
                                        let s2 = path[(j + 1) % path.length];
                                        if (Math2D.SegmentSegmentIntersection(p1.position, p2.position, s1, s2)) {
                                            crossOtherShape = true;
                                        }
                                    }
                                }
                            }
                            if (!crossOtherShape) {
                                NavGraphPoint.Connect(p1, p2);
                            }
                        }
                    }
                }
            }
        }
        this.refreshDisplayGraph(this.main.scene);
    }
    computePathFromTo(from, to) {
        let toObstacle = undefined;
        this.setStart(from);
        if (to instanceof BABYLON.Vector2) {
            this.setEnd(to);
        }
        else if (to instanceof Obstacle) {
            this.setEnd(to.position2D);
            toObstacle = to;
        }
        for (let i = 0; i < this.points.length; i++) {
            this.points[i].distanceToEnd = Infinity;
        }
        this.points.push(this.start, this.end);
        let newPoints = [this.start, this.end];
        for (let i = 0; i < newPoints.length; i++) {
            let p1 = newPoints[i];
            for (let j = 0; j < this.points.length; j++) {
                let p2 = this.points[j];
                if (p1 !== p2) {
                    let d = p1.position.subtract(p2.position);
                    let p2ShapeSelfIntersect = true;
                    if (p2.path) {
                        let index = p2.path.indexOf(p2.position);
                        let sNext = p2.path[(index + 1) % p2.path.length].subtract(p2.position);
                        let sPrev = p2.path[(index - 1 + p2.path.length) % p2.path.length].subtract(p2.position);
                        if (Math2D.AngleFromTo(sPrev, d, true) <= Math2D.AngleFromTo(sPrev, sNext, true)) {
                            p2ShapeSelfIntersect = false;
                        }
                    }
                    else {
                        p2ShapeSelfIntersect = false;
                    }
                    if (!p2ShapeSelfIntersect) {
                        let crossOtherShape = false;
                        for (let k = 0; k < this.obstacles.length; k++) {
                            let o = this.obstacles[k];
                            let path = o.getPath(this.offset);
                            if (!Math2D.IsPointInPath(p1.position, path)) {
                                if (o !== toObstacle && o !== p2.obstacle) {
                                    for (let j = 0; j < path.length; j++) {
                                        let s1 = path[j];
                                        let s2 = path[(j + 1) % path.length];
                                        if (Math2D.SegmentSegmentIntersection(p1.position, p2.position, s1, s2)) {
                                            crossOtherShape = true;
                                        }
                                    }
                                }
                            }
                        }
                        if (!crossOtherShape) {
                            NavGraphPoint.Connect(p1, p2);
                        }
                    }
                }
            }
        }
        this.end.distanceToEnd = 0;
        this.start.distanceToEnd = Infinity;
        this.end.propagateDistanceToEnd();
        this.path = [this.start.position];
        this.start.appendNextPathPoint(this.path);
        this.start.remove();
        this.end.remove();
        this.points.pop();
        this.points.pop();
        this.refreshDisplayPath(this.main.scene);
        return this.path;
    }
    isDisplayed() {
        return this._devGraphMesh !== undefined || this._devPathMesh !== undefined;
    }
    refreshDisplayGraph(scene) {
        if (this.isDisplayed()) {
            this.displayGraph(scene);
        }
    }
    refreshDisplayPath(scene) {
        if (this.isDisplayed()) {
            this.displayPath(scene);
        }
    }
    toggleDisplay(scene) {
        if (this.isDisplayed()) {
            this.hide();
        }
        else {
            this.displayGraph(scene);
            this.displayPath(scene);
        }
    }
    displayGraph(scene) {
        console.log("DISPLAY GRAPH");
        if (!this.points) {
            return;
        }
        this.hideGraph();
        this._devGraphMesh = new BABYLON.TransformNode("dev-graph-mesh");
        for (let i = 0; i < this.points.length; i++) {
            let p = this.points[i];
            for (let j = 0; j < p.links.length; j++) {
                let p2 = p.links[j].other(p);
                if (p.index < p2.index) {
                    let devGraphMesh = BABYLON.MeshBuilder.CreateLines("line", {
                        points: [
                            new BABYLON.Vector3(p.position.x, 0, p.position.y),
                            new BABYLON.Vector3(p2.position.x, 0, p2.position.y)
                        ],
                        colors: [
                            new BABYLON.Color4(0, 0, 1, 1),
                            new BABYLON.Color4(0, 0, 1, 1)
                        ]
                    }, scene);
                    devGraphMesh.renderingGroupId = 1;
                    devGraphMesh.layerMask = 0x10000000;
                    devGraphMesh.parent = this._devGraphMesh;
                }
            }
        }
    }
    displayPath(scene) {
        this.hidePath();
        if (this.path) {
            let points = [];
            let colors = [];
            for (let i = 0; i < this.path.length; i++) {
                let p = this.path[i];
                points.push(new BABYLON.Vector3(p.x, 0, p.y));
                colors.push(new BABYLON.Color4(0, 1, 0, 1));
            }
            this._devPathMesh = BABYLON.MeshBuilder.CreateLines("shape", { points: points, colors: colors }, scene);
            this._devPathMesh.renderingGroupId = 1;
            this._devPathMesh.layerMask = 0x10000000;
        }
    }
    hide() {
        this.hideGraph();
        this.hidePath();
    }
    hideGraph() {
        if (this._devGraphMesh) {
            console.log("HIDE GRAPH");
            this._devGraphMesh.dispose();
            this._devGraphMesh = undefined;
        }
    }
    hidePath() {
        if (this._devPathMesh) {
            this._devPathMesh.dispose();
            this._devPathMesh = undefined;
        }
    }
}
class NavGraphConsole {
    constructor(scene) {
        this.scene = scene;
        this._offset = 1;
        this._navGraph = NavGraphManager.GetForRadius(this._offset);
    }
    enable() {
        this._panel = SpacePanel.CreateSpacePanel();
        this._panel.classList.add("navgraph-console-panel");
        this._panel.addTitle1("NAVGRAPH");
        this._panel.addTitle2("DEV CONSOLE");
        this._panel.addNumberInput("OFFSET", this._offset, (v) => {
            this._offset = v;
            this._navGraph.hide();
            this._navGraph = NavGraphManager.GetForRadius(this._offset);
        });
        this._panel.addConditionalButton("OBSTACLES", () => {
            if (this._navGraph && this._navGraph.obstacles[0] && this._navGraph.obstacles[0].isDisplayed()) {
                return "HIDE";
            }
            return "SHOW";
        }, () => {
            console.log(this._navGraph.obstacles.length);
            for (let i = 0; i < this._navGraph.obstacles.length; i++) {
                let o = this._navGraph.obstacles[i];
                if (o.isDisplayed()) {
                    o.hide();
                }
                else {
                    o.display(this.scene);
                }
            }
        });
        this._panel.addConditionalButton("NAVGRAPH", () => {
            if (this._navGraph.isDisplayed()) {
                return "HIDE";
            }
            return "SHOW";
        }, () => {
            if (this._navGraph.isDisplayed()) {
                this._navGraph.hide();
            }
            else {
                this._navGraph.displayGraph(this.scene);
                this._navGraph.displayPath(this.scene);
            }
        });
        document.getElementById("navgraph-console-panel").appendChild(this._panel);
    }
    disable() {
        this._panel.dispose();
    }
}
class NavGraphManager {
    constructor(main) {
        this.main = main;
        NavGraphManager.Instance = this;
        this._navGraphs = new Map();
        this._navGraphZero = new NavGraph(this.main);
        this._navGraphZero.offset = 0;
        this._navGraphs.set(0, this._navGraphZero);
        this.onObstacleListUpdated = new BABYLON.Observable();
    }
    static GetForRadius(radius) {
        return NavGraphManager.Instance.getForOffset(radius);
    }
    getForOffset(offset) {
        let navGraph = this._navGraphs.get(offset);
        if (!navGraph) {
            navGraph = new NavGraph(this.main);
            navGraph.offset = offset;
            for (let i = 0; i < this._navGraphZero.obstacles.length; i++) {
                navGraph.obstacles.push(this._navGraphZero.obstacles[i]);
            }
            this._navGraphs.set(offset, navGraph);
        }
        return navGraph;
    }
    static AddObstacle(obstacle) {
        if (!obstacle) {
            return;
        }
        return NavGraphManager.Instance.addObstacle(obstacle);
    }
    addObstacle(obstacle) {
        if (!obstacle) {
            return;
        }
        this._navGraphs.forEach((navGraph) => {
            navGraph.obstacles.push(obstacle);
        });
        this.onObstacleListUpdated.notifyObservers();
    }
    static RemoveObstacle(obstacle) {
        return NavGraphManager.Instance.removeObstacle(obstacle);
    }
    removeObstacle(obstacle) {
        this._navGraphs.forEach((navGraph) => {
            let index = navGraph.obstacles.indexOf(obstacle);
            if (index !== -1) {
                navGraph.obstacles.splice(index, 1);
            }
        });
        this.onObstacleListUpdated.notifyObservers();
    }
}
class NavGraphLink {
    other(current) {
        if (this.p1 === current) {
            return this.p2;
        }
        if (this.p2 === current) {
            return this.p1;
        }
        console.warn("Undefined request for other NavGraphPoint.");
        return undefined;
    }
}
class NavGraphPoint {
    constructor(index, obstacle, shape) {
        this.index = 0;
        this.path = [];
        this.links = [];
        this.distanceToEnd = Infinity;
        this.unreachable = false;
        this.index = index;
        this.obstacle = obstacle;
        this.path = shape;
    }
    remove() {
        while (this.links.length > 0) {
            let other = this.links[0].other(this);
            NavGraphPoint.Disconnect(this, other);
        }
    }
    hasNeighbour(n) {
        for (let i = 0; i < this.links.length; i++) {
            if (this.links[i].other(this) === n) {
                return this.links[i];
            }
        }
        return undefined;
    }
    propagateDistanceToEnd() {
        for (let i = 0; i < this.links.length; i++) {
            let n = this.links[i].other(this);
            let distanceToEnd = this.links[i].length + this.distanceToEnd;
            if (distanceToEnd < n.distanceToEnd) {
                n.distanceToEnd = distanceToEnd;
                n.propagateDistanceToEnd();
            }
        }
    }
    appendNextPathPoint(path) {
        this.links.sort((l1, l2) => { return (l1.length + l1.other(this).distanceToEnd) - (l2.length + l2.other(this).distanceToEnd); });
        if (this.links[0]) {
            let other = this.links[0].other(this);
            if (other.distanceToEnd < Infinity) {
                path.push(other.position);
                if (other.distanceToEnd > 0) {
                    other.appendNextPathPoint(path);
                }
            }
        }
    }
    static Connect(p1, p2) {
        let link = new NavGraphLink();
        link.p1 = p1;
        link.p2 = p2;
        link.length = Math2D.Distance(p1.position, p2.position);
        let checkFineConnection = 0;
        if (!p1.hasNeighbour(p2)) {
            p1.links.push(link);
            checkFineConnection++;
        }
        if (!p2.hasNeighbour(p1)) {
            p2.links.push(link);
            checkFineConnection++;
        }
        if (checkFineConnection % 2 !== 0) {
            console.warn("Connect between 2 NavGraphPoint went wrong : Only one was already connected to the other.");
        }
    }
    static Disconnect(p1, p2) {
        let l = p1.hasNeighbour(p2);
        if (l === p2.hasNeighbour(p1)) {
            let p1LIndex = p1.links.indexOf(l);
            let p2LIndex = p2.links.indexOf(l);
            p1.links.splice(p1LIndex, 1);
            p2.links.splice(p2LIndex, 1);
        }
        else {
            if (!p1.hasNeighbour(p2) && !p2.hasNeighbour(p1)) {
                console.warn("Disconnection between 2 NavGraphPoint went wrong : Points were already disconnected.");
            }
            else {
                console.warn("Disconnection between 2 NavGraphPoint went wrong : Only one was connected to the other.");
            }
        }
    }
}
class Obstacle {
    constructor(posRotSource = undefined) {
        this.posRotSource = posRotSource;
        this.name = (Math.random() * 100).toFixed(0);
        this._path = new Map();
    }
    get position2D() {
        if (this.posRotSource) {
            return this.posRotSource.position2D;
        }
        return this._position2D;
    }
    set position2D(v) {
        this._position2D = v;
    }
    get rotation2D() {
        if (this.posRotSource) {
            return this.posRotSource.rotation2D;
        }
        return this._rotation2D;
    }
    set rotation2D(v) {
        console.log("?");
        this._rotation2D = v;
    }
    static CreateRectWithPosRotSource(posRotSource, w = 1, h = 1) {
        let rect = new Obstacle();
        rect.posRotSource = posRotSource;
        rect.shape = new Rect(w, h);
        rect.shape.posRotSource = posRotSource;
        return rect;
    }
    static CreateRect(x, y, w = 1, h = 1, rotation = 0) {
        let rect = new Obstacle();
        rect.shape = new Rect(w, h);
        rect.shape.position2D = new BABYLON.Vector2(x, y);
        rect.shape.rotation2D = rotation;
        return rect;
    }
    static CreateHexagonWithPosRotSource(posRotSource, radius = 1) {
        let hexagon = new Obstacle();
        hexagon.posRotSource = posRotSource;
        hexagon.shape = new Hexagon(radius);
        hexagon.shape.posRotSource = posRotSource;
        return hexagon;
    }
    static CreateHexagon(x, y, radius = 1) {
        let hexagon = new Obstacle();
        hexagon.shape = new Hexagon(radius);
        hexagon.shape.position2D = new BABYLON.Vector2(x, y);
        hexagon.shape.rotation2D = 0;
        return hexagon;
    }
    static CreatePolygon(x, y, points) {
        let polygon = new Obstacle();
        polygon.shape = new Polygon(points);
        polygon.shape.position2D = new BABYLON.Vector2(x, y);
        return polygon;
    }
    getPath(offset = 1, forceCompute = false) {
        let path = this._path.get(offset);
        if (!path || forceCompute) {
            path = this.computePath(offset);
        }
        return path;
    }
    computePath(offset = 1) {
        let path = this.shape.getPath(offset);
        this._path.set(offset, path);
        return path;
    }
    contains(point, offset = 1, forceCompute = false) {
        return Math2D.IsPointInPath(point, this.getPath(offset, forceCompute));
    }
    isDisplayed() {
        return this._devLineMesh !== undefined;
    }
    toggleDisplay(scene) {
        if (this.isDisplayed()) {
            this.hide();
        }
        else {
            this.display(scene);
        }
    }
    display(scene) {
        this.hide();
        let path = this.shape.getPath();
        let points = [];
        let colors = [];
        for (let i = 0; i < path.length; i++) {
            let p = path[i];
            points.push(new BABYLON.Vector3(p.x, 0, p.y));
            colors.push(new BABYLON.Color4(1, 0, 0, 1));
        }
        console.log(path);
        points.push(points[0]);
        colors.push(new BABYLON.Color4(1, 0, 0, 1));
        this._devLineMesh = BABYLON.MeshBuilder.CreateLines("shape", { points: points, colors: colors }, scene);
        this._devLineMesh.renderingGroupId = 1;
        this._devLineMesh.layerMask = 0x10000000;
    }
    hide() {
        if (this._devLineMesh) {
            this._devLineMesh.dispose();
            this._devLineMesh = undefined;
        }
    }
}
class ShapeDraw {
    static CreateCircle(rMin, rMax, name = "circle") {
        let mesh = new BABYLON.Mesh(name);
        let data = new BABYLON.VertexData();
        let positions = [];
        let indices = [];
        for (let i = 0; i <= 32; i++) {
            let a = i + Math.random() * 0.5;
            let cosa = Math.cos(a * 2 * Math.PI / 32);
            let sina = Math.sin(a * 2 * Math.PI / 32);
            positions.push(cosa * rMin, 0, sina * rMin);
            positions.push(cosa * rMax, 0, sina * rMax);
        }
        for (let i = 0; i < 32; i++) {
            if (Math.cos(i * 500) > 0) {
                indices.push(2 * i, 2 * i + 1, 2 * (i + 1) + 1);
                indices.push(2 * i, 2 * (i + 1) + 1, 2 * (i + 1));
            }
        }
        data.positions = positions;
        data.indices = indices;
        data.applyToMesh(mesh);
        return mesh;
    }
}
class Shape {
    constructor(posRotSource = undefined) {
        this.posRotSource = posRotSource;
    }
    get position2D() {
        if (this.posRotSource) {
            return this.posRotSource.position2D;
        }
        return this._position2D;
    }
    set position2D(v) {
        this._position2D = v;
    }
    get rotation2D() {
        if (this.posRotSource) {
            return this.posRotSource.rotation2D;
        }
        return this._rotation2D;
    }
    set rotation2D(v) {
        this._rotation2D = v;
    }
}
class Rect extends Shape {
    constructor(width = 1, height = 1) {
        super();
        this.width = width;
        this.height = height;
    }
    getPath(offset = 0) {
        this._path = [
            new BABYLON.Vector2(-(this.width + offset) * 0.5, -(this.height + offset) * 0.5),
            new BABYLON.Vector2((this.width + offset) * 0.5, -(this.height + offset) * 0.5),
            new BABYLON.Vector2((this.width + offset) * 0.5, (this.height + offset) * 0.5),
            new BABYLON.Vector2(-(this.width + offset) * 0.5, (this.height + offset) * 0.5)
        ];
        for (let i = 0; i < this._path.length; i++) {
            Math2D.RotateInPlace(this._path[i], this.rotation2D);
            this._path[i].addInPlace(this.position2D);
        }
        return this._path;
    }
}
class Hexagon extends Shape {
    constructor(radius = 1) {
        super();
        this.radius = radius;
    }
    getPath(offset = 0) {
        this._path = [];
        for (let i = 0; i < 6; i++) {
            this._path.push(new BABYLON.Vector2(Math.cos(i * Math.PI / 3) * (this.radius + offset), Math.sin(i * Math.PI / 3) * (this.radius + offset)));
        }
        for (let i = 0; i < this._path.length; i++) {
            Math2D.RotateInPlace(this._path[i], this.rotation2D);
            this._path[i].addInPlace(this.position2D);
        }
        return this._path;
    }
}
class Polygon extends Shape {
    constructor(points) {
        super();
        this.points = points;
    }
    getPath(offset = 0) {
        this._path = Math2D.FattenShrinkPointShape(this.points, offset);
        for (let i = 0; i < this._path.length; i++) {
            this._path[i].addInPlace(this.position2D);
        }
        return this._path;
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
    static CreateVerticalVertexData(w, h, from = 0, to = 1) {
        let data = new BABYLON.VertexData();
        let positions = [];
        let indices = [];
        let uvs = [];
        let ww = 0.5 * w;
        let hh = 0.5 * h;
        positions.push(-ww, 0, -hh + h * from, -ww, 0, -hh + h * to, ww, 0, -hh + h * to, ww, 0, -hh + h * from);
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
                let ctx = this.valueTexture.getContext();
                ctx.clearRect(0, 0, 200, 100);
                ctx.font = "65px Orbitron Medium";
                ctx.textAlign = "right";
                ctx.lineWidth = 10;
                ctx.strokeStyle = "black";
                ctx.strokeText((Math.floor(t * 10)).toFixed(0), 70, 75);
                ctx.strokeText((Math.floor(t * 100) % 10).toFixed(0), 125, 75);
                ctx.strokeText("%", 190, 75);
                ctx.fillStyle = "white";
                ctx.fillText((Math.floor(t * 10)).toFixed(0), 70, 75);
                ctx.fillText((Math.floor(t * 100) % 10).toFixed(0), 125, 75);
                ctx.fillText("%", 190, 75);
                this.valueTexture.update();
            }
            else {
                this.dispose();
                if (this.onCompletionCallback) {
                    this.onCompletionCallback();
                }
            }
        };
        this.greenSprite = new BABYLON.Mesh("green-sprite", this.main.scene);
        this.greenSprite.renderingGroupId = 1;
        this.greenSprite.layerMask = 0x10000000;
        let greenSpriteMaterial = new BABYLON.StandardMaterial("green-sprite-material", this.main.scene);
        greenSpriteMaterial.diffuseTexture = new BABYLON.Texture("assets/building-loader-green.png", this.main.scene);
        greenSpriteMaterial.diffuseTexture.hasAlpha = true;
        greenSpriteMaterial.specularColor.copyFromFloats(0, 0, 0);
        greenSpriteMaterial.alphaCutOff = 0.5;
        this.greenSprite.material = greenSpriteMaterial;
        this.greenSprite.position.x = this.pos2D.x;
        this.greenSprite.position.y = 0;
        this.greenSprite.position.z = this.pos2D.y;
        this.graySprite = new BABYLON.Mesh("graySprite", this.main.scene);
        this.graySprite.renderingGroupId = 1;
        this.graySprite.layerMask = 0x10000000;
        let graySpriteMaterial = new BABYLON.StandardMaterial("graySprite-material", this.main.scene);
        graySpriteMaterial.diffuseTexture = new BABYLON.Texture("assets/building-loader-gray.png", this.main.scene);
        graySpriteMaterial.diffuseTexture.hasAlpha = true;
        graySpriteMaterial.specularColor.copyFromFloats(0, 0, 0);
        graySpriteMaterial.alphaCutOff = 0.5;
        this.graySprite.material = graySpriteMaterial;
        this.graySprite.position.x = this.pos2D.x;
        this.graySprite.position.y = 0;
        this.graySprite.position.z = this.pos2D.y;
        let a = 240 / 180 * Math.PI;
        CutPlane.CreateVerticalVertexData(2.5, 2.5, 0, 0).applyToMesh(this.greenSprite);
        CutPlane.CreateVerticalVertexData(2.5, 2.5, 0, 1).applyToMesh(this.graySprite);
        this.main.scene.onBeforeRenderObservable.add(this._update);
        this.valueMesh = new BABYLON.Mesh("value-mesh");
        this.valueMesh.renderingGroupId = 1;
        this.valueMesh.layerMask = 0x10000000;
        SpriteUtils.CreatePlaneData(2.5, 1.25).applyToMesh(this.valueMesh);
        this.valueMesh.position.x = this.pos2D.x + 0.3;
        this.valueMesh.position.y = 0;
        this.valueMesh.position.z = this.pos2D.y - 0.3;
        this.valueMaterial = new BABYLON.StandardMaterial("value-material", this.main.scene);
        this.valueMaterial.alphaCutOff = 0.5;
        this.valueTexture = new BABYLON.DynamicTexture("value-texture", { width: 200, height: 100 }, this.main.scene, true);
        this.valueTexture.hasAlpha = true;
        this.valueMaterial.diffuseTexture = this.valueTexture;
        this.valueMesh.material = this.valueMaterial;
    }
    dispose() {
        this.graySprite.dispose();
        this.greenSprite.dispose();
        this.valueMesh.dispose();
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
        mainCredit.onpointerup = () => {
            this.showCreditMenu();
        };
        this.mainMenuContainer.appendChild(mainTitle);
        this.mainMenuContainer.appendChild(mainPlay);
        this.mainMenuContainer.appendChild(mainOption);
        this.mainMenuContainer.appendChild(mainCredit);
        this.playMenuContainer = document.getElementById("play-menu");
        let playTitle = SpacePanel.CreateSpacePanel();
        playTitle.addTitle1("MARS AT WAR");
        playTitle.classList.add("menu-title-panel");
        let playTestMain = SpacePanel.CreateSpacePanel();
        playTestMain.addTitle2("MAIN TEST");
        playTestMain.classList.add("menu-element-panel");
        playTestMain.onpointerup = () => {
            this.main.generateTestMainScene();
            this.showIngameMenu();
        };
        let playTestMeteor = SpacePanel.CreateSpacePanel();
        playTestMeteor.addTitle2("METEOR TEST");
        playTestMeteor.classList.add("menu-element-panel");
        playTestMeteor.onpointerup = () => {
            this.main.generateTestMeteorScene();
            this.showIngameMenu();
        };
        let playBack = SpacePanel.CreateSpacePanel();
        playBack.addTitle2("BACK");
        playBack.classList.add("menu-element-panel");
        playBack.onpointerup = () => {
            this.showMainMenu();
        };
        this.playMenuContainer.appendChild(playTitle);
        this.playMenuContainer.appendChild(playTestMain);
        this.playMenuContainer.appendChild(playTestMeteor);
        this.playMenuContainer.appendChild(playBack);
        this.creditMenuContainer = document.getElementById("credit-menu");
        let creditTitle = SpacePanel.CreateSpacePanel();
        creditTitle.addTitle1("MARS AT WAR");
        creditTitle.classList.add("menu-title-panel");
        let creditCredit = SpacePanel.CreateSpacePanel();
        creditCredit.addTitle2("CREDIT");
        creditCredit.classList.add("menu-element-panel");
        creditCredit.addTitle3("Code & Graphism by Sven Frankson");
        creditCredit.addTitle3("Orbitron font by Matt McInerney");
        creditCredit.addTitle3("Anurati font by Richard Emmeran");
        creditCredit.addTitle3("Powered by BABYLONJS");
        let creditBack = SpacePanel.CreateSpacePanel();
        creditBack.addTitle2("BACK");
        creditBack.classList.add("menu-element-panel");
        creditBack.onpointerup = () => {
            this.showMainMenu();
        };
        this.creditMenuContainer.appendChild(creditTitle);
        this.creditMenuContainer.appendChild(creditCredit);
        this.creditMenuContainer.appendChild(creditBack);
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
            () => {
                if (this.main.playerAction.currentActionType === PlayerActionType.AddCanon) {
                    this.main.playerAction.cancelAddCanon();
                }
                else {
                    this.main.playerAction.addCanon(buildingButtons[0]);
                }
            },
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
        this._goldElement = ingameMenu.addTitle3("740");
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
        debugPanel.addTitle3("Mesh Count").id = "debug-mesh-count";
        this.main.scene.onBeforeRenderObservable.add(() => {
            document.getElementById("debug-mesh-count").innerHTML = "Mesh Count = " + this.main.scene.meshes.length.toFixed(0);
        });
        debugPanel.addLargeButton("Log Meshes Names", () => {
            console.log(this.main.scene.meshes.map(m => { return m.name; }).sort());
        });
        let navGraphConsole = new NavGraphConsole(this.main.scene);
        navGraphConsole.enable();
        this.showMainMenu();
    }
    showMainMenu() {
        this.mainMenuContainer.style.display = "block";
        this.playMenuContainer.style.display = "none";
        this.creditMenuContainer.style.display = "none";
        this.buildingMenuContainer.style.display = "none";
        this.ingameMenuContainer.style.display = "none";
        this.pauseMenuContainer.style.display = "none";
    }
    showPlayMenu() {
        this.mainMenuContainer.style.display = "none";
        this.playMenuContainer.style.display = "block";
        this.creditMenuContainer.style.display = "none";
        this.buildingMenuContainer.style.display = "none";
        this.ingameMenuContainer.style.display = "none";
        this.pauseMenuContainer.style.display = "none";
    }
    showCreditMenu() {
        this.mainMenuContainer.style.display = "none";
        this.playMenuContainer.style.display = "none";
        this.creditMenuContainer.style.display = "block";
        this.buildingMenuContainer.style.display = "none";
        this.ingameMenuContainer.style.display = "none";
        this.pauseMenuContainer.style.display = "none";
    }
    showIngameMenu() {
        this.mainMenuContainer.style.display = "none";
        this.playMenuContainer.style.display = "none";
        this.creditMenuContainer.style.display = "none";
        this.buildingMenuContainer.style.display = "block";
        this.ingameMenuContainer.style.display = "block";
        this.pauseMenuContainer.style.display = "none";
    }
    showPauseMenu() {
        this.mainMenuContainer.style.display = "none";
        this.playMenuContainer.style.display = "none";
        this.creditMenuContainer.style.display = "none";
        this.pauseMenuContainer.style.display = "block";
    }
    setGold(v) {
        this._goldElement.innerText = v.toFixed(0);
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
var PlayerActionType;
(function (PlayerActionType) {
    PlayerActionType[PlayerActionType["None"] = 0] = "None";
    PlayerActionType[PlayerActionType["AddCanon"] = 1] = "AddCanon";
    PlayerActionType[PlayerActionType["AddWall"] = 2] = "AddWall";
})(PlayerActionType || (PlayerActionType = {}));
class PlayerAction {
    constructor(main) {
        this.main = main;
        this.currentActionType = PlayerActionType.None;
        this._updateAddingCanon = () => {
            if (this._selectedCanon) {
                let world = this.main.getPointerWorldPos();
                this._selectedCanon.posX = world.x;
                this._selectedCanon.posY = world.y;
            }
        };
        this._pointerUpAddingCanon = (eventData) => {
            if (this._selectedCanon) {
                if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                    if (this.main.game.pay(100)) {
                        let newCanon = this._selectedCanon;
                        this._selectedCanon = undefined;
                        this.main.scene.onBeforeRenderObservable.removeCallback(this._updateAddingCanon);
                        this.main.scene.onPointerObservable.removeCallback(this._pointerUpAddingCanon);
                        this.currentActionType = PlayerActionType.None;
                        this.currentActionButton.classList.remove("selected");
                        this.currentActionButton = undefined;
                        new LoadingPlane(newCanon.pos2D, 3, () => {
                            newCanon.makeReady();
                            newCanon.flattenGround(3);
                        }, this.main);
                    }
                }
            }
        };
        this._updateAddingWall = () => {
            if (this._selectedWallNode1 && !this._selectedWallNode2) {
                let world = this.main.getPointerWorldPos();
                this._selectedWallNode1.posX = world.x;
                this._selectedWallNode1.posY = world.y;
            }
            else if (this._selectedWallNode1 && this._selectedWallNode2 && this._selectedWall) {
                let world = this.main.getPointerWorldPos();
                if (this._selectedWallNode2.pos2D.x != world.x || this._selectedWallNode2.pos2D.y != world.y) {
                    this._selectedWallNode2.posX = world.x;
                    this._selectedWallNode2.posY = world.y;
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
                        this._selectedWallNode1.posX = world.x;
                        this._selectedWallNode1.posY = world.y;
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
                                if (BABYLON.Vector2.DistanceSquared(world, g.pos2D) < 1.5 * 1.5) {
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
                        this._selectedWallNode2.posX = world.x;
                        this._selectedWallNode2.posY = world.y;
                    }
                    this._selectedWall.node2 = this._selectedWallNode2;
                    let l = BABYLON.Vector2.Distance(this._selectedWallNode1.pos2D, this._selectedWallNode2.pos2D);
                    let cost = 25 + Math.ceil(l * 5);
                    if (this.main.game.pay(cost)) {
                        let newWall = this._selectedWall;
                        let newNode1 = this._selectedWallNode1;
                        let newNode2 = this._selectedWallNode2;
                        new LoadingPlane(newNode1.pos2D.add(newNode2.pos2D).scale(0.5), 3, () => {
                            newWall.makeReady();
                            newNode1.makeReady();
                            newNode2.makeReady();
                        }, this.main);
                        this._selectedWallNode1 = undefined;
                        this._selectedWallNode2 = undefined;
                        this._selectedWall = undefined;
                        this.main.scene.onBeforeRenderObservable.removeCallback(this._updateAddingWall);
                        this.main.scene.onPointerObservable.removeCallback(this._pointerUpAddingWall);
                        this.currentActionButton.classList.remove("selected");
                    }
                }
            }
        };
    }
    addCanon(actionButton) {
        if (this._selectedCanon) {
            return;
        }
        this.currentActionType = PlayerActionType.AddCanon;
        this.currentActionButton = actionButton;
        this.currentActionButton.classList.add("selected");
        this._selectedCanon = new Canon(this.main);
        this._selectedCanon.instantiate();
        this.main.scene.onBeforeRenderObservable.add(this._updateAddingCanon);
        this.main.scene.onPointerObservable.add(this._pointerUpAddingCanon);
    }
    cancelAddCanon() {
        if (this._selectedCanon) {
            this._selectedCanon.dispose();
            this._selectedCanon = undefined;
        }
        this.currentActionType = PlayerActionType.None;
        this.currentActionButton.classList.remove("selected");
        this.currentActionButton = undefined;
        this.main.scene.onBeforeRenderObservable.removeCallback(this._updateAddingCanon);
        this.main.scene.onPointerObservable.removeCallback(this._pointerUpAddingCanon);
    }
    addWall(actionButton) {
        if (this._selectedWallNode1 || this._selectedWallNode2) {
            return;
        }
        this.currentActionButton = actionButton;
        this.currentActionButton.classList.add("selected");
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
    static AngularDistance(from, to) {
        let d = to - from;
        while (d <= -Math.PI) {
            d += 2 * Math.PI;
        }
        while (d > Math.PI) {
            d -= 2 * Math.PI;
        }
        return d;
    }
    static AngularClamp(from, to, v) {
        if (Math2D.AngularDistance(from, v) < 0) {
            return from;
        }
        else if (Math2D.AngularDistance(v, to) < 0) {
            return to;
        }
        return v;
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
        let shadowSprite = new BABYLON.Mesh(sprite.name + "-shadow", sprite.getScene());
        SpriteUtils.CreatePlaneData(w, h).applyToMesh(shadowSprite);
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
    static CreatePlaneData(w, h, inputUvs) {
        let data = new BABYLON.VertexData();
        let positions = [];
        let indices = [];
        let uvs = [];
        let ww = 0.5 * w;
        let hh = 0.5 * h;
        positions.push(-ww, 0, -hh, -ww, 0, hh, ww, 0, hh, ww, 0, -hh);
        indices.push(0, 2, 1, 0, 3, 2);
        if (!inputUvs) {
            uvs.push(0, 0, 0, 1, 1, 1, 1, 0);
        }
        else {
            uvs.push(inputUvs.x, inputUvs.y, inputUvs.x, inputUvs.w, inputUvs.z, inputUvs.w, inputUvs.z, inputUvs.y);
        }
        data.positions = positions;
        data.indices = indices;
        data.uvs = uvs;
        return data;
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
