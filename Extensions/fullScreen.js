// @ts-check
// NAME: Full Screen Mode
// AUTHOR: dax
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
            if (!document.body.classList.contains('fsd-activated') || !CONFIG.tvMode) {
              if(!CONFIG.tvMode){
                 CONFIG["tvMode"]= true;
                 saveConfig()
                 render()
             }
              activate()
          } else
              deactivate();
    }
    function openwithDef() {
            if (!document.body.classList.contains('fsd-activated') || CONFIG.tvMode) {
              if(CONFIG.tvMode){
                CONFIG["tvMode"]= false;
                saveConfig()
                render()
             }
              activate()
         }  else
                deactivate();
    }

    const CONFIG = getConfig()

    const style = document.createElement("style")
    const styleBase = `
#full-screen-display {
    display: none;
    position: fixed;
    width: 100%;
    height: 100%;
    cursor: default;
    left: 0;
    top: 0;
}
#fsd-upnext-container{
    float: right;
    box-sizing: border-box;
    border: 1px solid rgb(125, 125, 125);
    background-color: rgb(25, 25, 25);
    width: 472px;
    height: 102px;
    position: fixed;
    top: 45px;
    right: 70px;
    display: none;
    flex-direction: row;
    text-align: left;
}
#fsd_next_art_image{
    background-size: cover;
    background-position: center;
    width:  100px;
    height: 100px;
}
#fsd_next_details{
    padding-left: 18px;
    padding-top: 17px;
    line-height: initial;
    max-width: 325px;
    min-width: 200px;
    color: #FFFFFF;
    font-size: 19px;
    overflow: hidden;
}
#fsd_next_tit_art{
    padding-top: 9px;
    font-size: 21px;
    font-weight: 500;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}
@keyframes fsd_cssmarquee {
    0% {
        transform: translateX(0%);
    }
    15% {
        transform: translateX(0%);
    }
    100% {
         transform: translateX(var(--translate_width_fsd));
    }
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
    filter: blur(6px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    transform: translateZ(0);
    backface-visibility: hidden;
    backdrop-filter: blur(6px);
}

#fsd-progress-container {
    width: 100%;
    display: flex;
    align-items: center;
}
#fsd-progress {
    width: 100%;
    height: 6px;
    border-radius: 6px;
    background-color: #ffffff50;
    overflow: hidden;
}
#fsd-progress-inner {
    height: 100%;
    border-radius: 6px;
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
    width: calc(100vh - 400px);
    max-width: 600px;
}
#fsd-foreground {
    flex-direction: column;
    text-align: center;
}
#fsd-details {
    padding-top: 30px;
    line-height: initial;
    max-width: 33%;
    color: #FFFFFF;
}
#fsd-title {
    font-size: 50px;
    font-weight: var(--glue-font-weight-black);
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
    min-width: 540px;
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
    transition: background-image 0.8s linear;
}`,
`#fsd-background-image {
    height: 100%;
    background-size: cover;
    filter: brightness(0.4);
    backdrop-filter: brightness(0.4);
    background-position: center;
    backface-visibility: hidden;
    transform: translateZ(0);
}
#fsd-foreground {
    flex-direction: row;
    text-align: left;
    justify-content: left;
    margin-top: 150px
}
fsd-background-image {
    filter: brightness(0.4);
    background-position: bottom;
}
#fsd-art {
    width: calc(100vw - 840px);
    min-width: 250px;
    max-width: 330px;
    margin-left: 50px;
}
#fsd-details {
    padding-left: 45px;
    line-height: initial;
    max-width: 80%;
    color: #FFFFFF;
}
#fsd-title {
    font-size: 63px;
    font-weight: var(--glue-font-weight-black);
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
#fsd-elapsed {
    min-width: 56px;
    margin-right: 10px;
    text-align: right;
}
.fsd-background-fade {
    transition: background-image 0.6s linear;
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
   

    const container = document.createElement("div")
    container.id = "full-screen-display"
    container.classList.add("Video", "VideoPlayer--fullscreen", "VideoPlayer--landscape")

    let cover, back, title, artist,album, prog, elaps, durr, play, fsd_nextCover, fsd_up_next_text, fsd_next_tit_art, fsd_next_tit_art_inner, fsd_first_span, fsd_second_span;
    const nextTrackImg = new Image()
    function render() {
        Spicetify.Player.removeEventListener("songchange", updateInfo)
        Spicetify.Player.removeEventListener("onprogress", updateProgress)
        Spicetify.Player.removeEventListener("onplaypause", updateControl)
        Spicetify.Player.removeEventListener("onprogress", updateUpNext)

        style.innerHTML = styleBase + styleChoices[CONFIG.tvMode ? 1 : 0] + iconStyleChoices[CONFIG.icons ? 1 : 0];

        container.innerHTML = `
