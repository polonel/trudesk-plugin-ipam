var async           = require('async');
var path            = require('path');
var pluginHelpers   = require('../../../src/helpers/plugins');
var ipObj           = require('../models/ipobj');
var subnetSchema    = require('../models/subnet');
var pluginJson      = require('../plugin.json');
var ipv4            = require('ip-address').Address4;

var csv         = require('fast-csv');


var importController = {};

importController.uploadHosts = function(req, res) {
    //Check plugin Permissions
    if (!pluginHelpers.checkPermissions(req.user.role, pluginJson.permissions))
        return res.redirect('/plugins');

    var fs = require('fs');
    var Busboy = require('busboy');
    var busboy = new Busboy({
        headers: req.headers,
        limits: {
            files: 1,
            fileSize: (1024*1024) * 10 // 10mb limit
        }
    });

    var object = {}, error;

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
        if (fieldname === 'subnetId') object.subnetId = val;
    });

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        if (mimetype.indexOf('text/') == -1 && mimetype.indexOf('application/vnd.ms-excel')) {
            error = {
                status: 400,
                message: 'Invalid File Type'
            };

            return file.resume();
        }

        var savePath = path.join(__dirname, '../tmp_imports');
        if (!fs.existsSync(savePath)) fs.mkdirSync(savePath);

        object.filePath = path.join(savePath, filename);

        file.on('limit', function() {
            error = {
                error: 400,
                message: 'File size too large'
            };

            return file.resume();
        });

        file.pipe(fs.createWriteStream(object.filePath));
    });

    busboy.on('finish', function() {
        if (error) return res.status(error.status).send(error.message);

        if (!fs.existsSync(object.filePath)) return res.status(500).send('File Failed to Save to Disk');

        var importObjs = [];

        csv.fromPath(object.filePath, {
            ignoreEmpty: true
        })
            .on('data', function(data) {
                importObjs.push(data);
            })
            .on('end', function() {
                async.eachSeries(importObjs, function(obj, cb) {
                    var o = new ipObj({
                        hostname: obj[0],
                        ipaddress: new ipv4(obj[1]).bigInteger(),
                        subnet: object.subnetId
                    });

                    if (obj[2])
                        o.description = obj[2];
                    if (obj[3])
                        o.location = obj[3];

                    o.save(function(err, savedObj) {
                        if (err) return cb(err);

                        return cb();
                    })

                }, function(err) {
                    if (err) return res.render('error', {error: err});

                    fs.unlinkSync(object.filePath);

                    res.redirect('/plugins/ipam/' + object.subnetId);
                });
            });
    });

    req.pipe(busboy);
};

module.exports = importController;