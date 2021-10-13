class Ball extends SceneObject {

    public velocity: Vec2 = new Vec2();
    public r: number = 10;
    public fixed: boolean = false;

    public start(): void {
        super.start();
        this.position.x = - 256 + 512 * Math.random();
        this.position.y = - 256 + 512 * Math.random();
        //this.r = 10 + 30 * Math.random();
        //this.velocity.x = Math.random() - 0.5;
        //this.velocity.y = Math.random() - 0.5;
        //this.velocity.normalize();
        //this.velocity.scaleInPlace(50 + 3 * (40 - this.r));
    }

    public update(dt: number): void {
        super.update(dt);

        if (this.fixed) {
            return;
        }

        let balls = this.scene.objects.filter( o=> { return o instanceof Ball; }) as Ball[];

        let f = new Vec2();
        for (let i = 0; i < balls.length; i++) {
            let other = balls[i];
            if (other != this) {
                let n = other.position.substract(this.position);
                let l = n.length();
                n.scaleInPlace(1 / l);
                l = l / 20;
                let g = n.scale(40 / (l * l));
                let s = n.scale(- 80 / (l * l * l));
                f.addInPlace(g).addInPlace(s);
            }
        }
        f.addInPlace(new Vec2(0, - 20));
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
            this.velocity.x *= - 0.9;
        }
        if (this.position.x < - 256 + this.r && this.velocity.x < 0) {
            this.velocity.x *= - 0.9;
        }
        if (this.position.y > 256 - this.r && this.velocity.y > 0) {
            this.velocity.y *= - 0.9;
        }
        if (this.position.y < - 256 + this.r && this.velocity.y < 0) {
            this.velocity.y *= - 0.9;
        }
    }

    public draw(context: CanvasRenderingContext2D): void {
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