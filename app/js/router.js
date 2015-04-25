mdat.router = {};

//
// Routing
//
// N.B. this URL scheme will change!

mdat.router.install = function(cfrp, url, default_query) {
  var i = url.indexOf('?'),
      params = decodeURI(url.substring(i+1)).split('&'),
      query = null;

  if (i > -1) {
    query = { rows: [], agg: 'sum(receipts)', filter: {} };
    params.forEach(function(p) {
      var v;
      if (v = p.match(/^row=(.+)$/))          { if (cfrp.defs.dimensions[v[1]]) { query.rows.push(v[1]); } }
      if (v = p.match(/^agg=(.+)$/))          { if (cfrp.defs.aggregates[v[1]]) { query.agg = v[1]; } }
      if (v = p.match(/^filter\.(.+)=(.+)$/)) { if (cfrp.defs.dimensions[v[1]]) { query.filter[v[1]] = v[2]; } }
    });
  }

  cfrp.cur_query = query || default_query;

  // for sanity: move to the parsed query URI immediately
  history.replaceState(null, "", mdat.router.url(cfrp.cur_query));

  cfrp.on("refine", function() { mdat.router.record(cfrp); });
}

mdat.router.url = function(query) {
  var url_base = window.location.origin + window.location.pathname,
      params = [];

  d3.entries(query.filter).forEach(function(o) { params.push('filter.' + o.key + '=' + o.value); });
  query.rows.forEach(function(g) { params.push('row=' + g); });
  params.push('agg=' + query.agg);

  return url_base + '?' + encodeURI(params.join('&'));
}

mdat.router.filter_dimensions = {};
mdat.router.record = function(cfrp) {
  var query = cfrp.cur_query,
      result = mdat.router.url(query);

  // round-trip as sanity check
  // if (mdat.router.url(parse_url(result)) !== result) { console.log("URL encoding problem: " + result + " for " + JSON.stringify(query)); }

  console.log("updating the cached dimensions...");

  history.pushState(null, "", result);

  // construct a complete list of past + present filter dimensions
  var filter_keys = d3.set(d3.keys(query.filter));
  d3.keys(mdat.router.filter_dimensions).forEach(function(k) { filter_keys.add(k); });

  // update crossfilter for each
  filter_keys.forEach(function(k) {
    if (query.filter[k]) {
      if (!mdat.router.filter_dimensions[k]) {
        console.log("creating dimension: " + k);
        mdat.router.filter_dimensions[k] = cfrp.dimension(cfrp.defs.dimensions[k]);
      }
      console.log("refining " + k + " = " + query.filter[k]);
      mdat.router.filter_dimensions[k].filterExact(query.filter[k]);
    } else {
      console.log("clearing dimension: " + k);
      mdat.router.filter_dimensions[k].filterAll();
    }
  });

  // update other components
  cfrp.change();
}