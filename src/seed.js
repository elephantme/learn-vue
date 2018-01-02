const config          = require('./config');
const DirectiveParser = require('./directive-parser');

const slice           = Array.prototype.slice,
    ancestorKeyRE     = /\^/g,
    ctrlAttr          = config.prefix + '-controller',
    eachAttr          = config.prefix + '-each';

function Seed (el, options) {
    if (typeof el === 'string') {
        el = document.querySelector(el);
    }

    el.seed = this;
    this.el = el;
    this._bindings = {};

    // copy options
    options = options || {};
    for (let op in options) {
        this[op] = options[op];
    }

    // initialize this scope object
    const dataPrefix = config.prefix + '-data';
    const scope = this.scope =
        (options && options.data)
        || config.datum[el.getAttribute(dataPrefix)]
        || {};
    el.removeAttribute(dataPrefix);

    scope.$seed = this;
    scope.$destroy = this._destroy.bind(this);
    scope.$dump = this._dump.bind(this);
    scope.$index = options.index;
    scope.$parent = options.parentSeed && options.parentSeed.scope;

    // recursively process nodes for directives
    this._compileNode(el, true);

    // if has controller
    const ctrlID = el.getAttribute(ctrlAttr);
    if (ctrlID) {
        el.removeAttribute(ctrlAttr);
        const controller = config.controllers[ctrlID];
        if (controller) {
            controller.call(this, this.scope);
        }
    }
}

Seed.prototype._compileNode = function(node, root) {
    const self = this;

    if (node.nodeType === 3) {
        self._compileTextNode(node);
    } else {
        const eachExp = node.getAttribute(eachAttr),
            ctrlExp = node.getAttribute(ctrlAttr);

        if (eachExp) { // each
            const binding = DirectiveParser.parse(eachAttr, eachExp);
            if (binding) {
                self._bind(node, binding);
            }
        } else if (ctrlExp && !root) { // nested controllers
            const id = node.id,
                seed = new Seed(node, {
                    child: true,
                    parentSeed: self
                });
            if (id) {
                self['$' + id] = seed;
            }
        } else { // normal node
            // parse if has attributes
            if (node.attributes && node.attributes.length) {
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
            // recusively compile childNodes
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
        let ancestors = key.match(ancestorKeyRE),
            root      = key.charAt(0) === '$';
        if (ancestors) {
            key = key.replace(ancestorKeyRE, '');
            let levels = ancestors.length;
            while (scopeOwner.parentSeed && levels--) {
                scopeOwner = scopeOwner.parentSeed;
            }
        } else if (root) {
            key = key.slice(1);
            while (scopeOwner.parentSeed) {
                scopeOwner = scopeOwner.parentSeed;
            }
        }
    }

    directive.key = key;

    if (directive.deps) {
        directive.deps.forEach(function(dep) {
            console.log(dep);
        });
    }

    const binding = scopeOwner._bindings[key] || scopeOwner._createBinding(key);

    // add directive to this binding
    binding.instances.push(directive);

    // invoke bind hook if exists
    if (directive.bind) {
        directive.bind(binding.value);
    }

    // set initial value
    if (binding.value) {
        directive.update(binding.value);
    }
};

Seed.prototype._createBinding = function(key) {
    const binding = {
        value: this.scope[key],
        changed: false,
        instances: []
    };

    this._bindings[key] = binding;

    Object.defineProperty(this.scope, key, {
        get: function() {
            return binding.value;
        },
        set: function(value) {
            if (value === binding) return;
            binding.value = value;
            binding.changed = true;
            binding.instances.forEach(function(instances) {
                instances.update(value);
            });
        }
    });

    return binding;
};

Seed.prototype._unbind = function() {
    const unbind = function(instance) {
        if (instance.unbind) {
            instance.unbind();
        }
    };
    for (let key in this._bindings) {
        this._bindings.instances.forEach(unbind);
    }
};

Seed.prototype._destroy = function() {
    this._unbind();
    delete this.el.seed;
    this.el.parentNode.remove(this.el);
    if (this.parentSeed && this.id) {
        delete this.parentSeed['$' + this.id];
    }
};

Seed.prototype._dump = function() {
    
};

module.exports = Seed;
