class Level {

    constructor(
        public main: Main
    ) {

    }

    public initialize(): void {
		this.main.hideMainMenu();
        this.main.scene.onBeforeRenderObservable.add(this._update);
    }

    private _update = () => {
        this.update();
    }

    public update(): void {

    }

    public dispose(): void {
        this.main.showMainMenu();
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
        this.main.cellNetwork.dispose();
    }
}