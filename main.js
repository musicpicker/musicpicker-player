var app = require('app');
var Configstore = require('configstore');
var BrowserWindow = require('browser-window');
var Tray = require('tray');
var Menu = require('menu');
var ipc = require('ipc');
var dialog = require('dialog');
var path = require('path');

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
var willQuit = false;

var library = new Library('musicpicker.db');
var client = null;

app.on('window-all-closed', function() {
	if (process.platform != 'darwin') {
		app.quit();
	}
});

function createTray() {
	if (!appIcon) {
		appIcon = new Tray(path.join(__dirname, '/musicpicker.png'));
	  var contextMenu = Menu.buildFromTemplate([
	    { label: 'Configure paths', click: function() { mainWindow.show() } },
	    { label: 'Exit', click: function() {
		    	willQuit = true;
		    	mainWindow.close();
	    	}.bind(this) }
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
		if (client && !willQuit) {
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

ipc.on('path_dialog', function(ev) {
	dialog.showOpenDialog(mainWindow, {properties: ['openDirectory']}, function(paths) {
		if (!paths) return;
		ev.sender.send('path_dialog', paths[0]);
	});
});

ipc.on('paths_commit', function(ev, paths) {
	conf.set('paths', paths);
	ev.sender.send('paths', conf.get('paths'));
	updateLibrary();
});

ipc.on('paths', function(ev) {
	ev.sender.send('paths', conf.get('paths'));
});

ipc.on('device_select', function(ev, deviceId) {
	conf.set('device', deviceId);
	mainWindow.webContents.send('transitionTo', 'device', {id: deviceId});
	launchClient();
	createTray();
});

function updateLibrary() {
	var regexp = /\.(?:wav|mp3|aac|m4a)$/i
	library.update(conf.get('paths'), regexp);
	library.on('done', function() {
		library.export().then(function(result) {
			client.submit(result);
			mainWindow.webContents.send('update_end');
		})
	})
	library.on('walk_file', function() {
		mainWindow.webContents.send('update_begin');
	});
	library.on('walk_end', function() {
		mainWindow.webContents.send('walk_end');
	});
	library.on('stats', function(stats) {
		mainWindow.webContents.send('update_stats', stats);
	});
	library.on('insertion', function(path, progress) {
		mainWindow.webContents.send('update_insert', progress);
	});
	library.on('removal', function(path, progress) {
		mainWindow.webContents.send('update_removal', progress);
	});
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