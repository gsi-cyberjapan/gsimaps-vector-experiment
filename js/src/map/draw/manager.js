GSIBV.Map.Draw.Manager = class extends MA.Class.Base {

  constructor(map) {
    super();
    this._map = map;
    this._layerList = new GSIBV.Map.Draw.Manager.LayerList(map);
    this._list = new GSIBV.Map.Draw.UserDrawList(this._layerList);

    this._userDrawingItem = new GSIBV.Map.Draw.UserDrawList.Item( this._map, 
      "作図中情報", 
      new GSIBV.Map.Draw.FeatureCollection() ) ;
    this._userDrawingItem.hidden = true;
    this._userDrawingItem.layer.order = 2; // 一番上に 大きいほど上に表示
    this._layerList.add( this._userDrawingItem.layer );
    

    this._userDrawItem = new GSIBV.Map.Draw.UserDrawList.Item( this._map, 
      "新規作図情報", 
      new GSIBV.Map.Draw.FeatureCollection() ) ;
    this._userDrawItem.layer.order = 1; // 上から二番目に 大きいほど上に表示
    this._userDrawItem.isUserDraw = true;

    this._list.add( this._userDrawItem );

    this._list.on("change", MA.bind( this._onListChange, this ));
    this._userDrawItem.on( "editstart", MA.bind(this._onDrawItemEditStart, this ));
    this._list.on( "editstart", MA.bind(this._onDrawItemEditStart, this ));

    this._list.on("requesteditfeature", MA.bind( this._onRequestEditFeature, this ));
    this._list.on("requestremovefeature", MA.bind( this._onRequestRemoveFeature, this ));
    this._styleId = 1;
  }

  get map() { return this._map; }
  get userDrawItem() { return this._userDrawItem; }
  get userDrawFileList() { return this._list; }
  get layerList() { return this._layerList; }
  get drawer() { return this._drawer; }
  get drawing() {
    return (this._drawer || this._list.editing ? true : false);
  }
  get geoJSON() {
    var json = {
      "type": "FeatureCollection",
      "features": []
    };

    for( var i=0; i< this._list.length; i++ ) {
      var features = this._list.get(i).featureCollection.toGeoJSON(true);
      for( var j=0; j<features.length; j++ ) {
        json.features.push( features[j]);
      }
    }
    return ( json.features.length > 0 ? json : undefined);
  }

  get geoJSONForSaveState(){
    var json = this.geoJSON;
    if(json && Array.isArray(json.features)){
      json.features = json.features.filter(feature=>{
        if(!feature.properties) return false;
        return feature.properties.notSave == undefined || !feature.properties.notSave;
      })
    }
    return ( json && json.features && json.features.length > 0 ? json : undefined);
  }

  _onListChange() {
    this.fire("listchange");
  }

  _onDrawItemEditStart(evt) {
    this.stopDraw();

    var item = evt.params.item;
    if ( this._userDrawItem != item ) {
      this._userDrawItem.editing = false;
    }

    for( var i=0; i< this._list.length; i++ ) {
      if ( this._list.get(i) != item ) {
        this._list.get(i).editing = false;
      }
    }
  }

  _onFileDrop(evt) {
    var fList = evt.params.data ? evt.params.data.list: evt.params.list;
    var fKey = evt.params.key ? evt.params.key : "";
    this._loadFiles( fList, fKey );
    
  }

  // Tiff解析後表示
  _getEPSG(txt){
    /*
      "IMAGINE GeoTIFF Support
      Copyright 1991 - 2006 by Leica Geosystems Geospatial Imaging, LLC. All Rights Reserved
      @(#)$RCSfile: egtf.c $ IMAGINE 9.1 $Revision: 22.0 $ $Date: 2006/05/24 17:16:00 EST $
      Unable to match Ellipsoid (Datum) to a GeographicTypeGeoKey value
      Ellipsoid = GRS 1980
      Datum = JGD2000"
    */
    var result = 4326;
    var m = txt.match(/Datum[\s]*=[\s]*(.+)/i);
    if (m) {
      switch (m[1]) {
        case "JGD2000":
          result = 2451;
          break;
        case "GRS 1980":
          result = 4019;
          break;
      }
    }
    return result;
  }

  _parseTiff(data){
    var tiffInfo = {};

    var parser = GeoTIFF.parse(data);
    var image = parser.getImage();
    var geoKeys = image.getGeoKeys();
    var meta = image.getFileDirectory();
    var lng = meta.ModelTiepoint[3];
    var lat = meta.ModelTiepoint[4];
    var lngScale = meta.ModelPixelScale[0];
    var latScale = meta.ModelPixelScale[1];
    var imgW = meta.ImageWidth;
    var imgH = meta.ImageLength;

    var epsg = geoKeys.ProjectedCSTypeGeoKey || geoKeys.GeographicTypeGeoKey;
    if (epsg == 32767) {
      epsg = this._getEPSG(geoKeys.GeogCitationGeoKey);
    }

    var lat2 = lat - (latScale * imgH);
    var lng2 = lng + (lngScale * imgW);
    if (epsg != 4326) {
      var to = new Proj4js.Proj('EPSG:4326');
      var from = new Proj4js.Proj('EPSG:' + epsg);
      var formPoint = new Proj4js.Point(lng, lat);
      var toPoint = Proj4js.transform(from, to, formPoint);

      lat = toPoint.y;
      lng = toPoint.x;

      formPoint = new Proj4js.Point(lng2, lat2);
      toPoint = Proj4js.transform(from, to, formPoint);

      lat2 = toPoint.y;
      lng2 = toPoint.x;
    }

    tiffInfo._bounds = [[lng, lat], [lng2, lat], [lng2, lat2], [lng, lat2]];
    tiffInfo._width = image.getWidth();
    tiffInfo._height = image.getHeight();
    return tiffInfo;
  }

  _loadCsvInfos(){
    if(this._runningCsvDlg) this._runningCsvDlg.hide();

    if(this._loadCsvHandler) {
      this.off("start", this._loadCsvHandler);
      this._loadCsvHandler = null;
    }
    this._loadCsvHandler = MA.bind(this._doLoadCSVInfos, this);
    this.on("start", this._loadCsvHandler);
    this.fire("start");
  }
  
  _doLoadCSVInfos(e) {
    if(this._csvList.length <= 0) {
      return;
    }

    try{
      var csv = this._csvList.shift();
      var csvDlg = new GSIBV.UI.Dialog.CSVLoadDialog(csv.fileName, {});
      
      var _csvLoadFinishHandler = MA.bind(this._finishLoadCsvInfo, this);
      csvDlg.on("finish", _csvLoadFinishHandler);
      csvDlg.on("close", MA.bind(function(){
        csvDlg.off("finish", _csvLoadFinishHandler);
        this._csvList = [];
      }, this));
      
      csvDlg.show(csv.data);

      this._runningCsvDlg = csvDlg;
    } catch(e) {
      console.log("load csv failed, error: " + e);
    }
  }

  _loadNextCsv(){
    this._doLoadCSVInfos();
  }

  _csvPopupContent(properties){
    var html = $("<div>").addClass("popup");
    var skipKeys = ["r", "g", "b"];

    var popupWidth = null;
    var elements = "";
    for (const [key, value] of Object.entries(properties)) {
      if(key == "name") elements += "<h2>" + value + "</h2>";
      else if(key == "description") {
        popupWidth = value.length / 2;
        elements += "<p>" + value + "</p>";
      }
      else if(skipKeys.indexOf(key.toLowerCase()) == -1) {
        elements += "<p>" + key + " " + value + "</p>"
      }
    }

    html.html(elements);
    if(popupWidth) html.css({"width": ""+popupWidth+"em"});
    return html.get(0).outerHTML;
  }

  _finishLoadCsvInfo(e){
    var params = e.params;

    var iconFeatures = [];
    if(params && Array.isArray(params.iconInfoList)) {
      params.iconInfoList.forEach((iconInfo)=>{
        iconFeatures.push({
          geometry: {
            type: GSIBV.Map.Draw.Marker.Type,
            coordinates: iconInfo.bound
          },
          properties: {
            _markerType: "Icon",
            _iconUrl: iconInfo.iconUrl,
            _iconSize: iconInfo.iconSize,
            _popupContent: this._csvPopupContent(iconInfo.properties),
            _properties: iconInfo.properties
          }
        });
      })
    }

    if(iconFeatures.length > 0) {
      var featureCollection = null;
      try {
        featureCollection = GSIBV.Map.Draw.FeatureCollection.generate ({
          type: "FeatureCollection",
          features: iconFeatures
        });

        var bounds = featureCollection.bounds;
        if(bounds){
          var lnglatBounds = new mapboxgl.LngLatBounds(
            new mapboxgl.LngLat(bounds.northWest.lng, bounds.northWest.lat),
            new mapboxgl.LngLat(bounds.southEast.lng, bounds.southEast.lat)
          );
          var size = MA.getScreenSize();
    
          var maxZoom = 11;
          if ( this._map.map.getZoom() >= 11 ) maxZoom = this._map.map.getZoom();
          
          this._map.map.fitBounds(lnglatBounds,{
            speed: 2,
            curve: 1.5,
            maxZoom: maxZoom,
            padding:size.width > 300 && size.height > 300 ? 100 : 0});
        }
      } catch( ex) {console.log( ex);}
  
      var list = [];
      if (featureCollection )  {
        list.push(new GSIBV.Map.Draw.UserDrawList.Item( this._map, params.fileName || "unknown", featureCollection));
      }
      this._list.add(list);
    }

    this._loadNextCsv();
  }

  _loadFiles(fileList, fKey) {
    var list = [];
    var totalBounds = null;
    this._csvList = [];

    for( var i=0; i<fileList.length; i++ ) {
      var dropFile = fileList[i];
      var ext = dropFile.fileName.split('.').pop();
      var json = null;

      if(ext==="geojson") {
        // GeoJSON読み込んでみる
        var arr = Encoding.convert(new Uint8Array(dropFile.reader.result), "UNICODE", "AUTO");
        if ( arr[0] == 65279 ) arr.splice(0,1);
        json = JSON.parse(Encoding.codeToString(arr));
      } else if(ext==="kml") {
        // KML読み込んでみる
        var text = dropFile.reader.result;
        var data = null;
        try {
          if (window.ActiveXObject) {
            data = new ActiveXObject("Microsoft.XMLDOM");
            data.async = false;
            data.loadXML($.trim(text));
          }
          else if (window.DOMParser) {
            data = new DOMParser().parseFromString(
              $.trim(text),
              "application/xml"
            );
          }
          json = toGeoJSON.kml(data);

        }
        catch (e) {
          console.log(e);
          data = null;
        }
      } else if(ext==="tif" || ext==="tiff") {
        // geotiff読み込んでみる
        var data = dropFile.reader.result;
        var url =  dropFile.fileName;
        var bounds = null;

        try{
          var tiffInfo = this._parseTiff(data);
          var imageManager = GSIBV.Map.ImageManager.instance;
          imageManager.initLocalTiff(url);
          imageManager.loadLocalTiff(url, data);
          bounds = tiffInfo._bounds;
        } catch {
        }
        
        do{
          if(!(MA.isArray(bounds) && bounds.length > 1)) break;

          json = {
            type: "FeatureCollection",
            features: [
              {
                geometry: {
                  type: GSIBV.Map.Draw.Marker.Type,
                  coordinates: bounds
                },
                properties: {
                  _markerType: "Image",
                  _width: tiffInfo._width,
                  _height: tiffInfo._height,
                  _imageUrl: url,
                  notSave: true
                }
              }
            ]
          }
        } while(0);
      } else if(ext==="jpg" || ext==="jpeg") {
        // jpeg読み込んでみる
        var imageManager = GSIBV.Map.ImageManager.instance;
        var jsonInfo = imageManager.loadLocalJPEGImage(dropFile.reader.result, dropFile.fileName, dropFile.file);
        
        do{
          if(!jsonInfo || !jsonInfo.lng || !jsonInfo.lat) break;

          var bounds = [jsonInfo.lng, jsonInfo.lat];
          json = {
            type: "FeatureCollection",
            features: [
              {
                geometry: {
                  type: GSIBV.Map.Draw.Marker.Type,
                  coordinates: bounds
                },
                properties: {
                  _markerType: "Icon",
                  _iconUrl: jsonInfo.options.iconUrl,
                  _iconSize: jsonInfo.options.iconSize,
                  _iconOffset: jsonInfo.options.iconOffset,
                  _loadType: "Local",
                  notSave: true
                }
              }
            ]
          }
        } while(0);
      } else if(ext==="csv"){
        var arr = Encoding.convert(new Uint8Array(dropFile.reader.result), "UNICODE", "AUTO");
        if (arr[0] == 65279) arr.splice(0, 1);
        this._csvList.push({
          "data": Encoding.codeToString(arr),
          "fileName": dropFile.fileName
        });
      }

      if(json){
        var featureCollection = null;
        try {
          featureCollection = GSIBV.Map.Draw.FeatureCollection.generate (json);
          
          var bounds = featureCollection.bounds;
          if ( !totalBounds) totalBounds =bounds;
          else totalBounds.add(bounds);
          
        } catch( ex) {console.log( ex);}

        if (featureCollection )  {
          list.push( 
            new GSIBV.Map.Draw.UserDrawList.Item( this._map, dropFile.fileName, featureCollection, false, fKey) );
        }
      }
    }

    if ( totalBounds ) {
      var lnglatBounds = new mapboxgl.LngLatBounds(
        new mapboxgl.LngLat(totalBounds.northWest.lng, totalBounds.northWest.lat),
        new mapboxgl.LngLat(totalBounds.southEast.lng, totalBounds.southEast.lat)
      );
      var size = MA.getScreenSize();

      var maxZoom = 11;
      if ( this._map.map.getZoom() >= 11 ) maxZoom = this._map.map.getZoom();
      
      this._map.map.fitBounds(lnglatBounds,{
        speed: 2,
        curve: 1.5,
        maxZoom: maxZoom,
        padding:size.width > 300 && size.height > 300 ? 100 : 0});
    }

    this._list.add(list);

    if(this._csvList.length > 0) this._loadCsvInfos();
  }

  load(list) {
    this._loadFiles( list );
  }

  enable() {
    if ( !this._fileDropHandler ) {
      this._fileDropHandler = MA.bind( this._onFileDrop, this );
      GSIBV.application.on("filedrop",this._fileDropHandler);
    }
  }

  disable() {

    if ( this._fileDropHandler ) {
      GSIBV.application.off("filedrop",this._fileDropHandler);
      this._fileDropHandler = undefined;
    }
  }

  // 新規作図開始
  draw( type) {
    if ( this._drawer ) this.cancelDraw();
    this.stopEdit();

    var drawer = null;
    switch(type) {
      case GSIBV.Map.Draw.Marker.MarkerType:
        drawer = new GSIBV.Map.Draw.MarkerDrawer(this._map,this._userDrawingItem.layer);
        break;
      case GSIBV.Map.Draw.DivMarker.MarkerType:
        drawer = new GSIBV.Map.Draw.DivMarkerDrawer(this._map,this._userDrawingItem.layer);
        break;
      case GSIBV.Map.Draw.Line.Type:
        drawer = new GSIBV.Map.Draw.LineDrawer(this._map,this._userDrawingItem.layer);
        break;
      case GSIBV.Map.Draw.MeasureLine.Type:
        drawer = new GSIBV.Map.Draw.MeasureLineDrawer(this._map,this._userDrawingItem.layer);
        break;
      case GSIBV.Map.Draw.DanmenLine.Type:
        drawer = new GSIBV.Map.Draw.DanmenLineDrawer(this._map,this._userDrawingItem.layer, true);
        break;
      case GSIBV.Map.Draw.Polygon.Type:
        drawer = new GSIBV.Map.Draw.PolygonDrawer(this._map,this._userDrawingItem.layer);
        break;
      case GSIBV.Map.Draw.MeasurePolygon.Type:
        drawer = new GSIBV.Map.Draw.MeasurePolygonDrawer(this._map,this._userDrawingItem.layer);
        break;
      case GSIBV.Map.Draw.PolygonInnerDrawer.Type:
        drawer = new GSIBV.Map.Draw.PolygonInnerDrawer(this._map,this._userDrawingItem.layer);
        break;
      case GSIBV.Map.Draw.Circle.MarkerType:
        drawer = new GSIBV.Map.Draw.CircleDrawer(this._map,this._userDrawingItem.layer);
        break;
      case GSIBV.Map.Draw.FreehandPolyline.Type:
        drawer = new GSIBV.Map.Draw.FreehandPolylineDrawer(this._map,this._userDrawingItem.layer);
        break;
      case GSIBV.Map.Draw.CircleMarker.MarkerType:
        drawer = new GSIBV.Map.Draw.CircleMarkerDrawer(this._map,this._userDrawingItem.layer);
        break;
    }

    if ( drawer ) {
      drawer.start();
      drawer.on("create", MA.bind(this._onDrawerCreate, this ) );
    }
    this._drawer = drawer;
    
    if ( this._drawer)
      this.fire("drawstart");
  }

  //
  cancelDraw() {
    if ( this._drawer) {
      this._userDrawingItem.featureCollection.remove(this._drawer.feature);
      this._drawer.destroy();
    }
  }

  
  //
  stopDraw() {
    this._userDrawingItem.featureCollection.clear();

    if ( this._drawer ) {
      this._drawer.destroy();
      this._drawer = undefined;
      this.fire("drawfinish");
    }
  }

  stopEdit() {
    for( var i=0; i<this._list.length; i++ ) {
      this._list.get(i).editing = false;
    }
  }
  
  // 新規作図完了後情報編集画面
  _onDrawerCreate(evt) {
    this.fire("drawready", {
      item : this._userDrawItem,
      feature : evt.params.feature,
      layer : evt.params.layer
    });
    /*
    this._userDrawItem.addFeature( feature );
    if ( this._userDrawItem.featureCollection.length == 1 )
      this._layerList.add( this._userDrawItem.layer );
    */
  }

  nextDraw(cancel) {
    var feature = this._drawer.feature;
    this.cancelDraw();

    if ( !cancel ) {
      feature.clearEvents();
      this._userDrawItem.addFeature( feature);
      this.fire("change");
    }
    this._drawer.start();

  }


  _onRequestEditFeature(evt) {
    this.fire("requesteditfeature");
  }
  
  _onRequestRemoveFeature(evt) {
    this.fire("requestremovefeature");
  }
  get geoJSONText() {
    var json = {
      "type": "FeatureCollection",
      "features": []
    };

    for( var i=0; i< this._list.length; i++ ) {
      var item = this._list.get(i);
      if(!item.visible) continue;

      var features = item.featureCollection.toGeoJSON(true);
      features = features.filter(feature=>{
        if(!feature.properties) return false;
        return feature.properties.notSave == undefined || !feature.properties.notSave;
      })
      for( var j=0; j<features.length; j++ ) {
        var feature = features[j];
        if(JSON.stringify(feature.properties._iconOffset) == JSON.stringify([0, 0])) {
          delete feature.properties._iconOffset;
        }
        if(feature.properties._popupContent == "" || feature.properties._popupContent == undefined) {
          delete feature.properties._popupContent;
        }
        json.features.push( feature);
      }
    }
    return ( json.features.length > 0 ? json : undefined);
  }
  get kml() {
    var kml = "";
    var data = "";
    var styleList = {};

    for( var i=0; i< this._list.length; i++ ) {
      var item = this._list.get(i);
      if(!item.visible) continue;

      var features = item.featureCollection;
      for( var j=0; j<features.length; j++ ) {
        var feature = features.get(j);
        if (feature.notSave) continue;
        var layerData = "";
        if(feature.geometryType === GSIBV.Map.Draw.Marker.Type) {
          if(feature.markerType === GSIBV.Map.Draw.Marker.MarkerType) {
            // Marker
            layerData = this._makeKMLPoint(feature, styleList, GSIBV.Map.Draw.Marker.MarkerType);
          }
          if(feature.markerType === GSIBV.Map.Draw.CircleMarker.MarkerType) {
            // CircleMarker Skip
            continue;
          }
          if(feature.markerType === GSIBV.Map.Draw.Circle.MarkerType) {
            // Circle
            layerData = this._makeKMLPolygon(feature, styleList, GSIBV.Map.Draw.Circle.MarkerType);
          }
          if(feature.markerType === GSIBV.Map.Draw.DivMarker.MarkerType) {
            // Text Skip
            continue;
          }
        } else if(feature.geometryType === GSIBV.Map.Draw.Polygon.Type) {
          // Polygon
          layerData = this._makeKMLPolygon(feature, styleList, GSIBV.Map.Draw.Polygon.Type);
        } else if(feature.geometryType === GSIBV.Map.Draw.Line.Type) {
          // Line
          layerData = this._makeKMLLine(feature, styleList, GSIBV.Map.Draw.Line.Type);
        } else {
          continue;
        }
        
        if (layerData) {
          data += layerData.data;
        }
      }
    }
    
    var styles = '';

    if (data != '') {
      for (var styleId in styleList) {
        styles += styleList[styleId].text;
      }
      
      kml =
        '<?xml version="1.0" encoding="UTF-8"?>' + "\n" +
        '<kml xmlns="http://www.opengis.net/kml/2.2">' + "\n" +
        '<Document>\n' +
        styles + data +
        '</Document>\n' +
        '</kml>';
    }
    
    return ( kml.length > 0 ? kml : undefined);
  }
  _encodeHTML(src){
    src = src.replace(/&/g, '&amp;');
    src = src.replace(/</g, '&lt;');
    src = src.replace(/>/g, '&gt;');
    return src;
  }
  _tableItem2Description(properties) {
    var trHtml = '';
    var keys = Object.keys(properties);
    for(var i=0;i<keys.length;i++) {
      var key = keys[i];
      if(key==="name") {
        continue;
      }
      var value = properties[key];
      if (!value || value == '') {
        value = '';
      }

      value = value.replace(/\n/g, "<br>");
      trHtml += '<tr><td>' + this._encodeHTML(key).replace(/\n/g, "<br>") + '</td><td>' + value + '</td></tr>' + '\n';
    }
    
    if (trHtml != '') {
      return '<table>\n' + trHtml + '</table>';
    } else {
      return '';
    }
  }
  getStyleId() {
    var result = this._styleId;
    this._styleId++;

    return result;
  }
  _color2kmlColor(color, opacity) {
    if (color && color != '' && color.charAt(0) == '#') {
      color = color.slice(1);

      if (color.length == 3) {
        color = color.slice(-1) + color.slice(1, -1) + color.slice(0, 1);
      }
      else if (color.length == 6) {
        color = color.slice(-2) + color.slice(2, -2) + color.slice(0, 2);
      }
    }
    else {
      color = '000000';
    }
    opacity = ('' + opacity.toString(16));
    if (opacity.length == 1) opacity = '0' + opacity;

    color = opacity + '' + color;
    return color;
  }
  _getKMLStyleId(styleList, feature, itemType) {
    var styleId = '';

    if(feature.geometryType === GSIBV.Map.Draw.Marker.Type && feature.markerType === GSIBV.Map.Draw.Marker.MarkerType) {
      var iconUrl = feature.style._iconUrl;
      var iconSize = feature.style._iconSize;
      var iconAnchor = feature.style._iconOffset;
      var iconScale = feature.style._iconScale;

      if (!iconScale) iconScale = 1;
      var hotSpot = {
        x: Math.round((iconAnchor[0] / iconSize[0]) * 10) / 10,
        y: Math.round((iconAnchor[1] / iconSize[1]) * 10) / 10,
      };
      styleId = this._findKMLStyle(styleList, itemType, {
        iconUrl: iconUrl,
        iconScale: iconScale,
        hotSpot: hotSpot.x + ',' + hotSpot.y
      });

      if (!styleId) {
        styleId = 'PolyStyle' + this.getStyleId();

        var text =
          '<Style id="' + styleId + '">\n' +
          '  <IconStyle>\n' +
          '  <Icon>\n' +
          '  <href>' + iconUrl + '</href>\n' +
          '  </Icon>\n' +
          '  <scale>' + iconScale + '</scale>\n';

        if (hotSpot.x != 0 || hotSpot.y != 0) {
          text +=
            '  <hotSpot x="' + hotSpot.x + '" y="' + hotSpot.y + '" xunits="fraction" yunits="fraction" />\n';
        }
        text +=
          '  </IconStyle>\n' +
          '</Style>\n';
        styleList[styleId] = {
          type: itemType,
          text: text,
          style: {
            iconUrl: iconUrl,
            iconScale: iconScale,
            hotSpot: hotSpot.x + ',' + hotSpot.y
          }
        };
      }
      
      return styleId;
    }
    if(feature.geometryType === GSIBV.Map.Draw.Polygon.Type
      || (feature.geometryType === GSIBV.Map.Draw.Marker.Type && GSIBV.Map.Draw.Circle.MarkerType)) {

        var color = feature.style._color;
        var opacity = Math.floor((feature.style._opacity || feature.style._opacity == 0 ? feature.style._opacity : 1) * 255);
        var weight = feature.style._weight;
        var fillColor = feature.style._fillColor;

        if (!fillColor) fillColor = color;
        var fillOpacity = Math.floor((feature.style._fillOpacity || feature.style._fillOpacity == 0 ? feature.style._fillOpacity : 1) * 255);
        color = this._color2kmlColor(color, opacity);
        fillColor = this._color2kmlColor(fillColor, fillOpacity);

        styleId = this._findKMLStyle(styleList, itemType, {
          color: color,
          weight: weight,
          fillColor: fillColor
        });

        if (!styleId) {
          styleId = 'PolyStyle' + this.getStyleId();

          var text =
            '<Style id="' + styleId + '">\n' +
            '  <LineStyle>\n' +
            '  <color>' + color + '</color>\n' +
            '  <width>' + weight + '</width>\n' +
            '  </LineStyle>\n' +
            '  <PolyStyle>\n' +
            '  <color>' + fillColor + '</color>\n' +
            '  </PolyStyle>\n' +
            '</Style>\n';
          styleList[styleId] = {
            type: itemType,
            text: text,
            style: {
              color: color,
              weight: weight,
              fillColor: fillColor
            }
          };
        }
        
      return styleId;
    }
    if(feature.geometryType === GSIBV.Map.Draw.Line.Type) {
      var color = feature.style._color;
      var opacity = Math.floor((feature.style._opacity || feature.style._opacity == 0 ? feature.style._opacity : 1) * 255);
      var weight = feature.style._weight;
      color = this._color2kmlColor(color, opacity);

      if (opacity.length == 1) opacity = '0' + opacity;

      styleId = this._findKMLStyle(styleList, itemType, {
        color: color,
        weight: weight
      });

      if (!styleId) {
        styleId = 'LineStyle' + this.getStyleId();

        var text =
          '<Style id="' + styleId + '">\n' +
          '  <LineStyle>\n' +
          '  <color>' + color + '</color>\n' +
          '  <width>' + weight + '</width>\n' +
          '  </LineStyle>\n' +
          '</Style>\n';
        styleList[styleId] = {
          type: itemType,
          text: text,
          style: {
            color: color,
            weight: weight
          }
        };
      }
      
      return styleId;
    }

    return styleId;
  }
  _findKMLStyle(styleList, itemType, style) {
    var id = null;
    for (var key in styleList) {
      var styleData = styleList[key];

      if (styleData.type == itemType) {
        var hit = true;
        for (var key2 in style) {
          if (styleData.style[key2] != style[key2]) {
            hit = false;
            break;
          }
        }

        if (hit) {
          id = key;
          break;
        }

      }
    }

    return id;
  }
  isFlat(latlngs) {
    return !Array.isArray(latlngs[0]) || (typeof latlngs[0][0] !== 'object' && typeof latlngs[0][0] !== 'undefined');
  }
  _makeKMLPoint(feature, styleList, itemType) {
    var latLng = feature.coordinates._coordinates[0];

    var properties = feature.properties._properties;
    
    var title = properties.name;
    var description = properties.description;

    if (description) {
      description = description.replace(/[\n\r]/g, '');
    } else {
      description = this._tableItem2Description(properties);
      description = description.replace(/[\n\r]/g, '');
    }

    var styleId = this._getKMLStyleId(styleList, feature, itemType);

    var result = {
      data: ''
    };

    result.data = '<Placemark>\n';

    if (title && title != '')
      result.data += '<name>' + this._encodeHTML(title) + '</name>' + '\n';

    if (description && description != '')
      result.data += '<description><![CDATA[ ' + description + ' ]]></description>' + '\n';

    result.data +=
      '<styleUrl>#' + styleId + '</styleUrl>' + '\n' +
      '<Point>\n' +
      '<coordinates>';

    result.data += latLng._lng + "," + latLng._lat + (latLng._alt ? "," + latLng._alt : ""); // + "\n";

    result.data +=
      '</coordinates>\n' +
      '</Point>\n' +
      '</Placemark>\n';
    return result;
  }
  _makeKMLPolygon(feature, styleList, itemType) {
    var latLngs = null;

    if (itemType === GSIBV.Map.Draw.Circle.MarkerType) {
      // 円→ポリゴン
      latLngs = [];
      var numSides = 160;
      var center = feature._coordinates._coordinates[0]
      var center_lat_rad = center._lat * Math.PI / 180;
      var center_lng_rad = center._lng * Math.PI / 180;
      var dmax_lat = feature.style.radius / 6378137;
      var xys = [];
      xys.push([dmax_lat, 0]);
      for (var i = 1; i < numSides; i++) {
        var y = dmax_lat - 2 * dmax_lat / numSides * i;
        var x = 2 * Math.asin(Math.sqrt((Math.pow(Math.sin(dmax_lat / 2), 2) - Math.pow(Math.sin((y) / 2), 2)) / (Math.cos(center_lat_rad + y) * Math.cos(center_lat_rad))));
        if (x !== x) {
          return;
        } else {
          xys.push([y, x]);
        }
      }
      xys.push([-dmax_lat, 0]);
      for (var i = 1; i < numSides; i++) {
        xys.push([xys[numSides - i][0], -xys[numSides - i][1]]);
      }
      xys.push([dmax_lat, 0]);
      for (var i = 0; i < xys.length; i++) {
        latLngs.push({_lat:(center_lat_rad + xys[i][0]) / (Math.PI / 180), _lng:(center_lng_rad + xys[i][1]) / (Math.PI / 180), _alt:center._alt});
      }
    } else {
      latLngs = feature.coordinates._coordinates;
    }

    var properties = feature.properties._properties;
    
    var title = properties.name;
    var description = properties.description;

    if (description) {
      description = description.replace(/[\n\r]/g, '');
    } else {
      description = this._tableItem2Description(properties);
      description = description.replace(/[\n\r]/g, '');
    }

    var styleId = this._getKMLStyleId(styleList, feature, itemType);
    var result = {
      style: '',
      data: ''
    };

    result.data = '<Placemark>\n';

    if (title && title != '')
      result.data += '<name>' + this._encodeHTML(title) + '</name>' + '\n';

    if (description && description != '')
      result.data += '<description><![CDATA[ ' + description + ' ]]></description>' + '\n';

    result.data +=
      '<styleUrl>#' + styleId + '</styleUrl>' + '\n' +
      '<Polygon>' + '\n';

    var flat = this.isFlat(latLngs);

    if (flat) latLngs = [latLngs];
    for( var i= 0; i<latLngs.length; i++ ) {
      result.data += ( i== 0 ? '<outerBoundaryIs>' : '<innerBoundaryIs>' ) + '\n' +
      '<LinearRing>' + '\n' +
      '<coordinates>';
      for (var j = 0; j < latLngs[i].length; j++) {
        result.data += (j > 0 ? ' ' : '')
          + latLngs[i][j]._lng + "," + latLngs[i][j]._lat + (latLngs[i][j]._alt ? "," + latLngs[i][j]._alt : "");
      }
      // close polygon
      if (latLngs[i].length > 0) {
        result.data += ' ' + latLngs[i][0]._lng + "," + latLngs[i][0]._lat + (latLngs[i][0]._alt ? "," + latLngs[i][0]._alt : "");
      }
      result.data += '</coordinates>\n' +
      '</LinearRing>' + '\n' +
      ( i== 0 ? '</outerBoundaryIs>' : '</innerBoundaryIs>' ) + '\n';
    }
    result.data += 
      '</Polygon>\n' +
      '</Placemark>\n';

    return result;
  }
  _makeKMLLine(feature, styleList, itemType) {
    var latLngs = feature.coordinates._coordinates;

    var properties = feature.properties._properties;
    
    var title = properties.name;
    var description = properties.description;

    if (description) {
      description = description.replace(/[\n\r]/g, '');
    } else {
      description = this._tableItem2Description(properties);
      description = description.replace(/[\n\r]/g, '');
    }

    var styleId = this._getKMLStyleId(styleList, feature, itemType);
    var result = {
      style: '',
      data: ''
    };

    result.data = '<Placemark>\n';

    if (title && title != '')
      result.data += '<name>' + this._encodeHTML(title) + '</name>' + '\n';

    if (description && description != '')
      result.data += '<description><![CDATA[ ' + description + ' ]]></description>' + '\n';

    result.data +=
      '<styleUrl>#' + styleId + '</styleUrl>' + '\n' +
      '<LineString>' + '\n' +
      '<coordinates>';

    for (var i = 0; i < latLngs.length; i++) {
      result.data += (i > 0 ? ' ' : '')
        + latLngs[i]._lng + "," + latLngs[i]._lat + (latLngs[i]._alt ? "," + latLngs[i]._alt : "");

    }
    result.data += '</coordinates>\n' +
      '</LineString>\n' +
      '</Placemark>\n';

    return result;
  }
};



