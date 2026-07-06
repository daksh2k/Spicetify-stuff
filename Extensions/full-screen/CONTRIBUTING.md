# Contributing

```bash
cd Extensions/full-screen
npm install
npm run build-local
```

Bundle: `dist/fullScreen.js`. Use **`build-local`** so output lands in `dist/` (plain `npm run build` may not).

**Try it in Spotify:** Uninstall Marketplace Full Screen (or remove it from `extensions` in `config-xpui.ini` — only one Full Screen should load, otherwise there might be conflicts). Copy the bundle and apply:

```bash
cp dist/fullScreen.js ~/.config/spicetify/Extensions/fullScreenDev.js && spicetify apply
# Windows: %appdata%\spicetify\Extensions\
```

Add `fullScreenDev.js` to `extensions =`, then `spicetify apply`.

**Done testing:** Remove `fullScreenDev.js` from config and from the Extensions folder, reinstall Full Screen from Marketplace, `spicetify apply`.

**Pushing:** Commit changes along with the newly generated `dist/fullScreen.js` 
