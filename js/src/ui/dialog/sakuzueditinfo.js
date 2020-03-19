GSIBV.UI.Dialog.SakuzuEditInfoDialog = class extends GSIBV.UI.Dialog.Modeless {

  constructor(feature, options) {
    super(options);
    this._feature = feature;
    this._size.width = 280;
    this._size.height = 150;

    var dialogManager = GSIBV.UI.Dialog.Modeless.Manager.get();
    var frameSize = MA.DOM.size( dialogManager.frame );

    this._position = {left: Math.floor( (frameSize.width-this._size.width) / 2 ),top:39};
    
    this._resizable = false;

    this._originalGeoJSON = this._feature.toGeoJSON();

    this._buttons = [
      { "id": "ok", "title": "OK" },
      { "id": "cancel", "title": "キャンセル" }
    ];
  }
  
  destroy() {
    if ( this._panel ) {
      this._panel.destroy();
      this._panel = undefined;
    }
  }
  ok() {
    this._onButtonClick(this._buttons[0]);
  }

  cancel() {
    this._onButtonClick(this._buttons[1]);
  }

  show() {
    
    super.show();
  }
  
  _beforeShow() {
    var frameSize = this.size;
    var size = this._getContentsSize();
    this._frame.style.height = (frameSize.height + size.height + 6) + "px";
  }

  _createHeader(headerContainer) {
    this._titleContainer = MA.DOM.create("div");
    this._titleContainer.innerHTML = "作図情報の編集";
    headerContainer.appendChild(this._titleContainer);
    super._createHeader(headerContainer);
    this._closeButton.style.display = "none";

  }
  _createContents(contentsContainer) {


    var panel = null;
    
    switch( this._feature.geometryType ) {
      case GSIBV.Map.Draw.Line.Type:
        panel = new GSIBV.UI.Dialog.SakuzuEditInfoDialog.LineEditPanel(this._feature, contentsContainer);
        break;
      case GSIBV.Map.Draw.Polygon.Type:
      case GSIBV.Map.Draw.MultiPolygon.Type:
        panel = new GSIBV.UI.Dialog.SakuzuEditInfoDialog.PolygonEditPanel(this._feature, contentsContainer);
        break;
      case GSIBV.Map.Draw.Marker.Type:
        if ( this._feature.markerType == GSIBV.Map.Draw.Marker.MarkerType) {
          panel = new GSIBV.UI.Dialog.SakuzuEditInfoDialog.MarkerEditPanel(this._feature, contentsContainer);
        } else if ( this._feature.markerType == GSIBV.Map.Draw.Circle.MarkerType) {
          panel = new GSIBV.UI.Dialog.SakuzuEditInfoDialog.CircleEditPanel(this._feature, contentsContainer);
        } else if ( this._feature.markerType == GSIBV.Map.Draw.CircleMarker.MarkerType) {
          panel = new GSIBV.UI.Dialog.SakuzuEditInfoDialog.CircleMarkerEditPanel(this._feature, contentsContainer);
        } else if ( this._feature.markerType == GSIBV.Map.Draw.DivMarker.MarkerType) {
          panel = new GSIBV.UI.Dialog.SakuzuEditInfoDialog.DivMarkerEditPanel(this._feature, contentsContainer);
        }
        break;
    }
    if ( panel ) panel.show();
    this._panel = panel;
  }

  _onButtonClick(btnInfo) {
    if ( btnInfo.id == "ok") {
      if ( this._panel) this._panel._refreshLayer();
    } else {
      this._feature.setJSON(this._originalGeoJSON);
      this._feature.update();
    }
    
    super._onButtonClick(btnInfo);
  }

};


