//
// Pivot table UI 
//

mdat.visualization.pivot_table = function() {

  var dimensions = {},
      aggregates = {},
      formats = {};

  var uid = 0,
      cfrp = undefined;


  function chart(selection) {
    // TODO.... remove to a data provider interface
    var dummy_dim = cfrp.dimension(function(d) { return d.date; });

    selection.each(function(d, i) {
      var namespace = "pivot_" + uid++;

      var root = d3.select(this)
          .classed("pivot", true);

      var table = root.append("div")
         .classed("scroll", true)
        .append("table");

      var thead = table.append("thead");
      var tbody = table.append("tbody");

      // listen for changes & initial update
      cfrp.on("refine." + namespace, update_filters);
      cfrp.on("change." + namespace, mdat.spinner_callback(update, root, "Updated pivot"));

      //
      // update display when query changes
      //

      function update() {
        // run report and convert to html table format
        var query = cfrp.cur_query(),
            data = dummy_dim.top(Infinity),
            tree = report(query, data),
            table = tableize(tree, query.rows);

        // pivot table proper
        var th = thead.selectAll("th")
          .data(query.rows.concat([query.agg]));

        // table headers
        th.exit().remove();
        var th0 = th.enter().append("th");
        th0.append("span").attr("class", "category");

        th.select(".category").html(function(d) { return d; });

        // table body: categories and aggregate values

        var tr = tbody.selectAll("tr")
          .data(table);
        tr.exit().remove();
        tr.enter().append("tr");

        var td = tr.selectAll("td")
          .data(function(d) { return d; })
        td.exit().remove();
        td.enter().append("td");
        td.attr("rowspan", function(v) { return v.span || 1; });
        td.html(function(v) { return v.value; })
          .classed("refinable", function(d) { return d.category && d.value; })
          .on("click", function(d) {
            query.filter[d.category] = d.value;
            cfrp.refine(query);
            console.log("filtered: " + JSON.stringify(query));
            cfrp.change();
/* Uncomment to remove to stop grouping on categories as they are filtered.
              var idx = q.rows.indexOf(d.category);
              if (idx > -1) { q.rows.splice(idx, 1); }
*/
          });
      }


      //
      // Update indexed dimensions to match the given query.
      //
      // Excess dimensions are removed only when they reach the collection threshold.
      //

      var filter_dimensions = {};
      function update_filters(filter) {
        // construct a complete list of past + present filter dimensions
        var query = cfrp.cur_query(),
            filter_keys = d3.set(d3.keys(query.filter));

        d3.keys(filter_dimensions).forEach(function(k) { filter_keys.add(k); });

        // update crossfilter for each
        filter_keys.forEach(function(k) {
          if (query.filter[k]) {
            if (!filter_dimensions[k]) {
              console.log("creating filter dimension: " + k);
              filter_dimensions[k] = cfrp.dimension(dimensions[k]);
            }
            console.log("refining " + k + " = " + query.filter[k]);
            filter_dimensions[k].filterExact(query.filter[k]);
          } else {
            console.log("clearing dimension: " + k);
            filter_dimensions[k].filterAll();
          }
        });
      }

      //
      // calculate pivot table values: filter, grouping, aggregates
      //

      function report(query, data) {
        var nest = d3.nest();

        console.log("pivoting over " + data.length + " items");

        // grouping
        query.rows.forEach(function(g) {
          nest = nest.key(function(v) { return fmt(g)(dimensions[g](v)); })
                     .sortKeys(d3.ascending);
        });

        // aggregation
        if (query.agg) {
          nest = nest.rollup(function(v) { return fmt(query.agg)(aggregates[query.agg](v)); });
        }

        data = nest.entries(data);

        return data;

        function fmt(g) {
          return formats[g] || function(v) { return v; };
        }
      }

      //
      // convert tree of results to html-style list of leaves with spans
      //
      // (technically, a preorder traversal annotating each node with the size of the branch)
      //

      function tableize(tree, categories) {
        var result = [];

        if (tree.length > 0) {
          recurse([], { values: tree }, -1);
        }

        return result;

        function recurse(h, d, i) {
          if (Array.isArray(d.values)) {
            var head = d.values[0],
                tail = d.values.slice(1,d.length);
            if (d.key) {  
              h = h.concat( [ { category: categories[i], value: d.key, span: leaves(d) } ]);
            }
            recurse(h, head, i+1);
            tail.forEach(function(d) { recurse([], d, i+1); });
          } else {
            h = h.concat( [ { category: categories[i], value: d.key }, { value: d.values } ]);
            result.push(h);
          }
        }

        function leaves(d) {
          if (Array.isArray(d.values)) {
            var counts = d.values.map(leaves);
            return counts.reduce(function(e, f) { return e + f; }, 0);
          } else { return 1; }
        }
      }

    });
  };

  chart.datapoint = function(value) {
    if (!arguments.length) return cfrp;
    cfrp = value;
    return chart;
  };

  chart.dimension = function(key, fn) {
    if (!arguments.length) return dimensions;
    dimensions[key] = fn;
    return chart;
  };

  chart.aggregate = function(key, fn) {
    if (!arguments.length) return aggregates;
    aggregates[key] = fn;
    return chart;
  };

  chart.format = function(key, fn) {
    if (!arguments.length) return formats;
    formats[key] = fn;
    return chart;
  };

  return chart;
};