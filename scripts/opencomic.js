//console.time('Starting time');

//console.time('Require time 1');
/*
window.onerror = function(msg, url, linenumber) {

    alert('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
    return true;

}*/

var wideToggle = 0;
var widths = [0, .05, .1, .15, .2, .25];

document.addEventListener("keydown", event => {

	if(event.key == 'Escape')
	{
		if(electron.remote.getCurrentWindow().isFullScreen())
		{
			reading.hideContent(false);
			electron.remote.getCurrentWindow().setFullScreen(false);
			electron.remote.getCurrentWindow().setMenuBarVisibility(true)
		}
	}

});


window.addEventListener('error', function(evt) {

	var error = false;

	if(evt.message)
		error = 'Error: '+evt.message +' at linenumber '+evt.lineno+':'+evt.colno+' of file '+evt.filename;

	if(error !== false)
	{
		if(electron.remote.dialog)
		{
			electron.remote.dialog.showMessageBox({
				type: 'error',
				title: 'Linenumber '+evt.lineno+':'+evt.colno,
				message: error,
				detail: evt.error.stack ? evt.error.stack : error,
			});
		}
		else if(evt.filename || evt.lineno || evt.colno)
		{
			alert(error+(evt.error.stack ? ' '+evt.error.stack : ''));
		}
	}

}, true);

document.addEventListener("mouseup", function (event) {
	console.log(event.button);
	if (event.button === 3) {
		$(".bar-back, .show").trigger('click');
	}
});

document.addEventListener("keyup", function (event) {
	if (event.key === "F13") {
		let onReading = reading.onReading();

		if (!onReading) {
			let paths = [dom.currentPath, dom.indexMainPathA()];
			for (path in paths) {
				if (path) {
					fileShell.openPath(dom.indexMainPathA());
					return;
				}
			}
			console.log('unable to get path');
		}
		else if (onReading){
			wideToggle = (wideToggle + 1) % widths.length;
			var newTransform = 1 + widths[wideToggle];
			document.getElementsByClassName("content-right")[0].style.transform = "scaleX(" + newTransform + ")";
		}
	}
});



const electron = require('electron'),
	fs = require('fs'),
	fse = require('fs-extra'),
	hb = require('handlebars'),
	os = require('os'),
	ejs = require('electron-json-storage'),
	mime = require('mime'),
	sha1 = require('sha1'),
	p = require('path'),
	$ = require('jquery');

require('jquery-bez');

//console.timeEnd('Require time 1');

var testVar = 'test';

var handlebarsContext = {};
var language = {};
var config = false, _config = false;
var onReading = _onReading = false;
var readingTouchEvent = false;

var appDir = p.join(__dirname, '../');

var _package = $.parseJSON(readFileApp('package.json'));

handlebarsContext.packageJson = _package;

var compatibleMime = [
	'image/jpeg',
	'image/pjpeg',
	'image/png',
	'image/apng',
	'image/svg',
	'image/svg+xml',
	'image/gif',
	'image/x-ms-bmp',
	'image/bmp',
	'image/x-icon',
	'image/vnd.microsoft.icon',
	'image/webp',
	'image/avif',
	'image/avif-sequence',
];

var compressedMime = {
	'all': [
		'application/zip',
		'application/x-cbz',
		'application/x-zip',
		'application/x-zip-compressed',
		'application/rar',
		'application/x-cbr',
		'application/x-rar',
		'application/x-rar-compressed',
		'application/7z',
		'application/x-cb7',
		'application/x-7z',
		'application/x-7z-compressed',
		'application/tar',
		'application/x-cbt',
		'application/x-tar',
		'application/x-tar-compressed',
	],
	'zip': [
		'application/zip',
		'application/x-cbz',
		'application/x-zip',
		'application/x-zip-compressed',
	],
	'rar': [
		'application/rar',
		'application/x-cbr',
		'application/x-rar',
		'application/x-rar-compressed',
	],
	'7z': [
		'application/7z',
		'application/x-cb7',
		'application/x-7z',
		'application/x-7z-compressed',
	],
	'tar': [
		'application/tar',
		'application/x-cbt',
		'application/x-tar',
		'application/x-tar-compressed',
	],
	'pdf': [
		'application/pdf',
		'application/x-bzpdf',
		'application/x-gzpdf',
	],
};


