const changelog = `## Animated Background Mode
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
  `;

export const VersionedChangelog = {
    "2.2.1": changelog,
    "2.1.0": `## General
- Support for changing activation methods.
- Support for customizing activation buttons and keys.
- Support for narrow screens(responsive styling).
- Context aware reset of settings.
  - Reset all settings when not active in any mode.
  - Reset only mode specific settings when active in that mode.
- Show full changelog for new users.`,
    "2.0.1": `## General
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
