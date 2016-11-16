/* global */

'use strict';

var express = require('express');
var router = express.Router();
// var session = require('express-session');
var Model;

router.use(function(req, res, next){
    Model = require(`../../app/models/chat.js`)(req.app.get('db'));
    next();
});

router.get('/', function(req, res){

    Model.getUsers(function(users){
        res.set('Access-Control-Allow-Origin', '213.181.208.32');
        res.render('layout', {
            page : 'videochat',
            users : users,
            login : req.session.login ? req.session.login.loginned : false,
            userId : req.session.login ? req.session.login.userId : null,
            userName : req.session.login ? req.session.login.userName : '',
            loginMessage : null
        });
    });

});

module.exports = router;
