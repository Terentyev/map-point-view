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
                  this.layer.addFeatures([
                      new OpenLayers.Feature.Vector(
                        this.CreatePoint(),
                        {},
                        {
                          graphicName: 'cross',
                          strokeColor: '#f00',
                          strokeWidth: 2,
                          fillOpacity: 0,
                          pointRadius: 10
                        }
                      ),
                      this.CreateCircle()
                  ]);
                },

/**
 * Create point object.
 * It's temporary function TODO: delete this function.
 */
CreatePoint: function () {
               var point = new OpenLayers.Geometry.Point(
                   14685693.354415141,
                   5331885.705134858
               );
               return point;
             },

/**
 * Create circle object.
 * TODO: replace CreatePoint() on argument of this function.
 */
CreateCircle: function () {
                var style = {
                  fillColor: '#000',
                  fillOpacity: 0.1,
                  strokeWidth: 0
                };
                var circle = new OpenLayers.Feature.Vector(
                    OpenLayers.Geometry.Polygon.createRegularPolygon(
                      this.CreatePoint(),
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

                return circle;
              }
}
