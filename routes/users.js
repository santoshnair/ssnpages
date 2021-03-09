var express = require('express');
var router = express.Router();
var validator = require('validator');
var sanitize = require('mongo-sanitize');
var PropertiesReader = require('properties-reader');
var path = require('path');
var properties = PropertiesReader(path.join(__dirname,'../config/application.properties'));
var logManager = require('../config/logger.js');
var logger = logManager.getLogger();
var appUtils = require('../util/functions.js');
//import user model
var User = require('../model/User.js');
const successCode = properties.get("system.success.code");
const successMessage = properties.get("system.success.message");
// Display list of user
router.get('/', function(req, res, next) {
    User.find({}, function (err, users) {
        if(err){
            logger.error(err);
            var errorCode = properties.get("system.error.code");
            var errorMessage = properties.get("system.error.message");
            res.status(200).json({code:errorCode,status:errorMessage});
            return;
        }
        res.status(200).json({code:successCode,status:successMessage,result:users});
        return;
    });
});
// get a new user
router.get('/:userId',function(req, res, next){
    var error = false;
    var errorCode = properties.get("system.error.code");
    var errorMessage = properties.get("system.error.message");
    var userId = (req.params.userId!=='undefined')?decodeURIComponent(req.params.userId)+'':"";
    if(validator.isEmpty(userId)){
        error = true;
        errorCode = 'PD002';
        errorMessage = 'Missing or empty UserId';
    }
    if(error){
        res.status(200).json({code:errorCode,status:errorMessage});
        return;
    }
    userId = sanitize(userId);
    User.findById(userId, function (err, user){
        if(err){
            logger.error(err);
            res.status(200).json({code:errorCode,status:errorMessage});
            return;
        }
        if(typeof user=='undefined' || user==null){
            errorCode='PD003';
            errorMessage='User not found';
            res.status(200).json({code:errorCode,status:errorMessage});
            return;
        }
        res.status(200).json({code:successCode,status:successMessage,result:user});
        return;
    });
});
//Create new user
router.post('/',function(req, res, next){
    var error = false;
    var errorCode = properties.get("system.error.code");
    var errorMessage = properties.get("system.error.message");
    var postObj = req.body;
    var name = (typeof postObj.name!='undefined')?postObj.name+'':'';
    var email = (typeof postObj.email!='undefined')?postObj.email+'':'';
    var password = (typeof postObj.password!='undefined')?postObj.password+'':'';
    //validate request
    if(validator.isEmpty(name) || !validator.matches(name,appUtils.nameRegexp)){
        error = true;
        errorCode = 'PD004';
        errorMessage = 'Name is required and must only consist for letters,spaces and single quote';
    }
    if(!error && !validator.isEmail(email)){
        error = true;
        errorCode = 'PD005';
        errorMessage = 'Email is invalid';
    }
    if(!error && validator.isEmpty(password)){
        error = true;
        errorCode = 'PD006';
        errorMessage = 'Password is required';
    }
    if(!error && !validator.isEmpty(password)){
        if(password.length < 8 || password.length > 20){
            error = true;
            errorCode = 'PD007';
            errorMessage = 'The password should be 8 to 20 characters long.';
        }else if(!validator.matches(password,appUtils.passwordRegexp)) {
            error = true;
            errorCode = 'PD008';
            errorMessage = "The password should only consist of letters, numbers and special characters _,-,@,#,$,%,*,+,!";
        }
    }
    if(error){
        res.status(200).json({code:errorCode,status:errorMessage});
        return;
    }
    name = sanitize(name);
    email = sanitize(email);
    password = sanitize(password);
    var row = {'Name':name,'Email_Address':email,'Password':password,'Status':'Active'};
    User.create(row,function(err,result){
        if(err){
            logger.error(err);
            if(typeof err.code!='undefined' && parseInt(err.code)==11000){ //Duplicate Email
                errorCode = 'PD010';
                errorMessage = "The email provided is already assigned to another user.";
            }
            res.status(200).json({code:errorCode,status:errorMessage});
            return;
        }
        if(typeof result=='undefined' || result==null){
            res.status(200).json({code:errorCode,status:errorMessage});
            return;
        }
        res.status(200).json({code:successCode,status:successMessage});
        return;
    });
});
//Update a user
router.put('/:userId',function(req, res, next){
    var error = false;
    var errorCode = properties.get("system.error.code");
    var errorMessage = properties.get("system.error.message");
    var userId = (req.params.userId!=='undefined')?decodeURIComponent(req.params.userId)+'':"";
    var postObj = req.body;
    var name = (typeof postObj.name!='undefined')?postObj.name+'':'';
    var email = (typeof postObj.email!='undefined')?postObj.email+'':'';
    var password = (typeof postObj.password!='undefined')?postObj.password+'':'';
    var status = (typeof postObj.status!='undefined')?postObj.status+'':'';
    if(validator.isEmpty(userId)){
        error = true;
        errorCode = 'PD002';
        errorMessage = 'Missing or empty UserId';
    }
    if(!error && !validator.isEmpty(name) && !validator.matches(name,appUtils.nameRegexp)){
        //console.log('name ' + name);
        error = true;
        errorCode = 'PD004';
        errorMessage = 'Name must only consist for letters, spaces and single quote';
    }
    if(!error && !validator.isEmpty(email) && !validator.isEmail(email)){
        error = true;
        errorCode = 'PD005';
        errorMessage = 'Email is invalid';
    }
    if(!error && !validator.isEmpty(password)){
        if(password.length < 8 || password.length > 20){
            error = true;
            errorCode = 'PD007';
            errorMessage = 'The password should be 8 to 20 characters long.';
        }else if(!validator.matches(password, appUtils.passwordRegexp)) {
            error = true;
            errorCode = 'PD008';
            errorMessage = "The password should only consist of letters, numbers and special characters _,-,@,#,$,%,*,+,!";
        }
    }
    if(!error && !validator.isEmpty(status)){
        status = appUtils.capitalize(status);
        if(!validator.equals('Active',status) && !validator.equals('Inactive',status)){
            error = true;
            errorCode = 'PD011';
            errorMessage = 'Invalid value for status, should be Active or Inactive';
        }
    }
    //row for update
    var row={};
    if(!error) {
        if (!validator.isEmpty(name)) {
            row['Name'] = sanitize(name);
        }
        if (!validator.isEmpty(email)) {
            row['Email_Address'] = sanitize(email);
        }
        if (!validator.isEmpty(password)) {
            row['Password'] = sanitize(password);
        }
        if (!validator.isEmpty(status)) {
            row['Status'] = status;
        }
        if (Object.keys(row).length === 0) {
            error = true;
            errorCode = 'PD009';
            errorMessage = "User data not found for update";
        }
    }
    if(error){
        res.status(200).json({code:errorCode,status:errorMessage});
        return;
    }
    userId = sanitize(userId);
    User.findByIdAndUpdate({_id: userId},row,function(err,result){
        if(err){
            logger.error(err);
            if(typeof err.code!='undefined' && parseInt(err.code)==11000){ //Duplicate Email
                errorCode = 'PD010';
                errorMessage = "The email provided is already assigned to another user.";
            }
            res.status(200).json({code:errorCode,status:errorMessage});
            return;
        }
        if(typeof result=='undefined' || result==null){
            res.status(200).json({code:errorCode,status:errorMessage});
            return;
        }
        res.status(200).json({code:successCode,status:successMessage});
        return;
    });
});
//Delete a user
router.delete('/:userId',function(req, res, next){
    var error = false;
    var errorCode = properties.get("system.error.code");
    var errorMessage = properties.get("system.error.message");
    var userId = (req.params.userId!=='undefined')?decodeURIComponent(req.params.userId)+'':"";
    if(validator.isEmpty(userId)){
        error = true;
        errorCode = 'PD002';
        errorMessage = 'Missing or empty UserId';
    }
    if(error){
        res.status(200).json({code:errorCode,status:errorMessage});
        return;
    }
    var row={'Status':'Inactive'};
    userId = sanitize(userId);
    User.findByIdAndUpdate({_id: userId},row,function(err,result){
        if(err){
            logger.error(err);
            res.status(200).json({code:errorCode,status:errorMessage});
            return;
        }
        if(typeof result=='undefined' || result==null){
            res.status(200).json({code:errorCode,status:errorMessage});
            return;
        }
        res.status(200).json({code:successCode,status:successMessage});
        return;
    });
});
module.exports = router;
