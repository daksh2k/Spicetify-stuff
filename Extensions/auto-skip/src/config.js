let CONFIG;

/**
 * Get the CONFIG object from localStorage
 * @returns {object} CONFIG object
 */
export function getConfig() {
    if (CONFIG) return CONFIG;
    try {
        const parsed = JSON.parse(localStorage.getItem("auto-skip:skips") ?? "{}");
        if (parsed && typeof parsed === "object") {
            CONFIG = parsed;
            return CONFIG;
        }
        throw "";
    } catch {
        localStorage.setItem("auto-skip:skips", "{}");
        CONFIG = {};
        return CONFIG;
    }
}

/**
 * Save the CONFIG object to localStorage
 * @param {object} changedConfig
 */
export function saveConfig(changedConfig) {
    CONFIG = changedConfig;
    localStorage.setItem("auto-skip:skips", JSON.stringify(CONFIG));
}

/**
 * Load the STATS object from localStorage
 * @param {object} SKIPS
 * @returns {object} STATS object
 */
export function loadStats(SKIPS) {
    if (localStorage.getItem("auto-skip:stats") === null) {
        localStorage.setItem("auto-skip:stats", "{}");
    }
    const STATS = JSON.parse(localStorage.getItem("auto-skip:stats") ?? "{}");
    Object.keys(SKIPS)
        .filter((key) => STATS[key] === undefined)
        .forEach((key) => (STATS[key] = 0));
    localStorage.setItem("auto-skip:stats", JSON.stringify(STATS));
    return STATS;
}
