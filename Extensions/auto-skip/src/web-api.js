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
        await Spicetify.CosmosAsync.put("sp://player/v2/main/queue", {
            queue_revision: Spicetify.Queue?.queueRevision,
            next_tracks: [
                {
                    uri: uri,
                    provider: "queue",
                    metadata: {
                        is_queued: true,
                    },
                },
                ...Spicetify.Queue?.nextTracks.map((track) => ({
                    uri: track.contextTrack.uri,
                    provider: track.provider,
                    metadata: {
                        is_queued: track.provider === "queue",
                    },
                })),
            ],
            prev_tracks: Spicetify.Queue?.prevTracks,
        });
    }
}
