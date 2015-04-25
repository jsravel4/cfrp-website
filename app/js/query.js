mdat.visualization.query = function() {
  
  var uid = 0,
      cfrp = undefined;

  function chart(selection) {
    selection.each(function(d, i) {
      var namespace = "query_" + uid++;

      var dimension_names = d3.keys(cfrp.defs.dimensions),
          aggregate_names = d3.keys(cfrp.defs.aggregates);

      var root = d3.select(this)
        .classed("query", true);

      root.append("ul")
        .classed("grouping", true);

      var dimensions = root.append("div")
         .attr("class", "dimensions dropdown");

      dimensions.append("button")
        .classed("add-grouping", true)
        .on("click", function() {
          dimensions.classed("active", function(d, i) {
            return !d3.select(this).classed("active"); 
          });
          aggregates.classed("active", false);
        });

      dimensions.append("ul")
        .selectAll("li")
         .data(dimension_names)
          .enter().append("li")
          .html(function(d) { return d; })
         .on("click", function(d) { 
          dimensions.classed("active", false);
          cfrp.cur_query.rows.push(d);
          cfrp.refine();
         });

      var aggregates = root.append("div")
         .attr("class", "aggregates dropdown");

      aggregates.append("button")
        .classed("aggregate", true)
        .on("click", function() {
          aggregates.classed("active", function(d, i) {
            return !d3.select(this).classed("active"); 
          });
          dimensions.classed("active", false);
        });

      aggregates.append("ul")
         .selectAll("li")
          .data(aggregate_names)
           .enter().append("li")
           .html(function(d) { return d; })
          .on("click", function(d) {
            aggregates.classed("active", false);
            cfrp.cur_query.agg = d;
            cfrp.refine();
          });

      root.append("ul")
        .classed("filters", true);

      cfrp.on("change." + namespace, update);

      update();

      function update() {
        // currently grouped categories

        var groupings = root.select(".grouping")
          .selectAll("li")
          .data(cfrp.cur_query.rows);

        groupings.exit().remove();
        groupings.enter().append("li");

        groupings.html(function(d) { return d; })
          .on("click", function(d) {
            var i = cfrp.cur_query.rows.indexOf(d);
            if (i > -1) { 
              cfrp.cur_query.rows.splice(i, 1);
            }
            cfrp.refine();
          });

        // current aggregate

        var agg = root.select(".aggregate")
          .html(cfrp.cur_query.agg);

        // current filters

        var filters = root.select(".filters")
          .selectAll("li")
          .data(d3.entries(cfrp.cur_query.filter));

        filters.exit().remove();
        var filters_enter = filters.enter().append("li")
          .on("click", function(d) {
            delete cfrp.cur_query.filter[d.key];
            cfrp.refine();
          });
        filters_enter.append("span").html(function(d) { return d.key + "&nbsp;=&nbsp;"; });
        filters_enter.append("span").attr("class", "value").html(function(d) { return d.value; });
      }
    });
  }

  chart.datapoint = function(value) {
    if (!arguments.length) return cfrp;
    cfrp = value;
    return chart;
  }

  return chart;

};

/*

  //
  // table rows rearranged: change query object accordingly
  // 

  function regroup(source, target) {
    console.log("regroup: " + source + " on " + target);
    var i = query.rows.indexOf(source),
        j = query.rows.indexOf(target);
    if (i < j) {
      if (j > -1) { query.rows.splice(j+1, 0, source); }
      if (i > -1) { query.rows.splice(i, 1); }
    } else if (i > j) {
      if (i > -1) { query.rows.splice(i, 1); }
      if (j > -1) { query.rows.splice(j, 0, source); }
    } else if (i == -1) {
      query.rows.push(source);
    } else {
      return;
    }
    record(query);
  }

*/