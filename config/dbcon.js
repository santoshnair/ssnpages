var PropertiesReader = require('properties-reader');
var path = require('path');
var properties = PropertiesReader(path.join(__dirname,'/application.properties'));
var logManager = require(path.join(__dirname,'/logger.js'));
var logger = logManager.getLogger();
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
exports.connect = function(){
    const dburl = properties.get("mongodb.connection.url");
    const con =  mongoose.createConnection(dburl,{
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true
    });
    return con;
}