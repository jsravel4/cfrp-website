mdat = {};

mdat.visualization = {};

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