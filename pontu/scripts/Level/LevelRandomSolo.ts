/// <reference path="LevelPlayer.ts"/>

class LevelRandomSolo extends LevelPlayer {

    constructor(
        main: Main
    ) {
        super(main);
    }

    public initialize(): void {
        super.initialize();
    }

    public makePlayerDeck(): void {
        for (let c = 0; c < 4; c++) {
            for (let v = 1; v <= 9; v++) {
                for (let n = 0; n < 2; n++) {
                    let card = new Card(v, c);
                    this.deckPlayer.cards.push(card);
                }
            }
        }
    }

    public update(): void {
        super.update();
    }

    public dispose(): void {
        super.dispose();
    }
}