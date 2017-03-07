var mongoose            = require('mongoose');

var extraSchema = mongoose.Schema({
    name:   { type: 'String', required: true },
    value:  { type: 'String', required: true }
});

module.exports = extraSchema;