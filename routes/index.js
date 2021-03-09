var express = require('express');
var session = require('express-session');
var router = express.Router();
var validator = require('validator');
var sanitize = require('mongo-sanitize');
const Bcrypt = require("bcryptjs");
var sess=""; //session variable
var PropertiesReader = require('properties-reader');
var path = require('path');
var properties = PropertiesReader(path.join(__dirname,'../config/application.properties'));
var logManager = require('../config/logger.js');
var logger = logManager.getLogger();
var appUtils = require('../util/functions.js');
//import user model
var User = require('../model/User.js');
var sessionExpiry = 24 * 60 * 60 * 1000; // 24 hours
var sessionSecret = properties.get("app.session.secret");
router.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    expires: new Date(Date.now() + sessionExpiry)
}));
var validateSession = function(req, res, next){
    var sessionValid=false;
    sess = req.session;
    if(typeof sess!='undefined' && sess.userauth==true){
        sessionValid=true;
    }else{
        req.session.destroy();
    }
    return sessionValid;
}
var getUserObject=function(req, res, next){
    sess = req.session;
    return {user:{name:sess.membername}};
}
/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'SSN Pages', version: '1.0.0' });
});
router.post('/login', function(req, res, next) {
    var email = (typeof req.body.Uname != 'undefined') ? req.body.Uname : '';
    var password = (typeof req.body.Pass != 'undefined') ? req.body.Pass : '';
    var error = false;
    var errorMessage = properties.get("system.error.message");
    if(validator.isEmpty(email)){
        error = true;
        errorMessage = 'Email is required';
    }
    if(!error && validator.isEmpty(password)){
        error = true;
        errorMessage = 'Password is required';
    }
    if(!error && !validator.isEmail(email)){
        error = true;
        errorMessage = 'Email is invalid';
    }
    if(!error && validator.isEmpty(password)){
        error = true;
        errorMessage = 'Password is required';
    }
    if(!error && !validator.isEmpty(password)){
        if(password.length < 8 || password.length > 20){
            error = true;
            errorMessage = 'Authentication Failed';
        }else if(!validator.matches(password,appUtils.passwordRegexp)) {
            error = true;
            errorMessage = "Authentication Failed";
        }
    }
    if(!error){
        email = sanitize(email);
        User.findOne({ Email_Address: email }).exec(function(err,user){
            if(!user || (typeof user.Status!='undefined' && validator.equals('Inactive',user.Status))) {
                error = true;
                errorMessage = 'Authentication Failed';
            }else{
                if(!Bcrypt.compareSync(password, user.Password)) {
                    error = true;
                    errorMessage = 'Authentication Failed';
                }
            }
            if(error){
                res.render('index', { title: 'SSN Pages', version: '1.0.0' ,haserror:error,errormsg:errorMessage});
            }else{
                req.session['userauth']=true;
                var name = user.Name;
                req.session['membername']=name;
                res.redirect('/home');
            }
        });
    }
});
router.get('/home', function(req, res, next) {
    var loggedin = validateSession(req);
    if(loggedin){
        var objUser=getUserObject(req);
        res.render('home',objUser);
    }else{
        res.render('index',{ title: 'SSN Pages', version: '1.0.0'});
    }
});
router.get('/logout',function(req,res,next){
    var loggedin = validateSession(req);
    if(loggedin){
        req.session.destroy(function (err) {
            if(err) {
                logger.error(err);
                res.status(500);
                res.render('error',{message:properties.get("system.error.message")})
            } else {
                res.redirect('/');
            }
        });
    }else{
        res.redirect('/');
    }
});
module.exports = router;