/***************************************
    GSIBV.UI.Dialog.SakuzuEditInfoDialog.FeatureEditPanel
    情報編集
***************************************/
GSIBV.UI.Dialog.SakuzuEditInfoDialog.FeatureEditPanel = class extends GSIBV.UI.Base {

  constructor(feature, parentContainer) {
    super();
    this._feature = feature;
    this._parentContainer = parentContainer;
  }

  get feature() {
    return this._feature;
  }

  destroy () {
    if ( this._colorPicker) {
      this._colorPicker.destroy();
      this._colorPicker = undefined;
    }

    if ( this._textColorPicker) {
      this._textColorPicker.destroy();
      this._textColorPicker = undefined;
    }
    
    if ( this._container) {
      this._parentContainer.removeChild( this._container);
      this._container = undefined;
    }
  }
  show() {
    this.initialize();
    this._container.style.display="";
    this._reset();
  }

  hide() {
    if ( !this._container) return;
    MA.DOM.fadeOut( this._container, 300);

  }

  _reset() {
    this._titleInput.value = this._feature.title ? this._feature.title : "";
  }

  
  _refreshLayer() {
    this._feature.title = this._titleInput.value == "" ? undefined : this._titleInput.value;
  }

  initialize() {
    if ( this._container) return;

    this._container = this._createPanel();

    this._parentContainer.appendChild( this._container );
  }

  
  _createPanel() {
    var container = MA.DOM.create("div");
    MA.DOM.addClass(container,"draw-edit-panel" );
    this._tableInfo = this._createTable();

    // タイトル入力
    var tr = this._crateTr(this._tableInfo.tbody);

    this._titleInput = MA.DOM.create("input");
    MA.DOM.addClass(this._titleInput, "title");

    this._titleInput.setAttribute("type","text");
    tr.th.innerHTML = "名称";
    tr.td.appendChild( this._titleInput);
    return container;

  }

  _createTable() {
    
    var table = MA.DOM.create("table");
    var tbody = MA.DOM.create("tbody");
    
    table.appendChild( tbody );

    return {
      table:table,
      tbody:tbody
    };
  }
  _crateTr(tbody) {
    var tr = MA.DOM.create("tr");
    var th = MA.DOM.create("th");
    var td = MA.DOM.create("td");

    tr.appendChild( th );
    tr.appendChild( td );
    tbody.appendChild( tr );
    return {
      tr:tr,
      th:th,
      td:td
    };
  }

  _createSelect( list ) {
    
    var select = MA.DOM.create("select");
    for( var i=0; i<list.length; i++ ) {
      var option = MA.DOM.create("option");
      option.innerHTML = list[i].caption;
      option.setAttribute("value", list[i].value);
      select.appendChild( option );
    }

    return select;
  }

};



/***************************************
    GSIBV.UI.Dialog.SakuzuEditInfoDialog.LineEditPanel
    作図パネル管理
***************************************/
GSIBV.UI.Dialog.SakuzuEditInfoDialog.LineEditPanel = class extends GSIBV.UI.Dialog.SakuzuEditInfoDialog.FeatureEditPanel {

  
  constructor(feature, layer, parentContainer) {
    super(feature, layer, parentContainer);
  }

  _reset() {
    super._reset();
    this._weightSelect.value = this._feature.style.weight + "";
    this._lineColorPanel._color= MA.Color.parse(this._feature.style.color);
    this._lineColorPanel._color.a = this._feature.style.opacity;
    this._lineColorPanel.style.backgroundColor = MA.Color.toString( this._lineColorPanel._color );

    if ( !this._withOutDashArray ) {
      var weight = this._feature.style.weight;
      if ( this._feature.style.dashArray == undefined)
        this._linePatternSelect.value = "normal";
      else {
        var dashArray = this._feature.style.dashArray;
        if ( dashArray.length == 2 ) {
          if ( dashArray[0] == 1 && dashArray[1] == weight *2 ) {
            this._linePatternSelect.value = "dot";
          } else {
            this._linePatternSelect.value = "dash";
          }
        } else {
          this._linePatternSelect.value = "dash";
        }
      }
    }

  }
  
  _refreshLayer() {
    super._refreshLayer();
    if ( this._weightSelect.selectedIndex >= 0)
      this._feature.style.weight = parseInt(this._weightSelect.value);
    this._feature.style.color = MA.Color.toHTMLHex( this._lineColorPanel._color );
    this._feature.style.opacity = this._lineColorPanel._color.a;

    if ( !this._withOutDashArray ) {
      if ( this._linePatternSelect.selectedIndex >= 0) {
        var weight = this._feature.style.weight;
        switch( this._linePatternSelect.value ) {
          case "dash":
            this._feature.style.dashArray = [weight*4, weight*2];
            break;
          case "dot":
            this._feature.style.dashArray = [1, weight*2];
            break;
          case "normal":
            this._feature.style.dashArray = undefined;
            break;
        }
      }
    }


    this._feature.update();
  }

  _createPanel() {
    var container = super._createPanel();

    var table = this._tableInfo;
    var tr = null;
    // 線幅
    tr = this._crateTr(table.tbody);
    tr.th.innerHTML = "線の幅";
    this._weightSelect = this._createSelect([
      { caption:"1px", value : "1" },
      { caption:"3px", value : "3" },
      { caption:"5px", value : "5" },
      { caption:"10px", value : "10" },
      { caption:"15px", value : "15" },
      { caption:"25px", value : "25" }
    ]);
    MA.DOM.on(this._weightSelect,"change", MA.bind(function(){
      this._refreshLayer();
    },this));
    tr.td.appendChild( this._weightSelect );


    // 線の色
    tr = this._crateTr(table.tbody);
    tr.th.innerHTML = "線の色";
    var colorPanel = MA.DOM.create("div");
    MA.DOM.addClass( colorPanel, "color-panel");
    tr.td.appendChild( colorPanel);
    
    var colorPanelInner = MA.DOM.create("div");
    MA.DOM.addClass(colorPanelInner, "inner" );

    colorPanel.appendChild(colorPanelInner);
    this._lineColorPanel = colorPanelInner;

    MA.DOM.on(this._lineColorPanel,"click", MA.bind(function(target){
      if ( !this._colorPicker) {
        this._colorPicker = new GSIBV.UI.ColorPicker();
        this._colorPicker.zIndex = 50000;
        this._colorPicker.on("change",MA.bind(function(evt){
          //this._colorPicker._currentTarget._color = ;
          var color = evt.params.color;
          if ( color ) {
            MA.DOM.removeClass( this._colorPicker._currentTarget, "transparent");
            this._colorPicker._currentTarget._color = MA.Color.fix(color.getRGB());
            this._colorPicker._currentTarget.style.backgroundColor =MA.Color.toString( this._colorPicker._currentTarget._color );
          } else {
            this._colorPicker._currentTarget._color =null;
            this._colorPicker._currentTarget.style.backgroundColor ="transparent";
            MA.DOM.addClass( this._colorPicker._currentTarget, "transparent");
          }
          this._refreshLayer();
        },this));
      }
      this._colorPicker._currentTarget = target;
      this._colorPicker.show(target, target._color);
    },this,this._lineColorPanel));

    // 線の種類
    if ( !this._withOutDashArray ) {
      tr = this._crateTr(table.tbody);
      tr.th.innerHTML = "線の種類";
      
      this._linePatternSelect = this._createSelect([
        { caption:"実線", value : "normal" },
        { caption:"破線", value : "dash" },
        { caption:"点線", value : "dot" }
      ]);
      
      MA.DOM.on(this._linePatternSelect,"change", MA.bind(function(){
        this._refreshLayer();
      },this));

      tr.td.appendChild( this._linePatternSelect );
    }

    container.appendChild( table.table );
    return container;

  }


};




