GSIBV.UI.Dialog.CrossSectionView = class extends GSIBV.UI.Dialog.Modeless {

  constructor(options) {
    super(options);
    this._align = "left";
    this._position = { left: 46, top: 39 };
    this._size.width = 480;
    this._size.height = 422;
    this._map = (options ? options.map : undefined);
    var dialogManager = GSIBV.UI.Dialog.Modeless.Manager.get();
    var frameSize = MA.DOM.size(dialogManager.frame);

    this._resizable = false;
    this._current = null;
    this._frameClass = ["-gsibv-crosssectionview-dialog"];
    this._useDEMTileList = ["DEM5A", "DEM5B", "DEM5C", "DEM10B", "DEMGM"];
  }

  setUseDEMTileList(useDEMTileList) {
    this._useDEMTileList = useDEMTileList;
    this._refresh();
  }
  show(graph) {
    this._buttons = [];
    
    this._graph = graph;
    if (this._graphFrame) this._graphFrame.empty();

    if (!this.container) this._create();
    
    this._graphFrame.empty().append(this._graph.getGraphElement());

    this._scaleSliderContainer.slider("value", 200);

    if (this._graph.getMinMode() == GSIBV.UI.Dialog.CrossSectionViewGraph.MINMODE_0) {
      this._0mSelectRadio[0].checked = true;
    } else {
      this._lowSelectRadio[0].checked = true;
    }

    var ratio = this._graph.getRatio();
    this._ratioVertInput.val(ratio.vert).data({ "vert": ratio.vert });
    //this._ratioHorzInput.val(ratio.horz).data({"horz":ratio.horz});

    this._refreshTitle();
    super.show();
    this._resize();
    
    if (!this._canvasMouseMoveHandler) {
      this._canvasMouseMoveHandler = MA.bind(this._onCanvasMouseMove, this);
      MA.DOM.on(this._map.map.getCanvas(), "mousemove", this._canvasMouseMoveHandler);
    }
    this._map.map.getCanvasContainer().style.cursor = "default";
  }
  _onCanvasMouseMove(e) {
    var pos = this._map.drawManager.drawer._pagePosToCanvasPos(e);
    var point = this._map.map.unproject(pos);
    var distance = this.getPointDistance(point)
    if(distance>=0) {
      this._map.map.getCanvasContainer().style.cursor = "pointer";
      this._updateTooltip(distance);
      if (this._graph) this._graph.setDistanceLine(distance);
    } else {
      this._map.map.getCanvasContainer().style.cursor = "default";
      if ( this._map.drawManager.drawer._toolTip ) this._map.drawManager.drawer._toolTip.hide();
      if (this._graph) this._graph.setDistanceLine(null);
    }
  }
  getPointDistance(point) {
    var len = this._map.drawManager.drawer._latlngs.length;
    var dists=[]
    for (var i = 0; i < len-1; i++) {
      var ll1 = this._map.drawManager.drawer._latlngs[i];
      var ll2 = this._map.drawManager.drawer._latlngs[i + 1];
      var distAll = Number(GSI.Utils.DistanceCalculator.calc(ll1, ll2).toFixed(0));
      var dist1 = Number(GSI.Utils.DistanceCalculator.calc(ll1, point).toFixed(0));
      var dist2 = Number(GSI.Utils.DistanceCalculator.calc(point, ll2).toFixed(0));
      
      if((dist1 + dist2) == distAll) {
        var totalDistance = 0;
        var len2 = dists.length;
        for(let j=0;j<len2;j++) {
          totalDistance += dists[j];
        }
        return totalDistance+dist1;
      }
      dists.push(distAll);
    }
    return -1;
  }
  
  _updateTooltip(distance) {
    if ( !this._map.drawManager.drawer._toolTip ) this._map.drawManager.drawer._toolTip = new GSIBV.Map.Draw.Tooltip(this._map, true);
    this._map.drawManager.drawer._toolTip.distanceCalculator = undefined;
    
    var text = "";
    if(distance>=1000) {
      text = (distance /1000).toFixed(2) + " km";
    } else {
      text = distance + " m";
    }
    this._map.drawManager.drawer._toolTip.message = "始点からの距離:" +  text;
    this._map.drawManager.drawer._toolTip.show();
  }


  _refresh() {
    if (this._graphFrame) this._graphFrame.empty();

    if (this.container) this.container.empty();
    this._create();
    
    this._graphFrame.empty().append(this._graph.getGraphElement());

    this._scaleSliderContainer.slider("value", 200);

    if (this._graph.getMinMode() == GSIBV.UI.Dialog.CrossSectionViewGraph.MINMODE_0) {
      this._0mSelectRadio[0].checked = true;
    } else {
      this._lowSelectRadio[0].checked = true;
    }

    var ratio = this._graph.getRatio();
    this._ratioVertInput.val(ratio.vert).data({ "vert": ratio.vert });
    //this._ratioHorzInput.val(ratio.horz).data({"horz":ratio.horz});

    this._refreshTitle();

  }



  _resize() {
    if(this._graph && this._graph._canvas) {
      if(this._graph._canvas.height >= 400) {
        this._container.parentElement.style.height = '550px'
      } else {
        this._container.parentElement.style.height = (this._graph._canvas.height + 155) + 'px';
      }
    }
  }


  // ダイアログの中身生成
  _create() {
    super._create();

    if (this._contentsInner) {
      return;
    }

    this._createContent();
    this._contents.appendChild(this.frame[0]);

    this._contentsInner = this.frame[0];
  }

  
  _refreshTitle() {
    var list = GSIBV.application._danmenDialog._useDEMTileList;
    var text = "";
    if (list) {
      for (var i = 0; i < list.length; i++) {
        text += (text != "" ? "," : "")
          + list[i];
      }
    } else {
      text = "DEM5A,DEM5B,DEM5C,DEM10B,DEMGM";
    }
    this._titleContainer.innerHTML = "データ:" + text
  }


  afterShow() {
    this._dragEnd();
    this._graph.getGraphElement().click();
  }
  _dragEnd(e, ui) {
    this._graphFrame.css({ "height": "auto" });
    this.contentFrame.css({ "height": "auto" });
    this.container.css({ "height": "auto" });
    GSI.Dialog.prototype._dragEnd.call(this, e, ui);
  }

  hide() {

    if (this._ratioVertInputCheckTimerId) clearTimeout(this._ratioVertInputCheckTimerId);
    this._ratioVertInputCheckTimerId = null;

    this._saveTypeSelect.hide();
    
    if (this._canvasMouseMoveHandler) {
      MA.DOM.off(this._map.map.getCanvas(), "mousemove", this._canvasMouseMoveHandler);
      this._canvasMouseMoveHandler = undefined;
    }
    if(this._map.drawManager.drawer._toolTip) this._map.drawManager.drawer._toolTip.destroy();
    this._map.drawManager.drawer._toolTip = undefined;
    super.hide();
  }
  
  _createHeader(headerContainer) {
    this._titleContainer = MA.DOM.create("div");
    this._titleContainer.innerHTML = "断面図表示";
    headerContainer.appendChild(this._titleContainer);
    super._createHeader(headerContainer);
  }
  _createContent() {
    this.frame = $('<div>').addClass("gsi_crosssectionview_displaygraph_content").css({ "position": "relative", "margin-top": "0" });

    this._headerControlFrame = this._createHeaderControls();
    this.frame.append(this._headerControlFrame);


    this._graphFrame = $("<div>").addClass("graphframe").css({ "position": "relative" });

    this.frame.append(this._graphFrame);

    this._controlFrame = $("<div>");

    var table = $("<table>").css({ "width": "100%" });
    var tr = $("<tr>");
    var td = null;

    td = $("<td>").attr({ "colspan": 3, "width": "100%" });
    td.css({ "font-size": "9pt", "padding-left": "8px", "padding-right": "8px" }).html("指定した点の位置や点数に関わらず、始点～終点間を300等分した各点の標高値よりグラフを作成しています");

    tr.append(td);
    table.append(tr);

    tr = $("<tr>");


    td = $("<td>").css({ "width": "100%" });

    this._resetButton = $("<a>").addClass("normalbutton")
      .attr({
        "href": "javascript:void(0);"
      }).html("初期状態に戻す");

    this._resetButton.on("click", MA.bind(function () {
      this.reset();
    }, this));

    td.append(this._resetButton);
    tr.append(td);


    td = $("<td>");
    this._saveImageButton = $("<a>").addClass("normalbutton").attr({ "href": "javascript:void(0);" }).html("グラフを保存");
    td.append(this._saveImageButton);
    tr.append(td);


    this._saveGraphTypeSelect = $("<div>").addClass("savetypeselect").css({ "position": "absolute", "right": "2px", "bottom": "30px" }).hide();

    var a = $("<a>").attr({ "href": "javascript:void(0);" }).html("PNG形式で保存");
    if (GSIBV.CONFIG.TOOLTIP && GSIBV.CONFIG.TOOLTIP.DANMEN) {
      a.attr({ "title": GSIBV.CONFIG.TOOLTIP.DANMEN.SAVE_IMAGE });
    }
    a.on("click", MA.bind(this._onSaveImageButtonClick, this));
    this._saveGraphTypeSelect.append(a);
    this.frame.append(this._saveGraphTypeSelect);


    a = $("<a>").attr({ "href": "javascript:void(0);" }).html("CSV形式で保存");
    if (GSIBV.CONFIG.TOOLTIP && GSIBV.CONFIG.TOOLTIP.DANMEN) {
      a.attr({ "title": GSIBV.CONFIG.TOOLTIP.DANMEN.SAVE_CSV });
    }
    a.on("click", MA.bind(this._onSaveCSVDataButtonClick, this));
    this._saveGraphTypeSelect.append(a);

    td = $("<td>");
    this._saveVectorDataButton = $("<a>").addClass("normalbutton").attr({ "href": "javascript:void(0);" }).html("経路を保存");
    td.append(this._saveVectorDataButton);
    tr.append(td);


    table.append(tr);

    table.append(this._controlFrame);

    this.frame.append(table);

    this._saveTypeSelect = $("<div>").addClass("savetypeselect").css({ "position": "absolute", "right": "2px", "bottom": "30px" }).hide();

    a = $("<a>").attr({ "href": "javascript:void(0);" }).html("GeoJSON形式で保存");
    if (GSIBV.CONFIG.TOOLTIP && GSIBV.CONFIG.TOOLTIP.DANMEN) {
      a.attr({ "title": GSIBV.CONFIG.TOOLTIP.DANMEN.SAVE_GEOJSON });
    }
    a.on("click", MA.bind(this._onSaveGeoJSONVectorDataButtonClick, this));
    this._saveTypeSelect.append(a);
    this.frame.append(this._saveTypeSelect);
    a = $("<a>").attr({ "href": "javascript:void(0);" }).html("KML形式で保存");
    if (GSIBV.CONFIG.TOOLTIP && GSIBV.CONFIG.TOOLTIP.DANMEN) {
      a.attr({ "title": GSIBV.CONFIG.TOOLTIP.DANMEN.SAVE_KML });
    }
    a.on("click", MA.bind(this._onSaveKMLVectorDataButtonClick, this));
    this._saveTypeSelect.append(a);
    a = $("<a>").attr({ "href": "javascript:void(0);" }).html("CSV形式で保存");
    a.on("click", MA.bind(this._onSaveCSVDataButtonClick, this));
    //this._saveTypeSelect.append ( a );


    //this._saveDataButton.on("click", MA.bind( this._onSaveDataButtonClick, this ) );
    this._saveImageButton.on("click", MA.bind(this._onSaveGraphButtonClick, this));
    this._saveVectorDataButton.on("click", MA.bind(this._onSaveVectorDataButtonClick, this));


    if (GSIBV.CONFIG.TOOLTIP && GSIBV.CONFIG.TOOLTIP.DANMEN) {
      this._resetButton.attr({ "title": GSIBV.CONFIG.TOOLTIP.DANMEN.RESET });
    }



    return this.frame;
  }

  // 縦横比、最低標高些<->0m
  _createHeaderControls() {
    var container = $("<div>");

    container.append(this._crateRatioInput());
    container.append(this._createMinmodeSelect());

    container.append(this._createHeightSlider());
    return container;
  }

  _createHeightSlider() {
    var container = $("<div>").css({ "clear": "both", "padding": "3px 8px 0 3px" });

    var table = $("<table>").css({ "width": "100%", "border-spacing": "0", "table-collapse": "collapse" });
    var tr = $("<tr>");
    var td = $("<td>").html("縦軸の長さ").css({ "white-space": "nowrap", "width": "1px" });

    tr.append(td);
    this._scaleSliderContainer = $("<div>");

    var onChnage = MA.bind(function (event, ui) {
      //ui.value 
      if (event.type == "slidechange") return;
      var ratio = this._graph.getDefaultRatio();

      var ratioVert = 1;
      if (ui.value <= 200) {
        ratioVert = Math.round(ratio.vert * (ui.value / 200));
      } else {
        ratioVert = ratio.vert + Math.round(ratio.vert * ((ui.value - 200) / 200));

      }

      if (ratioVert < 1) ratioVert = 1;
      this._ratioVertInput.val(ratioVert);
      this._refreshRatio();

    }, this);

    this._scaleSliderContainer.slider(
      {
        range: "min", min: 0, max: 1000, step: 1, value: 1,
        "slide": onChnage,
        "change": onChnage
      }
    );

    td = $("<td>");
    td.append(this._scaleSliderContainer);
    tr.append(td);
    table.append(tr);
    container.append(table);
    return container;
  }

  _crateRatioInput() {

    var container = $("<div>").addClass("gsi_crosssectionview_graph_ratio");



    var caption = $("<span>").html("縦横比").css({ "margin-right": "4px" });
    container.append(caption);

    this._ratioVertInput = $("<input>").attr({
      "type": "number", "min": 1
    }).val(1).data({ "vert": 1 });
    container.append(this._ratioVertInput);

    container.append($("<span>").html(":").css({ "margin-left": "2px", "margin-right": "2px" }));

    container.append($("<span>").html("1"));

    this._ratioResetButton = $("<a>").attr({ "href": "javascript:void(0);" }).html("等倍に戻す").addClass("normalbutton");
    container.append(this._ratioResetButton);

    this._ratioResetButton.click(MA.bind(function () {
      this._ratioVertInput.val(1).data({ "vert": 1 });
      this._scaleSliderContainer.slider("value", 0);
      //this._ratioHorzInput.val(1).data({"horz":1});
      this._refreshRatio();
    }, this));

    this._ratioVertInput.on("focus", function () {
      setTimeout(MA.bind(function () {
        this.select();
      }, this), 1);
    });

    this._ratioVertInput.on("blur", MA.bind(function () {

      if (this._ratioVertInputCheckTimerId) clearTimeout(this._ratioVertInputCheckTimerId);
      this._ratioVertInputCheckTimerId = null;

      this._refreshRatio();
    }, this));


    this._ratioVertInput.on("focus", MA.bind(function () {

      if (this._ratioVertInputCheckTimerId) clearTimeout(this._ratioVertInputCheckTimerId);
      this._ratioVertInputCheckTimerId = setInterval(MA.bind(function () {

        var reg = new RegExp(/^[0-9]*$/);
        var vert = this._ratioVertInput.val();
        if (reg.test(vert)) {
          vert = parseInt(vert);
          if (vert > 0) {
            var sliderValue = 1;

            var ratio = this._graph.getDefaultRatio();
            if (vert <= ratio.vert) {
              sliderValue = Math.round(200 * (vert / ratio.vert));
            } else {
              sliderValue = Math.round(200 * (vert / ratio.vert));
            }
            this._scaleSliderContainer.slider("value", sliderValue);
            this._refreshRatio();
            return;
          }
        }

        if (this._ratioVertInput.val() != "") {
          var ratio = this._graph.getRatio();
          this._ratioVertInput.val(ratio.vert);
        }

      }, this), 100);
    }, this));


    if (GSIBV.CONFIG.TOOLTIP && GSIBV.CONFIG.TOOLTIP.DANMEN) {
      this._ratioResetButton.attr({ "title": GSIBV.CONFIG.TOOLTIP.DANMEN.FLAT });
    }

    return container;
  }

  reset() {
    this._scaleSliderContainer.slider("value", 200);
    this._lowSelectRadio[0].checked = true;

    this._graph.reset();
    var ratio = this._graph.getRatio();
    this._ratioVertInput.val(ratio.vert).data({ "vert": ratio.vert });
    //this._ratioHorzInput.val(ratio.horz).data({"horz":ratio.horz});
    
    this._resize();
  }


  _refreshRatio() {
    if (!this._graph) return;

    var reg = new RegExp(/^[0-9]*$/);
    var err = false;

    var vert = this._ratioVertInput.val();
    err = false;
    if (reg.test(vert)) {
      vert = parseInt(vert);
      if (vert > 0) {
        this._ratioVertInput.data({ "vert": vert });
      } else {
        err = true;
      }
    } else {
      err = true;
    }
    if (err) this._ratioVertInput.val(this._ratioVertInput.data("vert"));

    var ratio = {
      vert: this._ratioVertInput.data("vert"),
      horz: 1 //this._ratioHorzInput.data("horz")
    };
    this._graph.setRatio(ratio);
    this._resize();
  }


  _createMinmodeSelect() {
    var container = $("<div>").addClass("gsi_crosssectionview_graph_minmode");


    var caption = $("<span>").html("縦軸メモリ").css({ "margin-right": "4px" });
    container.append(caption);
    this._0mSelectRadio = $("<input>").attr({
      "id": "gsi_crosssectionview_graph_min_0m",
      "name": "gsi_crosssectionview_graph_min",
      "type": "radio"
    }).addClass("normalcheck");
    var label = $("<label>").attr({ "for": "gsi_crosssectionview_graph_min_0m" }).html("0m");
    container.append(this._0mSelectRadio).append(label);

    if (GSIBV.CONFIG.TOOLTIP && GSIBV.CONFIG.TOOLTIP.DANMEN) {
      this._0mSelectRadio.attr({ "title": GSIBV.CONFIG.TOOLTIP.DANMEN.BASE_0 });
      label.attr({ "title": GSIBV.CONFIG.TOOLTIP.DANMEN.BASE_0 });
    }

    this._lowSelectRadio = $("<input>").attr({
      "id": "gsi_crosssectionview_graph_min_low",
      "name": "gsi_crosssectionview_graph_min",
      "type": "radio"
    }).addClass("normalcheck");
    label = $("<label>").attr({ "for": "gsi_crosssectionview_graph_min_low" }).html("最低標高");

    if (GSIBV.CONFIG.TOOLTIP && GSIBV.CONFIG.TOOLTIP.DANMEN) {
      this._lowSelectRadio.attr({ "title": GSIBV.CONFIG.TOOLTIP.DANMEN.BASE_LO });
      label.attr({ "title": GSIBV.CONFIG.TOOLTIP.DANMEN.BASE_LO });
    }


    this._0mSelectRadio.on("click", MA.bind(function () {
      this._graph.setMinMode(GSIBV.UI.Dialog.CrossSectionViewGraph.MINMODE_0);
      this._resize();
    }, this));
    this._lowSelectRadio.on("click", MA.bind(function () {
      this._graph.setMinMode(GSIBV.UI.Dialog.CrossSectionViewGraph.MINMODE_LOW);
      this._resize();
    }, this));

    container.append(this._lowSelectRadio).append(label);
    return container;
  }


  // テキストデータを保存
  _saveText(txt, fileName) {
    MA.saveFile(fileName,"text/plain", txt);

  }
  // 画像データ保存
  _saveImage(canvas, fileName) {
    var createImage = function (base64, mime) {
      var tmp = base64.split(',');
      var data = atob(tmp[1]);
      var mime = tmp[0].split(':')[1].split(';')[0];
      var buf = new Uint8Array(data.length);
      for (var i = 0; i < data.length; i++) {
        buf[i] = data.charCodeAt(i);
      }
      var blob = new Blob([buf], { type: mime });
      return blob;
    };

    var data = canvas.toDataURL("image/png");
    var blob = null;
    blob = createImage(data, "image/png");

    GSI.Utils.saveFile("image/png", fileName, blob);

  }

  _onSaveDataButtonClick() {
    if ( !this._saveCsvDialog) {
      this._saveCsvDialog = new GSIBV.UI.Dialog.SaveFileDialog(
        "CSV形式で保存", GSIBV.UI.Dialog.SaveFileDialog.FILE_TEXT);
    }
    this._saveCsvDialog.show('csdata' + this.getTimeStampString() + ".csv",this._graph.getTextData());
  }
  _onSaveImageButtonClick() {
    if ( !this._saveImageDialog) {
      this._saveImageDialog = new GSIBV.UI.Dialog.SaveFileDialog(
        "PNG形式で保存", GSIBV.UI.Dialog.SaveFileDialog.FILE_IMAGE);
    }
    this._saveImageDialog.show('cs' + this.getTimeStampString() + ".png",this._graph.getGraphElement());
  }

  _onSaveGraphButtonClick() {
    //this._saveImage( this._graph.getGraphElement(), 'cs' + this.getTimeStampString() + ".png" );

    this._saveGraphTypeSelect.css({
      "right": (this._saveVectorDataButton.outerWidth() + 6) + "px"
    });

    this._saveGraphTypeSelect.slideDown(300);
    if (!this._hideHandler) this._hideHandler = MA.bind(this._onBodyMousedown, this);
    $("body").off("mousedown", this._hideHandler).on('mousedown', this._hideHandler);
  }

  _onSaveVectorDataButtonClick() {
    this._saveTypeSelect.slideDown(300);

    if (!this._hideHandler) this._hideHandler = MA.bind(this._onBodyMousedown, this);

    $("body").off("mousedown", this._hideHandler).on('mousedown', this._hideHandler);
  }


  // どこかクリックされたら保存タイプ選択リストを非表示
  _onBodyMousedown(e) {
    if (this._saveTypeSelect[0] != e.target
      && this._saveTypeSelect.find(e.target).length <= 0) {
      this._saveTypeSelect.slideUp(300);
    }

    if (this._saveGraphTypeSelect[0] != e.target
      && this._saveGraphTypeSelect.find(e.target).length <= 0) {
      this._saveGraphTypeSelect.slideUp(300);

    }
  }
  
  _onSaveGeoJSONVectorDataButtonClick() {
    console.log("saveGeoJSON");
    this._saveTypeSelect.slideUp();
    var data = this._map.drawManager._drawer._latlngs;
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

    geojson.features[0]["geometry"]["coordinates"] = coords;

    geojson = JSON.stringify(geojson, null, 2);

    if ( !this._saveGeojsonDialog) {
      this._saveGeojsonDialog = new GSIBV.UI.Dialog.SaveFileDialog(
        "GeoJSON形式で保存", GSIBV.UI.Dialog.SaveFileDialog.FILE_TEXT);
    }
    this._saveGeojsonDialog.show('csline' + this.getTimeStampString() + ".geojson",geojson);

  }

  _onSaveKMLVectorDataButtonClick() {
    console.log("saveKML");
    this._saveTypeSelect.slideUp();
    var data = this._map.drawManager._drawer._latlngs;
    if (!data) return;
    var kml = "";

    var coords = '';

    for (var i = 0; i < data.length; i++) {
      if (coords != "") coords += " ";
      coords += data[i].lng + "," + data[i].lat;
    }

    coords = "<coordinates>" + coords + "</coordinates>";

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

    if ( !this._saveKmlDialog) {
      this._saveKmlDialog = new GSIBV.UI.Dialog.SaveFileDialog(
        "KML形式で保存", GSIBV.UI.Dialog.SaveFileDialog.FILE_TEXT);
    }
    this._saveKmlDialog.show('csline' + this.getTimeStampString() + ".kml",kml);
  }

  _onSaveCSVDataButtonClick() {
    this._saveTypeSelect.slideUp();
    if ( !this._saveCsvDialog) {
      this._saveCsvDialog = new GSIBV.UI.Dialog.SaveFileDialog(
        "CSV形式で保存", GSIBV.UI.Dialog.SaveFileDialog.FILE_TEXT);
    }
    this._saveCsvDialog.show('csdata' + this.getTimeStampString() + ".csv",this._graph.getTextData());

  }

  getTimeStampString() {
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

};



