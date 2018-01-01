const config = require('./config');
const Directive =  require('./directive');

const map = Array.prototype.map,
    each = Array.prototype.forEach;

function Seed (el, data, options) {
    if (typeof el === 'string') {
        el = document.querySelector(el);
    }

    this.el = el;
    this.scope = {};
    this._bindings = {};
    this._options = options || {};

    this._compileNode(el);

    for(let key in this._bindings) {
        this.scope[key] = data[key];
    }
}

Seed.prototype._compileNode = function(node) {
    debugger;
    const self = this;

    if (node.nodeType === 3) {

    } else if (node.attributes && node.attributes.length) {
        const attrs = map.call(node.attributes, function(attr) {
            return {
                name: attr.name,
                value: attr.value
            };
        });
        attrs.forEach((attr) => {
            const directive = Directive.parse(attr);
            // console.log(directive)
            if (directive) {
                self._bind(node, directive);
            }
        });
    }

    if (!node['sd-block'] && node.childNodes.length) {
        each.call(node.childNodes, function(child) {
            self._compileNode(child);
        });
    }
};

Seed.prototype._bind = function(node, directive) {
    directive.seed = this;
    directive.el = node;

    node.removeAttribute(directive.attr.name);

    let key = directive.key;
    const epr = this._options.eachPrefixRE;
    if (epr) {
        key = key.replace(epr, '');
    }
    const binding = this._bindings[key] || this._createBinding(key);

    binding.directives.push(directive);

    if (directive.bind) {
        directive.bind.call(directive, binding.value);
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

Seed.prototype.destroy = function() {
    for (let key in this._bindings) {
        this._bindings[key].directives.forEach(unbind);
    }
    this.el.parentNode.remove(this.el);

    function unbind(directive) {
        if (directive.unbind) {
            directive.unbind();
        }
    }
};

module.exports = Seed;
