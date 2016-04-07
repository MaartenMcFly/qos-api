var mongoose = require('mongoose');
var azure = require('azure-storage');
var azureConnect = require(__dirname + '/AZURE');
var Measurement = require(__dirname + '/models/measurement');
var MeasurementProperties = require(__dirname + '/models/measurementproperties');
var connectString = 'mongodb://measurementsAdmin:LudHaf97!@ds013250.mlab.com:13250/fluxable?authMechanism=SCRAM-SHA-1';
//var connectString = 'mongodb://measurementsAdmin:LudHaf97!@52.58.21.162:27000/measurements?authMechanism=SCRAM-SHA-1';
console.log(azureConnect.storageAccount);
var bs = azure.createBlobService(azureConnect.storageAccount, azureConnect.storageAccessKey);
var async = require("async");
var num = 20000;
mongoose.connect(connectString);
mongoose.connection.once('connected', function() {
	console.log("Connected to database.");
});

function insertMeasurement(p, callback) {
	bs.getBlobToText(azureConnect.storageContainer, p.blobName, function(err, blobContent, blob) {
		a = blobContent.split("\n");
	 	async.forEach(a.splice(0, a.length - 1), function (t, cb) {
			var q = JSON.parse(t);
			if (q.availability[0].testName) {
				var m = new Measurement();
				m.testName = q.availability[0].testName;
				m.testTimestamp = q.availability[0].testTimestamp;
				m.testDuration = q.availability[0].durationMetric.value / 10000000;
				m.save(function (err) {
					if (err) {
						console.error(err);
						cb();
					} else {
						p.isUploaded = true;
						p.save(function (err) {
							if (err) 
								console.log(err);							cb();
						});
					}
				});
			}
			
		}, function (err) {
			if (err)
				console.log(err);
		});
		callback();
	});
}

var query = MeasurementProperties.find({isUploaded: false}).sort({'testTimestamp':1}).limit(num);
query.exec(function (err, props) {
	if (err)
		console.error(err);
	else {
		async.forEach(props, function(prop, callback) {
			insertMeasurement(prop, callback);
		}, function (err) {
			if (err) {return next(err);}
			process.exit(0);
		});
	}
});
