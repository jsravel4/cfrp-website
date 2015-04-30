/*
* MDAT Calendar component
*
* Copyright (c) 2015 MIT Hyperstudio
* Christopher York, 04/2015
*
*/

mdat.visualization.calendar = function() {

  var cellSize = 8,
      seasons_visible = 8,
      width = 52 * cellSize + 15 + 40,
      height = 8 * seasons_visible * cellSize,
//      height = "100%",// 8 * cellSize * (1794 - 1680),    // TODO.  calculate domain
      uid = 0;

  var cfrp = undefined,
      dispatch = d3.dispatch("preview");

  var day = d3.time.format("%w");
      week = function(d) {
        // TODO.  a cruel hack, but it works...  rework the scale to map
        //        seasons correctly in screen coords, not dates
        if (d3.time.format("%e %b")(d) === " 1 Apr") { return 0; }
        d = d3.time.week.offset(d, -13);
        return d3.time.format("%U")(d);
      },
      format = d3.time.format("%a %e %b %Y"),
      commasFormatter = d3.format(",.0f");

  var aggregates = {
      'count(date)':       mdat.utils.reduceDistinct(function(d) { return d.date; }),
      'sum(receipts)':     mdat.utils.reduceSum(function(d) { return d.price * d.sold; }),
      'avg(receipts/day)': mdat.utils.reduceSum(function(d) { return d.price * d.sold; }),
      'sum(sold)':         mdat.utils.reduceSum(function(d) { return d.sold; }),
      'avg(sold/day)':     mdat.utils.reduceSum(function(d) { return d.sold; })
    };

  function chart(selection) {
    selection.each(function(d, i) {
      var sel_extent = [],
          preview = null;

      var namespace = "calendar_" + uid++;

      checkpoint();

      var date = cfrp.dimension(function(d) { return d.date; }),
          aggregateByDate = date.group(d3.time.day),
          aggregateBySeason = date.group(d3.time.year);

      var all_seasons = d3.range(date.bottom(1)[0].date.getFullYear(),
                                 date.top(1)[0].date.getFullYear());

      var y = d3.scale.ordinal()
          .domain(all_seasons)
          .rangeBands([0, height]);

      var brush = d3.svg.brush()
          .y(y)
          .extent([y(all_seasons[0]), y(all_seasons[seasons_visible])])
          .clamp(true)
          .on("brush", context_brushed);

      var root = d3.select(this)
          .classed("calendar", true);

      var defs = root.append('defs');

      defs.append("clipPath")
          .attr("id", namespace + "_clip")
        .append("rect")
          .attr("width", width)
          .attr("height", height);

      var context = root.append("g")
          .attr("class", "context")
          .attr("transform", "translate(" + (width - 10) + ",0)");

      var c_season = context.selectAll("season")
          .data(all_seasons)
        .enter().append("rect")
          .attr("class", "season_rug")
          .attr("x", 4)
          .attr("y", function(d) { return y(d); })
          .attr("width", cellSize)
          .attr("height", y.rangeBand())
          .attr("fill", "white");

      context.append("g")
          .attr("class", "y brush")
          .call(brush)
        .selectAll("rect")
          .attr("width", cellSize + 8);

      var focus = root.append("g")
          .attr("class", "focus")
          .attr("clip-path", "url(#" + namespace + "_clip)");

      var focusinfo = focus.append("g")
          .attr("class", "info")
          .attr("transform", "translate(0,0)");

      var seasons = focusinfo.selectAll("season")
          .data(all_seasons)
        .enter().append("g")
          .attr("class", "season")
          .attr("transform", function(d,i) { return "translate(15," + (cellSize * 8 * i) + ")"; });

      seasons.append("text")
          .attr("transform", "translate(-12," + cellSize * 3.5 + ")rotate(-270)")
          .style("text-anchor", "middle")
          .text(function(d) {
            var d0 = "" + d,
                d1 = "" + (d+1);
            return d0 + "-" + diff_suffix(d0, d1);
          });

      var rect = seasons.selectAll(".day")
          .data(function(d) { return d3.time.days(new Date(d, 3, 1), new Date(d + 1, 3, 1)); })
        .enter().append("rect")
          .classed("day", true)
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("x", function(d) { return week(d) * cellSize; })
          .attr("y", function(d) { return day(d) * cellSize; })
          .attr("fill", "white");

      rect.on("dblclick.calendar", function(d) {
        if(sel_extent.length > 0) {
          sel_extent = [];
          draw_selected();
          update_filter();
        }
      });

      rect.on("mousedown.calendar", context_brushstart);

      rect.append("title")
          .text(format);

      seasons.selectAll(".month")
          .data(function(d) { return d3.time.months(new Date(d, 3, 1), new Date(d + 1, 3, 1)); })
        .enter().append("path")
          .attr("class", "month")
          .attr("d", monthPath);

      // Initial values for selection & preview
//      sel_extent = [];
      preview = date.bottom(1)[0].date;

      checkpoint("Done creating " + namespace);

      cfrp.on("change." + namespace, mdat.spinner_callback(update, root, "Updated calendar"));
  //      cfrp.on("refine." + namespace, update_state);

      function draw_selected() {
        rect.classed("selected", function(p) {
          switch (sel_extent.length) {
            case 0: return false;
            case 1: return (sel_extent[0] - p === 0);
            case 2: return (sel_extent[0] <= p) && (p <= sel_extent[1]);
          }
        });
      }

      var recursive = false;
      function update_filter() {
        function nudge(d) {
          // TODO.  compensates for crossfilter's filterRange not including the outer bounds... find a better solution
          return [ d3.time.minute.offset(d[0], -1),
                   d3.time.minute.offset(d[1], 1) ];
        }

        switch (sel_extent.length) {
          case 0: date.filterAll();
                  break;
          case 1: date.filterExact(sel_extent[0]);
                  break;
          case 2: date.filterRange(nudge(sel_extent));
                  break;
        }

        recursive = true;
        cfrp.change();
        recursive = false;
      }

      function update() {
        if (recursive) { return; }

        var agg = aggregates[cfrp.preferred_aggregate] || aggregates["sum(receipts)"];

        aggregateByDate.reduce(agg.add, agg.remove, agg.init);
        aggregateBySeason.reduce(agg.add, agg.remove, agg.init);

        var focusData = aggregateByDate.top(Infinity),
            contextData = aggregateBySeason.top(Infinity);

        var receipts_domain = focusData.map(function(d) { return d.value.sum; }).reverse(),
            context_domain = contextData.map(function(d) { return d.value.sum; }).reverse();

        focusData = d3.map(focusData, function(d) { return d.key; });
        contextData = d3.map(contextData, function(d) { return d.key.getFullYear(); });

        // TODO.  calculate quantiles without projecting all values
        var focusColor = d3.scale.quantile()
          .domain(receipts_domain)
          .range(colorbrewer.YlGnBu[9]);

        var contextColor = d3.scale.quantile()
          .domain(context_domain)
          .range(colorbrewer.YlGnBu[9]);

        c_season.attr("fill", function(d) {
          var dsum = contextData.get(d);
          return (dsum && dsum.value.final() > 0) ? contextColor(dsum.value.final()) : "white";
        });

        rect.classed("preview", function(d) {
          return preview && (d.getTime() == preview.getTime());
        });
        rect.attr("fill", function(d) {
          var dsum = focusData.get(d);
          return (dsum && dsum.value.final() > 0) ? focusColor(dsum.value.final()) : "white";
        });
        rect.select("title")
            .text(function(d) {
              var dsum = focusData.get(d);
              return format(d) + (dsum ? ": L. " + commasFormatter(dsum.value.final()) : ""); 
            });

        root.classed("loading", false);
        checkpoint("Done with calendar");
      }

      function monthPath(t0) {
        var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
            d0 = +day(t0), w0 = +week(t0),
            d1 = +day(t1), w1 = +week(t1);
        return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
            + "H" + w0 * cellSize + "V" + 7 * cellSize
            + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
            + "H" + (w1 + 1) * cellSize + "V" + 0
            + "H" + (w0 + 1) * cellSize + "Z";
      }

      function context_brushed() {
        d3.event.sourceEvent.stopPropagation();
        var proportion = brush.extent()[0] / height,
            scrollHeight = cellSize * 8 * all_seasons.length;
        focusinfo.attr("transform", "translate(0,-" + (proportion * scrollHeight) + ")");
      }

      function diff_suffix(s0, s1) {
        var i = 0;
        while (i < s0.length && i < s1.length && s0.charAt(i) === s1.charAt(i)) { i++; }
        return s1.slice(i);
      }

      function context_brushstart() {
        var startRect = d3.select(this),
            startDate = d3.select(d3.event.target).datum();
        d3.event.preventDefault();

        rect.on("mousemove.calendar", context_brushmove).on("mouseup.calendar", context_brushend);

        function context_brushmove() {
          var endDate = d3.select(d3.event.target).datum();
          d3.event.preventDefault();
          if (startDate < endDate) {
            sel_extent = [startDate, endDate];
          } else if (startDate.getTime() !== endDate.getTime()) {
            sel_extent = [endDate, startDate];
          }
          draw_selected();
        }

        function context_brushend() {
          var endDate = d3.select(d3.event.target).datum();
          rect.on("mousemove.calendar", null).on("mouseup.calendar", null);

          // In all cases, set preview to beginning of date range
          rect.classed("preview", false);
          startRect.classed("preview", true);
          preview = startDate;
          dispatch.preview(preview);

          // For the drag gesture, also run the query
          if (startDate.getTime() !== endDate.getTime()) {
            // register the new brush extent and emit events
            update_filter();
          }
        }
      }
    });
  }

  chart.datapoint = function(value) {
    if (!arguments.length) return cfrp;
    cfrp = value;
    return chart;
  };

  chart.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) return height;
    height = value;
    return chart;
  };

  return d3.rebind(chart, dispatch, "on");
};