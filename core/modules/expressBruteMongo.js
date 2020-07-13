/*

 Originally written by Auth0:
 https://github.com/auth0/express-brute-mongo/blob/master/auth0.com

 Modified and ES6ized by Michael A. Matveev

 */

const AbstractClientStore = require('express-brute/lib/AbstractClientStore');
const moment = require('moment');

const hasOwnProperty = Object.prototype.hasOwnProperty;

function xtend() {
  let target = {};
  for (let i = 0; i < arguments.length; i++) {
    const source = arguments[i];
    for (let key in source) {
      if (hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
}

let MongoStore = (module.exports = function(getCollection, options) {
  AbstractClientStore.apply(this, arguments);
  this.options = xtend({}, MongoStore.defaults, options);
  let that = this;
  getCollection(function(collection) {
    that._collection = collection;
  });
});

MongoStore.prototype = Object.create(AbstractClientStore.prototype);

MongoStore.prototype.set = function(key, value, lifetime, callback) {
  const _id = this.options.prefix + key;
  const expiration = lifetime
    ? moment()
        .add(lifetime, 'seconds')
        .toDate()
    : undefined;
  this._collection.update(
    {
      _id: _id
    },
    {
      _id: _id,
      data: value,
      expires: expiration
    },
    {
      upsert: true
    },
    function() {
      if (callback) {
        callback.apply(this, arguments);
      }
    }
  );
};

MongoStore.prototype.get = function(key, callback) {
  const _id = this.options.prefix + key;
  const collection = this._collection;
  collection.findOne({ _id: _id }, function(err, doc) {
    if (err) {
      if (typeof callback === 'function') {
        callback(err, null);
      }
    } else {
      let data;
      if (doc && doc.expires < new Date()) {
        collection.remove({ _id: _id }, { w: 0 });
        return callback();
      }
      if (doc) {
        data = doc.data;
        data.lastRequest = new Date(data.lastRequest);
        data.firstRequest = new Date(data.firstRequest);
      }
      if (typeof callback === 'function') {
        callback(err, data);
      }
    }
  });
};

MongoStore.prototype.reset = function(key, callback) {
  const _id = this.options.prefix + key;
  this._collection.remove({ _id: _id }, function() {
    if (typeof callback === 'function') {
      callback.apply(this, arguments);
    }
  });
};

MongoStore.defaults = {
  prefix: ''
};
