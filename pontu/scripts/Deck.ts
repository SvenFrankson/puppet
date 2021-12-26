class Card {

    constructor(
        public value: number,
        public color: number
    ) {

    }
}

class Deck {

    public cards: Card[] = [];

    constructor() {

    }

    public draw(): Card {
        return this.cards.pop();
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