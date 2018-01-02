const config = require('./config');
const DirectiveParser =  require('./directive-parser');

const slice = Array.prototype.slice;

const ancestorKeyRE = /\^/g,
    rootKeyRE = /^\$/;

let ctrlAttr,
    eachAttr;

function Seed (el, options) {
    ctrlAttr = config.prefix + '-controller';
    eachAttr = config.prefix + '-each';

    if (typeof el === 'string') {
        el = document.querySelector(el);
    }

    el.seed = this;
    this.el = el;
    this._bindings = {};
    this.components = {};

    if (options) {
        for (let op in options) {
            this[op] = options[op];
        }
    }

    const dataPrefix = config.prefix + '-data';

    this.scope =
        (options && options.data)
        || config.datum[el.getAttribute(dataPrefix)]
        || {};

    el.removeAttribute(dataPrefix);

    this._dataCopy = {}
    for (let key in this.scope) {
        this._dataCopy[key] = this.scope[key];
    }

    const ctrlID = el.getAttribute(ctrlAttr);
    let controller = null;
    if (ctrlID) {
        controller = config.controllers[ctrlID];
        if (!controller) throw new Error('controller ' + ctrlID + ' is not defined.')
        el.removeAttribute(ctrlAttr);
    }

    this._compileNode(el, true);

    for(let key in this._dataCopy) {
        this.scope[key] = this._dataCopy[key];
    }

    if (controller) {
        controller.call(this, this.scope, this);
    }
}

Seed.prototype._compileNode = function(node, root) {
    const self = this;

    if (node.nodeType === 3) {
        self._compileTextNode(node);
    } else {
        const eachExp = node.getAttribute(eachAttr),
            ctrlExp = node.getAttribute(ctrlAttr);

        if (eachExp) {
            const binding = DirectiveParser.parse(eachAttr, eachExp);
            if (binding) {
                self._bind(node, binding);
                self.scope[binding.key] = self._dataCopy[binding.key];
                delete self._dataCopy[binding.key];
            }
        } else if (ctrlExp && !root) { // nested controllers
            const id = node.id,
                seed = new Seed(node, {
                    parentSeed: self
                });

            if (id) {
                self['$' + id] = seed;
            }
        } else if (node.attributes && node.attributes.length) {
            slice.call(node.attributes).forEach(function(attr) {
                let valid = false;
                attr.value.split(',').forEach(function(exp) {
                    const binding = DirectiveParser.parse(attr.name, exp)
                    if (binding) {
                        valid = true;
                        self._bind(node, binding);
                    }
                });
                if (valid) node.removeAttribute(attr.name);
            });
        }

        if (!eachExp && !ctrlExp) {
            if (node.childNodes.length) {
                slice.call(node.childNodes).forEach(function (child) {
                    self._compileNode(child);
                });
            }
        }
    }
};

Seed.prototype._compileTextNode = function (node) {
    return node;
};

Seed.prototype._bind = function(node, directive) {
    directive.el = node;
    directive.seed = this;

    let key = directive.key,
        snr = this.eachPrefixRE,
        isEach = snr && snr.test(key),
        scopeOwner = this;

    if (isEach) {
        key = key.replace(snr, '');
    }

    // 处理嵌套作用域
    if (snr && !isEach) {
        scopeOwner = this.parentSeed;
    } else {
        var ancestors = key.match(ancestorKeyRE),
            root      = key.match(rootKeyRE)
        if (ancestors) {
            key = key.replace(ancestorKeyRE, '')
            var levels = ancestors.length
            while (scopeOwner.parentSeed && levels--) {
                scopeOwner = scopeOwner.parentSeed
            }
        } else if (root) {
            key = key.replace(rootKeyRE, '')
            while (scopeOwner.parentSeed) {
                scopeOwner = scopeOwner.parentSeed
            }
        }
    }

    directive.key = key;

    const binding = scopeOwner._bindings[key] || scopeOwner._createBinding(key);

    binding.instances.push(directive);

    if (directive.bind) {
        directive.bind(binding.value);
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
        delete this._binding[key];
    }
    this.el.parentNode.remove(this.el);

    function unbind(instance) {
        if (instance.unbind) {
            instance.unbind();
        }
    }
};

module.exports = Seed;
