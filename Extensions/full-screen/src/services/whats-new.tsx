import ReactDOM from "react-dom";
import { version } from "../../package.json";
import changelog from "../constants/changelog";
import semverGt from "semver/functions/gt";
import { marked } from "marked";

export default function showWhatsNew(forcedShow = false) {
    showWhatsNewModal(
        "full-screen",
        version,
        {
            title: `New in Full Screen v${version}`,
            content: marked.parse(changelog, { gfm: true, breaks: true }),
            isLarge: true,
        },
        forcedShow
    );
}

interface ModalContent extends Omit<Spicetify.PopupModal.Content, "content"> {
    content: JSX.Element | string;
}

/**
 * @param appName local storage key prefix
 * @param currentVersion current app/extension version. MUST be semver
 * @param content content to display in the modal
 */
async function showWhatsNewModal(
    appName: string,
    currentVersion: string,
    content: ModalContent,
    forcedShow = false
) {
    while (!Spicetify?.PopupModal || !Spicetify?.LocalStorage) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const LS_KEY = `whats-new_${appName}-version`;
    const versionFromLocalstorage = Spicetify.LocalStorage.get(LS_KEY) ?? "";

    try {
        // If versionFromLocalstorage isn't a semver version, it will throw an error
        if (versionFromLocalstorage === "" || semverGt(currentVersion, versionFromLocalstorage) || forcedShow) {
            Spicetify.LocalStorage.set(LS_KEY, currentVersion);
            showModal();
        }
    } catch (err) {
        Spicetify.LocalStorage.set(LS_KEY, currentVersion);
    }

    function showModal() {
        const modalContent: Spicetify.PopupModal.Content = {
            ...content,
            content:
                typeof content.content == "string"
                    ? wrapHTMLElement(content.content)
                    : wrapReactElement(content.content),
        };

        Spicetify.PopupModal.display(modalContent);
    }
}

function wrapHTMLElement(htmlElement: string): Element {
    const wrapper = document.createElement("div");
    wrapper.setAttribute("id", "whats-new-content-wrapper");

    const style = document.createElement("style");
    style.textContent = `
      #whats-new-content-wrapper ul, #whats-new-content-wrapper ol {
         list-style: inherit;
         margin-left: 1em;
      }
   `;

    wrapper.innerHTML = htmlElement;
    wrapper.append(style);

    return wrapper;
}

function wrapReactElement(reactElement: JSX.Element): Element {
    const wrapper = document.createElement("div");
    wrapper.setAttribute("id", "whats-new-content-wrapper");

    const style = document.createElement("style");
    style.textContent = `
      #whats-new-content-wrapper ul, #whats-new-content-wrapper ol {
         list-style: inherit;
         margin-left: 1em;
      }
   `;

    ReactDOM.render(reactElement, wrapper);
    wrapper.appendChild(style);

    return wrapper;
}
