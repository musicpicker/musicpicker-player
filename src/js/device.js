var React = require('react');
var FluxMixin = require('fluxxor').FluxMixin(React);
var StoreWatchMixin = require('fluxxor').StoreWatchMixin;
var ipc = window.require('ipc');

var Device = React.createClass({
	mixins: [FluxMixin, StoreWatchMixin('PathsStore')],

	getStateFromFlux: function() {
		return {
			paths: this.getFlux().store('PathsStore').paths
		}
	},
	addPath: function() {
		ipc.send('path_add');
	},

	deletePath: function(index) {
		ipc.send('path_delete', index);
	},

	render: function() {
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
});

module.exports.Device = Device;