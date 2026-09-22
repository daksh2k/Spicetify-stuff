import CFM from "../../../utils/config";
import { DOM } from "../../elements";
import Utils from "../../../utils/utils";

export class PlayerControls {
    static playerControlsTimer: NodeJS.Timeout;

    static updatePlayerControls(evt: any) {
        if (CFM.get("playerControls") === "mousemove") this.hidePlayerControls();
        Utils.fadeAnimation(DOM.play);
        if (evt.data.is_paused || evt.data.isPaused) {
            DOM.play.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.play}</svg>`;
        } else {
            DOM.play.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.pause}</svg>`;
        }
    }

    static hidePlayerControls() {
        if (this.playerControlsTimer) {
            clearTimeout(this.playerControlsTimer);
        }
        const element = DOM.container.querySelector(".fsd-controls-center") as HTMLElement | null;
        if (!element) return;
        element.style.opacity = "1";
        this.playerControlsTimer = setTimeout(() => {
            if (element.matches(":hover") || element.closest("#fsd-status")?.matches(":hover")) {
                return;
            }
            element.style.opacity = "0";
        }, 3000);
    }
}
