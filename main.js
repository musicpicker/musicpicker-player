var app = require('app');
var Configstore = require('configstore');
var BrowserWindow = require('browser-window');
var Tray = require('tray');
var Menu = require('menu');
var ipc = require('ipc');
var dialog = require('dialog');

var conf = new Configstore('musicpicker-player');
var qs = require('query-string');
var fileUrl = require('file-url');

var Library = require('./library');
var Client = require('./client');

var pickerUrl = require('./package.json').pickerUrl;
var clientId = require('./package.json').pickerClientId;

if(require('electron-squirrel-startup')) return;

var mainWindow = null;
var appIcon = null;

var library = new Library('musicpicker.db');
var client = null;

app.on('window-all-closed', function() {
	if (process.platform != 'darwin') {
		app.quit();
	}
});

function createTray() {
	if (!appIcon) {
		appIcon = new Tray(__dirname + '/musicpicker.png');
	  var contextMenu = Menu.buildFromTemplate([
	    { label: 'Configure paths', click: function() { mainWindow.show() } },
	    { label: 'Exit', click: app.quit }
	  ]);
	  appIcon.setToolTip('Musicpicker');
	  appIcon.setContextMenu(contextMenu);
	  appIcon.on('clicked', function() {
	  	mainWindow.show();
	  });
	}
}

app.on('ready', function() {
	mainWindow = new BrowserWindow({width: 800, height: 600, show: false});
	mainWindow.on('close', function(ev) {
		if (client) {
			ev.preventDefault();
			mainWindow.hide();
		}
	});
	mainWindow.on('closed', function() {
		mainWindow = null;
	});

	function authenticate() {
		mainWindow.loadUrl(pickerUrl + '/oauth/authorize?response_type=token&client_id=' + clientId);
		ipc.on('auth-token', function(ev, bearer) {
			conf.set('bearer', bearer);
			launch();
		})
	}

	if (!conf.get('bearer')) {
		authenticate();
		mainWindow.show();
	}
	else {
		launch();
		if (conf.get('device')) {
			createTray();
		}
		else {
			mainWindow.show();
		}
	}
})

ipc.on('bearer', function(ev) {
	ev.sender.send('bearer', conf.get('bearer'));
});

ipc.on('ready', function(ev) {
	ev.sender.send('paths', conf.get('paths'));
});

ipc.on('path_add', function(ev) {
	dialog.showOpenDialog(mainWindow, {properties: ['openDirectory']}, function(paths) {
		if (!paths) return;

		var confPaths = conf.get('paths');
		if (!confPaths) confPaths = [];
		
		confPaths.push(paths[0]);
		conf.set('paths', confPaths);
		ev.sender.send('paths', conf.get('paths'));
	}.bind(this));
});

ipc.on('path_delete', function(ev, index) {
	var paths = conf.get('paths');
	paths.splice(index, 1);
	conf.set('paths', paths);
	ev.sender.send('paths', conf.get('paths'));
});

ipc.on('device_select', function(ev, deviceId) {
	conf.set('device', deviceId);
	mainWindow.loadUrl('file://' + __dirname + '/ui/app.html#/device/' + deviceId);
	launchClient();
	createTray();
});

function updateLibrary() {
	var regexp = /\.(?:wav|mp3|aac|m4a)$/i
	library.update(conf.get('paths'), regexp);
	library.on('done', function() {
		library.export().then(function(result) {
			client.submit(result);
		})
	})
}

function launch() {
	if (!conf.get('device')) {
		mainWindow.loadUrl('file://' + __dirname + '/ui/app.html#/devices');
	}
	else {
		mainWindow.loadUrl('file://' + __dirname + '/ui/app.html#/device/' + conf.get('device'));
		launchClient();
	}
}

function launchClient() {
	client = new Client(conf.get('bearer'), conf.get('device'));

	updateLibrary();

	client.socket.on('Play', function() {
		mainWindow.webContents.send('audio-play');
	});

	client.socket.on('Pause', function() {
		mainWindow.webContents.send('audio-pause');
	});

	client.socket.on('Stop', function() {
		mainWindow.webContents.send('audio-pause');
	})

	client.socket.on('SetTrackId', function(trackId) {
		library.getTrackPath(trackId).then(function(result) {
			var src = fileUrl(result);
			mainWindow.webContents.send('audio-src', src);
		})
	});

	client.socket.on('RequestNext', function() {
		client.socket.emit('Next', conf.get('device'));
	})

	ipc.on('audio-ended', function() {
		client.socket.emit('Next', conf.get('device'));
	});
}