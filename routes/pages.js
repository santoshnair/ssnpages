var express = require('express');
var router = express.Router();
var validator = require('validator');
var sanitize = require('mongo-sanitize');
var PropertiesReader = require('properties-reader');
var path = require('path');
var properties = PropertiesReader(path.join(__dirname,'../config/application.properties'));
var logManager = require('../config/logger.js');
var logger = logManager.getLogger();
var async =  require('async');
var appUtils = require('../util/functions.js');
var Page = require('../model/Page.js');
var User = require('../model/User.js');
const successCode = properties.get("system.success.code");
const successMessage = properties.get("system.success.message");
// Display list of user
router.get('/', function(req, res, next) {
    Page.find({}).populate('CreatedBy', 'Name Email_Address', User).exec(function (err, pages) {
        if(err){
            logger.error(err);
            var errorCode = properties.get("system.error.code");
            var errorMessage = properties.get("system.error.message");
            res.status(200).json({code:errorCode,status:errorMessage});
            return;
        }
        res.status(200).json({code:successCode,status:successMessage,result:pages});
        return;
    });
});
// get a new Page
router.get('/:pageId',function(req, res, next){
    var error = false;
    var errorCode = properties.get("system.error.code");
    var errorMessage = properties.get("system.error.message");
    var pageId = (req.params.pageId!=='undefined')?decodeURIComponent(req.params.pageId)+'':"";
    if(validator.isEmpty(pageId)){
        error = true;
        errorCode = 'PD018';
        errorMessage = 'Missing or empty pageId';
    }
    if(error){
        res.status(200).json({code:errorCode,status:errorMessage});
        return;
    }
    pageId = sanitize(pageId);
    Page.findById(pageId).populate('CreatedBy', 'Name Email_Address', User).exec(function(err,page){
        if(err){
            logger.error(err);
            res.status(200).json({code:errorCode,status:errorMessage});
            return;
        }
        if(typeof page=='undefined' || page==null){
            errorCode='PD019';
            errorMessage='Page not found';
            res.status(200).json({code:errorCode,status:errorMessage});
            return;
        }
        res.status(200).json({code:successCode,status:successMessage,result:page});
        return;
    });
});
//Create new Page
router.post('/',function(req, res, next){
    var error = false;
    var errorCode = properties.get("system.error.code");
    var errorMessage = properties.get("system.error.message");
    var postObj = req.body;
    var title = (typeof postObj.title!='undefined')?postObj.title+'':'';
    var content = (typeof postObj.content!='undefined')?postObj.content+'':'';
    var keywords = (typeof postObj.keywords!='undefined')?postObj.keywords:[];
    var createdby = (typeof postObj.createdby!='undefined')?postObj.createdby:'';

    if(validator.isEmpty(title)){
        error=true;
        errorCode='PD012';
        errorMessage='Page title is required';
    }
    if(!error && validator.isEmpty(content)){
        error=true;
        errorCode='PD013';
        errorMessage='Page content is required';
    }
    if(!error && keywords.length > 0 && !Array.isArray(keywords)){
        error=true;
        errorCode='PD014';
        errorMessage='Keywords should be an array';
    }
    if(!error && validator.isEmpty(createdby)){
        error=true;
        errorCode='PD015';
        errorMessage='Page created by is required';
    }
    if(error){
        res.status(200).json({code:errorCode,status:errorMessage});
        return;
    }
    var userId = sanitize(createdby);
    title = sanitize(title);
    content = sanitize(content);
    var arrKeywords = [];
    if(keywords.length > 0){
        keywords.forEach(function (item, index) {
            item = sanitize(item);
            arrKeywords.push(item)
        });
    }
    var checkUser=function(callback){
        User.findById(userId, function (err, user){
            if(err){
                logger.error(err);
                callback(null,{success:0});
                return;
            }
            if(typeof user=='undefined' || user==null){
                callback(null,{success:0});
                return;
            }
            if(validator.equals('Inactive',user.Status)){ //user account is inactive
                callback(null,{success:0});
                return;
            }
            callback(null,{success:1});
            return;
        });
    };
    async.waterfall([checkUser],function(err,result){
        if(err){
            logger.error(err);
            res.status(200).json({code:errorCode,status:errorMessage});
            return;
        }
        if(typeof result!='undefined' && typeof result.success!='undefined' && result.success==0){ //user account not found
            errorCode='PD016';
            errorMessage='Invalid user account';
            res.status(200).json({code:errorCode,status:errorMessage});
            return;
        }
        var row = {'Title':title,'Content':content,'Keywords':arrKeywords,'CreatedBy':userId};
        Page.create(row,function(err,result){
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
});
//Update a Page
router.put('/:pageId',function(req, res, next){
    var error = false;
    var errorCode = properties.get("system.error.code");
    var errorMessage = properties.get("system.error.message");
    var pageId = (req.params.pageId!=='undefined')?decodeURIComponent(req.params.pageId)+'':"";
    var postObj = req.body;
    var title = (typeof postObj.title!='undefined')?postObj.title+'':'';
    var content = (typeof postObj.content!='undefined')?postObj.content+'':'';
    var keywords = (typeof postObj.keywords!='undefined')?postObj.keywords:[];
    var createdby = (typeof postObj.createdby!='undefined')?postObj.createdby:'';

    if(keywords.length > 0 && !Array.isArray(keywords)){
        error=true;
        errorCode='PD014';
        errorMessage='Keywords should be an array';
    }
    if(error){
        res.status(200).json({code:errorCode,status:errorMessage});
        return;
    }
    var checkUserAccount = false;
    if(!validator.isEmpty(createdby)){
        checkUserAccount=true;
    }
    var checkUser=function(callback){
        if(checkUserAccount==false){ //do not check if userid not present in the payload
            callback(null,{success:1});
            return;
        }
        var userId = sanitize(createdby);
        User.findById(userId, function (err, user){
            if(err){
                logger.error(err);
                callback(null,{success:0});
                return;
            }
            if(typeof user=='undefined' || user==null){
                callback(null,{success:0});
                return;
            }
            if(validator.equals('Inactive',user.Status)){ //user account is inactive
                callback(null,{success:0});
                return;
            }
            callback(null,{success:1});
            return;
        });
    };
    async.waterfall([checkUser],function(err,result) {
        if (err) {
            logger.error(err);
            res.status(200).json({code: errorCode, status: errorMessage});
            return;
        }
        if (typeof result != 'undefined' && typeof result.success != 'undefined' && result.success == 0) { //user account not found
            errorCode = 'PD016';
            errorMessage = 'Invalid user account';
            res.status(200).json({code: errorCode, status: errorMessage});
            return;
        }
        var data = {};
        if(!validator.isEmpty(createdby)){
            data['CreatedBy']=sanitize(createdby);
            checkUserAccount=true;
        }
        if(!validator.isEmpty(title)){
            data['Title']=sanitize(title);
        }
        if(!validator.isEmpty(content)){
            data['Content']=sanitize(content);
        }
        var arrKeywords = [];
        if(keywords.length > 0){
            keywords.forEach(function (item, index) {
                item = sanitize(item);
                arrKeywords.push(item)
            });
            data['Keywords']=arrKeywords;
        }
        if(Object.keys(data).length === 0) {
            error = true;
            errorCode = 'PD017';
            errorMessage = "page data not found for update";
            res.status(200).json({code: errorCode, status: errorMessage});
            return;
        }
        Page.findByIdAndUpdate({_id: pageId},data,function(err,result){
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
});
//Delete a Page
router.delete('/:pageId',function(req, res, next){
    var error = false;
    var errorCode = properties.get("system.error.code");
    var errorMessage = properties.get("system.error.message");
    var pageId = (req.params.pageId!=='undefined')?decodeURIComponent(req.params.pageId)+'':"";
    if(validator.isEmpty(pageId)){
        error = true;
        errorCode = 'PD018';
        errorMessage = 'Missing or empty pageId';
    }
    if(error){
        res.status(200).json({code:errorCode,status:errorMessage});
        return;
    }
    pageId = sanitize(pageId);
    Page.findByIdAndDelete({_id: pageId},function(err,result){
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