var _               = require('lodash');
var async           = require('async');
var path            = require('path');
var pluginHelpers   = require('../../../src/helpers/plugins');
var ipObj           = require('../models/ipobj');
var subnetSchema    = require('../models/subnet');
var pluginJson      = require('../plugin.json');
var Netmask         = require('netmask').Netmask;

var importController = require('./import');
var apiController    = require('./api');

var controller = {};
controller.import = importController;
controller.api = apiController;

controller.get = function(req, res) {
    //Check plugin Permissions
    if (!pluginHelpers.checkPermissions(req.user.role, pluginJson.permissions))
        return res.redirect('/plugins');

    var self = this;
    self.content = {};
    self.content.title = "IPAM";
    self.content.nav = 'plugins';
    self.content.subnav = 'ipam';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;

    var subArray = [];

    subnetSchema.getAll(function(err, subnets) {
        if (err) return res.render('error', err);

        async.eachSeries(subnets, function(i, done) {
            var ipo = i.toObject();
            ipObj.getCountForSubnet(i, function(err, count) {
                if (err) return done(err);

                ipo.hostcount = count;

                subArray.push(ipo);

                return done();
            });
        }, function(e) {
            if (e) return res.render('error', e);
            self.content.data.subnets = subArray;
            subArray = null;
            return res.render(path.join(__dirname, '../views/ipam'), self.content);
        });
    });
};

controller.singleSubnet = function(req, res) {
    if (!pluginHelpers.checkPermissions(req.user.role, pluginJson.permissions))
        return res.redirect('/plugins');

    var subnetId = req.params.subnet;

    var self = this;
    self.content = {};
    self.content.title = "IPAM";
    self.content.nav = 'plugins';
    self.content.subnav = 'ipam';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;

    async.waterfall([
        function(done) {
            subnetSchema.findOne({_id: subnetId}, function(err, s) {
                if (err) return done(err);

                self.content.data.active_subnet = s;

                done(null, s);
            });
        },
        function(s, done) {
            ipObj.getForSubnet(subnetId, function(err, ips) {
                if (err) return done(err);

                var useableIps = [];
                var block = new Netmask(s.subnet);
                block.forEach(function(ip) {
                    useableIps.push(ip);
                });

                for (var i = 0; i < ips.length; i++) {
                    useableIps = _.without(useableIps, ips[i].ipv4Formated);
                }

                self.content.data.useableIps = useableIps;
                self.content.data.ips = ips;

                done();
            });
        }
    ], function (err) {
        if (err) return res.render('error', err);

        return res.render(path.join(__dirname, '../views/ipam-subnet'), self.content);
    });
};

controller.singleHost = function(req, res) {
    if (!pluginHelpers.checkPermissions(req.user.role, pluginJson.permissions))
        return res.redirect('/plugins');

    var hostId = req.params.hostid;

    var self = this;
    self.content = {};
    self.content.title = "IPAM";
    self.content.nav = 'plugins';
    self.content.subnav = 'ipam';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;

    ipObj.getHost(hostId, function(err, host) {
        if (err) return res.render('error', err);

        self.content.data.host = host;

        return res.render(path.join(__dirname, '../views/ipam-host'), self.content);
    });
};




module.exports = controller;