/***************************************
    GSIBV.UI.Dialog.SakuzuEditInfoDialog.PolygonEditPanel
    作図パネル管理
***************************************/
GSIBV.UI.Dialog.SakuzuEditInfoDialog.PolygonEditPanel = class extends GSIBV.UI.Dialog.SakuzuEditInfoDialog.LineEditPanel {
  
  constructor(feature, layer, parentContainer) {
    super(feature, layer, parentContainer);
  }

  
  _reset() {
    super._reset();
    this._fillColorPanel._color= MA.Color.parse(this._feature.style.fillColor);
    this._fillColorPanel._color.a = this._feature.style.fillOpacity;
    this._fillColorPanel.style.backgroundColor = MA.Color.toString( this._fillColorPanel._color );
  }
  
  _refreshLayer() {
    this._feature.style.fillColor = MA.Color.toHTMLHex( this._fillColorPanel._color );
    this._feature.style.fillOpacity = this._fillColorPanel._color.a;
    super._refreshLayer();
    

  }

  _createPanel() {
    var container = super._createPanel();

    var table = this._tableInfo;
    var tr = null;

    // 塗色
    tr = this._crateTr(table.tbody);
    tr.th.innerHTML = "塗色";
    var colorPanel = MA.DOM.create("div");
    MA.DOM.addClass( colorPanel, "color-panel");
    tr.td.appendChild( colorPanel);
    
    var colorPanelInner = MA.DOM.create("div");
    MA.DOM.addClass(colorPanelInner, "inner" );

    colorPanel.appendChild(colorPanelInner);
    this._fillColorPanel = colorPanelInner;

    MA.DOM.on(this._fillColorPanel,"click", MA.bind(function(target){
      if ( !this._colorPicker) {
        this._colorPicker = new GSIBV.UI.ColorPicker();
        this._colorPicker.zIndex = 50000;
        this._colorPicker.on("change",MA.bind(function(evt){
          //this._colorPicker._currentTarget._color = ;
          var color = evt.params.color;
          if ( color ) {
            MA.DOM.removeClass( this._colorPicker._currentTarget, "transparent");
            this._colorPicker._currentTarget._color = MA.Color.fix(color.getRGB());
            this._colorPicker._currentTarget.style.backgroundColor =MA.Color.toString( this._colorPicker._currentTarget._color );
          } else {
            this._colorPicker._currentTarget._color =null;
            this._colorPicker._currentTarget.style.backgroundColor ="transparent";
            MA.DOM.addClass( this._colorPicker._currentTarget, "transparent");
          }
          this._refreshLayer();
        },this));
      }
      this._colorPicker._currentTarget = target;
      this._colorPicker.show(target, target._color);
    },this,this._fillColorPanel));
    
    container.appendChild( table.table );
    return container;
  }
};


