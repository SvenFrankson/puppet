class AI {

    constructor(
        public cellNetwork: CellNetwork
    ) {

    }

    public countValue(cells: Cell[], v: number): number {
        let count = 0;
        for (let i = 0; i < cells.length; i++) {
            if (cells[i].value === v) {
                count++;
            }
        }
        return count;
    }

    public cellRotationGain(cell: Cell, reverse: boolean = false): number {
        let values: number[] = [];
        cell.neighbors.forEach((c, i) => {
            values[i] = c.value;
        });
        let m = - 1;
        if (reverse) {
            m = 1;
        }
        cell.neighbors.forEach((c, i) => {
            c.value = values[(i + m + values.length) % values.length];
        });

        let takenCell: UniqueList<Cell> = new UniqueList<Cell>();
        cell.neighbors.forEach(c => {
            if (c.value != 1 && c.isSurrounded() === 1) {
                takenCell.push(c);
            }
            c.neighbors.forEach(n => {
                if (n.value != 1 && n.isSurrounded() === 1) {
                    takenCell.push(n);
                }
            })
        });
        
        cell.neighbors.forEach((c, i) => {
            c.value = values[i];
        });

        return takenCell.length;
    }


    public getMove(): { cell: Cell, reverse: boolean } {
        let cloneNetwork = this.cellNetwork.duplicateNetwork();
        console.log(cloneNetwork);
        let bestGain = - Infinity;
        let pickedCellIndex: number = - 1;
        let pickedReverse: boolean = false;

        let availableCells = cloneNetwork.cells.filter(c => { return c.canRotate(); });
        console.log("Available cells = " + availableCells.length);
        availableCells = availableCells.filter(c => { return c.value != 0; });

        console.log("Available cells = " + availableCells.length);

        for (let i = 0; i < availableCells.length; i++) {
            let r = Math.random() > 0.5;
            let cell = availableCells[i];

            // Check base rotation.
            let gain = this.cellRotationGain(cell, false);
            if (gain > bestGain || gain === bestGain && r) {
                bestGain = gain;
                pickedCellIndex = cell.index;
                pickedReverse = false;
            }

            // Check reverse rotation.
            gain = this.cellRotationGain(cell, true);
            if (gain > bestGain || gain === bestGain && r) {
                bestGain = gain;
                pickedCellIndex = cell.index;
                pickedReverse = true;
            }
        }
        console.log("BestGain = " + bestGain);

        console.log("PickedCellIndex = " + pickedCellIndex);

        let pickedCell = undefined;
        if (pickedCellIndex != - 1) {
            pickedCell = this.cellNetwork.cells[pickedCellIndex];
        }

        return {
            cell: pickedCell,
            reverse: pickedReverse
        }
    }
}