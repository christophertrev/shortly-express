var db = require('../config');
// var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
// var genSaltSync = Promise.promisify(bcrypt.genSaltSync);

var bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));


var User = db.Model.extend({
  initialize: function(){
    this.on('creating', function(model, attrs, options){
      bcrypt.hashAsync(model.get('password'), null ,null)
      .then(function(hash){
        console.log('password is now ',hash);
        console.log('username ' ,model.get('username'));
        model.set('password', hash);
      });
    });
  },
});

module.exports = User;
