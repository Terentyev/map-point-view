**Projections**
If need add some new projections, you need create new file in directory
./scripts/proj4js/defs/ with name EPSGxxxx.js, where 'xxxx' is a EPSG number of
projection. See also at [proj4js](http://trac.osgeo.org/proj4js/wiki/UserGuide).

Also you can try to use utility:

    usefull/get_proj4js_definitions xxxx yyyy ./scripts/proj4js/defs

Where this command download projection definitions form EPSGxxxx to EPSGyyyy
and save to directory './scripts/proj4js/defs'.

**OpenLayers**

    ./scripts/OpenLayers/OpenLayers.js
                        /theme/
                        /img/

**Links**

[OpenLayers](http://openlayers.org/)

[Heat map js by Patrik Wied](http://www.patrick-wied.at/static/heatmapjs/)
[Heat map js by Patrik Wied example](http://www.patrick-wied.at/blog/real-time-heatmap-explained)

[Yet another heat map implementation](http://sloweb.org.uk/ollie/heatmap/)

[Mapping service that enables to easily create custom maps](http://www.directionsmag.com/geowebmaps/)
