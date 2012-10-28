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
                  this.layer.removeAllFeatures();
                  // Add features to layer
                  for (var i in this.data.data) {
                    var data = this.data.data[i];
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
          }
};
