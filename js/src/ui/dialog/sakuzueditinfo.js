GSIBV.UI.Dialog.SakuzuEditInfoDialog = class extends GSIBV.UI.Dialog.Modeless {

  constructor(feature, layer, drawManager,options) {
    super(options);
    this._feature = feature;
    this._layer = layer;
    this._drawManager = drawManager;
    this._size.width = 350;
    this._size.height = 350;

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
    // 終了時のアラート表示 追加
    $(window).off('beforeunload').on('beforeunload', function(e) { return 'このページから移動しますか？ 入力した情報は保存されません。';});
    super.show();
    if(this._feature.properties && this._feature.properties._properties) {
      var keys = Object.keys(this._feature.properties._properties)
      var nameIdx = keys.indexOf("name");
      if (nameIdx !== -1) {
        keys.splice(nameIdx, 1);
      }
      var descIdx = keys.indexOf("description");
      if(descIdx>=0) {
        this._panel._inputType="text";
        this._panel._textarea.value = this._feature.properties.get("description");
      } else {
        this._panel._inputType="table";
        var len = keys.length;
        if(len>1) {
          for(var i=0;i<len-1;i++) {
            this._panel._createSubTableTr(this._panel._subTb.tbody);
          }
        }
        for(var i=0;i<len;i++) {
          this._panel._tableInputs[i].key.value = keys[i];
          this._panel._tableInputs[i].value.value = this._feature.properties.get(keys[i]);
        }
      }
    }
    this._panel.refreshInput();
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
        panel = new GSIBV.UI.Dialog.SakuzuEditInfoDialog.PolygonEditPanel(this._layer, this._feature, this._drawManager, contentsContainer);
        break;
      case GSIBV.Map.Draw.Marker.Type:
        if ( this._feature.markerType == GSIBV.Map.Draw.Marker.MarkerType) {
          panel = new GSIBV.UI.Dialog.SakuzuEditInfoDialog.MarkerEditPanel(this._feature, contentsContainer);
        } else if ( this._feature.markerType == GSIBV.Map.Draw.Circle.MarkerType) {
          panel = new GSIBV.UI.Dialog.SakuzuEditInfoDialog.CircleEditPanel(this._layer, this._feature, this._drawManager, contentsContainer);
        } else if ( this._feature.markerType == GSIBV.Map.Draw.CircleMarker.MarkerType) {
          panel = new GSIBV.UI.Dialog.SakuzuEditInfoDialog.CircleMarkerEditPanel(this._layer, this._feature, this._drawManager, contentsContainer);
        } else if ( this._feature.markerType == GSIBV.Map.Draw.DivMarker.MarkerType) {
          panel = new GSIBV.UI.Dialog.SakuzuEditInfoDialog.DivMarkerEditPanel(this._feature, contentsContainer);
        }
        break;
    }
    if ( panel ) panel.show();
    this._panel = panel;
  }

  _onButtonClick(btnInfo) {
    $(window).off('beforeunload');
    if ( btnInfo.id == "ok") {
      if ( this._panel) this._panel._refreshLayer();
    } else {
      if ( this._panel && this._panel.preCancel) this._panel.preCancel();
      this._feature.setJSON(this._originalGeoJSON);
      this._feature.update();
    }
    
    super._onButtonClick(btnInfo);

    var objList = GSIBV.application._sakuzuDialog._list._list;
    for(var i=0; i< objList.length; i++){
      var features = objList[i]._item.featureCollection._features;
      for(var j=0; j < features.length; j++){
        if(features[j] == this._feature){
          objList[i].reSetSelect();
          i =  objList.length;
          break;
        }
      }
    }
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
    this._inputType = "table";
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
    var title = this._titleInput.value == "" ? undefined : this._titleInput.value;
    if(this._inputType==="table") {
      if(this._tableInputs) {
        var len = this._tableInputs.length;
        this._feature.properties.clear();
        for(var i=0;i<len;i++) {
          var key = this._tableInputs[i].key.value;
          var value = this._tableInputs[i].value.value;
          if(key && key.trim()!="") {
            if(value===undefined || value===null) value="";
            this._feature.properties.set(key, value);
          }
        }
      }
      this._feature.properties.remove("description");
    } else{
      if(this._textarea.value.trim() != "") {
        this._feature.properties.set("description", this._textarea.value);
        var keys = Object.keys(this._feature.properties._properties);
        var len = keys.length;
        for(var i=0;i<len;i++) {
          if(keys[i]==="name" || keys[i]==="description") continue;
          this._feature.properties.remove(keys[i]);
        }
      }
    }
    this._feature.title = title;
    if(title) this._feature.properties.set("name", title);
  }

  initialize() {
    if ( this._container) return;

    this._container = this._createPanel();

    this._parentContainer.appendChild( this._container );
  }
  refreshInput(){
    if(this._inputType==="text") {
      MA.DOM.addClass( this._subTb.table, "hide");
      MA.DOM.removeClass( this._textarea, "hide");
    } else {
      MA.DOM.removeClass( this._subTb.table, "hide");
      MA.DOM.addClass( this._textarea, "hide");
    }
    var size = MA.DOM.size(this._tableInfo.table);
    
    var dialog = this._parentContainer.parentElement.parentElement.parentElement;
    var height = parseInt(dialog.style.height.replace("px",""));
    dialog.style.height = (size.height + 60) + 'px';
  }

  
  _createPanel() {
    var container = MA.DOM.create("div");
    MA.DOM.addClass(container,"draw-edit-panel" );
    if(!this._tableInfo) this._tableInfo = this._createTable();

    // タイトル入力
    var tr = this._crateTr(this._tableInfo.tbody);

    this._titleInput = MA.DOM.create("input");
    MA.DOM.addClass(this._titleInput, "title");

    this._titleInput.setAttribute("type","text");
    tr.th.innerHTML = "名称";
    tr.td.appendChild( this._titleInput);
    this._tableInputs = [];
    var tr2 = this._createTrWithOneTd(this._tableInfo.tbody);
    var tr3 = this._createTrWithOneTd(this._tableInfo.tbody);

    this._subTb = this._createTable();
    var subTr1 =  MA.DOM.create("tr");
    var subTh1 =  MA.DOM.create("th");
    var subTh2 =  MA.DOM.create("th");
    var subTh3 =  MA.DOM.create("th");
    var subTh4 =  MA.DOM.create("th");
    subTh1.setAttribute("style","width: 45%");
    subTh2.setAttribute("style","width: 45%");
    subTh3.setAttribute("style","width: 5%");
    subTh4.setAttribute("style","width: 5%");
    subTh1.innerHTML = "項目名";
    subTh2.innerHTML = "値";
    subTr1.appendChild( subTh1 );
    subTr1.appendChild( subTh2 );
    subTr1.appendChild( subTh3 );
    subTr1.appendChild( subTh4 );
    this._subTb.tbody.appendChild( subTr1 );

    this._createSubTableTr(this._subTb.tbody);
    tr3.td.appendChild(this._subTb.table);
    this._textarea = MA.DOM.create("textarea");
    this._textarea.setAttribute("wrap", "off");
    this._textarea.setAttribute("class", "inputtextarea hide");
    this._textarea.setAttribute("style", "height: 100px; width: 100%; margin-top: 2px; display: inline-block;");
    tr3.td.appendChild(this._textarea);

    this._link = MA.DOM.create("a");
    this._link.setAttribute("href", "javascript:void(0)");
    MA.DOM.addClass(this._link, "toggleinfobtn");
    this._link.innerHTML = "自由文入力に切替";
    
    this._linkClickHandler = MA.bind(this._linkClick, this);
    MA.DOM.on(this._link, "click", this._linkClickHandler);
    tr2.td.appendChild(this._link);

    return container;

  }

  _linkClick() {
    console.log(this._inputType);
    if(this._inputType === "table") {
      this._inputType = "text";
      this._link.innerHTML = "テーブル入力に切替";
      //get value from table inputs
      MA.DOM.addClass( this._subTb.table, "hide");
      var html = "";
      if(this._tableInputs) {
        var len = this._tableInputs.length;
        for(var i=0;i<len;i++) {
          var key = this._tableInputs[i].key.value;
          var value = this._tableInputs[i].value.value;
          if(key && key.trim()!="") {
            if(value===undefined || value===null) value="";
            html +="<tr><td>"+key+"</td><td>"+value+"</td></tr>\n";
          }
        }
        if(html !="") {
          html = "<table>\n"+html+"</table>";
        }
      }
      if(html !="") {
        this._textarea.value = html;
      }
    } else {
      this._inputType = "table";
      this._link.innerHTML = "自由文入力に切替";
    }
    this.refreshInput();
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

  _crateTrInFront(tbody) {
    var tr = MA.DOM.create("tr");
    var th = MA.DOM.create("th");
    var td = MA.DOM.create("td");

    tr.appendChild( th );
    tr.appendChild( td );
    tbody.insertBefore( tr , tbody.firstChild);
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

  //_createRadios( list ) {
  //  var radioList = MA.DOM.create("div");
  //  radioList.setAttribute("class", "radio-frame");
  //  for( var i=0; i<list.length; i++ ) {
  //    var input = MA.DOM.create("input");
  //    input.setAttribute("type", "radio");
  //    input.setAttribute("class", "normalcheck");
  //    var label = MA.DOM.create("label");
  //    label.innerHTML = list[i].label;
  //    input.setAttribute("value", list[i].value);
  //    radioList.appendChild( input );
  //    radioList.appendChild( label );
  //  }
  //  return radioList;
  //}
  
  _createTrWithOneTd(tbody) {
    var tr = MA.DOM.create("tr");
    var td = MA.DOM.create("td");
    td.setAttribute("colspan","2");
    
    tr.appendChild( td );
    tbody.appendChild( tr );
    return {
      tr:tr,
      td:td
    };
  }

  _createSubTableTr(tbody) {
    var tr =  MA.DOM.create("tr");
    var td1 =  MA.DOM.create("td");
    var td2 =  MA.DOM.create("td");
    var td3 =  MA.DOM.create("td");
    var td4 =  MA.DOM.create("td");

    var input1 = MA.DOM.create("input");
    input1.setAttribute("type","text");
    input1.setAttribute("name","info_table_key");
    input1.setAttribute("placeholder","(例:営業時間)");
    td1.appendChild( input1);
    
    var input2 = MA.DOM.create("input");
    input2.setAttribute("type","text");
    input2.setAttribute("name","info_table_value");
    input2.setAttribute("placeholder","(例:10時～18時)");
    td2.appendChild( input2);
    this._tableInputs.push({key: input1, value: input2});

    var input3 = MA.DOM.create("a");
    MA.DOM.addClass(input3, "btn");
    input3.setAttribute("href","javascript:void(0);");
    var input3_img = MA.DOM.create("img");
    input3_img.setAttribute("title","この行を削除");
    input3_img.setAttribute("src","image/sakuzu/icon_remove.png");
    input3.appendChild(input3_img);
    MA.DOM.on(input3,"click", MA.bind(function(target){
      console.log(target);
      console.log(input3);
      var tbody = input3.parentElement.parentElement.parentElement;
      if(tbody.rows.length > 2) {
        tbody.deleteRow(input3.parentElement.parentElement.rowIndex);
        
        var dialog = this._parentContainer.parentElement.parentElement.parentElement;
        var height = parseInt(dialog.style.height.replace("px",""));
        dialog.style.height = (height - 26) + 'px';
      }
    }, this));
    td3.appendChild( input3);

    var input4 = MA.DOM.create("a");
    MA.DOM.addClass(input4, "btn");
    input4.setAttribute("href","javascript:void(0);");
    var input4_img = MA.DOM.create("img");
    input4_img.setAttribute("title","この下に行を追加");
    input4_img.setAttribute("src","image/sakuzu/icon_enter.png");
    input4.appendChild(input4_img);

    MA.DOM.on( input4, "click", MA.bind( this._createSubTableTr, this, tbody ));
    td4.appendChild( input4);

    tr.appendChild( td1 );
    tr.appendChild( td2 );
    tr.appendChild( td3 );
    tr.appendChild( td4 );
    tbody.appendChild( tr );
    if(this._parentContainer.parentElement) {
      var dialog = this._parentContainer.parentElement.parentElement.parentElement;
      var height = parseInt(dialog.style.height.replace("px",""));
      dialog.style.height = (height + 26) + 'px';
    }
    return {
      tr:tr,
      td1:td1,
      td2:td2,
      td3:td4,
      td3:td4
    };
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
    this._TypeSelect.value = this._feature.style.geodesic + "";
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
    this._feature.style.geodesic = parseInt(this._TypeSelect.value);

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

    // 航路
    //tr = this._crateTr(table.tbody);
    //this._TypeSelect = this._createRadios([
    //  { label:"大圏航路", value : "1" },
    //  { label:"等角航路", value : "0" },
    //]);
    //MA.DOM.on(this._TypeSelect,"change", MA.bind(function(){
    //  this._refreshLayer();
    //},this));
    //tr.td.appendChild( this._TypeSelect );
    tr = this._crateTrInFront(table.tbody);
    tr.th.innerHTML = "航路";
    this._TypeSelect = this._createSelect([
      { caption:"大圏航路", value : "1" },
      { caption:"等角航路", value : "0" },
    ]);
    MA.DOM.on(this._TypeSelect,"change", MA.bind(function(){
      this._refreshLayer();
    },this));
    tr.td.appendChild( this._TypeSelect );
    
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
GSIBV.UI.Dialog.SakuzuEditInfoDialog.PolygonEditPanel = class extends GSIBV.UI.Dialog.SakuzuEditInfoDialog.FeatureEditPanel {
  
  constructor(layer, feature, drawManager, parentContainer) {
    super(feature, parentContainer);
    this._layer = layer;
    this._drawManager = drawManager;
  }

  _reset() {
    super._reset();
    this._weightSelect.value = this._feature.style.weight + "";
    if(this._TypeSelect) {
      this._TypeSelect.value = this._feature.style.geodesic + "";
    }
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
    this._fillColorPanel._color= MA.Color.parse(this._feature.style.fillColor);
    this._fillColorPanel._color.a = this._feature.style.fillOpacity;
    this._fillColorPanel.style.backgroundColor = MA.Color.toString( this._fillColorPanel._color );
  }
  
  _refreshLayer() {
    super._refreshLayer();
    this._feature.style.fillColor = MA.Color.toHTMLHex( this._fillColorPanel._color );
    this._feature.style.fillOpacity = this._fillColorPanel._color.a;
    if ( this._weightSelect.selectedIndex >= 0)
      this._feature.style.weight = parseInt(this._weightSelect.value);
    this._feature.style.color = MA.Color.toHTMLHex( this._lineColorPanel._color );
    this._feature.style.opacity = this._lineColorPanel._color.a;
    if(this._TypeSelect) {
      this._feature.style.geodesic = parseInt(this._TypeSelect.value);
    }

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

    // 航路
    if(this.feature.geometryType === GSIBV.Map.Draw.Polygon.Type) {
      tr = this._crateTrInFront(table.tbody);
      tr.th.innerHTML = "航路";
      this._TypeSelect = this._createSelect([
        { caption:"大圏航路", value : "1" },
        { caption:"等角航路", value : "0" },
      ]);
      MA.DOM.on(this._TypeSelect,"change", MA.bind(function(){
        this._refreshLayer();
      },this));
      tr.td.appendChild( this._TypeSelect );
    }

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

    //中抜き
    if(this.feature.geometryType === GSIBV.Map.Draw.Polygon.Type) {
      var trtd = this._createTrWithOneTd(table.tbody);

      this._innerPolygonLink = MA.DOM.create("a");
      this._innerPolygonLink.setAttribute("href", "javascript:void(0)");
      MA.DOM.addClass(this._innerPolygonLink, "toggleinfobtn");
      this._innerPolygonLink.innerHTML = "中抜きの追加・削除";
      trtd.td.appendChild(this._innerPolygonLink);

      MA.DOM.on(this._innerPolygonLink,"click", MA.bind(function(target){
        var popup = new GSIBV.UI.Popup.Notice(container.parentElement.parentElement);
        popup.text = "中抜きの追加・削除中です。<br>対象のポリゴン内に中抜きを作成、またはゴミ箱アイコンをクリックして削除して下さい。";
        popup.btnText = "現在の状態で中抜きを確定";
        popup.show();
        this._editor = this._drawManager.drawer ? this._drawManager.drawer._featureEditor : this._drawManager._list.editing._editor;
        this._editor.destroyControls();
        MA.DOM.on(popup._btn,"click",MA.bind(function(){
          this.innerDrawManager.stopDraw();
          this._editor._createControls();
          this.innerDrawManager.layerList.clear();
          this.innerDrawManager.userDrawItem.destroy();
          popup.hide();
          popup.destroy();
          this._refreshLayer();
        },this,popup._btn));
        
        this.innerDrawManager = new GSIBV.Map.Draw.Manager(this._drawManager._map);
        this.innerDrawManager.userDrawItem.featureCollection.clear();
        for( var i=0; i<this._feature.innerList.length; i++) {
          var feature = new GSIBV.Map.Draw.Polygon();
          feature._coordinates = this._feature.innerList[i];
          feature.style.fillOpacity = 0;
          this.innerDrawManager.userDrawItem.addFeature(feature);
        }

        this.innerDrawManager.on("drawstart", MA.bind(function(){
          this.innerDrawManager.drawer.on("create", MA.bind(function(evt){
            this._feature._innerList.push(evt.params.feature.coordinates);
            this._feature.fire("update");
            this._layer.update();
          }, this));
        }, this));

        this.innerDrawManager.on("drawready", MA.bind(function(){
          this.innerDrawManager.nextDraw();
          this.innerDrawManager.userDrawItem._showFeatureSelector();
          this.innerDrawManager.userDrawItem._featureSelector.destroy();
          this.innerDrawManager.userDrawItem._featureSelector.create();
          this.innerDrawManager.userDrawItem._showFeatureSelector();
        }, this));

        this.innerDrawManager.userDrawItem._noEdit = true;
        this.innerDrawManager.draw(GSIBV.Map.Draw.PolygonInnerDrawer.Type);
        this.innerDrawManager.drawer.parentFeature = this.feature;
        this.innerDrawManager.userDrawItem._showFeatureSelector();
        this.innerDrawManager.userDrawItem.on("removefeature", MA.bind(function(){
          this._feature._innerList = [];
          for( var i=0; i<this.innerDrawManager.userDrawItem.featureCollection._features.length; i++ ) {
            this._feature._innerList.push(this.innerDrawManager.userDrawItem.featureCollection._features[i].coordinates);
          }
          this._feature.fire("update");
        }, this));
      },this,this._innerPolygonLink));
    }

    container.appendChild( table.table );
    return container;
  }
};


/***************************************
    GSIBV.UI.Dialog.SakuzuEditInfoDialog.CircleEditPanel
    作図パネル管理
***************************************/
GSIBV.UI.Dialog.SakuzuEditInfoDialog.CircleEditPanel = class extends GSIBV.UI.Dialog.SakuzuEditInfoDialog.PolygonEditPanel {
  
  constructor(layer, feature, drawManager, parentContainer) {
    super(layer, feature, drawManager, parentContainer);
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
  
  constructor(layer, feature, drawManager, parentContainer) {
    super(layer, feature, drawManager, parentContainer);
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

  constructor(feature, parentContainer) {
    super(feature, parentContainer);
    this._oriStyleValueStr = this._feature.style.styleValueStr;
  }

  get fileHtml() {
    return this._feature.style.fileHtml;
  }

  set fileHtml(value){
    this._feature.style.fileHtml = value;
  }

  _clearFileHtml(){
    this.fileHtml = null;
  }
  
  _reset() {
    super._reset();
    this._divMarkerInputType = "text";
    this._textArea.value = this._feature.style.text;
    this._htmlArea.value = this._feature.style.html;

    this._textSizeSelect.value = this._feature.style.fontSize + "";

    if ( this._feature.style.color) {
      this._textColorPanel._color = MA.Color.parse(this._feature.style.color);
      this._textColorPanel.style.backgroundColor =MA.Color.toHTMLHex( this._textColorPanel._color );
    
    } else {
      this._textColorPanel._color =null;
      this._textColorPanel.backgroundColor ="transparent";
    }

    if ( this._feature.style.backgroundColor) {
      this._backgroundColorPanel._color = MA.Color.parse(this._feature.style.backgroundColor);
      this._backgroundColorPanel.style.backgroundColor =MA.Color.toHTMLHex( this._backgroundColorPanel._color );
    
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
    if(this._isHtmlMode()) {
      this.fileHtml = this._htmlArea.value;
    } else {
      this._clearFileHtml();
      this.fileHtml = this._feature.style._makeHTML();
    }
  }

  _updateFeatureProperty(key, value){
    this._feature.style[key] = value;
    this._feature.update();
    this._refreshLayer();
  }

  _featureProperty(key){
    return this._feature.style[key];
  }

  _updateControllers(){
    if(this._isHtmlMode()) {
      if(this.fileHtml && this._feature.style.styleValueStr !== this._oriStyleValueStr) {
        this._clearFileHtml(); 
      }
      this._htmlArea.value = this._feature.style._makeHTML();
    } else {
      this._textArea.value = this._featureProperty("text") || this._textArea.value;
      this._textSizeSelect.value = this._featureProperty("fontSize") || this._textSizeSelect.value;

      if(this._textColorPicker && this._textColorPicker._currentTarget) {
        var color = MA.Color.parse(this._featureProperty("color"));
        if(color){
          MA.DOM.removeClass( this._textColorPicker._currentTarget, "transparent");
          this._textColorPicker._currentTarget._color = MA.Color.fix(color);
          this._textColorPicker._currentTarget.style.backgroundColor = MA.Color.toHTMLHex( this._textColorPicker._currentTarget._color );
        } else {
          this._textColorPicker._currentTarget._color = null;
          this._textColorPicker._currentTarget.style.backgroundColor = "transparent";
          MA.DOM.addClass( this._textColorPicker._currentTarget, "transparent");
        }
      }
      
      if(this._textBGColorPicker && this._textBGColorPicker._currentTarget){
        var bgColor = MA.Color.parse(this._featureProperty("backgroundColor"));
        if ( bgColor ) {
          MA.DOM.removeClass( this._textBGColorPicker._currentTarget, "transparent");
          this._textBGColorPicker._currentTarget._color = MA.Color.fix(bgColor);
          this._textBGColorPicker._currentTarget.style.backgroundColor =MA.Color.toHTMLHex( this._textBGColorPicker._currentTarget._color );
        } else {
          this._textBGColorPicker._currentTarget._color = null;
          this._textBGColorPicker._currentTarget.style.backgroundColor = "transparent";
          MA.DOM.addClass( this._textBGColorPicker._currentTarget, "transparent");
        }
      }
      
      this._textBoldCheck.checked = this._featureProperty("bold");
      this._textItalicCheck.checked = this._featureProperty("italic");
      this._textUnderlineCheck.checked = this._featureProperty("underLine");

      this._clearFileHtml();
    }
  }

  _createPanel() {  
    if(!this._tableInfo) this._tableInfo = this._createTable();
    
    var table = this._tableInfo;
    var tr = null;

    this._titleTr = this._createTrWithOneTd(table.tbody);
    this._titleTr.td.innerHTML = "表示するテキストを入力して下さい。";

    tr = this._createTrWithOneTd(table.tbody);
    this._changeLink = MA.DOM.create("a");
    this._changeLink.setAttribute("href", "javascript:void(0)");
    MA.DOM.addClass(this._changeLink, "toggleinfobtn");
    this._changeLink.innerHTML = "HTML入力に切替";
    
    this._changeLinkClickHandler = MA.bind(this._changeLinkClick, this);
    MA.DOM.on(this._changeLink, "click", this._changeLinkClickHandler);
    tr.td.appendChild(this._changeLink);

    this.textTb = this._createTable();
    this.htmlTb = this._createTable();
    MA.DOM.addClass( this.htmlTb.table, "hide");
    tr = this._createTrWithOneTd(table.tbody);
    tr.td.appendChild(this.textTb.table);
    tr.td.appendChild(this.htmlTb.table);
    // 文字列

    tr = this._createTrWithOneTd(this.textTb.tbody);

    this._textArea = MA.DOM.create("textarea");
    this._textArea.placeholder = "例1:動物園";
    this._textArea.setAttribute("style", "height: 26px; width: 100%; margin-top: 2px; display: inline-block;");
    
    MA.DOM.on(this._textArea,"focus", MA.bind( this._onTextFocus,this));
    MA.DOM.on(this._textArea,"blur", MA.bind( this._onTextBlur,this));
    tr.td.appendChild(this._textArea);


    
    // サイズ
    tr = this._crateTr(this.textTb.tbody);
    tr.th.innerHTML = "サイズ";
    
    this._textSizeSelect = this._createSelect([
      { caption:"文字サイズ", value : "0" },
      { caption:"8", value : "8" },
      { caption:"9", value : "9" },
      { caption:"9.5", value : "9.5" },
      { caption:"10", value : "10" },
      { caption:"10.5", value : "10.5" },
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
    this._textSizeSelect.style.width = "85pt";
    MA.DOM.on(this._textSizeSelect,"change", MA.bind(function(){
      if ( this._textSizeSelect.selectedIndex >= 0 ) {
        var fontSize = this._textSizeSelect.value == "0"? 9.5 : this._textSizeSelect.value;
        this._updateFeatureProperty("fontSize", parseFloat(fontSize));
      }
    },this));

    tr.td.appendChild( this._textSizeSelect );



    // 文字の色
    tr = this._crateTr(this.textTb.tbody);
    tr.th.innerHTML = "文字色";
    var colorPanel = MA.DOM.create("div");
    MA.DOM.addClass( colorPanel, "color-panel");
    tr.td.appendChild( colorPanel);
    
    var colorPanelInner = MA.DOM.create("div");
    MA.DOM.addClass(colorPanelInner, "inner" );

    colorPanel.appendChild(colorPanelInner);
    this._textColorPanel = colorPanelInner;

    if(this._colorClickHanlder) {
      MA.DOM.off(this._textColorPanel,"click", this._colorClickHanlder);
    }
    if ( !this._textColorPicker) {
      this._textColorPicker = new GSIBV.UI.ColorPicker();
      this._textColorPicker.zIndex = 50000;
      this._textColorPicker.noAlpha = true;
      this._textColorPicker.useClearButton = true;
      this._textColorPicker._currentTarget = this._textColorPanel;
      this._textColorPicker.on("change",MA.bind(function(evt){
        var color = evt.params.color;
        if ( color ) {
          MA.DOM.removeClass( this._textColorPicker._currentTarget, "transparent");
          this._textColorPicker._currentTarget._color = MA.Color.fix(color.getRGB());
          this._textColorPicker._currentTarget.style.backgroundColor =MA.Color.toHTMLHex( this._textColorPicker._currentTarget._color );
        } else {
          this._textColorPicker._currentTarget._color =null;
          this._textColorPicker._currentTarget.style.backgroundColor ="transparent";
          MA.DOM.addClass( this._textColorPicker._currentTarget, "transparent");
        }
        this._updateFeatureProperty("color", this._textColorPanel._color ? MA.Color.toHTMLHex( this._textColorPanel._color ) : undefined);
      },this));
    }
    this._colorClickHanlder = MA.bind(function(target){
      this._textColorPicker.show(target, target._color);
    }, this, this._textColorPanel);
    MA.DOM.on(this._textColorPanel,"click", this._colorClickHanlder);
    
    // 背景色
    tr = this._crateTr(this.textTb.tbody);
    tr.th.innerHTML = "背景色";
    var colorPanel = MA.DOM.create("div");
    MA.DOM.addClass( colorPanel, "color-panel");
    tr.td.appendChild( colorPanel);
    
    var colorPanelInner = MA.DOM.create("div");
    MA.DOM.addClass(colorPanelInner, "inner" );

    colorPanel.appendChild(colorPanelInner);
    this._backgroundColorPanel = colorPanelInner;

    if(this._bgColorClickHanlder) {
      MA.DOM.off(this._backgroundColorPanel,"click", this._bgColorClickHanlder);
    }
    if ( !this._textBGColorPicker) {
      this._textBGColorPicker = new GSIBV.UI.ColorPicker();
      this._textBGColorPicker.zIndex = 50000;
      this._textBGColorPicker.noAlpha = true;
      this._textBGColorPicker.useClearButton = true;
      this._textBGColorPicker._currentTarget = this._backgroundColorPanel;
      this._textBGColorPicker.on("change",MA.bind(function(evt){
        //this._colorPicker._currentTarget._color = ;
        var color = evt.params.color;
        if ( color ) {
          MA.DOM.removeClass( this._textBGColorPicker._currentTarget, "transparent");
          this._textBGColorPicker._currentTarget._color = MA.Color.fix(color.getRGB());
          this._textBGColorPicker._currentTarget.style.backgroundColor =MA.Color.toHTMLHex( this._textBGColorPicker._currentTarget._color );
        } else {
          this._textBGColorPicker._currentTarget._color =null;
          this._textBGColorPicker._currentTarget.style.backgroundColor ="transparent";
          MA.DOM.addClass( this._textBGColorPicker._currentTarget, "transparent");
        }
        this._updateFeatureProperty("backgroundColor", this._backgroundColorPanel._color ? MA.Color.toHTMLHex( this._backgroundColorPanel._color ) : undefined);
      },this));
    }
    this._bgColorClickHanlder = MA.bind(function(target){
      this._textBGColorPicker.show(target, target._color);
    }, this, this._backgroundColorPanel);
    MA.DOM.on(this._backgroundColorPanel,"click", this._bgColorClickHanlder);

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
        this._updateFeatureProperty("bold", this._textBoldCheck.checked);
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
        this._updateFeatureProperty("italic", this._textItalicCheck.checked);
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
        this._updateFeatureProperty("underLine", this._textUnderlineCheck.checked);
      },this ) );

      var label = MA.DOM.create("label");
      label.innerHTML = "下線";
      label.setAttribute("for",id);

      td.appendChild( this._textUnderlineCheck );
      td.appendChild( label);


      tr.appendChild(td);
      this.textTb.tbody.appendChild(tr);
    }

    //HTML
    tr = this._createTrWithOneTd(this.htmlTb.tbody);
    // tr.th.innerHTML = "表示<br>文字列";

    this._htmlArea = MA.DOM.create("textarea");
    this._htmlArea.placeholder = "例1:動物園\n例2:<span style=\"background:rgba(0,255,255,1); color:rgba(255,0,0,1); font-size:20pt;\">図書館</span>";
    this._htmlArea.setAttribute("style", "height: 80px; width: 100%; margin-top: 2px; display: inline-block;");
    MA.DOM.on(this._htmlArea,"focus", MA.bind( this._onHtmlFocus,this));
    MA.DOM.on(this._htmlArea,"blur", MA.bind( this._onHtmlBlur,this));

    tr.td.appendChild(this._htmlArea);

    var note = $("<span>");
    note.css("font-size", "8pt");
    note.html("※ HTMLは単一のdivタグを用いたスタイルのみ表示できます。");
    tr.td.appendChild(note[0]);

    var container = super._createPanel();
    container.appendChild( table.table );
    return container;
  }
  
  _textCheck() {
    if(this._textContent == this._textArea.value) return;
    this._textContent = this._textArea.value;
    this._updateFeatureProperty("text", this._textContent);
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

  _htmlCheck() {
    if(this._htmlContent == this._htmlArea.value) return;
    this._htmlContent = this._htmlArea.value;
    this._feature.style.setJSON({_html: this._htmlContent});
    this._feature.update();
  }

  _onHtmlFocus() {
    this._htmlTimer = setInterval( MA.bind(this._htmlCheck, this ), 200 );
  }
  
  _onHtmlBlur() {
    this._htmlCheck();
    if ( this._htmlTimer ) {
      clearInterval( this._htmlTimer );
      this._htmlTimer = undefined;
    }
  }

  _isHtmlMode(){
    return this._divMarkerInputType === "html";
  }
  
  _changeLinkClick() {
    console.log(this._divMarkerInputType);
    if(this._isHtmlMode()) {
      if (this._htmlArea.value != "") {
        if (!confirm('スタイル等の情報が失われる可能性があります。よろしいですか？')) return;
      }
      this._divMarkerInputType = "text";
      this._titleTr.td.innerHTML = "表示するテキストを入力して下さい。";
      this._changeLink.innerHTML = "HTML入力に切替";
    } else {
      this._divMarkerInputType = "html";
      this._titleTr.td.innerHTML = "表示するHTMLを入力して下さい。";
      this._changeLink.innerHTML = "テキスト入力に切替";
    }
    this._refreshDivInput();
  }

  _refreshDivInput() {
    if(this._isHtmlMode()) {
      MA.DOM.addClass( this.textTb.table, "hide");
      MA.DOM.removeClass( this.htmlTb.table, "hide");
    } else {
      MA.DOM.addClass( this.htmlTb.table, "hide");
      MA.DOM.removeClass( this.textTb.table, "hide");
    } 

    this._updateControllers();

    var size = MA.DOM.size(this._tableInfo.table);
    
    var dialog = this._parentContainer.parentElement.parentElement.parentElement;
    var height = parseInt(dialog.style.height.replace("px",""));
    dialog.style.height = (size.height + 60) + 'px';
  }

  preCancel(){
    this._feature.style.recoverFileHtml();
  }

  destroy() {
    super.destroy();
    if ( this._textTimer ) {
      clearInterval( this._textTimer );
      this._textTimer = undefined;
    }

    if ( this._textBGColorPicker) {
      this._textBGColorPicker.destroy();
      this._textBGColorPicker = undefined;
    }

    if(this._changeLinkClickHandler){
      MA.DOM.off(this._changeLink, "click", this._changeLinkClickHandler);
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
      this._feature.style.iconScale = iconScale;
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