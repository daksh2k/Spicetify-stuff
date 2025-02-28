import * as React from "react";
import "./styles.scss";
import Utils from "../../../utils/utils";
import classNames from "classnames";
import { BsPinAngle, BsPinAngleFill, BsUnlock, BsLockFill } from "react-icons/bs";
import { MdAutorenew } from "react-icons/md";
import CFM from "../../../utils/config";

interface OverviewCardProps {
    onExit: () => void;
    onToggle: () => void;
}

const OverviewCard = ({ onExit, onToggle }: OverviewCardProps) => {
    const [visibility, setVisibility] = React.useState(true);
    const [pinned, setPinned] = React.useState(CFM.get("overviewCardPinned"));

    const overviewCardTimer = React.useRef<NodeJS.Timeout | null>(null);

    const hideCard = (timeout = 3000) => {
        if (overviewCardTimer.current) clearTimeout(overviewCardTimer.current);
        setVisibility(true);
        overviewCardTimer.current = setTimeout(() => {
            setVisibility(false);
        }, timeout);
    };

    const handleMouseMove = (evt: MouseEvent) => {
        // Show card when mouse is on the top side of the screen and centered horizantally
        if (
            !pinned &&
            evt.clientY / window.innerHeight < 0.15 &&
            evt.clientX / window.innerWidth > 0.3 &&
            evt.clientX / window.innerWidth < 0.7
        ) {
            hideCard();
        }
    };

    React.useEffect(() => {
        if (overviewCardTimer.current) clearTimeout(overviewCardTimer.current);
        if (!pinned) {
            hideCard();
        }
        document.addEventListener("mousemove", handleMouseMove);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
        };
    }, [pinned]);

    return (
        <div
            id="fsd-overview-card"
            className={classNames({
                "c-hidden": !visibility,
                "card-pinned": pinned,
            })}>
            <Spicetify.ReactComponent.TooltipWrapper
                label={pinned ? "Unpin Card" : "Pin Card"}
                placement="bottom">
                <button
                    id="fsd-overview-pin-button"
                    onClick={() => {
                        if (!pinned) {
                            if (overviewCardTimer.current) clearTimeout(overviewCardTimer.current);
                        }
                        setPinned(!pinned);
                        CFM.set("overviewCardPinned", !pinned);
                    }}>
                    {pinned ? <BsPinAngleFill /> : <BsPinAngle />}
                </button>
            </Spicetify.ReactComponent.TooltipWrapper>
            <ClockSection />

            <div id="fsd-overview-button-container">
                {/* <Spicetify.ReactComponent.TooltipWrapper label="Set Wake Lock" placement="bottom">
                    <button
                        id="overview-lock-button"
                        className="fsd-overview-button"
                        onClick={() => {}}>
                        <BsUnlock />
                    </button>
                </Spicetify.ReactComponent.TooltipWrapper> */}
                <Spicetify.ReactComponent.TooltipWrapper label="Toggle Mode" placement="bottom">
                    <button
                        id="overview-toggle-button"
                        className="fsd-overview-button"
                        onClick={onToggle}>
                        <MdAutorenew />
                    </button>
                </Spicetify.ReactComponent.TooltipWrapper>

                <Spicetify.ReactComponent.TooltipWrapper label="Exit" placement="bottom">
                    <button
                        id="overview-exit-button"
                        className="fsd-overview-button"
                        dangerouslySetInnerHTML={{
                            __html: `<svg width="1.5em" height="1.5em" viewBox="0 0 16 16" fill="currentColor">${
                                Spicetify.SVGIcons.x
                            }</svg>`,
                        }}
                        onClick={onExit}
                    />
                </Spicetify.ReactComponent.TooltipWrapper>
            </div>
        </div>
    );
};

const ClockSection = () => {
    const [currentTime, setCurrentTime] = React.useState(Utils.getTimeFormatted());

    function updateTimeDisplay() {
        setCurrentTime(Utils.getTimeFormatted());
    }

    React.useEffect(() => {
        const updateInterval = setInterval(updateTimeDisplay, 1000);

        return () => {
            clearInterval(updateInterval);
        };
    }, []);

    return <div id="fsd-time-display">{currentTime}</div>;
};
export default OverviewCard;
