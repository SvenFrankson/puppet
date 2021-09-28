class GeneticAnimation {

    public static PUPPET_COUNT: number = 5;

    public initializeScene(): void {
        for (let i = 0; i < 5; i++) {
			
			let material = new BABYLON.StandardMaterial("preview-blue-material", Main.Scene);
			material.diffuseColor.copyFromFloats(Math.random(), Math.random(), Math.random());
			material.specularColor.copyFromFloats(0.1, 0.1, 0.1);

			let puppet = new Puppet(new BABYLON.Vector3(i *3, 0, 0), material);
			Main.Scene.onBeforeRenderObservable.add(() => {
				puppet.update();
			})
			let controler = new FlightPlanPuppetControler(puppet);
			controler.flightPlan = [
				new BABYLON.Vector2(i *3, 20),
				new BABYLON.Vector2(i *3, 15),
				new BABYLON.Vector2(i *3, 10),
				new BABYLON.Vector2(i *3, 0),
				new BABYLON.Vector2(i *3, - 20),
				new BABYLON.Vector2(i *3, - 15),
				new BABYLON.Vector2(i *3, - 10),
				new BABYLON.Vector2(i *3, 0),
			]
			puppet.puppetControler = controler;
			puppet.puppetControler.initialize();
		}
    }

    public initializeUI(): void {
        for (let i = 0; i < GeneticAnimation.PUPPET_COUNT; i++) {
            let index = i;
            let button = ButtonFactory.MakeButton(0.1 + i * 0.8 / GeneticAnimation.PUPPET_COUNT, 0.9, index.toFixed(0), () => {
                alert("Puppet " + index.toFixed(0) + " selected.");
            })
        }
    }
}