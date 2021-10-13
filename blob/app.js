class Main {
    constructor() {
        this.loop = () => {
            let dt = 1 / 60;
            let time = (new Date()).getTime();
            if (isFinite(this._lastTime)) {
                dt = (time - this._lastTime) / 1000;
            }
            this._lastTime = time;
            this.scene.update(dt);
            this.scene.draw();
            requestAnimationFrame(this.loop);
        };
        let canvas = document.getElementById("render-canvas");
        canvas.width = 512;
        canvas.height = 512;
        this.scene = new Scene(this, canvas);
        for (let i = 0; i < 30; i++) {
            this.scene.addObject(new Ball("ball-" + i.toFixed(0), this.scene));
        }
        let obs = new Ball("obs", this.scene);
        obs.r = 30;
        obs.fixed = true;
        this.scene.addObject(obs);
    }
    start() {
        this.loop();
    }
}
window.onload = () => {
    let main = new Main();
    main.start();
};
class Scene {
    constructor(main, canvas) {
        this.main = main;
        this.canvas = canvas;
        this.objects = [];
        this.clearColor = "#000000";
        this.center = new Vec2();
        this.context = this.canvas.getContext("2d");
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
    }
    update(dt) {
        this.objects.forEach(o => {
            o.update(dt);
        });
    }
    addObject(o) {
        if (this.objects.indexOf(o) === -1) {
            this.objects.push(o);
            return 1;
        }
        return -1;
    }
    removeObject(o) {
        let i = this.objects.indexOf(o);
        if (i != -1) {
            this.objects.splice(i, 1);
            return 1;
        }
        return -1;
    }
    draw() {
        this.context.fillStyle = this.clearColor;
        this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.objects.forEach(o => {
            o.draw(this.context);
        });
    }
    v2ToCanvasPos(v) {
        return new Vec2(this.canvasWidth * 0.5 + v.x, this.canvasHeight * 0.5 - v.y);
    }
}
class SceneObject {
    constructor(name, scene) {
        this.name = name;
        this.scene = scene;
        this.position = new Vec2();
    }
    start() {
        this._started = true;
    }
    update(dt) {
        if (!this._started) {
            this.start();
        }
    }
    draw(context) {
    }
}
class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    lengthSquared() {
        return this.x * this.x + this.y * this.y;
    }
    length() {
        return Math.sqrt(this.lengthSquared());
    }
    add(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    }
    addInPlace(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }
    substract(other) {
        return new Vec2(this.x - other.x, this.y - other.y);
    }
    substractInPlace(other) {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }
    scale(s) {
        return new Vec2(this.x * s, this.y * s);
    }
    scaleInPlace(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }
    mirror(n) {
        let vn = n.scale(this.dot(n));
        let vo = this.substract(vn);
        return vo.substract(vn);
    }
    normalize() {
        let l = this.length();
        return this.scaleInPlace(1 / l);
    }
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }
}
class Ball extends SceneObject {
    constructor() {
        super(...arguments);
        this.velocity = new Vec2();
        this.r = 10;
        this.fixed = false;
    }
    start() {
        super.start();
        this.position.x = -256 + 512 * Math.random();
        this.position.y = -256 + 512 * Math.random();
        //this.r = 10 + 30 * Math.random();
        //this.velocity.x = Math.random() - 0.5;
        //this.velocity.y = Math.random() - 0.5;
        //this.velocity.normalize();
        //this.velocity.scaleInPlace(50 + 3 * (40 - this.r));
    }
    update(dt) {
        super.update(dt);
        if (this.fixed) {
            return;
        }
        let balls = this.scene.objects.filter(o => { return o instanceof Ball; });
        let f = new Vec2();
        for (let i = 0; i < balls.length; i++) {
            let other = balls[i];
            if (other != this) {
                let n = other.position.substract(this.position);
                let l = n.length();
                n.scaleInPlace(1 / l);
                l = l / 20;
                let g = n.scale(40 / (l * l));
                let s = n.scale(-80 / (l * l * l));
                f.addInPlace(g).addInPlace(s);
            }
        }
        f.addInPlace(new Vec2(0, -20));
        f.substractInPlace(this.velocity.scale(0.1));
        this.velocity.addInPlace(f.scale(dt));
        for (let i = 0; i < balls.length; i++) {
            let other = balls[i];
            if (other != this) {
                let n = this.position.substract(other.position);
                if (n.length() < this.r + other.r) {
                    n.normalize();
                    let dot = this.velocity.dot(n);
                    if (dot < 0) {
                        this.velocity = this.velocity.mirror(n).scaleInPlace(0.9);
                    }
                }
            }
        }
        this.position.addInPlace(this.velocity.scale(dt));
        if (this.position.x > 256 - this.r && this.velocity.x > 0) {
            this.velocity.x *= -0.9;
        }
        if (this.position.x < -256 + this.r && this.velocity.x < 0) {
            this.velocity.x *= -0.9;
        }
        if (this.position.y > 256 - this.r && this.velocity.y > 0) {
            this.velocity.y *= -0.9;
        }
        if (this.position.y < -256 + this.r && this.velocity.y < 0) {
            this.velocity.y *= -0.9;
        }
    }
    draw(context) {
        context.strokeStyle = "#00FFFF";
        if (this.fixed) {
            context.strokeStyle = "#FF0000";
        }
        let c = this.scene.v2ToCanvasPos(this.position);
        context.beginPath();
        context.arc(c.x, c.y, this.r, 0, 2 * Math.PI);
        context.closePath();
        context.stroke();
    }
}
