// @ts-check
// NAME: Full Screen Mode
// AUTHOR: daksh2k
// VERSION: 1.0
// DESCRIPTION: Fancy artwork and track status display.

/// <reference path="../spicetify-cli/globals.d.ts" />

(function fullScreen() {
    const extraBar = document.querySelector(".ExtraControls");
    const topBar = document.querySelector(".main-topBar-historyButtons");
    const {
        CosmosAsync,
        LocalStorage,
        Keyboard,
        ContextMenu
    } = Spicetify;

    if (!topBar || !extraBar || !CosmosAsync || !LocalStorage || !ContextMenu || !Keyboard) {
        setTimeout(fullScreen, 300);
        return;
    }
    Spicetify.Keyboard.registerShortcut(
        {
            key: Spicetify.Keyboard.KEYS["T"], 
            ctrl: false, 
            shift: false, 
            alt: false,
        }, 
        openwithTV
     );
    Spicetify.Keyboard.registerShortcut(
        {
            key: Spicetify.Keyboard.KEYS["F"], 
            ctrl: false, 
            shift: false, 
            alt: false,
        }, 
        openwithDef
     );
    function openwithTV() {
        configContainer = ""
        ACTIVE = "tv"
        if (!document.body.classList.contains('fsd-activated') || !CONFIG.tvMode) {
            if(!CONFIG.tvMode){
                CONFIG["tvMode"]= true;
                saveConfig()
                render()
            }
            activate()
        }
        else
            deactivate();
    }
    function openwithDef() {
        configContainer = ""
        ACTIVE = "def"
        if (!document.body.classList.contains('fsd-activated') || CONFIG.tvMode) {
            if(CONFIG.tvMode){
                CONFIG["tvMode"]= false;
                saveConfig()
                render()
             }
             activate()
         }
         else
            deactivate();
    }

    const CONFIG = getConfig()
    let ACTIVE = CONFIG.tvMode ? "tv" : "def"

    const OFFLINESVG = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCI+CiAgPHJlY3Qgc3R5bGU9ImZpbGw6I2ZmZmZmZiIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiB4PSIwIiB5PSIwIiAvPgogIDxwYXRoIGZpbGw9IiNCM0IzQjMiIGQ9Ik0yNi4yNSAxNi4xNjJMMjEuMDA1IDEzLjEzNEwyMS4wMTIgMjIuNTA2QzIwLjU5NCAyMi4xOTIgMjAuMDgxIDIxLjk5OSAxOS41MTkgMjEuOTk5QzE4LjE0MSAyMS45OTkgMTcuMDE5IDIzLjEyMSAxNy4wMTkgMjQuNDk5QzE3LjAxOSAyNS44NzggMTguMTQxIDI2Ljk5OSAxOS41MTkgMjYuOTk5QzIwLjg5NyAyNi45OTkgMjIuMDE5IDI1Ljg3OCAyMi4wMTkgMjQuNDk5QzIyLjAxOSAyNC40MjIgMjIuMDA2IDE0Ljg2NyAyMi4wMDYgMTQuODY3TDI1Ljc1IDE3LjAyOUwyNi4yNSAxNi4xNjJaTTE5LjUxOSAyNS45OThDMTguNjkyIDI1Ljk5OCAxOC4wMTkgMjUuMzI1IDE4LjAxOSAyNC40OThDMTguMDE5IDIzLjY3MSAxOC42OTIgMjIuOTk4IDE5LjUxOSAyMi45OThDMjAuMzQ2IDIyLjk5OCAyMS4wMTkgMjMuNjcxIDIxLjAxOSAyNC40OThDMjEuMDE5IDI1LjMyNSAyMC4zNDYgMjUuOTk4IDE5LjUxOSAyNS45OThaIi8+Cjwvc3ZnPgo=`

    const style = document.createElement("style")
   

    const container = document.createElement("div")
    container.id = "full-screen-display"
    container.classList.add("Video", "VideoPlayer--fullscreen", "VideoPlayer--landscape")

    let cover, back, title, artist,album, prog, elaps, durr, play, ctx_container, ctx_icon, ctx_source, ctx_name, fsd_nextCover, fsd_up_next_text, fsd_next_tit_art, fsd_next_tit_art_inner, fsd_first_span, fsd_second_span;
    const nextTrackImg = new Image()
    function render() {

    const styleBase = `
#full-screen-display {
    display: none;
    z-index: 100;
    position: fixed;
    width: 100%;
    height: 100%;
    cursor: default;
    left: 0;
    top: 0;
}
#fsd-ctx-container {
    background-color: transparent;
    color: #CCC;
    position: fixed;
    float: left;
    top: 30px;
    left: 50px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    text-align: left;
    z-index: 50;
    transition: opacity .8s ease-in-out;
    opacity: 1;
    max-width: 40%;
}
#fsd-ctx-details{
    padding-left: 18px;
    line-height: initial;
    font-size: 18px;
    overflow: hidden;
}
#fsd-ctx-icon{
    width: 48px;
    height : 48px;
}
.ctx-no-icon{
    width: auto !important;
    height: auto !important;
}
#fsd-ctx-icon:before{
    font-size: 52px;
    height: auto;
}
#fsd-ctx-source{
    text-transform: uppercase;
}
#fsd-ctx-name{
    font-weight: 700;
    font-size: 20px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}
.ctx-no-name{
    padding-bottom: 2px;
    font-size: 24px;
    font-weight: 600;
}
#fsd-upnext-container{
    float: right;
    width: 472px;
    height: 102px;
    max-width: 45%;
    position: fixed;
    top: 45px;
    right: 60px;
    display: flex;
    border: 1px solid rgba(130, 130, 130,.7);
    border-radius: 10px;
    background-color: rgb(20, 20, 20);
    flex-direction: row;
    text-align: left;
    z-index: 50;
    transition: transform .8s ease-in-out;
    transform: translateX(600px);
}
#fsd_next_art_image{
    background-size: cover;
    background-position: center;
    width:  100px;
    height: 100px;
    border-radius: 9px 0 0 9px;
}
#fsd_next_details{
    padding-left: 18px;
    padding-top: 17px;
    line-height: initial;
    width: calc(100% - 115px);
    color: #FFFFFF;
    font-size: 19px;
    overflow: hidden;
}
#fsd_next_tit_art{
    padding-top: 9px;
    font-size: 22px;
    font-weight: 700;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}
