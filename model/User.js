const mongo = require('../config/dbcon.js');
const dbcon = mongo.connect();
var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var UserSchema = new Schema({
    Name: { type: String,default: '',required: true},
    Email_Address : { type: String, required: true,lowercase: true,trim: true, index: { unique: true } },
    Password:{type: String, required: true, bcrypt: true},
    Status:{type: String, enum : ['Active','Inactive'], required: true},
    CreatedAt: { type: Date, default: Date.now}
});

UserSchema.pre('save', function(next){
    var arrName = this.Name.toLowerCase().split(' ');
    for(var i = 0; i < arrName.length; i++){
        arrName[i] = arrName[i].charAt(0).toUpperCase() + arrName[i].substring(1);
    }
    this.Name = arrName.join(' ');
    next();
});
// required plugins
UserSchema.plugin(require('mongoose-bcrypt')); // automatically bcrypts passwords
var User  = dbcon.model('Users', UserSchema);
module.exports = User;

