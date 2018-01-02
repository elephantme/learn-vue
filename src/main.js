const config = require('./config');
const Seed = require('./seed');
const directives = require('./directives');
const filters = require('./filters');

const controllers = config.controllers = {};
const datum = config.datum = {};
const api = {};

api.config = config;

api.extend = function(opts) {
    const Spore = function() {
        Seed.apply(this, arguments);
        for(let prop in this.extensions) {
            let ext = this.extensions[prop];
            if (typeof ext === 'function') {
                ext = ext.bind(this);
            }
            this.scope[prop] = ext;
        }
    };

    Spore.prototype = Object.create(Seed.prototype);
    Spore.prototype.extensions = {};
    for(let prop in opts) {
        Spore.prototype.extensions[prop] = opts[prop];
    }

    return Spore;
};

api.data = function(id, data) {
    if (!data) return datum[id];
    datum[id] = data;
};

api.controller = function(id, extensions) {
    if (!extensions) return controllers[id];
    if (controllers[id]) {
        console.warn(`controllere ${id} was already registered and has been overwritten.`);
    }
    controllers[id] = extensions;
};

api.bootstrap = function() {
    let app = {},
        n = 0,
        el, seed;

    // 下次循环就退出了，因为attribute被remove掉了
    while (el = document.querySelector(`[${config.prefix}-controller]`)) {
        seed = new Seed(el);
        if (el.id) {
            app['$' + el.id] = seed;
        }
        n++;
    }

    return n > 1 ? app : seed;
};

api.directive = function(name, fn) {
    directive[name] = fn;
};

api.filter = function(name, fn) {
    filters[name] = fn;
};

module.exports = api;
