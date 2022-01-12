abstract class GameObject {

    public isDisposed: boolean = false;

    constructor(
        public main: Main
    ) {
        main.gameObjects.push(this);
    }

    public dispose(): void {
        this.isDisposed = true;
    }
}