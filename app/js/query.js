/*
* MDAT Query manipulation component
*
* Copyright (c) 2015 MIT Hyperstudio
* Christopher York, 04/2015
*
*/

mdat.visualization.query = function() {
  
  var dimensions = [],
      aggregates = [];

  var uid = 0,
      cfrp = undefined;

  function chart(selection) {
    selection.each(function(d, i) {
      var namespace = "query_" + uid++;

      var root = d3.select(this)
        .classed("query", true);

      root.append("ul")
        .classed("grouping", true);

      var dimensions_div = root.append("div")
         .attr("class", "dimensions dropdown");

      dimensions_div.append("button")
        .classed("add-grouping", true)
        .on("click", function() {
          dimensions_div.classed("active", function(d, i) {
            return !d3.select(this).classed("active"); 
          });
          aggregates_div.classed("active", false);
        });

      dimensions_div.append("ul")
        .selectAll("li")
         .data(dimensions)
          .enter().append("li")
          .html(function(d) { return d; })
         .on("click", function(d) { 
           var query = cfrp.cur_query();
           dimensions_div.classed("active", false);
           query.rows.push(d);
           cfrp.refine(query);
           console.log("new row: " + JSON.stringify(query));
           cfrp.change();
         });

      var aggregates_div = root.append("div")
         .attr("class", "aggregates dropdown");

      aggregates_div.append("button")
        .classed("aggregate", true)
        .on("click", function() {
          aggregates_div.classed("active", function(d, i) {
            return !d3.select(this).classed("active"); 
          });
          dimensions_div.classed("active", false);
        });

      aggregates_div.append("ul")
         .selectAll("li")
          .data(aggregates)
           .enter().append("li")
           .html(function(d) { return d; })
          .on("click", function(d) {
            var query = cfrp.cur_query();
            aggregates_div.classed("active", false);
            query.agg = d;
            cfrp.refine(query);
            console.log("set agg: " + JSON.stringify(query));
            cfrp.change();
          });

      root.append("ul")
        .classed("filters", true);

      cfrp.on("change." + namespace, mdat.spinner_callback(update, root, "Updated query"));

      function update() {
        // currently grouped categories
        var query = cfrp.cur_query();

        var groupings = root.select(".grouping")
          .selectAll("li")
          .data(query.rows);

        groupings.exit().remove();
        groupings.enter().append("li");

        groupings.html(function(d) { return d; })
          .on("click", function(d) {
            var i = query.rows.indexOf(d);
            if (i > -1) { query.rows.splice(i, 1); }
            cfrp.refine(query);
            console.log("removed a row: " + JSON.stringify(query));
            cfrp.change();
          });

        // current aggregate

        var agg = root.select(".aggregate")
          .html(query.agg);

        // current filters

        var filters = root.select(".filters")
          .selectAll("li")
          .data(d3.entries(query.filter));

        filters.exit().remove();
        var filters_enter = filters.enter().append("li")
          .on("click", function(d) {
            delete query.filter[d.key];
            cfrp.refine(query);
            console.log("deleted a filter: " + JSON.stringify(query));
            cfrp.change();
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
  };

  chart.dimensions = function(keys) {
    if (!arguments.length) return dimensions;
    dimensions = keys;
    return chart;
  };

  chart.aggregates = function(keys) {
    if (!arguments.length) return aggregates;
    aggregates = keys;
    return chart;
  };

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