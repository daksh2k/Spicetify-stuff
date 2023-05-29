import ICONS from "../constants";
import CFM from "../utils/config";

export const getHtmlContent = (areLyricsForceHidden: boolean) => {
    return `
        <canvas id="fsd-background"></canvas>
  ${
      CFM.get("contextDisplay") !== "never"
          ? `
   <div id="fsd-ctx-container">
      <div id="fsd-ctx-icon"></div>
      <div id="fsd-ctx-details">
        <div id="fsd-ctx-source"></div>
        <div id="fsd-ctx-name"></div>
      </div>
    </div>`
          : ""
  }
 ${
     CFM.get("upnextDisplay")
         ? `
<div id="fsd-upnext-container">
      <div id="fsd_next_art">
        <div id="fsd_next_art_image"></div>
       </div>
      <div id="fsd_next_details">
        <div id="fsd_up_next_text"></div>
        <div id="fsd_next_tit_art">
        <div id="fsd_next_tit_art_inner">
        <span id="fsd_first_span"></span>
        <span id="fsd_second_span"></span>
        </div></div>
      </div>
    </div>`
         : ""
 }
<div id="fsd-volume-parent"></div>
${CFM.get("lyricsDisplay") ? `<div id="fad-lyrics-plus-container"></div>` : ""}
<div id="fsd-foreground">
    <div id="fsd-art">
        <div id="fsd-art-image">
            <div id="fsd-art-inner"></div>
        </div>
    </div>
    <div id="fsd-details">
            <div id="fsd-title">
                 ${ICONS.PLAYING_ICON}
                 ${ICONS.PAUSED_ICON}
                 <span></span>
            </div>
            <div id="fsd-artist">
                ${ICONS.ARTIST}
                <span></span>
            </div>
            ${
                CFM.get("showAlbum") !== "never"
                    ? `<div id="fsd-album">
                 ${ICONS.ALBUM}
                 <span></span>
            </div>`
                    : ""
            } 
            <div id="fsd-status" class="${
                CFM.get("playerControls") ||
                CFM.get("extraControls") ||
                CFM.get("progressBarDisplay")
                    ? "active"
                    : ""
            }">
                ${
                    CFM.get("extraControls")
                        ? `<div class="fsd-controls-left fsd-controls extra-controls">
                       <button class="fs-button" id="fsd-heart">
                           <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["heart"]}</svg>
                       </button>
                       <button class="fs-button" id="fsd-shuffle">
                           <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["shuffle"]}</svg>
                       </button>
                    </div>`
                        : ""
                }
                    ${
                        CFM.get("playerControls")
                            ? `
                    <div class="fsd-controls-center fsd-controls">
                        <button class="fs-button" id="fsd-back">
                            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["skip-back"]}</svg>
                        </button>
                        <button class="fs-button" id="fsd-play">
                            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.play}</svg>
                        </button>
                        <button class="fs-button" id="fsd-next">
                            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["skip-forward"]}</svg>
                        </button>
                    </div>`
                            : ""
                    }
                ${
                    CFM.get("extraControls")
                        ? `<div class="fsd-controls-right fsd-controls extra-controls">
                        ${
                            CFM.get("invertColors") === "auto"
                                ? `<button class="fs-button" id="fsd-invert"> ${ICONS.INVERT_ACTIVE}</button>`
                                : ""
                        }
                       <button class="fs-button" id="fsd-repeat">
                            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${
                                Spicetify.SVGIcons["repeat"]
                            }</svg>
                       </button>
                       ${
                           CFM.get("lyricsDisplay")
                               ? `<button id="fsd-lyrics" class="fs-button ${
                                     areLyricsForceHidden ? "" : "button-active"
                                 }">
                          ${areLyricsForceHidden ? ICONS.LYRICS_ACTIVE : ICONS.LYRICS_INACTIVE}
                       </button>`
                               : ""
                       }
                    </div>`
                        : ""
                }
                ${
                    CFM.getGlobal("tvMode") &&
                    !(CFM.get("playerControls") && CFM.get("extraControls"))
                        ? `<div id="fsd-progress-parent"></div>`
                        : ""
                }
            </div>
            ${
                CFM.getGlobal("tvMode") && CFM.get("playerControls") && CFM.get("extraControls")
                    ? `<div id="fsd-progress-parent"></div>`
                    : ""
            }
    </div>
    ${!CFM.getGlobal("tvMode") ? `<div id="fsd-progress-parent"></div>` : ""}
</div>`;
};
