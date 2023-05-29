import { Cache, Colors, TokenType } from "../types/fullscreen";

const colorsCache: Cache[] = [];

class WebAPI {
    static getToken() {
        return Spicetify.Platform.AuthorizationAPI._tokenProvider({
            preferCached: true,
        }).then((res: TokenType) => res.accessToken);
    }

    static async getTrackInfo(id: string) {
        return fetch(`https://api.spotify.com/v1/tracks/${id}`, {
            headers: {
                Authorization: `Bearer ${await WebAPI.getToken()}`,
            },
        }).then((res) => res.json());
    }

    static async getAlbumInfo(id: string) {
        return fetch(`https://api.spotify.com/v1/albums/${id}`, {
            headers: {
                Authorization: `Bearer ${await WebAPI.getToken()}`,
            },
        }).then((res) => res.json());
    }

    static async getPlaylistInfo(uri: string) {
        return Spicetify.CosmosAsync.get(`sp://core-playlist/v1/playlist/${uri}`);
    }

    static async getArtistInfo(id: string) {
        return fetch(
            `https://api-partner.spotify.com/pathfinder/v1/query?operationName=queryArtistOverview&variables=%7B%22uri%22%3A%22spotify%3Aartist%3A${id}%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22d66221ea13998b2f81883c5187d174c8646e4041d67f5b1e103bc262d447e3a0%22%7D%7D`,
            {
                headers: {
                    Authorization: `Bearer ${await WebAPI.getToken()}`,
                },
            }
        )
            .then((res) => res.json())
            .then((res) => res.data.artist);
    }

    static async searchArt(name: string) {
        return fetch(`https://api.spotify.com/v1/search?q="${name}"&type=artist&limit=2`, {
            headers: {
                Authorization: `Bearer ${await WebAPI.getToken()}`,
            },
        }).then((res) => res.json());
    }

    static async colorExtractor(uri: string) {
        const presentInCache = colorsCache.filter((obj) => obj.uri === uri);
        if (presentInCache.length > 0) return presentInCache[0].colors;
        const body = await Spicetify.CosmosAsync.get(
            `wg://colorextractor/v1/extract-presets?uri=${uri}&format=json`
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
