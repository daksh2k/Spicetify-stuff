import { Cache, Colors } from "../types/fullscreen";

const colorsCache: Cache[] = [];

class WebAPI {
    static async getTrackInfo(id: string) {
        return await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${id}`);
    }

    static async getAlbumInfo(id: string) {
        return await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/albums/${id}`);
    }

    static async getPlaylistInfo(uri: string) {
        return await Spicetify.CosmosAsync.get(`sp://core-playlist/v1/playlist/${uri}`);
    }

    static async getArtistInfo(id: string) {
        const queryArtistOverview = {
			name: "queryArtistOverview",
			operation: "query",
			sha256Hash: "35648a112beb1794e39ab931365f6ae4a8d45e65396d641eeda94e4003d41497",
			value: null
		};

        const overview = await Spicetify.GraphQL.Request(queryArtistOverview, {
			uri: id,
			locale: Spicetify.Locale.getLocale(),
			includePrerelease: false
		});
        return overview?.data?.artistUnion;
    }

    static async searchArt(name: string) {
        return Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/search?q="${name}"&type=artist&limit=2`);
    }

    static async colorExtractor(uri: string) {
        const presentInCache = colorsCache.filter((obj) => obj.uri === uri);
        if (presentInCache.length > 0) return presentInCache[0].colors;
        const body = await Spicetify.CosmosAsync.get(
            `https://spclient.wg.spotify.com/colorextractor/v1/extract-presets?uri=${uri}&format=json`,
        );
        if (body.entries && body.entries.length) {
            const list: Colors = {};
            for (const color of body.entries[0].color_swatches) {
                list[color.preset] = `#${color.color.toString(16).padStart(6, "0")}`;
            }
            if (colorsCache.length > 20) colorsCache.shift();
            colorsCache.push({ uri, colors: list });
            return list;
        }
        throw "No colors returned.";
    }
}

export default WebAPI;
