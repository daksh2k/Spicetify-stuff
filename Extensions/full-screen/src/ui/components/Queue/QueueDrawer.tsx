import * as React from "react";
import "./styles.scss";
import ICONS from "../../../constants";

interface QueueDrawerProps {
    onClose: () => void;
}

interface TrackInfo {
    uri: string;
    uid: string;
    title: string;
    artist: string;
    album: string;
    artwork: string;
    duration: string;
    isQueued: boolean;
}

function parseQueueItem(item: any, isQueuedDefault = false): TrackInfo {
    if (!item) {
        return {
            uri: "",
            uid: Math.random().toString(),
            title: "Unknown Track",
            artist: "Unknown Artist",
            album: "",
            artwork: "",
            duration: "",
            isQueued: false,
        };
    }

    const meta =
        (item?.contextTrack?.metadata && typeof item.contextTrack.metadata === "object"
            ? item.contextTrack.metadata
            : null) ||
        (item?.metadata && typeof item.metadata === "object" ? item.metadata : null) ||
        {};

    const uri = item?.uri || item?.contextTrack?.uri || "";
    const uid = item?.uid || item?.contextTrack?.uid || uri || Math.random().toString();
    const title = meta.title || item?.name || "Unknown Track";

    let artist = "";
    if (meta && typeof meta === "object") {
        const artistKeys = Object.keys(meta).filter((k) => k.startsWith("artist_name")).sort();
        if (artistKeys.length > 0) {
            artist = artistKeys.map((k) => meta[k]).join(", ");
        } else if (meta.artist_name) {
            artist = meta.artist_name;
        }
    }
    if (!artist && item?.artists && Array.isArray(item.artists)) {
        artist = item.artists.map((a: any) => a?.name || "").filter(Boolean).join(", ");
    }
    if (!artist) artist = "Unknown Artist";

    const album = meta.album_title || item?.album?.name || "";

    let artwork = meta.image_xlarge_url || meta.image_large_url || meta.image_url || "";
    if (typeof artwork === "string" && artwork.startsWith("spotify:image:")) {
        artwork = "https://i.scdn.co/image/" + artwork.replace("spotify:image:", "");
    }
    if (!artwork && meta.image_small_url) {
        artwork = meta.image_small_url;
    }

    const durationMs = meta.duration
        ? Number(meta.duration)
        : item?.duration
        ? Number(item.duration)
        : 0;
    let duration = "";
    if (durationMs > 0 && !isNaN(durationMs)) {
        try {
            if (Spicetify.Player?.formatTime) {
                duration = Spicetify.Player.formatTime(durationMs);
            } else {
                const s = Math.floor(durationMs / 1000);
                const m = Math.floor(s / 60);
                const sec = s % 60;
                duration = `${m}:${sec < 10 ? "0" : ""}${sec}`;
            }
        } catch {
            duration = "";
        }
    }

    const provider = item?.provider || item?.contextTrack?.provider;
    const isQueued = provider === "queue" || isQueuedDefault;

    return {
        uri,
        uid,
        title,
        artist,
        album,
        artwork,
        duration,
        isQueued,
    };
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({ onClose }) => {
    const [isOpen, setIsOpen] = React.useState<boolean>(() =>
        document.body.classList.contains("fsd-queue-panel-active")
    );
    const [isPlaying, setIsPlaying] = React.useState<boolean>(() =>
        Boolean(Spicetify.Player?.isPlaying?.())
    );
    const [currentTrack, setCurrentTrack] = React.useState<TrackInfo | null>(null);
    const [nextTracks, setNextTracks] = React.useState<TrackInfo[]>([]);
    const [draggedIdx, setDraggedIdx] = React.useState<number | null>(null);

    const fetchQueue = React.useCallback(() => {
        try {
            const rawCurrent = Spicetify.Queue?.track || Spicetify.Player?.data?.item;
            if (rawCurrent) {
                setCurrentTrack(parseQueueItem(rawCurrent));
            } else {
                setCurrentTrack(null);
            }

            const rawNext = Spicetify.Queue?.nextTracks || [];
            if (Array.isArray(rawNext)) {
                const parsed = rawNext.slice(0, 60).map((t: any) => parseQueueItem(t));
                setNextTracks(parsed);
            } else {
                setNextTracks([]);
            }

            setIsPlaying(Boolean(Spicetify.Player?.isPlaying?.()));
        } catch (e) {
            console.warn("Error fetching queue:", e);
        }
    }, []);

    React.useEffect(() => {
        fetchQueue();

        const handleVisibility = (e: Event) => {
            const customEvt = e as CustomEvent<{ open: boolean }>;
            if (customEvt.detail && typeof customEvt.detail.open === "boolean") {
                setIsOpen(customEvt.detail.open);
                if (customEvt.detail.open) {
                    fetchQueue();
                }
            } else {
                const active = document.body.classList.contains("fsd-queue-panel-active");
                setIsOpen(active);
                if (active) fetchQueue();
            }
        };

        const observer = new MutationObserver(() => {
            const active = document.body.classList.contains("fsd-queue-panel-active");
            setIsOpen((prev) => {
                if (prev !== active) {
                    if (active) fetchQueue();
                    return active;
                }
                return prev;
            });
        });

        observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
        window.addEventListener("fsd-queue-visibility", handleVisibility);

        const handleQueueUpdate = () => fetchQueue();
        const handleSongChange = () => fetchQueue();
        const handlePlayPause = () => {
            setIsPlaying(Boolean(Spicetify.Player?.isPlaying?.()));
            fetchQueue();
        };

        Spicetify.Platform?.PlayerAPI?._events?.addListener("queue_update", handleQueueUpdate);
        Spicetify.Player?.addEventListener("songchange", handleSongChange);
        Spicetify.Player?.addEventListener("onplaypause", handlePlayPause);

        return () => {
            observer.disconnect();
            window.removeEventListener("fsd-queue-visibility", handleVisibility);
            Spicetify.Platform?.PlayerAPI?._events?.removeListener("queue_update", handleQueueUpdate);
            Spicetify.Player?.removeEventListener("songchange", handleSongChange);
            Spicetify.Player?.removeEventListener("onplaypause", handlePlayPause);
        };
    }, [fetchQueue]);

    const handleTogglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            Spicetify.Player?.togglePlay?.();
            setIsPlaying((prev) => !prev);
        } catch (e) {
            console.error("Toggle play failed:", e);
        }
    };

    const handlePlayTrack = async (track: TrackInfo, idx: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            if (Spicetify.Platform?.PlayerAPI?.skipTo) {
                await Spicetify.Platform.PlayerAPI.skipTo({
                    uri: track.uri,
                    uid: track.uid || undefined,
                });
            } else if (Spicetify.Player.data?.context?.uri && Spicetify.Platform?.PlayerAPI?.play) {
                await Spicetify.Platform.PlayerAPI.play(
                    { uri: Spicetify.Player.data.context.uri },
                    {},
                    { skipTo: { uri: track.uri, uid: track.uid || undefined } }
                );
            } else if (idx === 0) {
                Spicetify.Player?.next?.();
            } else if (track.uri) {
                if (Spicetify.Player?.playUri) {
                    await Spicetify.Player.playUri(track.uri);
                } else if (Spicetify.Platform?.PlayerAPI?.play) {
                    await Spicetify.Platform.PlayerAPI.play({ uri: track.uri });
                }
            }
            setTimeout(fetchQueue, 250);
        } catch (e) {
            console.error("Failed to play track:", e);
        }
    };

    const handleRemoveTrack = async (track: TrackInfo, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (Spicetify.Platform?.PlayerAPI?.removeFromQueue) {
                await Spicetify.Platform.PlayerAPI.removeFromQueue([
                    { uri: track.uri, uid: track.uid || undefined },
                ]);
            } else if (Spicetify.removeFromQueue) {
                Spicetify.removeFromQueue([{ uri: track.uri } as any]);
            }
            setTimeout(fetchQueue, 180);
        } catch (e) {
            console.warn("Could not remove track from queue:", e);
        }
    };

    const handleMoveUp = async (track: TrackInfo, idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (idx <= 0) return;
        const target = nextTracks[idx - 1];
        if (!target) return;
        try {
            if (Spicetify.Platform?.PlayerAPI?.reorderQueue) {
                await Spicetify.Platform.PlayerAPI.reorderQueue(
                    [{ uid: track.uid, uri: track.uri }],
                    { before: { uid: target.uid, uri: target.uri } }
                );
                setTimeout(fetchQueue, 180);
            }
        } catch (e) {
            console.warn("Could not move track up:", e);
        }
    };

    const handleMoveDown = async (track: TrackInfo, idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (idx >= nextTracks.length - 1) return;
        const target = nextTracks[idx + 1];
        if (!target) return;
        try {
            if (Spicetify.Platform?.PlayerAPI?.reorderQueue) {
                await Spicetify.Platform.PlayerAPI.reorderQueue(
                    [{ uid: track.uid, uri: track.uri }],
                    { after: { uid: target.uid, uri: target.uri } }
                );
                setTimeout(fetchQueue, 180);
            }
        } catch (e) {
            console.warn("Could not move track down:", e);
        }
    };

    const handleDragStart = (e: React.DragEvent, idx: number) => {
        e.dataTransfer.setData("text/plain", String(idx));
        e.dataTransfer.effectAllowed = "move";
        setDraggedIdx(idx);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, targetIdx: number) => {
        e.preventDefault();
        const sourceIdx = draggedIdx ?? Number(e.dataTransfer.getData("text/plain"));
        setDraggedIdx(null);
        if (isNaN(sourceIdx) || sourceIdx === targetIdx || sourceIdx < 0 || sourceIdx >= nextTracks.length) return;

        const sourceTrack = nextTracks[sourceIdx];
        const targetTrack = nextTracks[targetIdx];
        if (!sourceTrack || !targetTrack) return;

        try {
            if (Spicetify.Platform?.PlayerAPI?.reorderQueue) {
                const position = sourceIdx < targetIdx
                    ? { after: { uid: targetTrack.uid, uri: targetTrack.uri } }
                    : { before: { uid: targetTrack.uid, uri: targetTrack.uri } };
                await Spicetify.Platform.PlayerAPI.reorderQueue(
                    [{ uid: sourceTrack.uid, uri: sourceTrack.uri }],
                    position
                );
                setTimeout(fetchQueue, 180);
            }
        } catch (e) {
            console.warn("Drag reorder failed:", e);
        }
    };

    const handleClearQueue = (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (Spicetify.Platform?.PlayerAPI?.clearQueue) {
                Spicetify.Platform.PlayerAPI.clearQueue();
            } else if (Spicetify.removeFromQueue) {
                const userQueued = nextTracks.filter((t) => t.isQueued);
                if (userQueued.length > 0) {
                    Spicetify.removeFromQueue(userQueued.map((t) => ({ uri: t.uri } as any)));
                }
            }
            setTimeout(fetchQueue, 150);
        } catch (e) {
            console.warn("Could not clear queue:", e);
        }
    };

    const hasUserQueued = nextTracks.some((t) => t.isQueued);

    return (
        <div
            className={`fsd-queue-root ${isOpen ? "fsd-queue-open" : ""}`}
            onDoubleClick={(e) => e.stopPropagation()}
        >
            <div
                className="fsd-queue-backdrop"
                onClick={onClose}
                onDoubleClick={(e) => e.stopPropagation()}
            />
            <div
                id="fsd-queue-drawer"
                className="fsd-queue-drawer"
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
            >
                <div className="fsd-queue-header">
                    <div className="fsd-queue-header-left">
                        <svg
                            className="fsd-queue-header-icon"
                            width="22"
                            height="22"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                        >
                            <path d="M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm-14-7A2.5 2.5 0 0 1 3.5 1h9a2.5 2.5 0 0 1 0 5h-9A2.5 2.5 0 0 1 1 3.5zm2.5-1a1 1 0 0 0 0 2h9a1 1 0 1 0 0-2h-9z" />
                        </svg>
                        <h2 className="fsd-queue-title">Queue</h2>
                        <span className="fsd-queue-count">
                            {nextTracks.length} {nextTracks.length === 1 ? "track" : "tracks"}
                        </span>
                    </div>
                    <div className="fsd-queue-header-actions">
                        {hasUserQueued && (
                            <button
                                className="fsd-queue-clear-btn"
                                onClick={handleClearQueue}
                                title="Clear user queue"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            className="fsd-queue-close-btn"
                            onClick={onClose}
                            title="Close Queue"
                            aria-label="Close Queue"
                        >
                            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="fsd-queue-content">
                    {currentTrack && (
                        <div className="fsd-queue-section fsd-queue-now-playing-section">
                            <div className="fsd-queue-section-label">NOW PLAYING</div>
                            <div
                                className="fsd-queue-item fsd-queue-current-item"
                                onClick={handleTogglePlay}
                                title={isPlaying ? "Click to Pause" : "Click to Play"}
                            >
                                <div className="fsd-queue-art-container">
                                    <img
                                        className="fsd-queue-art"
                                        src={currentTrack.artwork || ICONS.OFFLINE_SVG}
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src =
                                                ICONS.OFFLINE_SVG;
                                        }}
                                        alt=""
                                    />
                                    {isPlaying && (
                                        <div className="fsd-queue-playing-wave">
                                            <span className="fsd-wave-bar" />
                                            <span className="fsd-wave-bar" />
                                            <span className="fsd-wave-bar" />
                                        </div>
                                    )}
                                    <div className="fsd-queue-art-overlay">
                                        {isPlaying ? (
                                            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                                                <path d="M3 2h3v12H3V2zm7 0h3v12h-3V2z" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                                                <path d="M3 2l10 6-10 6V2z" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                <div className="fsd-queue-info">
                                    <div className="fsd-queue-item-title current-title">
                                        {currentTrack.title}
                                    </div>
                                    <div className="fsd-queue-item-artist">
                                        {currentTrack.artist || "Unknown Artist"}
                                    </div>
                                </div>
                                <button
                                    className="fsd-queue-row-play-btn"
                                    onClick={handleTogglePlay}
                                    title={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? (
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M3 2h3v12H3V2zm7 0h3v12h-3V2z" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M3 2l10 6-10 6V2z" />
                                        </svg>
                                    )}
                                </button>
                                {currentTrack.duration && (
                                    <div className="fsd-queue-duration">
                                        {currentTrack.duration}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="fsd-queue-section fsd-queue-next-section">
                        <div className="fsd-queue-section-label">UP NEXT</div>
                        {nextTracks.length === 0 ? (
                            <div className="fsd-queue-empty">
                                <svg
                                    width="40"
                                    height="40"
                                    viewBox="0 0 16 16"
                                    fill="currentColor"
                                >
                                    <path d="M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm-14-7A2.5 2.5 0 0 1 3.5 1h9a2.5 2.5 0 0 1 0 5h-9A2.5 2.5 0 0 1 1 3.5zm2.5-1a1 1 0 0 0 0 2h9a1 1 0 1 0 0-2h-9z" />
                                </svg>
                                <span>No upcoming tracks in queue</span>
                            </div>
                        ) : (
                            <div className="fsd-queue-list">
                                {nextTracks.map((track, idx) => (
                                    <div
                                        key={track.uid || `${track.uri}-${idx}`}
                                        className={`fsd-queue-item ${draggedIdx === idx ? "fsd-queue-dragging" : ""}`}
                                        onClick={(e) => handlePlayTrack(track, idx, e)}
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, idx)}
                                    >
                                        <div
                                            className="fsd-queue-index-col"
                                            onClick={(e) => handlePlayTrack(track, idx, e)}
                                            title="Play track"
                                        >
                                            <span className="fsd-queue-index">{idx + 1}</span>
                                            <svg
                                                className="fsd-queue-play-icon"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 16 16"
                                                fill="currentColor"
                                            >
                                                <path d="M3 2l10 6-10 6V2z" />
                                            </svg>
                                        </div>
                                        <div
                                            className="fsd-queue-art-container"
                                            onClick={(e) => handlePlayTrack(track, idx, e)}
                                            title="Play track"
                                        >
                                            <img
                                                className="fsd-queue-art"
                                                src={track.artwork || ICONS.OFFLINE_SVG}
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src =
                                                        ICONS.OFFLINE_SVG;
                                                }}
                                                alt=""
                                            />
                                            <div className="fsd-queue-art-overlay">
                                                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                                                    <path d="M3 2l10 6-10 6V2z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="fsd-queue-info">
                                            <div className="fsd-queue-item-title-row">
                                                <span className="fsd-queue-item-title">
                                                    {track.title}
                                                </span>
                                                {track.isQueued && (
                                                    <span className="fsd-queue-badge">Queued</span>
                                                )}
                                            </div>
                                            <div className="fsd-queue-item-artist">
                                                {track.artist || "Unknown Artist"}
                                            </div>
                                        </div>
                                        <div className="fsd-queue-item-actions" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                className="fsd-queue-action-btn fsd-queue-play-action-btn"
                                                title="Play this track"
                                                onClick={(e) => handlePlayTrack(track, idx, e)}
                                            >
                                                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                                    <path d="M3 2l10 6-10 6V2z" />
                                                </svg>
                                            </button>
                                            {idx > 0 && (
                                                <button
                                                    className="fsd-queue-action-btn"
                                                    title="Move up in queue"
                                                    onClick={(e) => handleMoveUp(track, idx, e)}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                                        <path d="M8 3.5l6 6-.707.707L8 4.914 2.707 10.207 2 9.5l6-6z" />
                                                    </svg>
                                                </button>
                                            )}
                                            {idx < nextTracks.length - 1 && (
                                                <button
                                                    className="fsd-queue-action-btn"
                                                    title="Move down in queue"
                                                    onClick={(e) => handleMoveDown(track, idx, e)}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                                        <path d="M8 12.5l-6-6 .707-.707L8 11.086l5.293-5.293.707.707-6 6z" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                className="fsd-queue-action-btn fsd-queue-remove-btn"
                                                title="Remove from queue"
                                                onClick={(e) => handleRemoveTrack(track, e)}
                                            >
                                                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
                                                </svg>
                                            </button>
                                        </div>
                                        {track.duration && (
                                            <div className="fsd-queue-duration">
                                                {track.duration}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueueDrawer;
