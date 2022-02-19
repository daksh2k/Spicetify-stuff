# Spicetify Extensions

  - ### [Save Playlists](https://github.com/daksh2k/Spicetify-stuff/blob/master/Extensions/savePlaylists.js)
    **Description:** Save any playlist by right clicking on a playlist > Save Playlist.\
    A new playlist will be created with the same name+last updated date of the parent playlist.\
    Modify the the date format and locale from [here.](https://github.com/daksh2k/Spicetify-stuff/blob/master/Extensions/savePlaylists.js#L11-L14)

    ![Save Playlist](https://i.imgur.com/2AEyRrs.png)
- ### [Full Screen Mode](https://github.com/daksh2k/Spicetify-stuff/blob/master/Extensions/fullScreen.js)
    **Description:** Modified from the [fullAppDisplay.js](https://github.com/khanhas/spicetify-cli/blob/master/Extensions/fullAppDisplay.js) with added features.\
    Fancy artwork and track status display.\
    Thanks [@khanhas](https://github.com/khanhas) for the original extension.
    
    **Usage:** 
    1. Clicking the fullscreen icon on bottom right next to the volume bar or by pressing <kbd>F</kbd> keyboard shortcut to activate default mode with Album blurred image as background.
    2. Clicking the TV Icon on topbar or by pressing the <kbd>T</kbd> keyboard shortcut to activate TV mode which contains Artist Image as background.
    
    **Additional settings can be modified by right clicking anywhere in the extension to open the config.**
    
    **Note:** You need `lyrics-plus` custom app for showing the lyrics in the extension.
    
    It comes bundled with [Spicetify](https://spicetify.app/docs/getting-started/custom-apps), just run 
    
    ```ps
    spicetify config custom_apps lyrics-plus
    spicetify apply
    ```
    
    Extra Features:
    - Upnext Display
    - Current Context Display
    - Bigger Album Art and other Style Changes
    - TV Mode - With Artist Header Image as Background(Now the default full screen mode for spotify if you have premium)
    - Volume Bar Display
    - Extra Controls(Heart, shuffle, repeat, lyrics quick toggle)
    - Control Background brightness and blur right from the config

    <details>
      <summary>Screenshots </summary>
      <img align="center" src="https://i.imgur.com/uPbnZkz.png" alt="Default Mode" width="712" height="auto"/><hr>
      <img align="center" src="https://i.imgur.com/Kii9Khb.jpeg" alt="Default Mode3" width="712" height="auto"/><hr>
      <img align="center" src="https://i.imgur.com/rwPmLLD.png" alt="TV Mode" width="712" height="auto"/><hr>
      <img align="center" src="https://i.imgur.com/LtYLHiv.jpg" alt="TV Mode2" width="712" height="auto"/>
    </details>

      
  - ### [Auto Skip](https://github.com/daksh2k/Spicetify-stuff/blob/master/Extensions/autoSkip.js)
    **Description:** Auto Skip Certain Songs such as remixes, acoustics etc.\
    Toggle in Profile menu for each skipping option you want.

    <img src="https://i.imgur.com/GxdGp9t.png" alt="Auto Skip" width="300" height="auto"/>

    Current options:
    - Accoustic Songs
    - Unplugged Songs
    - Remix Songs
    - Live Songs
    - Explicit Songs
    - Stripped Songs
    - Christmas Songs

  - ### [Play Next](https://github.com/daksh2k/Spicetify-stuff/blob/master/Extensions/playNext.js)
    **Description:** Add the option to context menu to add stuff(albums, tracks, playlists) to the top of the queue.\
    Spotify `Add to Queue` works by adding tracks directly to the end of the queue.\
    This option enables to directly add to top of the queue.

    ![Play Next](https://i.imgur.com/osY8QmH.png)
  
  - ### [Volume Percentage](https://github.com/daksh2k/Spicetify-stuff/blob/master/Extensions/volumePercentage.js)
    **Description:** Add the current Volume Percentage to the Volume Bar.
    
    ![Volume Percentage](https://i.imgur.com/lQQXSIg.png)

  

  - ### [Keyboard Shortcuts](https://github.com/daksh2k/Spicetify-stuff/blob/master/Extensions/keyboardShortcutMy.js)
    **Description:** Modified from the [keyboardShortcut.js](https://github.com/khanhas/spicetify-cli/blob/master/Extensions/keyboardShortcut.js) with added shortcuts.

    Look [here](https://github.com/daksh2k/Spicetify-stuff/blob/master/Extensions/keyboardShortcutMy.js#L56-L134) for the extra binds.