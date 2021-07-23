// @ts-check
// NAME: tvMode
// AUTHOR: dax
// VERSION: 1.0
// DESCRIPTION: Full screen display based on Spotify app on Android TV.

/// <reference path="../spicetify-cli/globals.d.ts" />

(function tvMode() {
    const topBar = document.querySelector(".main-topBar-historyButtons");
    const {
        CosmosAsync,
        LocalStorage,
        ContextMenu
    } = Spicetify;

    if (!topBar || !CosmosAsync || !LocalStorage || !ContextMenu) {
        setTimeout(tvMode, 500);
        return;
    }

    const CONFIG = getConfig()

    const style = document.createElement("style")
    const styleBase = `
#tv-mode-display {
    display: none;
    position: fixed;
    width: 100%;
    height: 100%;
    cursor: default;
}
#tvm-upnext-container{
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
#tvm_next_art_image{
	background-size: cover;
	background-position: center;
	width:  100px;
	height: 100px;
}
#next_details{
    padding-left: 18px;
    padding-top: 17px;
    line-height: initial;
    max-width: 325px;
    min-width: 200px;
    color: #FFFFFF;
    font-size: 19px;
    overflow: hidden;
}
#next_tit_art{
    padding-top: 9px;
    font-size: 21px;
    font-weight: 500;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}
@keyframes cssmarquee {
	0% {
		transform: translateX(0%);
	}
	15% {
		transform: translateX(0%);
	}
    100% {
         transform: translateX(var(--translate_width));
    }
}
#tvm-foreground {
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
#tvm-art-image {
    position: relative;
    width: 100%;
    height: 100%;
    padding-bottom: 100%;
    /*border-radius: 8px;*/
    background-size: cover;
}
#tvm-art-inner {
    position: absolute;
    left: 3%;
    bottom: 0;
    width: 94%;
    height: 94%;
    z-index: -1;
    filter: blur(6px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    backface-visibility: hidden;
    transform: translateZ(0);
    backdrop-filter: blur(6px);
}
#tvm-progress-container {
    width: 100%;
    display: flex;
    align-items: center;

}
#tvm-progress {
    width: 100%;
    height: 6px;
    border-radius: 6px;
    background-color: #ffffff50;
    overflow: hidden;
}
#tvm-progress-inner {
    height: 100%;
    border-radius: 6px;
    background-color: #ffffff;
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.8);
}
#tvm-elapsed {
    margin-right: 10px;
}
#tvm-duration {
    margin-left: 10px;
}
#tvm-background {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: -2;
    transform: scale(1);
}
#tvm-background-image {
    height: 100%;
    background-size: cover;
    filter: brightness(0.4);
    backdrop-filter: brightness(0.4);
    background-position: center;
    backface-visibility: hidden;
    transform: translateZ(0);
}
.tvm-background-fade {
    transition: background-image 0.6s linear;
}
#tv-mode-display button {
    background-color: transparent;
    border: 0;
    color: currentColor;
    padding: 0 5px;
}
body.tm-activated #tv-mode-display {
    display: block
}`

    const styleChoices = [`
#tvm-foreground {
    flex-direction: row;
    text-align: left;
    justify-content: left;
    margin-top: 150px
}
tvm-background-image {
    filter: brightness(0.4);
    background-position: bottom;
}
#tvm-art {
    width: calc(100vw - 840px);
    min-width: 250px;
    max-width: 330px;
    margin-left: 50px;
}
#tvm-details {
    padding-left: 45px;
    line-height: initial;
    max-width: 80%;
    color: #FFFFFF;
}
#tvm-title {
    font-size: 63px;
    font-weight: var(--glue-font-weight-black);
}
#tvm-artist, #tvm-album {
    font-size: 34px;
    font-weight: var(--glue-font-weight-medium);
    color: #C3C7D1;
}
#tvm-artist svg, #tvm-album svg {
    margin-right: 5px;
    width: 25px;
    height: 25px;
}
#tvm-status {
    display: flex;
    min-width: 400px;
    max-width: 400px;
    align-items: center;
}
#tvm-status.active {
    margin-top: 20px;
}
#tvm-controls {
    display: flex;
    margin-right: 10px;
}`,
`
#tvm-art {
    width: calc(100vh - 400px);
    max-width: 650px;
}
#tvm-foreground {
    flex-direction: column;
    text-align: center;
}
#tvm-details {
    padding-top: 50px;
    line-height: initial;
    max-width: 33%;
    color: #FFFFFF;
}
#tvm-title {
    font-size: 50px;
    font-weight: var(--glue-font-weight-black);
}
#tvm-artist, #tvm-album {
    font-size: 30px;
    font-weight: var(--glue-font-weight-medium);
    color: #C3C7D1;
}
#tvm-artist svg, #tvm-album svg {
    width: 25px;
    height: 25px;
    margin-right: 5px;
}
#tvm-status {
    display: flex;
    min-width: 540px;
    max-width: 600px;
    align-items: center;
    flex-direction: column;
}
#tvm-status.active {
    margin: 20px auto 0;
}
#tvm-controls {
    margin-top: 20px;
    order: 2
}`
    ]

    const iconStyleChoices = [`
#tvm-artist svg, #tvm-album svg {
    display: none;
}`,
`
#tvm-artist svg, #tvm-album svg {
    display: inline-block;
}`
    ]
   

    const container = document.createElement("div")
    container.id = "tv-mode-display"
    container.classList.add("Video", "VideoPlayer--fullscreen", "VideoPlayer--landscape")

    let cover, back, title, artist, prog, elaps, durr, play, nextCover, up_next_text, next_tit_art, next_tit_art_inner, first_span, second_span, bgImage
    const nextTrackImg = new Image()

    function render() {
        Spicetify.Player.removeEventListener("songchange", updateInfo)
        Spicetify.Player.removeEventListener("onprogress", updateProgress)
        Spicetify.Player.removeEventListener("onplaypause", updateControl)
        Spicetify.Player.removeEventListener("onprogress", updateUpNext)

        style.innerHTML = styleBase + styleChoices[CONFIG.vertical ? 1 : 0] + iconStyleChoices[CONFIG.icons ? 1 : 0];

        container.innerHTML = `
<div id="tvm-background">
  <div id="tvm-background-image"></div>
</div>
${CONFIG.enableUpnext?`
<div id="tvm-upnext-container">
      <div id="tvm_next_art">
        <div id="tvm_next_art_image"></div>
       </div>
      <div id="next_details">
        <div id="up_next_text"></div>
        <div id="next_tit_art">
        <div id="next_tit_art_inner">
        <span id="first_span"></span>
        <span id="second_span"></span>
        </div></div>
      </div>
    </div>`:""}
<div id="tvm-foreground">
    <div id="tvm-art">
        <div id="tvm-art-image">
            <div id="tvm-art-inner"></div>
        </div>
    </div>
    <div id="tvm-details">
        <div id="tvm-title"></div>
        <div id="tvm-artist">
       <svg height="30" width="30" viewBox="0 0 16 16" fill="currentColor">
        ${Spicetify.SVGIcons.artist}
    </svg> 
    <span></span>
        </div>
        ${CONFIG.showAlbum ? `<div id="tvm-album">
        <svg height="30" width="30" viewBox="0 0 16 16" fill="currentColor">
                ${Spicetify.SVGIcons.album}
            </svg>
            <span></span>
        </div>` : ""}
        <div id="tvm-status" class="${CONFIG.enableControl || CONFIG.enableProgress ? "active" : ""}">
        ${CONFIG.enableControl ? `
        <div id="tvm-controls">
        <button id="tvm-back">
                <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                    ${Spicetify.SVGIcons["skip-back"]}
                </svg>
            </button>
            <button id="tvm-play">
                <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                    ${Spicetify.SVGIcons.play}
                </svg>
            </button>
            <button id="tvm-next">
                <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                    ${Spicetify.SVGIcons["skip-forward"]}
                </svg>
            </button>
        </div>` : ""}
            ${CONFIG.enableProgress ? `
            <div id="tvm-progress-container">
                <span id="tvm-elapsed"></span>
                <div id="tvm-progress"><div id="tvm-progress-inner"></div></div>
                <span id="tvm-duration"></span>
            </div>` : ""}
        </div>
    </div>
</div>`

        cover = container.querySelector("#tvm-art-image")
        back = container.querySelector("#tvm-background-image")
        title = container.querySelector("#tvm-title")
        artist = container.querySelector("#tvm-artist span")
        album = container.querySelector("#tvm-album span")

        if (CONFIG.enableUpnext) {
            myUp = container.querySelector("#tvm-upnext-container")
            myUp.onclick = Spicetify.Player.next
            nextCover = container.querySelector("#tvm_next_art_image")
            up_next_text = container.querySelector("#up_next_text")
            next_tit_art = container.querySelector("#next_tit_art")
            next_tit_art_inner = container.querySelector("#next_tit_art_inner")
            first_span= container.querySelector("#first_span")
            second_span= container.querySelector("#second_span")
        }

        if (CONFIG.enableProgress) {
            prog = container.querySelector("#tvm-progress-inner")
            durr = container.querySelector("#tvm-duration")
            elaps = container.querySelector("#tvm-elapsed")
        }

        if (CONFIG.enableControl) {
            play = container.querySelector("#tvm-play")
            play.onclick = Spicetify.Player.togglePlay
            container.querySelector("#tvm-next").onclick = Spicetify.Player.next
            container.querySelector("#tvm-back").onclick = Spicetify.Player.back
        }
    }

    const classes = [
        "video",
        "video-full-screen",
        "video-full-window",
        "video-full-screen--hide-ui",
        "tm-activated"
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
   
//     function abc(){
//     let artis_ur= Spicetify.Player.data.track.metadata.artist_uri
//     let e_artis_ur= artis_ur.replace("spotify:artist:", "")
//     let token= "BQCVjH2vzb_tpjuCtVgqUe9xHQM2rPLpkw95sbqWngE2_F3uLy1flfr19jS9lH8CmRbqIf9Gyx9_6sDeyGtsyKEu2JVAwg48qI__SfC_7ywLR6VVSBSPpkwIDlXxX-Vy869FAYGWUPu14x4"
//     var url = "https://api.spotify.com/v1/artists/"+e_artis_ur;
//     console.log("Request URL:  "+url)
//       var xhr = new XMLHttpRequest();
//     xhr.open("GET", url);

//      xhr.setRequestHeader("Authorization", "Bearer "+token);

//     var getfo = xhr.onreadystatechange = function () {
//     if (xhr.readyState === 4) {
//       console.log(xhr.status);
//       if(xhr.status!=200){
//         console.log("token expired")
//         image_u= Spicetify.Player.data.track.metadata.image_xlarge_url
//         console.log("This is inner"+image_u)
//         updateInfo(image_u)
//       }
//       else{
//       // console.log(xhr.responseText);
//       const response= JSON.parse(xhr.responseText)
//       image_u= response.images[0].url;  
//       console.log("This is inner"+image_u)
//       updateInfo(image_u)
//   }
//    }};
//   xhr.send(); 
// }

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
        if (CONFIG.enableProgress) {
            durationText = Spicetify.Player.formatTime(meta.duration)
        }

    //Prepare Artist Image
       
        if(meta.artist_uri != null){
        getArtistHero(meta.artist_uri.split(":")[2]).then(artist_info=>{
           if(artist_info.header_image){
            	const background_image = artist_info.header_image.image;
            	nextTrackImg.src = background_image;
            }
            else{
            	const background_image = meta.image_xlarge_url
                nextTrackImg.src = background_image;    
            }
        	}).catch(err => console.error(err))
        }
        else{
            const background_image = meta.image_xlarge_url
            nextTrackImg.src = background_image;
        }

    // Wait until next track image is downloaded then update UI text and images
        nextTrackImg.onload = () => {
            back.style.backgroundImage = `url("${nextTrackImg.src}")`
            cover.style.backgroundImage = `url("${meta.image_xlarge_url}")`
            title.innerText = rawTitle || ""
            artist.innerText = artistName || ""
            if (album) {
                album.innerText = albumText || ""
            }
            if (durr) {
                durr.innerText = durationText || ""
            }
            // Reset Animation
             next_tit_art_inner.style.removeProperty('animation')
             second_span.innerText=""
             first_span.style.paddingRight = "0px"
        }  
        nextTrackImg.onerror = () => {
            // Placeholder
            console.log("Check your Internet!Unable to load Image")
            nextTrackImg.src = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCI+CiAgPHJlY3Qgc3R5bGU9ImZpbGw6I2ZmZmZmZiIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiB4PSIwIiB5PSIwIiAvPgogIDxwYXRoIGZpbGw9IiNCM0IzQjMiIGQ9Ik0yNi4yNSAxNi4xNjJMMjEuMDA1IDEzLjEzNEwyMS4wMTIgMjIuNTA2QzIwLjU5NCAyMi4xOTIgMjAuMDgxIDIxLjk5OSAxOS41MTkgMjEuOTk5QzE4LjE0MSAyMS45OTkgMTcuMDE5IDIzLjEyMSAxNy4wMTkgMjQuNDk5QzE3LjAxOSAyNS44NzggMTguMTQxIDI2Ljk5OSAxOS41MTkgMjYuOTk5QzIwLjg5NyAyNi45OTkgMjIuMDE5IDI1Ljg3OCAyMi4wMTkgMjQuNDk5QzIyLjAxOSAyNC40MjIgMjIuMDA2IDE0Ljg2NyAyMi4wMDYgMTQuODY3TDI1Ljc1IDE3LjAyOUwyNi4yNSAxNi4xNjJaTTE5LjUxOSAyNS45OThDMTguNjkyIDI1Ljk5OCAxOC4wMTkgMjUuMzI1IDE4LjAxOSAyNC40OThDMTguMDE5IDIzLjY3MSAxOC42OTIgMjIuOTk4IDE5LjUxOSAyMi45OThDMjAuMzQ2IDIyLjk5OCAyMS4wMTkgMjMuNjcxIDIxLjAxOSAyNC40OThDMjEuMDE5IDI1LjMyNSAyMC4zNDYgMjUuOTk4IDE5LjUxOSAyNS45OThaIi8+Cjwvc3ZnPgo="
        }
       
    }
    function updateUpNext(){
        up_next_text.innerText = "UP NEXT"
            var metadata = new Object();
            const queue_metadata = Spicetify.Queue.next_tracks[0]
            if(queue_metadata){
                metadata = queue_metadata.metadata
            } else{
                metadata["artist_name"] = ""
                metadata["title"] = ""
                metadata["image_xlarge_url"] = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCI+CiAgPHJlY3Qgc3R5bGU9ImZpbGw6I2ZmZmZmZiIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiB4PSIwIiB5PSIwIiAvPgogIDxwYXRoIGZpbGw9IiNCM0IzQjMiIGQ9Ik0yNi4yNSAxNi4xNjJMMjEuMDA1IDEzLjEzNEwyMS4wMTIgMjIuNTA2QzIwLjU5NCAyMi4xOTIgMjAuMDgxIDIxLjk5OSAxOS41MTkgMjEuOTk5QzE4LjE0MSAyMS45OTkgMTcuMDE5IDIzLjEyMSAxNy4wMTkgMjQuNDk5QzE3LjAxOSAyNS44NzggMTguMTQxIDI2Ljk5OSAxOS41MTkgMjYuOTk5QzIwLjg5NyAyNi45OTkgMjIuMDE5IDI1Ljg3OCAyMi4wMTkgMjQuNDk5QzIyLjAxOSAyNC40MjIgMjIuMDA2IDE0Ljg2NyAyMi4wMDYgMTQuODY3TDI1Ljc1IDE3LjAyOUwyNi4yNSAxNi4xNjJaTTE5LjUxOSAyNS45OThDMTguNjkyIDI1Ljk5OCAxOC4wMTkgMjUuMzI1IDE4LjAxOSAyNC40OThDMTguMDE5IDIzLjY3MSAxOC42OTIgMjIuOTk4IDE5LjUxOSAyMi45OThDMjAuMzQ2IDIyLjk5OCAyMS4wMTkgMjMuNjcxIDIxLjAxOSAyNC40OThDMjEuMDE5IDI1LjMyNSAyMC4zNDYgMjUuOTk4IDE5LjUxOSAyNS45OThaIi8+Cjwvc3ZnPgo="
            }
            const artistNameNext = Object.keys(metadata).filter(key => key.startsWith('artist_name')).sort().map(key => metadata[key]).join(', ')
            let next_artist
            if (artistNameNext!="") {
                next_artist = artistNameNext
            } else {
                next_artist = "Artist (Unavailable)"
            }
            first_span.innerText = metadata.title + "  •  " + next_artist
            second_span.innerText= metadata.title + "  •  " + next_artist
            
            const next_image =  metadata.image_xlarge_url
            if(next_image){
               nextCover.style.backgroundImage = `url("${next_image}")`
            } else{
                 if(metadata.image_url)
                    nextCover.style.backgroundImage = `url("${metadata.image_url}")`
                 else{
                    nextCover.style.backgroundImage = `url("${"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCI+CiAgPHJlY3Qgc3R5bGU9ImZpbGw6I2ZmZmZmZiIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiB4PSIwIiB5PSIwIiAvPgogIDxwYXRoIGZpbGw9IiNCM0IzQjMiIGQ9Ik0yNi4yNSAxNi4xNjJMMjEuMDA1IDEzLjEzNEwyMS4wMTIgMjIuNTA2QzIwLjU5NCAyMi4xOTIgMjAuMDgxIDIxLjk5OSAxOS41MTkgMjEuOTk5QzE4LjE0MSAyMS45OTkgMTcuMDE5IDIzLjEyMSAxNy4wMTkgMjQuNDk5QzE3LjAxOSAyNS44NzggMTguMTQxIDI2Ljk5OSAxOS41MTkgMjYuOTk5QzIwLjg5NyAyNi45OTkgMjIuMDE5IDI1Ljg3OCAyMi4wMTkgMjQuNDk5QzIyLjAxOSAyNC40MjIgMjIuMDA2IDE0Ljg2NyAyMi4wMDYgMTQuODY3TDI1Ljc1IDE3LjAyOUwyNi4yNSAxNi4xNjJaTTE5LjUxOSAyNS45OThDMTguNjkyIDI1Ljk5OCAxOC4wMTkgMjUuMzI1IDE4LjAxOSAyNC40OThDMTguMDE5IDIzLjY3MSAxOC42OTIgMjIuOTk4IDE5LjUxOSAyMi45OThDMjAuMzQ2IDIyLjk5OCAyMS4wMTkgMjMuNjcxIDIxLjAxOSAyNC40OThDMjEuMDE5IDI1LjMyNSAyMC4zNDYgMjUuOTk4IDE5LjUxOSAyNS45OThaIi8+Cjwvc3ZnPgo="}")`
                }
            }
        if((Spicetify.Player.data.duration-Spicetify.Player.getProgress()<=45000) && metadata.title){
            myUp.style.display = 'flex'
            if(second_span.offsetWidth>=307){
                first_span.style.paddingRight = "80px"
                anim_time= 5000*(first_span.offsetWidth/300)
                myUp.style.setProperty('--translate_width', `-${first_span.offsetWidth+3.5}px`);
                next_tit_art_inner.style.animation = `cssmarquee ${anim_time}ms linear 1000ms infinite`
             } 
             else{
                first_span.style.paddingRight = "0px"
                next_tit_art_inner.style.removeProperty('animation')
                second_span.innerText=""
                next_tit_art_inner.style.marginLeft = "0px"
           }
        } 
        else{
            first_span.style.paddingRight = "0px"
            next_tit_art_inner.style.removeProperty('animation')
            second_span.innerText=""
            next_tit_art_inner.style.marginLeft = "0px"
            myUp.style.display = 'none'
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
        updateInfo()
        Spicetify.Player.addEventListener("songchange", updateInfo)
        if(CONFIG.enableUpnext){
          Spicetify.Player.addEventListener("onprogress", updateUpNext)
        }
        back.classList.add("tvm-background-fade")	
        cover.classList.add("tvm-background-fade")
        if (CONFIG.enableProgress) {
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
            Spicetify.Keyboard.registerShortcut(
                {
                    key: Spicetify.Keyboard.KEYS["F11"], 
                    ctrl: false, 
                    shift: false, 
                    alt: false,
                }, 
                config_Full_toggle
            );
           Spicetify.Keyboard.registerShortcut(
                {
                    key: Spicetify.Keyboard.KEYS["ESCAPE"], 
                    ctrl: false, 
                    shift: false, 
                    alt: false,
                }, 
                deact
            );
    }

    function deactivate() { 
        Spicetify.Player.removeEventListener("songchange", updateInfo)
        if(CONFIG.enableUpnext){
            Spicetify.Player.removeEventListener("onprogress", updateUpNext)
        }
        if (CONFIG.enableProgress) {
            Spicetify.Player.removeEventListener("onprogress", updateProgress)
        }
        if (CONFIG.enableControl) {
            Spicetify.Player.removeEventListener("onplaypause", updateControl)
        }
        document.body.classList.remove(...classes)
        if (CONFIG.enableFullscreen) {
            FullScreenOff()
            full_screen_status=false;
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
    function deact() {
         if (document.body.classList.contains('tm-activated')) {
            full_screen_status=false;
            deactivate();
        }

    }
    function onOff() {
       if (document.body.classList.contains('tm-activated')) {
        full_screen_status=false;
        deactivate();
    } else {
        if (CONFIG.enableFullscreen) {
            full_screen_status=true;
        }
        activate();
    }

  }     
    function config_Full_toggle() {
        if(CONFIG.enableFullscreen){
            CONFIG.enableFullscreen= false;
            render()
            activate()
        }
        else{
            CONFIG.enableFullscreen= true;
            render()
            activate()
        }
    }
    function sleep (time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
  function toggleFullScreen() {
   	 if (!document.body.classList.contains('tm-activated')) {
        document.getElementById("ff-button").click();
    }
    else if(document.body.classList.contains('tm-activated'))
    {
    	document.getElementById("TV-button").click();
    	sleep(100).then(() => {
          document.getElementById("ff-button").click();
      });	
    }}

    function getConfig() {
        try {
            const parsed = JSON.parse(Spicetify.LocalStorage.get("tvMode-config"))
            if (parsed && typeof parsed === "object") {
                return parsed
            }
            throw ""
        } catch {
            Spicetify.LocalStorage.set("tvMode-config", "{}")
            return {}
        }
    }

    function saveConfig() {
        Spicetify.LocalStorage.set("tvMode-config", JSON.stringify(CONFIG))
    }
    document.body.append(style, container)

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
            if (document.body.classList.contains('tm-activated')) {
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
                newMenuItem("Enable progress bar", "enableProgress"),
                newMenuItem("Enable controls", "enableControl"),
                newMenuItem("Trim title", "trimTitle"),
                newMenuItem("Show album", "showAlbum"),
                newMenuItem("Show all artists", "showAllArtists"),
                newMenuItem("Show icons", "icons"),
                newMenuItem("Vertical mode", "vertical"),
                newMenuItem("Enable fullscreen", "enableFullscreen"),
                newMenuItem("Enable Upnext Display", "enableUpnext"),
            )
        }
        Spicetify.PopupModal.display({
            title: "TV Mode Display",
            content: configContainer,
        })
    }

    // Add activator on top bar
    const button = document.createElement("button")
    button.classList.add("button", "spoticon-device-tv-16", "tm-button", "full-button","main-topBar-button","InvalidDropTarget")
    button.setAttribute("data-tooltip", "TV Mode")
    button.id = "TV-button"

    button.setAttribute("title", "TV Mode Display")
    

    container.ondblclick = deact
    container.oncontextmenu = openConfig

    button.onclick = onOff

    topBar.append(button)
    button.oncontextmenu = openConfig;

    // Add activator on top bar
    // new Spicetify.Topbar.Button(
    //     "TV Mode",
    //     `<svg role="img" height="16" width="16" viewBox="0 0 32 32" fill="currentColor"><path d="M8.645 22.648l-5.804 5.804.707.707 5.804-5.804 2.647 2.646v-6h-6l2.646 2.647zM29.157 3.55l-.707-.707-5.804 5.805L20 6.001v6h6l-2.646-2.647 5.803-5.804z"></path></svg>`,
    //     onOff,
    // );

    // Spicetify.Keyboard.registerShortcut(
    //             {
    //                 key: Spicetify.Keyboard.KEYS["F11"], 
    //                 ctrl: false, 
    //                 shift: false, 
    //                 alt: false,
    //             }, 
    //             config_Full_toggle
    //         );
    // Spicetify.Keyboard.registerShortcut(
    //             {
    //                 key: Spicetify.Keyboard.KEYS["ESCAPE"], 
    //                 ctrl: false, 
    //                 shift: false, 
    //                 alt: false,
    //             }, 
    //             deact
    //         );

    render()
})()



//     newMenuItem("Enable progress bar", "enableProgress")
//     newMenuItem("Enable controls", "enableControl")
//     newMenuItem("Trim title", "trimTitle")
//     newMenuItem("Show album", "showAlbum")
//     newMenuItem("Show all artists", "showAllArtists")
//     newMenuItem("Show icons", "icons")
//     newMenuItem("Vertical mode", "vertical")
//     newMenuItem("Enable fullscreen", "enableFullscreen")
//     new Spicetify.ContextMenu.Item("Full Screen Mode", toggleFullScreen, checkURI).register()
//     new Spicetify.ContextMenu.Item("Exit", deact, checkURI).register()