var compressedExtensions = {
	'all': [
		'zip',
		'cbz',
		'rar',
		'cbr',
		'7z',
		'cb7',
		'tar',
		'cbt',
		'pdf',
	],
	'zip': [
		'zip',
		'cbz',
	],
	'rar': [
		'rar',
		'cbr',
	],
	'7z': [
		'7z',
		'cb7',
	],
	'tar': [
		'tar',
		'cbt',
	],
	'pdf': [
		'pdf',
	],
};

var compatibleExtensions = [
	/*jpeg*/'jpg', 'jpeg', 'jif', 'jfi', 'jfif', 'jfif-tbnl', 'jpe', 
	/*png*/'png', 'x-png', 'apng',
	/*svg*/'svg', 'svgz',
	/*gif*/'gif',
	/*bmp*/'bmp', 'dib',
	/*ico*/'ico',
	/*webp*/'webp',
	/*avif*/'avif', 'avifs',
	/*compressed*/'zip', 'cbz', 'rar', 'cbr', '7z', 'cb7', 'tar', 'cbt', 'pdf',
];

//console.time('Require time 2');

const storage = require(p.join(appDir, 'scripts/storage.js')),
	cache = require(p.join(appDir, 'scripts/cache.js')),
	queue = require(p.join(appDir, 'scripts/queue.js')),
	templates = require(p.join(appDir, 'scripts/builded/templates.js')),
	template = require(p.join(appDir, 'scripts/template.js')),
	dom = require(p.join(appDir, 'scripts/dom.js')),
	events = require(p.join(appDir, 'scripts/events.js')),
	file = require(p.join(appDir, 'scripts/file.js')),
	fileCompressed = require(p.join(appDir, 'scripts/file-compressed.js')),
	reading = require(p.join(appDir, 'scripts/reading.js')),
	fileShell = require(p.join(appDir, 'scripts/file-shell.js')),
	tracking = require(p.join(appDir, 'scripts/tracking.js')),
	trackingSites = require(p.join(appDir, 'scripts/tracking/tracking-sites.js'));

var tempFolder = p.join(os.tmpdir(), 'opencomic');
if(!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);

//console.timeEnd('Require time 2');

storage.start(function(){

	config = storage.get('config');
	_config = copy(config);
	handlebarsContext.config = config;

	if(config.zoomFactor != 1)
		electron.webFrame.setZoomFactor(Math.round(config.zoomFactor * 100) / 100);

	loadLanguage(config.language);

	template.loadInQuery('body', 'body.html');

	startApp();

});

function startApp()
{
	template.loadContentRight('index.content.right.module.html', false);
	template.loadHeader('index.header.html', false);
	template.loadContentLeft('index.content.left.html', false);
	template.loadGlobalElement('index.elements.menus.html', 'menus');

	if(electron.remote.process.argv && electron.remote.process.argv[1] && !inArray(electron.remote.process.argv[1], ['--no-sandbox', 'scripts/main.js', '.']) && fs.existsSync(electron.remote.process.argv[1]))
		openComic(electron.remote.process.argv[1], false);
	else
		dom.loadIndexPage(false);

	document.fonts.onloadingdone = function (fontFaceSetEvent) {

		$('body .app').css('display', 'block');
		$('body .preload').css('display', 'none');
		dom.justifyViewModule();

		if(onReading)
		{
			reading.disposeImages();
			reading.calculateView();
			reading.stayInLine();
		}

	};

}

/*Global functions*/

function copy(data) {

	return JSON.parse(JSON.stringify(data));

}

function inArray(string, array)
{
	return (array.indexOf(string) != -1) ? true : false;
}

function fileExtension(path)
{
	return p.extname(path).replace(/^\./, '').toLowerCase();
}

function pregQuote(str, delimiter = false)
{
	return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
}

function mousePosition(e, mode)
{
	if(mode == 'x')
		return e.originalEvent.touches ? e.originalEvent.touches[0].pageX : (e.pageX ? e.pageX : e.clientX);
	else
		return e.originalEvent.touches ? e.originalEvent.touches[0].pageY : (e.pageY ? e.pageY : e.clientY);
}

