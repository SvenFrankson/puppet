class ButtonFactory {

    public static MakeButton(left: number, top: number, text: string, callback: () => void): HTMLButtonElement {
        let button = document.createElement("button");
        button.style.position = "fixed";
        button.style.top = (top * 100).toFixed(1) + "%";
        button.style.left = (left * 100).toFixed(1) + "%";
        button.textContent = text;

        button.addEventListener("pointerup", callback);

        document.body.appendChild(button);

        return button;
    }
}