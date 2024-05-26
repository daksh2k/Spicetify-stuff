export class WebApi {
    /**
     * Get access token for making requests to Spotify API
     * @returns
     */
    static getToken() {
        // return Spicetify.Platform.AuthorizationAPI._tokenProvider({
        //     preferCached: true,
        // }).then((res) => res.accessToken);
        return Spicetify.Platform.AuthorizationAPI._tokenProvider._token.accessToken;
    }
    /**
     * Get track metadata from Spotify web API
     * @param {string} id
     * @returns
     */
    static async getTrackDetails(id) {
        return fetch(`https://api.spotify.com/v1/tracks/${id}`, {
            headers: {
                Authorization: `Bearer ${await WebApi.getToken()}`,
            },
        }).then((res) => res.json());
    }
    /**
     * Get audio features of the track from Spotify web API
     * @param {string} query
     * @returns
     */
    static async getTrackFeatures(query) {
        return fetch(`https://api.spotify.com/v1/audio-features/${query}`, {
            headers: {
                Authorization: `Bearer ${await WebApi.getToken()}`,
            },
        }).then((res) => res.json());
    }

    /**
     * Search spotify and return the results.
     * @param {string} query
     * @param {string} type
     * @returns
     */
    static async searchSpotify(query, type = "track") {
        return fetch(`https://api.spotify.com/v1/search?q=${query}&type=${type}&limit=15`, {
            headers: {
                Authorization: `Bearer ${await WebApi.getToken()}`,
            },
        }).then((res) => res.json());
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
