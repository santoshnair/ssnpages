var fs = require('fs');
var path = require('path');
const log4js = require('log4js');

//logging
var logDirectory = path.join(__dirname,'../logs');
//ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
//log4js logger
log4js.configure({
    appenders: {ssnpageslog:{type:'dateFile',filename:logDirectory+'/ssnpages.log'}},
    categories:{default:{appenders:['ssnpageslog'],level:'info'}}
});
function getLogger(){
    return log4js.getLogger('ssnpageslog');
}
module.exports.getLogger = getLogger;