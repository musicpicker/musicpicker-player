var Fluxxor = require('fluxxor');
var ipc = window.require('ipc');

actions = {
	provideBearer: function(bearer) {
		this.dispatch('BEARER', bearer)
	},
	setPaths: function(paths) {
		this.dispatch('PATHS_SET', paths);
	},
	addPath: function(path) {
		this.dispatch('PATHS_ADD', path);
	},
	deletePath: function(index) {
		this.dispatch('PATHS_DELETE', index);
	},
	commitPaths: function() {
		this.dispatch('PATHS_COMMIT');
	},
	resetPaths: function() {
		this.dispatch('PATHS_RESET');
	},
	libraryUpdateBegin: function() {
		this.dispatch('LIBRARY_UPDATE_BEGIN');
	},
	libraryWalkEnd: function() {
		this.dispatch('LIBRARY_WALK_END');
	},
	libraryUpdateEnd: function() {
		this.dispatch('LIBRARY_UPDATE_END');
	},
	libraryUpdateStats: function(stats) {
		this.dispatch('LIBRARY_UPDATE_STATS', stats);
	},
	libraryInsertProgress: function(progress) {
		this.dispatch('LIBRARY_PROGRESS_INSERT', progress);
	},
	libraryRemovalProgress: function(progress) {
		this.dispatch('LIBRARY_PROGRESS_REMOVAL', progress);
	}
}

var LibraryStateStore = Fluxxor.createStore({
	updating: false,
	walking: false,
	insertions: 0,
	removals: 0,
	insertion_progress: 0,
	removal_progress: 0,

	actions: {
		'LIBRARY_UPDATE_BEGIN': 'libraryUpdateBegin',
		'LIBRARY_WALK_END': 'libraryWalkEnd',
		'LIBRARY_UPDATE_END': 'libraryUpdateEnd',
		'LIBRARY_UPDATE_STATS': 'libraryUpdateStats',
		'LIBRARY_PROGRESS_INSERT': 'libraryInsertProgress',
		'LIBRARY_PROGRESS_REMOVAL': 'libraryRemovalProgress'
	},

	libraryUpdateBegin: function() {
		if (!this.updating) {
			this.updating = true;
			this.walking = true;
			this.emit('change');
		}
	},

	libraryWalkEnd: function() {
		this.walking = false;
		this.emit('change');
	},

	libraryUpdateEnd: function() {
		this.updating = false;
		this.insertions = 0;
		this.removals = 0;
		this.insertion_progress = 0;
		this.removal_progress = 0;
		this.emit('change');
	},

	libraryUpdateStats: function(stats) {
		this.updating = true;
		this.insertions = stats.insertions;
		this.removals = stats.removals;
		this.emit('change');
	},

	libraryInsertProgress: function(progress) {
		this.updating = true;
		this.insertion_progress = progress;
		this.emit('change');
	},

	libraryRemovalProgress: function(progress) {
		this.updating = true;
		this.removal_progress = progress;
		this.emit('change');
	}
});

var PathsStore = Fluxxor.createStore({
	paths: [],

	actions: {
		'PATHS_SET': 'setPaths',
		'PATHS_ADD': 'addPath',
		'PATHS_DELETE': 'deletePath',
		'PATHS_COMMIT': 'commitPaths'
	},

	addPath: function(path) {
		this.paths.push(path);
		this.emit('change');
	},

	deletePath: function(index) {
		this.paths.splice(index, 1);
		this.emit('change');
	},

	commitPaths: function() {
		ipc.send('paths_commit', this.paths);
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
	PathsStore: new PathsStore(),
	LibraryStateStore: new LibraryStateStore()
}, actions);

ipc.send('bearer');
ipc.on('bearer', function(bearer) {
	flux.actions.provideBearer(bearer);
	ipc.send('ready');
})

ipc.on('paths', function(paths) {
	flux.actions.setPaths(paths);
}.bind(this))

ipc.on('update_begin', function() {
	flux.actions.libraryUpdateBegin();
}.bind(this));

ipc.on('walk_end', function() {
	flux.actions.libraryWalkEnd();
}.bind(this));

ipc.on('update_end', function() {
	flux.actions.libraryUpdateEnd();
}.bind(this));

ipc.on('update_stats', function(stats) {
	flux.actions.libraryUpdateStats(stats);
}.bind(this));

ipc.on('update_insert', function(progress) {
	flux.actions.libraryInsertProgress(progress);
}.bind(this));

ipc.on('update_removal', function(progress) {
	flux.actions.libraryRemovalProgress(progress);
}.bind(this));

module.exports.flux = flux;