/*
 .                              .o8                     oooo
 .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/03/2017
 Author:     Chris Brame

 **/

var mongoose    = require('mongoose');
var ipv4        = require('ip-address').Address4;
var netmask     = require('netmask').Netmask;

var extraSchema = require('./ipextra');

var COLLECTION = 'plugins-ipam-ipos';


var ipobjSchema = mongoose.Schema({
    hostname:       { type: String, required: true },
    ipaddress:      { type: Number, required: true},
    mac:            'String',
    subnet:         { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'plugins-ipam-subnets' },
    description:    'String',
    location:       'String',

    //Host Information Optional
    extras: [extraSchema]
}, {
    timestamps: true
});

ipobjSchema.index({hostname: 1, subnet: 1});

ipobjSchema.virtual('ipv4Formated').get(function() {
    return ipv4.fromBigInteger(this.ipaddress).correctForm();
});

ipobjSchema.virtual('isValidSubnet').get(function() {
    var block = new netmask(this.subnet.subnet);
    return block.contains(ipv4.fromBigInteger(this.ipaddress).correctForm());
});

ipobjSchema.statics.getAll = function(callback) {
    var q = this.model(COLLECTION).find({})
        .populate('subnet')
        .sort('ipaddress');

    return q.exec(callback);
};

ipobjSchema.statics.getForSubnet = function(subnet, callback) {
    var q = this.model(COLLECTION).find({subnet: subnet})
        .populate('subnet')
        .sort('ipaddress');

    return q.exec(callback);
};

ipobjSchema.statics.getCountForSubnet = function(subnet, callback) {
    return this.model(COLLECTION).count({subnet: subnet}).exec(callback);
};

ipobjSchema.statics.getHost = function(host, callback) {
    return this.model(COLLECTION).findOne({_id: host}).populate('subnet').exec(callback);
};

module.exports = mongoose.model(COLLECTION, ipobjSchema);
