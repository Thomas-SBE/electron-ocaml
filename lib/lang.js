class LanguageTag extends HTMLElement {
    constructor(){
        super();
    }
}

customElements.define('lang-o', LanguageTag, {});

var lang = {};
var default_lang = {};

ipc.on("load-settings-resp", function(event, config, r){
    if("settings.language" in config){
        console.log("settings.language");
        ipc.send("load-lang", config["settings.language"]);
    }
});

ipc.on("load-lang-resp", function(event, success_code, language, default_language = {}){
    console.log(success_code, language, default_language);
    lang = language;
    default_lang = default_language;
    applyLanguage();
});

function applyLanguage(){
    $("lang-o").each(function(i,e) {
        let code = this.getAttribute("data-lang");
        this.innerText = Lang(code);
    });
}

function Lang(code){
    if(code in lang){
        return lang[code];
    }else{
        return default_lang[code];
    }
}