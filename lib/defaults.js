class Defaults{

    static Lang = {
        "language.name": "English",
        "toolbar.file": "File",
        "toolbar.file.addtoworkspace": "Add to workspace ...",
        "toolbar.file.save": "Save",
        "toolbar.file.copysave": "Save a new copy ...",
        "toolbar.file.saveall": "Save all opened files ...",
        "toolbar.editor": "Editor",
        "toolbar.terminal": "Terminal",
        "toolbar.help": "Help",
        "toolbar.help.welcome": "Welcome",
        "toolbar.help.documentation": "Documentation",
        "toolbar.help.feedback": "Feedback & Issues",
        "sidebar.explorer": "FILE EXPLORER",
        "sidebar.workspace.header": "Workspace",
        "editor.nofileselected": "No file is currently selected",
        "editor.nofileselected.desc": "If no file is in your workspace, click the + icon on the right of",
        "editor.header.editor": "CURRENT FILE",
        "settings.ocaml.header": "OCaml Settings",
        "settings.ocaml.location": "OCaml's location",
        "settings.ocaml.location.desc": "Absolute location of ocaml.exe, the ocaml interpreter, on your computer.",
        "settings.ocamllib.location": "( Optionnal ) OCaml libraries' location",
        "settings.ocamllib.location.desc": "Absolute path of Ocaml libraries' directory, could be necessary on Windows if the interpreter does not found Stdlib.",
        "settings.language.header": "Language",
        "settings.language.lang": "Editor's language",
        "settings.language.extensions": "Available languages extensions",
        "settings.language.lang.desc": "Leaving this field empty will load the defaults language ( English US ). Additionnal languages can be added, reffer to the documentation for more info.",
        "settings.theme.header": "Themes",
        "settings.theme.editor": "Editor's theme",
        "settings.theme.extensions": "Available themes extensions",
        "settings.theme.editor.desc": "Additionnal themes can be added, reffer to the documentation for more info.",
        "settings.apply.need": "Current modifications to settings have not been applied.",
        "settings.apply.warn": "All unsaved modifications will be discarded, save all important changes to your files before applying settings' modifications.",
        "settings.apply.button": "Save settings & restart"
    };

    static Settings = {
        "first_use": true,
        "welcome": {
            "title": "$#🐫 Bienvenue sur ECaml",
            "content": "updatelog.ecft"
        },
        "settings.ocaml.location": "",
        "settings.ocamllib.location": "",
        "settings.language": "en_US",
        "settings.theme": "onedark_default"
    };

    static Constants = {
        "welcome": {
            "content": "updatelog.ecft"
        }
    };

}

module.exports = Defaults;