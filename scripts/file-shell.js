var shell = require('electron').shell;

function openPath(path) {
    shell.showItemInFolder(path);
}

module.exports = {
    openPath: openPath
};