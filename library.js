var util = require('util');
var events = require('events');
var fs = require('fs');
var Promise = require('bluebird');
var _ = require('lodash');
var walkdir = require('walkdir');
var Datastore = require('nedb');
var mm = require('musicmetadata');

function Library(dbFile) {
	this.db = new Datastore({filename: dbFile, autoload: true});
	this.db.ensureIndex({fieldName: 'Path'});
}

util.inherits(Library, events.EventEmitter);

Library.prototype.update = function(paths, regexp) {
	this.regexp = regexp;
	this.paths = [];

	Promise.each(paths, function(path) {
		return new Promise(function(resolve, reject) {
			walker = walkdir(path);
			walker.on('file', this._onFile.bind(this));
			walker.on('end', function() {
				resolve();
			});
		}.bind(this))
	}.bind(this)).then(function() {
		this._onWalkEnd.bind(this)();
	}.bind(this));
}

Library.prototype._onFile = function(path) {
	if (this.regexp.test(path)) {
		this.paths.push(path);
	}
}

Library.prototype._onWalkEnd = function() {
	this.db.find({}, {Path: 1, _id: 0}, function(err, docs) {
		var dbPaths = docs.map(function(val) { return val.Path });
		Promise.each(_.difference(dbPaths, _.intersection(dbPaths, this.paths)), function(path) {
			return new Promise(function(resolve, reject) {
				console.log('Remove ' + path);
				this.db.remove({Path: path}, {}, function() {
					resolve();
				});
			}.bind(this));
		}.bind(this)).then(function() {
			this.paths = _.difference(this.paths, dbPaths);
			this._insertNew();
		}.bind(this))
	}.bind(this));
}

Library.prototype._insertNew = function () {
	var i = 0;
	Promise.each(this.paths, function(path) {
		return new Promise(function(resolve, reject) {
			console.log(path);
			try {
				var stream = fs.createReadStream(path);
			}
			catch (err) {
				resolve();
			}
			new Promise(function(resolve, reject) {
				var parser = mm(stream, {duration: true}, function(err, meta) {
					if (err) {
						reject(err);
					}
					else {
						resolve(meta);
					}
				});
			}).timeout(5000).then(function(meta) {
				i++;
				this.db.insert({
					Path: path,
					Artist: meta.artist[0],
					Album: meta.album,
					Title: meta.title,
					Year: meta.year,
					'Number': meta.track.no,
					Count: meta.track.of,
					Duration: parseInt(meta.duration)
				});
				console.log(i + ' / ' + this.paths.length);
				stream.close();
				resolve();
			}.bind(this)).catch(function() {
				console.log(i + ' / ' + this.paths.length);
				stream.close();
				resolve();
			}.bind(this));
		}.bind(this));
	}.bind(this)).then(function() {
		this.emit('done');
	}.bind(this)).catch(function(err) {
		this.emit('error', err);
	}.bind(this))
}

Library.prototype.export = function() {
	return new Promise(function(resolve, reject) {
		this.db.find({}, {Path: 0}, function(err, all) {
			var result = all.map(function(item) {
				item.Id = item._id;
				return _.omit(item, ['_id', 'Path']);
			});
			resolve(result);
		});
	}.bind(this));
}

Library.prototype.getTrackPath = function(trackId) {
	return new Promise(function(resolve, reject) {
		this.db.find({_id: trackId}, {Path: 1, _id: 0}, function(err, tracks) {
			resolve(tracks[0].Path);
		})
	}.bind(this));
}

module.exports = Library;