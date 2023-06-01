import { marked } from "marked";
import ICONS, { DEFAULTS } from "../constants";
import { Config, Settings } from "../types/fullscreen";
import { version } from "../../package.json";
import showWhatsNew from "../services/whats-new";
import CFM from "../utils/config";

export function headerText(text: string, subtext = "") {
    const container = document.createElement("div");
    container.classList.add("setting-subhead");
    const listHeader = document.createElement("h2");
    listHeader.innerText = text;
    container.append(listHeader);
    if (subtext) {
        const listSub = document.createElement("div");
        listSub.classList.add("setting-subhead-description");
        listSub.innerHTML = marked.parse(subtext, { breaks: true });
        container.append(listSub);
    }
    return container;
}

export function getSettingCard(
    actionContent: string,
    title: string,
    key: keyof Settings | keyof Config,
    description = ""
) {
    const settingCard = document.createElement("div");
    settingCard.classList.add("setting-card");
    settingCard.setAttribute("setting-key", key);
    if (key in DEFAULTS) {
        settingCard.setAttribute(
            "setting-default",
            String(CFM.getGlobal(key as keyof Config) === DEFAULTS[key as keyof Config])
        );
    } else {
        settingCard.setAttribute(
            "setting-default",
            String(
                CFM.get(key as keyof Settings) === DEFAULTS[CFM.getMode()][key as keyof Settings]
            )
        );
    }
    settingCard.innerHTML = `
        <div class="setting-container">
            <div class="setting-item">
                <label class="setting-title">${title}</label>
                <div class="setting-action">${actionContent}</div>
            </div>
            <div class="setting-description">${marked.parse(description, { breaks: true })}</div>
        </div>
    `;
    return settingCard;
}

export function createAdjust(
    title: string,
    key: keyof Settings,
    unit = "",
    configValue: number,
    step: number,
    min: number,
    max: number,
    onChange: (_: string | number) => void,
    extraDescription = ""
) {
    let value = configValue;

    function adjustValue(dir: number) {
        let temp = Number(value) + dir * step;
        if (temp < min) {
            temp = min;
        } else if (temp > max) {
            temp = max;
        }
        value = Number(Number(temp).toFixed(step >= 1 ? 0 : 2));
        (settingCard.querySelector(".adjust-value") as HTMLElement).innerText = `${value}${unit}`;
        plus && plus.classList.toggle("disabled", value === max);
        minus && minus.classList.toggle("disabled", value === min);
        onChange(value);
    }
    const settingCard = getSettingCard(
        `<button class="switch small minus">${ICONS.MINUS}</button>
            <p class="adjust-value">${value}${unit}</p>
        <button class="switch small plus"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.plus2px}</button>`,
        title,
        key,
        extraDescription
    );
    const minus = settingCard.querySelector<HTMLElement>(".minus");
    const plus = settingCard.querySelector<HTMLElement>(".plus");
    if (minus && plus) {
        minus.classList.toggle("disabled", value === min);
        plus.classList.toggle("disabled", value === max);
        minus.onclick = () => adjustValue(-1);
        plus.onclick = () => adjustValue(1);
    }
    return settingCard;
}

export function getAboutSection() {
    const settingCard = document.createElement("div");
    settingCard.classList.add("setting-card");
    settingCard.innerHTML = `
        <div class="setting-container about-section">
            <div class="setting-about">Version: ${"  " + version}</div>
            <div class="setting-about">Made with 💖 by <a class="about" href="https://github.com/daksh2k">@daksh2k</a></div>
            <div class="setting-about">Source code: <a class="about" href="https://github.com/daksh2k/Spicetify-stuff/tree/master/Extensions/full-screen">GitHub</a></div>
            <div class="setting-about">Report issues: <a class="about" href="https://github.com/daksh2k/Spicetify-stuff/issues/new/choose">GitHub</a></div>
            <div class="setting-about"><button class="main-buttons-button main-button-primary" id="changelog">Show Changelog</button></div>
        </div>
    `;
    (settingCard.querySelector("#changelog") as HTMLButtonElement).onclick = () => {
        const popup = document.querySelector("body > generic-modal");
        if (popup) popup.remove();
        setTimeout(() => showWhatsNew(true), 100);
    };
    return settingCard;
}
