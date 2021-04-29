const { Titlebar, Color } = require("custom-electron-titlebar");
const { Menu, MenuItem } = require("electron").remote;
const { ipcRenderer } = require("electron");
const Defaults = require("./lib/defaults");
const fs = require("fs");
const path = require('path');
const url = require('url');

var filemenu;
var titleBar;

var lang = {};
var default_lang = {};

window.addEventListener('DOMContentLoaded', () => {

    let rawsettings = fs.readFileSync(path.join(__dirname, "configs", "editor_settings.json"));
    let parsedsettings = JSON.parse(rawsettings);
    default_lang = Defaults.Lang;
    let lang_code = "en_US";
    if("settings.language" in parsedsettings) { lang_code = parsedsettings["settings.language"]; }
    let language = {};
    try{
        let raw = fs.readFileSync(path.join(__dirname, "extensions", "lang", lang_code+".json"));
        let parsed = JSON.parse(raw);
        language = parsed;
        console.log( `Loaded a custom language ${lang_code}.` );
    } catch(err) {
        language = default_lang;
        console.log( `Could not find any suitable language, falling back to default language.` );
    }

    lang = language;

    filemenu = new Menu();
    filemenu.append(new MenuItem({
        label: Lang("toolbar.file"),
        submenu: [
            {
                label: Lang("toolbar.file.addtoworkspace"),
                accelerator: "Ctrl+N",
                click: () => ipc.send('add-file-editor')
            },
            {
                type: "separator"
            },
            {
                label: Lang("toolbar.file.save"),
                accelerator: "Ctrl+S",
                click: () => saveCurrentFile()
            },
            {
                label: Lang("toolbar.file.copysave"),
                accelerator: "Ctrl+Shift+S"
            },
            {
                label: Lang("toolbar.file.saveall"),
                accelerator: "Ctrl+Alt+S",
                click: () => saveAllFiles()
            }
        ]
    }));

    filemenu.append(new MenuItem({
        label: Lang("toolbar.editor"),
        submenu: [

        ]
    }));

    filemenu.append(new MenuItem({
        label: Lang("toolbar.terminal"),
        submenu: [

        ]
    }));

    filemenu.append(new MenuItem({
        label: lang["toolbar.help"],
        submenu: [
            {
                label: Lang("toolbar.help.welcome"),
                click: () => displayWelcomeMessage()
            },
            {
                label: Lang("toolbar.help.documentation")
            },
            {
                type: "separator"
            },
            {
                label: Lang("toolbar.help.feedback")
            }
        ]
    }));

    titleBar = new Titlebar({
        backgroundColor: Color.fromHex("#292E36"),
        icon: url.format(path.join(__dirname, "/res", "/svg", "/camel.svg")),
        menu: filemenu,
        unfocusEffect: true
    });
    
    titleBar.updateTitle("ECaml");

    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }


});

function Lang(code) {
    if(code in lang){
       return lang[code];
    }else{
       return default_lang[code];
    }
}