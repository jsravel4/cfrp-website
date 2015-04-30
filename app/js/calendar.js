mdat.visualization.calendar = function() {

  var cellSize = 8,
      seasons_visible = 8,
      width = 52 * cellSize + 15 + 40,
      height = 8 * seasons_visible * cellSize,
//      height = "100%",// 8 * cellSize * (1794 - 1680),    // TODO.  calculate domain
      uid = 0,
      sel_extent = [];

  var cfrp = undefined;

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
      'count(date)':       reduceDistinct(function(d) { return d.date; }),
      'sum(receipts)':     reduceSum(function(d) { return d.price * d.sold; }),
      'avg(receipts/day)': reduceSum(function(d) { return d.price * d.sold; }),
      'sum(sold)':         reduceSum(function(d) { return d.sold; }),
      'avg(sold/day)':     reduceSum(function(d) { return d.sold; })
    };

  function chart(selection) {
    selection.each(function(d, i) {
      var namespace = "calendar_" + uid++;

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
          .on("brush", brushed);

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
          .attr("height", y.rangeBand());

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

      // TODO.  get seasons range from data
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
          .attr("class", "day")
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("x", function(d) { return week(d) * cellSize; })
          .attr("y", function(d) { return day(d) * cellSize; });

      rect.on("click", select);

      rect.append("title")
          .text(format);

      seasons.selectAll(".month")
          .data(function(d) { return d3.time.months(new Date(d, 3, 1), new Date(d + 1, 3, 1)); })
        .enter().append("path")
          .attr("class", "month")
          .attr("d", monthPath);

      // Allow the arrow keys to change the displayed page.
      window.focus();
      d3.select(window).on("keydown", function() {
        switch (d3.event.keyCode) {
          case 37:
          case 38: move(-1); break;
          case 39:
          case 40: move(1); break;
        }
      });

      update();

      cfrp.on("change." + namespace, update);

      function move(i) {
        var old = sel_extent;
        var fn = function(d) { return d3.time.day.offset(d, i); };
        sel_extent = sel_extent.map(fn);

        draw_selected();
        update_filter();
      }

      function select(d) {
        var dist = sel_extent.map(function(p) { return Math.abs(p - d); }),
            ndx = dist.indexOf(d3.min(dist));

        if (dist.some(function(p) { return p === 0.0; })) { sel_extent = []; }
        else if (ndx >= 0 && sel_extent.length > 1)       { sel_extent[ndx] = d; }
        else { sel_extent.push(d); }

        // TODO. don't ask me why sel_extent.sort() doesn't work...
        //       if crossfilter receives a filterRange out of order, it goes crazy (permanently)
        if (sel_extent.length > 1 && sel_extent[0] > sel_extent[1]) { sel_extent = sel_extent.reverse(); }

        draw_selected();
        update_filter();
      }

      function draw_selected() {
        console.log(JSON.stringify(sel_extent));
        rect.classed("selected", function(p) {
          switch (sel_extent.length) {
            case 0: return false;
            case 1: return (sel_extent[0] - p === 0);
            case 2: return (sel_extent[0] <= p) && (p <= sel_extent[1]);
          }
        });
      }

      // TODO... better solution to manage recursive events
      var recursive = false;
      function update_filter() {
        function nudge(d) {
          // TODO.  compensates for crossfilter's filterRange not including the outer bounds... find a better solution
          return [ d3.time.minute.offset(d[0], -1),
                   d3.time.minute.offset(d[1], 1) ];
        }

        switch (sel_extent.length) {
          case 0: date.filterAll(); break;
          case 1: date.filterExact(sel_extent[0]); break;
          case 2: date.filterRange(nudge(sel_extent)); break;
        }
        recursive = true;
        cfrp.refine();
        recursive = false;
      }

      function update() {
        if (recursive) { return; }

        var start = new Date(),
            middle,
            finish;

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

        middle = new Date();
        rect.attr("fill", function(d) {
          var dsum = focusData.get(d);
          return (dsum && dsum.value.final() > 0) ? focusColor(dsum.value.final()) : "white";
        }).select("title")
            .text(function(d) {
              var dsum = focusData.get(d);
              return format(d) + (dsum ? ": L. " + commasFormatter(dsum.value.final()) : ""); });

        finish = new Date();
        console.log("calendar: quantize in " + (middle - start) + "ms, render in " + (finish - middle) + "ms");
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

      function brushed() {
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

    });
  }

  function reduceDistinct(fn) {
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
  }

  function reduceSum(fn) {
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
  }

  chart.datapoint = function(value) {
    if (!arguments.length) return cfrp;
    cfrp = value;
    return chart;
  }

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

  return chart;
};