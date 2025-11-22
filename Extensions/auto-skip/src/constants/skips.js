import { getTrimmedTitle, addOriginalSongToQueue } from "../utils/utils";

const SKIPS = {
    skipAcoustic: {
        menuTitle: "Acoustic Songs",
        check: (meta) => {
            return (
                ["acoustic", "stripped", "unplugged"].some((value) =>
                    meta.name.toLowerCase().includes(value),
                ) || meta?.features?.acousticness > 0.85
            );
        },
        callback: async (meta) => {
            await addOriginalSongToQueue(
                `${getTrimmedTitle(meta.name)} ${meta.artists.map((artist) => "artist:" + artist.name).join(" ")}`,
            );
        },
    },
    skipAcapella: {
        menuTitle: "Acapella Songs",
        check: (meta) => {
            return (
                ["acapella", "a cappella", "a-cappella"].some((value) =>
                    meta.name.toLowerCase().includes(value),
                ) || meta?.features?.acousticness > 0.9
            );
        },
        callback: async (meta) => {
            await addOriginalSongToQueue(
                `${getTrimmedTitle(meta.name)} ${meta.artists.map((artist) => "artist:" + artist.name).join(" ")}`,
            );
        },
    },
    skipCover: {
        menuTitle: "Cover Songs",
        check: (meta) => {
            return ["- cover"].some((value) => meta.name.toLowerCase().includes(value));
        },
        callback: async (meta) => {
            return await addOriginalSongToQueue(
                `${getTrimmedTitle(meta.name)} ${meta.artists.map((artist) => "artist:" + artist.name).join(" ")}`,
            );
        },
    },
    skipInstrumental: {
        menuTitle: "Instrumental Songs",
        check: (meta) => {
            return (
                meta.name.toLowerCase().includes("instrumental") ||
                meta?.features?.instrumentalness > 0.4
            );
        },
        callback: async (meta) => {
            return await addOriginalSongToQueue(
                `${getTrimmedTitle(meta.name)} ${meta.artists.map((artist) => "artist:" + artist.name).join(" ")}`,
            );
        },
    },
    skipRemix: {
        menuTitle: "Remix Songs",
        check: (meta) => meta.name.toLowerCase().includes("remix"),
        callback: async (meta) => {
            return await addOriginalSongToQueue(
                `${getTrimmedTitle(meta.name)} artist:${meta.artists[0].name}`,
            );
        },
    },
    skipLive: {
        menuTitle: "Live Songs",
        check: (meta) => {
            return (
                ["- live", "live version", "(live)"].some((value) =>
                    meta.name.toLowerCase().includes(value),
                ) || meta?.features?.liveness > 0.8
            );
        },
        callback: async (meta) => {
            return await addOriginalSongToQueue(
                `${getTrimmedTitle(meta.name)} ${meta.artists.map((artist) => "artist:" + artist.name).join(" ")}`,
            );
        },
    },
    skipSpedUp: {
        menuTitle: "Sped Up Songs",
        check: (meta) => {
            return ["sped up", "speed up"].some((value) => meta.name.toLowerCase().includes(value));
        },
        callback: async (meta) => {
            return await addOriginalSongToQueue(
                `${getTrimmedTitle(meta.name)} ${meta.artists.map((artist) => "artist:" + artist.name).join(" ")}`,
            );
        },
    },
    skipSlowedDown: {
        menuTitle: "Slowed Down Songs",
        check: (meta) => {
            return ["slowed"].some((value) => meta.name.toLowerCase().includes(value));
        },
        callback: async (meta) => {
            return await addOriginalSongToQueue(
                `${getTrimmedTitle(meta.name)} ${meta.artists.map((artist) => "artist:" + artist.name).join(" ")}`,
            );
        },
    },
    skipRadio: {
        menuTitle: "Radio/Censored songs",
        check: (meta) => meta.name.toLowerCase().includes("radio edit"),
        callback: async (meta) => {
            return await addOriginalSongToQueue(
                `${getTrimmedTitle(meta.name)} ${meta.artists.map((artist) => "artist:" + artist.name).join(" ")}`,
            );
        },
    },
    skipExplicit: {
        menuTitle: "Explicit Songs",
        check: (meta) => meta?.explicit === true,
        callback: async (meta) => {
            return await addOriginalSongToQueue(
                `${getTrimmedTitle(meta.name)} ${meta.artists.map((artist) => "artist:" + artist.name).join(" ")}`,
            );
        },
    },
    skipChristmas: {
        menuTitle: "Christmas Songs",
        check: (meta) =>
            ["xmas", "christmas", "jingle", "mistletoe", "merry", "santa", "feliz", "navidad"].some(
                (value) => meta.name.toLowerCase().includes(value),
            ),
    },
    skipLiked: {
        menuTitle: "Liked Songs",
        check: (apiMeta, localMeta) => {
            if (localMeta !== null) {
                return localMeta.metadata["collection.in_collection"] === "true";
            }
            return false;
        },
    },
    skipNotLiked: {
        menuTitle: "Not Liked Songs",
        check: (apiMeta, localMeta) => {
            if (localMeta !== null) {
                return localMeta.metadata["collection.in_collection"] !== "true";
            }
            return false;
        },
    },
};

export default SKIPS;
