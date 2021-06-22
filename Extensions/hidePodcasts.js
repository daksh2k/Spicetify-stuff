// @ts-check

// NAME: Hide Podcasts
// AUTHOR: theRealPadster
// DESCRIPTION: Hide podcasts. Toggle in Profile menu.

/// <reference path="../spicetify-cli/globals.d.ts" />

const SETTINGS_KEY = 'HidePodcastsMode';
const FAKE_PLACEHOLDER_CLASS = 'searchInput-fakePlaceholder';

(function HidePodcasts() {
    const { Player, Menu, LocalStorage, Platform } = Spicetify;
    const main = document.querySelector('.main-view-container__scroll-node-child');
    if (!(Player && Menu && LocalStorage && Platform && main)) {
        // console.log('Not ready, waiting...');
        setTimeout(HidePodcasts, 1000);
        return;
    }

    let isEnabled = LocalStorage.get(SETTINGS_KEY) === '1';

    // Add menu item and menu click handler
    new Menu.Item('Hide podcasts', isEnabled, (self) => {
        isEnabled = !isEnabled;
        LocalStorage.set(SETTINGS_KEY, isEnabled ? '1' : '0');
        self.setState(isEnabled);
        apply();
    }).register();

    // Run the app logic
    function apply() {
        setState(isEnabled);
        injectCSS();
        tagItems();
    }

    // Listen to page navigation and re-apply when DOM is ready
    function listenThenApply(pathname) {
        const observer = new MutationObserver(function appchange(){
            // Look for specific section on search page, or any section on other pages
            const app = pathname === '/search'
                ? main.querySelector('.x-searchBrowse-SearchBrowse')
                : main.querySelector('section');

            if (app) {
                // console.log(pathname, app);
                apply();
                observer.disconnect();
            }
        })
        // I need to include subtree because the Search page only has one child and the content is under there
        observer.observe(main, { childList: true, subtree: true });
    }

    // Initial scan on app load
    listenThenApply(Platform.History.location.pathname);

    // Listen for page navigation events
    Platform.History.listen(({ pathname }) => {
        listenThenApply(pathname);
    });
})();

/**
 * Inject the css that allows us to toggle podcasts
 */
function injectCSS() {
    const body = document.querySelector('body');

    // Inject style if it doesnt have it already
    if (!body.classList.contains('hide-podcasts--style-injected')) {
        const style = document.createElement('style');
        // TODO: Need to add the queue-tabBar bit to block the Podcasts tab on the Your Library page
        // Because it resets itself when the window resizes and it go in/out of the overflow menu
        // Technically I should block the li.queue-tabBar-headerItem above it, but can't do that with just CSS

        style.innerHTML =
        // General rule
        `.hide-podcasts-enabled .podcast-item {
            display: none !important;
        }`
        + // Podcasts tab in Your Library page
        `.hide-podcasts-enabled .queue-tabBar-header a[href="/collection/podcasts"] {
            display: none !important;
        }`
        + // Updated search entry placeholder
        `.hide-podcasts-enabled .x-searchInput-searchInputInput.main-type-mesto::placeholder {
            color: transparent;
        }
        .hide-podcasts-enabled .x-searchInput-searchInputInput.main-type-mesto + .${FAKE_PLACEHOLDER_CLASS} {
            display: block;
            position: absolute;
            width: 100%;
            left: 0;
            top: 0;
            opacity: 0.4;
            font-size: 14px;
            line-height: 16px;
            padding: 12px 48px;
            text-overflow: ellipsis;
            pointer-events: none;
        }
        .${FAKE_PLACEHOLDER_CLASS},
        .hide-podcasts-enabled .x-searchInput-searchInputInput.main-type-mesto:not([value=""]) + .${FAKE_PLACEHOLDER_CLASS} {
            display: none;
        }`;
        body.appendChild(style);
        body.classList.add('hide-podcasts--style-injected');
    }
}

/**
 * Add our class to any podcast elements
 */
function tagItems() {

    // Remove podcast carousels
    const shelves = document.querySelectorAll('.main-shelf-shelf');
    shelves.forEach(shelf => {

        // Podcast links in carousels
        const podcastCardLinks = [
            ...shelf.querySelectorAll('.main-cardHeader-link[href^="/episode"'),
            ...shelf.querySelectorAll('.main-cardHeader-link[href^="/show"'),
        ];

        if (podcastCardLinks.length > 0) {
            const title = shelf.getAttribute('aria-label');
            // console.log(`Tagging carousel: ${title}`);
            shelf.classList.add('podcast-item');
        }
    });

    // Remove podcast card from search/browse page
    const browsePodcastsCard = document.querySelector('.x-categoryCard-CategoryCard[href="/genre/podcasts-web"]');
    if (browsePodcastsCard) {
        // console.log(`Tagging browsePodcastsCard: ${browsePodcastsCard}`);
        browsePodcastsCard.classList.add('podcast-item');
    }

    // Remove podcast card from Your Library page
    // TODO: I changed this to just use CSS since the element resets when it goes in/out of overflow menu
    // let libraryPodcastsTab = doc.body.querySelector('.queue-tabBar-header a[href="/collection/podcasts"]');
    // if (libraryPodcastsTab) {
    //     // Find the actual li tag
    //     libraryPodcastsTab = libraryPodcastsTab.closest('.queue-tabBar-headerItem');
    //     console.log(`Tagging libraryPodcastsTab: ${libraryPodcastsTab}`);
    //     libraryPodcastsTab.classList.add('podcast-item');
    // }

    // Remove mention of podcasts from search entry placeholder
    const searchEntry = document.querySelector('.x-searchInput-searchInputInput.main-type-mesto');
    if (searchEntry) {
        // console.log('Updating search entry placeholder text');
        const foundPlaceholderEl = document.querySelector(`.x-searchInput-searchInputInput.main-type-mesto + .${FAKE_PLACEHOLDER_CLASS}`);
        if (!foundPlaceholderEl) {
            const fakePlaceholder = document.createElement('label');
            fakePlaceholder.innerText = 'Artists, albums, or songs';
            fakePlaceholder.classList.add(FAKE_PLACEHOLDER_CLASS);
            searchEntry.insertAdjacentElement('afterend', fakePlaceholder);
        }
    }
}

/**
 * Add/remove the body class that hides podcasts
 * @param {boolean} isEnabled If we should hide podcasts or not
 */
function setState(isEnabled) {
    document.querySelector('body').classList.toggle('hide-podcasts-enabled', isEnabled);
}