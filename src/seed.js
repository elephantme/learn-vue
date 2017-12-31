const config = require('./config');
const Directive =  require('./directive');

function Seed(el, data) {
    if (typeof el === 'string') {
        el = document.querySelector(el);
    }

    this.el = el;
    this._bindings = {};
    this.scope = {};

    const els = this.el.querySelectorAll(config.selector);
    [].forEach.call(els, this._compileNode.bind(this));
    this._compileNode(el);

    for(let key in this._bindings) {
        this.scope[key] = this._bindings[key];
    }
}

Seed.prototype._compileNode = function(node) {
    const self = this;
    cloneAttributes(node.attributes).forEach((attr) => {
        const directive = Directive.parse(attr);
        console.log(directive)
        if (directive) {
            self._bind(node, directive);
        }
    });
};

Seed.prototype._bind = function(node, directive) {
    directive.el = node;
    node.removeAttribute(directive.attr.name);

    const key = directive.key;
    const binding = this._bindings[key] || this._createBinding(key);

    binding.directives.push(directive);

    if (binding.bind) {
        binding.bind.call(node, binding.value);
    }
};

Seed.prototype._createBinding = function(key) {
    const binding = {
        value: undefined,
        directives: []
    };

    this._bindings[key] = binding;

    Object.defineProperty(this.scope, key, {
        get: function() {
            return binding.value;
        },
        set: function(value) {
            binding.value = value;
            binding.directives.forEach(function(directive) {
                directive.update(value);
            });
        }
    });

    return binding;
};

// clone attributes so they don't change
function cloneAttributes (attributes) {
    return [].map.call(attributes, function (attr) {
        return {
            name: attr.name,
            value: attr.value
        }
    })
}

module.exports = Seed;
