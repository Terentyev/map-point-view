/**
 * @file
 * Provide functionality to display point data on map.
 *
 * Example: 
 *    var map;
 *    map = new OpenLayers.Map({...});
 *    ...
 *    new MapPointView(map);
 *
 * That's all.
 */

/**
 * Fully recursive clone of variable x.
 */
function clone(x) {
  if (x == null || typeof(x) != 'object') {
    return x;
  }

  var tmp = x.constructor();
  for (var key in x) {
    tmp[key] = clone(x[key]);
  }

  return tmp;
}

/**
 * Mathematical square.
 */
function sqr(x) {
  return x * x;
}

/**
 * Initialize object MapPointView on map.
 */
var MapPointView = function(map) {
  map.MapPointView = this;
  this.map = map;

  var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
  renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;
 
  // Create and register layer
  this.layer = new OpenLayers.Layer.Vector(
      "MapPointViewLayer",
      {
        styleMap: new OpenLayers.StyleMap({'default':{
            strokeColor: "#00FF00",
            strokeOpacity: 1,
            strokeWidth: 3,
            fillColor: "#FF5500",
            fillOpacity: 0.5,
            pointRadius: 6,
            pointerEvents: "visiblePainted",
            // label with \n linebreaks
            label : "${value}",
            
            fontColor: "black",
            fontSize: "12px",
            fontFamily: "Courier New, monospace",
            fontWeight: "bold",
            labelAlign: "cm",
            labelOutlineColor: "white",
            labelOutlineWidth: 3
        }}),
        renderers: renderer,
        visibility: true
      }
  );
  this.map.addLayers([this.layer]);

  this.data = {data: [], projection: null};

  this.UpdateFeatures();
  this.map.events.register("zoomend", this, function(e) {
      e.object.MapPointView.UpdateFeatures();
  });
};

MapPointView.prototype = {
/**
 * Refresh all features on layer.
 */
UpdateFeatures: function () {
                  // Clusterate data
                  var clustering_data = this.ClusterateFeatures();

                  this.layer.removeAllFeatures();

                  // Add features to layer
                  for (var i in clustering_data) {
                    var data = clustering_data[i];
                    var point = this
                      .CreatePoint(data.x, data.y)
                      .transform(this.data.projection, this.layer.projection);

                    this.layer.addFeatures([
                        this.CreateCircle(point, data.value)
                    ]);
                  }
                },

/**
 * Create point object.
 * It's temporary function TODO: delete this function.
 */
CreatePoint: function (x, y) {
               return new OpenLayers.Geometry.Point(x, y);
             },

/**
 * Create circle object.
 * TODO: replace CreatePoint() on argument of this function.
 */
CreateCircle: function (point, value) {
                var style = {
                  fillColor: '#000',
                  fillOpacity: 0.1,
                  strokeWidth: 0
                };
                return new OpenLayers.Feature.Vector(
                    OpenLayers.Geometry.Polygon.createRegularPolygon(
                      point,
                      // TODO: replace this hard code radius on argument of
                      // function.
                      // This radius should be passed in map units and we should
                      // scale from pixels.
                      10 * this.map.getResolution(),
                      40,
                      0
                    ),
                    {'value': value}
                );
              },

/**
 * Load data as map features.
 * At now data is a object:
 *   {
 *     keys: {
 *     },
 *     headers: [],
 *     data: []
 *   }
 * Where 'keys' is a user selected correlation between in-file columns and
 * program columns.
 * Array 'header' is an array of in-file columns' captions.
 * Array 'data' is an 2D array of massive data.
 * Example of using:
 *   alert( data.data[i][data.keys.x] );
 * It's show to user a 'x'-coordinate in 'i'-row of data.
 */
LoadData: function (data, projection) {
            this.data = {
              data: [],
              'projection': new OpenLayers.Projection(projection)
            };
            for (var i in data.data) {
              this.data.data.push({
                objectid: data.data[i][data.keys.objectid],
                x: data.data[i][data.keys.x],
                y: data.data[i][data.keys.y],
                value: data.data[i][data.keys.value]
              });
            }
            this.UpdateFeatures();
            console.log('Data has been loaded');
          },

/**
 *
 */
ClusterateFeatures: function () {
                      var data = clone(this.data.data);
                      var distances = [];
                      var clusters = [];
                      var max_distance = 20 * this.map.getResolution();

                      // Build distance on level-0 between each point
                      for (var i in data) {
                        distances[i] = [];
                        for (var j in data) {
                          if (1*j <= 1*i) continue;
                          distances[i][j] = Math.sqrt(
                              sqr(data[i].x - data[j].x) +
                              sqr(data[i].y - data[j].y)
                          );
                        }
                        clusters.push([i]);
                      }

                      while (true) {
                        // Find minimum distance
                        var min_distance = null;
                        var remember_i = null;
                        var remember_j = null;
                        for (var i in distances) {
                          for (var j in distances[i]) {
                            if (
                                min_distance === null
                                || min_distance > distances[i][j]
                            ) {
                              min_distance = distances[i][j];
                              remember_i = i;
                              remember_j = j;
                            }
                          }
                        }

                        if (min_distance === null || min_distance > max_distance) {
                          // Stop loop if minimum distance too big
                          break;
                        }

                        // Merge points and clusters
                        var new_cluster = clone(clusters[remember_i]).concat(clusters[remember_j]);
                        var new_x = 0;
                        var new_y = 0;
                        for (var i in new_cluster) {
                          new_x += data[new_cluster[i]].x / new_cluster.length;
                          new_y += data[new_cluster[i]].y / new_cluster.length;
                        }

                        var new_distance_row = [];
                        distances.push(new_distance_row);
                        clusters.push(new_cluster);
                        delete distances[remember_i];
                        delete distances[remember_j];
                        delete clusters[remember_i];
                        delete clusters[remember_j];
                        for (var i in distances) {
                          if (i*1+1 == distances.length) break;
                          delete distances[i][remember_j];
                          delete distances[i][remember_i];

                          // Calculate center of clusters[i].
                          var ix = 0;
                          var iy = 0;
                          for (var j in clusters[i]) {
                            ix += data[clusters[i][j]].x / clusters[i].length;
                            iy += data[clusters[i][j]].y / clusters[i].length;
                          }

                          var new_distance = Math.sqrt(
                              sqr(new_x - ix) +
                              sqr(new_y - iy)
                          );
                          new_distance_row[i] = new_distance;
                        }
                      }

                      data = [];
                      // Build features data by clusters.
                      for (var i in clusters) {
                        var x = 0;
                        var y = 0;
                        var value = 0;
                        for (var j in clusters[i]) {
                          x += this.data.data[clusters[i][j]].x / clusters[i].length;
                          y += this.data.data[clusters[i][j]].y / clusters[i].length;
                          value += 1*this.data.data[clusters[i][j]].value;
                        }
                        data.push({
                            x: x,
                            y: y,
                            'value': value
                        });
                      }

                      return data;
                    }
};
