var validator = require('validator');
var PropertiesReader = require('properties-reader');
var path = require('path');
var properties = PropertiesReader(path.join(__dirname,'../config/application.properties'));
var logManager = require('../config/logger.js');
var logger = logManager.getLogger();
module.exports = {
    apiKeyRegexp:/^[A-Z0-9\-']*$/,
    passwordRegexp:/^[a-zA-Z0-9\\_\-\\@\\#\\$\\%\\*\\+\\!]*$/,
    nameRegexp:/^[a-zA-Z\\'\s]*$/,
    validateApiKey:function(apikey){
        if(validator.isEmpty(apikey)){
            return false;
        }
        if(!validator.matches(apikey,this.apiKeyRegexp)){
            return false;
        }
        if(apikey.trim().length!==31){
            return false;
        }
        var appApiKey = properties.get("app.api.key");
        if(!validator.equals(appApiKey,apikey)){
            return false;
        }
        //return true if validation passed
        return true;
    },
    capitalize:function(string){
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
}