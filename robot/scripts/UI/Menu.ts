class Menu {

    public mainMenuContainer: HTMLDivElement;
    public playMenuContainer: HTMLDivElement;
    public buildingMenuContainer: HTMLDivElement;
    public ingameMenuContainer: HTMLDivElement;
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
		
		this.mainMenuContainer.appendChild(mainTitle);
		this.mainMenuContainer.appendChild(mainPlay);
		this.mainMenuContainer.appendChild(mainOption);
		this.mainMenuContainer.appendChild(mainCredit);


        this.playMenuContainer = document.getElementById("play-menu") as HTMLDivElement;

        let playTitle = SpacePanel.CreateSpacePanel();
		playTitle.addTitle1("MARS AT WAR");
		playTitle.classList.add("menu-title-panel");
		
		let playTest = SpacePanel.CreateSpacePanel();
		playTest.addTitle2("TEST");
		playTest.classList.add("menu-element-panel");
        playTest.onpointerup = () => {
            this.main.generateScene();
            this.showIngameMenu();
        }
		
		let playBack = SpacePanel.CreateSpacePanel();
		playBack.addTitle2("BACK");
		playBack.classList.add("menu-element-panel");
        playBack.onpointerup = () => {
            this.showMainMenu();
        }
        
		this.playMenuContainer.appendChild(playTitle);
		this.playMenuContainer.appendChild(playTest);
		this.playMenuContainer.appendChild(playBack);


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
                () => { this.main.playerAction.addTurret(buildingButtons[0]); },
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
        ingameMenu.addTitle3("740");
        
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

        this.showMainMenu();
    }

    public showMainMenu(): void {
        this.mainMenuContainer.style.display = "block";
        this.playMenuContainer.style.display = "none";
        this.buildingMenuContainer.style.display = "none";
        this.ingameMenuContainer.style.display = "none";
        this.pauseMenuContainer.style.display = "none";
    }

    public showPlayMenu(): void {
        this.mainMenuContainer.style.display = "none";
        this.playMenuContainer.style.display = "block";
        this.buildingMenuContainer.style.display = "none";
        this.ingameMenuContainer.style.display = "none";
        this.pauseMenuContainer.style.display = "none";
    }

    public showIngameMenu(): void {
        this.mainMenuContainer.style.display = "none";
        this.playMenuContainer.style.display = "none";
        this.buildingMenuContainer.style.display = "block";
        this.ingameMenuContainer.style.display = "block";
        this.pauseMenuContainer.style.display = "none";
    }

    public showPauseMenu(): void {
        this.mainMenuContainer.style.display = "none";
        this.playMenuContainer.style.display = "none";
        this.pauseMenuContainer.style.display = "block";
    }
}