/* global appRoot */

'use strict';

var io;
var path = require('path');
var http = require('http');
var express = require('express');
var favicon = require('serve-favicon');
// var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sessionModule = require('express-session');
var FileStore = require('session-file-store')(sessionModule);
var MongoClient = require('mongodb').MongoClient;
// var expressMongoDb = require('express-mongo-db');

var app, server, routes, session, dbConnectionString;

global.appRoot = path.resolve(`${__dirname}/..`);

app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.set('public path', `${__dirname}/public`);

app.use(favicon(`${__dirname}/public/favicon.png`));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));
app.use(cookieParser());
app.use(express.static(app.get('public path')));

// Adatbázis kapcsolódás
dbConnectionString = require(`${appRoot}/app/models/dbconnect.js`);
/* app.use(expressMongoDb(dbConnectionString)); */
const connectPromise = MongoClient.connect(dbConnectionString).then(function(db){

	app.set('db', db);

	// Session
	session = sessionModule({
		secret : "Kh5Cwxpe8wCXNaWJ075g",
		resave : false,
		saveUninitialized : false,
		reapInterval : -1,
		store : new FileStore({
			path : `${appRoot}/tmp`,
			ttl : 86400  // 1 nap
		})
	});
	app.use(session);

	// Layout
	require(`${appRoot}/app/layout.js`)(app);

	// Websocket
	server = http.createServer(app);
	io = require(`${appRoot}/app/websocket.js`)(server, session, app);
	app.set('io', io);

	// Route
	routes = [
		['/', require('./routes/index')],
		['/chat', require('./routes/chat')],
		['/login', require('./routes/login')],
		['/logout', require('./routes/logout')]
	];
	routes.forEach(function(route){
		app.use(route[0], route[1]);
	});

	// Hibakezelők
	app.use(function(req, res, next){
		const err = new Error('Not Found');
		err.status = 404;
		next(err);
	});
	if (app.get('env') === 'development'){
		app.use(function(err, req, res){
			res.status(err.status || 500);
			res.render('error', {
				message : err.message,
				error : err
			});
		});
	}
	app.use(function(err, req, res){
		res.status(err.status || 500);
		res.render('error', {
			message : err.message,
			error : {}
		});
	});

	app.httpServer = server;
	return app;

}).catch(function(error){
	console.log(error.name);
	console.log(error.message);
});

module.exports = connectPromise;

// module.exports = app;
// module.exports.httpServer = server;
