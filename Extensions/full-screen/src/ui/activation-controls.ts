import HtmlSelectors from "../utils/selectors";

export interface ActivationButton {
    label: string;
    icon: string;
    activate: () => void;
    configure: () => void;
}

export interface ActivationControlsOptions {
    tv?: ActivationButton;
    default?: ActivationButton;
    hideOriginal: boolean;
}

/** Own the controls; Spotify only supplies optional places to put them. */
export function mountActivationControls(options: ActivationControlsOptions): () => void {
    const buttons = new Map<"tv" | "default", HTMLButtonElement>();
    const dock = document.createElement("div");
    dock.id = "fullscreen-activation-dock";
    dock.setAttribute("role", "group");
    const hiddenOriginals = new Set<HTMLElement>();
    const tooltips = new Map<HTMLButtonElement, { hide: () => void; destroy: () => void }>();
    const failedTooltips = new Set<HTMLButtonElement>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    for (const mode of ["tv", "default"] as const) {
        const config = options[mode];
        if (!config) continue;
        const button = document.createElement("button");
        button.id = `fullscreen-${mode}-button`;
        button.type = "button";
        button.className = "fsd-activation-button";
        button.title = config.label;
        button.setAttribute("aria-label", config.label);
        button.innerHTML = config.icon;
        button.setAttribute("style", "-webkit-app-region: no-drag;");
        button.onclick = () => {
            tooltips.get(button)?.hide();
            config.activate();
        };
        button.oncontextmenu = (event) => {
            event.preventDefault();
            tooltips.get(button)?.hide();
            config.configure();
        };
        buttons.set(mode, button);
    }

    function reconcile() {
        timer = undefined;
        if (disposed) return;
        // Our own moves must not trigger an endless observer/reinsert loop.
        observer.disconnect();
        const topBar = HtmlSelectors.getTopBarSelector();
        const extraBar = HtmlSelectors.getExtraBarSelector();
        for (const [mode, button] of buttons) {
            const target = (mode === "tv" ? topBar ?? extraBar : extraBar) ?? dock;
            if (button.parentElement !== target) {
                if (mode === "tv") target.prepend(button);
                else target.append(button);
            }
            if (!tooltips.has(button) && !failedTooltips.has(button) && Spicetify.Tippy && Spicetify.TippyProps) {
                try {
                    const tooltip = Spicetify.Tippy(button, {
                        ...Spicetify.TippyProps,
                        content: options[mode]!.label,
                        placement: mode === "tv" ? "bottom" : "top",
                        trigger: "mouseenter focus",
                        allowHTML: false,
                        appendTo: () => document.body,
                    });
                    tooltips.set(button, tooltip);
                    // Avoid showing the browser's title tooltip on top of Spotify's.
                    button.removeAttribute("title");
                } catch {
                    // A changed tooltip API must not break activation; keep the title fallback.
                    failedTooltips.add(button);
                }
            }
        }
        if (dock.childElementCount) {
            if (!dock.isConnected) document.body.append(dock);
        } else dock.remove();

        if (options.hideOriginal) {
            for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="fullscreen-mode-button"]'))) {
                element.classList.add("fsd-native-fullscreen-hidden");
                hiddenOriginals.add(element);
            }
            for (const element of hiddenOriginals) {
                if (!element.isConnected) {
                    element.classList.remove("fsd-native-fullscreen-hidden");
                    hiddenOriginals.delete(element);
                }
            }
        }
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function schedule() {
        if (!disposed && timer === undefined) timer = setTimeout(reconcile, 250);
    }

    const observer = new MutationObserver(schedule);
    reconcile();
    window.addEventListener("resize", schedule);
    // Return cleanup for hot reloads and tests; preserve Spotify's native controls.
    return () => {
        disposed = true;
        observer.disconnect();
        clearTimeout(timer);
        window.removeEventListener("resize", schedule);
        for (const tooltip of tooltips.values()) tooltip.destroy();
        tooltips.clear();
        for (const button of buttons.values()) button.remove();
        dock.remove();
        for (const element of hiddenOriginals) element.classList.remove("fsd-native-fullscreen-hidden");
        hiddenOriginals.clear();
    };
}
