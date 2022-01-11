/// <reference path="TransformNode.ts"/>

class Sprite extends TransformNode {

    public img: HTMLImageElement;

    constructor(
        name: string,
        public src: string,
        public width: number,
        public height: number,
        scene: Scene
    ) {
        super(name, scene);

        this.img = document.createElement("img");
        this.img.src = this.src;
        this.img.style.position = "fixed";
        document.body.appendChild(this.img);
    }
}