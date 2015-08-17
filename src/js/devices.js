var React = require('react');
var FluxMixin = require('fluxxor').FluxMixin(React);
var request = require('superagent');
var ipc = window.require('ipc');

var baseUrl = require('./config').baseUrl;

var Devices = React.createClass({
	mixins: [FluxMixin],

	getInitialState: function() {
		return {
			devices: []
		}
	},

	componentDidMount: function() {
    request.get(baseUrl + '/api/Devices')
    	.set('Authorization', 'Bearer ' + this.getFlux().store('AuthStore').bearer)
    	.end(function(err, res) {
	      this.setState({devices: res.body});
	    }.bind(this));
	},

	selectDevice: function(deviceId) {
		ipc.send('device_select', deviceId);
	},

	newDevice: function(ev) {
		ev.preventDefault();
		var name = React.findDOMNode(this.refs.name).value;

    request.post(baseUrl + '/api/Devices')
    	.set('Authorization', 'Bearer ' + this.getFlux().store('AuthStore').bearer)
    	.send({name: name})
    	.end(function(err, res) {
    		this.getFlux().actions.selectDevice(res.body.Id);
    	}.bind(this));
	},

	render: function() {
		return (
			<div className="row">
	      <br />
	      <div className="col-sm-6 col-sm-offset-3">
	        <div className="panel panel-primary">
	          <div className="panel-body">
	            <h3 className="text-center">Devices</h3><br />
	            <div className="list-group">
	            	{this.state.devices.map(function(devices) {
	            		return <button className="list-group-item" key={devices.Id} onClick={this.selectDevice.bind(this, devices.Id)}>{devices.Name}</button>;
	            	}.bind(this))}
	            </div>

	            <form onSubmit={this.newDevice} className="text-center">
	            	<input className="form-control" type="text" ref="name" placeholder="New device name"/>
	            	<br />
	            	<button type="submit" className="btn btn-success">New device</button>
	            </form>
	          </div>
	        </div>
	      </div>
	    </div>
		);
	}
});

module.exports.Devices = Devices;