/***************************************
    GSIBV.UI.Dialog.SakuzuEditInfoDialog.CircleEditPanel
    作図パネル管理
***************************************/
GSIBV.UI.Dialog.SakuzuEditInfoDialog.CircleEditPanel = class extends GSIBV.UI.Dialog.SakuzuEditInfoDialog.PolygonEditPanel {
  
  constructor(feature, layer, parentContainer) {
    super(feature, layer, parentContainer);
  }

  
  destroy () {
    if ( this._radiusInputTimer ) {
      clearInterval( this._radiusInputTimer );
      this._radiusInputTimer = undefined;
    }
    super.destroy();
  }
  _reset() {
    super._reset();
    //this._fillColorPanel._color= MA.Color.parse(this._feature.style.fillColor);
    //this._fillColorPanel._color.a = this._feature.style.fillOpacity;
    //this._fillColorPanel.style.backgroundColor = MA.Color.toString( this._fillColorPanel._color );

    var radius = this._feature.style.radius;

    if ( radius >= 1000 ) {
      this._radiusUnitSelect.value = "km";
    } else {
      this._radiusUnitSelect.value = "m";
    }
    this._resetRadius();
  }

  _resetRadius() {
    
    var radius = this._feature.style.radius;
    if ( this._radiusUnitSelect.value == "km" ) {
      this._radiusInput.value = Math.floor( ( radius / 1000 ) *10000 ) / 10000;
    } else {
      this._radiusInput.value = Math.floor( radius *10 ) / 10;
    }
  }
  
  _refreshLayer() {
    //this._feature.style.fillColor = MA.Color.toHTMLHex( this._fillColorPanel._color );
    //this._feature.style.fillOpacity = this._fillColorPanel._color.a;
    
    var radius = this._getInputRadius();
    if ( radius!=undefined) this._feature.style.radius = radius;

    super._refreshLayer();
    

  }

  _onRadiusInputFocus() {
    this._radiusInputTimer = setInterval( MA.bind(this._checkRadius, this ), 200 );
  }

  _onRadiusInputBlur () {
    
    var radius = this._getInputRadius();
    if ( radius == undefined) {
      this._resetRadius();
    } else {
      if ( this._feature.style.radius != radius ) {
        this._refreshLayer();
      }
    }

    if ( this._radiusInputTimer ) {
      clearInterval( this._radiusInputTimer );
      this._radiusInputTimer = undefined;
    }
  }


  _getInputRadius() {
    var radiusText = this._radiusInput.value;
    radiusText = radiusText.trim();
    
    radiusText = radiusText.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 65248);
    });
    radiusText = radiusText.replace(/[。．]/g, ".");

    var pattern = /^([1-9]\d*|0)(\.\d+)?$/;
    if ( pattern.test( radiusText )) {
      var radius = parseFloat( radiusText);
      
      if  ( this._radiusUnitSelect.value == "km" ) radius *= 1000;
      return radius;

    } else {
      return undefined;
    }
  }

  _checkRadius() {
    
    var radius = this._getInputRadius();
    if ( radius == undefined) return false;
    if ( this._feature.style.radius != radius ) {
      this._refreshLayer();
    }

  }

  _createPanel() {
    var container = super._createPanel();

    var table = this._tableInfo;
    var tr = null;
    
    // 半径
    tr = this._crateTr(table.tbody);
    tr.th.innerHTML = "半径";

    this._radiusInput = MA.DOM.create("input");
    this._radiusInput.setAttribute("type", "text");
    
    MA.DOM.on(this._radiusInput,"focus", MA.bind( this._onRadiusInputFocus,this));
    MA.DOM.on(this._radiusInput,"blur", MA.bind( this._onRadiusInputBlur,this));

    tr.td.appendChild(this._radiusInput);


    this._radiusUnitSelect = this._createSelect([
      { caption:"m", value : "m" },
      { caption:"km", value : "km" }
    ]);
    MA.DOM.on(this._radiusUnitSelect,"change", MA.bind( this._resetRadius,this));
    MA.DOM.addClass(this._radiusUnitSelect,"radius-unit");
    tr.td.appendChild(this._radiusUnitSelect);



    container.appendChild( table.table );
    return container;
  }

};


