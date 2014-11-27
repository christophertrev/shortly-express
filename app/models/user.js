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
