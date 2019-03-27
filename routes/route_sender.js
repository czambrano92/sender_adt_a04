let express = require('express');
let api = express.Router();
let senderController = require('../controller/constructor')
let admin = require('../controller/admin-api')

//test
api.get('/test',senderController.test)
api.get('/sendmsg', senderController.senderhl7);
//admin
api.get('/start', admin.start);
api.get('/stop', admin.stop);

module.exports = api;