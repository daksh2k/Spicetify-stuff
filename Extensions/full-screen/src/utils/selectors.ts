class HtmlSelectors {
    private static readonly EXTRA_BAR_SELECTORS = [
        ".main-nowPlayingBar-right",
        ".Y6soMMBElF7EQDbJv8Xb",
    ];
    private static readonly TOP_BAR_SELECTORS = [
        ".vRrKblnUUQV5eMbvUdv8>.CuBx12mEGmMQ1XAXHZCs",
        ".main-topBar-topbarContentRight>.main-actionButtons",
        ".main-topBar-historyButtons",
    ];
    private static readonly ORIGINAL_QUEUE_BUTTON_SELECTORS = [
        "div.Y6soMMBElF7EQDbJv8Xb > div > div > button",
        "div.main-nowPlayingBar-right > div > div > button",
    ];
    private static readonly RIGHT_PANEL_SELECTORS = [".Root__right-sidebar"];

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
    static getRightPanel(): HTMLElement | null {
        for (const selector of this.RIGHT_PANEL_SELECTORS) {
            const element = document.querySelector(selector);
            if (element) return element as HTMLElement;
        }
        return null;
    }
}

export default HtmlSelectors;
