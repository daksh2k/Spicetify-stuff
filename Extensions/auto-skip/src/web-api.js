export class WebApi {
    /**
     * Get track metadata from Spotify web API
     * @param {string} id
     * @returns
     */
    static async getTrackDetails(id) {
        return await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${id}`);
    }
    /**
     * Get audio features of the track from Spotify web API
     * @param {string} query
     * @returns
     */
    static async getTrackFeatures(query) {
        return await Spicetify.CosmosAsync.get(
            `https://api.spotify.com/v1/audio-features/${query}`,
        );
    }

    /**
     * Search spotify and return the results.
     * @param {string} query
     * @param {string} type
     * @returns
     */
    static async searchSpotify(query, type = "track") {
        return await Spicetify.CosmosAsync.get(
            `https://api.spotify.com/v1/search?q=${query}&type=${type}&limit=15`,
        );
    }

    /**
     * Add the track to the top of the queue
     * @param {string} uri
     */
    static async addTrackToQueue(uri) {
        const uriObjects = [uri].map((uri) => ({ uri }));

        const queue = await Spicetify.Platform.PlayerAPI.getQueue();
        if (queue.queued.length > 0) {
            //Not empty, add all the tracks before first track
            const beforeTrack = {
                uri: queue.queued[0].uri,
                uid: queue.queued[0].uid,
            };
            await Spicetify.Platform.PlayerAPI.insertIntoQueue(uriObjects, {
                before: beforeTrack,
            }).catch((err) => {
                console.error("Failed to add to queue", err);
            });
        } else {
            //if queue is empty, simply add to queue
            await Spicetify.addToQueue(uriObjects).catch((err) => {
                console.error("Failed to add to queue", err);
            });
        }
    }
}
