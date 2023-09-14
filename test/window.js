
const atob = require('atob');


function addEventListener() {

}


const localStorage = {

   _data: {},

   setItem: function(key, data) {
      this._data[key] = data;
   },

   getItem: function(key) {
      return this._data[key] || null;
   },
}


const window = {
   addEventListener,
   atob,
   localStorage,
}

module.exports = window;