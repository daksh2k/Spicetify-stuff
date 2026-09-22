import CFM from "../../../utils/config";
import translations from "../../../resources/strings";
import { DOM } from "../../elements";
import Utils from "../../../utils/utils";
import { Config } from "../../../types/fullscreen";

export class Context {
    static ctxTimer: NodeJS.Timeout;

    static async updateContext() {
        const LOCALE = CFM.getGlobal("locale") as Config["locale"];
        const ctxDetails = await Utils.getContext(translations[LOCALE]).catch((err) =>
            console.error(err),
        );
        DOM.ctx_source.classList.toggle("ctx-no-name", !ctxDetails!.ctxName);

        //Set default icon if no icon is returned
        if (!ctxDetails!.ctxIcon) ctxDetails!.ctxIcon = Spicetify.SVGIcons.spotify;
        DOM.ctx_icon.innerHTML = /^<path/.test(ctxDetails!.ctxIcon)
            ? `<svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">${ctxDetails!.ctxIcon
            }</svg>`
            : ctxDetails!.ctxIcon;

        //Only change the DOM if context is changed
        if (
            DOM.ctx_source.innerText.toLowerCase() !== `${ctxDetails!.ctxSource}`.toLowerCase() ||
            DOM.ctx_name.innerText.toLowerCase() !== ctxDetails!.ctxName.toLowerCase()
        ) {
            DOM.ctx_source.innerText = `${ctxDetails!.ctxSource}`;
            DOM.ctx_name.innerText = ctxDetails!.ctxName;
            if (CFM.get("contextDisplay") === "mousemove") this.hideContext();
        }
    }

    static hideContext() {
        if (this.ctxTimer) {
            clearTimeout(this.ctxTimer);
        }
        if (!DOM.ctx_container) return;
        DOM.ctx_container.style.opacity = "1";
        this.ctxTimer = setTimeout(() => {
            if (DOM.ctx_container?.matches(":hover")) return;
            DOM.ctx_container.style.opacity = "0";
        }, 3000);
    }
}
