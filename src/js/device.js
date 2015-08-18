var React = require('react');
var FluxMixin = require('fluxxor').FluxMixin(React);
var StoreWatchMixin = require('fluxxor').StoreWatchMixin;
var ipc = window.require('ipc');

var LibraryStateView = React.createClass({
	mixins: [FluxMixin, StoreWatchMixin('LibraryStateStore')],

	getStateFromFlux: function() {
		var store = this.getFlux().store('LibraryStateStore');
		return {
			updating: store.updating,
			walking: store.walking,
			insertions: store.insertions,
			removals: store.removals,
			insertion_progress: store.insertion_progress,
			removal_progress: store.removal_progress
		}
	},

	render: function() {
		var stats = null;
		var state = null;

		if(this.state.walking) {
			state = <p>Scanning your music paths. This may take a while...</p>
		}
		else {
			state = null;
		}

		if (this.state.removals !== 0 || this.state.insertions !== 0) {
			stats = <p><b>Added tracks:</b> {this.state.insertions}.<br /><b>Removed tracks:</b> {this.state.removals}</p>
		}

		var removal_percent = (this.state.removal_progress * 100) / this.state.removals;
		var insertion_percent = (this.state.insertion_progress * 100) / this.state.insertions;

		return (
			<div className="row">
				<div className="col-xs-12">
					<h3>Processing your music collection</h3>
					<p>Please wait while your music collection is being scanned</p>
					{stats}
					{state}

					<div className="progress">
		        <div className="progress-bar progress-bar-danger" role="progressbar" aria-valuenow={removal_percent} aria-valuemin="0" aria-valuemax="100" style={{width: removal_percent + '%'}}>
		          <span>Removal progress: {this.state.removal_progress} / {this.state.removals}</span>
		        </div>
		      </div>

		      <div className="progress">
		        <div className="progress-bar progress-bar-success" role="progressbar" aria-valuenow={insertion_percent} aria-valuemin="0" aria-valuemax="100" style={{width: insertion_percent + '%'}}>
		          <span>Insertion progress: {this.state.insertion_progress} / {this.state.insertions}</span>
		        </div>
		      </div>
				</div>
			</div>
		)
	}
});

var Device = React.createClass({
	mixins: [FluxMixin, StoreWatchMixin('PathsStore', 'LibraryStateStore')],

	getStateFromFlux: function() {
		return {
			paths: this.getFlux().store('PathsStore').paths,
			updating: this.getFlux().store('LibraryStateStore').updating
		}
	},
	addPath: function() {
		ipc.send('path_add');
	},

	deletePath: function(index) {
		ipc.send('path_delete', index);
	},

	render: function() {
		if (this.state.updating) {
			return <LibraryStateView />
		}
		else {
			return (
				<div className="row">
		      <br />
		      <div className="col-sm-6 col-sm-offset-3">
		        <div className="panel panel-primary">
		          <div className="panel-body">
		            <h3 className="text-center">Paths</h3><br />
		            <div className="list-group">
		            	{this.state.paths.map(function(path, index) {
		            		return <button className="list-group-item" key={index} onClick={this.deletePath.bind(this, index)}>{path}</button>;
		            	}.bind(this))}
		            </div>
		            <div className="text-center">
		            	<p><small>Click on a path to delete it from list</small></p>
		            	<button className="btn btn-success" onClick={this.addPath}>Add path</button>
		            </div>
		          </div>
		        </div>
		      </div>
		    </div>
			);
		}
	}
});

module.exports.Device = Device;