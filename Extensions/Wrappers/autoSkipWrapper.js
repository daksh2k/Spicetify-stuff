  function addScript(src){
    let script = document.createElement('script')
    script.src = src
    script.defer = true
    script.type = 'text/javascript'
    document.getElementsByTagName('head')[0].appendChild(script)
  }
  addScript("https://daksh2k.github.io/Spicetify-stuff/Extensions/autoSkip.js")