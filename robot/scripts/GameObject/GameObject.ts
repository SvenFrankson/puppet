abstract class GameObject {

    public isDisposed: boolean = false;

    public sprite: Sprite;

    private _pos2D: BABYLON.Vector2;
    public get pos2D(): BABYLON.Vector2 {
        if (this.sprite) {
            return this.sprite.pos2D;
        }
        if (!this._pos2D) {
            this._pos2D = BABYLON.Vector2.Zero();
        }
        return this._pos2D;
    }

    public get posX(): number {
        return this.pos2D.x;
    }
    public set posX(x: number) {
        this.sprite.posX = x;
    }

    public get posY(): number {
        return this.pos2D.y;
    }
    public set posY(y: number) {
        this.sprite.posY = y;
    }

    public get rot(): number {
        return this.pos2D.y;
    }
    public set rot(r: number) {
        this.sprite.rot = r;
    }

    constructor(
        public main: Main
    ) {
        main.gameObjects.push(this);
    }

    public dispose(): void {
        this.isDisposed = true;
    }
}