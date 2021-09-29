// @ts-check
// NAME: Add Volume Percentage
// AUTHOR: daksh2k
// VERSION: 1.0
// DESCRIPTION: Add the Volume Percentage to the Volume Bar

/// <reference path="../spicetify-cli/globals.d.ts" />
(function addVolumep(){
    const volumeBar = document.querySelector(".volume-bar")
    if (!(volumeBar && Spicetify.Player)){
        setTimeout(addVolumep, 200);
        return;
    }

    const ele = document.createElement("span")
    ele.classList.add("volume-percent")
    ele.setAttribute("style","font-size: 14px; padding-left: 10px")
    
    volumeBar.append(ele)
    volumeBar.style.flex = "0 1 160px"
    
    function updatePercentage(){
        const currVolume = Math.round(Spicetify.Player.getVolume()*100)
        ele.innerText = currVolume==-100 ? `` : `${currVolume}%`
    }
    const listenerEvent = {
          options: {},
          listener: updatePercentage
      }
    Spicetify.Player.origin._volume._events._emitter._listeners.volume.push(listenerEvent)
})();