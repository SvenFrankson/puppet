class Card {

    constructor(
        public value: number,
        public color: number
    ) {

    }
}

class Deck {

    public cards: Card[] = [];
    public hand: Tile[] = [];

    constructor(public board: Board, public handSize: number = 2) {
        this.hand = [];
        for (let i = 0; i < this.handSize; i++) {
            this.hand.push(new Tile(- 1, - 1, this.board));
        }
    }

    public draw(): boolean {
        for (let i = 0; i < this.handSize; i++) { 
            let cardSlot = this.hand[i];
            if (cardSlot.value === 0) {
                let c = this.cards.pop();
                if (c) {
                    cardSlot.color = c.color;
                    cardSlot.value = c.value;
                }
                else {
                    return false;
                }
            }
        }
        return true;
    }

    public updateShape(): void {
        for (let i = 0; i < this.handSize; i++) {
            this.hand[i].updateShape();
        }
    }

    public shuffle(): void {
        let l = this.cards.length;
        for (let n = 0; n < l * l; n++) {
            let i0 = Math.floor(Math.random() * l);
            let i1 = Math.floor(Math.random() * l);
            let c0 = this.cards[i0];
            let c1 = this.cards[i1];
            this.cards[i0] = c1;
            this.cards[i1] = c0;
        }
    }
}