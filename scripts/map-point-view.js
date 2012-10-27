/**
 * @file
 * Provide functionality to display point data on map.
 *
 * Example: 
 *    var map;
 *    map = new OpenLayers.Map({...});
 *    ...
 *    MapPointView.Init(map);
 *
 * That's all.
 */

var MapPointView = {
/**
 * Initialize object MapPointView on map.
 */
Init: function (map) {
        map.MapPointView = this;
        this.map = map;

        // Create and register layer
        this.layer = new OpenLayers.Layer.Vector(
            "MapPointViewLayer",
            {visibility: true}
        );
        this.map.addLayers([this.layer]);

        this.data = [];

        this.UpdateFeatures();
        this.map.events.register("zoomend", this, function(e) {
            e.object.MapPointView.UpdateFeatures();
        });
      },

/**
 * Refresh all features on layer.
 */
UpdateFeatures: function () {
                  this.layer.removeAllFeatures();
                  // Add features to layer
                  for (var i in this.data) {
                    var data = this.data[i];
                    this.layer.addFeatures([
                        new OpenLayers.Feature.Vector(
                          this.CreatePoint(data.x, data.y),
                          {},
                          {
                            graphicName: 'cross',
                            strokeColor: '#f00',
                            strokeWidth: 2,
                            fillOpacity: 0,
                            pointRadius: 10
                          }
                        ),
                        this.CreateCircle(data.x, data.y)
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
CreateCircle: function (x, y) {
                var style = {
                  fillColor: '#000',
                  fillOpacity: 0.1,
                  strokeWidth: 0
                };
                return new OpenLayers.Feature.Vector(
                    OpenLayers.Geometry.Polygon.createRegularPolygon(
                      this.CreatePoint(x, y),
                      // TODO: replace this hard code radius on argument of
                      // function.
                      // This radius should be passed in map units and we should
                      // scale from pixels.
                      10 * this.map.getResolution(),
                      40,
                      0
                    ),
                    {},
                    style
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
LoadData: function (data) {
            this.data = [];
            for (var i in data.data) {
              this.data.push({
                objectid: data.data[i][data.keys.objectid],
                x: data.data[i][data.keys.x],
                y: data.data[i][data.keys.y],
                value: data.data[i][data.keys.value]
              });
            }
            this.UpdateFeatures();
            console.log('Data has been loaded');
          }
}
