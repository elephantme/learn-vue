const config = require('./config');
const Directives = require('./directives');
const Filters = require('./filters');

const KEY_REG = /^[^\|]+/;
const FILTER_REG = /\|[^\|]+/g;

function Directive(def, attr, arg, key) {
    if (typeof def === 'function') {
        this._update = def;
    } else {
        for(let prop in def) {
            if (prop === 'update') {
                this._update = def.update;
                continue;
            }
            this[prop] = def[prop];
        }
    }

    this.attr = attr;
    this.arg = arg;
    this.key = key;

    // 解析filters
    const filters = attr.value.match(FILTER_REG);
    if (filters) {
        this.filters = filters.map(function(filter) {
            const tokens = filter.replace('|', '').trim().split(/\s+/);
            return {
                name: tokens[0],
                apply: Filters[tokens[0]],
                args: tokens.length > 1 ? tokens.slice(1) : null
            };
        });
    }
}

Directive.prototype.update = function(value) {
    if (this.filters) {
        value = this.applyFilters(value);
    }
    this._update(value);
};

Directive.prototype.applyFilters = function(value) {
    var filtered = value;
    this.filters.forEach(function (filter) {
        if (!filter.apply) throw new Error('Unknown filter: ' + filter.name)
        filtered = filter.apply(filtered, filter.args);
    })
    return filtered;
};

module.exports = {
    parse: function(attr) {
        if (attr.name.indexOf(config.prefix) == -1) null;

        // 解析属性名称获取directive
        const noprefix = attr.name.slice(config.prefix.length + 1),
            argIndex = noprefix.indexOf('-'),
            dirname = argIndex === -1 ? noprefix : noprefix.slice(0, argIndex),
            arg = argIndex === -1 ? null : noprefix.slice(argIndex + 1),
            def = Directives[dirname];

        const key = attr.value.match(KEY_REG);

        return def && key
            ? new Directive(def, attr, arg, key[0].trim())
            : null;
    }
};
