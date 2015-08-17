var Fluxxor = require('fluxxor');
var ipc = window.require('ipc');

actions = {
	provideBearer: function(bearer) {
		this.dispatch('BEARER', bearer)
	},
	setPaths: function(paths) {
		this.dispatch('PATHS_SET', paths);
	}
}

var PathsStore = Fluxxor.createStore({
	paths: [],

	actions: {
		'PATHS_SET': 'setPaths'
	},

	setPaths: function(paths) {
		if (paths === null) {
			paths = [];
		}
		this.paths = paths;
		this.emit('change');
	}
});

var AuthStore = Fluxxor.createStore({
	bearer: null,

	actions: {
		'BEARER': 'provideBearer'
	},

	provideBearer: function(bearer) {
		this.bearer = bearer;
		this.emit('change');
	}
})

var flux = new Fluxxor.Flux({
	AuthStore: new AuthStore(),
	PathsStore: new PathsStore()
}, actions);

ipc.send('bearer');
ipc.on('bearer', function(bearer) {
	flux.actions.provideBearer(bearer);
	ipc.send('ready');
})

ipc.on('paths', function(paths) {
	flux.actions.setPaths(paths);
}.bind(this))

module.exports.flux = flux;