/***************************************
    GSIBV.UI.Dialog.SakuzuEditInfoDialog.CircleEditPanel
    作図パネル管理
***************************************/
GSIBV.UI.Dialog.SakuzuEditInfoDialog.CircleMarkerEditPanel = class extends GSIBV.UI.Dialog.SakuzuEditInfoDialog.PolygonEditPanel {
  
  constructor(feature, layer, parentContainer) {
    super(feature, layer, parentContainer);
    this._withOutDashArray = false;
  }

  destroy () {
    if ( this._radiusInputTimer ) {
      clearInterval( this._radiusInputTimer );
      this._radiusInputTimer = undefined;
    }
    super.destroy();
  }
  _reset() {
    super._reset();
    this._resetRadius();
  }

  _resetRadius() {
    
    var radius = this._feature.style.radius;
    this._radiusInput.value = Math.floor( radius );
  }
  
  _refreshLayer() {
    //this._feature.style.fillColor = MA.Color.toHTMLHex( this._fillColorPanel._color );
    //this._feature.style.fillOpacity = this._fillColorPanel._color.a;
    
    var radius = this._getInputRadius();
    if ( radius!=undefined) this._feature.style.radius = radius;

    super._refreshLayer();
    

  }

  _onRadiusInputFocus() {
    this._radiusInputTimer = setInterval( MA.bind(this._checkRadius, this ), 200 );
  }

  _onRadiusInputBlur () {
    
    var radius = this._getInputRadius();
    if ( radius == undefined) {
      this._resetRadius();
    } else {
      if ( this._feature.style.radius != radius ) {
        this._refreshLayer();
      }
    }

    if ( this._radiusInputTimer ) {
      clearInterval( this._radiusInputTimer );
      this._radiusInputTimer = undefined;
    }
  }


  _getInputRadius() {
    var radiusText = this._radiusInput.value;
    radiusText = radiusText.trim();
    
    radiusText = radiusText.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 65248);
    });

    var pattern = /^([1-9]\d*|0)$/;
    if ( pattern.test( radiusText )) {
      var radius = parseFloat( radiusText);
      return radius;

    } else {
      return undefined;
    }
  }

  _checkRadius() {
    
    var radius = this._getInputRadius();
    if ( radius == undefined) return false;
    if ( this._feature.style.radius != radius ) {
      this._refreshLayer();
    }

  }

  _createPanel() {
    var container = super._createPanel();

    var table = this._tableInfo;
    var tr = null;
    
    // 半径
    tr = this._crateTr(table.tbody);
    tr.th.innerHTML = "半径";

    this._radiusInput = MA.DOM.create("input");
    this._radiusInput.setAttribute("type", "text");
    
    MA.DOM.on(this._radiusInput,"focus", MA.bind( this._onRadiusInputFocus,this));
    MA.DOM.on(this._radiusInput,"blur", MA.bind( this._onRadiusInputBlur,this));

    tr.td.appendChild(this._radiusInput);

    var unitName = MA.DOM.create("span");
    unitName.innerHTML = "px";
    tr.td.appendChild(unitName);



    container.appendChild( table.table );
    return container;
  }
};




