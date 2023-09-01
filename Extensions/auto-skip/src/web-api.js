export class WebApi {
    /**
     * Get access token for making requests to Spotify API
     * @returns
     */
    static getToken() {
        return Spicetify.Platform.AuthorizationAPI._tokenProvider({
            preferCached: true,
        }).then((res) => res.accessToken);
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
        const currentQueueLength = (Spicetify.Queue.nextTracks || []).filter(
            (track) => track.provider !== "context"
        ).length;

        await Spicetify.addToQueue([uri].map((uri) => ({ uri }))).catch((err) => {
            console.error("Failed to add to queue", err);
        });

        const newTracks = Spicetify.Queue.nextTracks
            .filter((track) => track.provider !== "context")
            .filter((_, index) => index >= currentQueueLength);

        if (currentQueueLength) {
            await Spicetify.Platform.PlayerAPI.reorderQueue(
                newTracks.map((track) => track.contextTrack),
                { before: Spicetify.Queue.nextTracks[0].contextTrack }
            );
        }
    }
}
