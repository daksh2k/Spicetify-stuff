// @ts-check

// NAME: Add Volume Percentage
// AUTHOR: daksh2k
// DESCRIPTION: Add the Volume Percentage to the Volume Bar

/// <reference path="../shared/types/spicetify.d.ts" />

(function addVolumep() {
    const volumeBar = document.querySelector(".main-nowPlayingBar-volumeBar");
    if (
        !(volumeBar instanceof HTMLElement) ||
        !Spicetify.Player ||
        !Spicetify.Platform?.PlaybackAPI
    ) {
        setTimeout(addVolumep, 200);
        return;
    }
    const ele = document.createElement("span");
    ele.classList.add("volume-percent");
    ele.setAttribute("style", "font-size: 14px; padding-left: 10px; min-width: 45px;");

    volumeBar.append(ele);
    volumeBar.style.flex = "0 1 180px";

    updatePercentage();
    function updatePercentage() {
        const currVolume = Math.round(Spicetify.Player?.getVolume() * 100);
        ele.innerText = currVolume == -100 ? `` : `${currVolume}%`;
    }
    Spicetify.Platform.PlaybackAPI._events.addListener("volume", updatePercentage);
})();
