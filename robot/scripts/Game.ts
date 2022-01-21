class Game {

    public gold: number = 0;

    constructor(
        public main: Main
    ) {
        this.main.scene.onBeforeRenderObservable.add(this._update);
    }

    public pay(amount: number): boolean {
        if (this.canPay(amount)) {
            this.gold -= amount;
            this.main.menu.setGold(this.gold);
            return true;
        }
        return false;
    }

    public canPay(amount: number): boolean {
        if (amount <= this.gold) {
            return true;
        }
        return false;
    }

    public credit(amount: number): void {
        this.gold += amount;
        this.main.menu.setGold(this.gold);
    }

    public _update = () => {

    }
}