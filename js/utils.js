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
