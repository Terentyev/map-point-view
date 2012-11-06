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

var MAX_CLUSTER_RADIUS = 20;
var MIN_CLUSTER_RADIUS = 10;

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
        visibility: true,
        projection: this.map.layers[0].projection
      }
  );

  // Create heatmap layer
  this.heatmap = new OpenLayers.Layer.Heatmap(
      'Heatmap',
      this.map,
      this.layer,
      {
        visible: true,
        radius: MIN_CLUSTER_RADIUS,
        // Opacity is 1..100
        opacity: 100,
        gradient: {
/**
 * I can't select best version and leave both here.
 */
/*
          0.65: "rgb(0,0,255)",
          0.70: "rgb(0,255,255)",
          0.75: "rgb(0,255,0)",
          0.90: "yellow",
          0.95: "rgb(255,0,0)"
//*/
/**/
          0.70: "rgb(0,0,255)",
          0.75: "rgb(0,255,255)",
          0.80: "rgb(0,255,0)",
          0.90: "yellow",
          0.95: "rgb(255,0,0)"
//*/
        }
      },
      {isBaseLayer: false, opacity: 0.3, projection: this.layer.projection}
  );

  // Register layers
  this.map.addLayers([this.layer, this.heatmap]);

  this.data = {data: [], projection: null};
  this.data_represent_type = DATA_REPRESENT_TYPE_DEFAULT;

  this.map.events.register("zoomend", this, function(e) {
      e.object.MapPointView.Update();
  });
};

MapPointView.prototype = {
/**
 * Refresh all features on layer.
 */
Update: function () {
                  switch (this.data_represent_type) {
                    case DATA_REPRESENT_TYPE_CLUSTER:
                      this.SetFeaturesOnLayer(
                          this.CreateTransformedFeatures(
                            this.ClusterateFeatures()
                          )
                      );
                      break;
                    case DATA_REPRESENT_TYPE_HEAT_MAP:
                      this.HeatMapCanvas(
                          this.CreateTransformedFeatures(
                            this.data.data
                          )
                      );
                      break;
                    default:
                      this.SetFeaturesOnLayer(
                          this.CreateTransformedFeatures(
                            this.DefaultFeatures()
                          )
                      );
                      break;
                  }
                },

/**
 * Create transformed features for layer.
 */
CreateTransformedFeatures: function (data) {
                             var features = [];

                             for (var i in data) {
                               var point = this.CreatePoint(
                                   data[i].x,
                                   data[i].y,
                                   this.data.projection
                               );

                               features.push({
                                   point: point,
                                   r: data[i].r,
                                   value: data[i].value
                               });
                             }

                             return features;
                           },
/**
 * Cleare layer and add features to layer.
 */
SetFeaturesOnLayer: function (features_info) {
                      this.ClearLayer();
                      this.ClearHeatmap();

                      // Add features to layer
                      for (var i in features_info) {
                        var feature_info = features_info[i];

                        this.layer.addFeatures([
                            this.CreateCircle(
                              feature_info.point,
                              feature_info.r,
                              feature_info.value
                            )
                        ]);
                      }
                    },

/**
 * Update heat-map canvas.
 */
HeatMapCanvas: function (features_info) {
                 var heatmap_data_set = {max: null, data: []};

                 this.ClearLayer();

                 for (var i in features_info) {
                   var feature_info = features_info[i];
                   var p = feature_info.point;

                   if (heatmap_data_set.max === null
                       || heatmap_data_set.max < feature_info.value
                      ) {
                     heatmap_data_set.max = feature_info.value;
                   }

                   heatmap_data_set.data.push({
                       lonlat: new OpenLayers.LonLat(p.x, p.y),
                       count: feature_info.value
                   });
                 }

                 this.heatmap.setDataSet(heatmap_data_set);
                 this.heatmap.updateLayer();
               },

/**
 * Clear this.layer.
 */
ClearLayer: function() {
              this.layer.removeAllFeatures();
            },

/**
 * Clear this.heatmap.
 */
ClearHeatmap: function() {
              this.heatmap.setDataSet({max: 0, data: []});
            },

/**
 * Create point object.
 */
CreatePoint: function (x, y, projection) {
               return new OpenLayers.Geometry.Point(x, y)
                 .transform(projection, this.layer.projection);
             },

/**
 * Create circle object.
 */
CreateCircle: function (point, radius, value) {
                return new OpenLayers.Feature.Vector(
                    OpenLayers.Geometry.Polygon.createRegularPolygon(
                      point,
                      // This radius should be passed in map units and we should
                      // scale from pixels.
                      radius * this.map.getResolution(),
                      40,
                      0
                    ),
                    {value: value}
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
            this.Update();
            console.log('Data has been loaded');
          },

/**
 * Set data represent type.
 */
SetDataRepresentType: function(dr_type) {
                        this.data_represent_type = dr_type;
                        this.Update();
                      },

/**
 * Default Features.
 */
DefaultFeatures: function () {
                   var data = clone(this.data.data);

                   for (var i in data) {
                     data[i].value = '';
                     data[i].r = MIN_CLUSTER_RADIUS;
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
                        this.MergeClusters(
                            clusters,
                            distances,
                            remember_i,
                            remember_j
                        );
                      }

                      return this.ConvertClustersToFeaturesInfo(clusters);
                    },

/**
 * Merge clusters.
 */
MergeClusters: function (clusters, distances, remember_i, remember_j) {
                 var data = this.data.data;
                 var new_cluster = clone(clusters[remember_i]).concat(clusters[remember_j]);
                 var new_distance_row = [];
                 var new_distance;
                 var new_x = 0;
                 var new_y = 0;

                 for (var i in new_cluster) {
                   new_x += data[new_cluster[i]].x / new_cluster.length;
                   new_y += data[new_cluster[i]].y / new_cluster.length;
                 }

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

                   new_distance = Math.sqrt(
                       sqr(new_x - ix) +
                       sqr(new_y - iy)
                   );
                   new_distance_row[i] = new_distance;
                 }
               },

/**
 * Convert clusters to features_info structure.
 * Return array of structures:
 *   {
 *     point: <OpenLayers.Geomentry.Point>,
 *     r: <circle radius>,
 *     value: <value in this point>
 *   }
 */
ConvertClustersToFeaturesInfo: function(clusters) {
                                 var data = [];
                                 var min_value = null;
                                 var max_value = null;

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
                                       value: value
                                   });
                                   if (min_value === null || min_value > value) {
                                     min_value = value;
                                   }
                                   if (max_value === null || max_value < value) {
                                     max_value = value;
                                   }
                                 }

                                 if (max_value == min_value) {
                                   max_value += 1;
                                 }

                                 var rad_koef =
                                   (MAX_CLUSTER_RADIUS - MIN_CLUSTER_RADIUS)
                                   / (max_value - min_value);

                                 // Set for each cluster a cluster-radius
                                 for (var i in data) {
                                   data[i].r =
                                     rad_koef * (data[i].value - min_value)
                                     + MIN_CLUSTER_RADIUS;
                                   data[i].value = Math.round(data[i].value * 100) / 100;
                                 }

                                 return data;
                               }
};