function htmlEntities(str)
{
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function htmlQuote(str)
{
	return String(str).replace(/"/g, '&quot;');
}

function escapeQuotes(str, mode = false)
{
	if(mode === 'simples')
		return String(str).replace(/'/g, '\\\'');
	else if(mode === 'doubles')
		return String(str).replace(/"/g, '\\\"');
	else
		return String(str).replace(/'/g, '\\\'').replace(/"/g, '\\\"');
}

function escapeRegExp(string)
{
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readFileApp(file)
{
	return fs.readFileSync(p.join(appDir, file), 'utf8');
}

function readFile(file)
{
	return fs.readFileSync(file, 'utf8');
}

function existsFileApp(file)
{
	return fs.existsSync(p.join(appDir, file))
}

function existsFile(file)
{
	return fs.existsSync(file)
}

function loadLanguageMD(hbc, obj)
{
	for(let key in obj)
	{
		if(Array.isArray(obj[key]))
		{
			hbc[key] = obj[key];
		}
		else if(typeof obj[key] == 'object')
		{
			if(!hbc[key])
				hbc[key] = {};

			loadLanguageMD(hbc[key], obj[key]);
		}
		else
		{
			hbc[key] = obj[key];
		}
	}
}

function time()
{
	return Math.floor(Date.now() / 1000);
}

function loadLanguage(lan = false)
{
	language = $.parseJSON(readFileApp('./languages/es.json'));
	loadLanguageMD(language, $.parseJSON(readFileApp('./languages/en.json')));

	handlebarsContext.language = language;

	if(lan && existsFileApp('./languages/'+lan+'.json'))
	{
		loadLanguageMD(language, $.parseJSON(readFileApp('./languages/'+lan+'.json')));

		generateAppMenu(true);
		generateAppMenuShortcut();
	}
}

function asarToAsarUnpacked(path)
{
	if(!/app\.asar\.unpacked/.test(path))
	{
		var pathUnpacked = path.replace(/app\.asar/, 'app.asar.unpacked');

		if(fs.existsSync(pathUnpacked)) path = pathUnpacked;
	}

	return path;
}

function zoomIn()
{
	var factor = electron.webFrame.getZoomFactor();

	if(factor >= 3)
		factor += 1;
	else if(factor >= 2)
		factor += 1;
	else if(factor >= 1.25)
		factor += 0.25;
	else if(factor >= 1.10)
		factor += 0.15;
	else
		factor += 0.10;

	if(factor > 5)
		factor = 5;
	else if(factor < 0.50)
		factor = 0.50;

	storage.updateVar('config', 'zoomFactor', factor);

	electron.webFrame.setZoomFactor(Math.round(factor * 100) / 100);
}

function zoomOut()
{
	var factor = electron.webFrame.getZoomFactor();

	if(factor > 3)
		factor -= 1;
	else if(factor > 2)
		factor -= 1;
	else if(factor > 1.25)
		factor -= 0.25;
	else if(factor > 1.10)
		factor -= 0.15;
	else
		factor -= 0.10;

	if(factor > 5)
		factor = 5;
	else if(factor < 0.50)
		factor = 0.50;

	storage.updateVar('config', 'zoomFactor', factor);

	electron.webFrame.setZoomFactor(Math.round(factor * 100) / 100);
}

function resetZoom()
{
	storage.updateVar('config', 'zoomFactor', 1);

	electron.webFrame.setZoomLevel(0);
}

function generateAppMenuShortcut()
{
	electron.remote.globalShortcut.unregisterAll();
	/*electron.remote.globalShortcut.register('CmdOrCtrl+O', function(){openComicDialog()});
	electron.remote.globalShortcut.register('CmdOrCtrl+Q', function(){electron.remote.app.quit()});
	electron.remote.globalShortcut.register('CmdOrCtrl+0', function(){resetZoom(); generateAppMenu();});
	electron.remote.globalShortcut.register('CmdOrCtrl+Shift+0', function(){resetZoom(); generateAppMenu();});
	electron.remote.globalShortcut.register('CmdOrCtrl+Plus', function(){zoomIn(); generateAppMenu();});
	electron.remote.globalShortcut.register('CmdOrCtrl+=', function(){zoomIn(); generateAppMenu();});
	electron.remote.globalShortcut.register('CmdOrCtrl+-', function(){zoomOut(); generateAppMenu();});
	electron.remote.globalShortcut.register('CmdOrCtrl+Shift+-', function(){zoomOut(); generateAppMenu();});*/
}

var generateAppMenuData = {resetZoom: null, onReading: null};

function generateAppMenu(force = false)
{
	if(force || generateAppMenuData.resetZoom !== electron.webFrame.getZoomFactor() || generateAppMenuData.onReading !== onReading)
	{
		generateAppMenuData = {resetZoom: electron.webFrame.getZoomFactor(), onReading: onReading};

		var menuTemplate = [
			{
				label: language.menu.file.main,
				submenu: [
					{label: language.menu.file.openFile, click: function(){openComicDialog()}, accelerator: 'CmdOrCtrl+O'},
					{label: language.menu.file.openFolder, click: function(){openComicDialog(true)}, accelerator: 'CmdOrCtrl+Shift+O'},
					{label: language.menu.file.addFile, click: function(){addComic()}},
					{label: language.menu.file.addFolder, click: function(){addComic(true)}},
					{type: 'separator'},
					{role: 'quit', label: language.menu.file.quit},
				]
			},
			{
				label: language.menu.view.main,
				submenu: [
					{label: language.menu.view.resetZoom, enabled: (electron.webFrame.getZoomFactor() != 1 ? true : false), click: function(){resetZoom(); generateAppMenu();}, accelerator: 'CmdOrCtrl+0'},
					{label: language.menu.view.zoomIn, click: function(){zoomIn(); generateAppMenu();}, accelerator: 'CmdOrCtrl+Plus'},
					{label: language.menu.view.zoomOut, click: function(){zoomOut(); generateAppMenu();}, accelerator: 'CmdOrCtrl+-'},
					{type: 'separator'},
					{label: language.menu.view.toggleFullScreen, click: function(){var win = electron.remote.getCurrentWindow(); reading.hideContent(!win.isFullScreen()); win.setMenuBarVisibility(win.isFullScreen()); win.setFullScreen(!win.isFullScreen());}, accelerator: 'F11'},
				]
			},
			{
				label: language.menu.goto.main,
				submenu: [
					{label: language.reading.firstPage, enabled: onReading, click: function(){reading.goStart();}, accelerator: 'Home'},
					{label: language.reading.previous, enabled: onReading, click: function(){reading.goPrevious();}, accelerator: 'Backspace'},
					{label: language.reading.next, enabled: onReading, click: function(){reading.goNext();}, accelerator: 'Space'},
					{label: language.reading.lastPage, enabled: onReading, click: function(){reading.goEnd();}, accelerator: 'End'},
					{label: 'Next chapter', enabled: onReading, click: function(){reading.goEnd();}, accelerator: 'Ctrl+End'},
				]
			},
			{
				label: language.menu.debug.main,
				submenu: [
					{role: 'reload', label: language.menu.debug.reload},
					{role: 'forceReload', label: language.menu.debug.forceReload},
					{role: 'toggleDevTools', label: language.menu.debug.toggleDevTools},
				]
			},
			{
				label: language.menu.help.main,
				submenu: [
					{label: language.menu.help.about, click: function(){showAboutWindow();}},
				]
			}
		];

		var menu = electron.remote.Menu.buildFromTemplate(menuTemplate);
		electron.remote.getCurrentWindow().setMenu(menu);
	}
}

var about = false;

function showAboutWindow()
{
	var about = new electron.remote.BrowserWindow({
		show: false,
		title: language.menu.help.about,
		width: 380,
		height: 260,
		minWidth: 380,
		minHeight: 260,
		//resizable: false,
		modal: true,
		parent: electron.remote.getCurrentWindow(),
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
		},
	});

	about.removeMenu();
	about.setMenuBarVisibility(false);

	var url = require('url');

	about.loadURL(url.format({
		pathname: p.join(appDir, './templates/about.html'),
		protocol: 'file:',
		slashes: true
	}));

	about.once('ready-to-show', function() {
	
		about.webContents.executeJavaScript('document.querySelector(\'body\').innerHTML = `'+template.load('about.body.html')+'`;', false).then(function(){

			about.show();

		});

	});
}

function removeTemporaryFiles()
{
	try
	{
		fse.emptyDirSync(tempFolder);
	}
	catch(error)
	{
		console.error(error);
	}
}

function escapeBackSlash(string)
{
	return string.replace(/\\+/g, '\\\\');
}

function invertBackslash(string)
{
	return string.replace(/\\+/g, '/');
}

function encodeSrcURI(string)
{
	let segments = string.split(p.sep);

	for(let i in segments)
	{
		if(i != 0)
			segments[i] = encodeURIComponent(segments[i]);
		else
			segments[i] = segments[i];
	}

	return segments.join(p.sep);
}

function toUnixPath(string)
{
	return string.replace(/\\+/g, '/').trim().replace(/^c\:/ig, '/');
}

function joinRegexs(regexs)
{
	var _regexs = [];

	for(let key in regexs)
	{
		_regexs.push(regexs[key].source);
	}

	return new RegExp(_regexs.join('|'));
}

function extract(code, string, value)
{
	string = string.match(code);
	return (string !== null && typeof string[value] != 'undefined') ? string[value] : '';
}

function isEmpty(mixedVar)
{
	var undef, key, i, len, emptyValues = [undef, null, false, 0, '', '0'];

	for(var i = 0, len = emptyValues.length; i < len; i++)
	{
		if(mixedVar === emptyValues[i])
		{
			return true
		}
	}

	if(typeof mixedVar === 'undefined')
	{
		return true
	}

	if(typeof mixedVar === 'object')
	{
		for(key in mixedVar)
		{
			if (mixedVar.hasOwnProperty(key))
			{
				return false
			}
		}

		return true
	}
}

function matchArray(string, array)
{
	for(var i = 0; i < array.length; i++)
	{
		if(string.match(array))
		{
			return true;
		}
	}

	return false;
}

function callbackString(callback)
{
	var func = new Function(callback);
	func();
}

/*Handlebars helpers*/

hb.registerHelper('chain', function() {

	var helpers = [], value;

	$.each(arguments, function (i, arg) {

		if(hb.helpers[arg])
		{
			helpers.push(hb.helpers[arg]);
		}
		else
		{
			value = arg;

			$.each(helpers, function (j, helper) {
				value = helper(value, arguments[i + 1]);
			});

			return false;
		}
	});

	return value;
});

hb.registerHelper('compare', function(lvalue, operator, rvalue, options) {

	var operators = {
		'==':	function(l,r) { return l == r; },
		'===':	function(l,r) { return l === r; },
		'!=':	function(l,r) { return l != r; },
		'!==':	function(l,r) { return l !== r; },
		'<':	function(l,r) { return l < r; },
		'>':	function(l,r) { return l > r; },
		'<=':	function(l,r) { return l <= r; },
		'>=':	function(l,r) { return l >= r; },
		'typeof':	function(l,r) { return typeof l == r; }
	}

	var result = operators[operator](lvalue,rvalue);

	if(result)
		return options.fn(this);
	else
		return options.inverse(this);

});

hb.registerHelper('for', function(from, to, incr, options) {

	var accum = '';

	for(var i = from; i < to; i += incr)
		accum += options.fn(i);

	return accum;

});

hb.registerHelper('escapeQuotes', function(string) {

	return escapeQuotes(string);

});

hb.registerHelper('escapeQuotesSimples', function(string) {

	return escapeQuotes(string, 'simples');

});

hb.registerHelper('escapeQuotesDoubles', function(string) {

	return escapeQuotes(string, 'doubles');

});

hb.registerHelper('escapeBackSlash', function(string) {

	return escapeBackSlash(string);

});

hb.registerHelper('toUnixPath', function(string) {

	return toUnixPath(string);

});

hb.registerHelper('invertBackslash', function(string) {

	return invertBackslash(string);

});

hb.registerHelper('isEmpty', function(obj) {

	return isEmpty(obj);

});

hb.registerHelper('encodeURI', function(string) {

	return encodeURI(string);

});

hb.registerHelper('encodeSrcURI', function(string) {

	return encodeSrcURI(string);

});

hb.registerHelper('normalizeNumber', function(value, decimals) {

	value = String(value);

	var num_v = String(value).replace(/.*?(\.|$)/, '').length;

	var num_d = decimals.replace(/.*?(\.|$)/, '').length;

	if(num_d != 0)
		value = value+(/\./.test(value) ? '' : '.')+('0'.repeat(num_d - num_v));

	return value;

});

hb.registerHelper('htmlEntities', function(string) {

	return htmlEntities(string);

});

hb.registerHelper('htmlQuote', function(string) {

	return htmlQuote(string);

});

hb.registerHelper('configIsTrue', function(key, value) {

	if(config[key] == value)
	{
		return true;
	}
	else
	{
		return false;
	}

});

function pathIsSupported(path)
{
	if(inArray(mime.getType(path), compatibleMime) || inArray(fileExtension(path), compressedExtensions.all) || fs.statSync(path).isDirectory())
		return true;

	return false;
}

function openComicDialog(folders = false)
{
	if(folders)
		var properties = ['openDirectory'];
	else
		var properties = ['openFile'];

	var dialog = electron.remote.dialog;

	dialog.showOpenDialog({properties: properties, filters: [{name: language.global.comics, extensions: (folders) ? ['*'] : compatibleExtensions}]}).then(function (files) {

		if(files.filePaths && files.filePaths[0])
			openComic(files.filePaths[0]);

	});

}

function openComic(filePath, animation = true)
{
	if(pathIsSupported(filePath))
	{
		var selectImage = false, path = false, mainPath = false;

		if(fs.statSync(filePath).isDirectory())
		{
			path = filePath;
		}
		else
		{
			if(inArray(mime.getType(filePath), compatibleMime))
			{
				selectImage = true;
				path = filePath;

				filePath = p.dirname(filePath);

				mainPath = filePath;
			}
			else
			{
				path = filePath;
			}
		}

		if(mainPath === false)
			mainPath = path;

		if(onReading)
			reading.saveReadingProgress();

		if(selectImage)
			dom.openComic(animation, path, mainPath);
		else
			dom.loadIndexPage(animation, path, false, false, mainPath);
	}
}

function addComic(folders = false)
{
	if(folders)
		var properties = ['openDirectory', 'multiSelections'];
	else
		var properties = ['openFile', 'multiSelections'];

	var dialog = electron.remote.dialog;

	dialog.showOpenDialog({properties: properties, filters: [{name: language.global.comics, extensions: (folders) ? ['*'] : compatibleExtensions}]}).then(function(files) {

		var added = false;

		for(let i in files.filePaths)
		{
			var filePath = files.filePaths[i];

			if(pathIsSupported(filePath))
			{
				if(fs.statSync(filePath).isDirectory())
				{
					var name = p.basename(filePath);
					var path = filePath;
					var compressed = false;
				}
				else
				{
					if(inArray(mime.getType(filePath), compatibleMime))
					{
						filePath = p.dirname(filePath);

						var name = p.basename(filePath);
						var path = filePath;
						var compressed = false;
					}
					else
					{
						var name = p.basename(filePath).replace(/\.[^\.]*$/, '');
						var path = filePath;
						var compressed = true;
					}
				}

				var comics = storage.get('comics');

				var exists = false;

				for(var key in comics)
				{
					if(comics[key].path == path)
					{
						exists = true;

						break;
					}
				}

				if(!exists)
				{
					storage.push('comics', {
						name: name,
						path: path,
						added: time(),
						compressed: compressed,
						folder: true,
						readingProgress: {
							path: 'Path',
							lastReading: 0,
							progress: 0,
						},
					});

					added = true;
				}
			}
		}

		if(added)
		{
			if(onReading)
				reading.saveReadingProgress();

			dom.loadIndexPage(true);
		}

	});

}

//Cheack errors

function checkError(value, error = false)
{
	if(value && typeof value.error != 'undefined')
	{
		if(error && value.error == error)
			return true;
		else if(!error)
			return true;
	}

	return false;
}

//Errors list 

const NOT_POSSIBLE_WITHOUT_DECOMPRESSING = 1;
const ERROR_UNZIPPING_THE_FILE = 2;