/***************************************
    GSIBV.UI.Dialog.SakuzuEditInfoDialog.DivMarkerEditPanel 
    作図パネル管理
***************************************/
GSIBV.UI.Dialog.SakuzuEditInfoDialog.DivMarkerEditPanel = class extends GSIBV.UI.Dialog.SakuzuEditInfoDialog.FeatureEditPanel {

  
  constructor(feature, layer, parentContainer) {
    super(feature, layer, parentContainer);
  }
  
  _reset() {
    super._reset();
    this._textArea.value = this._feature.style.text;

    this._textSizeSelect.value = this._feature.style.fontSize + "";

    if ( this._feature.style.color) {
      this._textColorPanel._color = MA.Color.parse(this._feature.style.color);
      this._textColorPanel.style.backgroundColor =MA.Color.toString( this._textColorPanel._color );
    
    } else {
      this._textColorPanel._color =null;
      this._textColorPanel.backgroundColor ="transparent";
    }

    
    if ( this._feature.style.backgroundColor) {
      this._backgroundColorPanel._color = MA.Color.parse(this._feature.style.backgroundColor);
      this._backgroundColorPanel.style.backgroundColor =MA.Color.toString( this._backgroundColorPanel._color );
    
    } else {
      this._backgroundColorPanel._color =null;
      this._backgroundColorPanel.backgroundColor ="transparent";
    }

    
    this._textBoldCheck.checked = ( this._feature.style.bold ? true : false );
    this._textItalicCheck.checked = ( this._feature.style.italic ? true : false );
    this._textUnderlineCheck.checked = ( this._feature.style.underLine ? true : false );


  }

  _refreshLayer() {
    super._refreshLayer();
    this._feature.style.text = this._textArea.value;

    if ( this._textSizeSelect.selectedIndex >= 0 ) {
      this._feature.style.fontSize = parseFloat(this._textSizeSelect.value );
    }

    if ( this._textColorPanel._color ) {
      this._feature.style.color = MA.Color.toString( this._textColorPanel._color );
    } else {
      this._feature.style.color = undefined;
    }

    if ( this._backgroundColorPanel._color ) {
      this._feature.style.backgroundColor = MA.Color.toString( this._backgroundColorPanel._color );
    } else {
      this._feature.style.backgroundColor = undefined;
    }

    this._feature.style.bold = this._textBoldCheck.checked;
    this._feature.style.italic = this._textItalicCheck.checked;
    this._feature.style.underLine = this._textUnderlineCheck.checked;

    
    this._feature.update();
  }

  _createPanel() {
    var container = super._createPanel();
    
    var table = this._tableInfo;
    var tr = null;

    // 文字列

    tr = this._crateTr(table.tbody);
    tr.th.innerHTML = "表示<br>文字列";

    this._textArea = MA.DOM.create("textarea");
    
    MA.DOM.on(this._textArea,"focus", MA.bind( this._onTextFocus,this));
    MA.DOM.on(this._textArea,"blur", MA.bind( this._onTextBlur,this));

    tr.td.appendChild(this._textArea);


    
    // サイズ
    tr = this._crateTr(table.tbody);
    tr.th.innerHTML = "サイズ";
    
    this._textSizeSelect = this._createSelect([
      { caption:"8", value : "8" },
      { caption:"9", value : "9" },
      { caption:"10", value : "10" },
      { caption:"11", value : "11" },
      { caption:"12", value : "12" },
      { caption:"15", value : "15" },
      { caption:"18", value : "18" },
      { caption:"19", value : "19" },
      { caption:"20", value : "20" },
      { caption:"24", value : "24" },
      { caption:"32", value : "32" },
      { caption:"48", value : "48" },
      { caption:"64", value : "64" },
      { caption:"92", value : "92" },
    ]);

    
    MA.DOM.on(this._textSizeSelect,"change", MA.bind(function(){
      this._refreshLayer();
    },this));

    tr.td.appendChild( this._textSizeSelect );



    // 文字の色
    tr = this._crateTr(table.tbody);
    tr.th.innerHTML = "文字色";
    var colorPanel = MA.DOM.create("div");
    MA.DOM.addClass( colorPanel, "color-panel");
    tr.td.appendChild( colorPanel);
    
    var colorPanelInner = MA.DOM.create("div");
    MA.DOM.addClass(colorPanelInner, "inner" );

    colorPanel.appendChild(colorPanelInner);
    this._textColorPanel = colorPanelInner;

    MA.DOM.on(this._textColorPanel,"click", MA.bind(function(target){
      if ( !this._textColorPicker) {
        this._textColorPicker = new GSIBV.UI.ColorPicker();
        this._textColorPicker.zIndex = 50000;
        this._textColorPicker.noAlpha = true;
        this._textColorPicker.useClearButton = true;
        this._textColorPicker.on("change",MA.bind(function(evt){
          //this._colorPicker._currentTarget._color = ;
          var color = evt.params.color;
          if ( color ) {
            MA.DOM.removeClass( this._textColorPicker._currentTarget, "transparent");
            this._textColorPicker._currentTarget._color = MA.Color.fix(color.getRGB());
            this._textColorPicker._currentTarget.style.backgroundColor =MA.Color.toString( this._textColorPicker._currentTarget._color );
          } else {
            this._textColorPicker._currentTarget._color =null;
            this._textColorPicker._currentTarget.style.backgroundColor ="transparent";
            MA.DOM.addClass( this._textColorPicker._currentTarget, "transparent");
          }
          this._refreshLayer();
        },this));
      }
      this._textColorPicker._currentTarget = target;
      this._textColorPicker.show(target, target._color);
    },this,this._textColorPanel));


    
    // 背景色
    tr = this._crateTr(table.tbody);
    tr.th.innerHTML = "背景色";
    var colorPanel = MA.DOM.create("div");
    MA.DOM.addClass( colorPanel, "color-panel");
    tr.td.appendChild( colorPanel);
    
    var colorPanelInner = MA.DOM.create("div");
    MA.DOM.addClass(colorPanelInner, "inner" );

    colorPanel.appendChild(colorPanelInner);
    this._backgroundColorPanel = colorPanelInner;

    MA.DOM.on(this._backgroundColorPanel,"click", MA.bind(function(target){
      if ( !this._textColorPicker) {
        this._textColorPicker = new GSIBV.UI.ColorPicker();
        this._textColorPicker.zIndex = 50000;
        this._textColorPicker.noAlpha = true;
        this._textColorPicker.useClearButton = true;
        this._textColorPicker.on("change",MA.bind(function(evt){
          //this._colorPicker._currentTarget._color = ;
          var color = evt.params.color;
          if ( color ) {
            MA.DOM.removeClass( this._textColorPicker._currentTarget, "transparent");
            this._textColorPicker._currentTarget._color = MA.Color.fix(color.getRGB());
            this._textColorPicker._currentTarget.style.backgroundColor =MA.Color.toString( this._textColorPicker._currentTarget._color );
          } else {
            this._textColorPicker._currentTarget._color =null;
            this._textColorPicker._currentTarget.style.backgroundColor ="transparent";
            MA.DOM.addClass( this._textColorPicker._currentTarget, "transparent");
          }
          this._refreshLayer();
        },this));
      }
      this._textColorPicker._currentTarget = target;
      this._textColorPicker.show(target, target._color);
    },this,this._backgroundColorPanel));




    {
      var tr = MA.DOM.create("tr");
      var td = MA.DOM.create("td");
      td.setAttribute("colspan",2);
      var id = "";

      //太字
      id = MA.getId("-gsibv-text-bold-");
      this._textBoldCheck = MA.DOM.create("input");
      MA.DOM.addClass(this._textBoldCheck, "normalcheck");
      this._textBoldCheck.setAttribute("type","checkbox");
      this._textBoldCheck.setAttribute("id",id);
      MA.DOM.on(this._textBoldCheck,"click",MA.bind(function(evt){
        this._refreshLayer();
      },this ) );

      var label = MA.DOM.create("label");
      label.innerHTML = "太字";
      label.setAttribute("for",id);

      td.appendChild( this._textBoldCheck );
      td.appendChild( label);


      //斜体
      id = MA.getId("-gsibv-text-italic-");
      this._textItalicCheck = MA.DOM.create("input");
      MA.DOM.addClass(this._textItalicCheck, "normalcheck");
      this._textItalicCheck.setAttribute("type","checkbox");
      this._textItalicCheck.setAttribute("id",id);
      MA.DOM.on(this._textItalicCheck,"click",MA.bind(function(evt){
        this._refreshLayer();
      },this ) );

      var label = MA.DOM.create("label");
      label.innerHTML = "斜体";
      label.setAttribute("for",id);

      td.appendChild( this._textItalicCheck );
      td.appendChild( label);


      //下線
      id = MA.getId("-gsibv-text-underline-");
      this._textUnderlineCheck = MA.DOM.create("input");
      MA.DOM.addClass(this._textUnderlineCheck, "normalcheck");
      this._textUnderlineCheck.setAttribute("type","checkbox");
      this._textUnderlineCheck.setAttribute("id",id);
      MA.DOM.on(this._textUnderlineCheck,"click",MA.bind(function(evt){
        this._refreshLayer();
      },this ) );

      var label = MA.DOM.create("label");
      label.innerHTML = "下線";
      label.setAttribute("for",id);

      td.appendChild( this._textUnderlineCheck );
      td.appendChild( label);


      tr.appendChild(td);
      table.tbody.appendChild(tr);

    }

    container.appendChild( table.table );
    return container;
  }

  destroy() {
    super.destroy();
    if ( this._textTimer ) {
      clearInterval( this._textTimer );
      this._textTimer = undefined;
    }

  }
  
  _textCheck() {
    var text = this._textArea.value;
    if ( this._feature.style.text != text ) {
      this._refreshLayer();
    }
  }

  _onTextFocus() {
    this._textTimer = setInterval( MA.bind(this._textCheck, this ), 200 );

  }
  
  _onTextBlur() {
    this._textCheck();
    if ( this._textTimer ) {
      clearInterval( this._textTimer );
      this._textTimer = undefined;
    }
  }
};

