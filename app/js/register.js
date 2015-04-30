/*
* MDAT Register image component
*
* Copyright (c) 2015 MIT Hyperstudio
* Christopher York, 04/2015
*
*/

mdat.visualization.register = function() {

  // N.B. source images are 1655 × 2255

  var width = 375,
      height = 512,
      loupeRadius = width * 0.475,
      loupeMagnification = 1.6,
      uid = 0;

  var cfrp = undefined,
      preview = format.parse('1680-04-30'),
      dispatch = d3.dispatch("update");

  function image_url(image_file) {
    var re = /M119_02_R(\d+)_(\d+)([rv])?.jpg/;
    if (image_file) {
      /* TODO. not clear when URLs have extra one (e.g. M1119_02...) */
      image_file = image_file.replace(re, "http://hyperstudio.mit.edu/cfrp/flip_books/R$1/M119_02_R$1/M119_02_R$1_$2.jpg");
    }
    return image_file;
  }

  function chart(selection) {
    selection.each(function(d, i) {
      var namespace = "register_" + uid++;

      var root = d3.select(this)
            .classed("register", true);

      var loupeClip = root.append('defs').append("clipPath")
          .attr("id", namespace + "_clip")
        .append("circle")
          .attr("r", loupeRadius);

      var page = root.append("g")
         .classed("page", true);

      // TODO.  SVG <image> 'onload' events seem quite unreliable, so for now we use the low-tech approach:
      //        render a loading icon which SVG's painter model then covers up with the image

      var image = page.append("image")
          .attr("class", "main")
          .attr("width", width)
          .attr("height", height)
          .on("mousemove", loupeMove);

      var loupe = page.append("g")
          .attr("clip-path", "url(#" + namespace + "_clip)")
       .append("image")
          .attr("class", "loupe")
          .attr("width", width * loupeMagnification)
          .attr("height", height * loupeMagnification)
       .on("mouseout", function() { console.log("loupe exiting"); d3.select(this).classed("active", false); })
       .on("mousemove", loupeMove);

      dispatch.on("update." + namespace, update);

      function update() {
        page.selectAll("image")
          .attr("xlink:href", function() {
            var pb = cfrp.playbill_idx[preview];
            if (pb) {
              return image_url(pb[0].image_file);
            }
          });
      }

      function loupeMove() {
        var pos = d3.mouse(image[0][0]),
            loupePos = [ pos[0] * (1 - loupeMagnification), pos[1] * (1 - loupeMagnification) ];
        loupeClip.attr("cx", pos[0])
                 .attr("cy", pos[1]);
        page.select(".loupe")
                 .classed("active", true)
                 .attr("transform", "translate(" + loupePos.join(',') + ")");
      }
    });
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

  chart.preview = function(value) {
    if (!arguments.length) return preview;
    preview = value;
    dispatch.update();
    return chart;
  }

  return chart;
 };