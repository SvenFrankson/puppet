class Menu {

    public mainMenuContainer: HTMLDivElement;
    public playMenuContainer: HTMLDivElement;
    public creditMenuContainer: HTMLDivElement;
    public buildingMenuContainer: HTMLDivElement;
    public ingameMenuContainer: HTMLDivElement;
    private _goldElement: HTMLElement;
    public pauseMenuContainer: HTMLDivElement;
    public debugContainer: HTMLDivElement;

    constructor(
        public main: Main
    ) {

    }

    public initializeMenu(): void {
        this.mainMenuContainer = document.getElementById("main-menu") as HTMLDivElement;

        let mainTitle = SpacePanel.CreateSpacePanel();
		mainTitle.addTitle1("MARS AT WAR");
		mainTitle.classList.add("menu-title-panel");
		
		let mainPlay = SpacePanel.CreateSpacePanel();
		mainPlay.addTitle2("PLAY");
		mainPlay.classList.add("menu-element-panel");
        mainPlay.onpointerup = () => {
            this.showPlayMenu();
        }
		
		let mainOption = SpacePanel.CreateSpacePanel();
		mainOption.addTitle2("OPTIONS");
		mainOption.classList.add("menu-element-panel");
		
		let mainCredit = SpacePanel.CreateSpacePanel();
		mainCredit.addTitle2("CREDITS");
		mainCredit.classList.add("menu-element-panel");
        mainCredit.onpointerup = () => {
            this.showCreditMenu();
        }
		
		this.mainMenuContainer.appendChild(mainTitle);
		this.mainMenuContainer.appendChild(mainPlay);
		this.mainMenuContainer.appendChild(mainOption);
		this.mainMenuContainer.appendChild(mainCredit);


        this.playMenuContainer = document.getElementById("play-menu") as HTMLDivElement;

        let playTitle = SpacePanel.CreateSpacePanel();
		playTitle.addTitle1("MARS AT WAR");
		playTitle.classList.add("menu-title-panel");
		
		let playTestMain = SpacePanel.CreateSpacePanel();
		playTestMain.addTitle2("MAIN TEST");
		playTestMain.classList.add("menu-element-panel");
        playTestMain.onpointerup = () => {
            this.main.generateTestMainScene();
            this.showIngameMenu();
        }

        let playTestMeteor = SpacePanel.CreateSpacePanel();
		playTestMeteor.addTitle2("METEOR TEST");
		playTestMeteor.classList.add("menu-element-panel");
        playTestMeteor.onpointerup = () => {
            this.main.generateTestMeteorScene();
            this.showIngameMenu();
        }
		
		let playBack = SpacePanel.CreateSpacePanel();
		playBack.addTitle2("BACK");
		playBack.classList.add("menu-element-panel");
        playBack.onpointerup = () => {
            this.showMainMenu();
        }
        
		this.playMenuContainer.appendChild(playTitle);
		this.playMenuContainer.appendChild(playTestMain);
		this.playMenuContainer.appendChild(playTestMeteor);
		this.playMenuContainer.appendChild(playBack);

        this.creditMenuContainer = document.getElementById("credit-menu") as HTMLDivElement;

        let creditTitle = SpacePanel.CreateSpacePanel();
		creditTitle.addTitle1("MARS AT WAR");
		creditTitle.classList.add("menu-title-panel");
		
		let creditCredit = SpacePanel.CreateSpacePanel();
		creditCredit.addTitle2("CREDIT");
		creditCredit.classList.add("menu-element-panel");
        creditCredit.addTitle3("Code & Graphism by Sven Frankson");
        creditCredit.addTitle3("Orbitron font by Matt McInerney");
        creditCredit.addTitle3("Anurati font by Richard Emmeran");
        creditCredit.addTitle3("Powered by BABYLONJS");
		
		let creditBack = SpacePanel.CreateSpacePanel();
		creditBack.addTitle2("BACK");
		creditBack.classList.add("menu-element-panel");
        creditBack.onpointerup = () => {
            this.showMainMenu();
        }
        
		this.creditMenuContainer.appendChild(creditTitle);
		this.creditMenuContainer.appendChild(creditCredit);
		this.creditMenuContainer.appendChild(creditBack);


        this.buildingMenuContainer = document.getElementById("building-menu") as HTMLDivElement;
		
		let buildingMenu = SpacePanel.CreateSpacePanel();
        buildingMenu.classList.add("building-menu");
        /*
		buildingShowMenu.addTitle2("MENU");
        buildingShowMenu.onpointerup = () => {
            this.showPauseMenu();
        }
        */
        let buildingButtons = buildingMenu.addSquareButtons(
            ["TOWER", "WALL"],
            [
                () => {
                    if (this.main.playerAction.currentActionType === PlayerActionType.AddTurret) {
                        this.main.playerAction.cancelAddTurret();
                    }
                    else {
                        this.main.playerAction.addTurret(buildingButtons[0]);
                    }
                },
                () => { this.main.playerAction.addWall(buildingButtons[1]); }
            ]
        );
        buildingButtons[0].style.backgroundImage = "url(assets/icons/tower.png)";
        buildingButtons[1].style.backgroundImage = "url(assets/icons/wall.png)";
        
		this.buildingMenuContainer.appendChild(buildingMenu);


        this.ingameMenuContainer = document.getElementById("ingame-menu") as HTMLDivElement;
		
		let ingameMenu = SpacePanel.CreateSpacePanel();
        ingameMenu.classList.add("ingame-menu");
        /*
		ingameShowMenu.addTitle2("MENU");
        ingameShowMenu.onpointerup = () => {
            this.showPauseMenu();
        }
        */
        ingameMenu.addLargeButton("MENU", () => {
            this.showPauseMenu();
        });
        this._goldElement = ingameMenu.addTitle3("740");
        
		this.ingameMenuContainer.appendChild(ingameMenu);


        this.pauseMenuContainer = document.getElementById("pause-menu") as HTMLDivElement;
		
		let pauseResume = SpacePanel.CreateSpacePanel();
		pauseResume.addTitle2("RESUME GAME");
		pauseResume.classList.add("menu-element-panel");
        pauseResume.onpointerup = () => {
            this.showIngameMenu();
        }
		
		let pauseExit = SpacePanel.CreateSpacePanel();
		pauseExit.addTitle2("EXIT");
		pauseExit.classList.add("menu-element-panel");
        pauseExit.onpointerup = () => {
            this.main.disposeScene();
            this.showMainMenu();
        }
        
		this.pauseMenuContainer.appendChild(pauseResume);
		this.pauseMenuContainer.appendChild(pauseExit);

        
        this.debugContainer = document.getElementById("debug-menu") as HTMLDivElement;
		
		let debugPanel = SpacePanel.CreateSpacePanel();
		debugPanel.addTitle2("DEBUG");
		debugPanel.classList.add("debug-panel");
        debugPanel.onpointerup = () => {
            this.showIngameMenu();
        }

        debugPanel.addTitle3("X : Y").id = "debug-pointer-xy";
        debugPanel.addTitle3("distance to next").id = "distance-to-next";
        debugPanel.addTitle3("target rot").id = "target-rot";


        let navGraphConsole = new NavGraphConsole(this.main.scene);
        navGraphConsole.enable();

        this.showMainMenu();
    }

    public showMainMenu(): void {
        this.mainMenuContainer.style.display = "block";
        this.playMenuContainer.style.display = "none";
        this.creditMenuContainer.style.display = "none";
        this.buildingMenuContainer.style.display = "none";
        this.ingameMenuContainer.style.display = "none";
        this.pauseMenuContainer.style.display = "none";
    }

    public showPlayMenu(): void {
        this.mainMenuContainer.style.display = "none";
        this.playMenuContainer.style.display = "block";
        this.creditMenuContainer.style.display = "none";
        this.buildingMenuContainer.style.display = "none";
        this.ingameMenuContainer.style.display = "none";
        this.pauseMenuContainer.style.display = "none";
    }

    public showCreditMenu(): void {
        this.mainMenuContainer.style.display = "none";
        this.playMenuContainer.style.display = "none";
        this.creditMenuContainer.style.display = "block";
        this.buildingMenuContainer.style.display = "none";
        this.ingameMenuContainer.style.display = "none";
        this.pauseMenuContainer.style.display = "none";
    }


    public showIngameMenu(): void {
        this.mainMenuContainer.style.display = "none";
        this.playMenuContainer.style.display = "none";
        this.creditMenuContainer.style.display = "none";
        this.buildingMenuContainer.style.display = "block";
        this.ingameMenuContainer.style.display = "block";
        this.pauseMenuContainer.style.display = "none";
    }

    public showPauseMenu(): void {
        this.mainMenuContainer.style.display = "none";
        this.playMenuContainer.style.display = "none";
        this.creditMenuContainer.style.display = "none";
        this.pauseMenuContainer.style.display = "block";
    }

    public setGold(v: number): void {
        this._goldElement.innerText = v.toFixed(0);
    }
}