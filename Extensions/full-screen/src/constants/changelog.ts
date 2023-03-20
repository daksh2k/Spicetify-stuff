const changelog = `## General
  - Add support for changing activation methods.
  - Add support for narrow screens(responsive styling).
  - Show full changelog for new users.
  `;

export const VersionedChangelog = {
    "2.0.2": changelog,
    "2.0.1": `## General
  - Add a versioned changelog
  - Update Italian translations
  - Bug fixes
  `,
    "2.0.0": `## General
  - Rewritten the entire codebase in TypeScript. It is now modular and easier to maintain.
  - Added a changelog for new features.
  - ⭐New Progress Bar and Volume Bar which are now seekable. Drag away!
  - Overhauled the background and animations to be more fluent in transitions.
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
