// @ts-check

// NAME: Save Playlists
// AUTHOR: daksh2k
// DESCRIPTION: Save any playlist by right click > Save Playlist

/// <reference path="../shared/types/spicetify.d.ts" />

(function savePlaylists() {
    if (!(Spicetify.CosmosAsync && Spicetify.ContextMenu)) {
        setTimeout(savePlaylists, 200);
        return;
    }

    const LOCALE = "en-IN"; //Set your own locale to change format of date `language-Country`
    const OPTIONS = { day: "numeric", month: "short", year: "numeric" }; // Set the date format to save in title

    // Add option to Context Menu
    new Spicetify.ContextMenu.Item(
        "Save Playlist",
        fetchAndCreate,
        uriPlaylist,
        `<svg role="img" height="16" width="16" viewBox="0 0 512 512" fill="currentColor"><path d="M8 224h272a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H8a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8zm152 104a8 8 0 0 0-8-8H8a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h144a8 8 0 0 0 8-8zM8 96h272a8 8 0 0 0 8-8V72a8 8 0 0 0-8-8H8a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8zM470 1.64l-96.59 31.88C360.72 37.74 352 50 352 64v312.13C331.66 361.28 303.38 352 272 352c-61.86 0-112 35.82-112 80s50.14 80 112 80 112-35.82 112-80V192l106.12-35.37A32 32 0 0 0 512 126.27V32a32 32 0 0 0-42-30.36zM272 480c-47.14 0-80-25.3-80-48s32.86-48 80-48 80 25.3 80 48-32.86 48-80 48zm208-353.72l-96 32V64h-.56v-.13L480 32z"></path></svg>`,
    ).register();

    /**
     * Get the current Spotify access token
     */
    function getAccessToken() {
        return Spicetify.Platform.AuthorizationAPI._tokenProvider._token.accessToken;
    }

    /**
     * Decode HTML entities in a string (e.g. &#x2F; → /)
     */
    function decodeHtml(str) {
        const txt = document.createElement("textarea");
        txt.innerHTML = str;
        return txt.value;
    }

    /**
     * Convert image from a URL to base64 format
     * @param src The src URL of the image to encode to base64
     * @param outputFormat The output format of the image as supported by Canvas API
     */
    function encodeImgFromUrl(src, outputFormat = "image/jpeg") {
        return new Promise((resolve, reject) => {
            let image = new Image();
            image.crossOrigin = "Anonymous";
            image.onload = function () {
                let canvas = document.createElement("canvas");
                let ctx = canvas.getContext("2d");
                let dataURL;
                // @ts-ignore
                canvas.height = this.naturalHeight;
                // @ts-ignore
                canvas.width = this.naturalWidth;
                // @ts-ignore
                ctx?.drawImage(this, 0, 0);
                dataURL = canvas.toDataURL(outputFormat);
                resolve(dataURL);
            };
            image.onerror = (err) => {
                reject(new Error("Failed to load image." + err));
            };
            image.src = src;
        });
    }

    /**
     * Update the image of the new playlist created with the original playlist.
     * @param encodedImg base64 encoded jpeg image
     * @param playlistId the id of the newly created playlist
     */
    async function updatePlaylistImage(encodedImg, playlistId) {
        const URL = `https://api.spotify.com/v1/playlists/${playlistId}/images`;

        await fetch(URL, {
            method: "PUT",
            body: encodedImg,
            headers: {
                Authorization: "Bearer " + getAccessToken(),
                Accept: "application/json",
                "Content-Type": "image/jpeg",
            },
        });
    }

    // Only add context menu option to Playlists
    function uriPlaylist(uris) {
        if (uris.length > 1) {
            return false;
        }
        const uri = uris[0];
        const uriObj = Spicetify.URI.fromString(uri);
        return (
            uriObj.type === Spicetify.URI.Type.PLAYLIST ||
            uriObj.type === Spicetify.URI.Type.PLAYLIST_V2
        );
    }

    function fetchAndCreate(uris) {
        fetchPlaylist(uris[0])
            .then((meta) => {
                createPlaylist(meta).catch((err) => {
                    Spicetify.showNotification("Error in Creating! Check Console.", true);
                    console.error("Creation Error: ", err);
                });
            })
            .catch((err) => {
                Spicetify.showNotification("Error in Fetching! Check Console.", true);
                console.error("Fetching Error: ", err);
            });
    }

    /**
     * Fetch playlist metadata and all track URIs using Spicetify's internal
     * Platform API. This never hits the public Spotify Web API so it is not
     * subject to 429 rate limiting.
     * Falls back to CosmosAsync sp:// if PlaylistAPI is unavailable.
     */
    async function fetchPlaylist(uri) {
        Spicetify.showNotification("Fetching Playlist....");

        // ── Preferred: Platform.PlaylistAPI (Spicetify ≥ 2.x) ──────────────
        if (Spicetify.Platform?.PlaylistAPI) {
            const [meta, contents] = await Promise.all([
                Spicetify.Platform.PlaylistAPI.getMetadata(uri),
                fetchAllContents(uri),
            ]);

            console.log("[SavePlaylist] meta:", meta, "contents sample:", contents[0]);

            return {
                uris: contents
                    .filter((item) => item?.type !== "local" && item?.uri)
                    .map((item) => item.uri),
                data: {
                    name: meta.name,
                    owner: { name: meta.owner?.name ?? "Unknown" },
                    description: meta.description ?? "",
                    picture: meta.images?.[0]?.url ?? "",
                    lastModification: null,
                },
            };
        }

        // ── Fallback: original sp:// Cosmos endpoint ─────────────────────────
        const playlistMeta = await Spicetify.CosmosAsync.get(
            `sp://core-playlist/v1/playlist/${uri}`,
        );
        return {
            uris: playlistMeta.items.map((track) => track.link),
            data: playlistMeta.playlist,
        };
    }

    /**
     * Page through PlaylistAPI.getContents until all tracks are collected.
     * The API returns at most 100 items per call.
     */
    async function fetchAllContents(uri) {
        const PAGE = 100;
        let offset = 0;
        const all = [];

        while (true) {
            const page = await Spicetify.Platform.PlaylistAPI.getContents(uri, {
                limit: PAGE,
                offset,
            });
            const items = page?.items ?? [];
            all.push(...items);
            if (items.length < PAGE) break;  // last page
            offset += PAGE;
        }
        return all;
    }

    // Create a new playlist and populate it with tracks
    async function createPlaylist(meta) {
        Spicetify.showNotification("Creating new Playlist....");
        let playlistDate = meta.data.lastModification
            ? new Date(meta.data.lastModification * 1000)
            : new Date();

        // @ts-ignore
        const playlistDateFormatted = playlistDate
            .toLocaleDateString(LOCALE, OPTIONS)
            .replaceAll(" ", "-");
        const playlistName = `${meta.data.name} (${playlistDateFormatted})`;

        // ── Create empty playlist ────────────────────────────────────────────
        let newPlaylistUri;
        if (Spicetify.Platform?.RootlistAPI) {
            const result = await Spicetify.Platform.RootlistAPI.createPlaylist(
                playlistName,
                { after: "end" },
            );
            console.log("[SavePlaylist] createPlaylist result:", result);
            // result may be a URI string or an object with a uri property
            newPlaylistUri = typeof result === "string" ? result : result?.uri ?? result;
        } else {
            // Legacy fallback
            const legacy = await Spicetify.CosmosAsync.post("sp://core-playlist/v1/rootlist", {
                operation: "create",
                name: playlistName,
                playlist: true,
                public: false,
                uris: [],
            });
            newPlaylistUri = legacy.uri;
        }

        if (!newPlaylistUri) throw new Error("Failed to get URI for new playlist");
        const newPlaylistId = newPlaylistUri.split(":")[2];
        Spicetify.showNotification(`${playlistName} created, adding tracks...`);

        // ── Add tracks in chunks of 100 (API/Platform limit per call) ────────
        const CHUNK = 100;
        for (let i = 0; i < meta.uris.length; i += CHUNK) {
            const chunk = meta.uris.slice(i, i + CHUNK);
            if (Spicetify.Platform?.PlaylistAPI) {
                await Spicetify.Platform.PlaylistAPI.add(newPlaylistUri, chunk, { after: "end" });
            } else {
                await Spicetify.CosmosAsync.post(
                    `https://api.spotify.com/v1/playlists/${newPlaylistId}/tracks`,
                    { uris: chunk },
                );
            }
        }
        Spicetify.showNotification(`${playlistName} created successfully!`);

        // ── Update description and image (one-off Web API calls, not bulk) ───
        setTimeout(() => {
            if (meta.data.description) {
                Spicetify.Platform.PlaylistAPI.setAttributes(newPlaylistUri, {
                    name: playlistName,
                    description: decodeHtml(meta.data.description),
                })
                .then(() => Spicetify.showNotification("Description updated successfully!"))
                .catch((err) => console.error("Description Update Error:", err));
            }

            if (/^spotify:image:\w{40}$|^https:\/\/.*$/.test(meta.data.picture)) {
                const imageUrl = meta.data.picture.startsWith("https://")
                    ? meta.data.picture
                    : "https://i.scdn.co/image/" + meta.data.picture.split(":")[2];
                encodeImgFromUrl(imageUrl)
                    .then((encodedImg) => {
                        updatePlaylistImage(encodedImg.split("base64,")[1], newPlaylistId)
                            .then(() => Spicetify.showNotification("Image updated successfully!"))
                            .catch((err) => console.error("Image Update Error: ", err));
                    })
                    .catch((err) => console.error("Image conversion: ", err));
            }
        }, 1200);
    }
})();
