var IO = require('socket.io-client');
var request = require('superagent');

function Client(bearer, deviceId) {
	this.bearer = bearer;
	this.deviceId = deviceId;

	this.socket = IO('http://127.0.0.1:3000');
	this.socket.on('connect', function() {
		console.log('SOCKET CONNECT');
		this.socket.emit('authentication', bearer);
		this.socket.on('authenticated', function() {
			this.socket.emit('RegisterDevice', deviceId);
		}.bind(this));
	}.bind(this));
}

Client.prototype.submit = function(submissions) {
	request.post('http://127.0.0.1:3000/api/devices/' + this.deviceId + '/submit')
		.set('Authorization', 'Bearer ' + this.bearer)
		.set('Content-Type', 'application/json')
		.send(submissions)
		.end();
}

module.exports = Client;