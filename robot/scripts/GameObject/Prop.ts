/// <reference path="GameObject.ts"/>

class Prop extends GameObject {

    constructor(
        public name: string,
        main: Main
    ) {
        super(main);
        this.sprite = new Sprite(name, "assets/" + name + ".png", this.main.scene);
        this.sprite.position.z = 1;
    }

    public dispose(): void {
        super.dispose();
        this.sprite.dispose();
    }
}