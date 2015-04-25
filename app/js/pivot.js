//
// Pivot table UI 
//

mdat.visualization.pivot_table = function() {

  var uid = 0,
      cfrp = undefined;

  //
  // Formatting dimension & aggregate values
  //

  var formats = {
    Day:   d3.time.format("%a %d %b %Y"),
    Decade: d3.time.format("%Y"),
    'sum(receipts)': d3.format(",.2f"),
    'avg(receipts/day)': d3.format(",.2f"),
    'sum(sold)': d3.format(","),
    'avg(sold/day)': d3.format(",.2f"),
    'avg(price)': d3.format(",.2f")
  };

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
      cfrp.on("change." + namespace, update);

      update();

      //
      // update display when query changes
      //

      var recursive = false;
      function update() {

        // don't do recursive updates
        if (recursive) { return; }

        // run report and convert to html table format
        var tree = { values : report(cfrp.cur_query, dummy_dim.top(Infinity)) },
            table = tableize(tree, cfrp.cur_query.rows);

        // pivot table proper
        var th = thead.selectAll("th")
          .data(cfrp.cur_query.rows.concat([cfrp.cur_query.agg]));

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
            var idx = cfrp.cur_query.rows.indexOf(d.category);
            cfrp.cur_query.filter[d.category] = d.value;
            if (idx > -1) { cfrp.cur_query.rows.splice(idx, 1); }
            cfrp.refine();
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
          nest = nest.key(function(v) { return fmt(g)(cfrp.defs.dimensions[g](v)); })
                     .sortKeys(d3.ascending);
        });

        // aggregation
        if (query.agg) {
          nest = nest.rollup(function(v) { return fmt(query.agg)(cfrp.defs.aggregates[query.agg](v)); });
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

        if (tree) {
          recurse([], tree, -1);
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

  return chart;
};