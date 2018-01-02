const config = require('./config');
const directives = require('./directives');
const filters = require('./filters');

const KEY_RE        = /^[^\|]+/,
    ARG_RE          = /([^:]+):(.+)$/,
    FILTERS_RE      = /\|[^\|]+/g,
    FILTER_TOKEN_RE = /[^\s']+|'[^']+'/g,
    QUOTE_RE        = /'/g;

function Binding(directiveName, expression) {
    const directive = directives[directiveName];
    if (typeof directive === 'function') {
        this._update = directive;
    } else {
        for(let prop in directive) {
            if (prop === 'update') {
                this._update = directive.update;
                continue;
            }
            this[prop] = directive[prop];
        }
    }

    const rawKey = expression.match(KEY_RE)[0],
        argMatch = rawKey.match(ARG_RE);

    this.key = argMatch ? argMatch[2].trim() : rawKey.trim();
    this.arg = argMatch ? argMatch[1].trim() : null;

    // 解析filters
    const filterExpressions = expression.match(FILTERS_RE);
    if (filterExpressions) {
        this.filters = filterExpressions.map(function(filter) {
            const tokens = filter.slice(1)
                .match(FILTER_TOKEN_RE)
                .map(function(token) {
                    return token.replace(QUOTE_RE, '').trim();
                });
            return {
                name: tokens[0],
                apply: filters[tokens[0]],
                args: tokens.length > 1 ? tokens.slice(1) : null
            };
        });
    } else {
        this.filters = null;
    }
}

Binding.prototype.update = function(value) {
    if (this.filters) {
        value = this.applyFilters(value);
    }
    this._update(value);
};

Binding.prototype.applyFilters = function(value) {
    var filtered = value;
    this.filters.forEach(function (filter) {
        if (!filter.apply) throw new Error('Unknown filter: ' + filter.name)
        filtered = filter.apply(filtered, filter.args);
    })
    return filtered;
};

module.exports = {
    parse: function(dirname, expression) {
        const prefix = config.prefix;

        if (dirname.indexOf(prefix) == -1) null;

        dirname = dirname.slice(config.prefix.length + 1);

        const dir = directives[dirname],
            valid = KEY_RE.test(expression);

        return dir && valid
            ? new Binding(dirname, expression)
            : null;
    }
};
