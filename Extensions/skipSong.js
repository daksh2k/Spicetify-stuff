// @ts-check

// NAME: Auto Skip Songs
// AUTHOR: dax
// DESCRIPTION: Auto Skip Certain Songs such as remixes, accoustics etc.. Toggle in Profile menu.

/// <reference path="../spicetify-cli/globals.d.ts" />

(function skipSong() {
    const { Player, Menu, LocalStorage} = Spicetify;
    if (!(Player && Menu && LocalStorage)) {
        setTimeout(skipSong, 1000);
        return;
    }
    
    CONFIG = getConfig()

    function getConfig() {
        try {
            const parsed = JSON.parse(LocalStorage.get("skip-song-config"))
            if (parsed && typeof parsed === "object") {
                return parsed
            }
            throw ""
        } catch {
            LocalStorage.set("skip-song-config", "{}")
            return {}
        }
    }

    function saveConfig() {
        LocalStorage.set("skip-song-config", JSON.stringify(CONFIG))
    }

    function createMenu(title,key) {
       return new Menu.Item(
          title,
          CONFIG[key],
          (menuItem) => {
              CONFIG[key] = !CONFIG[key];
              menuItem.isEnabled = CONFIG[key];
              saveConfig()
         }
     );
    }

    function checkByName(key,title){
        return title.toLowerCase().includes(key)
    }

    new Menu.SubMenu("Auto Skip", [
            createMenu("Acoustic Songs","skipAcoustic"),
            createMenu("Remix Songs","skipRemix"),
            createMenu("Explicit Songs","skipExplicit")]).register();
    
    Spicetify.Player.addEventListener("songchange", () => {
        const data = Player.data;
        if (!data) return;
        const meta = data.track.metadata;
        const isAcoustic = CONFIG.skipAcoustic ? checkByName("acoustic",meta.title)   : false;
        const isRemix    = CONFIG.skipRemix    ? checkByName("remix",meta.title)      : false;
        const isExplicit = CONFIG.skipExplicit ? checkByName("true",meta.is_explicit) : false;
        if(isAcoustic || isRemix || isExplicit){
            Player.next()
        }
    });
})();

