/// <reference path="LevelPlayer.ts"/>

class LevelHumanVsAI extends LevelPlayer {

    public deckAI: Deck;

    constructor(
        main: Main
    ) {
        super(main);
    }

    public initialize(): void {
        super.initialize();

        this.deckAI = new Deck(this.main.board);
        this.makeAIDeck();
        this.deckAI.shuffle();
        this.deckAI.draw();
    }

    public makePlayerDeck(): void {
        for (let c = 0; c < 2; c++) {
            for (let v = 1; v <= 9; v++) {
                for (let n = 0; n < 2; n++) {
                    let card = new Card(v, c);
                    this.deckPlayer.cards.push(card);
                }
            }
        }
    }

    public makeAIDeck(): void {
        for (let c = 2; c < 4; c++) {
            for (let v = 1; v <= 9; v++) {
                for (let n = 0; n < 2; n++) {
                    let card = new Card(v, c);
                    this.deckPlayer.cards.push(card);
                }
            }
        }
    }

    public update(): void {

    }

    public dispose(): void {
        super.dispose();
    }
}