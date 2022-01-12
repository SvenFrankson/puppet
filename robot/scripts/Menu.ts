class Menu {

    public mainMenu: HTMLDivElement;
    public playMenu: HTMLDivElement;
    public ingameMenu: HTMLDivElement;
    public pauseMenu: HTMLDivElement;

    constructor(
        public main: Main
    ) {

    }

    public initializeMenu(): void {
        this.mainMenu = document.getElementById("main-menu") as HTMLDivElement;

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
		
		this.mainMenu.appendChild(mainTitle);
		this.mainMenu.appendChild(mainPlay);
		this.mainMenu.appendChild(mainOption);
		this.mainMenu.appendChild(mainCredit);


        this.playMenu = document.getElementById("play-menu") as HTMLDivElement;

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
        
		this.playMenu.appendChild(playTitle);
		this.playMenu.appendChild(playTest);
		this.playMenu.appendChild(playBack);


        this.ingameMenu = document.getElementById("ingame-menu") as HTMLDivElement;
		
		let ingameShowMenu = SpacePanel.CreateSpacePanel();
		ingameShowMenu.addTitle2("MENU");
		ingameShowMenu.classList.add("ingame-element-showmenu");
        ingameShowMenu.onpointerup = () => {
            this.showPauseMenu();
        }
        
		this.ingameMenu.appendChild(ingameShowMenu);


        this.pauseMenu = document.getElementById("pause-menu") as HTMLDivElement;
		
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
        
		this.pauseMenu.appendChild(pauseResume);
		this.pauseMenu.appendChild(pauseExit);

        this.showMainMenu();
    }

    public showMainMenu(): void {
        this.mainMenu.style.display = "block";
        this.playMenu.style.display = "none";
        this.ingameMenu.style.display = "none";
        this.pauseMenu.style.display = "none";
    }

    public showPlayMenu(): void {
        this.mainMenu.style.display = "none";
        this.playMenu.style.display = "block";
        this.ingameMenu.style.display = "none";
        this.pauseMenu.style.display = "none";
    }

    public showIngameMenu(): void {
        this.mainMenu.style.display = "none";
        this.playMenu.style.display = "none";
        this.ingameMenu.style.display = "block";
        this.pauseMenu.style.display = "none";
    }

    public showPauseMenu(): void {
        this.mainMenu.style.display = "none";
        this.playMenu.style.display = "none";
        this.pauseMenu.style.display = "block";
    }
}