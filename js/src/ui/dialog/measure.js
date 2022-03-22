GSIBV.UI.Dialog.MeasureDialog = class extends GSIBV.UI.Dialog.Modeless {

  constructor(options) {
    super(options);
    this._align = "right";
    this._position = {left:242,top:266};
    this._size.width = 300;
    this._size.height = 130;
    this._map = (options ? options.map: undefined);
    var dialogManager = GSIBV.UI.Dialog.Modeless.Manager.get();
    var frameSize = MA.DOM.size( dialogManager.frame );

    this._position = {left:frameSize.width-this._size.width-4,top:39};
    this._resizable = false;
    this._current = null;
    this._frameClass = ["-gsibv-measure-dialog"];
  }

  get type() {
    const radioList = MA.DOM.find(this._contentsInner, "input.measure-type");
    for( let i=0; i<radioList.length; i++ ) {
      const radio = radioList[i];
      if ( radio.checked ) {
        return radio.value;
      }
    }
  }

  show() {
    this._buttons = [
      { "id": "save", "title": "経路又は範囲を保存", "description": GSIBV.CONFIG.LANG.JA.UI.MEASURE.TOOLBUTTON["button.save"]},
      { "id": "explanation", "title": "計測値の説明" }
    ];
    super.show();
  }

  _genBtnNode(btnInfo){
    var btn = super._genBtnNode(btnInfo);
    if(btnInfo["description"]){
      var span = MA.DOM.create("span");
      span.setAttribute("title", btnInfo["description"]);
      span.appendChild(btn);
      return span
    } 
    return btn;
  }

  hide() {
    this._map.drawManager.stopDraw();
    this._map.drawManager.stopEdit();
    this._hideFeatureSelector();
    super.hide();
  }

  _draw(type) {
    var proc = MA.bind(function(type){
      if ( this._map.drawManager.drawer && this._map.drawManager.drawer.type == type ) {
        this._map.drawManager.stopDraw();
      } else {
        this._map.drawManager.draw(type);
      }
    },this,type);
    
    proc();
  }

  _onButtonClick(btnInfo) {
    if(btnInfo.element == undefined || btnInfo.element.disabled) return;

    if ( btnInfo.id == "save") {
      this._saveBtnClick();
      return;
    };
    
    if ( btnInfo.id == "explanation") {
      var url = "https://maps.gsi.go.jp/help/howtouse.html";
      window.open(url, '_blank').focus();
    };
  }
  
  _saveBtnClick() {
    if (!this._saveTypeSelectContainer) {
      var createButton = function(container, text, clickHandler) {
        var button = MA.DOM.create("a");
        button.setAttribute("href", "javascript:void(0);")
        button.innerHTML = text;
        MA.DOM.on( button, "mousedown", clickHandler );
        container.appendChild( button );
        return button;
      };

      this._saveTypeSelectContainer = MA.DOM.create("div");
      MA.DOM.addClass( this._saveTypeSelectContainer, "gsi_measuredialog_save_frame" );

      createButton(this._saveTypeSelectContainer, "CSV形式で保存", MA.bind(this._saveCSV, this));
      createButton(this._saveTypeSelectContainer, "GeoJSON形式で保存", MA.bind(this._saveGeoJSON, this));
      createButton(this._saveTypeSelectContainer, "KML形式で保存", MA.bind(this._saveKML, this));
      
      MA.DOM.hide(this._saveTypeSelectContainer)
      document.body.appendChild(this._saveTypeSelectContainer);
    }

    var screenSize = MA.getScreenSize();
    this._saveTypeSelectContainer.style.left = this._frame.offsetLeft + this._footer.children[0].offsetLeft + "px";
    this._saveTypeSelectContainer.style.bottom = (screenSize.height - this._frame.offsetHeight - this._frame.offsetTop + this._footer.children[0].offsetHeight + 6) + "px";

    MA.DOM.show(this._saveTypeSelectContainer);
    if (!this._saveTypeSelectDocumentMouseDownHandler) {
      this._saveTypeSelectDocumentMouseDownHandler = MA.bind(function (e) {
        var target = e.target;
        while (target) {
          if (target == this._saveTypeSelectContainer[0]) {
            return;
          }
          target = target.parentNode;
        }

        this._hideSaveTypeSelect();
      }, this);
      MA.DOM.on( document.body, "mousedown", this._saveTypeSelectDocumentMouseDownHandler );
    }
  }
  
  _saveCSV() {
    console.log("saveCSV");
    this._hideSaveTypeSelect();
    var data = this._map.drawManager._drawer._latlngs;
    if (!data) return;

    function fix(val) {
      return (Math.round(val * 1000000) / 1000000).toFixed(6);
    }

    var csv = "lat,lng";
    for (var i = 0; i < data.length; i++) {
      if (csv != "") csv += "\r\n";

      csv += fix(data[i].lat) + "," + fix(data[i].lng);
    }

    if ( !this._saveCsvDialog) {
      this._saveCsvDialog = new GSIBV.UI.Dialog.SaveFileDialog(
        "CSV形式で保存", GSIBV.UI.Dialog.SaveFileDialog.FILE_TEXT);
    }
    this._saveCsvDialog.show('measure' + this._getTimeStampString() + ".csv",csv);
  }

  _saveGeoJSON() {
    console.log("saveGeoJSON");
    this._hideSaveTypeSelect();
    var data =  this._map.drawManager._drawer._latlngs;
    if (!data) return;
    var geojson = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {
          },
          "geometry": {
            "type": "LineString",
            "coordinates": []
          }
        }
      ]
    };

    var coords = [];
    for (var i = 0; i < data.length; i++) {
      coords.push([data[i].lng, data[i].lat]);
    }

    switch (this._map.drawManager._drawer.type) {
      case "MeasurePolygon":
        geojson.features[0]["geometry"]["type"] = "Polygon";
        geojson.features[0]["geometry"]["coordinates"] = [coords];
        break;

      case "MeasureLine":
        geojson.features[0]["geometry"]["type"] = "LineString";
        geojson.features[0]["geometry"]["coordinates"] = coords;
        break;
    }

    geojson = JSON.stringify(geojson, null, 2);

    if ( !this._saveGeojsonDialog) {
      this._saveGeojsonDialog = new GSIBV.UI.Dialog.SaveFileDialog("GeoJSON形式で保存", GSIBV.UI.Dialog.SaveFileDialog.FILE_TEXT);
    }
    this._saveGeojsonDialog.show('measure' + this._getTimeStampString() + ".geojson",geojson);
  }

  _saveKML() {
    console.log("saveKML");
    this._hideSaveTypeSelect();
    var data = this._map.drawManager._drawer._latlngs;
    if (!data) return;
    var kml = "";

    var coords = '';
    for (var i = 0; i < data.length; i++) {
      if (coords != "") coords += " ";
      coords += data[i].lng + "," + data[i].lat;
    }
    coords = "<coordinates>" + coords + "</coordinates>";

    if (["polygon", "MeasurePolygon"].includes(this._map.drawManager._drawer.type)) {
      kml = '<?xml version="1.0" encoding="UTF-8"?>' + "\r\n" +
        '<kml xmlns="http://www.opengis.net/kml/2.2">' + "\r\n" +
        '<Document>' + "\r\n" +
        '<Style id="PolyStyle1">' + "\r\n" +
        '</Style>' + "\r\n" +
        '<Placemark>' +
        '<styleUrl>#PolyStyle1</styleUrl>' + "\r\n" +
        '<Polygon>' + "\r\n" +
        '<outerBoundaryIs>' + "\r\n" +
        '<LinearRing>' + "\r\n" +
        coords + "\r\n" +
        '</LinearRing>' + "\r\n" +
        '</outerBoundaryIs>' + "\r\n" +
        '</Polygon>' + "\r\n" +
        '</Placemark>' + "\r\n" +
        '</Document>' + "\r\n" +
        '</kml>' + "\r\n";
    } else if (this._map.drawManager._drawer.type == "MeasureLine") {
      kml = '<?xml version="1.0" encoding="UTF-8"?>' + "\r\n" +
        '<kml xmlns="http://www.opengis.net/kml/2.2">' + "\r\n" +
        '<Document>' + "\r\n" +
        '<Style id="LineStyle1">' + "\r\n" +
        '</Style>' + "\r\n" +
        '<Placemark>' +
        '<styleUrl>#LineStyle1</styleUrl>' + "\r\n" +
        '<LineString>' + "\r\n" +
        coords + "\r\n" +
        '</LineString>' + "\r\n" +
        '</Placemark>' + "\r\n" +
        '</Document>' + "\r\n" +
        '</kml>' + "\r\n";
    }

    if ( !this._saveKmlDialog) {
      this._saveKmlDialog = new GSIBV.UI.Dialog.SaveFileDialog("KML形式で保存", GSIBV.UI.Dialog.SaveFileDialog.FILE_TEXT);
    }
    this._saveKmlDialog.show('measure' + this._getTimeStampString() + ".kml",kml);
  }

  _getTimeStampString() {
    var now = new Date();
  
    var year = now.getFullYear(); // 年
    var month = now.getMonth() + 1; // 月
    var day = now.getDate(); // 日
    var hour = now.getHours(); // 時
    var min = now.getMinutes(); // 分
    var sec = now.getSeconds(); // 秒
    var msec = now.getMilliseconds(); // ミリ秒
    var result =
      year + '' +
      ( '00' + month ).slice(-2)  +
      ( '00' + day ).slice(-2) +
      ( '00' + hour ).slice(-2) +
      ( '00' + min ).slice(-2) +
      ( '00' + sec ).slice(-2) +
      msec ;
    return result;
  };

  _hideSaveTypeSelect() {
    MA.DOM.hide(this._saveTypeSelectContainer);
    if (this._saveTypeSelectDocumentMouseDownHandler) {
      MA.DOM.off( document.body, "mousedown", this._saveTypeSelectDocumentMouseDownHandler );
      this._saveTypeSelectDocumentMouseDownHandler = null;
    }
  }

  _createHeader(headerContainer) {
    this._titleContainer = MA.DOM.create("div");
    this._titleContainer.innerHTML = "計測";
    headerContainer.appendChild(this._titleContainer);
    super._createHeader(headerContainer);
  }

  // ダイアログの中身生成
  _create() {
    super._create();

    if (this._contentsInner) {
      this._onTypeSelect(this.type);
      return;
    }
    
    const frame = MA.DOM.select( "#template .dialog-measure")[0].cloneNode(true)
    //MA.DOM.addClass( this._frame, "saveimagedialog");
    this._contents.appendChild( frame );

    const radioList = MA.DOM.find(frame, "input.measure-type");
    
    for( let i=0; i<radioList.length; i++ ) {
      const radio = radioList[i];
      const id = MA.getId( "gsi-measure-type" );
      const label = MA.DOM.find(frame, "label." + radio.value)[0];
      radio.setAttribute("name","gsi-measure-type");
      radio.setAttribute("id",id);
      label.setAttribute("for", id);
      if ( radio.value==="screen") radio.setAttribute("checked", true);

      MA.DOM.on( radio, "click", MA.bind(this._onTypeSelect, this, radio.value) );
    }

    try {
      for( var key in GSIBV.CONFIG.LANG.JA.UI.MEASURE.TOOLBUTTON ) {
        MA.DOM.find( frame, key ).forEach(element => {
          element.setAttribute("title", GSIBV.CONFIG.LANG.JA.UI.MEASURE.TOOLBUTTON[key]);
        });
      }
    } catch {}

    this._contentsInner= frame;
    radioList[0].click();
  }

  _updateLastLatlngDisp(disp){
    MA.DOM.find( this._contentsInner, ".measure-lastlatlng" )[0].style.display = disp;
  }

  _updateResultDisp(disp){
    MA.DOM.find( this._contentsInner, ".measure-result" )[0].style.display = disp;
  }

  _onTypeSelect (type) {
    this._map.drawManager._userDrawingItem.featureCollection.clear();
    this._map.drawManager.stopDraw();
    this._hideFeatureSelector();

    this._updateResultDisp("");
    this._updateLastLatlngDisp("");
    MA.DOM.find( this._contentsInner, ".measure-result" )[0].innerHTML = "------";
    MA.DOM.find( this._contentsInner, ".measure-lastlatlng" )[0].innerHTML = "------";
    this.disableButton(0);
    this._isMulti = undefined;
    switch(type) {
      case "type1":
        this._draw(GSIBV.Map.Draw.MeasureLine.Type);
        break;
      case "type2":
        this._draw(GSIBV.Map.Draw.MeasurePolygon.Type);
        break;
      case "type3":
        this._updateLastLatlngDisp("none");
        this._getGraphics(false);
        break;
      case "type4":
        this._updateLastLatlngDisp("none");
        this._getGraphics(true);
        break;
    }

    this._refreshView();
  }

  _refreshView() {
    const areaSelector = this._map.areaSelector;
    if ( !areaSelector) return;
    const range = areaSelector.range;
    const minLatLng = range.min;
    const maxLatLng = range.max;
  
    MA.DOM.find(this._contentsInner, '.measure-result input[name="image-width"]')[0].value=areaSelector.width;
    MA.DOM.find(this._contentsInner, '.measure-result input[name="image-height"]')[0].value=areaSelector.height;
    MA.DOM.find(this._contentsInner, ".measure-result .min-lat")[0].innerHTML = minLatLng.lat.toFixed(6);
    MA.DOM.find(this._contentsInner, ".measure-result .max-lat")[0].innerHTML = maxLatLng.lat.toFixed(6);
    MA.DOM.find(this._contentsInner, ".measure-result .min-lng")[0].innerHTML = minLatLng.lng.toFixed(6);
    MA.DOM.find(this._contentsInner, ".measure-result .max-lng")[0].innerHTML = maxLatLng.lng.toFixed(6);
    
    MA.DOM.find(this._contentsInner, '.measure-lastlatlng input[name="min-lat"]')[0].value = minLatLng.lat.toFixed(6);
    MA.DOM.find(this._contentsInner, '.measure-lastlatlng input[name="max-lat"]')[0].value = maxLatLng.lat.toFixed(6);
    MA.DOM.find(this._contentsInner, '.measure-lastlatlng input[name="min-lng"]')[0].value = minLatLng.lng.toFixed(6);
    MA.DOM.find(this._contentsInner, '.measure-lastlatlng input[name="max-lng"]')[0].value = maxLatLng.lng.toFixed(6);
    MA.DOM.find(this._contentsInner, ".measure-lastlatlng .image-width")[0].innerHTML = areaSelector.width;
    MA.DOM.find(this._contentsInner, ".measure-lastlatlng .image-height")[0].innerHTML = areaSelector.height;
  }

  _getGraphics(multi) {
    this._isMulti = multi;
    var list = this._map._drawManager.layerList._list;
    this._featureSelectorList = [];

    if(!this._itemClickedHdler) this._itemClickedHdler = MA.bind(this._itemClicked, this);
    for(var i=0; i<list.length; i++) {
      var featuresLen = list[i]._featureCollection._features.length;
      if(featuresLen>0) {
        this._featureSelectorList.push(this._showFeatureSelector(list[i]._featureCollection, multi));
      }
    }
  }
  
  _showFeatureSelector(featureCollection, multi) {
    var selector = new GSIBV.Map.Draw.Measure.FeatureSelector( this._map, featureCollection, multi);
    selector.on("clicked", this._itemClickedHdler);
    selector.show();
    return selector;
  }

  _hideFeatureSelector() {
    if(this._featureSelectorList){
      for(var selector of this._featureSelectorList){
        if(this._itemClickedHdler) selector.off("clicked", this._itemClickedHdler);
        selector.hide();
      }
      this._itemClickedHdler = undefined;
    }
  }

  _itemClicked(e){
    if(this._isMulti == undefined) return;

    let id = e.params && e.params.id ? e.params.id:null;
    if(!id) return;
    var str = this._isMulti?this._parseResultForMultiMode(id):this._parseResultForSingleMode(id);
    var dialog = MA.DOM.find( document.body, ".-gsibv-measure-dialog" )[0];
    MA.DOM.find( dialog, ".measure-result" )[0].innerHTML = str;
  }

  _parseResultForSingleMode(id){
    console.log("single mode item is clicked. id: " + id);
    let selectedItem = undefined;
    for(var featureSelect of this._featureSelectorList) {
      for(var item of featureSelect.itemList) {
        if(item.id == id) {
          selectedItem = item;
          item.updateStatus(true);
        } else {
          item.updateStatus(false);
        }
      }
    }

    var str = undefined;
    if(selectedItem){
      let value = selectedItem.getValue();
      let geomType = selectedItem.feature.geometryType;
      if(geomType === "Polygon") {str = "面積: " + GSI.Utils.AreaCalculator.getAreaStr(value);}
      else if(geomType === "LineString") {str = "距離: " + GSI.Utils.DistanceCalculator.getDistanceStr(value);}
    }
    
    return str? str:'------';
  }

  _parseResultForMultiMode(id){
    console.log("multi mode item is clicked. id: " + id);
    var totalValue = 0
    for(var featureSelect of this._featureSelectorList) {
      for(var item of featureSelect.itemList) {
        if(item.id == id) {
          item.updateStatus(!item.selected);
        }

        if(item.selected) totalValue += item.getValue();
      }
    }
    return totalValue != 0 ? "面積: " + GSI.Utils.AreaCalculator.getAreaStr(totalValue):'------';
  }

