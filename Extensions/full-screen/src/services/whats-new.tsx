import ReactDOM from "react-dom";
import { version } from "../../package.json";
import changelog, { VersionedChangelog } from "../constants/changelog";
import semverGt from "semver/functions/gt";
import { marked } from "marked";

export default function showWhatsNew(forcedShow = false) {
    const [title, content] = getChangelogContent(forcedShow);
    showWhatsNewModal(
        "full-screen",
        version,
        {
            title: title,
            content: content,
            isLarge: true,
        },
        forcedShow
    );
}

function getChangelogContent(forcedShow = false) {
    let title: string, content: string;
    if (forcedShow || localStorage.getItem("whats-new_full-screen-version") === null) {
        title = "New in Full Screen";
        content = marked.parse(
            Object.entries(VersionedChangelog)
                .map(([version, changes]) => {
                    return `# v${version}\n${changes}`;
                })
                .join("\n\n"),
            { gfm: true, breaks: true }
        );
    } else {
        title = `New in Full Screen v${version}`;
        content = marked.parse(changelog, { gfm: true, breaks: true });
    }
    return [title, content];
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
        if (
            versionFromLocalstorage === "" ||
            semverGt(currentVersion, versionFromLocalstorage) ||
            forcedShow
        ) {
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
    const [wrapper, style] = getWhatsNewElements();
    wrapper.innerHTML = htmlElement;
    wrapper.append(style);
    return wrapper;
}

function wrapReactElement(reactElement: JSX.Element): Element {
    const [wrapper, style] = getWhatsNewElements();
    ReactDOM.render(reactElement, wrapper);
    wrapper.appendChild(style);
    return wrapper;
}

function getWhatsNewElements() {
    const wrapper = document.createElement("div");
    wrapper.setAttribute("id", "whats-new-content-wrapper");
    const style = document.createElement("style");
    style.textContent = `
      #whats-new-content-wrapper ul, #whats-new-content-wrapper ol {
         list-style: inherit;
         margin-left: 1.5em;
      }
      #whats-new-content-wrapper a{
            color: var(--spice-button);
            text-decoration: underline;
      }
      #whats-new-content-wrapper kbd {
        display: inline-block;
        padding: 3px 5px;
        margin: 0 4px;
        font: 15px ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono,
            monospace;
        line-height: 10px;
        color: #c9d1d9;
        vertical-align: middle;
        background-color: #3b5746;
        border: solid 1px rgba(110, 118, 129, 0.4);
        border-radius: 6px;
        box-shadow: inset 0 -1px 0 rgba(110, 118, 129, 0.4);
    }
   `;
    return [wrapper, style];
}