/***************************************
    GSIBV.UI.Dialog.SakuzuEditInfoDialog.MarkerEditPanel
    作図パネル管理
***************************************/
GSIBV.UI.Dialog.SakuzuEditInfoDialog.MarkerEditPanel = class extends GSIBV.UI.Dialog.SakuzuEditInfoDialog.FeatureEditPanel {

  
  constructor(feature, layer, parentContainer) {
    super(feature, layer, parentContainer);
  }

  
  destroy () {
    super.destroy();

    if ( this._imageSelector) {
      this._imageSelector.destroy();
      this._imageSelector = undefined;
    }
  }

  _reset() {
    super._reset();

    this._iconImage.src = this._feature.style.iconUrl;
    this._iconImage._url = this._feature.style.iconUrl;

    
    var width = GSIBV.CONFIG.SAKUZU.SYMBOL.ICONSIZE[0];

    var scale = this._feature.style.iconSize[0] / width;
    if ( scale < 1) {
      this._iconScaleSelect.value = "0.5";
    } else if ( scale < 1.5) {
      this._iconScaleSelect.value = "1";
    } else if ( scale < 2) {
      this._iconScaleSelect.value = "1.5";
    } else {
      this._iconScaleSelect.value = "2";
    }
    

  }

  
  _refreshLayer() {
    
    super._refreshLayer();

    this._feature.style.iconUrl = this._iconImage._url;

    if ( this._iconScaleSelect.value) {
      var iconScale = parseFloat(this._iconScaleSelect.value );
      var width = GSIBV.CONFIG.SAKUZU.SYMBOL.ICONSIZE[0];
      var height = GSIBV.CONFIG.SAKUZU.SYMBOL.ICONSIZE[1];
      var anchorX = GSIBV.CONFIG.SAKUZU.SYMBOL.ICONANCHOR[0];
      var anchorY = GSIBV.CONFIG.SAKUZU.SYMBOL.ICONANCHOR[1];

      this._feature.style.iconSize = [
        width * iconScale,
        height * iconScale
      ];
      
      this._feature.style.iconAnchor = [
        anchorX * iconScale,
        anchorY * iconScale
      ];
    }



    this._feature.update();
  }


  _createPanel() {
    var container = super._createPanel();

    var table = this._tableInfo;
    var tr = null;

    // アイコン
    tr = this._crateTr(table.tbody);
    tr.th.innerHTML = "アイコン";
    var iconPanel = MA.DOM.create("div");
    MA.DOM.addClass( iconPanel, "icon-panel");
    tr.td.appendChild( iconPanel);
    
    this._iconImage = MA.DOM.create("img");
    iconPanel.appendChild( this._iconImage );

    MA.DOM.on( iconPanel, "click", MA.bind(function(){
      if ( !this._imageSelector) {
        this._imageSelector = new GSIBV.UI.Dialog.SakuzuEditInfoDialog.MarkerEditPanel.ImageSelector();
        this._imageSelector .on("select", MA.bind(function(evt) {
          this._iconImage._url = evt.params.url;
          this._iconImage.src = evt.params.url;
          this._refreshLayer();
        },this));
      }
      this._imageSelector.show(iconPanel);
    },this, iconPanel) );



    // アイコン拡大率
    tr = this._crateTr(table.tbody);
    tr.th.innerHTML = "拡大率";
    
    this._iconScaleSelect = this._createSelect([
      { caption:"0.5", value : "0.5" },
      { caption:"1.0", value : "1" },
      { caption:"1.5", value : "1.5" },
      { caption:"2.0", value : "2" }
    ]);

    
    MA.DOM.on(this._iconScaleSelect,"change", MA.bind(function(){
      this._refreshLayer();
    },this));

    tr.td.appendChild( this._iconScaleSelect );

    container.appendChild( table.table );

    return container;
  }
};


