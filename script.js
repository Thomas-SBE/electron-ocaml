
//#region Classes

const Defaults = require("./lib/defaults");

class File{
    constructor(path, id){
        this.path = path;
        this.id = id;
        this.name = this.path.split("/")[this.path.split("/").length - 1];
        this.ext = this.name.split('.')[this.name.split('.').length - 1];
    }
}

class EditSession{
    constructor(file_id, content){
        this.file_id = file_id;
        this.content = content;
        this.unsaved = false;
        this.cursor_pos = -1;
    }
}

class NotificationButton{
    constructor(fname, text){
        this.fname = fname;
        this.text = text;
    }
}

// #endregion

//#region Global Values
let explorer = [];
let current_session_index = -1;
let edit_sessions = [];
let is_switching_state = false;

let config = {};

let term_has_headed = false;

var fitAddon;
var term;

var welcome_message;
//#endregion

//#region Random Values
let explorer_index = 0;

//#endregion

//#region Document Management Close / Load
$(document).ready(function (){

    setSelectedPanel("filesbtn");

    document.getElementById("filestopicon").addEventListener('click', function(){
        ipc.send('add-file-editor');
    });

    ipc.send("startup-session");
    ipc.send("load-settings");

    term = new Terminal({
        theme: {
            background: "transparent"
        },
        fontFamily: "IBM Plex Mono, monospace",
        fontSize: "14"
    });
    fitAddon = new FitAddon(document.getElementById("editorbox"));
    term.setOption("allowTransparency", true);
    term.loadAddon(fitAddon);
    term.open(document.getElementById("term_ocaml"));

    term.onData(e => {
        ipc.send("terminal.stdin", e);
    });

    ipc.on("terminal.stdout", function(event, data) {
        data = data.replaceAll(/^#(.*?)\r\n/gim, "\u001b[38;5;137m#$1\u001b[38;5;251m\r\n");
        data = data.replaceAll(/OCaml\sversion(.*?)\r\n/gim, "\u001b[38;5;120mOcaml version $1\u001b[38;5;251m\r\n")
        term.write(data);
        fitAddon.fit();
        ipc.send("terminal.resized", term.cols, term.rows);
    });

    fitAddon.fit();
    setTimeout(function(){
        term.write("\x1bc");
        ipc.send("terminal.resized", term.cols, term.rows);
    }, 250);
});

window.onbeforeunload = (e) => {
    console.log(edit_sessions);
    e.returnValue = false;
    let unsaved = false;
    for(let i = 0; i < edit_sessions.length; i++){
        if(edit_sessions[i].unsaved){unsaved = true; break;}
    }
    if(unsaved){DisplayNotification('<i class="fas fa-exclamation-triangle"></i> Changements non-sauvegardés', "Certains changements n'ont pas été sauvegarder, quitter l'application mènera a la perte de ces changements !", [new NotificationButton("Notif_CloseNotif()", "Revenir a l'éditeur"), new NotificationButton("leaveApplication()", "Quitter")]);}
    else{leaveApplication();}
};

function leaveApplication(){
    ipc.send("leave-application");
}

//#endregion

//#region Editor Commands
codeEditor.commands.addCommand({
    name: 'saveFile',
    bindKey: {win: 'Control-S',  mac: 'Command-S'},
    exec: function(editor) {
        console.log(explorer);
        saveCurrentFile();
    },
    readOnly: true // false if this command should not apply in readOnly mode
});

function saveCurrentFile(){
    if(current_session_index != -1){
        if(edit_sessions[current_session_index].unsaved){
            edit_sessions[current_session_index].content = codeEditor.getValue();
            ipc.send("save-file-content", edit_sessions[current_session_index].file_id, fetchFileByID(edit_sessions[current_session_index].file_id).path, edit_sessions[current_session_index].content);
        }
    }
}

codeEditor.commands.addCommand({
    name: 'saveAllFile',
    bindKey: {win: 'Control-Alt-S',  mac: 'Command-Alt-S'},
    exec: function(editor) {
        console.log(explorer);
        saveAllFiles();
    },
    readOnly: true // false if this command should not apply in readOnly mode
});

function saveAllFiles(){
    if(current_session_index >= 0){
        edit_sessions[current_session_index].content = codeEditor.getValue();
    }
    for(let i = 0; i < edit_sessions.length; i++){
        if(edit_sessions[i].unsaved){
            ipc.send("save-file-content", edit_sessions[i].file_id, fetchFileByID(edit_sessions[i].file_id).path, edit_sessions[i].content);
        }
    }
}

//#endregion

//#region IPC Events
ipc.on("term-new-line", function(event, data){
    addLineToTerm(data);
});

ipc.on("save-file-content-resp", function(event, fuid){
    let s = fetchSessionByFileID(fuid.toString());
    s.unsaved = false;
    updateDisplayUnsaved(true, fuid);
});

ipc.on("load-settings-resp", function(event, settings, welcome_msg){
    config = settings;
    welcome_message = welcome_msg;

    displayWelcomeMessage();
});

ipc.on("open-file-content-resp", function(event, dict) {
    edit_sessions.push(new EditSession(dict["fuid"], dict["content"]));
    console.log(edit_sessions);
    switchEditSession(dict["fuid"]);
    document.getElementById("nofileopenedoverlay").style.display = "none";
});

ipc.on('add-file-editor-resp', function(event,path){
    let exists = false;
    explorer.forEach(e => {
        if(e.path === path){ console.log("File already exists !"); exists = true; return;}
    });
    if(exists){return;}
    console.log("Added new file to Editor : " + path);
    let f = new File(path, explorer_index++);
    explorer.push(f);
    document.getElementById("filesbox").insertAdjacentHTML('beforeend', '<div class="fbfcontainer" data-value="'+ f.name +'" id="file_'+ f.id +'"><button class="filesboxfile" onclick="openNewFileSession(this)"><span class="file mlfile">'+ f.ext +'</span><span class="fbffilename">'+ f.name +'</span></button><button class="filesboxfileremove" id="" onclick="removeFileFromEditor(this)"><i class="fas fa-times"></i></button></div>')
    sortWorkspace();
});

ipc.on("window-resized", function(event) {
    fitAddon.fit();
    ipc.send("terminal.resized", term.cols, term.rows);
    term.write("\x1bc");
});

//#endregion

//#region Code Editor Events
codeEditor.getSession().on("change", function() {
    if(is_switching_state){return;}
    if(current_session_index != -1){
        edit_sessions[current_session_index].unsaved = true;
        updateDisplayUnsaved(false, edit_sessions[current_session_index].file_id);
    }
});

//#endregion

//#region Editor Functions
function updateDisplayUnsaved(saved, fuid){
    if(saved){
        document.getElementById("file_" + fuid).classList.remove("unsavedfile");
    }else{
        document.getElementById("file_" + fuid).classList.add("unsavedfile");
    }
}

function fetchFileByID(id){
    for(let i = 0; i < explorer.length; i++){
        if(explorer[i].id.toString() === id.toString()){
            return explorer[i];
        }
    }
    return null;
}

function fetchSessionByFileID(id){
    for(let i = 0; i < edit_sessions.length; i++){
        if(edit_sessions[i].file_id.toString() === id.toString()){
            return edit_sessions[i];
        }
    }
    return null;
}

function setSelectedPanel(panelID){
    var childs = document.getElementById("toolbar").children;
    for(var i = 0; i < childs.length; i++){
        let element = childs[i];
        if(element.id === panelID){
            element.children[0].classList.remove("sbicon-color")
            element.children[0].classList.add("gradient");
        }else{
            element.children[0].classList.remove("gradient")
            element.children[0].classList.add("sbicon-color");
        }
    };

    if(panelID === "filesbtn"){
        document.getElementById("editorpanel").classList.remove("hiddenPanel");
        document.getElementById("settingspanel").classList.add("hiddenPanel");
    }else if(panelID === "settingsbtn"){
        document.getElementById("settingspanel").classList.remove("hiddenPanel");
        document.getElementById("editorpanel").classList.add("hiddenPanel");
    }

}

function openNewFileSession(self){
    let id = self.parentNode.getAttribute("id");
    let file = null;
    for(let i = 0; i < explorer.length; i++){
        if(explorer[i].id == id.split("_")[1]){
            file = explorer[i];
            break;
        }
    }
    if(file == null){return;}
    
    // TODO : Check if EditSession does not already exists !
    for(let i = 0; i < edit_sessions.length; i++){
        let e = edit_sessions[i];
        if(e.file_id.toString() === id.split("_")[1]){
            switchEditSession(e.file_id.toString());
            return;
        }
    }

    ipc.send("open-file-content", file.path, file.id);
}

function switchEditSession(file_id){
    let fileId = file_id;
    for(let i = 0; i < edit_sessions.length; i++){
        let e = edit_sessions[i];
        if(e.file_id.toString() === fileId.toString()){
            let file = fetchFileByID(e.file_id);
            is_switching_state = true;
            if(current_session_index >= 0){
                edit_sessions[current_session_index].content = codeEditor.getValue();
                edit_sessions[current_session_index].cursor_pos = codeEditor.getCursorPosition();
                document.getElementById("file_" + edit_sessions[current_session_index].file_id.toString()).classList.remove("currentselectedfile");
            }
            codeEditor.setValue(e.content, -1);
            if(e.cursor_pos != -1){
                codeEditor.moveCursorTo(e.cursor_pos.row, e.cursor_pos.column);
            }
            codeEditor.focus();
            document.getElementById("codeeditorfilename").innerHTML = file.name.toUpperCase();
            document.getElementById("codeeditorheaderpath").innerText = file.path.substring(0, file.path.lastIndexOf('/')).toUpperCase();
            current_session_index = i;
            document.getElementById("file_" + edit_sessions[current_session_index].file_id.toString()).classList.add("currentselectedfile");
            is_switching_state = false;
            document.getElementById("nofileopenedoverlay").style.display = "none";
            break;
        }
    }
}

let awaiting_confirmation_deletion = null;

function removeFileFromEditor(self){
    let id = self.parentNode.getAttribute("id");
    for(let i = 0; i < explorer.length; i++){
        if(explorer[i].id == id.split("_")[1]){
            console.log("Removal : " + id);
            awaiting_confirmation_deletion = self;
            if(fetchSessionByFileID(id.split("_")[1]) != null && fetchSessionByFileID(id.split("_")[1]).unsaved){
                DisplayNotification("Modifications non sauvegardés", "Le contenu de " + fetchFileByID(explorer[i].id).name + " n'est pas sauvegardé, voulez vous vraiment retirer ce fichier de votre espace de travail et perdre les modifications non sauvegardées ?",
                [new NotificationButton("confirmFileRemoval("+i+")", "Retirer quand même"), new NotificationButton("Notif_CloseNotif()", "Revenir a l'édition")],
                false
                );
            }else{
                if(fetchSessionByFileID(id.split("_")[1]) != null && current_session_index >= 0){
                    for(let x = 0; x < edit_sessions.length; x++){
                        if(edit_sessions[x].file_id === fetchSessionByFileID(id.split("_")[1]).file_id){
                            document.getElementById("nofileopenedoverlay").style.display = "flex";
                        }
                    }
                }
                confirmFileRemoval(i);
            }
            break;
        }
    }
}

function confirmFileRemoval(index){
    ipc.send("remove-file-editor", explorer[index].path);
    for(let i = 0; i < edit_sessions.length; i++){
        if(edit_sessions[i].file_id === explorer[index].id){
            edit_sessions.splice(i,1);
            break;
        }
    }
    explorer.splice(index, 1);
    console.log(edit_sessions);
    awaiting_confirmation_deletion.parentNode.remove();
    awaiting_confirmation_deletion = null;
    Notif_CloseNotif();
}

//#endregion

//#region Notifications
function DisplayNotification(title, content, buttonslist, is_large = false){
    document.getElementById("major-notif").style.display = "flex";
    if(is_large){ document.getElementById("major-notif").children[0].style.maxWidth = "50%"; }
    if(title.startsWith("$#")){
        document.getElementById("major-notif-title").style.fontSize = "2em";
        document.getElementById("major-notif-title").style.lineHeight = "2em";
        title = title.substring(2);
    }
    document.activeElement.blur();
    document.getElementById("major-notif-title").innerHTML = title;
    content = formatText(content);
    document.getElementById("major-notif-content").innerHTML = content;
    for(let i = document.getElementById("major-notif-buttons").children.length - 1; i >= 0; i--){
        document.getElementById("major-notif-buttons").children[i].remove();
    }
    if(buttonslist.length <= 0){
        document.getElementById("major-notif-buttons").style.height = "0px";
    }else{
        document.getElementById("major-notif-buttons").style.height = "35px";
    }
    for(let i = 0; i < buttonslist.length; i++){
        let e = buttonslist[i];
        let identity = e.text.replace(" ", "").toLowerCase().trim();
        document.getElementById("major-notif-buttons").insertAdjacentHTML("beforeend", '<button id="'+ identity +'" onclick="'+ e.fname +'">'+ e.text +'</button>');
    }
}

function Notif_CloseNotif(){
    document.getElementById("major-notif").style.display = "none";
}

$("#major-notif").on('click', function(e) {
    if(e.target !== this)
        return;
    Notif_CloseNotif();
})

//#endregion

//#region Display Text Formater

function formatText(text){
    text = text.replace(/\r/g, " ").replace(/\n/g, " ");
    text = text.replaceAll(/#w(.*?)#w;/g, "<span class='text-important'>$1</span>");
    text = text.replaceAll(/##(.*?)##;/g, "<span class='text-title'>$1</span>");
    text = text.replaceAll(/#d(.*?)#d;/g, "<span class='text-discrete'>$1</span>");
    text = text.replaceAll(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    text = text.replaceAll(/\*(.*?)\*/g, "<i>$1</i>");
    text = text.replaceAll("#\\n", "<br/><br/>");
    text = text.replaceAll(/#u(.*?)#u;/g, "<ul>$1</ul>");
    text = text.replaceAll(/#i(.*?)#i;/gim, "<li>$1</li>");
    text = text.replaceAll(/#ic(.*?)#ic;/gim, "<span class='text-inlinecode'>$1</span>");
    return text;
}

//#endregion

//#region Sorting Workspace
function sortWorkspace(){
    let e = $(".fbfcontainer").sort(function(a, b) {
        if(a.getAttribute("data-value") < b.getAttribute("data-value")){
            return -1;
        }else{
            return 1;
        }
    });
    $(".fbfcontainer").remove();
    e.appendTo("#filesbox");
}

//#endregion

//#region Terminal

function addLineToTerm(content, isStdinLine = false){
    content = content.trim();
    if(isStdinLine){
        document.getElementById("term_ocaml").insertAdjacentHTML("beforeend", '<div class="term_line"># '+ content +'</div>');
        return;
    }
    if(content.endsWith("#")){
        content = content.slice(0, -1);
    }
    if(content.startsWith("#")){
        document.getElementById("term_ocaml").insertAdjacentHTML("beforeend", '<br>');
    }else if(content.startsWith("OCaml version")){
        document.getElementById("term_ocaml").insertAdjacentHTML("beforeend", '<div class="term_line term_header">'+ content +'</div>');
    }else if(content === "\n"){
        document.getElementById("term_ocaml").insertAdjacentHTML("beforeend", '<br>');
    }
    else{
        document.getElementById("term_ocaml").insertAdjacentHTML("beforeend", '<div class="term_line term_response">'+ content +'</div>');
    }
}

function sendStatement(statement){
    addLineToTerm(statement, true);
    ipc.send("ocaml-exec-statement", statement);
}

//#endregion

//#region Title bar

function displayWelcomeMessage(){
    DisplayNotification(
        config["welcome"]["title"],
        welcome_message,
        [],
        true
    );
}

//#endregion