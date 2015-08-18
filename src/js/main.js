var React = require('react');
var ReactRouter = require('react-router');
var Route = require('react-router').Route;
var RouteHandler = require('react-router').RouteHandler;
var Navigation = require('react-router').Navigation;
var FluxMixin = require('fluxxor').FluxMixin(React);

var flux = require('./app').flux;
var Devices = require('./devices').Devices;
var Device = require('./device').Device;

var ipc = window.require('ipc');

require('./player');

var BaseHandler = React.createClass({
  mixins: [FluxMixin, Navigation],

  componentDidMount: function() {
    ipc.on('transitionTo', function(route, params, query) {
      this.transitionTo(route, params, query);
    }.bind(this));
  },

	render: function() {
		return <RouteHandler />
	}
});

var routes = (
	<Route handler={BaseHandler}>
		<Route name="devices" path="devices" handler={Devices} />
		<Route name="device" path="device/:id" handler={Device} />
	</Route>
);

ReactRouter.run(routes, function(Root) {
	React.render(<Root flux={flux} />, document.getElementById('app'));
});