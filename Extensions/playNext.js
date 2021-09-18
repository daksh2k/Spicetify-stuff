// @ts-check
// NAME: Play Next
// AUTHOR: dax
// VERSION: 1.0
// DESCRIPTION: Add the current track to the top of the queue

/// <reference path="../spicetify-cli/globals.d.ts" />
(function playNext(){    
    if (!(Spicetify.CosmosAsync && Spicetify.Queue && Spicetify.ContextMenu && Spicetify.URI)){
        setTimeout(playNext, 200);
        return;
    }

    // Only add context menu option to tracks
    function uriTrack(uris){
    	if (uris.length > 1) {
            return false;
        }
        const uri = uris[0];
        const uriObj = Spicetify.URI.fromString(uri);
        if (uriObj.type === Spicetify.URI.Type.TRACK) 
            return true;
        return false;
    }

    // Add the selected track to the top of the queue and update the queue
    async function addToNext(uri){
    	const newTrack = {
            	uri: uri[0],
            	provider: "queue",
                metadata: {
                    is_queued: true, 
                }
           }
        const currentQueue =  Spicetify.Queue?.next_tracks
        currentQueue.unshift(newTrack)
        await Spicetify.CosmosAsync.put("sp://player/v2/main/queue", {
              revision: Spicetify.Queue?.revision,
              next_tracks: currentQueue,
              prev_tracks: Spicetify.Queue?.prev_tracks
              }).catch( (err) => {
            	console.error("Failed to add to queue",err);
        	    Spicetify.showNotification("Unable to Add");
        	})
        	Spicetify.showNotification("Added to Play Next");
    }

    // Add option to Context Menu
    new Spicetify.ContextMenu.Item(
        "Play Next",
        addToNext,
        uriTrack,
        `<svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3.67 8.67h14V11h-14V8.67zm0-4.67h14v2.33h-14V4zm0 9.33H13v2.34H3.67v-2.34zm11.66 0v7l5.84-3.5-5.84-3.5z"></path></svg>`
    ).register();
})();