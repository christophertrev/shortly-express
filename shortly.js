var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());

app.use(cookieParser());
app.use(expressSession({
  key: "mysite.sid.uid.whatever",
  secret: 'secret',
  cookie: {
    maxAge: 2678400000 // 31 days
  },
}));

// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


app.get('/', checkUser,
function(req, res) {
  res.render('index');
});

app.get('/create', checkUser,
function(req, res) {
  res.render('index');
});

app.get('/links', checkUser,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    console.log(links.models);
    res.send(200, links.models);
  });
});

app.get('/logout',
function(req, res) {
  req.session.destroy();
  res.render('login');
});

app.get('/signup' ,
function(req, res) {
  res.render('signup');
});

app.post('/links', checkUser,
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
function checkUser(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.render('login');
  }
}

// app.post('/login', function (req, res, next){
//   console.log('req.body', req.body)
//   var username = req.body.username;
//   var password = req.body.password;

//   if(username === 'demo' && password === 'demo'){
//     req.session.regenerate(function(){
//       req.session.user = username;
//       res.redirect('/');
//     });
//   }
//   else {
//     res.render('login');
//   }
// });

app.post('/signup', function (req, res, next){
  var username = req.body.username;
  var password = req.body.password;
  var newUser = new User({
    username: username,
    password: password
  });
  newUser.save().then(function(savedUser){
   req.session.regenerate(function(){
      req.session.user = savedUser;
      res.redirect('/');
    });
  })
});

app.post('/login', function (req, res, next){
  var username = req.body.username;
  var password = req.body.password;
  new User({username: username}).fetch().then(function(user){
    if(!user){
      res.render('login');
    } else {
      user.comparePassword(password, function(correct){
        if (correct){
          req.session.regenerate(function(){
             req.session.user = user;
             res.redirect('/');
           });
        } else {
          res.render('login');
        }
      })
    }
  })
});



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
