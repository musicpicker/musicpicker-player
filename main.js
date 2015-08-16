var app = require('app');
var Configstore = require('configstore');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var dialog = require('dialog');

var conf = new Configstore('musicpicker-player');
var qs = require('query-string');
var fileUrl = require('file-url');

var Library = require('./library');
var Client = require('./client');

if(require('electron-squirrel-startup')) return;

var mainWindow = null;

var library = new Library('musicpicker.db');
var client = null;

app.on('window-all-closed', function() {
	if (process.platform != 'darwin') {
		app.quit();
	}
});

app.on('ready', function() {
	mainWindow = new BrowserWindow({width: 800, height: 600});
	mainWindow.on('closed', function() {
		mainWindow = null;
	});

	function authenticate() {
		mainWindow.loadUrl('http://localhost:3000/oauth/authorize?response_type=token&client_id=gqWGw0AddN_8IW6NHeyjU89goCb6m4m5xqZ1-Dgpca_oH8uV3JUgS6DD');
		ipc.on('auth-token', function(ev, bearer) {
			conf.set('bearer', bearer);
			launch();
		})
	}

	if (!conf.get('bearer')) {
		authenticate();
	}
	else {
		launch();
	}
})

ipc.on('fetchConfig', function(ev) {
	ev.sender.send('config', conf.get('bearer'), conf.get('device'));
});

ipc.on('fetchPaths', function(ev) {
	ev.sender.send('paths', conf.get('paths'));
});

ipc.on('addPath', function(ev) {
	console.log('ADD PATH');
	dialog.showOpenDialog(mainWindow, {properties: ['openDirectory']}, function(paths) {
		var confPaths = conf.get('paths');
		if (!confPaths) {
			confPaths = [];
		}
		confPaths.push(paths[0]);
		conf.set('paths', confPaths);
		ev.sender.send('paths', conf.get('paths'));
	}.bind(this));
});

ipc.on('deletePath', function(ev, index) {
	var paths = conf.get('paths');
	paths.splice(index, 1);
	conf.set('paths', paths);
	ev.sender.send('paths', conf.get('paths'));
});

function updateLibrary() {
	var regexp = /\.(?:wav|mp3|aac|m4a)$/i
	library.update(conf.get('paths'), regexp);
	library.on('done', function() {
		console.log('LIBRARY DONE');
		library.export().then(function(result) {
			client.submit(result);
		})
	})
}

function launch() {
	mainWindow.loadUrl('file://' + __dirname + '/ui/app.html');

	ipc.on('deviceSelected', function(ev, deviceId) {
		conf.set('device', deviceId);
		client = new Client(conf.get('bearer'), conf.get('device'));

		updateLibrary();

		client.socket.on('Play', function() {
			console.log('Play');
			mainWindow.webContents.send('audio-play');
		});

		client.socket.on('Pause', function() {
			console.log('Pause');
			mainWindow.webContents.send('audio-pause');
		});

		client.socket.on('Stop', function() {
			mainWindow.webContents.send('audio-pause');
		})

		client.socket.on('SetTrackId', function(trackId) {
			console.log('SetTrack ' + trackId);
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
	}.bind(this));
}