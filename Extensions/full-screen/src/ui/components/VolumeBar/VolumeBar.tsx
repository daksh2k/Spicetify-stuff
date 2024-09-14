import * as React from "react";
import debounce from "lodash.debounce";
import "./styles.scss";
import classNames from "classnames";
import { SeekbarProps } from "../../../types/fullscreen";

const SeekableVolumeBar = ({ state }: { state: string }) => {
    const DEFAULT_VOLUME = -100;

    const [curVolume, setVolume] = React.useState<number>(
        Spicetify.Platform?.PlaybackAPI?._isAvailable
            ? Math.round(Spicetify.Player.getVolume() * 100)
            : DEFAULT_VOLUME,
    );

    const [changingProgress, setChangingProgress] = React.useState<SeekbarProps>({
        isChanging: false,
        data: null,
    });

    const [visibility, setVisibility] = React.useState(true);

    const progSlider = React.useRef<HTMLDivElement>(null);

    const volumeTimer = React.useRef<NodeJS.Timeout | null>(null);

    const onMouseDown = (evt: MouseEvent) => {
        if (evt.button === 0) {
            const sliderHeight = progSlider.current?.getBoundingClientRect().height ?? 250;
            const newData = {
                isChanging: true,
                data: {
                    begin: sliderHeight - evt.offsetY,
                    positionCoord: sliderHeight - evt.offsetY,
                    beginClient: evt.clientY,
                    sliderDimen: sliderHeight,
                },
            };
            const newPercentage = Math.round((newData.data.positionCoord / sliderHeight) * 100);
            setVolume(newPercentage);
            setChangingProgress(newData);
        }
    };

    const debouncedVolume = debounce((newPercentage: number) => {
        Spicetify.Player.setVolume(newPercentage / 100);
    }, 20);

    const onMouseMove = (evt: MouseEvent) => {
        if (changingProgress.isChanging && changingProgress.data) {
            const moveY = changingProgress.data.beginClient - evt.clientY;
            const sliderHeight = changingProgress.data.sliderDimen;
            const newPosY = Math.min(
                Math.max(changingProgress.data.begin + moveY, 0),
                sliderHeight,
            );
            const newPercentage = Math.round((newPosY / sliderHeight) * 100);
            setVolume(newPercentage);
            debouncedVolume(newPercentage);
            setChangingProgress({
                isChanging: true,
                data: { ...changingProgress.data, positionCoord: newPosY },
            });
        }
        // Show volume bar when mouse is on the left side of the screen and centered vertically
        if (
            state === "smart" &&
            evt.clientY / window.innerHeight > 0.2 &&
            evt.clientY / window.innerHeight < 0.75 &&
            evt.clientX / window.innerWidth < 0.15
        ) {
            hideVolumeBar();
        }
    };

    const onMouseUp = (evt: MouseEvent) => {
        if (evt.button == 0 && changingProgress.isChanging) {
            Spicetify.Player.setVolume(curVolume / 100);
            setChangingProgress({ isChanging: false, data: null });
        }
    };

    const hideVolumeBar = (timeout = 2000) => {
        if (volumeTimer.current) clearTimeout(volumeTimer.current);
        setVisibility(true);
        volumeTimer.current = setTimeout(() => {
            setVisibility(false);
        }, timeout);
    };

    const setDragListener = () => {
        progSlider.current?.addEventListener("mousedown", onMouseDown);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    const resetDragListener = () => {
        progSlider.current?.removeEventListener("mousedown", onMouseDown);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    };
    // Uses spotify internal event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateVolume = (meta: any) => {
        if (!changingProgress.isChanging) {
            const newVol = Math.round(meta.data.volume * 100);
            // console.log("Curvol: ", curVolume, "Newvol: ", newVol);
            if (newVol !== curVolume) {
                setVolume(newVol);
                if (state === "smart") {
                    hideVolumeBar();
                }
            }
        }
    };
    React.useEffect(() => {
        // console.log("Volume Effect called");
        if (state === "smart") {
            hideVolumeBar(3000);
        }
        Spicetify.Platform.PlaybackAPI._events.addListener("volume", updateVolume);
        setDragListener();
        return () => {
            // console.log("Cleared Volume Effect");
            Spicetify.Platform.PlaybackAPI._events.removeListener("volume", updateVolume);
            resetDragListener();
        };
    }, [changingProgress, state, curVolume]);

    return (
        <div
            id="fsd-volume-container"
            className={classNames({
                unavailable: curVolume === -100,
                "v-hidden": state !== "always" && !visibility,
                dragging: changingProgress.isChanging,
            })}>
            <div id="fsd-volume">{curVolume === -100 ? "" : `${curVolume}%`}</div>
            <div
                id="fsd-volume-bar"
                ref={progSlider}
                className={classNames({ dragging: changingProgress.isChanging })}>
                <div
                    id="fsd-volume-bar-inner"
                    style={{
                        height: (curVolume === -100 ? 100 : curVolume) + "%",
                    }}>
                    <div id="volume-thumb" />
                </div>
            </div>
            <VolumeButton volume={curVolume} />
        </div>
    );
};

const VolumeButton = ({ volume }: { volume: number }) => {
    const getVolumeIcon = () => {
        if (typeof volume !== "number" || volume > 60 || volume === -100)
            return `
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                ${Spicetify.SVGIcons["volume"]}
            </svg>
        `;
        else if (volume > 30)
            return `
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                ${Spicetify.SVGIcons["volume-two-wave"]}
            </svg>
        `;
        else if (volume > 0)
            return `
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                ${Spicetify.SVGIcons["volume-one-wave"]}
            </svg>
        `;
        else
            return `
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                ${Spicetify.SVGIcons["volume-off"]}
            </svg>
        `;
    };

    return (
        <button
            className="fs-button"
            id="fsd-volume-icon"
            onClick={() =>
                document
                    .querySelector<HTMLButtonElement>("div.main-nowPlayingBar-volumeBar > button")
                    ?.click()
            }
            title={volume == 0 ? "Unmute" : "Mute"}
            dangerouslySetInnerHTML={{ __html: getVolumeIcon() }}
        />
    );
};

export default SeekableVolumeBar;