@keyframes fsd_cssmarquee {
    0% {
        transform: translateX(0%);
    }
    18% {
        transform: translateX(0%);
    }
    100% {
         transform: translateX(var(--translate_width_fsd));
    }
}
@keyframes fsd_translate {
    0%,10% {
        transform: translateX(0%);
    }
    50%,55% {
        transform: translateX(var(--translate_width_fsd));
    }
    100% {
        transform: translateX(0%);
    }
}
#fad-lyrics-plus-container .lyrics-lyricsContainer-LyricsContainer{
   --lyrics-color-active: rgba(255,255,255,1) !important;
   --lyrics-color-inactive: rgba(220,220,220,.5) !important;
   --lyrics-align-text: ${CONFIG[ACTIVE].lyricsAlignment || "right"} !important;
   --animation-tempo: ${"animationTempo" in CONFIG[ACTIVE] ? CONFIG[ACTIVE].animationTempo : .4}s !important;
   height: 85vh !important;
}
.lyrics-unavailable #fad-lyrics-plus-container{
    display: none;
}
#fsd-foreground {
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: width 1s ease;
}
#fsd-art-image {
    position: relative;
    width: 100%;
    height: 100%;
    padding-bottom: 100%;
    border-radius: 8px;
    background-size: cover;
}
#fsd-art-inner {
    position: absolute;
    left: 3%;
    bottom: 0;
    width: 94%;
    height: 94%;
    z-index: -1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6) !important;
    transform: translateZ(0);
}
#fsd-title{
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
}
#fsd-album, #fsd-artist{
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
}
#fsd-progress {
    width: 100%;
    height: 6px;
    border-radius: 4px;
    background-color: #ffffff50;
    overflow: hidden;
}
#fsd-progress-inner {
    height: 100%;
    border-radius: 4px;
    background-color: #ffffff;
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.8);
}
#fsd-elapsed {
    margin-right: 10px;
}
#fsd-duration {
    margin-left: 10px;
}
#fsd-background {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: -2;
}
#full-screen-display button {
    background-color: transparent;
    border: 0;
    color: currentColor;
    padding: 0 5px;
}
body.fsd-activated #full-screen-display {
    display: block
}`


    const styleChoices = [`
#fsd-art {
    width: calc(100vh - 300px);
    max-width: 600px;
}
#fsd-foreground {
    flex-direction: column;
    text-align: center;
}
#fsd-progress-container {
    width: 28vw;
    max-width: 550px;
    display: flex;
    align-items: center;
}
#fsd-details {
    padding-top: 30px;
    line-height: initial;
    max-width: 500px;
    color: #FFFFFF;
}
#fad-lyrics-plus-container{
    right: -50px;
    position: absolute;
    max-width: 50%;
    top: 7.5vh;
}
#fad-lyrics-plus-container + #fsd-foreground{
    width: 50%;
}
.lyrics-unavailable #fsd-foreground{
    width: 100% !important;
}
#fsd-title {
    font-size: 48px;
    font-weight: var(--glue-font-weight-black);
}
@media (max-width: 900px), (max-height: 900px){
    #fsd-title{
        font-size: 35px;
        font-weight: 500;
    }
}
#fsd-artist, #fsd-album {
    font-size: 30px;
    font-weight: var(--glue-font-weight-medium);
    color: #C3C7D1;
}
#fsd-artist svg, #fsd-album svg {
    width: 25px;
    height: 25px;
    margin-right: 5px;
}
#fsd-status {
    display: flex;
    min-width: 100px;
    max-width: 600px;
    align-items: center;
    flex-direction: column;
}
#fsd-status.active {
    margin: 20px auto 0;
}
#fsd-controls {
    margin-top: 20px;
    order: 2
}
.fsd-background-fade {
    transition: background-image var(--fs-transition) linear;
}`,
`#fsd-background-image {
    height: 100%;
    background-size: cover;
    filter: brightness(${"brightness" in CONFIG[ACTIVE] ? CONFIG[ACTIVE].brightness : .4}) blur(${"blurSize" in CONFIG[ACTIVE] ? CONFIG[ACTIVE].blurSize : 5}px);
    background-position: center;
    transform: translateZ(0);
}
#fad-lyrics-plus-container{
    position: absolute;
    right: -50px;
    max-width: 50%;
    top: 7.5vh;
}
#fad-lyrics-plus-container + #fsd-foreground{
    width: max-content;
    max-width: 70%;
}
#fsd-foreground {
    flex-direction: row;
    text-align: left;
    justify-content: left;
    align-items: flex-end;
    position: absolute;
    top: auto;
    bottom: 100px;
}
#fsd-progress-container {
    width: 100%;
    display: flex;
    align-items: center;
}
#fsd-art {
    width: calc(100vw - 840px);
    min-width: 200px;
    max-width: 250px;
    margin-left: 50px;
}
#fsd-details {
    padding-left: 45px;
    line-height: initial;
    max-width: 80%;
    color: #FFFFFF;
}
#fsd-title {
    font-size: 60px;
    font-weight: var(--glue-font-weight-black);
}
@media (max-width: 900px), (max-height: 800px){
    #fsd-title{
        font-size: 45px;
        font-weight: 600;
    }
}
#fsd-artist, #fsd-album {
    font-size: 34px;
    font-weight: var(--glue-font-weight-medium);
    color: #C3C7D1;
}
#fsd-artist svg, #fsd-album svg {
    margin-right: 5px;
    width: 25px;
    height: 25px;
}
#fsd-status {
    display: flex;
    min-width: 400px;
    max-width: 400px;
    align-items: center;
}
#fsd-status.active {
    margin-top: 20px;
}
#fsd-controls {
    display: flex;
    margin-right: 10px;
}
.fsd-background-fade {
    transition: background-image var(--fs-transition) linear;
}
`]
    const iconStyleChoices = [`
#fsd-artist svg, #fsd-album svg {
    display: none;
}`,
`
#fsd-artist svg, #fsd-album svg {
    display: inline-block;
}`
    ]
        Spicetify.Player.removeEventListener("songchange", updateInfo)
        Spicetify.Player.removeEventListener("onprogress", updateProgress)
        Spicetify.Player.removeEventListener("onplaypause", updateControl)

        Spicetify.Player.removeEventListener("songchange", updateUpNextShow)
        Spicetify.Player.origin._events.removeListener("queue_update", updateUpNext)
        Spicetify.Player.origin._events.removeListener("update", updateUpNextShow)
        window.removeEventListener("resize",updateUpNext)
        if(origLoc)
           Spicetify.Platform.History.push(origLoc)
        window.dispatchEvent(new Event("fad-request"));
        window.removeEventListener("lyrics-plus-update",handleLyricsUpdate)
        container.removeEventListener("mousemove", hideCursor)
        container.removeEventListener("mousemove", hideContext)

        upNextShown = false;
        if(timetoshow2){
          clearTimeout(timetoshow2)
                timetoshow2 = 0
            }
        if(timetoshow){
                clearTimeout(timetoshow)
                timetoshow = 0 
            }
        style.innerHTML = styleBase + styleChoices[CONFIG.tvMode ? 1 : 0] + iconStyleChoices[CONFIG[ACTIVE].icons ? 1 : 0];

        container.innerHTML = `
${CONFIG.tvMode?`<div id="fsd-background">
  <div id="fsd-background-image"></div>
</div>`:
`<canvas id="fsd-background"></canvas>`}
  ${CONFIG[ACTIVE].contextDisplay!=="never"?`
   <div id="fsd-ctx-container">
      <div id="fsd-ctx-icon" class="spoticon-spotifylogo-32"></div>
      <div id="fsd-ctx-details">
        <div id="fsd-ctx-source"></div>
        <div id="fsd-ctx-name"></div>
      </div>
    </div>`:""}
 ${CONFIG[ACTIVE].enableUpnext?`
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
    </div>`:""}
