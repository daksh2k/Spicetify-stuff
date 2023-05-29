import * as React from "react";
import classNames from "classnames";
import "./styles.scss";
import { SeekbarProps } from "../../../types/fullscreen";
import CFM from "../../../utils/config";

const SeekableProgressBar = () => {
    const [curProgress, setProgress] = React.useState(Spicetify.Player.getProgress());
    const [curDuration, setDuration] = React.useState(Spicetify.Player.getDuration());
    const [secondaryPref, setSecondaryPref] = React.useState(CFM.get("showRemainingTime"));

    const [changingProgress, setChangingProgress] = React.useState<SeekbarProps>({
        isChanging: false,
        data: null,
    });

    const progSlider = React.useRef(null) as React.MutableRefObject<HTMLDivElement | null>;
    const onMouseDown = (evt: MouseEvent) => {
        if (evt.button == 0) {
            const sliderWidth = progSlider.current?.getBoundingClientRect().width ?? 480;
            const newData = {
                isChanging: true,
                data: {
                    begin: evt.offsetX,
                    positionCoord: evt.offsetX,
                    beginClient: evt.clientX,
                    sliderDimen: sliderWidth,
                },
            };
            const newPercentage = newData.data.positionCoord / sliderWidth;
            setProgress(newPercentage * curDuration);

            setChangingProgress(newData);
        }
    };

    const onMouseMove = (evt: MouseEvent) => {
        if (changingProgress.isChanging && changingProgress.data) {
            const moveX = evt.clientX - changingProgress.data.beginClient;
            const sliderWidth = changingProgress.data.sliderDimen;
            const newPosX = Math.min(Math.max(changingProgress.data.begin + moveX, 0), sliderWidth);
            const newPercentage = newPosX / sliderWidth;
            setProgress(newPercentage * curDuration);
            setChangingProgress({
                isChanging: true,
                data: { ...changingProgress.data, positionCoord: newPosX },
            });
        }
    };

    const onMouseUp = (evt: MouseEvent) => {
        if (evt.button == 0 && changingProgress.isChanging) {
            Spicetify.Player.seek(curProgress);
            setChangingProgress({ isChanging: false, data: null });
        }
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

    const updateProgress = () => {
        const progress = Spicetify.Player.getProgress();
        if (
            !changingProgress.isChanging &&
            (!Spicetify.Player.origin._state.isPaused || curProgress !== progress)
        ) {
            setProgress(progress);
        }
    };
    //Using spotify internal songchange event listener
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateDuration = (meta: any) => {
        setProgress(0);
        setDuration(meta.data.duration);
    };

    const updateSecondaryPref = () => {
        setSecondaryPref(!secondaryPref);
        CFM.set("showRemainingTime", !secondaryPref);
    };
    const getSecondaryTime = () => {
        if (secondaryPref) {
            return " -" + Spicetify.Player.formatTime(curDuration - curProgress);
        } else {
            return Spicetify.Player.formatTime(curDuration);
        }
    };

    React.useEffect(() => {
        // console.log("Progress Effect called");
        const updateInterval = setInterval(updateProgress, 500);

        Spicetify.Player.addEventListener("songchange", updateDuration);
        setDragListener();
        return () => {
            // console.log("Progress Effect cleared");
            clearInterval(updateInterval);
            Spicetify.Player.removeEventListener("songchange", updateDuration);
            resetDragListener();
        };
    }, [changingProgress]);

    return (
        <div id="fsd-progress-container">
            <div className="progress-number" id="fsd-elapsed">
                {Spicetify.Player.formatTime(curProgress)}
            </div>
            <div
                id="fsd-progress-bar"
                ref={progSlider}
                className={classNames({ dragging: changingProgress.isChanging })}>
                <div
                    id="fsd-progress-bar-inner"
                    style={{ width: (curProgress / curDuration) * 100 + "%" }}>
                    <div id="progress-thumb" />
                </div>
            </div>
            <div className="progress-number" id="fsd-duration" onClick={updateSecondaryPref}>
                {getSecondaryTime()}
            </div>
        </div>
    );
};

export default SeekableProgressBar;
