const config = require('./config');
const Directive = require('./directive');
const Directives = require('./directives');
const Filters = require('./filters');
const Seed = require('./seed');

function buildSelector() {
    config.selector = Object.keys(Directives).map((name) => `[${config.prefix}-${name}]`).join(',');
}

Seed.config = config;
buildSelector();

Seed.extend = function(opts) {

};

Seed.directive = function(name, fn) {
    Directive[name] = fn;
    buildSelector();
};

Seed.filter = function(name, fn) {
    Filters[name] = fn;
};

module.exports = Seed;

const Seed = function(opts) {
    const self = this,
        root = this.el = document.getElementById(opts.id),
        els = this.el.querySelectorAll(selector),
        bindings = {};

    this.scope = {};

    // 解析节点
    [].forEach.call(els,processNode);
    processNode(root);

    // 初始化
    Object.keys(bindings).forEach((key) => {
        this.scope[key] = opts.scope[key];
    });

    function processNode(el) {
        cloneAttributes(el.attributes).forEach((attr) => {
            const directive = parseDirective(attr);
            console.log(directive)
            if (directive) {
                bindDirective(self, el, bindings, directive);
            }
        });
    }
};

function cloneAttributes(attributes) {
    return [].map.call(attributes, (attr) => {
        return {
            name: attr.name,
            value: attr.value
        };
    });
}

function parseDirective(attr) {
    if (attr.name.indexOf(prefix) == -1) return;

    // 解析属性名称获取directive
    const noprefix = attr.name.slice(prefix.length + 1),
        argIndex = noprefix.indexOf('-'),
        dirname = argIndex === -1 ? noprefix : noprefix.slice(0, argIndex),
        arg = argIndex === -1 ? null : noprefix.slice(argIndex + 1),
        def = Directives[dirname]

    // 解析属性值获取filters
    const exp = attr.value,
        pipeIndex = exp.indexOf('|'),
        key = (pipeIndex === -1 ? exp : exp.slice(0, pipeIndex)).trim(),
        filters = pipeIndex === -1 ? null : exp.slice(pipeIndex + 1).split('|').map((filterName) => filterName.trim());

    return def ? {
        attr: attr,
        key: key,
        filters: filters,
        argument: arg,
        definition: Directives[dirname],
        update: typeof def === 'function' ? def : def.update
    } : null;
}

function bindDirective(seed, el, bindings, directive) {
    el.removeAttribute(directive.attr.name);
    const key = directive.key;
    let binding = bindings[key];

    if (!binding) {
        bindings[key] = binding = {
            value: undefined,
            directives: []
        };
    }

    directive.el = el;
    binding.directives.push(directive);

    if (!seed.scope.hasOwnProperty(key)) {
        bindAcessors(seed, key, binding);
    }

}

function bindAcessors(seed, key, binding) {
    Object.defineProperty(seed.scope, key, {
        get: function() {
            return binding.value;
        },
        set: function(value) {
            binding.value = value;
            // 触发directive
            binding.directives.forEach((directive) => {
                if (typeof value !== 'undefined' && directive.filters) {
                    value = applyFilters(value, directive);
                }
                directive.update(directive.el, value, directive.argument, directive);
            });
        }
    });
}

function applyFilters(value, directive) {
    if (directive.definition.customFilter) {
        return directive.definition.customFilter(value, directive.filters);
    } else {
        directive.filters.forEach((name) => {
            if (Filters[name]) {
                value = Filters[name](value);
            }
        });
        return value;
    }
}

module.exports = {
    create: function(opts) {
        return new Seed(opts);
    }
};