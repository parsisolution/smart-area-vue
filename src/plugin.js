let SmartArea = require('./SmartArea');
let SmartInput = require('./SmartInput');

module.exports = {
    install: function (Vue, options) {
        Vue.component('smart-area', SmartArea);
        Vue.component('smart-input', SmartInput);
    }
};