const config = require('./config');
const controllers = require('./controllers');
const bindingParse =  require('./binding');

const map = Array.prototype.map,
    each = Array.prototype.forEach;

let ctrlAttr,
    eachAttr;

function Seed (el, data, options) {
    ctrlAttr = config.prefix + '-controller';
    eachAttr = config.prefix + '-each';

    if (typeof el === 'string') {
        el = document.querySelector(el);
    }

    this.el = el;
    this.scope = data;
    this._bindings = {};
    this._options = options || {};

    let dataCopy = {}
    for (let key in data) {
        dataCopy[key] = data[key];
    }

    const ctrlID = el.getAttribute(ctrlAttr);
    let controller = null;
    if (ctrlID) {
        controller = controllers[ctrlID];
        el.removeAttribute(ctrlAttr);
        if (!controller) throw new Error('controller ' + ctrlID + ' is not defined.')
    }

    this._compileNode(el, true);

    for(let key in this._bindings) {
        this.scope[key] = dataCopy[key];
    }

    if (controller) {
        controller.call(null, this.scope, this);
    }
}

Seed.prototype._compileNode = function(node, root) {
    const self = this;

    if (node.nodeType === 3) {
        self._compileTextNode(node);
    } else if (node.attributes && node.attributes.length) {
        const eachExp = node.getAttribute(eachAttr),
            ctrlExp = node.getAttribute(ctrlAttr);

        if (eachExp) {
            const binding = bindingParse.parse(eachAttr, eachExp);
            if (binding) {
                self._bind(node, binding);
            }
        } else if (!ctrlExp || root) {
            const attrs = map.call(node.attributes, function(attr) {
                return {
                    name: attr.name,
                    expressions: attr.value.split(',')
                };
            });
            attrs.forEach((attr) => {
                let valid = false;
                attr.expressions.forEach(function(exp) {
                    const binding = bindingParse.parse(attr.name, exp);
                    console.log(binding)
                    if (binding) {
                        valid = true;
                        self._bind(node, binding);
                    }
                });
                if (valid) node.removeAttribute(attr.name);
            });
            if (node.childNodes.length) {
                each.call(node.childNodes, function(child) {
                    self._compileNode(child);
                });
            }
        }
    }
};

Seed.prototype._compileTextNode = function (node) {
    return node;
};

Seed.prototype._bind = function(node, bindingInstance) {
    bindingInstance.seed = this;
    bindingInstance.el = node;

    let key = bindingInstance.key,
        epr = this._options.eachPrefixRE,
        isEach = epr && epr.test(key),
        seed = this;

    if (isEach) {
        key = key.replace(epr, '');
    } else if (epr) {
        seed = this._options.parentSeed;
    }

    const binding = seed._bindings[key] || seed._createBinding(key);

    binding.instances.push(bindingInstance);

    if (bindingInstance.bind) {
        bindingInstance.bind.call(bindingInstance, binding.value);
    }
};

Seed.prototype._createBinding = function(key, scope) {
    const binding = {
        value: undefined,
        instances: []
    };

    this._bindings[key] = binding;

    Object.defineProperty(this.scope, key, {
        get: function() {
            return binding.value;
        },
        set: function(value) {
            binding.value = value;
            binding.instances.forEach(function(instances) {
                instances.update(value);
            });
        }
    });

    return binding;
};

Seed.prototype.destroy = function() {
    for (let key in this._bindings) {
        this._bindings[key].instances.forEach(unbind);
    }
    this.el.parentNode.remove(this.el);

    function unbind(instance) {
        if (instance.unbind) {
            instance.unbind();
        }
    }
};

module.exports = Seed;
