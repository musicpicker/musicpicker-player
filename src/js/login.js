var React = require('react');

var Login = React.createClass({
	render: function() {
		return (
			<div className="row">
	      <br />
	      <div className="col-sm-6 col-sm-offset-3">
	        <div className="panel panel-primary">
	          <div className="panel-body">
	            <h3 className="text-center">Musicpicker</h3><br />
							<p className="text-center">
	              <span style={{fontSize: '3em'}} className="glyphicon glyphicon-log-in"></span><br />
	              <b>Authenticating</b><br />
	              Please wait while we get you logged in
	            </p>
	          </div>
	        </div>
	      </div>
	    </div>
		);
	}
})

module.exports.Login = Login;