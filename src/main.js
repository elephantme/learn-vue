const config = require('./config');
const Seed = require('./seed');
const directives = require('./directives');
const filters = require('./filters');
const controllers = require('./controllers');

Seed.config = config;

Seed.extend = function(opts) {
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

Seed.controller = function(id, extensions) {
    if (controllers[id]) {
        console.warn(`controllere ${id} was already registered and has been overwritten.`);
    }
    controllers[id] = extensions;
};

Seed.bootstrap = function(seeds) {
    if (!Array.isArray(seeds)) seeds = [seeds];
    const instances = [];
    seeds.forEach(function(seed) {
        let el = seed.el;
        if (typeof el === 'string') {
            el = document.querySelector(el);
        }
        if (!el) console.warn('invalid element or selector: ' + seed.el);
        instances.push(new Seed(el, seed.data, seed.options));
    });
    return instances.length > 1 ? instances : instances[0];
};

Seed.directive = function(name, fn) {
    directive[name] = fn;
};

Seed.filter = function(name, fn) {
    filters[name] = fn;
};

module.exports = Seed;
