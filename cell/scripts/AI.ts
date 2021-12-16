class AI {

    constructor(
        public player: number,
        public cellNetwork: CellNetworkDisplayed
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
            if (c.value != this.player && c.isSurrounded() === this.player) {
                takenCell.push(c);
            }
            c.neighbors.forEach(n => {
                if (n.value != this.player && n.isSurrounded() === this.player) {
                    takenCell.push(n);
                }
            })
        });
        
        cell.neighbors.forEach((c, i) => {
            c.value = values[i];
        });

        return takenCell.length;
    }

    public getMove2(player: number, depth: number = 0): { cell: Cell, reverse: boolean } {
        let bestGain = - Infinity;

        let opponent: number = player === 0 ? 2 : 0;

        let cloneNetwork = this.cellNetwork.clone();
        let scoreZero = this.cellNetwork.getScore(player);
        let availableCells = cloneNetwork.cells.filter(c => { return c.canRotate(); });
        availableCells = availableCells.filter(c => { return (c.value === player && !(c.isSurrounded() === player)) });
        let availableCellIndexes = availableCells.map(c => { return c.index; });

        let potentialMoves: { cell: Cell, reverse: boolean }[] = [];

        for (let i = 0; i < availableCellIndexes.length; i++) {
            let gain = 0;

            this.cellNetwork.copyValues(cloneNetwork);
            let cell = cloneNetwork.cells[availableCellIndexes[i]];
            cloneNetwork.rotate(cell);
            if (depth === 0) {
                gain = cloneNetwork.getScore(player) - scoreZero;
            }
            if (depth === 1) {
                let opponentMove = this.getMove2(opponent, 0);
                if (opponentMove.cell) {
                    cloneNetwork.rotate(cloneNetwork.cells[opponentMove.cell.index], opponentMove.reverse);
                    gain = cloneNetwork.getScore(player) - scoreZero;
                }
            }
            if (depth === 2) {
                let opponentMove = this.getMove2(opponent, 1);
                if (opponentMove.cell) {
                    cloneNetwork.rotate(cloneNetwork.cells[opponentMove.cell.index], opponentMove.reverse);
                }
                
                let myNextMove = this.getMove2(player, 0);
                if (myNextMove.cell) {
                    cloneNetwork.rotate(cloneNetwork.cells[myNextMove.cell.index], myNextMove.reverse);
                    gain = cloneNetwork.getScore(player) - scoreZero;
                }
            }

            if (gain > bestGain) {
                bestGain = gain;
                let pickedCell = this.cellNetwork.cells[cell.index];
                if (pickedCell) {
                    potentialMoves = [
                        {
                            cell: pickedCell,
                            reverse: false
                        }
                    ]
                }
            }
            else if (gain === bestGain) {
                let pickedCell = this.cellNetwork.cells[cell.index];
                if (pickedCell && !potentialMoves.find(m => { return m.cell.index === cell.index; })) {
                    potentialMoves.push(
                        {
                            cell: pickedCell,
                            reverse: false
                        }
                    );
                }
            }

            gain = 0;
            this.cellNetwork.copyValues(cloneNetwork);
            cell = cloneNetwork.cells[availableCellIndexes[i]];
            cloneNetwork.rotate(cell, true);
            if (depth === 0) {
                gain = cloneNetwork.getScore(player) - scoreZero;
            }
            if (depth === 1) {
                let opponentMove = this.getMove2(opponent, 0);
                if (opponentMove.cell) {
                    cloneNetwork.rotate(cloneNetwork.cells[opponentMove.cell.index], opponentMove.reverse);
                    gain = cloneNetwork.getScore(player) - scoreZero;
                }
            }
            if (depth === 2) {
                let opponentMove = this.getMove2(opponent, 1);
                if (opponentMove.cell) {
                    cloneNetwork.rotate(cloneNetwork.cells[opponentMove.cell.index], opponentMove.reverse);
                }
                
                let myNextMove = this.getMove2(player, 0);
                if (myNextMove.cell) {
                    cloneNetwork.rotate(cloneNetwork.cells[myNextMove.cell.index], myNextMove.reverse);
                    gain = cloneNetwork.getScore(player) - scoreZero;
                }
            }

            if (gain > bestGain) {
                bestGain = gain;
                let pickedCell = this.cellNetwork.cells[cell.index];
                if (pickedCell) {
                    potentialMoves = [
                        {
                            cell: pickedCell,
                            reverse: true
                        }
                    ]
                }
            }
            else if (gain === bestGain) {
                let pickedCell = this.cellNetwork.cells[cell.index];
                if (pickedCell && !potentialMoves.find(m => { return m.cell.index === cell.index; })) {
                    potentialMoves.push(
                        {
                            cell: pickedCell,
                            reverse: true
                        }
                    );
                }
            }
        }

        if (potentialMoves.length > 0) {
            let m = potentialMoves[Math.floor(Math.random() * potentialMoves.length)];
            return m;
        }
        return {
            cell: undefined,
            reverse: false
        };
    }

    public getMove(): { cell: Cell, reverse: boolean } {
        let cloneNetwork = this.cellNetwork.clone();
        console.log(cloneNetwork);
        let bestGain = - Infinity;
        let pickedCellIndex: number = - 1;
        let pickedReverse: boolean = false;

        let availableCells = cloneNetwork.cells.filter(c => { return c.canRotate(); });
        console.log("Available cells = " + availableCells.length);
        availableCells = availableCells.filter(c => { return c.value === this.player || c.value === 2; });
        let noUselessMove = availableCells.filter(c => { return !(c.value === this.player && c.isSurrounded() === this.player); });
        if (noUselessMove.length != 0) {
            availableCells = noUselessMove;
        }

        console.log("Available cells = " + availableCells.length);

        for (let i = 0; i < availableCells.length; i++) {
            let cell = availableCells[i];

            // Check base rotation.
            let gain = this.cellRotationGain(cell, false);
            if (gain > bestGain) {
                bestGain = gain;
                pickedCellIndex = cell.index;
                pickedReverse = false;
            }

            // Check reverse rotation.
            gain = this.cellRotationGain(cell, true);
            if (gain > bestGain) {
                bestGain = gain;
                pickedCellIndex = cell.index;
                pickedReverse = true;
            }
        }
        console.log("BestGain = " + bestGain);

        if (bestGain === 0) {
            let rand = Math.floor(Math.random() * availableCells.length);
            let randomCell = availableCells[rand];
            pickedCellIndex = randomCell.index;
        }

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