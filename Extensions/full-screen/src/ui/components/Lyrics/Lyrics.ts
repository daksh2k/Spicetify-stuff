import { DOM } from "../../elements";
import CFM from "../../../utils/config";

export class Lyrics {
    static handleLyricsUpdate(evt: any) {
        if (evt.detail.isLoading) return;
        DOM.container.classList.toggle(
            "lyrics-unavailable",
            !(evt.detail.available && (evt.detail?.synced?.length ?? 5) > 1),
        );
    }

    static autoHideLyrics() {
        const lyricsContainer = DOM.container.querySelector(
            "#fad-lyrics-plus-container",
        ) as HTMLElement;
        if (!lyricsContainer.innerText) {
            this.handleLyricsUpdate({ detail: { isLoading: true, available: false } });
            setTimeout(() => this.autoHideLyrics(), 100);
        } else {
            if (lyricsContainer.innerText == "(• _ • )" || lyricsContainer.innerText == "♪ Instrumental ♪") {
                this.handleLyricsUpdate({ detail: { isLoading: false, available: false } });
            } else {
                this.handleLyricsUpdate({ detail: { isLoading: false, available: true } });
            }
        }
    }

    static toggleLyrics() {
        DOM.container.classList.toggle("lyrics-hide-force");
    }
}
