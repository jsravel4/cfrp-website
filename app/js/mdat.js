/*
* MDAT namespaces and utilities
*
* Copyright (c) 2015 MIT Hyperstudio
* Christopher York, 04/2015
*
*/

mdat = {};

mdat.visualization = {};

//
// General utility functions
//

mdat.spinner_callback = function(fn, elem, msg) {
  var callback1 = function() {
        if (msg) { checkpoint(); }
        fn.call();
        elem.classed("loading", false);
        if (msg) { checkpoint(msg); }
      },
      callback0 = function() {
        elem.classed("loading", true);
        setTimeout(callback1, 0);
      };
  return callback0;
}

//
// Utility functions for interacting with crossfilter
//

mdat.utils = {};

mdat.utils.reduceDistinct = function(fn) {
  return {
    add: function (p, d) {
      var val = fn(d);
      if (val in p.counts)
        p.counts[val]++;
      else
        p.counts[val] = 1;
      return p;
    },
    remove: function (p, d) {
      var val = fn(d);
      p.counts[val]--;
      if (p.counts[val] === 0)
        delete p.counts[val];
      return p;
    },
    init: function () {
      var p = {};
      p.counts = {};
      p.final = function() { return Object.keys(p.counts).length; };
      return p;
    }
  };
};

mdat.utils.reduceSum = function(fn) {
  return {
    add: function(p, v) {
      p.sum += fn(v);
      return p;
    },
    remove: function(p, v) {
      p.sum -= fn(v);
      return p;
    },
    init: function() {
      var p = {};
      p.sum = 0;
      p.final = function () { return Math.max(0, d3.round(p.sum, 0)); };
      return p;
    }
  };
};