${CONFIG.tvMode?`<div id="fsd-background">
  <div id="fsd-background-image"></div>
</div>`:
`<canvas id="fsd-background"></canvas>`}
 ${CONFIG.enableUpnext?`
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
</div>
<div id="fsd-foreground">
    <div id="fsd-art">
        <div id="fsd-art-image">
            <div id="fsd-art-inner"></div>
        </div>
    </div>
    <div id="fsd-details">
        <div id="fsd-title"></div>
        <div id="fsd-artist">
        <svg height="30" width="30" viewBox="0 0 16 16" fill="currentColor">
        ${Spicetify.SVGIcons.artist}
    </svg>
    <span></span>
        </div>
        ${CONFIG.showAlbum ? `<div id="fsd-album">
        <svg height="30" width="30" viewBox="0 0 16 16" fill="currentColor">
                ${Spicetify.SVGIcons.album}
            </svg>
            <span></span>
        </div>` : ""}
        <div id="fsd-status" class="${CONFIG.enableControl || (CONFIG.enableProgress && (!CONFIG.tvMode || !CONFIG.disablePTV)) ? "active" : ""}">
        ${CONFIG.enableControl ? `
        <div id="fsd-controls">
           <button id="fsd-back">
                <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                    ${Spicetify.SVGIcons["skip-back"]}
                </svg>
            </button>
            <button id="fsd-play">
                <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                    ${Spicetify.SVGIcons.play}
                </svg>
            </button>
            <button id="fsd-next">
                <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                    ${Spicetify.SVGIcons["skip-forward"]}
                </svg>
            </button>
        </div>` : ""}
            ${(CONFIG.enableProgress && (!CONFIG.tvMode || !CONFIG.disablePTV)) ? `
            <div id="fsd-progress-container">
                <span id="fsd-elapsed"></span>
                <div id="fsd-progress"><div id="fsd-progress-inner"></div></div>
                <span id="fsd-duration"></span>
            </div>` : ""}
        </div>
    </div>
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

      if (CONFIG.enableUpnext) {
            fsd_myUp = container.querySelector("#fsd-upnext-container")
            fsd_myUp.onclick = Spicetify.Player.next
            fsd_nextCover = container.querySelector("#fsd_next_art_image")
            fsd_up_next_text = container.querySelector("#fsd_up_next_text")
            fsd_next_tit_art = container.querySelector("#fsd_next_tit_art")
            fsd_next_tit_art_inner = container.querySelector("#fsd_next_tit_art_inner")
            fsd_first_span= container.querySelector("#fsd_first_span")
            fsd_second_span= container.querySelector("#fsd_second_span")
        }

        if (CONFIG.enableProgress && (!CONFIG.tvMode || !CONFIG.disablePTV)) {
            prog = container.querySelector("#fsd-progress-inner")
            durr = container.querySelector("#fsd-duration")
            elaps = container.querySelector("#fsd-elapsed")
        }

        if (CONFIG.enableControl) {
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
        const elemx = document.documentElement;
        const full_on = elemx.requestFullscreen || elemx.webkitRequestFullScreen || elemx.mozRequestFullScreen || elemx.msRequestFullscreen;
        full_on.call(elemx);
}
    function FullScreenOff() {
        const full_off = document.exitFullscreen || document.webkitExitFullScreen || document.mozExitFullScreen || document.msExitFullscreen;
        full_off.call(document);
}
function getAlbumInfo(uri) {
    return Spicetify.CosmosAsync.get(`hm://album/v1/album-app/album/${uri}/desktop`)
}
function getArtistHero(artistId) {
        return Spicetify.CosmosAsync.get(`hm://artist/v1/${artistId}/desktop?format=json`)
}
    
    async function updateInfo() {
       const meta = Spicetify.Player.data.track.metadata

        // prepare title
        let rawTitle = meta.title
        if (CONFIG.trimTitle) {
            rawTitle = rawTitle
                .replace(/\(.+?\)/g, "")
                .replace(/\[.+?\]/g, "")
                .replace(/\s\-\s.+?$/, "")
                .trim()
        }

        // prepare artist
        let artistName
        if (CONFIG.showAllArtists) {
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
        if (CONFIG.showAlbum) {
            albumText = meta.album_title || ""
            const albumURI = meta.album_uri
            if (albumURI?.startsWith("spotify:album:")) {
                const albumInfo = await getAlbumInfo(albumURI.replace("spotify:album:", ""))

                const albumDate = new Date(albumInfo.year, (albumInfo.month || 1) - 1, albumInfo.day || 0)
                const recentDate = new Date()
                recentDate.setMonth(recentDate.getMonth() - 6)
                const dateStr = albumDate.toLocaleString(
                    'default',
                    albumDate > recentDate ? {
                        year: 'numeric',
                        month: 'short'
                    } : {
                        year: 'numeric'
                    }
                )

                albumText += " • " + dateStr
            }
        }

        // prepare duration
        let durationText
        if (CONFIG.enableProgress && (!CONFIG.tvMode || !CONFIG.disablePTV)) {
            durationText = Spicetify.Player.formatTime(meta.duration)
        }
      const previouseImg = nextTrackImg.cloneNode()  
      if(CONFIG.tvMode){
         //Prepare Artist Image
          if(meta.artist_uri != null){
               getArtistHero(meta.artist_uri.split(":")[2]).then(artist_info=>{
                  if(artist_info.header_image)
                       nextTrackImg.src = artist_info.header_image.image
                   else
                       nextTrackImg.src = meta.image_xlarge_url    
                   }).catch(err => console.error(err))
            } else
                nextTrackImg.src = meta.image_xlarge_url  
         }
     else
        nextTrackImg.src = meta.image_xlarge_url
        
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
            // Reset Animation
             fsd_next_tit_art_inner.style.removeProperty('animation')
             fsd_second_span.innerText=""
             fsd_first_span.style.paddingRight = "0px"
        }

        nextTrackImg.onerror = () => {
            // Placeholder
            console.log("Check your Internet!Unable to load Image")
            nextTrackImg.src = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCI+CiAgPHJlY3Qgc3R5bGU9ImZpbGw6I2ZmZmZmZiIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiB4PSIwIiB5PSIwIiAvPgogIDxwYXRoIGZpbGw9IiNCM0IzQjMiIGQ9Ik0yNi4yNSAxNi4xNjJMMjEuMDA1IDEzLjEzNEwyMS4wMTIgMjIuNTA2QzIwLjU5NCAyMi4xOTIgMjAuMDgxIDIxLjk5OSAxOS41MTkgMjEuOTk5QzE4LjE0MSAyMS45OTkgMTcuMDE5IDIzLjEyMSAxNy4wMTkgMjQuNDk5QzE3LjAxOSAyNS44NzggMTguMTQxIDI2Ljk5OSAxOS41MTkgMjYuOTk5QzIwLjg5NyAyNi45OTkgMjIuMDE5IDI1Ljg3OCAyMi4wMTkgMjQuNDk5QzIyLjAxOSAyNC40MjIgMjIuMDA2IDE0Ljg2NyAyMi4wMDYgMTQuODY3TDI1Ljc1IDE3LjAyOUwyNi4yNSAxNi4xNjJaTTE5LjUxOSAyNS45OThDMTguNjkyIDI1Ljk5OCAxOC4wMTkgMjUuMzI1IDE4LjAxOSAyNC40OThDMTguMDE5IDIzLjY3MSAxOC42OTIgMjIuOTk4IDE5LjUxOSAyMi45OThDMjAuMzQ2IDIyLjk5OCAyMS4wMTkgMjMuNjcxIDIxLjAxOSAyNC40OThDMjEuMDE5IDI1LjMyNSAyMC4zNDYgMjUuOTk4IDE5LjUxOSAyNS45OThaIi8+Cjwvc3ZnPgo="
        }
    }

    function animateCanvas(prevImg, nextImg) {
        const { innerWidth: width, innerHeight: height } = window
        back.width = width
        back.height = height
        const dim = width > height ? width : height

        const ctx = back.getContext('2d')
        ctx.imageSmoothingEnabled = false
        ctx.filter = `blur(20px) brightness(0.5)`
        const blur = 20
        
        if (!CONFIG.enableFade) {
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
                factor += 0.016;
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    function updateUpNext(){
        fsd_up_next_text.innerText = "UP NEXT"
            var metadata = new Object();
            const queue_metadata = Spicetify.Queue.next_tracks[0]
            if(queue_metadata){
                metadata = queue_metadata.metadata
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
            
            fsd_first_span.innerText = metadata.title + "  •  " + next_artist
            fsd_second_span.innerText= metadata.title + "  •  " + next_artist
            
            const next_image =  metadata.image_xlarge_url
            if(next_image){
               fsd_nextCover.style.backgroundImage = `url("${next_image}")`
            } else{
                 if(metadata.image_url)
                    fsd_nextCover.style.backgroundImage = `url("${metadata.image_url}")`
                 else{
                    fsd_nextCover.style.backgroundImage = `url("${"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCI+CiAgPHJlY3Qgc3R5bGU9ImZpbGw6I2ZmZmZmZiIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiB4PSIwIiB5PSIwIiAvPgogIDxwYXRoIGZpbGw9IiNCM0IzQjMiIGQ9Ik0yNi4yNSAxNi4xNjJMMjEuMDA1IDEzLjEzNEwyMS4wMTIgMjIuNTA2QzIwLjU5NCAyMi4xOTIgMjAuMDgxIDIxLjk5OSAxOS41MTkgMjEuOTk5QzE4LjE0MSAyMS45OTkgMTcuMDE5IDIzLjEyMSAxNy4wMTkgMjQuNDk5QzE3LjAxOSAyNS44NzggMTguMTQxIDI2Ljk5OSAxOS41MTkgMjYuOTk5QzIwLjg5NyAyNi45OTkgMjIuMDE5IDI1Ljg3OCAyMi4wMTkgMjQuNDk5QzIyLjAxOSAyNC40MjIgMjIuMDA2IDE0Ljg2NyAyMi4wMDYgMTQuODY3TDI1Ljc1IDE3LjAyOUwyNi4yNSAxNi4xNjJaTTE5LjUxOSAyNS45OThDMTguNjkyIDI1Ljk5OCAxOC4wMTkgMjUuMzI1IDE4LjAxOSAyNC40OThDMTguMDE5IDIzLjY3MSAxOC42OTIgMjIuOTk4IDE5LjUxOSAyMi45OThDMjAuMzQ2IDIyLjk5OCAyMS4wMTkgMjMuNjcxIDIxLjAxOSAyNC40OThDMjEuMDE5IDI1LjMyNSAyMC4zNDYgMjUuOTk4IDE5LjUxOSAyNS45OThaIi8+Cjwvc3ZnPgo="}")`
                }
            }
        if((Spicetify.Player.data.duration-Spicetify.Player.getProgress()<=(CONFIG.tvMode ? 45000:30000)) && metadata.title){
            fsd_myUp.style.display = 'flex'
            if(fsd_second_span.offsetWidth>=307){
                fsd_first_span.style.paddingRight = "80px"
                anim_time= 5000*(fsd_first_span.offsetWidth/300)
                fsd_myUp.style.setProperty('--translate_width_fsd', `-${fsd_first_span.offsetWidth+3.5}px`);
                fsd_next_tit_art_inner.style.animation = "fsd_cssmarquee "+ anim_time +"ms linear 1200ms infinite"
             } 
             else{
                fsd_first_span.style.paddingRight = "0px"
                fsd_next_tit_art_inner.style.removeProperty('animation')
                fsd_second_span.innerText=""
                fsd_next_tit_art_inner.style.marginLeft = "0px"
           }
        } 
        else{
            fsd_first_span.style.paddingRight = "0px"
            fsd_next_tit_art_inner.style.removeProperty('animation')
            fsd_second_span.innerText=""
            fsd_next_tit_art_inner.style.marginLeft = "0px"
            fsd_myUp.style.display = 'none'
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
    var full_screen_status=false;

    var timer;
    var fadeInBuffer = false;
    container.onmousemove = function () {
   	 if (!fadeInBuffer) {
   		 if (timer) {
   			 clearTimeout(timer);
             timer = 0;
         }
         container.style.cursor = ''   
        } else {
             container.style.cursor =  'default'
            fadeInBuffer = false;
        }
        timer = setTimeout(function () {
             container.style.cursor = 'none'
             fadeInBuffer = true;
        }, 2000)
    }
    container.style.cursor = 'default'
    
  function activate() {
        button.classList.add("control-button--active","control-button--active-dot")
        updateInfo()
        Spicetify.Player.addEventListener("songchange", updateInfo)
        if(CONFIG.enableUpnext){
          Spicetify.Player.addEventListener("onprogress", updateUpNext)
        }
        if(CONFIG.enableFade){
            cover.classList.add("fsd-background-fade")
            if(CONFIG.tvMode)
                back.classList.add("fsd-background-fade")
        } else{
            cover.classList.remove("fsd-background-fade")
            if(CONFIG.tvMode)
                back.classList.remove("fsd-background-fade")
        }
        if (CONFIG.enableProgress && (!CONFIG.tvMode || !CONFIG.disablePTV)) {
            updateProgress()
            Spicetify.Player.addEventListener("onprogress", updateProgress)
        }
        if (CONFIG.enableControl) {
            updateControl({ data: { is_paused: !Spicetify.Player.isPlaying() }})
            Spicetify.Player.addEventListener("onplaypause", updateControl)
        }
        document.body.classList.add(...classes)
        if (CONFIG.enableFullscreen) {
            FullScreenOn()
            full_screen_status=true;
        } else {
            if(full_screen_status) {
               FullScreenOff()
               full_screen_status=false;
            }
            full_screen_status=false
        }
        document.body.append(style, container)
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
        if(CONFIG.enableUpnext){
            Spicetify.Player.removeEventListener("onprogress", updateUpNext)
        }
        if (CONFIG.enableProgress && (!CONFIG.tvMode || !CONFIG.disablePTV)) {
            Spicetify.Player.removeEventListener("onprogress", updateProgress)
        }
        if (CONFIG.enableControl) {
            Spicetify.Player.removeEventListener("onplaypause", updateControl)
        }
        document.body.classList.remove(...classes)
        full_screen_status=false;
        if (CONFIG.enableFullscreen) {
            FullScreenOff()
        }
        let popup = document.querySelector("body > generic-modal > div > div > div > div.main-trackCreditsModal-header > button")
        if(popup)
            popup.click()
        style.remove()
        container.remove()
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
        if(CONFIG.enableFullscreen){
            CONFIG["enableFullscreen"]= false
            saveConfig()
            render()
            activate()
     } else{
            CONFIG["enableFullscreen"]= true
            saveConfig()
            render()
            activate()
        }
    }
  //   function onOff() {
  //      if (document.body.classList.contains('fsd-activated'))
  //       deactivate();
  //      else
  //       activate();
  // }    
  //  function sleep (time) {
  //       return new Promise((resolve) => setTimeout(resolve, time));
  //   }  
  // function togglefsdode() {
  //       if (!document.body.classList.contains('fsd-activated')) {
  //       document.getElementById("TV-button").click();
  //   }
  //    else if(document.body.classList.contains('fsd-activated'))
  //   {
  //       document.getElementById("fs-button").click();
  //       sleep(5).then(() => {
  //      document.getElementById("TV-button").click();
  //      });
  //   }}

    function getConfig() {
        try {
            const parsed = JSON.parse(Spicetify.LocalStorage.get("full-screen-config"))
            if (parsed && typeof parsed === "object") {
                return parsed
            }
            throw ""
        } catch {
            Spicetify.LocalStorage.set("full-screen-config", "{}")
            return {}
        }
    }

    function saveConfig() {
        Spicetify.LocalStorage.set("full-screen-config", JSON.stringify(CONFIG))
    }

    function newMenuItem(name, key) {
        const container = document.createElement("div");
        container.innerHTML = `
<div class="setting-row">
    <label class="col description">${name}</label>
    <div class="col action"><button class="switch">
        <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
            ${Spicetify.SVGIcons.check}
        </svg>
    </button></div>
</div>`;

        const slider = container.querySelector("button");
        slider.classList.toggle("disabled", !CONFIG[key]);

        slider.onclick = () => {
            const state = slider.classList.contains("disabled");
            slider.classList.toggle("disabled");
            CONFIG[key] = state;
            saveConfig()
            render()
            if (document.body.classList.contains('fsd-activated')) {
                activate()
            }
        };
        return container;
    }
    let configContainer;
    function openConfig(event) {
        event.preventDefault();
        if (!configContainer) {
            configContainer = document.createElement("div");
            configContainer.id = "popup-config-container"
            const style = document.createElement("style");
            style.innerHTML = `
.setting-row::after {
    content: "";
    display: table;
    clear: both;
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
button.switch {
    align-items: center;
    border: 0px;
    border-radius: 50%;
    background-color: rgba(var(--spice-rgb-shadow), .7);
    color: var(--spice-text);
    cursor: pointer;
    display: flex;
    margin-inline-start: 12px;
    padding: 8px;
}
button.switch.disabled {
    color: rgba(var(--spice-rgb-text), .3);
}`;

            configContainer.append(
                style,
                newMenuItem("Enable Progress Bar", "enableProgress"),
                newMenuItem("Disable Progress Bar in TV Mode", "disablePTV"),
                newMenuItem("Enable Controls", "enableControl"),
                newMenuItem("Trim Title", "trimTitle"),
                newMenuItem("Show Album", "showAlbum"),
                newMenuItem("Show All Artists", "showAllArtists"),
                newMenuItem("Show Icons", "icons"),
                newMenuItem("Enable Song Change Animation", "enableFade"),
                newMenuItem("Enable Fullscreen", "enableFullscreen"),
                newMenuItem("Enable Upnext Display", "enableUpnext"),
                newMenuItem("Enable TV Mode", "tvMode"),
            )
        }
        Spicetify.PopupModal.display({
            title: "Full Screen Display",
            content: configContainer,
        })
    }

    container.ondblclick = deactivate
    container.oncontextmenu = openConfig

    const button = document.createElement("button")
    button.classList.add("button", "spoticon-fullscreen-16", "fsd-button","control-button","InvalidDropTarget")
    button.setAttribute("data-tooltip", "Full Screen")
    button.id = "fs-button"
    button.setAttribute("title", "Full Screen")

    button.onclick = openwithDef
    
    extraBar.append(button);
    button.oncontextmenu = openConfig;

    // Add activator on top bar
    const button2 = document.createElement("button")
    button2.classList.add("button", "spoticon-device-tv-16", "tm-button", "full-button","main-topBar-button","InvalidDropTarget")
    button2.setAttribute("data-tooltip", "TV Mode")
    button2.id = "TV-button"

    button2.setAttribute("title", "TV Mode Display")
    button2.onclick = openwithTV

    topBar.append(button2)
    button2.oncontextmenu = openConfig;

    render()
})()

//     // Add activator on top bar
//     const button = document.createElement("button")
//     button.classList.add("button", "spoticon-fullscreen-16", "fsd-button", "full-button")
//     button.setAttribute("data-tooltip", "Full Screen")
//     button.id = "ff-button"


//     // document.querySelector("#view-browser-navigation-top-bar").append(button)
//     document.querySelector(".extra-controls-container").append(button)
//     document.getElementById("video-player").append(style, container)

//     // Add setting toggles in right click menu
//     container.setAttribute("data-uri", "spotify:special:fullScreen")
//     container.setAttribute("data-contextmenu", "")

//     const checkURI = ([uri]) => uri === "spotify:special:fullScreen"
//     function newMenuItem(name, key) {
//         new Spicetify.ContextMenu.Item(
//             name,
//             function () {
//                 CONFIG[key] = !CONFIG[key]
//                 this.icon = CONFIG[key] && "check"
//                 saveConfig()
//                 render()
//                 activate()
//             },
//             checkURI,
//             CONFIG[key] ? "check" : undefined,
//         ).register()
//     }

//     newMenuItem("Enable progress bar", "enableProgress")
//     newMenuItem("Enable controls", "enableControl")
//     newMenuItem("Trim title", "trimTitle")
//     newMenuItem("Show album", "showAlbum")
//     newMenuItem("Show all artists", "showAllArtists")
//     newMenuItem("Show icons", "icons")
//     newMenuItem("Vertical mode", "vertical")
//     // newMenuItem("Enable song change animation", "enableFade")
//     newMenuItem("Enable fullscreen", "enableFullscreen")
//     new Spicetify.ContextMenu.Item("TV Mode", togglefsdode, checkURI).register()
//     new Spicetify.ContextMenu.Item("Exit", deact, checkURI).register()

//     button.onclick = onOff
//     container.ondblclick = deact

//     Spicetify.Keyboard.registerShortcut(
//         {
//             key: Spicetify.Keyboard.KEYS["F11"], 
//             ctrl: false, 
//             shift: false, 
//             alt: false,
//         }, 
//         onOff
//     );
//     Spicetify.Keyboard.registerShortcut(
//         {
//             key: Spicetify.Keyboard.KEYS["ESCAPE"], 
//             ctrl: false, 
//             shift: false, 
//             alt: false,
//         }, 
//         deact
//     );
//     render()
// })()
