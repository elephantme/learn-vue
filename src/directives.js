const watchArray = require('./watchArray');

const directives = {
    text: function(value) {
        this.el.textContent = value || '';
    },

    show: function (value) {
        this.el.style.display = value ? '' : 'none';
    },

    class: function (value, classname) {
        this.el.classList[value ? 'add' : 'remove'](classname)
    },

    on: {
        update: function(handler) {
            const event = this.arg;
            if (!this.handlers) {
                this.handlers = {};
            }
            const handlers = this.handlers;
            if (handlers[event]) {
                this.el.removeEventListener(event, handlers[event]);
            }
            if (handler) {
                this.el.addEventListener(event, handler);
                handlers[event] = handler;
            }
        },

        unbind: function() {
            var event = this.arg;
            if (this.handlers) {
                this.el.removeEventListener(event, this.handlers[event]);
            }
        }
    },

    each: {
        bind: function() {
            debugger
            this.el['sd-block'] = true;
            this.prefixRE = new RegExp('^' + this.arg + '.')
            var ctn = this.container = this.el.parentNode
            this.marker = document.createComment('sd-each-' + this.arg + '-marker')
            ctn.insertBefore(this.marker, this.el)
            ctn.removeChild(this.el)
            this.childSeeds = [];
            console.log('bind', this);
        },

        update: function(collection) {
            if (this.childSeeds.length) {
                this.childSeeds.forEach(function (child) {
                    child.destroy()
                })
                this.childSeeds = []
            }
            watchArray(collection, this.mutate.bind(this))
            var self = this
            collection.forEach(function (item, i) {
                self.childSeeds.push(self.buildItem(item, i, collection))
            })
        },

        mutate: function(mutation) {
            console.log(mutation);
            console.log(this);
        },

        buildItem: function (data, index, collection) {
            var node = this.el.cloneNode(true),
                spore = new Seed(node, data, {
                    eachPrefixRE: this.prefixRE,
                    parentScope: this.seed.scope
                })
            this.container.insertBefore(node, this.marker)
            collection[index] = spore.scope
            return spore
        }
    }
};

module.exports = directives;
