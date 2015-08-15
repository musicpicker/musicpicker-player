var React = require('react');
var FluxMixin = require('fluxxor').FluxMixin(React);
var StoreWatchMixin = require('fluxxor').StoreWatchMixin;

var flux = require('./app').flux;
var Login = require('./login').Login;
var Devices = require('./devices').Devices;
var Device = require('./device').Device;

require('./player');

var Main = React.createClass({
	mixins: [FluxMixin, StoreWatchMixin('AuthStore')],

	getStateFromFlux: function() {
		var flux = this.getFlux();
		return {
			bearer: flux.store('AuthStore').bearer,
			deviceId: flux.store('AuthStore').deviceId
		}
	},

	render: function() {
		if (!this.state.bearer) {
			return <Login />
		}
		else {
			if (!this.state.deviceId) {
				return <Devices />
			}
			else {
				return <Device />
			}
		}
	}
});

React.render(<Main flux={flux} />, document.getElementById('app'));