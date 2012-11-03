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

var DATA_REPRESENT_TYPE_DEFAULT = 'default';
var DATA_REPRESENT_TYPE_CLUSTER = 'cluster';
var DATA_REPRESENT_TYPE_HEAT_MAP = 'heatmap';

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
 
  // Create default and cluster layer
  this.layer = new OpenLayers.Layer.Vector(
      "MapPointViewLayer",
      {
        styleMap: new OpenLayers.StyleMap({'default':{
            strokeColor: "#777777",
            strokeWidth: 1,
            fillColor: "#FF2200",
            fillOpacity: 1,
            pointerEvents: "visiblePainted",
            label : "${value}",
            
            fontColor: "black",
            fontSize: "10px",
            fontFamily: "Courier New, monospace",
            labelAlign: "cm",
            labelOutlineColor: "white",
            labelOutlineWidth: 1
        }}),
        renderers: renderer,
        visibility: true
      }
  );

  // Create heatmap layer
  this.heatmap = new Heatmap.Layer('Heatmap');

  // Register layers
  this.map.addLayers([this.layer, this.heatmap]);

  this.data = {data: [], projection: null};
  this.data_represent_type = DATA_REPRESENT_TYPE_DEFAULT;

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
                  var clustering_data;
                  switch (this.data_represent_type) {
                    case DATA_REPRESENT_TYPE_CLUSTER:
                      clustering_data = this.ClusterateFeatures();
                      this.layer.visible = true;
                      this.heatmap.visible = false;
                      break;
                    case DATA_REPRESENT_TYPE_HEAT_MAP:
                      this.HeatMapCanvas();
                      this.layer.visible = false;
                      this.heatmap.visible = true;
                      return;
                    default:
                      clustering_data = this.DefaultFeatures();
                      this.layer.visible = true;
                      this.heatmap.visible = false;
                      break;
                  }

                  this.layer.removeAllFeatures();

                  // Add features to layer
                  for (var i in clustering_data) {
                    var data = clustering_data[i];
                    var point = this
                      .CreatePoint(data.x, data.y)
                      .transform(this.data.projection, this.layer.projection);

                    this.layer.addFeatures([
                        this.CreateCircle(point, data.r, data.value)
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
CreateCircle: function (point, radius, value) {
                return new OpenLayers.Feature.Vector(
                    OpenLayers.Geometry.Polygon.createRegularPolygon(
                      point,
                      // TODO: replace this hard code radius on argument of
                      // function.
                      // This radius should be passed in map units and we should
                      // scale from pixels.
                      10 * radius * this.map.getResolution(),
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
 * Set data represent type.
 */
SetDataRepresentType: function(dr_type) {
                        this.data_represent_type = dr_type;
                        this.UpdateFeatures();
                      },

/**
 * Default Features.
 */
DefaultFeatures: function () {
                   var data = clone(this.data.data);

                   for (var i in data) {
                     data[i].value = '';
                     data[i].r = 1;
                   }

                   return data;
                 },

/**
 * Calculate clusters.
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
                      var min_value = null;
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
                        if (min_value === null || min_value > value) {
                          min_value = value;
                        }
                      }

                      if (min_value == 0) {
                        min_value = 1;
                      }

                      // Set for each cluster a cluster-radius
                      for (var i in data) {
                        data[i].r = data[i].value / min_value;
                        data[i].value = Math.round(data[i].value * 100) / 100;
                      }

                      return data;
                    },

/**
 *
 */
HeatMapCanvas: function () {
                 while (this.heatmap.points.length) {
                   this.heatmap.removeSource(this.heatmap.points[0]);
                 }


                 for (var i in this.data.data) {
                   var data = this.data.data[i];
                   this.heatmap.addSource(new Heatmap.Source(
                         new OpenLayers.LonLat(data.x, data.y)
                   ));
                 }
               }
};
