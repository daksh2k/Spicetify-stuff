import * as React from "react";
import "./styles.scss";

// const Popup = (props: any) => {
//     return (
//         <div>
//             <ToggleItem
//                 name={props.translations[props.LOCALE].settings.progressBar}
//                 value={props.config.def["progressBarDisplay"]}
//                 key="progressBarDisplay"
//                 callback={(val: boolean) => {
//                     props.config.def["progressBarDisplay"] = val;
//                     saveConfig(props.config);
//                     props.onChange();
//                 }}
//             />
//         </div>
//     );
// };

const Popup = (props: any) => {
    return <PopupContent state={props} />;
};

const PopupContent = (props: any) => {
    const checkClose = (evt: any) => {
        if (!document.querySelector(".fsd-settings-modal")?.contains(evt.target)) {
            props.state.onClose();
        }
    };
    return (
        <div className="fsd-settings-overlay" onClick={checkClose}>
            <div className="fsd-settings-modal">
                <div className="fsd-settings-container">
                    <PopupHeaderBar state={props.state} />
                    <div className="fsd-settings-content" />
                </div>
            </div>
        </div>
    );
};

const PopupHeaderBar = (props: any) => {
    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };
    return (
        <div className="fsd-settings-header">
            <div className="fsd-settings-cats">
                <div />
            </div>
            <CloseBtn onClose={props.state.onClose} />
        </div>
    );
};

const CloseBtn = (props: any) => {
    return (
        <button aria-label="Close" className="fsd-settings-closeBtn" onClick={props.onClose}>
            <svg width="22" height="22" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <title>Close</title>
                <path
                    d="M31.098 29.794L16.955 15.65 31.097 1.51 29.683.093 15.54 14.237 1.4.094-.016 1.508 14.126 15.65-.016 29.795l1.414 1.414L15.54 17.065l14.144 14.143"
                    fill="currentColor"
                    fillRule="evenodd"
                />
            </svg>
        </button>
    );
};

export default Popup;

// TODO: Add in Main file

// function testR() {
//     const onClose = () => {
//         console.log("Close called");
//         ReactDOM.unmountComponentAtNode(document.querySelector("#modals")!);
//     };
//     console.log("!!!!!!!!!!!!!!!!executing popup");
//     const modals = document.createElement("div");
//     modals.id = "modals";
//     document.body.append(modals);
//     ReactDOM.render(React.createElement(Popup, { onClose }), document.querySelector("#modals"));

// Spicetify.PopupModal.display({
//     title: "Test",
//     content: React.createElement(Popup, {
//         config: CONFIG,
//         translations: translations,
//         LOCALE: LOCALE,
//         onChange: () => {
//             render();
//             if (document.body.classList.contains("fsd-activated")) {
//                 activate();
//             }
//         },
//     }),
// });
// }
// Spicetify.Mousetrap.bind("alt+k", testR);
