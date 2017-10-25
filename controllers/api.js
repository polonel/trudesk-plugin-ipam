var _               = require('lodash');
var async           = require('async');
var path            = require('path');
var pluginHelpers   = require('../../../src/helpers/plugins');
var ipObj           = require('../models/ipobj');
var extraSchema     = require('../models/ipextra');
var subnetSchema    = require('../models/subnet');
var pluginJson      = require('../plugin.json');
var Netmask         = require('netmask').Netmask;
var ipaddress       = require('ip-address').Address4;

var apiController = {};

apiController.addSubnet = function(req, res) {
    //Check plugin Permissions
    if (!pluginHelpers.checkPermissions(req.user.role, pluginJson.permissions))
        return res.status(400).json({success: false, error: 'Invalid User Permission'});

    var postData = req.body;
    if (!_.isObject(postData)) return res.status(400).json({success: false, error: 'Invalid Post Data'});

    new subnetSchema({
        name: postData['form_name'],
        subnet: postData['form_subnet'],
        description: postData['form_description']
    }).save(function(err, savedSubnet) {
        if (err) return res.status(400).json({success: false, error: err.message});

        return res.json({success: true, subnet: savedSubnet});
    });
};

apiController.removeSubnet = function(req, res) {
    //Check plugin Permissions
    if (!pluginHelpers.checkPermissions(req.user.role, pluginJson.permissions))
        return res.status(400).json({success: false, error: 'Invalid User Permission'});

    var subnetId = req.params.id;
    if (_.isUndefined(subnetId)) return res.status(400).json({success: false, error: 'Invalid Subnet ID'});

    async.series([
        function(done) {
            subnetSchema.remove({_id: subnetId}, done);
        },
        function(done) {
            ipObj.remove({subnet: subnetId}, done);
        }
    ], function(err) {
        if (err) return res.status(400).json({success: false, error: err.message});

        return res.json({success: true});

    });
};

apiController.addHost = function(req, res) {
    //Check plugin Permissions
    if (!pluginHelpers.checkPermissions(req.user.role, pluginJson.permissions))
        return res.status(400).json({success: false, error: 'Invalid User Permission'});

    var postData = req.body;
    if (!_.isObject(postData)) return res.status(400).json({success: false, error: 'Invalid Post Data'});

    var ipLong = new ipaddress(postData['form_ipaddress']).bigInteger();
    var subnetId = postData['form_subnet'];

    ipObj.count({ipaddress: ipLong[0]}, function(err, count) {
        if (err) return res.status(400).json({success: false, error: 'Unable to validate host entry'});
        console.log(count);
        if (count !== 0) return res.status(400).json({success: false, error: 'IP Address already exist for this subnet'});

        var host = {
            hostname: postData['form_hostname'],
            description: postData['form_description'],
            ipaddress: ipLong,
            subnet: subnetId,
            location: postData['form_location']
        };

        var hostObj = new ipObj(host);
        hostObj.save(function(err, savedObject) {
            if (err) return res.status(400).json({success: false, error: 'Unable to Save IP Object'});

            return res.json({success: true, host: savedObject});
        });
    });
};

apiController.removeHost = function(req, res) {
    //Check plugin Permissions
    if (!pluginHelpers.checkPermissions(req.user.role, pluginJson.permissions))
        return res.status(400).json({success: false, error: 'Invalid User Permission'});

    var hostId = req.params.id;
    if (_.isUndefined(hostId)) return res.status(400).json({success: false, error: 'Invalid Host ID'});

    ipObj.remove({_id: hostId}, function(err) {
        if (err) return res.status(400).json({success: false, error: err.message});

        return res.json({success: true});
    })
};

apiController.addHostExtra = function(req, res) {
    //Check plugin Permissions
    if (!pluginHelpers.checkPermissions(req.user.role, pluginJson.permissions))
        return res.status(400).json({success: false, error: 'Invalid User Permission'});

    var hostId = req.params.id;
    ipObj.findOne({_id: hostId}, function(err, host) {
        if (err) return res.status(400).json({success: false, error: 'Invalid Host Id'});


        var extra = {
            name: req.body["newExtraName"],
            value: req.body["newExtraValue"]
        };

        if (host.extras)
            host.extras.push(extra);
        else
            host.extras = [extra];

        host.save(function(err, savedHost) {
            if (err) return res.status(400).json({success: false, error: err.message});

            return res.json({success: true, savedHost: savedHost});
        });
    });
};

apiController.updateExtra = function(req, res) {
    //Check plugin Permissions
    if (!pluginHelpers.checkPermissions(req.user.role, pluginJson.permissions))
        return res.status(400).json({success: false, error: 'Invalid User Permission'});

    var hostId = req.params.id;
    ipObj.findOne({_id: hostId}, function(err, host){
        if (err) return res.status(400).json({success: false, error: 'Invalid Host Id'});

        var extraId = req.body['extraId'];
        for (var i = 0; i < host.extras.length; i++) {
            if (host.extras[i]._id.toString() === extraId.toString()) {
                host.extras[i].name = req.body['editExtraName'];
                host.extras[i].value = req.body['editExtraValue'];
            }
        }

        host.save(function(err, savedHost) {
            if (err) return res.status(400).json({success: false, error: err.message});

            return res.json({success: true, savedHost: savedHost});
        });
    });
};

apiController.deleteExtra = function(req, res) {
    //Check plugin Permissions
    if (!pluginHelpers.checkPermissions(req.user.role, pluginJson.permissions))
        return res.status(400).json({success: false, error: 'Invalid User Permission'});

    var hostId = req.params.id;
    ipObj.findOne({_id: hostId}, function(err, host){
        if (err) return res.status(400).json({success: false, error: 'Invalid Host Id'});

        var extraId = req.body['extraId'];
        for (var i = 0; i < host.extras.length; i++) {
            if (host.extras[i]._id.toString() === extraId.toString()) {
                host.extras.splice(i, 1);
            }
        }

        host.save(function(err, savedHost) {
            if (err) return res.status(400).json({success: false, error: err.message});

            return res.json({success: true, savedHost: savedHost});
        });
    });
};

module.exports = apiController;