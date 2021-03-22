GSIBV.Map.ControlLayer.SearchResult = class extends GSIBV.Map.ControlLayer {

  constructor(options) {
    super(options);
    this._type = "";
    this._id = "-gsibv-control-searchresult";
    this._url = "";
    this._layers = [];

  }

  get url() { return this._url; }


  getVisible() {
    var map = this._map.map;
    return (map.getLayoutProperty(this.mapid, "visibility") == "visible");
  }

  setVisible(visible) {
    var map = this._map.map;
    map.setLayoutProperty(this.mapid, "visibility", visible ? "visible" : "none");
  }

  clear() {
    this.setData([]);

  }

  _loadMarkerImage() {
    this._markerImage = MA.DOM.create("img");
    this._markerImage._loading = true;

    MA.DOM.on(this._markerImage, "load", MA.bind(this._onLoadImage, this, this._markerImage));
    MA.DOM.on(this._markerImage, "error", MA.bind(function () {
      this._addSource();
    }, this, this._markerImage));


    this._markerImage.src = "./image/search-result.png";
  }

  _onLoadImage() {
    this._markerImage._loading = false;

    this._markerCanvas = MA.DOM.create("canvas");
    var w = this._markerImage.width;
    var h = this._markerImage.height;
    this._markerCanvas.width = w;
    this._markerCanvas.height = h;

    var ctx = this._markerCanvas.getContext("2d");

    ctx.drawImage(this._markerImage, 0, 0);
    var map = this._map.map;
    var imageManager = map.style.imageManager;
    var image = {
      data: imageManager.atlasImage.clone(),
      pixelRatio: 1,
      sdf: undefined
    };

    var srcImageData = ctx.getImageData(0, 0, w, h);
    var imageData = new Uint8Array(w * h * 4);

    for (var i = 0; i < imageData.length; i++) {
      imageData[i] = srcImageData.data[i];
    }


    image.data.data = imageData;
    image.data.width = w;
    image.data.height = h;

    imageManager.addImage("-gsibv-control-searchresult", image);
    this._addSource();
    this._addActiveSource();
  }

  setActive(feature) {


    this._geojsonActive = {
      "type": "FeatureCollection",
      "features": []
    };
    if (feature) this._geojsonActive.features.push(feature);

    if (!this._markerImage) {
      this._loadMarkerImage();
    }

    if (this._markerImage._loading) return;

    this._addActiveSource();
  }

  _addActiveSource() {
    if (!this._geojsonActive) return;

    var map = this._map.map;
    var source = map.getSource(this.mapid + "-active");


    if (!source) {
      map.addSource(this.mapid + "-active", {
        "type": "geojson",
        "data": this._geojsonActive
      });

      var layer = {
        "id": this.mapid + "-symbol-active",
        "source": this.mapid + "-active",
        "type": "symbol",
        "layout": {
          "icon-image": "-gsibv-control-searchresult",
          "icon-size": 1,
          "symbol-placement": "point",
          "icon-keep-upright": true,
          "icon-allow-overlap": true,
          "symbol-z-order": "source",
          "icon-anchor": "bottom"
        },
        "paint": {
          "icon-opacity": 1
        }
      };
      this._layers.push(layer);
      map.addLayer(layer);
      map.moveLayer(layer.id, this.mapid + "-last");
    } else {
      source.setData(this._geojsonActive);
    }
  }

  setData(data) {
    this._geojson = {
      "type": "FeatureCollection",
      "features": []
    };
    for (var i = 0; i < data.length; i++) {
      data[i].properties["no"] = i + "";
      this._geojson.features.unshift(data[i]);
    }
    if (data.length <= 0) {
      var source = this._map.map.getSource(this.mapid);
      if (source) {
        this._map.map.removeLayer(this.mapid + "-symbol");
        this._map.map.removeSource(this.mapid);

      }
      source = this._map.map.getSource(this.mapid + "-active");

      if (source) {
        this._map.map.removeLayer(this.mapid + "-symbol-active");
        this._map.map.removeSource(this.mapid + "-active");

      }
      this._layers = [];
      return;
    }

    if (!this._markerImage) {
      this._loadMarkerImage();
    }

    if (this._markerImage._loading) return;

    this._addSource();
  }

  _addSource() {
    var map = this._map.map;
    var source = map.getSource(this.mapid);


    if (!source) {
      map.addSource(this.mapid, {
        "type": "geojson",
        "data": this._geojson
      });

      var layer = {
        "id": this.mapid + "-symbol",
        "source": this.mapid,
        "type": "symbol",
        "layout": {
          "icon-image": "-gsibv-control-searchresult",
          "icon-size": 0.5,
          "symbol-placement": "point",
          "icon-keep-upright": true,
          "icon-allow-overlap": true,
          "text-keep-upright": true,
          "text-allow-overlap": true,
          "icon-anchor": "bottom",
          "text-anchor": "bottom",
          /*"text-field" : "{no}",*/
          "text-font": [
            "NotoSansCJKjp-Regular"
          ],
          "text-size": 9,
          "text-offset": [0, -1.71],
          "symbol-z-order": "source"
        },
        "paint": {
          "text-color": "rgba(0,0,0,1)"
        }
      };
      this._layers.push(layer);
      map.addLayer(layer);
      map.moveLayer(layer.id, this.mapid + "-last");
    } else {
      source.setData(this._geojson);
    }

  }

  _add(map) {
    super._add(map);

    map.map.addLayer({
      "id": this.mapid,
      "type": "background",
      "paint": {
        "background-color": "rgba(255,255,255,0)"
      },
      "layout": {
        "visibility": (this._visible ? "visible" : "none")
      }
    });
    map.map.addLayer({
      "id": this.mapid + "-last",
      "type": "background",
      "paint": {
        "background-color": "rgba(255,255,255,0)"
      },
      "layout": {
        "visibility": (this._visible ? "visible" : "none")
      }
    });

    return this;
  }
  _remove(map) {
    if (!map) return;

    this._map.map.style.imageManager.removeImage("-gsibv-control-searchresult");

    this._map.map.removeLayer(this.mapid);
    super._remove(map);
  }


  _moveToFront() {
    var map = this._map.map;
    try {
      map.moveLayer(this.mapid);

      for (var i = 0; i < this._layers.length; i++) {
        map.moveLayer(this._layers[i].id);
      }
      map.moveLayer(this.mapid + "-last");
    } catch (e) { }
  }

}