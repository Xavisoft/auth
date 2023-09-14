
const atob = require('atob');
const { EventEmitter } = require('events');



const localStorage = {

   _data: {},

   setItem: function(key, data) {
      this._data[key] = data;
   },

   getItem: function(key) {
      return this._data[key] || null;
   },
}


class Window extends EventEmitter {
}

Window.prototype.addEventListener = Window.prototype.on;
Window.prototype.atob = atob;
Window.prototype.localStorage = localStorage;


const window = new Window(); 

module.exports = window;