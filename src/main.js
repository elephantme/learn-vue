const config = require('./config');
const directives = require('./directives');
const filters = require('./filters');
const Seed = require('./seed');

// function buildSelector() {
//     config.selector = Object.keys(Directives).map((name) => `[${config.prefix}-${name}]`).join(',');
// }

Seed.config = config;
// buildSelector();

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

Seed.directive = function(name, fn) {
    directive[name] = fn;
    // buildSelector();
};

Seed.filter = function(name, fn) {
    filters[name] = fn;
};

module.exports = Seed;
