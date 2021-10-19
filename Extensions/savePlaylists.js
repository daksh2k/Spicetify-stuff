// NAME: Save Playlists
// AUTHOR: daksh2k
// VERSION 1.0
// DESCRIPTION: Save any playlist by right click > Save Playlist

(function savePlaylists() {
    if (!(Spicetify.CosmosAsync && Spicetify.ContextMenu)){
        setTimeout(savePlaylists, 200);
        return;
    }

    const LOCALE = "en-IN"  //Set your own locale to change format of date `language-Country`
    const OPTIONS  = {day: 'numeric', month: 'short', year: 'numeric'}  // Set the date format to save in title

    // Add option to Context Menu
    new Spicetify.ContextMenu.Item(
        "Save Playlist",
        fetchAndCreate,
        uriPlaylist,
        `<svg role="img" height="16" width="16" viewBox="0 0 512 512" fill="currentColor"><path d="M8 224h272a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H8a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8zm152 104a8 8 0 0 0-8-8H8a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h144a8 8 0 0 0 8-8zM8 96h272a8 8 0 0 0 8-8V72a8 8 0 0 0-8-8H8a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8zM470 1.64l-96.59 31.88C360.72 37.74 352 50 352 64v312.13C331.66 361.28 303.38 352 272 352c-61.86 0-112 35.82-112 80s50.14 80 112 80 112-35.82 112-80V192l106.12-35.37A32 32 0 0 0 512 126.27V32a32 32 0 0 0-42-30.36zM272 480c-47.14 0-80-25.3-80-48s32.86-48 80-48 80 25.3 80 48-32.86 48-80 48zm208-353.72l-96 32V64h-.56v-.13L480 32z"></path></svg>`
    ).register();

    // Only add context menu option to Playlists 
    function uriPlaylist(uris){
        if (uris.length > 1) {
            return false;
        }
        const uri = uris[0];
        const uriObj = Spicetify.URI.fromString(uri);
        if (uriObj.type === Spicetify.URI.Type.PLAYLIST || uriObj.type === Spicetify.URI.Type.PLAYLIST_V2) 
            return true;
        return false;
    }

    function fetchAndCreate(uris) {
        fetchPlaylist(uris[0])
            .then( (meta) => {
                createPlaylist(meta)
                .catch((err) => {
                    Spicetify.showNotification("Error in Creating! Check Console.")
                    console.error("Creation Error: ",err)
                });
            })
            .catch((err) => {
                Spicetify.showNotification("Error in Fetching! Check Console.")
                console.error("Fetching Error: ",err)
            });
    }

    // Fetch the required metadata and tracks of the playlist
    async function fetchPlaylist(uri) {
        Spicetify.showNotification("Fetching Playlist....")
        const playlistMeta = await Spicetify.CosmosAsync.get(
            `sp://core-playlist/v1/playlist/${uri}`
        );
        return {uris: playlistMeta.items.map( (track)=>track.link ),
                data: playlistMeta.playlist }
    }

    // Create a new playlist
    async function createPlaylist(meta){
        Spicetify.showNotification("Creating new Playlist....")
        let playlistDate = meta.data.lastModification ? new Date(meta.data.lastModification*1000) :  new Date()
        const playlistDateFormatted = playlistDate.toLocaleDateString(LOCALE,OPTIONS).replaceAll(" ","-")
        const playlistName = `${meta.data.name} (${playlistDateFormatted})`

        const newPlaylist =  await Spicetify.CosmosAsync.post("sp://core-playlist/v1/rootlist", {
            operation: 'create',
            name: playlistName,
            playlist: true,
            public: false,
            uris: meta.uris,
        })
        Spicetify.showNotification(`${playlistName} created successfully!`)
        
        setTimeout(() => {
             Spicetify.CosmosAsync.put(`https://api.spotify.com/v1/playlists/${newPlaylist.uri.split(':')[2]}`, {
                description: `Copy of ${meta.data.name} by ${meta.data.owner.name}. ${meta.data.description}`
        }).then( () => Spicetify.showNotification("Description updated successfully!")  )   
        },1000)

    }     
})();