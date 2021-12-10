class AI {

    constructor(
        public cellNetwork: CellNetwork
    ) {

    }

    public getMove(): Cell {
        let availableCells = this.cellNetwork.cells.filter(c => { return c.value != 0; });
        availableCells = availableCells.filter(c => { return c.canRotate(); });

        let n = Math.floor(Math.random() * availableCells.length);

        return availableCells[n];
    }
}