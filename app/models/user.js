var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
// var genSaltSync = Promise.promisify(bcrypt.genSaltSync);

 // var bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));


var User = db.Model.extend({
  tableName: 'users',
  initialize: function(){
    this.on('creating', this.hashPassword);
  },

  comparePassword: function (password, callback){
    var compare = Promise.promisify(bcrypt.compare);
    compare(password, this.get('password'))
    .then(function(isMatch){
      callback(isMatch);
    })
    
  },
  
  hashPassword: function () {
    var cipher = Promise.promisify(bcrypt.hash)
    return cipher(this.get('password'),null,null)
      .bind(this)
      .then(function(hash){
        this.set('password',hash);
    })
  },
});

module.exports = User;
