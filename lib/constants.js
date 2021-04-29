const { ipcRenderer, Menu, MenuItem } = require('electron');
const ipc = ipcRenderer;
const { Terminal, ITheme } = require("xterm");
const { FitAddon } = require("./res/js/modifiedXtermFit");