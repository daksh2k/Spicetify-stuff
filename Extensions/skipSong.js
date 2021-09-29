// @ts-check

// NAME: Auto Skip Songs
// AUTHOR: daksh2k
// DESCRIPTION: Auto Skip Certain Songs such as remixes, acoustics etc.., Toggle in Profile menu.

/// <reference path="../spicetify-cli/globals.d.ts" />

(function skipSong() {
    const { Player, Menu, LocalStorage} = Spicetify;
    if (!(Player && Menu && LocalStorage)) {
        setTimeout(skipSong, 1000);
        return;
    }

    const SKIPS = {
        skipAcoustic: {
            menuTitle: "Acoustic Songs",
            check: ({ title }) => checkByName("acoustic", title)
        },
        skipUnplugged: {
            menuTitle: "Unplugged Songs",
            check: ({ title }) => checkByName("unplugged", title)
        },
        skipRemix: {
            menuTitle: "Remix Songs",
            check: ({ title } ) => checkByName("remix", title)
        },
        skipLive: {
            menuTitle: "Live Songs",
            check: ({ title } ) => ['- live', 'live version', '(live)'].some(value => title.toLowerCase().includes(value))
        },
        skipExplicit: {
            menuTitle: "Explicit Songs",
            check: ({ is_explicit }) => is_explicit === 'true'
        }
    }

    const CONFIG = getConfig()

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
              checkSkip()
         }
     );
    }

    function checkByName(key,title){
        return title.toLowerCase().includes(key)
    }

    function checkSkip(){
        const meta = Player?.data?.track?.metadata;

        if (!meta) return;

        if (Object.entries(CONFIG).some(([key, shouldCheck]) => shouldCheck && SKIPS[key].check(meta))) {
            Player.next();
        }
    }

    new Menu.SubMenu(
        "Auto Skip",
        Object.entries(SKIPS).map(([key, value]) => createMenu(value.menuTitle, key))
    ).register();

    Spicetify.Player.addEventListener("songchange", checkSkip);
})();
