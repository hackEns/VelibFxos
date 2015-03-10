"use strict";

// Bind a last method on Array
if (typeof(Array.prototype.last) != 'function') {
    Array.prototype.last = function() {
        return this[this.length - 1];
    };
}

// Bind a startswith method on String
if (typeof(String.prototype.startsWith) != 'function') {
    String.prototype.startsWith = function(str) {
        return this.substring(0, str.length) === str;
    };
}

// Production steps, ECMA-262, Edition 5, 15.4.4.21
// Référence : http://es5.github.io/#x15.4.4.21
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function(callback /*, initialValue*/) {
        'use strict';
        if (this == null) {
            throw new TypeError('Array.prototype.reduce appelé sur null ou undefined');
        }
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' n est pas une fonction');
        }
        var t = Object(this), len = t.length >>> 0, k = 0, value;
        if (arguments.length == 2) {
            value = arguments[1];
        } else {
            while (k < len && ! (k in t)) {
                k++;
            }
            if (k >= len) {
                throw new TypeError('Réduction de tableau vide sans valeur initiale');
            }
        value = t[k++];
        }
        for (; k < len; k++) {
            if (k in t) {
                value = callback(value, t[k], k, t);
            }
        }
        return value;
    };
}


if (!Date.now) {
    Date.now = function() { return (new Date()).getTime(); }
}
