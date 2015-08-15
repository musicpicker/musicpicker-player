var Fluxxor = require('fluxxor');
var ipc = window.require('ipc');

actions = {
	provideConfig: function(bearer, deviceId) {
		this.dispatch('CONFIG', {bearer: bearer, deviceId: deviceId})
	},
	selectDevice: function(deviceId) {
		this.dispatch('DEVICE_SELECT', deviceId);
	},
	unselectDevice: function() {
		this.dispatch('DEVICE_UNSELECT');
	},
	addPath: function() {
		this.dispatch('PATHS_ADD');
	},
	deletePath: function(index) {
		this.dispatch('PATHS_DELETE', index);
	},
	setPaths: function(paths) {
		this.dispatch('PATHS_SET', paths);
	}
}

var PathsStore = Fluxxor.createStore({
	paths: [],

	actions: {
		'PATHS_SET': 'setPaths',
		'PATHS_ADD': 'addPath',
		'PATHS_DELETE': 'deletePath'
	},

	setPaths: function(paths) {
		if (paths === null) {
			paths = [];
		}
		this.paths = paths;
		this.emit('change');
	},

	addPath: function() {
		ipc.send('addPath');
	},

	deletePath: function(index) {
		ipc.send('deletePath', index);
	}
});

var AuthStore = Fluxxor.createStore({
	bearer: null,
	deviceId: null,

	actions: {
		'CONFIG': 'provideConfig',
		'DEVICE_SELECT': 'selectDevice',
		'DEVICE_UNSELECT': 'unselectDevice'
	},

	provideConfig: function(payload) {
		this.bearer = payload.bearer;
		ipc.send('bearerProvided');

		if (payload.deviceId !== null) {
			this.deviceId = payload.deviceId;
			ipc.send('deviceSelected', payload.deviceId);
		}

		this.emit('change');
	},

	selectDevice: function(deviceId) {
		this.deviceId = deviceId;
		ipc.send('deviceSelected', deviceId);
		this.emit('change');
	},

	unselectDevice: function() {
		this.deviceId = null;
		ipc.send('deviceUnselected');
		this.emit('change');
	}
})

var flux = new Fluxxor.Flux({
	AuthStore: new AuthStore(),
	PathsStore: new PathsStore()
}, actions);

ipc.send('fetchConfig');
ipc.on('config', function(bearer, deviceId) {
	flux.actions.provideConfig(bearer, deviceId);
	ipc.send('fetchPaths');
})

ipc.on('paths', function(paths) {
	console.log(paths);
	flux.actions.setPaths(paths);
}.bind(this))

module.exports.flux = flux;