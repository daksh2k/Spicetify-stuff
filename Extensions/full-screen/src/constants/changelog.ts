const changelog = `## General 
  - Add overview card with time display (move your mouse to top side of the screen to see it)
  `;

export const VersionedChangelog = {
    "2.8.0": changelog,
    "2.7.0": `## General 
  - Add queue in sidebar, enable it from settings now!!
  - use esc key to exit the full screen experience
  - re-enable dynamic colors theme and backgrounds
  - compatibility with latest spotify and spicetify 
  ## New Keyboard Shortcuts
| Key            | Purpose                                   |
|----------------|-------------------------------------------|
| <kbd>Q</kbd>   | Toggle Sidebar Queue Panel (when enabled) |
| <kbd>C</kbd>   | Toggle Settings popup                     |
| <kbd>L</kbd>   | Toggle Lyrics (when enabled)              |
| <kbd>ESC</kbd> | Exit full screen app                      |
| <kbd>F</kbd>   | Toggle Default Mode (exit if active)      |
| <kbd>T</kbd>   | Toggle TV Mode (exit of active)           |
  `,
    "2.6.0": `## General 
  - **Info** -: dynamic color theme and backgrounds is not working anymore in new Spotify
  - fix classnames library error(use own version)
  - fix wrong artist order when showing multiple artists
  - add brazilian translations (thanks to [@vinizent](https://github.com/vinizent))
  - add chinese traditional translations (thanks to [@york9675](https://github.com/york9675))
### P.S - update your spicetify if you are facing issues with lyrics
  `,
    "2.5.0": `## General 
  - add new settings options for progress bar and controls to only show on mousemove
  - auto hide lyrics is more repsonsive now (should react faster)
  - add hyperlinks to title,artists and albums
  - misc bug fixes and quality of life improvements
  - add indonesian translations (thanks to [@ianz56](https://github.com/ianz56))
    `,
    "2.4.0": `## General 
  - add support for vertical monitor(with lyrics on bottom)
  - add compatibility with latest spotify and spicetify
  - add french translations (thanks to [@ShirowLeBG](https://github.com/ShirowLeBG))
    `,
    "2.3.1": `## General 
  - fix background tearing up sometimes on first launch
  - add spanish translations (thanks to [@DavKiller](https://github.com/DavKiller))
    `,
    "2.3.0": `## New Features
  - ⭐Add ability to modify animation speed of the animated background
  - add keyboard shortcut for lyrics toggling (toggle by key <kbd>L</kbd>)
  - add auto hide lyrics functionality (experimental)
  
   ## General 
  - update adjust settings design and reorganize settings
  - update chinese translations
  - fix right click getting blocked on background for opening settings menu
    `,
    "2.2.0": `## Animated Background Mode
  **⭐NEW:** add a new background choice option  - "Animated Album Art" which contains a beautiful animation of color blobs.
  Inspired by [this repo for lyrics](https://github.com/surfbryce/beautiful-lyrics) and Apple music background animation. 
  <br>
  Try it out today by modifying the settings and let me know what you think on [GitHub](https://github.com/daksh2k/Spicetify-stuff)!
  Star this project and help it to reach more people! [![Github Stars badge](https://img.shields.io/github/stars/daksh2k/spicetify-stuff?style=social)](https://github.com/daksh2k/spicetify-stuff)
  
  *PS: It's still experimental, may be a little resource intensive.*

  <br>
  
  <img align="center" width="480" height="auto" src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjFlOWI1MmEzMDdhNjI5YTY5OWY3YzhlMDJiNGE2OTA4MzMzMDkwZSZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/EIuHnuq1XIDg4Tt2hx/giphy.gif">
  
  <hr>
    
## General
  - add Vietnamese translations
  - update russian translations
  - update tv mode lyrics width
  - fix lyrics jumping around when choosing center or left alignment
    `,
    "2.1.0": `## General
- Support for changing activation methods.
- Support for customizing activation buttons and keys.
- Support for narrow screens(responsive styling).
- Context aware reset of settings.
  - Reset all settings when not active in any mode.
  - Reset only mode specific settings when active in that mode.
- Show full changelog for new users.`,
    "2.0.0": `## General
  - Rewritten the entire codebase in TypeScript. It is now modular and easier to maintain.
  - Added a changelog for new features.
  - ⭐New Progress Bar and Volume Bar which are now seekable. Drag away!
  - Overhauled the background and animations to be more fluent in transitions.
  - Add a versioned changelog
  - Update Italian translations
  - Bug fixes
  - Choice of 4 backgrounds to choose from
     - Artist Image
     - Album Image
     - Dynamic Color(Extracted from album image)
     - Static Color
## Settings menu
  - Complete UI Overhaul for Settings Menu
  - Descriptions for some common settings 
  - Added new options to fine tune the UI`,
};

export default changelog;
