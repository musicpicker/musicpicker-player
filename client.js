var IO = require('socket.io-client');
var request = require('superagent');

var pickerUrl = require('./package.json').pickerUrl;

function Client(bearer, deviceId) {
	this.bearer = bearer;
	this.deviceId = deviceId;

	this.socket = IO(pickerUrl);
	this.socket.on('connect', function() {
		this.socket.emit('authentication', bearer);
		this.socket.on('user', function() {
			this.socket.emit('RegisterDevice', deviceId);
		}.bind(this));
	}.bind(this));
}

Client.prototype.submit = function(submissions) {
	request.post(pickerUrl + '/api/devices/' + this.deviceId + '/submit')
		.set('Authorization', 'Bearer ' + this.bearer)
		.set('Content-Type', 'application/json')
		.send(submissions)
		.end();
}

module.exports = Client;