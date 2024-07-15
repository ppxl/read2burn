/**
 * Module dependencies.
 */
const express = require('express')
    , http = require('http')
    , path = require('path')
    , Umzug = require('umzug')
    , bodyParser = require('body-parser')
    , cron = require('node-cron')
    , Datastore = require('@seald-io/nedb')
    , routes = require('./routes')
    , i18n = require("i18n");
;

const app = express();
const umzug = new Umzug();

// default: using 'accept-language' header to guess language settings
app.use(i18n.init);
app.set('port', process.env.PORT || 3300);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.Router());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.enable('trust proxy');
app.disable( 'x-powered-by' )

const nedb = new Datastore({filename: 'data/read2burn.db', autoload: true});
exports.nedb = nedb


i18n.configure({
    locales: ['en', 'de'],
    directory: __dirname + '/locales',
    defaultLocale: 'en'
});

app.get('/', routes.index);
app.post('/', routes.index);

umzug.up().then(function (migrations) {
    // "migrations" will be an Array with the names of the
    // executed migrations.
});

// start server
http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});

// schedule regular cleanup
cron.schedule('12 1 * * *', function () {
    console.log("Cleanup proceeding...")
    const expireTime = new Date().getTime() - 8640000000;
    nedb.remove({timestamp: {$lte: expireTime}}, { multi: true }, function(err, numDeleted) {
        console.log('Deleted', numDeleted, 'entries');
        nedb.persistence.compactDatafile();
    });
});


