const mongo = require('../config/dbcon.js');
const dbcon = mongo.connect();
var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var PageSchema = new Schema({
    Title: { type: String, default: '', required: true},
    Content: { type: String, default: '', required: true },
    Keywords :{type: Array, default:[]},
    CreatedAt : { type: Date, default: Date.now, required: true},
    CreatedBy : { type: Schema.ObjectId, ref: 'User' }
});
PageSchema.pre('save', function(next){
    var arrTitle = this.Title.toLowerCase().split(' ');
    for(var i = 0; i < arrTitle.length; i++){
        arrTitle[i] = arrTitle[i].charAt(0).toUpperCase() + arrTitle[i].substring(1);
    }
    this.Title = arrTitle.join(' ');
    next();
});

var Page = dbcon.model('Pages', PageSchema);
module.exports = Page;