class NavGraphManager {

    public static Instance: NavGraphManager;

    private _navGraphZero: NavGraph;
    private _navGraphs: Map<number, NavGraph>;

    public onObstacleListUpdated: BABYLON.Observable<void>;

    constructor(
        public main: Main
    ) {
        NavGraphManager.Instance = this;
        this._navGraphs = new Map<number, NavGraph>();
        this._navGraphZero = new NavGraph(this.main);
        this._navGraphZero.offset = 0;
        this._navGraphs.set(0, this._navGraphZero);
        this.onObstacleListUpdated = new BABYLON.Observable<void>();
    }

    public static GetForRadius(radius: number): NavGraph {
        return NavGraphManager.Instance.getForOffset(radius);
    }

    public getForOffset(offset: number): NavGraph {
        let navGraph = this._navGraphs.get(offset);
        if (!navGraph) {
            navGraph = new NavGraph(this.main);
            navGraph.offset = offset;
            for (let i = 0; i < this._navGraphZero.obstacles.length; i++) {
                navGraph.obstacles.push(this._navGraphZero.obstacles[i]);
            }
            this._navGraphs.set(offset, navGraph);
        }
        return navGraph;
    }

    public static AddObstacle(obstacle: Obstacle): void {
        if (!obstacle) {
            return;
        }
        return NavGraphManager.Instance.addObstacle(obstacle);
    }

    public addObstacle(obstacle: Obstacle): void {
        if (!obstacle) {
            return;
        }
        this._navGraphs.forEach(
            (navGraph) => {
                navGraph.obstacles.push(obstacle);
            }
        )
        this.onObstacleListUpdated.notifyObservers();
    }

    public static RemoveObstacle(obstacle: Obstacle): void {
        return NavGraphManager.Instance.removeObstacle(obstacle);
    }

    public removeObstacle(obstacle: Obstacle): void {
        this._navGraphs.forEach(
            (navGraph) => {
                let index = navGraph.obstacles.indexOf(obstacle);
                if (index !== -1) {
                    navGraph.obstacles.splice(index, 1);
                }
            }
        )
        this.onObstacleListUpdated.notifyObservers();
    }
}