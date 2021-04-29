class DynamicElement extends HTMLElement {
    constructor(){
        super();
    }
}

customElements.define('dynamic-element', DynamicElement, {});

$(document).ready(function() {
    ipc.send("load.extensions");

    ipc.on("load.extensions.resp", function(event, data){

        // FETCHES DATA FROM IPC RESPONSE, THE GETS LANGUAGES
        let lang = data["lang"];
        let themes = data["themes"];
        if(lang.length <= 0 && themes.length <= 0){
            console.log("No extension has been found, aborting extension loading...");
            return;
        }

        console.log("Extensions Found, loading extensions...");

        // MAKES THE RESULT LIST IN HTML OF LANGUAGES
        let lang_render = "<ul>";
        for(let i = 0; i < lang.length; i++){
            lang_render += '<li><span class="text-inlinecode">'+ lang[i]["name"].split('.')[0] +'</span> '+ lang[i]["content"]["language.name"] +'</li>'
        }
        lang_render += "</ul>";

        let theme_render = "<ul>";
        for(let i = 0; i < themes.length; i++){
            theme_render += '<li><span class="text-inlinecode">'+ themes[i]["name"].split('.')[0] +'</span> '+ themes[i]["content"]["theme.name"] +'</li>'
        }
        theme_render += "</ul>";

        // APPLIES LANGUAGES LIST IN ALL DYNAMIC ELEMENTS WITH DATA-TYPE = DEFAULT.LANGUAGES
        $("dynamic-element").each(function(i, e){
            if(this.getAttribute("data-type") === "extensions.languages"){
                this.insertAdjacentHTML("beforeend", lang_render);
            }else if(this.getAttribute("data-type") === "extensions.themes"){
                this.insertAdjacentHTML("beforeend", theme_render);
            }
        });
    });
});

