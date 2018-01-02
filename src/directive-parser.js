const config = require('./config');
const directives = require('./directives');
const filters = require('./filters');

var KEY_RE          = /^[^\|<]+/,
    ARG_RE          = /([^:]+):(.+)$/,
    FILTERS_RE      = /\|[^\|<]+/g,
    FILTER_TOKEN_RE = /[^\s']+|'[^']+'/g,
    DEPS_RE         = /<[^<\|]+/g

// parse a key, extract argument and nesting/root info
function parseKey (rawKey) {
    
    var res = {},
        argMatch = rawKey.match(ARG_RE)

    res.key = argMatch
        ? argMatch[2].trim()
        : rawKey.trim()

    res.arg = argMatch
        ? argMatch[1].trim()
        : null

    var nesting = res.key.match(/^\^+/)
    res.nesting = nesting
        ? nesting[0].length
        : false

    res.root = res.key.charAt(0) === '$'
    return res
}

function parseFilter (filter) {

    var tokens = filter.slice(1)
        .match(FILTER_TOKEN_RE)
        .map(function (token) {
            return token.replace(/'/g, '').trim()
        })

    return {
        name  : tokens[0],
        apply : filters[tokens[0]],
        args  : tokens.length > 1
                ? tokens.slice(1)
                : null
    }
}

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

    this.directiveName = directiveName
    this.expression = expression

    var rawKey   = expression.match(KEY_RE)[0],
        keyInfo  = parseKey(rawKey)

    for (var prop in keyInfo) {
        this[prop] = keyInfo[prop]
    }
    
    var filterExps = expression.match(FILTERS_RE)
    this.filters = filterExps
        ? filterExps.map(parseFilter)
        : null

    var depExp = expression.match(DEPS_RE)
    this.deps = depExp
        ? depExp[0].slice(1).trim().split(/\s+/).map(parseKey)
        : null
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
