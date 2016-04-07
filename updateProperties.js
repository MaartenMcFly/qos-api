var azureConnect = require(__dirname + '/AZURE');
var storageContainer = 'appsinsightcontainer'
var azure = require('azure-storage');
var bs = azure.createBlobService(azureConnect.storageAccount, azureConnect.storageAccessKey);
var mongoose = require('mongoose');
var options = { server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }, 
                replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } } };

var MeasurementProperties = require(__dirname + '/models/measurementproperties');
var connectString = 'mongodb://measurementsAdmin:LudHaf97!@ds013250.mlab.com:13250/fluxable?authMechanism=SCRAM-SHA-1';
//var connectString = 'mongodb://measurementsAdmin:LudHaf97!@52.58.21.162:27000/measurements?authMechanism=SCRAM-SHA-1';
var async = require('async');

var myBlobs = [];
var i = 0;
var timeStamp = new Date();
timeStamp.setTime(timeStamp.getTime() - 7);;

function download(err, token) {
	if (err)
		console.log(err);
	bs.listBlobsSegmented(storageContainer, token, function (err, result) {
		if (err)
			console.error(err);
		i += result.entries.length;
		myBlobs = myBlobs.concat(result.entries);
		console.log(i);			
		if (result.continuationToken !== null)
		{
			download(err, result.continuationToken);
		} else {
			console.log("Total: " + i);
			writeBlobProperties();
		}
	});
}

function createMeasurementProperties(blobName, testTimestamp, callback) {
        var m = new MeasurementProperties();
        m.blobName = blobName;
        m.testTimestamp = testTimestamp;
        m.save(function(err) {
                if (err)
                {
                        console.log(err);
                }
		callback();
        });
        m = null;
}

function writeBlobProperties() {
	async.forEach(myBlobs, function(b, callback) {
		if (Date.parse(b.properties["last-modified"]) > timeStamp.getTime()) 
			createMeasurementProperties(b.name, b.properties["last-modified"], callback);
		else
			callback();
<<<<<<< HEAD
	}, function (err) {
		if (err) 
			console.log(err);
	//process.exit(0);
=======
	}, function(err) {
		if (err) {
			//return next(err);
		}
		process.exit(0);
>>>>>>> c0241487d52d4168d761b87228384555a5298874
	});
}

mongoose.connect(connectString, options);
mongoose.connection.once('connected', function() {
        console.log("Connected to database.");
});

var query = MeasurementProperties.find().sort({'testTimestamp': -1}).limit(1).exec(
function (err, result) {
	if (err)
		console.error(err);
	if (result[0])
		timeStamp =(result[0].testTimestamp);
});

download(null, null);
