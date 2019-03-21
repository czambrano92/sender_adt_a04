let express = require('express');
let api = express.Router();
let senderController = require('../controller/constructor')

api.get('/sendmsg', senderController.senderhl7);


module.exports = api;