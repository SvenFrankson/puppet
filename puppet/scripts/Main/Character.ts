class Character {

    private basePower: number = 10;
    private baseSmoothness: number = 10;
    private baseResilience: number = 10;
    private baseConnectivity: number = 10;
    private baseIntelligence: number = 10;
    private baseExpertise: number = 10;

    public get currentPower(): number {
        return this.basePower;
    }

    public get currentSmoothness(): number {
        return this.baseSmoothness;
    }

    public get currentResilience(): number {
        return this.baseResilience;
    }

    public get currentConnectivity(): number {
        return this.baseConnectivity;
    }

    public get currentIntelligence(): number {
        return this.baseIntelligence;
    }

    public get currentExpertise(): number {
        return this.baseExpertise;
    }
}