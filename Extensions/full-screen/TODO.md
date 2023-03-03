## High Priority
-   [ ] add reset to default setting button on each setting
-   [ ] add indicator to show that setting is changed from default
-   [ ] add disabled state for setting card
-   [ ] add parent/child dependencies for setting which wll tell which card is to be disabled

## Low Priority
-   [ ] prefetch next song details including images
-   [ ] add search bar in settings
-   [ ] (On hold) use react for settings(in progress)

-   [ ] Optimize `useEffect` being called on every render for progress and volume
-   [ ] Cleanup styles(Use SASS features)
-   [ ] Add description for each setting
-   [ ] Make a crowdin project for translations
-   [ ] Cleanup code for React components
-   [ ] Add Tooltips for `ProgressBar` and `VolumeBar`
-   [ ] Autohide lyrics when not available(Either make a pr on `spicetify-cli` or find some other way)
-   [ ] Check if `lyrics-plus` is installed and disable the setting if not
-   [ ] Fix eslint errors in files
-   [ ] Add JSDOC Comments for some functions 
-   [ ] Add a `CONTRIBUTING.md` file and update README for contributing and development and translations

## Done
-   [x] Set variable for icon display
-   [x] set variables for lyrics config(alignment and tempo)
-   [x] set variables for background in tvMode for brightness and blur
-   [x] refactor getNextColor to utils
-   [x] add static color background choice
-   [x] setup ESLint

-   [x] add singleton instance to manage config

-   [x] Fix seekable volume bar(The CLientX starts from Top of the page, use height - clientX for seeking progress)
-   [x] Add correct progress thumb in seekable volume bar
