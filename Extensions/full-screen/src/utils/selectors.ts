class HtmlSelectors {
    private static readonly EXTRA_BAR_SELECTORS = [
        '[data-testid="now-playing-bar"] > div > div:last-child',
        ".main-nowPlayingBar-right",
        ".Y6soMMBElF7EQDbJv8Xb",
    ];
    private static readonly TOP_BAR_SELECTORS = [
        '#global-nav-bar div:has(> [data-testid="user-widget-link"])',
        ".main-globalNav-navRight",
        ".main-topBar-topbarContentRight>.main-actionButtons",
        ".main-topBar-topbarContentRight",
        ".vRrKblnUUQV5eMbvUdv8>.CuBx12mEGmMQ1XAXHZCs",
        ".main-topBar-historyButtons",
        ".XjaqJVmY9FrZPbQjWDjw.main-actionButtons"

    ];
    private static readonly ORIGINAL_QUEUE_BUTTON_SELECTORS = [
        '[data-testid="control-button-queue"]',
        "div.Y6soMMBElF7EQDbJv8Xb > div > div > button",
        "div.main-nowPlayingBar-right > div > div > button",
    ];
    private static readonly RIGHT_PANEL_SELECTORS = [
        ".Root__right-sidebar",
        ".Root > div:has(> #global-nav-bar) > div:has(> .Root__right-sidebar-peek)",
    ];
    // Spotify 1.3.6+ no longer has .Root__top-container; the global nav's parent is the root grid
    private static readonly TOP_CONTAINER_SELECTORS = [
        ".Root__top-container",
        ".Root > div:has(> #global-nav-bar)",
    ];

    static getTopBarSelector(): HTMLElement | null {
        for (const selector of this.TOP_BAR_SELECTORS) {
            const element = document.querySelector(selector);
            if (element) return element as HTMLElement;
        }
        return null;
    }

    static getExtraBarSelector(): HTMLElement | null {
        for (const selector of this.EXTRA_BAR_SELECTORS) {
            const element = document.querySelector(selector)?.childNodes[0];
            if (element) return element as HTMLElement;
        }
        return null;
    }
    static getOriginalQueueButton(): HTMLElement | null {
        for (const selector of this.ORIGINAL_QUEUE_BUTTON_SELECTORS) {
            const element = document.querySelector(selector);
            if (element) return element as HTMLElement;
        }
        return null;
    }
    static getTopContainer(): HTMLElement | null {
        for (const selector of this.TOP_CONTAINER_SELECTORS) {
            const element = document.querySelector(selector);
            if (element) return element as HTMLElement;
        }
        return null;
    }
    static getRightPanel(): HTMLElement | null {
        for (const selector of this.RIGHT_PANEL_SELECTORS) {
            const element = document.querySelector(selector);
            if (element) return element as HTMLElement;
        }
        return null;
    }
}

export default HtmlSelectors;
