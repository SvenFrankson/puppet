abstract class LevelPlayer extends Level {

    public deckPlayer: Deck;
    private pickedCard: number = -1;

    constructor(
        main: Main
    ) {
        super(main);
    }

    public initialize(): void {
        super.initialize();

        this.deckPlayer = new Deck(this.main.board);

        this.makePlayerDeck();
        this.deckPlayer.hand[0].i = 12;
        this.deckPlayer.hand[0].j = 0;
        this.deckPlayer.hand[1].i = 13;
        this.deckPlayer.hand[1].j = 0;
        this.deckPlayer.shuffle();
        this.deckPlayer.draw();
        this.deckPlayer.updateShape();

        this.main.board.updateShapes();
        this.main.scene.onPointerObservable.add(this.pointerEvent);
    }

    protected abstract makePlayerDeck(): void;

    public pointerEvent = (eventData: BABYLON.PointerInfo) => {
        if (eventData.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            console.log("Alpha");
            if (eventData.pickInfo.pickedMesh) {
                console.log("Bravo " + eventData.pickInfo.pickedMesh.name);
                if (eventData.pickInfo.pickedMesh.name === "shape_12_0") {
                    console.log("Charly");
                    this.pickedCard = 0;
                }
                else if (eventData.pickInfo.pickedMesh.name === "shape_13_0") {
                    this.pickedCard = 1;
                }
            }
        }
        else if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
            let ok = false;
            if (eventData.pickInfo.pickedMesh) {
                let split = eventData.pickInfo.pickedMesh.name.split("_");
                if (split.length === 3) {
                    let i = parseInt(split[1]);
                    let j = parseInt(split[2]);
                    if (isFinite(i) && isFinite(j)) {
                        ok = true;
                        let value = 0;
                        let color = -1;
                        let pickedTile = this.deckPlayer.hand[this.pickedCard];
                        if (pickedTile) {
                            value = pickedTile.value;
                            color = pickedTile.color;
                        }
                        if (this.main.board.play(color, value, i, j)) {
                            pickedTile.reset();
                            this.pickedCard = -1;
                            this.deckPlayer.draw();
                            this.deckPlayer.updateShape();
                        }
                    }
                }
            }
            if (!ok) {
                this.pickedCard = -1;
            }
        }
    }

    public update(): void {

    }

    public dispose(): void {
        super.dispose();
    }
}