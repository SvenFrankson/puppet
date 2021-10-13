class Vec2 {

    public x: number;
    public y: number;

    constructor();
    constructor(x: number, y: number);
    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    public lengthSquared(): number {
        return this.x * this.x + this.y * this.y;
    }

    public length(): number {
        return Math.sqrt(this.lengthSquared());
    }

    public add(other: Vec2): Vec2 {
        return new Vec2(this.x + other.x, this.y + other.y);
    }

    public addInPlace(other: Vec2): Vec2 {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    public substract(other: Vec2): Vec2 {
        return new Vec2(this.x - other.x, this.y - other.y);
    }

    public substractInPlace(other: Vec2): Vec2 {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    public scale(s: number): Vec2 {
        return new Vec2(this.x * s, this.y * s);
    }

    public scaleInPlace(s: number): Vec2 {
        this.x *= s;
        this.y *= s;
        return this;
    }

    public mirror(n: Vec2): Vec2 {
        let vn = n.scale(this.dot(n));
        let vo = this.substract(vn);
        return vo.substract(vn);
    }

    public normalize(): Vec2 {
        let l = this.length();
        return this.scaleInPlace(1 / l);
    }

    public dot(other: Vec2): number {
        return this.x * other.x + this.y * other.y;
    }
}