/*
* MDAT Routing and history
*
* Copyright (c) 2015 MIT Hyperstudio
* Christopher York, 04/2015
*
*/

//
// N.B. this URL scheme will change!
//

mdat.router = {};


//
// Parse a given url, returning a query object or null
//

mdat.router.parse_url = function(url) {
  var i = url.indexOf('?'),
      params = decodeURI(url.substring(i+1)).split('&'),
      query = null;

  if (i > -1) {
    query = { rows: [], agg: 'sum(receipts)', filter: {} };
    params.forEach(function(p) {
      var v;
      // TODO.  check that values are valid
      /*
      if (v = p.match(/^row=(.+)$/))          { if (defs.dimensions[v[1]]) { query.rows.push(v[1]); } }
      if (v = p.match(/^agg=(.+)$/))          { if (defs.aggregates[v[1]]) { query.agg = v[1]; } }
      if (v = p.match(/^filter\.(.+)=(.+)$/)) { if (defs.dimensions[v[1]]) { query.filter[v[1]] = v[2]; } }
      */
      if (v = p.match(/^row=(.+)$/))                    { query.rows.push(v[1]); }
      if (v = p.match(/^agg=(.+)$/))                    { query.agg = v[1]; }
      if (v = p.match(/^filter\.(.+)=(.+)$/))           { query.filter[v[1]] = v[2]; }
    });
  }

  return query;
}

//
// Generate a url from the query object and the current window state
//

mdat.router.url = function(query) {
  var url_base = window.location.origin + window.location.pathname,
      params = [],
      result;

  d3.entries(query.filter).forEach(function(o) { params.push('filter.' + o.key + '=' + o.value); });
  query.rows.forEach(function(g) { params.push('row=' + g); });
  params.push('agg=' + query.agg);

  return url_base + '?' + encodeURI(params.join('&'));
}