GSIBV.UI.Dialog.SakuzuEditInfoDialog.MarkerEditPanel.ImageSelector = class extends MA.Class.Base {
  constructor() {
    super();
  }

  show( target) {
    this._create();

    var pos = MA.DOM.offset( target );
    var size = MA.DOM.size( target );
    this._container.style.left = ( size.width + pos.left)  +"px";
    this._container.style.top = pos.top  +"px";

    MA.DOM.fadeIn( this._container, 200 );
    this._visible = true;

    if ( !this._windowMousedownHandler ) {
      this._windowMousedownHandler = MA.bind( this._onWindowMouseDown,this  );
      MA.DOM.on( document.body, "mousedown", this._windowMousedownHandler );
    }
  }

  hide() {
    this._destroyEvents();
    this._visible = false;
    if ( !this._container ) return;
    MA.DOM.fadeOut( this._container, 200 );

  }

  _destroyEvents() {
    
    if ( this._windowMousedownHandler ) {
      MA.DOM.off( document.body, "mousedown", this._windowMousedownHandler );
      this._windowMousedownHandler = undefined;
    }
  }

  _onWindowMouseDown( evt ) {
    var target = evt.target;

    while( target) {
      if ( target == this._container) return;
      target = target.parentNode;
    }

    this.hide();
  }
  _create() {
    if ( this._container ) return;

    this._container = MA.DOM.create("div");
    this._container.style.display = "none";
    MA.DOM.addClass(this._container,"-sakuzu-marker-icon-selector");


    for( var i=0; i<GSIBV.CONFIG.SAKUZU.SYMBOL.FILES.length; i++ ) {
      var file = GSIBV.CONFIG.SAKUZU.SYMBOL.FILES[i];
      var div = MA.DOM.create("div");
      var img = MA.DOM.create("img");
      img.crossOrigin = "anonymous";

      img.src = GSIBV.CONFIG.SAKUZU.SYMBOL.URL + file;

      MA.DOM.on( img, "click", MA.bind( this._onImgClick, this, file ));
      div.appendChild( img );
      this._container.appendChild( div );
    }

    MA.DOM.find(document.body, "#main")[0].appendChild( this._container);
    
    try {
      this._listScrollBar = new PerfectScrollbar(this._container);
    } catch (e) { }
  }

  _onImgClick( file) {
    if ( !this._visible) return;
    console.log( file );
    this.fire( "select", {"url":GSIBV.CONFIG.SAKUZU.SYMBOL.URL +  file});
    this.hide();
  }

  destroy() {
    this._destroyEvents();
    if ( this._container) {
      if ( this._container.parentNode) this._container.parentNode.removeChild( this._container);
      this._container = undefined;
    }
  }

};