//----------------------------------------------------------------------------------------------
// To delete
  showResultFrame () {
    console.log("======================= [showResultFrame] Enter =======================");
    let resultDisp = ''
    let lastLatlngDisp = '';
    switch(this.type) {
      case "type1":
        resultDisp = "none";
        lastLatlngDisp = "none";
        break;
      case "type2":
        resultDisp = "none";
        break;
      case "type3":
      case "type4":
        lastLatlngDisp = "none";
        break;
    }
    this._updateResultDisp(resultDisp);
    this._updateLastLatlngDisp(lastLatlngDisp);
    this._refreshView();
  }

  showMessage(msg,resetRotate ) {
    console.log("======================= [showMessage] Enter =======================");
    const elem = MA.DOM.find(this._contentsInner, ".saveimage-message")[0];
    elem.innerHTML=msg;
    elem.style.display = msg ? "" : "none";

    if ( resetRotate ) {
      const button = MA.DOM.create("button");
      button.innerHTML = "回転をリセット";
      const div = MA.DOM.create("div");
      div.appendChild(button);
      elem.appendChild(div);

      MA.DOM.on(button,"click", () => {
        this._map.resetPitchBrearing();
      });
    }
  }

  _saveText(fileName, txt) {
    console.log("======================= [_saveText] Enter =======================");
    // var blob = new Blob([txt], { "type": "text/plain" })
    // GSI.Utils.saveFile("text/plain", fileName, blob);
    MA.saveFile(fileName,"text/plain", txt);
  }

  _getCurrentData() {
    console.log("======================= [_getCurrentData] Enter =======================");
    var markers = null;
    var latLngs = null;
    var type = "";
    if (this.polygon) {
      if (this.polygon._markers && this.polygon._markers.length > 2) {
        markers = this.polygon._markers;
        type = "polygon";
      } else if (this._lastLatLngs) {
        latLngs = this._lastLatLngs;
        type = "polygon";
      }
    }

    if (this.polyLine) {
      if (this.polyLine._markers && this.polyLine._markers.length > 1) {
        markers = this.polyLine._markers;
        type = "polyline";
      } else if (this._lastLatLngs) {
        latLngs = this._lastLatLngs;
        type = "polyline";
      }
    }

    if (markers || latLngs) {

      if (!latLngs) {
        latLngs = []

        for (var i = 0; i < markers.length; i++) {
          latLngs.push(L.latLng(markers[i]._latlng));
        }
        if (type == "polygon" && latLngs.length > 1) {
          // 閉じる
          if ((latLngs[0].lat != latLngs[latLngs.length - 1].lat)
            || (latLngs[0].lng != latLngs[latLngs.length - 1].lng)) {
            latLngs.push(L.latLng(latLngs[0]));
          }
        }
      }

      return {
        "latlngs": latLngs,
        "type": type
      };
    }
    return undefined;
  }

  refreshSize() {
    console.log("======================= [refreshSize] Enter =======================");
    const rect = this._contents.getBoundingClientRect();
    const headerRect = this._header.getBoundingClientRect();
    const footerRect = this._footer.getBoundingClientRect();
    this._frame.style.height = (rect.height + (headerRect.height + footerRect.height + 10)) + "px";
  }

  _initInputText( input ) {
    console.log("======================= [_initInputText] Enter =======================");
    MA.DOM.on(input, "focus", (e)=>{
      this.destroyTimer();
      this._inputCheckTimer = setInterval(()=>{ this._inputCheck(input)}, 100 );
    });
    MA.DOM.on(input, "blur", ()=>{
      this.destroyTimer();
    });
  }

  _inputCheck(input) {
    try {
      const name = input.getAttribute("name");
      const value = parseFloat( input.value.trim() );

      switch(name) {
        case "image-width":
          this._map.areaSelector.width = value;
          break;
        case "image-height":
          this._map.areaSelector.height = value;
          break;
        case "min-lat":
          this._map.areaSelector.minLat = value;
          break;
        case "max-lat":
          this._map.areaSelector.maxLat = value;
          break;
        case "min-lng":
          this._map.areaSelector.minLng = value;
          break;
        case "max-lng":
          this._map.areaSelector.maxLng = value;
          break;
        default:
      }
    } catch(ex) {
      console.log(ex);
    }
  }

  destroyTimer() {
    if ( this._inputCheckTimer ) {
      clearTimeout(this._inputCheckTimer);
      this._inputCheckTimer = undefined;
    }

    if ( this._sizeTimerId ) {
      clearTimeout(this._sizeTimerId);
      this._sizeTimerId = undefined;
    }
  }

  _onAreaChange = () => {
    console.log("==================== area changed ====================");
    this._refreshView();
  }

  _resize() {
    this._adjustContents();
    //this._updateScroll();
  }

  _adjustContents() {
    console.log("========================= [_adjustContents] Enter =========================")
    if (!this._frame ) return;
    var visible = this._frame.style.display != 'none';

    if ( !visible ) {
      this._frame.style.visibility = 'hidden';
      this._frame.style.display = '';
    }

    if ( !visible ) {
      this._frame.style.display = 'none';
      this._frame.style.visibility = 'visible';
    }
  }
};










