import { getTrimmedTitle, addOriginalSongToQueue } from "../utils/utils";

const SKIPS = {
    skipAcoustic: {
        menuTitle: "Acoustic Songs",
        check: (meta) => {
            return (
                ["acoustic", "stripped", "unplugged"].some((value) => meta.name.toLowerCase().includes(value)) ||
                meta?.features?.acousticness > 0.85
            );
        },
        callback: async (meta) => {
            await addOriginalSongToQueue(`${getTrimmedTitle(meta.name)} artist:${meta.artists[0].name}`);
        },
    },
    skipInstrumental: {
        menuTitle: "Instrumental Songs",
        check: (meta) => {
            return meta.name.toLowerCase().includes("instrumental") || meta?.features?.instrumentalness > 0.4;
        },
    },
    skipRemix: {
        menuTitle: "Remix Songs",
        check: (meta) => meta.name.toLowerCase().includes("remix"),
        callback: async (meta) => {
            return await addOriginalSongToQueue(`${getTrimmedTitle(meta.name)} artist:${meta.artists[0].name}`);
        },
    },
    skipLive: {
        menuTitle: "Live Songs",
        check: (meta) => {
            return (
                ["- live", "live version", "(live)"].some((value) => meta.name.toLowerCase().includes(value)) ||
                meta?.features?.liveness > 0.8
            );
        },
        callback: async (meta) => {
            return await addOriginalSongToQueue(`${getTrimmedTitle(meta.name)} artist:${meta.artists[0].name}`);
        },
    },
    skipRadio: {
        menuTitle: "Radio/Censored songs",
        check: (meta) => meta.name.toLowerCase().includes("radio edit"),
        callback: async (meta) => {
            return await addOriginalSongToQueue(`${getTrimmedTitle(meta.name)} artist:${meta.artists[0].name}`);
        },
    },
    skipExplicit: {
        menuTitle: "Explicit Songs",
        check: (meta) => meta?.explicit === true,
        callback: async (meta) => {
            return await addOriginalSongToQueue(`${getTrimmedTitle(meta.name)} artist:${meta.artists[0].name}`);
        },
    },
    skipChristmas: {
        menuTitle: "Christmas Songs",
        check: (meta) =>
            ["xmas", "christmas", "jingle", "mistletoe", "merry", "santa", "feliz", "navidad"].some((value) =>
                meta.name.toLowerCase().includes(value)
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
