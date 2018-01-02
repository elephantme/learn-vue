const config = require('./config');
const Seed = require('./seed');
const directives = require('./directives');
const filters = require('./filters');

const controllers = config.controllers;
const datum = config.datum;
const api = {};

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

api.directive = function(name, fn) {
    if (!fn) return directives[name];
    directives[name] = fn;
};

api.filter = function(name, fn) {
    if (!fn) return filters[name];
    filters[name] = fn;
};

api.bootstrap = function(opts) {
    if (opts) {
        config.prefix = opts.prefix || config.prefix;
    }
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

module.exports = api;