/*

*/
GSIBV.Map.Draw.Manager.LayerList = class extends GSIBV.Map.LayerList {

  constructor(map) {
    super(map);
  }
  
  _addToList( layer ) {
    var topList = [];
    for( var i=0;i<this._list.length; i++ ) {
      if ( this._list[i].order != undefined ) {
        topList.push(this._list[i]);
      }
    }

    for( var i=0; i<topList.length; i++ ) {
      var idx = this._list.indexOf( topList[i]);
      if ( idx >= 0 ) this._list.splice(idx,1);
    }
    
    if ( layer.order != undefined ) {
      topList.push( layer );
    } else {
      this._list.push(layer);
    }

    topList.sort(function(a,b){
      if( a.order < b.order ) return -1;
      if( a.order > b.order ) return 1;
      return 0;
    });

    for( var i=0; i<topList.length; i++ ) {
      this._list.push( topList[i]);
    }
  }
};


/*

*/
GSIBV.Map.Draw.UserDrawList = class extends MA.Class.Base {
  constructor(layerList) {
    super();
    this._layerList = layerList;
    this._list = [];
  }

  get length () { return this._list.length; }
  get(idx) { return this._list[idx]; }

  get editing() {
    for ( var i=0; i<this._list.length; i++ ) {
      if ( this._list[i].editing ) return this._list[i];
    }
    return false;
  }

  _addItem(item) {
    this._list.push( item);
    this._layerList.add( item.layer );
    item.on("remove", MA.bind(function(evt){
      //console.log( "remove", evt.from );
      this.remove(evt.from);
    },this));


    item.on("editstart", MA.bind(function(evt){
      this.fire("editstart", evt.params);
    },this));

    item.on("editfinish", MA.bind(function(evt){
      this.fire("editfinish", evt.params);
    },this));

    item.on("editfeature", MA.bind(function(evt){
      this.fire("editfeaturestart", evt.params);
    },this));

    
    item.on("requesteditfeature", MA.bind(function(evt){
      this.fire("requesteditfeature", evt.params);
    },this));

    
    item.on("requestremovefeature", MA.bind(function(evt){
      this.fire("requestremovefeature", evt.params);
    },this));
  }

  add(item) {
    var added = [];
    if ( MA.isArray(item)) {
      for( var i=0; i<item.length; i++) {
        this._addItem(item[i]);
        added.push( item[i]);
      }
    } else {
      this._addItem(item);
      added.push( item);
    }
    this.fire("change",{
      list : added,
      "type" : "add"
    });
  }

  remove(item) {
    var removed = [];

    var idx = null;
    
    if ( item instanceof GSIBV.Map.Draw.UserDrawList.Item ) {
      idx = this._list.indexOf( item );
    } else {
      idx = item;
    }

    if ( idx < 0 || idx >= this._list.length) {
      //console.log( "no-data");
      this.fire("change");
      return;
    }

    item = this._list[idx];

    if (item.isUserDraw ) {
      //console.log( "item.isUserDraw");
      item.clear();
      return;
    }

    this._layerList.remove( item.layer );
    item.destroy();
    this._list.splice(idx, 1);

    removed.push( item);

    this.fire("change",{
      list : removed,
      "type" : "remove"
    });
  }
};



