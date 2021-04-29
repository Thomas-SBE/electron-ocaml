const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs');
const { electron } = require('process');
const ipc = ipcMain;
const os = require("os");
const pty = require("node-pty");
const Defaults = require("./lib/defaults.js");

let win;
let renderer;
// var shell = os.platform() === "win32" ? "powershell.exe" : "bash";
var ocaml_cmd = "C:\\OCaml64\\home\\Thomas\\.opam\\4.11.1+mingw64c\\bin\\ocaml.exe";
var ocaml_libs = "";
var shell = os.platform() === "win32" ? ocaml_cmd : "ocaml";
var ocamlproc;
var win_active = true;

function createWindow () {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1280,
    minHeight: 720,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: 252525,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html');
  
  win.on("resized", function(){
    win.webContents.send("window-resized");
  });

}

function setupTerminal(){

  shell = os.platform() === "win32" ? ocaml_cmd : "ocaml";

  if(shell == null) return win.webContents.send("terminal.stdout", "\u001b[31;1mocaml.exe is not defined in settings.\u001b[0m");
  let args = (ocaml_libs != null) ? ["-I", ocaml_libs] : [];

  ocamlproc = pty.spawn(shell, args, {
    name: "xterm-color",
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env,
    useConpty: true
  });

  ocamlproc.on("data", (data) => {
    if(!win_active) return;
    win.webContents.send("terminal.stdout", data);
  });

  ipc.on("terminal.stdin", function(event, data){
    ocamlproc.write(data);
  });

  ipc.on("terminal.resized", function(event, x, y){
    ocamlproc.resize(x,y);
  });
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  });
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipc.on('add-file-editor', function(event){
  dialog.showOpenDialog({
    properties: ['openFile']
  }).then( result => {
    if(result.canceled){return;}
    if(editor_files.includes(result.filePaths[0].replace(/\\/g, "/"))){return;}
    editor_files.push(result.filePaths[0].replace(/\\/g, "/"));
    updateEditorFiles();
    event.sender.send("add-file-editor-resp", result.filePaths[0].replace(/\\/g, "/"));
  }).catch( err => {
    console.log(err);
  })
})

ipc.on('remove-file-editor', function(event, path){
  let index = editor_files.findIndex(e => e === path);
  editor_files.splice(index, 1);
  updateEditorFiles();
});

ipc.on('startup-session', function(event) {
  renderer = event;
  fetchLastSession();
  let NotPresentAnymore = []
  let index = 0;
  editor_files.forEach(e => {
    try{
      fs.accessSync(e, fs.constants.F_OK);
      event.sender.send('add-file-editor-resp', e);
    }catch(err){
      NotPresentAnymore.push(index);
    }finally{
      index++;
    }
  });
  for(let i = 0; i < NotPresentAnymore.length; i++){
    editor_files.splice(NotPresentAnymore[i], 1);
  }
  updateEditorFiles();
});


let editor_files = [];

function updateEditorFiles(){
  let data = JSON.stringify(editor_files, null, 2);
  fs.writeFileSync(path.join(__dirname, "configs", "editor_files.json"), data);
}

function fetchLastSession(){
  let raw = fs.readFileSync(path.join(__dirname, "configs", "editor_files.json"));
  editor_files = JSON.parse(raw);
}

ipc.on("open-file-content", function(event, path, fuid){
  let content = fs.readFileSync(path);
  let dict = {"fuid": fuid, "content": content.toString()};
  event.sender.send("open-file-content-resp", dict);
});

ipc.on("save-file-content", function(event, fuid, path, content){
  fs.writeFileSync(path, content);
  event.sender.send("save-file-content-resp", fuid)
});

ipc.on("leave-application", function(event){
  win_active = false;
  win.destroy();
});

ipc.on("load-settings", function(event){
  if(!fs.existsSync(path.join(__dirname, "configs", "editor_settings.json"))){
    fs.writeFileSync(path.join(__dirname, "configs", "editor_settings.json"), Defaults.Settings);
  }
  let raw = fs.readFileSync(path.join(__dirname, "configs", "editor_settings.json"));
  let parsed = JSON.parse(raw);

  // SETTINGS FOR MAIN.JS HERE
  ocaml_cmd = ("settings.ocaml.location" in parsed && parsed["settings.ocaml.location"] != "") ? parsed["settings.ocaml.location"] : null;
  ocaml_libs = ("settings.ocamllib.location" in parsed) ? parsed["settings.ocamllib.location"] : null;

  setupTerminal();

  let welcome_content = fs.readFileSync(parsed.welcome.content).toString();
  event.sender.send("load-settings-resp", parsed, welcome_content);
});

ipc.on("load-lang", function(event, lang_code){
  let defaultparsed = Defaults.Lang;
  try{
    let raw = fs.readFileSync(path.join(__dirname, "extensions", "lang", lang_code+".json"));
    let parsed = JSON.parse(raw);
    event.sender.send("load-lang-resp", 1, parsed, defaultparsed);
    console.log( `Loaded a custom language ${lang_code}.` );
  }catch(err){
    event.sender.send("load-lang-resp", -1, defaultparsed);
    console.log( `Could not find any suitable language, falling back to default en_US.` );
  }
});

ipc.on("load.extensions", function(event){
  let languages = [];
  let themes = [];
  let filesinlanguages = fs.readdirSync(path.join(__dirname, "extensions", "lang"));
  let filesinthemes = fs.readdirSync(path.join(__dirname, "extensions", "themes"));
  filesinlanguages.forEach(function(name){
    let c = fs.readFileSync(path.join(__dirname, "extensions", "lang", name));
    languages.push({"name": name, "content": JSON.parse(c)});
  });
  filesinthemes.forEach(function(name){
    let c = fs.readFileSync(path.join(__dirname, "extensions", "themes", name));
    themes.push({"name": name, "content": JSON.parse(c)});
  });
  let data = {"lang": languages, "themes": themes}
  console.log("Loading extensions : ", data);
  event.sender.send("load.extensions.resp", data);
});

ipc.on("save.settings", function(event, settings){
  let o = JSON.stringify(settings, null, 2);
  fs.writeFileSync(__dirname + "/configs/editor_settings.json", o);
  fs.writeFileSync(path.join(__dirname, "configs", "editor_settings.json"), o);
  app.relaunch()
  app.exit()
});