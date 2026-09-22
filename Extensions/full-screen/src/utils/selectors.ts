class HtmlSelectors {
    private static readonly EXTRA_BAR_SELECTORS = [
        ".main-nowPlayingBar-right",
        ".Y6soMMBElF7EQDbJv8Xb",
    ];
    private static readonly TOP_BAR_SELECTORS = [
        ".main-globalNav-contentRight .main-actionButtons .main-actionButtons",
        ".main-globalNav-contentRight .main-actionButtons",
        ".main-globalNav-contentRight",
        ".main-globalNav-navRight",
        ".main-topBar-topbarContentRight>.main-actionButtons",
        ".main-topBar-topbarContentRight",
        ".vRrKblnUUQV5eMbvUdv8>.CuBx12mEGmMQ1XAXHZCs",
        ".main-topBar-historyButtons",
    ];
    private static readonly ORIGINAL_QUEUE_BUTTON_SELECTORS = [
        '[data-testid="control-button-queue"]',
        '[data-testid="queue-button"]',
        'button.control-button--queue',
        'button[aria-label*="Queue" i]',
        'button[aria-label*="Warteschlange" i]',
        'button[aria-label*="Cola" i]',
        'button[aria-label*="Fila" i]',
        'button[aria-label*="Kø" i]',
        'button[aria-label*="Kö" i]',
        'button[aria-label*="File d\'attente" i]',
        '.main-nowPlayingBar-right button[data-testid*="queue" i]',
        "div.Y6soMMBElF7EQDbJv8Xb > div > div > button",
        "div.main-nowPlayingBar-right > div > div > button",
    ];
    private static readonly RIGHT_PANEL_SELECTORS = [
        ".Root__right-sidebar",
        "aside.main-nowPlayingView-container",
        "aside.Root__right-sidebar",
        '[data-testid="right-sidebar"]',
        "aside[aria-label]",
        "aside",
    ];

    static getTopBarSelector(): HTMLElement | null {
        for (const selector of this.TOP_BAR_SELECTORS) {
            const element = document.querySelector(selector);
            if (element) return element as HTMLElement;
        }
        // Spotify's test IDs survive class-name hashing and work before CSS maps update.
        return document.querySelector<HTMLElement>('[data-testid="user-widget-link"]')?.parentElement ?? null;
    }

    static getExtraBarSelector(): HTMLElement | null {
        for (const selector of this.EXTRA_BAR_SELECTORS) {
            const element = document.querySelector(selector)?.firstElementChild;
            if (element) return element as HTMLElement;
        }
        return document.querySelector<HTMLElement>('[data-testid="fullscreen-mode-button"]')?.parentElement ?? null;
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
