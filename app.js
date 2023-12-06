var createError = require('http-errors');
var express = require('express');
var fs = require('fs');
var path = require('path');
var morgan = require('morgan');
var rfs = require('rotating-file-stream');
var cookieParser = require('cookie-parser');
var helmet = require('helmet');
var cors = require('cors');
var compression = require('compression');

var validator = require('validator');
var PropertiesReader = require('properties-reader');
var path = require('path');
var properties = PropertiesReader(path.join(__dirname,'/config/application.properties'));
var logManager = require(path.join(__dirname,'/config/logger.js'));
var logger = logManager.getLogger();
var appUtils = require(path.join(__dirname,'util/functions.js'));

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var pagesRouter = require('./routes/pages');

var app = express();

//logging
var logDirectory = path.join(__dirname, '/logs');
// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
// create a rotating write stream
const accessLogStream = rfs.createStream(path.join(__dirname,"/logs/access.log"), {
    size: "10M", // rotate every 10 MegaBytes written
    interval: "1d", // rotate daily
    compress: "gzip" // compress rotated files
});
//logging
app.use(morgan('combined', {stream: accessLogStream}));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// properties config
var properties = PropertiesReader(path.join(__dirname,'/config/application.properties'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// add compression
app.use(compression());
// security
app.use(helmet());
app.disable('x-powered-by');
var domain = properties.get("app.http.domain");
var port = properties.get("app.http.port");
var corsOptions = {
    origin: domain+":"+port
};
app.use(cors(corsOptions));
//routes
app.use('/', indexRouter);
app.use('/users',authenticateRequest,usersRouter);
app.use('/pages',authenticateRequest,pagesRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// middleware to check apikey authentication for users and pages routes
function authenticateRequest(req, res, next){
    //authenticate Request
    var headers = req.headers;
    var apiKey = (typeof headers.apikey!='undefined')?headers.apikey+'':'';
    var error = false;
    var errorCode = properties.get("system.error.code");
    var errorMessage = properties.get("system.error.message");
    if(!appUtils.validateApiKey(apiKey)){
        error = true;
        errorCode = properties.get("auth.failed.error.code");
        errorMessage = properties.get("auth.failed.error.message");
    }
    if(error){
        res.status(400).json({code:errorCode,status:errorMessage});
        return;
    }
    next();
}
app.listen(port,function(){
    console.log('SSN Pages is listening at port ' + port);
});
module.exports = app;
