abstract class LevelPlayer extends Level {

    public deckPlayer: Deck;
    private pickedCard: number = -1;

    public hand0I = 12;
    public hand0J = 0;
    public hand1I = 13;
    public hand1J = 0;

    constructor(
        main: Main
    ) {
        super(main);
    }

    public initialize(): void {
        super.initialize();

        if (this.main.ratio < 1) {
            this.hand0I = 10;
            this.hand0J = - 2;
            this.hand1I = 9
            this.hand1J = - 2;
        }

        this.deckPlayer = new Deck(this.main.board);

        this.makePlayerDeck();
        this.deckPlayer.hand[0].i = this.hand0I;
        this.deckPlayer.hand[0].j = this.hand0J;
        this.deckPlayer.hand[1].i = this.hand1I;
        this.deckPlayer.hand[1].j = this.hand1J;
        this.deckPlayer.shuffle();
        this.deckPlayer.draw();
        this.deckPlayer.updateShape();

        this.main.board.updateShapes();
        this.main.scene.onPointerObservable.add(this._pointerEvent);
    }

    protected abstract makePlayerDeck(): void;

    private _pointerEvent = (eventData: BABYLON.PointerInfo) => {
        return this.pointerEvent(eventData);
    }

    public pointerEvent(eventData: BABYLON.PointerInfo): void {
        if (eventData.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            console.log("Alpha");
            if (eventData.pickInfo.pickedMesh) {
                console.log("Bravo " + eventData.pickInfo.pickedMesh.name);
                if (eventData.pickInfo.pickedMesh.name === "shape_" + this.hand0I.toFixed(0) + "_" + this.hand0J.toFixed(0)) {
                    console.log("Charly");
                    this.pickedCard = 0;
                    this.deckPlayer.hand[0].selected = true;
                    this.deckPlayer.hand[0].updateShape();
                    this.deckPlayer.hand[1].selected = false;
                    this.deckPlayer.hand[1].updateShape();
                }
                else if (eventData.pickInfo.pickedMesh.name === "shape_" + this.hand1I.toFixed(0) + "_" + this.hand1J.toFixed(0)) {
                    this.pickedCard = 1;
                    this.deckPlayer.hand[0].selected = false;
                    this.deckPlayer.hand[0].updateShape();
                    this.deckPlayer.hand[1].selected = true;
                    this.deckPlayer.hand[1].updateShape();
                }
            }
        }
        else if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
            if (eventData.pickInfo.pickedMesh) {
                let split = eventData.pickInfo.pickedMesh.name.split("_");
                if (split.length === 3) {
                    let i = parseInt(split[1]);
                    let j = parseInt(split[2]);
                    if (isFinite(i) && isFinite(j)) {
                        let value = 0;
                        let color = -1;
                        let pickedTile = this.deckPlayer.hand[this.pickedCard];
                        if (pickedTile) {
                            value = pickedTile.value;
                            color = pickedTile.color;
                        }
                        if (this.main.board.play(0, color, value, i, j)) {
                            pickedTile.reset();
                            this.pickedCard = -1;
                            this.deckPlayer.draw();
                            this.deckPlayer.updateShape();
                        }
                    }
                }
            }
        }
    }

    public update(): void {

    }

    public dispose(): void {
        super.dispose();
        this.main.scene.onPointerObservable.removeCallback(this._pointerEvent);
        this.deckPlayer.hand.forEach(t => {
            t.dispose();
        })
        delete this.deckPlayer;
    }
}