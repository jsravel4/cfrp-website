mdat = {};

mdat.visualization = {};

/*

  usage for calendar:

    (1) group values by date, then reduce and quantize

    (2) group values by year, then reduce and quantize

    (3) return results matching date ranges

  usage for pivot:

    (1) group by value by dimensions then reduce


function cardinality(v, f) {
    var o = Object.create(null);
    for(var i=0; i<v.length; i++) {
      var val = f ? f(v[i]) : v[i];
      if(val && !o[val]) { o[val] = true; }
    }
    var i = 0;
    for(var val in o) { i = i + 1; }
    return i;
  }

function identity(v) { return v; }


space = function(data) {

  var by_date = Object.create(null),
      by_year = Object.create(null);

  data.forEach(function(d) {
    bucket(function(d0) { return d3.time.day(d0.date); }, by_date, d);
    bucket(function(d0) { return d3.time.year(d0.date); }, by_year, d);
  });

  var years = d3.keys(by_year).map(function(k) { return { key: k, value: cardinality(by_year[k], function(d) { return d.date; }) }; });

  return years;

  function bucket(f, o, d) {
    var v = f(d);
    if (!o[v]) { o[v] = []; }
    o[v].push(d);
    return o;
  }
}

*/