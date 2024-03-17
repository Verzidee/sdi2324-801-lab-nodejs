// Module Imports
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const createError = require('http-errors');
const fileUpload = require('express-fileupload');
const crypto = require('crypto');
const { MongoClient } = require("mongodb");
const expressSession = require('express-session');
const app = express();


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');
app.set('uploadPath', __dirname);
app.set('clave', 'abcdefg');
app.set('crypto', crypto);

// Middleware Configuration
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  createParentPath: true
}));
app.use(expressSession({
  secret: 'abcdefg',
  resave: true,
  saveUninitialized: true
}));

// Database Configuration
const connectionString = "mongodb+srv://admub:9z6W6MpkeRBx5uIH@musicstoreapp.njk8cnz.mongodb.net/?retryWrites=true&w=majority&appName=musicstoreapp";
const dbClient = new MongoClient(connectionString);
const songsRepository = require("./repositories/songsRepository");
const usersRepository = require("./repositories/usersRepository");
songsRepository.init(app, dbClient);
usersRepository.init(app, dbClient);

// Routes Setup
const indexRouter = require('./routes/index');
app.use('/', indexRouter);
require("./routes/users")(app, usersRepository);
require("./routes/authors")(app);
require("./routes/songs")(app, songsRepository);

// Error Handling
app.use(function(req, res, next) {
  next(createError(404));
});
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Export the App
module.exports = app;