${CONFIG[ACTIVE].enableLyrics ? `<div id="fad-lyrics-plus-container"></div>` : ""}
<div id="fsd-foreground">
    <div id="fsd-art">
        <div id="fsd-art-image">
            <div id="fsd-art-inner"></div>
        </div>
    </div>
    <div id="fsd-details">
            <div id="fsd-title"></div>
            <div id="fsd-artist">
                <svg height="30" width="30" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.artist}</svg>
                <span></span>
            </div>
            ${CONFIG[ACTIVE].showAlbum!=="n" ? 
            `<div id="fsd-album">
                 <svg height="30" width="30" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.album}</svg>
                 <span></span>
            </div>` : ""} 
            <div id="fsd-status" class="${CONFIG[ACTIVE].enableControl || CONFIG[ACTIVE].enableProgress ? "active" : ""}">
                ${CONFIG[ACTIVE].enableControl ? 
                    `<div id="fsd-controls">
                        <button id="fsd-back">
                            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["skip-back"]}</svg>
                        </button>
                        <button id="fsd-play">
                            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.play}</svg>
                        </button>
                        <button id="fsd-next">
                            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["skip-forward"]}</svg>
                        </button>
                    </div>` : ""}
                ${ CONFIG.tvMode ? `${CONFIG[ACTIVE].enableProgress ? 
                    `<div id="fsd-progress-container">
                        <span id="fsd-elapsed"></span>
                        <div id="fsd-progress"><div id="fsd-progress-inner"></div></div>
                        <span id="fsd-duration"></span>
                    </div>` : ""}`:""}
            </div>
    </div>
    ${ CONFIG.tvMode ? "":`${CONFIG[ACTIVE].enableProgress ?
        `<div id="fsd-progress-container">
            <span id="fsd-elapsed"></span>
            <div id="fsd-progress"><div id="fsd-progress-inner"></div></div>
            <span id="fsd-duration"></span>
        </div>` : ""}`}