GSIBV.Map.Draw.UserDrawList.Item = class extends MA.Class.Base {

  constructor(map, fileName, featureCollection, noEdit, fKey) {
    super();
    this._map = map;
    this._fileName = fileName;
    this._operation = this._initOperationType();
    this._featureCollection = featureCollection;
    this._noEdit =  noEdit ? true : false;
    this._layer = this._initLayer();
    this._featureCollection.on ( "change", MA.bind(this._onFeatureCollectionUpdate, this ));
    this._fKey = fKey;
  }

  get layer() { return this._layer; }
  get fileName() { return this._fileName; }
  get featureCollection() { return this._featureCollection; }
  get operation() { return this._operation; }
  get fKey() {return this._fKey;}

  get opacity() {
    return this._layer.getOpacity();
  }

  set opacity(opacity) {
    this._layer.setOpacity(opacity);
  }

  get visible() {
    return this._layer.visible;
  }

  set visible( value ) {
    this._layer.visible = value;
    this.fire("change");
  }

  _initLayer(){
    if(this._fileName.match(/\.tif[f]*$/i)) return new GSIBV.Map.Layer.GeoTiff( MA.getId("-gsi-geotiff-"), this._featureCollection );
    return new GSIBV.Map.Draw.Layer( MA.getId("-gsi-draw-"), this._featureCollection );
  }

  _initOperationType(){
    if(this._fileName.match(/\.tif[f]*$/i)) return "opacity";
    if(this._fileName.match(/\.jp[e]{0,1}g$/i)) return "none";
    return "edit";
  }

  destroy() {
    this.finishEdit();
    this._featureCollection.destroy();
  }

  addFeature( feature ) {
    this._featureCollection.add( feature );
    //this._layer .update();
  }

  remove() {
    this.fire( "remove");
    this.destroy();
  }

  clear() {
    this._featureCollection.clear();
    this._layer .update();
  }

  _onFeatureCollectionUpdate() {
    this._layer.update();
    this.fire("change");
  }

  edit() {
    if ( this.editing) return;
    this._showFeatureSelector();

    this.fire("editstart", {"item":this});

    
    try {
      var bounds = this.featureCollection.bounds;
      var lnglatBounds = new mapboxgl.LngLatBounds(
        new mapboxgl.LngLat(bounds.northWest.lng, bounds.northWest.lat),
        new mapboxgl.LngLat(bounds.southEast.lng, bounds.southEast.lat)
      );
      var size = MA.getScreenSize();
      var maxZoom = 11;
      if ( this._map.map.getZoom() >= 11 ) maxZoom = this._map.map.getZoom();
      
      this._map.map.fitBounds(lnglatBounds,{
        speed: 2,
        curve: 1.5,
        maxZoom: maxZoom,
        padding:size.width > 300 && size.height > 300 ? 100 : 0});
    }catch(e){}


    
  }

  finishEdit() {

    if ( this._featureSelector ) {
      this._featureSelector.destroy();
      this._featureSelector = undefined;
    }

    if  (this._editor) {
      this._editor.destroy();
    }

    this.fire("editfinish", {"item":this});
  }

  get editing() {
    return ( this._featureSelector ? true : false );

  }

  set editing( value ) {
    if ( value ) {
      this.edit();
    } else {
      this.finishEdit();
    }
  }

  stopEditFeature() {

    if ( this._editor) {
      this._editor.destroy();
      this._editor = undefined;
    }
    
    this._showFeatureSelector();

  }

  editFeature( feature ) {

    if ( this._editor) {
      this._editor.destroy();
      this._editor = undefined;
    }
    switch(feature.geometryType){
      case GSIBV.Map.Draw.Line.Type:
      // ライン
        this._editor = new GSIBV.Map.Draw.LineEditor( this._map, feature);
        break;
      case GSIBV.Map.Draw.MeasureLine.Type:
      // ライン
        this._editor = new GSIBV.Map.Draw.MeasureLineDrawer( this._map, feature);
        break;
      case GSIBV.Map.Draw.Polygon.Type:
      // ポリゴン
        this._editor = new GSIBV.Map.Draw.PolygonEditor( this._map, feature);
        break;
      case GSIBV.Map.Draw.MeasurePolygon.Type:
      // ポリゴン
        this._editor = new GSIBV.Map.Draw.MeasurePolygonEditor( this._map, feature);
        break;
      case GSIBV.Map.Draw.MultiPolygon.Type:
      // マルチポリゴン
        this._editor = new GSIBV.Map.Draw.MultiPolygonEditor( this._map, feature);
        break;
      case GSIBV.Map.Draw.Marker.Type:
        if ( feature.markerType == GSIBV.Map.Draw.Marker.MarkerType ) {
        // マーカー
          this._editor = new GSIBV.Map.Draw.MarkerEditor( this._map, feature);
        } else if ( feature.markerType == GSIBV.Map.Draw.CircleMarker.MarkerType ) {
        // サークルマーカー
          this._editor = new GSIBV.Map.Draw.CircleMarkerEditor( this._map, feature);
        } else if ( feature.markerType == GSIBV.Map.Draw.Circle.MarkerType ) {
        // サークル
          this._editor = new GSIBV.Map.Draw.CircleEditor( this._map, feature);
        } else if ( feature.markerType == GSIBV.Map.Draw.DivMarker.MarkerType ) {
        // DIVマーカー
          this._editor = new GSIBV.Map.Draw.DivMarkerEditor( this._map, feature);
        }
        break;
    }

    if ( this._editor ) {
      this.fire("editfeature", {"item":this, "feature":feature,"layer": this.layer});

      var center = feature.bounds.center;
      if ( center )
        this._map.map.flyTo( {center:center} ); 

      this._editor.start();
      this._featureSelector.hide();
      this._showFeatureSelector( feature);

    }
  }

  removeFeature( feature) {

    this._featureCollection.remove( feature);
    this._featureSelector.remove( feature);
    this._layer.update();
    this.fire( "removefeature");
    if ( this._featureCollection.length <= 0 ) {
      this.remove();
    }
  }

  _onSelectorEdit(evt) {
    var feature = evt.params.feature;
    this.fire("requesteditfeature", {"item":this, "feature":feature});
    this.editFeature(feature);
  }

  _onSelectorRemove(evt) {
    // 削除した対象のitemのindexを保存して、後の処理でアイコン表示名の選択欄をリセットする
    GSIBV.FeatureItemIndex = undefined;
    var objList = GSIBV.application._sakuzuDialog._list._list;
    for(var i=0; i< objList.length; i++){
      var features = objList[i]._item.featureCollection._features;
      for(var j=0; j < features.length; j++){
        if(features[j] == evt.params.feature){
          GSIBV.FeatureItemIndex = i;
          i =  objList.length;
          break;
        }
      }
    }

    var feature = evt.params.feature;
    this.fire("requestremovefeature", {"item":this, "feature":feature});
    this.removeFeature(feature);
    
  }

  _showFeatureSelector(feature) {
    if ( !this._featureSelector) {
      this._featureSelector = new GSIBV.Map.Draw.Control.FeatureSelector( this._map, this._featureCollection, this._noEdit);
      this._featureSelector.on( "remove", MA.bind( this._onSelectorRemove, this ));
      this._featureSelector.on( "edit", MA.bind( this._onSelectorEdit, this ));
    }
    this._featureSelector.show(feature);
  }

};



