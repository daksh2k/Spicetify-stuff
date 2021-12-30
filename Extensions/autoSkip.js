// @ts-check

// NAME: Auto Skip Songs
// AUTHOR: daksh2k
// DESCRIPTION: Auto Skip Certain Songs such as remixes, acoustics etc.., Toggle in Profile menu.

/// <reference path="../globals.d.ts" />

(function autoSkip() {
    const { Player, Menu} = Spicetify;
    if (!(Player && Menu)) {
        setTimeout(autoSkip, 1000);
        return;
    }

    // Define the skips in a object and their skip check logic
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
            check: ({ title } ) => ["- live", "live version", "(live)"].some(value => title.toLowerCase().includes(value))
        },
        skipExplicit: {
            menuTitle: "Explicit Songs",
            check: ({ is_explicit }) => is_explicit === 'true'
        },
        skipStripped: {
            menuTitle: "Stripped Songs",
            check: ({ title }) => checkByName("stripped", title)
        },
        skipChristmas: {
            menuTitle: "Christmas Songs",
            check: ({ title } ) => ["xmas", "christmas", "jingle","mistletoe","merry","santa","feliz","navidad"].some(value => title.toLowerCase().includes(value))
        }
    }

    // Load the basic config and define some utility functions for easy loading and saving
    const CONFIG = getConfig()
    function getConfig() {
        try {
            const parsed = JSON.parse(localStorage.getItem("auto-skip:skips"))
            if (parsed && typeof parsed === "object") {
                return parsed
            }
            throw ""
        } catch {
            localStorage.setItem("auto-skip:skips", "{}")
            return {}
        }
    }

    function saveConfig() {
        localStorage.setItem("auto-skip:skips", JSON.stringify(CONFIG))
    }

    // Store the stats in localstorage and load it on start
    if(localStorage.getItem("auto-skip:stats")===null){
        localStorage.setItem("auto-skip:stats","{}")
    }
    const STATS = JSON.parse(localStorage.getItem("auto-skip:stats"))
    Object.keys(SKIPS)
          .filter(key => STATS[key]===undefined)
          .forEach( key => STATS[key] = 0)
    localStorage.setItem("auto-skip:stats",JSON.stringify(STATS))

    // Create a menu item to enable/disable
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

    // Main function to check skip of current song
    let skippedSong = {}
    function checkSkip(){
        const meta = Player?.data?.track;
        if (!meta) return;

        const skipReasonsKeys = Object.entries(CONFIG)
                                      .filter(([key, shouldCheck]) => shouldCheck && SKIPS[key].check(meta.metadata))
                                      .map(reason => reason[0])
        if (skipReasonsKeys.length>0) {
            const skipReasons = skipReasonsKeys.map(key => SKIPS[key].menuTitle).join(", ")
            /* Check if the current song was skipped just before
               if it was then dont't skip it.*/
            if(meta?.uri === skippedSong?.uri && meta?.uid === skippedSong?.uid){
                Spicetify.showNotification(`${meta.metadata.title} was auto skipped due to ${skipReasons} filters.`)
                console.log(`${meta.metadata.title} was auto skipped due to ${skipReasons} filters.`)
                skippedSong = {}
            }
            else{
                skipReasonsKeys.forEach(key => STATS[key]++)
                localStorage.setItem("auto-skip:stats",JSON.stringify(STATS))
                const totalSkips = Object.values(STATS).reduce((a, b) => a + b, 0)
                Spicetify.showNotification(`${meta.metadata.title} skipped!Reasons: ${skipReasons}. Total skips = ${totalSkips}`)
                console.log(`${meta.metadata.title} skipped!Reasons: ${skipReasons}. Total skips = ${totalSkips}`)
                Player.next();
                skippedSong = meta
            }
        }
    }

    new Menu.SubMenu(
        "Auto Skip",
        Object.entries(SKIPS).map(([key, value]) => createMenu(value.menuTitle, key))
    ).register();

    Spicetify.Player.addEventListener("songchange", checkSkip);
})();