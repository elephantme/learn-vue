var directives = {
    text: function(el, value) {
        el.textContent = value || '';
    },
    class: function (el, value, classname) {
        el.classList[value ? 'add' : 'remove'](classname)
    },
    on: {
        update: function(el, handler, event, directive) {
            if (!directive.handlers) {
                directive.handlers = {};
            }
            const handlers = directive.handlers;
            if (handlers[event]) {
                el.removeEventListener(event, handlers[event]);
            }
            if (handler) {
                handler = handler.bind(el);
                el.addEventListener(event, handler);
                handlers[event] = handler;
            }
        },
        customFilter: function(handler, selectors) {
            return function(e) {
                const match = selectors.every((selector) => e.target.matches(selector));
                if (match) {
                    handler.apply(this, arguments);
                }
            }
        }
    }
};

module.exports = directives;
