// @ts-check

// NAME: Add Volume Percentage
// AUTHOR: daksh2k
// DESCRIPTION: Add the Volume Percentage to the Volume Bar

/// <reference path="../shared/types/spicetify.d.ts" />

(function addVolumep() {
    const volumeBar = document.querySelector(".main-nowPlayingBar-volumeBar");
    const volumeProgressBar = volumeBar?.querySelector(".progress-bar");

    if (!(volumeBar instanceof HTMLElement) || !(volumeProgressBar instanceof HTMLDivElement)) {
        setTimeout(addVolumep, 200);
        return;
    }

    const volumeProgressBarStyle = volumeProgressBar.style;

    const volumePercent = document.createElement("span");
    volumePercent.classList.add("volume-percent");
    volumePercent.setAttribute("style", "font-size: 14px; padding-left: 10px; min-width: 45px;");
    volumeBar.append(volumePercent);
    volumeBar.style.flex = "0 1 180px";

    function updatePercentage() {
        const currentVolume = Math.round(
            parseFloat(volumeProgressBarStyle.getPropertyValue("--progress-bar-transform")),
        );
        volumePercent.innerText = `${currentVolume}%`;
    }
    updatePercentage();

    const progressBarObserver = new MutationObserver(updatePercentage);
    const progressBarObserverConfig = {
        attributes: true,
        attributeFilter: ["style"],
    };
    progressBarObserver.observe(volumeProgressBar, progressBarObserverConfig);
})();
