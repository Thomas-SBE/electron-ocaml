// --------------------------------------------
//          SETTINGS PANEL SCRIPT
// --------------------------------------------

let settings_in_panel = ["settings.theme", "settings.language", "settings.ocaml.location", "settings.ocamllib.location"];

ipc.on("load-settings-resp", function(event, settings){
    settings_in_panel.forEach(function (e) {
        $(`input[name="${e}"]`).val(settings[`${e}`]);
    });
});

function saveSettings(btn = null){
    if(btn != null){
        btn.blur();
    }
    console.log(config);
    settings_in_panel.forEach(function (e) {
        config[e] = $(`input[name="${e}"]`).val();
    });
    ipc.send("save.settings", config);
}

let hasChanges = false;

function makeChangesSettingsPopupAppear(){
    if(hasChanges) return;
    let heightblock = document.getElementsByClassName("save_settings_block")[0].clientHeight;
    $(".save_settings_block").css({bottom: `-${heightblock+50}px`});
    hasChanges = true;
    $(".save_settings_block").animate({bottom: "50px"});
}