</div>`
       if(CONFIG.tvMode)
           back = container.querySelector("#fsd-background-image")
        else{
           back = container.querySelector('canvas')
           back.width = window.innerWidth
           back.height = window.innerHeight
        }
        cover = container.querySelector("#fsd-art-image")
        title = container.querySelector("#fsd-title")
        artist = container.querySelector("#fsd-artist span")
        album = container.querySelector("#fsd-album span")

      if(CONFIG[ACTIVE].contextDisplay!=="never"){
        ctx_container = container.querySelector("#fsd-ctx-container")
        ctx_icon = container.querySelector("#fsd-ctx-icon")
        ctx_source = container.querySelector("#fsd-ctx-source")
        ctx_name = container.querySelector("#fsd-ctx-name")
      }  
      if (CONFIG[ACTIVE].enableUpnext) {
            fsd_myUp = container.querySelector("#fsd-upnext-container")
            fsd_myUp.onclick = Spicetify.Player.next
            fsd_nextCover = container.querySelector("#fsd_next_art_image")
            fsd_up_next_text = container.querySelector("#fsd_up_next_text")
            fsd_next_tit_art = container.querySelector("#fsd_next_tit_art")
            fsd_next_tit_art_inner = container.querySelector("#fsd_next_tit_art_inner")
            fsd_first_span= container.querySelector("#fsd_first_span")
            fsd_second_span= container.querySelector("#fsd_second_span")
        }

        if (CONFIG[ACTIVE].enableProgress) {
            prog = container.querySelector("#fsd-progress-inner")
            durr = container.querySelector("#fsd-duration")
            elaps = container.querySelector("#fsd-elapsed")
        }

        if (CONFIG[ACTIVE].enableControl) {
            play = container.querySelector("#fsd-play")
            play.onclick = Spicetify.Player.togglePlay
            container.querySelector("#fsd-next").onclick = Spicetify.Player.next
            container.querySelector("#fsd-back").onclick = Spicetify.Player.back
        }
    }

    const classes = [
        "video",
        "video-full-screen",
        "video-full-window",
        "video-full-screen--hide-ui",
        "fsd-activated"
    ]
    
    function FullScreenOn() {
        document.documentElement.requestFullscreen()
    }
    function FullScreenOff() {
        document.exitFullscreen()
    }

    function getTrackInfo(id){
        return Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${id}`)
    }
    function getAlbumInfo(id) {
        return Spicetify.CosmosAsync.get(`hm://album/v1/album-app/album/${id}/desktop`)
    }
    function getPlaylistInfo(uri) {
        return Spicetify.CosmosAsync.get(`sp://core-playlist/v1/playlist/${uri}`)
    }
    function getArtistInfo(id) {
        return Spicetify.CosmosAsync.get(`hm://artist/v1/${id}/desktop?format=json`)
    }
    function searchArt(name){
        return Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/search?q="${name}"&type=artist&limit=2`)
    }

    document.addEventListener('visibilitychange', () => {
        if(document.hidden) {
            upNextShown = false;
            if(timetoshow2){
                clearTimeout(timetoshow2)
                timetoshow2 = 0
            }
            if(timetoshow){
                clearTimeout(timetoshow)
                timetoshow = 0 
            }
        }
        else 
            updateUpNextShow()
    });

    let timetoshow,timetoshow2
    let upNextShown = false;
    function updateUpNextShow() {
        setTimeout( () => {
            let timetogo = getShowTime()
            if (timetogo<15) {
               if(!upNextShown || fsd_myUp.style.transform!="translateX(0px)"){
                  updateUpNext()
               }
               if(timetoshow2){
                   clearTimeout(timetoshow2)
                   timetoshow2 = 0
                }
               if(timetoshow){
                   clearTimeout(timetoshow)
                   timetoshow = 0 
                }
               upNextShown = true
           }
           else {
               if (timetoshow2){ 
                   clearTimeout(timetoshow2);
                   timetoshow2 = 0;
               }
               timetoshow2 = setTimeout( () => {
                   if (timetoshow) {
                       clearTimeout(timetoshow);
                       timetoshow = 0;
                   }
                   fsd_myUp.style.transform = "translateX(600px)";
                   upNextShown = false;
                   if(!Spicetify.Player.origin._state.isPaused){
                       timetoshow = setTimeout( () => {
                           updateUpNext()
                           upNextShown = true;
                       }, timetogo)
                    }
               },3)
           }
       },100)
    }
    function getShowTime(){
        let showBefore = CONFIG.tvMode ? 45000:30000
        let dur        = Spicetify.Player.data.duration
        let curProg    = Spicetify.Player.getProgress() 

        if(dur-curProg<=showBefore)
            return 10;
        else
            return(dur-showBefore-curProg)
    }
    
    async function updateInfo() {
       const meta = Spicetify.Player.data.track.metadata
       
       if (CONFIG[ACTIVE].contextDisplay!=="never")
            await updateContext().catch(err => console.error("Error getting context: ",err))
        
        // prepare title
        let rawTitle = meta.title
        if (CONFIG[ACTIVE].trimTitle) {
            rawTitle = rawTitle
                .replace(/\(.+?\)/g, "")
                .replace(/\[.+?\]/g, "")
                .replace(/\s\-\s.+?$/, "")
                .trim()
        }

        // prepare artist
        let artistName
        if (CONFIG[ACTIVE].showAllArtists) {
            artistName = Object.keys(meta)
                .filter(key => key.startsWith('artist_name'))
                .sort()
                .map(key => meta[key])
                .join(', ')
        } else {
            artistName = meta.artist_name
        }

        // prepare album
        let albumText
        if (CONFIG[ACTIVE].showAlbum!=="n") {
            albumText = meta.album_title || ""
            const albumURI = meta.album_uri
            if (albumURI?.startsWith("spotify:album:")) {
                const albumInfo = await getAlbumInfo(albumURI.replace("spotify:album:", "")).catch(err => console.error(err))

                const albumDate = new Date(albumInfo.year, (albumInfo.month || 1) - 1, albumInfo.day || 0)
                const dateStr = albumDate.toLocaleString('default',{year: 'numeric',month: 'short'})
                
                albumText += CONFIG[ACTIVE].showAlbum==="d" ? (" • " + dateStr) : ""
            }
        }

        // prepare duration
        let durationText
        if (CONFIG[ACTIVE].enableProgress) {
            durationText = Spicetify.Player.formatTime(meta.duration)
        }
        
        const previouseImg = nextTrackImg.cloneNode()  
        if(CONFIG.tvMode){
           //Prepare Artist Image
            if(meta.artist_uri != null){
                 let arUri =  meta.artist_uri.split(":")[2]
                 if(meta.artist_uri.split(":")[1] === "local"){
                      let res = await searchArt(meta.artist_name).catch(err => console.error(err))
                      arUri = res ? res.artists.items[0].id : ""
                }
                let artistInfo = await getArtistInfo(arUri).catch(err => console.error(err))
                if (!artistInfo) nextTrackImg.src = meta.image_xlarge_url
                else  nextTrackImg.src = artistInfo.header_image ? artistInfo.header_image.image : meta.image_xlarge_url
          } else nextTrackImg.src = meta.image_xlarge_url  
         } else nextTrackImg.src = meta.image_xlarge_url
        
        // Wait until next track image is downloaded then update UI text and images
        nextTrackImg.onload = () => {
            if(CONFIG.tvMode){
                 back.style.backgroundImage = `url("${nextTrackImg.src}")`
                 cover.style.backgroundImage = `url("${meta.image_xlarge_url}")`
            }
            else{
                const bgImage = `url("${nextTrackImg.src}")`
                animateCanvas(previouseImg, nextTrackImg)
                cover.style.backgroundImage = bgImage
            }
            title.innerText = rawTitle || ""
            artist.innerText = artistName || ""
            if (album) {
                album.innerText = albumText || ""
            }
            if (durr) {
                durr.innerText = durationText || ""
            }
        }

        nextTrackImg.onerror = () => {
            // Placeholder
            console.error("Check your Internet!Unable to load Image")
            nextTrackImg.src = OFFLINESVG
        }
    }
    function handleLyricsUpdate(evt){
        if(evt.detail.isLoading)
            return
        container.classList.toggle("lyrics-unavailable",!(evt.detail.available && evt.detail?.synced?.length>1))
    }
    function animateCanvas(prevImg, nextImg) {
        const { innerWidth: width, innerHeight: height } = window
        back.width = width
        back.height = height
        const dim = width > height ? width : height

        const ctx = back.getContext('2d')
        ctx.imageSmoothingEnabled = false
        ctx.filter = `brightness(${"brightness" in CONFIG[ACTIVE] ? CONFIG[ACTIVE].brightness : .6}) blur(${"blurSize" in CONFIG[ACTIVE] ? CONFIG[ACTIVE].blurSize : 20}px)`
        const blur = "blurSize" in CONFIG[ACTIVE] ? Number(CONFIG[ACTIVE].blurSize) : 20
        
        if (!CONFIG[ACTIVE].enableFade) {
            ctx.globalAlpha = 1
            ctx.drawImage(
                nextImg, 
                -blur * 2,
                -blur * 2 - (width - height) / 2,
                dim + 4 * blur,
                dim + 4 * blur
            );
            return;
        }

        let factor = 0.0
        const animate = () => {
            ctx.globalAlpha = 1
            ctx.drawImage(
                prevImg, 
                -blur * 2,
                -blur * 2 - (width - height) / 2,
                dim + 4 * blur,
                dim + 4 * blur
            );
            ctx.globalAlpha = Math.sin(Math.PI/2*factor)
            ctx.drawImage(
                nextImg, 
                -blur * 2,
                -blur * 2 - (width - height) / 2,
                dim + 4 * blur,
                dim + 4 * blur
            );

            if (factor < 1.0) {
                factor += 0.03/Math.pow(FSTRANSITION,4);
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    let prevUriObj;
    async function getContext(){
        let ctxIcon = "", ctxSource,ctxName
        if(Spicetify.Player.data.track.provider==="queue"){
            ctxIcon = `<svg width="48" height="48" viewBox="1 1.2 16 16" fill="currentColor"><path d="M2 2v5l4.33-2.5L2 2zm0 12h14v-1H2v1zm0-4h14V9H2v1zm7-5v1h7V5H9z"></path></svg>`
            ctxSource = "queue"
            ctxName =  ""
        }
        else{
            const uriObj = Spicetify.URI.fromString(Spicetify.Player.data.context_uri)
            if(JSON.stringify(uriObj)===JSON.stringify(prevUriObj) && ctxSource!=undefined && ctxName!=undefined)
                return [ctxIcon,ctxSource,ctxName];
            prevUriObj = uriObj;
            switch (uriObj.type){
                case Spicetify.URI.Type.TRACK:
                    ctxIcon = `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M9.732 19.241c1.077 0 2.688-.79 2.688-2.922V9.617c0-.388.074-.469.418-.542l3.347-.732a.48.48 0 00.403-.484V5.105c0-.388-.315-.637-.689-.563l-3.764.82c-.47.102-.725.359-.725.769l.014 8.144c.037.36-.132.594-.454.66l-1.164.241c-1.465.308-2.154 1.055-2.154 2.16 0 1.122.864 1.905 2.08 1.905z" fill-rule="nonzero"></path></svg>`
                    ctxSource = uriObj.type;
                    await getTrackInfo(uriObj._base62Id).then(meta => ctxName=`${meta.name}  •  ${meta.artists[0].name}`);
                    break;
                case Spicetify.URI.Type.SEARCH:
                    ctxIcon = Spicetify.SVGIcons["search-active"]
                    ctxSource =  uriObj.type;
                    ctxName = `"${uriObj.query}" in Songs`;
                    break;   
                case Spicetify.URI.Type.COLLECTION:
                    ctxIcon = Spicetify.SVGIcons["heart-active"]
                    ctxSource = uriObj.type;
                    ctxName = "Liked Songs";
                    break;
                case Spicetify.URI.Type.PLAYLIST_V2:
                    ctxIcon = Spicetify.SVGIcons["playlist"]
                    ctxSource = "playlist"
                    ctxName = Spicetify.Player.data.context_metadata?.context_description || "";
                    break;
                
                case Spicetify.URI.Type.STATION:
                case Spicetify.URI.Type.RADIO:
                    ctxIcon = `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M19.359 18.57C21.033 16.818 22 14.461 22 11.89s-.967-4.93-2.641-6.68c-.276-.292-.653-.26-.868-.023-.222.246-.176.591.085.868 1.466 1.535 2.272 3.593 2.272 5.835 0 2.241-.806 4.3-2.272 5.835-.261.268-.307.621-.085.86.215.245.592.276.868-.016zm-13.85.014c.222-.238.176-.59-.085-.86-1.474-1.535-2.272-3.593-2.272-5.834 0-2.242.798-4.3 2.272-5.835.261-.277.307-.622.085-.868-.215-.238-.592-.269-.868.023C2.967 6.96 2 9.318 2 11.89s.967 4.929 2.641 6.68c.276.29.653.26.868.014zm1.957-1.873c.223-.253.162-.583-.1-.867-.951-1.068-1.473-2.45-1.473-3.954 0-1.505.522-2.887 1.474-3.954.26-.284.322-.614.1-.876-.23-.26-.622-.26-.891.039-1.175 1.274-1.827 2.963-1.827 4.79 0 1.82.652 3.517 1.827 4.784.269.3.66.307.89.038zm9.958-.038c1.175-1.267 1.827-2.964 1.827-4.783 0-1.828-.652-3.517-1.827-4.791-.269-.3-.66-.3-.89-.039-.23.262-.162.592.092.876.96 1.067 1.481 2.449 1.481 3.954 0 1.504-.522 2.886-1.481 3.954-.254.284-.323.614-.092.867.23.269.621.261.89-.038zm-8.061-1.966c.23-.26.13-.568-.092-.883-.415-.522-.63-1.197-.63-1.934 0-.737.215-1.413.63-1.943.222-.307.322-.614.092-.875s-.653-.261-.906.054a4.385 4.385 0 00-.968 2.764 4.38 4.38 0 00.968 2.756c.253.322.675.322.906.061zm6.18-.061a4.38 4.38 0 00.968-2.756 4.385 4.385 0 00-.968-2.764c-.253-.315-.675-.315-.906-.054-.23.261-.138.568.092.875.415.53.63 1.206.63 1.943 0 .737-.215 1.412-.63 1.934-.23.315-.322.622-.092.883s.653.261.906-.061zm-3.547-.967c.96 0 1.789-.814 1.789-1.797s-.83-1.789-1.789-1.789c-.96 0-1.781.806-1.781 1.789 0 .983.821 1.797 1.781 1.797z" fill-rule="nonzero"></path></svg>`
                    const rType = uriObj.args[0]
                    ctxSource = `${rType} radio`;
                    if(rType==="album")
                        await getAlbumInfo(uriObj.args[1]).then(meta => ctxName=meta.name)
                    else if(rType==="track")
                        await getTrackInfo(uriObj.args[1]).then(meta => ctxName=`${meta.name}  •  ${meta.artists[0].name}`)
                    else if(rType==="artist")
                        await getArtistInfo(uriObj.args[1]).then(meta => ctxName=meta.info.name)
                    else if(rType==="playlist" || rType==="playlist-v2"){
                        ctxIcon = `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M16.94 6.9l-1.4 1.46C16.44 9.3 17 10.58 17 12s-.58 2.7-1.48 3.64l1.4 1.45C18.22 15.74 19 13.94 19 12s-.8-3.8-2.06-5.1zM23 12c0-3.12-1.23-5.95-3.23-8l-1.4 1.45C19.97 7.13 21 9.45 21 12s-1 4.9-2.64 6.55l1.4 1.45c2-2.04 3.24-4.87 3.24-8zM7.06 17.1l1.4-1.46C7.56 14.7 7 13.42 7 12s.6-2.7 1.5-3.64L7.08 6.9C5.78 8.2 5 10 5 12s.8 3.8 2.06 5.1zM1 12c0 3.12 1.23 5.95 3.23 8l1.4-1.45C4.03 16.87 3 14.55 3 12s1-4.9 2.64-6.55L4.24 4C2.24 6.04 1 8.87 1 12zm9-3.32v6.63l5-3.3-5-3.3z"></path></svg>`
                        await getPlaylistInfo("spotify:playlist:"+uriObj.args[1]).then(meta => ctxName=meta.playlist.name)
                    }
                    else
                        ctxName = "";
                    break;
                
                case Spicetify.URI.Type.PLAYLIST:
                case Spicetify.URI.Type.ALBUM:
                case Spicetify.URI.Type.ARTIST:
                    ctxIcon = Spicetify.SVGIcons[uriObj.type]
                    ctxSource = uriObj.type;
                    ctxName = Spicetify.Player.data.context_metadata.context_description || "";
                    break;
                
                case Spicetify.URI.Type.FOLDER:
                    ctxIcon = Spicetify.SVGIcons["playlist-folder"]
                    ctxSource = "playlist folder"
                    const res = await Spicetify.CosmosAsync.get(
                        `sp://core-playlist/v1/rootlist`,
                        { policy: { folder: { rows: true, link: true , name: true} } }
                        );
                    for(const item of res.rows){
                        if(item.type==="folder" && item.link === Spicetify.Player.data.context_uri){
                            ctxName = item.name
                            break;
                        }
                    }
                    break;
                default:
                    ctxSource = "unknown"
                    ctxName = ""
            }

        }
        return [ctxIcon,ctxSource,ctxName]
    }

    async function updateContext(){
        [ctxIcon, ctxSource,ctxName] = await getContext().catch(err => console.error(err));
        if(ctxName=="")
            ctx_source.classList.add("ctx-no-name")
        else
            ctx_source.classList.remove("ctx-no-name")
        if (ctxIcon!=""){
            ctx_icon.classList.remove("spoticon-spotifylogo-32","ctx-no-icon")
            ctx_icon.innerHTML = /^<path/.test(ctxIcon) ? `<svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">${ctxIcon}</svg>` : ctxIcon
        }
        else{
            ctx_icon.classList.add("spoticon-spotifylogo-32","ctx-no-icon")
            ctx_icon.innerHTML = ""
        }
        ctx_source.innerText = `playing from ${ctxSource}`
        ctx_name.innerText = ctxName
    }

    function updateUpNextInfo(){
            fsd_up_next_text.innerText = "UP NEXT"
            let metadata = {}
            const queue_metadata = Spicetify.Queue.nextTracks[0]
            if(queue_metadata){
                metadata = queue_metadata?.contextTrack?.metadata
            } else{
                metadata["artist_name"] = ""
                metadata["title"] = ""
            }
            const artistNameNext = Object.keys(metadata).filter(key => key.startsWith('artist_name')).sort().map(key => metadata[key]).join(', ')
            let next_artist
            if (artistNameNext) {
                next_artist = artistNameNext
            } else {
                next_artist = "Artist (Unavailable)"
            }
            const next_image =  metadata.image_xlarge_url
            if(next_image){
               fsd_nextCover.style.backgroundImage = `url("${next_image}")`
            } else{
                 if(metadata.image_url)
                    fsd_nextCover.style.backgroundImage = `url("${metadata.image_url}")`
                 else{
                    fsd_nextCover.style.backgroundImage = `url("${OFFLINESVG}")`
                }
            }
            fsd_first_span.innerText = metadata.title + "  •  " + next_artist
            fsd_second_span.innerText= metadata.title + "  •  " + next_artist
    }

    async function updateUpNext(){            
            if((Spicetify.Player.data.duration-Spicetify.Player.getProgress()<=(CONFIG.tvMode ? 45050:30050)) && Spicetify.Queue?.nextTracks[0]?.contextTrack?.metadata?.title){
                 await updateUpNextInfo()
                 fsd_myUp.style.transform = "translateX(0px)";
                 upNextShown = true;
                 if(fsd_second_span.offsetWidth>(fsd_next_tit_art.offsetWidth-2)){
                    switch(CONFIG[ACTIVE].upNextAnim){
                        case "mq":
                            fsd_first_span.style.paddingRight = "80px"
                            anim_time= 5000*(fsd_first_span.offsetWidth/400)
                            fsd_myUp.style.setProperty('--translate_width_fsd', `-${fsd_first_span.offsetWidth+3.5}px`);
                            fsd_next_tit_art_inner.style.animation = "fsd_cssmarquee "+ anim_time +"ms linear 800ms infinite"
                            break;
                        case "sp":
                        default:
                            fsd_first_span.style.paddingRight = "0px"
                            fsd_second_span.innerText=""
                            anim_time = (fsd_first_span.offsetWidth-fsd_next_tit_art.offsetWidth-2)/0.05
                            // anim_time= 3000*(fsd_first_span.offsetWidth/fsd_next_tit_art.offsetWidth)
                            fsd_myUp.style.setProperty('--translate_width_fsd', `-${fsd_first_span.offsetWidth-fsd_next_tit_art.offsetWidth+5}px`);
                            fsd_next_tit_art_inner.style.animation = `fsd_translate ${anim_time>1500 ? anim_time : 1500}ms linear 800ms infinite`
                            break;
                    }
                  } 
                  else{
                     fsd_first_span.style.paddingRight = "0px"
                     fsd_next_tit_art_inner.style.animation = "none"
                     fsd_second_span.innerText=""
                }
             }
            else{
                 upNextShown = false
                 fsd_myUp.style.transform = "translateX(600px)";
                 fsd_first_span.style.paddingRight = "0px"
                 fsd_next_tit_art_inner.style.animation = "none"
                 fsd_second_span.innerText=""
             }
    }

    function updateProgress() {
        prog.style.width = Spicetify.Player.getProgressPercent() * 100 + "%"
        elaps.innerText = Spicetify.Player.formatTime(Spicetify.Player.getProgress())
    }
    function updateControl({ data }) {
        if (data.is_paused) {
            play.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.play}</svg>`
        } else {
            play.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.pause}</svg>`
        }
    }

    let full_screen_status=false;

    let curTimer, ctxTimer;
    function hideCursor(){
        if (curTimer) {
            clearTimeout(curTimer);
            curTimer = 0;
        }
        container.style.cursor = 'default'
        curTimer = setTimeout( () => container.style.cursor = 'none', 2000)
    }
      
    function hideContext(){
        if (ctxTimer) {
            clearTimeout(ctxTimer);
            ctxTimer = 0;
        }
        ctx_container.style.opacity = 1
        ctxTimer = setTimeout( () => ctx_container.style.opacity = 0, 4000)
    }

    FSTRANSITION = "backAnimationTime" in CONFIG[ACTIVE] ? Number(CONFIG[ACTIVE].backAnimationTime) : 0.8
    let origLoc
    function activate() {
        button.classList.add("control-button--active","control-button--active-dot")
        container.style.setProperty('--fs-transition',`${FSTRANSITION-0.05}s`);
        updateInfo()
        Spicetify.Player.addEventListener("songchange", updateInfo)
        container.addEventListener("mousemove", hideCursor)
        hideCursor()
        container.querySelector("#fsd-foreground").oncontextmenu = openConfig
        back.oncontextmenu = openConfig
        if(CONFIG[ACTIVE].contextDisplay==="hover"){
            container.addEventListener("mousemove", hideContext)
            hideContext()
        }
        if(CONFIG[ACTIVE].enableUpnext){
            updateUpNextShow()
            Spicetify.Player.addEventListener("songchange",updateUpNextShow)
            Spicetify.Player.origin._events.addListener("queue_update", updateUpNext)
            Spicetify.Player.origin._events.addListener("update", updateUpNextShow)
            window.addEventListener("resize",updateUpNext)
        }
        if(CONFIG[ACTIVE].enableFade){
            cover.classList.add("fsd-background-fade")
            if(CONFIG.tvMode)
                back.classList.add("fsd-background-fade")
        } else{
            cover.classList.remove("fsd-background-fade")
            if(CONFIG.tvMode)
                back.classList.remove("fsd-background-fade")
        }
        if (CONFIG[ACTIVE].enableProgress) {
            updateProgress()
            Spicetify.Player.addEventListener("onprogress", updateProgress)
        }
        if (CONFIG[ACTIVE].enableControl) {
            updateControl({ data: { is_paused: !Spicetify.Player.isPlaying() }})
            Spicetify.Player.addEventListener("onplaypause", updateControl)
        }
        document.body.classList.add(...classes)
        if (CONFIG[ACTIVE].enableFullscreen) {
            FullScreenOn()
            full_screen_status=true;
        } else {
            if(full_screen_status) {
               FullScreenOff()
               full_screen_status=false;
            }
            full_screen_status=false
        }
        document.querySelector(".Root__top-container").append(style, container)
        if(CONFIG[ACTIVE].enableLyrics){
            window.addEventListener("lyrics-plus-update",handleLyricsUpdate)
            origLoc = Spicetify.Platform.History.location.pathname
            if(!Spicetify.Platform.History.location.pathname!=="/lyrics-plus"){
                Spicetify.Platform.History.push("/lyrics-plus")
            }
            window.dispatchEvent(new Event("fad-request"));
        }
        Spicetify.Keyboard.registerShortcut(
        {
            key: Spicetify.Keyboard.KEYS["F11"], 
            ctrl: false, 
            shift: false, 
            alt: false,
        }, 
        fsToggle
       );
       Spicetify.Keyboard.registerShortcut(
        {
            key: Spicetify.Keyboard.KEYS["ESCAPE"], 
            ctrl: false, 
            shift: false, 
            alt: false,
        }, 
        deactivate
      );
    }
    function deactivate() { 
        button.classList.remove("control-button--active","control-button--active-dot")
        Spicetify.Player.removeEventListener("songchange", updateInfo)
        container.removeEventListener("mousemove", hideCursor)
        if(CONFIG[ACTIVE].contextDisplay==="hover"){
            container.removeEventListener("mousemove", hideContext)
        }
        if(CONFIG[ACTIVE].enableUpnext){
            upNextShown = false;
            if(timetoshow2){
                clearTimeout(timetoshow2)
                timetoshow2 = 0
            }
            if(timetoshow){
                clearTimeout(timetoshow)
                timetoshow = 0 
            }
            Spicetify.Player.removeEventListener("songchange", updateUpNextShow)
            Spicetify.Player.origin._events.removeListener("queue_update", updateUpNext)
            Spicetify.Player.origin._events.removeListener("update", updateUpNextShow)
            window.removeEventListener("resize",updateUpNext)
        }
        if (CONFIG[ACTIVE].enableProgress) {
            Spicetify.Player.removeEventListener("onprogress", updateProgress)
        }
        if (CONFIG[ACTIVE].enableControl) {
            Spicetify.Player.removeEventListener("onplaypause", updateControl)
        }
        document.body.classList.remove(...classes)
        full_screen_status=false;
        upNextShown = false;
        if (CONFIG[ACTIVE].enableFullscreen) {
            FullScreenOff()
        }
        let popup = document.querySelector("body > generic-modal")
        if(popup)
            popup.remove()
        style.remove()
        container.remove()
        if(CONFIG[ACTIVE].enableLyrics){
            window.removeEventListener("lyrics-plus-update",handleLyricsUpdate)
            if(origLoc)
                Spicetify.Platform.History.push(origLoc)
            window.dispatchEvent(new Event("fad-request"));
        }
        Spicetify.Keyboard._deregisterShortcut(
            {
                key: Spicetify.Keyboard.KEYS["F11"], 
                ctrl: false, 
                shift: false, 
                alt: false,
            }
        );
        Spicetify.Keyboard._deregisterShortcut(
            {
                key: Spicetify.Keyboard.KEYS["ESCAPE"], 
                ctrl: false, 
                shift: false, 
                alt: false,
            }
        );
    }
    function fsToggle() {
        configContainer = ""
        if(CONFIG[ACTIVE].enableFullscreen){
            CONFIG[ACTIVE]["enableFullscreen"]= false
            saveConfig()
            render()
            activate()
        } else{
            CONFIG[ACTIVE]["enableFullscreen"]= true
            saveConfig()
            render()
            activate()
        }
    }

    function getConfig() {
        try {
            const parsed = JSON.parse(Spicetify.LocalStorage.get("full-screen-config"))
            if (parsed && typeof parsed === "object") {
                if(!"tv" in parsed){
                    Spicetify.LocalStorage.set("full-screen-config", "{tv: {}, def: {}, tvMode: false}")
                    return {tv: {}, def: {}, tvMode: false}
                }
                return parsed
            }
            throw ""
        } catch {
            Spicetify.LocalStorage.set("full-screen-config", "{tv: {}, def: {}, tvMode: false}")
            return {tv: {}, def: {}, tvMode: false}
        }
    }

    function saveConfig() {
        Spicetify.LocalStorage.set("full-screen-config", JSON.stringify(CONFIG))
    }


    function createAdjust(name,key,unit="",defaultValue, step, min, max, onChange = () => {}){
        let value = key in CONFIG[ACTIVE] ? CONFIG[ACTIVE][key] : defaultValue
        function adjustValue(dir) {
           let temp = value + dir * step;
           if (temp < min) {
               temp = min;
           } else if (temp > max) {
               temp = max;
           }
           value = Number(Number(temp).toFixed(step>= 1 ? 0 : 1))
           container.querySelector(".adjust-value").innerText = `${value}${unit}`
           plus.classList.toggle("disabled",value===max)
           minus.classList.toggle("disabled",value===min)
           onChange(value)
        }
        const container = document.createElement("div")
        container.innerHTML = `
        <div class="setting-row">
             <label class="col description">${name}</label>
             <div class="col action">
                <button class="switch small minus"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 7h12v2H0z"/></button>
                <p class="adjust-value">${value}${unit}</p>
                <button class="switch small plus"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.plus2px}</button>
            </div>
        </div>
        `
        const minus = container.querySelector(".minus")
        const plus = container.querySelector(".plus")
        minus.classList.toggle("disabled",value===min)
        plus.classList.toggle("disabled",value===max)
        minus.onclick = () => adjustValue(-1)
        plus.onclick = () => adjustValue(1)
        return container
    }

    function createOptions(name, options, defaultValue, callback) {
        const container = document.createElement("div");
        container.innerHTML = `
          <div class="setting-row">
            <label class="col description">${name}</label>
            <div class="col action">
              <select>
               ${Object.keys(options)
                .map(
                    (item) => `
                  <option value="${item}" dir="auto">${options[item]}</option>`
                ).join("\n")}
             </select>
            </div>
          </div>`;
        const select = container.querySelector("select");
        select.value = defaultValue;
        select.onchange = (e) => {
            callback(e.target.value);
        };
        return container;
    }

    function newMenuItem(name, key) {
        const container = document.createElement("div");
        container.innerHTML = `
          <div class="setting-row">
             <label class="col description">${name}</label>
             <div class="col action">
                <label class="switch">
                  <input type="checkbox">
                  <span class="slider"></span>
                </label>
             </div>
          </div>`;

        const toggle = container.querySelector("input");
        toggle.checked = CONFIG[ACTIVE][key]
        toggle.onchange = (evt) => {
            CONFIG[ACTIVE][key] = evt.target.checked;
            saveConfig()
            render()
            if (document.body.classList.contains('fsd-activated')) {
                activate()
            }
        };
        return container;
    }
    let configContainer;
    
    function openConfig(evt) {
        evt?.preventDefault()
        configContainer = document.createElement("div");
        configContainer.id = "popup-config-container"
        const style = document.createElement("style");
        style.innerHTML = `           
           .setting-row::after {
               content: "";
               display: table;
               clear: both;
           }
           .setting-row-but{
               display: flex;
               align-items: center;
               justify-content: center;
           }
           .setting-row .col {
               display: flex;
               padding: 10px 0;
               align-items: center;
           }
           .setting-row .col.description {
               float: left;
               padding-right: 15px;
           }
           .setting-row .col.action {
               float: right;
               text-align: right;
           }
           .switch {
             position: relative;
             display: inline-block;
             width: 46px;
             height: 26px;
           }
           .switch input {
             opacity: 0;
             width: 0;
             height: 0;
           }
           .slider {
             position: absolute;
             cursor: pointer;
             top: 0;
             left: 0;
             right: 0;
             bottom: 0;
             background-color: rgba(150,150,150,.5);
             transition: .3s;
             border-radius: 34px;
           }
           .slider:before {
             position: absolute;
             content: "";
             height: 20px;
             width: 20px;
             left: 3px;
             bottom: 3px;
             background-color: #EEE;
             transition: .3s;
             border-radius: 50%;
           }
           input:checked + .slider {
             background-color: rgba(var(--spice-rgb-button-disabled),.6);
           }
           input:focus + .slider {
             box-shadow: 0 0 1px rgba(var(--spice-rgb-button-disabled),.6);
           }
           input:checked + .slider:before {
             transform: translateX(20px);
             background-color: var(--spice-button);
             filter:  brightness(1.3);
           }
           #popup-config-container select {
               color: var(--spice-text);
               background: var(--spice-card);
               border: none;
               height: 32px;
           }
           #popup-config-container option {
            color: var(--spice-text);
            background: var(--spice-card);
           }
           button.switch {
               align-items: center;
               border: 0px;
               border-radius: 50%;
               background-color: rgba(var(--spice-rgb-shadow), 0.7);
               color: var(--spice-text);
               cursor: pointer;
               margin-inline-start: 12px;
               padding: 8px;
               width: 32px;
               height: 32px;
           }
           button.switch.disabled,
           button.switch[disabled] {
               color: rgba(var(--spice-rgb-text), 0.3);
               pointer-events: none;
           }
           button.switch.small {
               width: 22px;
               height: 22px;
               padding: 3px;
           }
           #popup-config-container .adjust-value {
               margin-inline: 12px;
               width: 22px;
               text-align: center;
           }
        `;
        configContainer.append(
            style,
            (() => {
                const container = document.createElement("div");
                container.innerHTML = `
                <div class="setting-row-but">
                  <button class="main-buttons-button main-button-primary">${CONFIG.tvMode ? "Switch to Default Mode" : "Switch to TV Mode"}</button>
                </div>`;
                const button = container.querySelector("button");
                button.onclick = () => {
                    CONFIG.tvMode ? openwithDef() : openwithTV()
                    document.querySelector("body > generic-modal")?.remove()
                };
                return document.body.classList.contains('fsd-activated') ? container : "";
            })(),
            newMenuItem("Show Lyrics","enableLyrics"),
            createOptions("Lyrics ALignment",
            {
                "left" : "Left",
                "center": "Center",
                "right" : "Right"
            },
            CONFIG[ACTIVE].lyricsAlignment || "right",
            (state) => {
                CONFIG[ACTIVE]["lyricsAlignment"] = state;
                saveConfig()
                render()
                if (document.body.classList.contains('fsd-activated')) 
                    activate()
            }),
            createAdjust("Lyrics Animation Tempo","animationTempo","s",0.4,0.1,0,1,(state) => {
                CONFIG[ACTIVE]["animationTempo"] = state;
                saveConfig()
                render()
                if (document.body.classList.contains('fsd-activated')) 
                    activate()
            }),
            newMenuItem("Enable Progress Bar", "enableProgress"),
            newMenuItem("Enable Controls", "enableControl"),
            newMenuItem("Trim Title", "trimTitle"),
            createOptions("Show Album",
            {
                "n" : "Never",
                "a" : "Show",
                "d" : "Show with Release Date"
            },
            CONFIG[ACTIVE].showAlbum || "a",
            (state) => {
                CONFIG[ACTIVE]["showAlbum"] = state;
                saveConfig()
                render()
                if (document.body.classList.contains('fsd-activated')) 
                    activate()
            }),
            newMenuItem("Show All Artists", "showAllArtists"),
            newMenuItem("Show Icons", "icons"),
            newMenuItem("Enable Song Change Animation", "enableFade"),
            createAdjust("Background Animation Time","backAnimationTime","s",0.8,0.1,0,1,(state) => {
                CONFIG[ACTIVE]["backAnimationTime"] = state;
                saveConfig()
                FSTRANSITION = CONFIG[ACTIVE]["backAnimationTime"]
                render()
                if (document.body.classList.contains('fsd-activated')) 
                    activate()
            }),
            newMenuItem("Enable Fullscreen", "enableFullscreen"),
            newMenuItem("Enable Upnext Display", "enableUpnext"),
            createOptions(
            "Upnext Scroll Animation",
            {
                 "mq": "Marquee/Scrolling",
                 "sp": "Spotify/Translating",
            },
            CONFIG[ACTIVE].upNextAnim || "sp",
            (state) => {
                CONFIG[ACTIVE]["upNextAnim"] = state;
                saveConfig()
                updateUpNext()
                if (document.body.classList.contains('fsd-activated')) 
                    activate()
            }
        ),
            createOptions(
            "Context Display",
            {
                 "never": "Never",
                 "hover": "Display on Mousemove",
                 "always": "Always Display"
            },
            CONFIG[ACTIVE].contextDisplay || "always",
            (state) => {
                CONFIG[ACTIVE]["contextDisplay"] = state;
                saveConfig()
                render()
                if (document.body.classList.contains('fsd-activated')) 
                    activate()
            }
        ),
            createAdjust("Background Blur","blurSize","px",20,4,0,100,(state) => {
                CONFIG[ACTIVE]["blurSize"] = state;
                saveConfig()
                render()
                if (document.body.classList.contains('fsd-activated')) 
                    activate()
            }),
            createOptions(
            "Background Brightness",
            {
                 0: "0%",
                .1: "10%",
                .2: "20%",
                .3: "30%",
                .4: "40%",
                .5: "50%",
                .6: "60%",
                .7: "70%",
                .8: "80%",
                .9: "90%",
                 1: "Full"
            },
            "brightness" in CONFIG[ACTIVE] ? Number(CONFIG[ACTIVE].brightness) : .8 ,
            (state) => {
                CONFIG[ACTIVE]["brightness"] = Number(state);
                saveConfig()
                render()
                if (document.body.classList.contains('fsd-activated')) 
                    activate()
            }
        ),
        )
        Spicetify.PopupModal.display({
            title: ACTIVE==="tv" ? "TV Mode Config" : "Full Screen Config",
            content: configContainer,
        })
    }

    container.ondblclick = deactivate

    // Add Full Screen Button on bottom bar
    const button = document.createElement("button")
    button.classList.add("button", "spoticon-fullscreen-16", "fsd-button","control-button","InvalidDropTarget")
    button.setAttribute("data-tooltip", "Full Screen")
    button.id = "fs-button"
    button.setAttribute("title", "Full Screen")

    button.onclick = openwithDef
    
    extraBar.append(button);
    button.oncontextmenu = (evt) =>{
        evt.preventDefault()
        ACTIVE = "def"
        openConfig()
    };

    // Add TV Mode Button on top bar
    const button2 = document.createElement("button")
    button2.classList.add("button", "spoticon-device-tv-16", "tm-button", "full-button","main-topBar-button","InvalidDropTarget")
    button2.setAttribute("data-tooltip", "TV Mode")
    button2.id = "TV-button"

    button2.setAttribute("title", "TV Mode Display")
    button2.onclick = openwithTV

    topBar.append(button2)
    button2.oncontextmenu = (evt) =>{
        evt.preventDefault()
        ACTIVE = "tv"
        openConfig()
    };
    
    render()
})()