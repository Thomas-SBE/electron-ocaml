// ------------------------------------------------------------
//          ACE EDITOR - ECAML EDITOR SCRIPT
// ------------------------------------------------------------

// -------[ VALUES ]------- 
let codeEditor = ace.edit("camlEditor");
let defaultCode = 'let defaultText = "Coucou";;';

// -------[ Editor Configuration ]-------
let editorLib = {
    init() {
        // Configure Ace

        // Theme
        codeEditor.setTheme("ace/theme/darkone");

        // Set language
        codeEditor.session.setMode("ace/mode/ocaml");

        // Set Options
        codeEditor.setOptions({
            fontSize: '11pt'
        });

        // Set Default Code
        codeEditor.setValue(defaultCode);
    }
}

// -------[ Editor Keybinds ]-------
codeEditor.commands.addCommand({
    name: 'addArrowCaml',
    bindKey: {win: 'Shift-Space',  mac: 'Command-M'},
    exec: function(editor) {
        codeEditor.session.getDocument().insert(codeEditor.getCursorPosition(), "->")
    },
    readOnly: true // false if this command should not apply in readOnly mode
});

// -------[ Editor Events ]-------
codeEditor.session.on("changeScrollTop", function(scr){
    if(scr > 10){
        document.getElementById("editorheader").classList.add("scrolled");
    }else{
        document.getElementById("editorheader").classList.remove("scrolled");
    }
});

// -------[ Final editor initialization ]-------
editorLib.init();

// -------[ Action Buttons ]-------
function sendOcamlFile(){
    if(current_session_index < 0) return;
    let code = codeEditor.getValue();
    let lines = code.split("\n");
    console.log(lines);
    lines.forEach(l => {
        l = l.replaceAll(/\(\*(.*?)\*\)/gim, "");
        if(!(/\S/.test(l)) || l === "\n") return;
        ipc.send("terminal.stdin", l + "\n");
    });
}