/*****************************************************************
 * GSIBV.UI.Dialog.LoadOutsideTileDialog
 * 外部タイル読込ダイアログ管理
******************************************************************/
GSIBV.UI.Dialog.LoadOutsideTileDialog = class extends GSIBV.UI.Dialog.Modeless {
  constructor(map) {
    super();
    this._map = map;
    this.num = 1;
    this._size.width = 320;
    this._size.height = 400;
    this._position = {left:242,top:64};
    this._frameClass = ["out-side-tile"];
  }

  _createHeader(headerContainer) {
    super._createHeader(headerContainer);
    this._titleContainer = MA.DOM.create("div");
    this._titleContainer.innerHTML = "外部タイル読込";
    headerContainer.appendChild(this._titleContainer);

    this._closeButton = MA.DOM.create("button");
    MA.DOM.addClass(this._closeButton, "close-button");

    MA.DOM.on(this._closeButton, "click", MA.bind(this._onCloseClick, this));
    headerContainer.appendChild(this._closeButton);
  }

  _createContents(contentsContainer) {
    MA.DOM.addClass(contentsContainer, "-gsibv-relief-contents");
    this._contentContainer = this._createOtContents();
    this._footerContainer = this._createOtFooter();
    contentsContainer.appendChild(this._contentContainer);
    contentsContainer.appendChild(this._footerContainer);
  }

  show() {
    super.show();
    this._resize();
  }

  _onCloseClick() {
    this.hide();
  }

  _createOtContents() {
    var divContainer = MA.DOM.create("div");
    var dlContainer = MA.DOM.create("dl");
    var dtContainer = MA.DOM.create("dt");
    var ddContainer = MA.DOM.create("dd");
    var div = null;
    var span = null;
    var option = null;
    this._radioUrl = MA.DOM.create("input");
    MA.DOM.addClass(this._radioUrl, "normalcheck");
    this._radioUrl.setAttribute("type", "radio");
    this._radioUrl.setAttribute("name", "gsi_loadoutsidetiledialog");
    this._radioUrl.setAttribute("id", "gsi_loadoutsidetiledialog_url");
    this._radioUrl.setAttribute("checked", true);

    var labelUrl = MA.DOM.create("label");
    labelUrl.innerHTML = "URLを指定";
    labelUrl.setAttribute("for", "gsi_loadoutsidetiledialog_url");

    dtContainer.appendChild(this._radioUrl);
    dtContainer.appendChild(labelUrl);

    div = MA.DOM.create("div");
    div.innerHTML = "レイヤー名:";
    this._layerNameInput = MA.DOM.create("input");
    MA.DOM.addClass(this._layerNameInput,"title");
    this._layerNameInput.setAttribute("type", "text");
    this._layerNameInput.setAttribute("placeholder", "表示名称");
    ddContainer.appendChild(div);
    ddContainer.appendChild(this._layerNameInput);

    div = MA.DOM.create("div");
    div.innerHTML = "URL:URL例は";
    var link = MA.DOM.create("a");
    link.setAttribute("target", "_blank");
    link.setAttribute("href", "https://maps.gsi.go.jp/help/pdf/vector/GSIVector.pdf#page=54");
    link.innerHTML = "こちら";    
    div.appendChild(link);
    ddContainer.appendChild(div);

    div = MA.DOM.create("div");
    this._urlInput = MA.DOM.create("textarea");
    this._urlInput.setAttribute("placeholder", "例:https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png");
    div.appendChild(this._urlInput);
    ddContainer.appendChild(div);

    div = MA.DOM.create("div");
    var option_btn = MA.DOM.create("a");
    option_btn.setAttribute("href", "javascript:void(0);");
    option_btn.innerHTML = "オプション";
    MA.DOM.addClass(option_btn, "option_btn");
    MA.DOM.on(option_btn, "click", MA.bind(this._onOptionBtnClick, this));
    this.iconspan = MA.DOM.create("span");
    option_btn.appendChild(this.iconspan);
    div.appendChild(option_btn);
    ddContainer.appendChild(div);

    this._optionFrame = MA.DOM.create("div");
    MA.DOM.addClass(this._optionFrame, "optionFrame");
    div = MA.DOM.create("div");
    this._tmsInput =  MA.DOM.create("input");
    MA.DOM.addClass(this._tmsInput, "normalcheck");
    this._tmsInput.setAttribute("type", "checkbox");
    this._tmsInput.setAttribute("id", "gsi_loadoutsidetiledialog_tms");
    var labelCheck = MA.DOM.create("label");
    labelCheck.innerHTML = "南西原点";
    labelCheck.setAttribute("for", "gsi_loadoutsidetiledialog_tms");

    div.appendChild(this._tmsInput);
    div.appendChild(labelCheck);
    this._optionFrame.appendChild(div);

    div = MA.DOM.create("div");
    span = MA.DOM.create("span");
    span.innerHTML = "minZoom:";
    this._minZoomSelect = MA.DOM.create("select");
    option = MA.DOM.create("option");
    this._minZoomSelect.appendChild(option);
    for (var i = 2; i <= 24; i++) {
      option = MA.DOM.create("option");
      option.setAttribute("value", i);
      option.innerHTML = i;
      this._minZoomSelect.appendChild(option);
    }
    div.appendChild(span);
    div.appendChild(this._minZoomSelect);
    span = MA.DOM.create("span");
    span.innerHTML = "maxZoom:";
    this._maxZoomSelect = MA.DOM.create("select");
    this._maxZoomSelect .style.marginRight = 0;
    option = MA.DOM.create("option");
    this._maxZoomSelect.appendChild(option);
    for (var i = 2; i <= 24; i++) {
      option = MA.DOM.create("option");
      option.setAttribute("value", i);
      option.innerHTML = i;
      this._maxZoomSelect.appendChild(option);
    }
    div.appendChild(span);
    div.appendChild(this._maxZoomSelect);
    this._optionFrame.appendChild(div);

    div = MA.DOM.create("div");
    span = MA.DOM.create("span");
    span.innerHTML = "maxNativeZoom:";
    this._maxNativeZoomSelect = MA.DOM.create("select");
    option = MA.DOM.create("option");
    this._maxNativeZoomSelect.appendChild(option);
    for (var i = 2; i <= 24; i++) {
      option = MA.DOM.create("option");
      option.setAttribute("value", i);
      option.innerHTML = i;
      this._maxNativeZoomSelect.appendChild(option);
    }
    div.appendChild(span);
    div.appendChild(this._maxNativeZoomSelect);
    div.style.marginBottom = 0;
    this._optionFrame.appendChild(div);

    MA.DOM.addClass(this._optionFrame, "none");
    ddContainer.appendChild(this._optionFrame);
    dlContainer.appendChild(dtContainer);
    dlContainer.appendChild(ddContainer);

    dtContainer = MA.DOM.create("dt");
    ddContainer = MA.DOM.create("dd");
    this._radioFile = MA.DOM.create("input");
    MA.DOM.addClass(this._radioFile, "normalcheck");
    this._radioFile.setAttribute("type", "radio");
    this._radioFile.setAttribute("name", "gsi_loadoutsidetiledialog");
    this._radioFile.setAttribute("id", "gsi_loadoutsidetiledialog_file");

    MA.DOM.on(this._radioUrl, "click", MA.bind(this._onRadioClick, this));
    MA.DOM.on(this._radioFile, "click", MA.bind(this._onRadioClick, this));

    var labelFile = MA.DOM.create("label");
    labelFile.innerHTML = "保存した設定ファイルを選択";
    labelFile.setAttribute("for", "gsi_loadoutsidetiledialog_file");

    dtContainer.appendChild(this._radioFile);
    dtContainer.appendChild(labelFile);

    ddContainer.appendChild(this._createFileArea());

    dlContainer.appendChild(dtContainer);
    dlContainer.appendChild(ddContainer);

    var msgFrame = MA.DOM.create("div");
    MA.DOM.addClass(msgFrame, "msg_frame");
    msgFrame.innerHTML = "※国土地理院以外の機関が配信しているデータをご利用の際は、当該データの利用規約に従いご利用ください。";

    divContainer.appendChild(dlContainer);
    divContainer.appendChild(msgFrame);
    MA.DOM.addClass(divContainer,"outside-panel");
    return divContainer;
  }

  _createFileArea() {
    var table = MA.DOM.create("table");
    this._inputFile = MA.DOM.create("input");
    this._inputFile.setAttribute("type", "file");
    MA.DOM.on(this._inputFile, "change", MA.bind(this._onFileInputChange, this));
    this._inputFile.setAttribute("disabled", "disabled");

    var tr = MA.DOM.create("tr");
    var th = MA.DOM.create("th");
    var td = MA.DOM.create("td");
    this._fileInputFrame = MA.DOM.create("div");
    MA.DOM.addClass(this._fileInputFrame, "file");

    this._fileInputFileName = MA.DOM.create("div");
    this._fileInputFileName.innerHTML = 'ファイルを選択して下さい';
    MA.DOM.addClass(this._fileInputFileName, "nofile");

    this._fileInputFrame.appendChild(this._fileInputFileName);

    MA.DOM.addClass(th,"filename");
    th.innerHTML = 'ファイル';
    this._fileInputFrame.appendChild(this._inputFile);
    td.appendChild(this._fileInputFrame);
    tr.appendChild(th);
    tr.appendChild(td);
    table.appendChild(tr);
    return table;
  }

  _createOtFooter() {
    var buttonContainer = MA.DOM.create("div");
    MA.DOM.addClass(buttonContainer, "footer");
    this._commitButton = MA.DOM.create("button");
    this._commitButton.setAttribute("href", "javascript:void(0);");
    this._commitButton.innerHTML = "上記の内容で読込開始";
    buttonContainer.appendChild(this._commitButton);
    MA.DOM.on(this._commitButton, "click", MA.bind(this._load,this));    
    return buttonContainer;
  }

  _onRadioClick() {
    if(this._radioUrl.checked) {
      this._layerNameInput.removeAttribute("disabled");
      this._urlInput.removeAttribute("disabled");
      this._tmsInput.removeAttribute("disabled");
      this._inputFile.setAttribute("disabled", "disabled");
    } else {
      this._layerNameInput.setAttribute("disabled", "disabled");
      this._urlInput.setAttribute("disabled", "disabled");
      this._tmsInput.setAttribute("disabled", "disabled");
      this._inputFile.removeAttribute("disabled");
    }
  }

  _onFileInputChange(e){
    this._files = this._inputFile.files;

    var lang = GSIBV.application.lang;
    var dialogLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.OPENSTYLEDIALOG;

    if (!this._files || this._files.length <= 0) {
      this._fileInputFileName.innerHTML = dialogLang["noselect"];
      MA.DOM.addClass(this._fileInputFileName, "nofile");
    } else {
      this._fileInputFileName.innerHTML = this._files[0].name;
      MA.DOM.removeClass(this._fileInputFileName, "nofile");
    }
  }
  _resize(){
    var dialog = MA.DOM.find( document.body, ".out-side-tile" )[0];
    if (this.iconspan.className.indexOf("icon-rotate") >= 0) {
      dialog.style.height ="400px"
    } else {
      dialog.style.height ="320px"
    }
  }
  _onOptionBtnClick(){
    if (this.iconspan.className.indexOf("icon-rotate") >= 0) {
      MA.DOM.removeClass(this.iconspan, "icon-rotate");
      MA.DOM.addClass(this._optionFrame, "none");
    } else {
      MA.DOM.addClass(this.iconspan, "icon-rotate");
      MA.DOM.removeClass(this._optionFrame, "none");
    }
    this._resize();
  }
  _url2LayerType(url) {
    if (Array.isArray(url)) {

      for (var i = 0; i < url.length; i++) {
        if (url[i].match(/\.webm$/) || url[i].match(/\.mp4$/)) return "videooverlay";
      }

      return "";
    }
    if (!url) return "";
    url = $.trim(url);

    if (url.match(/\{tms\}/)) {
      return "tms";
    }

    if (url.match(/photoprot\.php/)) {
      return "kml";
    }

    if (url.match(/\.tif$/) || url.match(/\.tiff$/)) {
      return "geotiff";
    }

    if (url.match(/\.webm$/) || url.match(/\.mp4$/)) {
      return "videooverlay";
    }
    var ext = "";
    var layerType = "";
    var matchResult = url.match(/.*\.([^.]+$)/);
    // 拡張子
    if (matchResult) ext = matchResult[1]

    // kml
    if (ext == "kml") {
      layerType = "kml";
      return layerType;
    }

    // タイルかどうか
    if (url.match(/(\{x\})/)) {
      switch (ext) {
        case "geojson":
          layerType = "geojson_tile";
          break;
        case "topojson":
          layerType = "topojson_tile";
          break;
        default:
          layerType = "tile";
          break;
      }
    }
    else {
      switch (ext) {
        case "geojson":
        case "topojson":
        case "kml":
          layerType = ext;
          break;
      }
    }

    return layerType;
  }
 //読み込み
  _load() {
    if (this._queue) return;

    if (this._radioUrl.checked) {

      var title = $.trim(this._layerNameInput.value);
      var url = $.trim(this._urlInput.value);
      var isTMS = this._tmsInput.checked;

      var layerType = this._url2LayerType(url);

      if (layerType != "tile") {
        this._loadFinish(layerType != "tile" ? "タイルのURLを正しく入力して下さい\n" : "");
        return;
      }

      if (title == "") title = "外部タイル";

      var layerInfo = {
        url: url,
        title: title,
        tms: isTMS,
        layertype: layerType
      };

      if (this._minZoomSelect.value != "") {
        layerInfo.minzoom = parseInt(this._minZoomSelect.value);
        layerInfo.minZoom = layerInfo.minzoom;
      }
      if (this._maxZoomSelect.value != "") {
        layerInfo.maxzoom = parseInt(this._maxZoomSelect.value);
        layerInfo.maxZoom = layerInfo.maxzoom;
      }
      if (this._maxNativeZoomSelect.value != "") layerInfo.maxNativeZoom = parseInt(this._maxNativeZoomSelect.value);

      this._urlInput.value = "";
      this._layerNameInput.value = "";
      this._tmsInput.setAttribute("checked", false);
      this._minZoomSelect.value = "";
      this._maxZoomSelect.value = "";
      this._maxNativeZoomSelect.value = "";

      this._appendToLayerList([layerInfo]);
      this._outLayerButtonShow();
    } else {
      if (!this._files || this._files.length <= 0) {
        this._loadFinish("ファイルを選択して下さい");
        return;
      }

      var reader = new FileReader();
      reader.onload = MA.bind(function () {
        this._fileLoading = false;
        var text = reader.result;
        try {
          var json = JSON.parse(text);
          var list = this._layersTextToLayerList(json);
          this._appendToLayerList(list);
        }
        catch (e) {
          this._loadFinish("layers.txt形式のファイルを指定して下さい");
        }
      }, this);

      reader.readAsText(this._files[0]);
      this._outLayerButtonShow();
    }
  }

  // 読み込み終了
  _loadFinish (msg) {
    if (! this.dialog){
      this.dialog = new GSIBV.UI.Dialog.Alert();
    }    
    this.dialog.autoDestroy = true;
    this.dialog.show("エラー", msg, [
      { "id": "ok", "title": "閉じる" }
    ]);
  }

  _appendToLayerList(infoList) {
    for (var i = 0; i< infoList.length; i++){
      var  layerInfo = infoList[i];
      layerInfo["tileSize"] = 256;
      layerInfo["isOutside"] = true;
      layerInfo["id"] = "out-side-tile"+ "-" + this.num;
      this.num++;
      var layer = new GSIBV.Map.Layer.Raster(layerInfo);
      this._map.addLayer(layer);
    }
  }

  _layersTextToLayerList (json) {
    var result = [];

    if (json.layers) {
      this._findLayer(json.layers, result);
    }
    return result;
  }

  // layersJSON内のレイヤー列挙
  _findLayer (arr, result) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i]["type"] == "LayerGroup") {
        if (arr[i]["entries"]) {
          this._findLayer(arr[i]["entries"], result);
        }
      } else if (arr[i]["type"] == "Layer") {
        var layerType = this._url2LayerType(arr[i]["url"]);

        if (layerType == "tile") {
          var item = {
            "type": "Layer",
            "url": arr[i]["url"],
            "title": arr[i]["title"]
          };

          if (arr[i]["minzoom"] || arr[i]["minZoom"]){
            item["minZoom"] = arr[i]["minZoom"];
            item["minzoom"] = arr[i]["minZoom"];
          }
          if (arr[i]["maxzoom"] || arr[i]["maxZoom"]) {
            item["maxZoom"] = arr[i]["maxZoom"];
            item["maxzoom"] = arr[i]["maxZoom"];
          }
            
          if (arr[i]["maxNativeZoom"] || arr[i]["maxNativeZoom"])
            item["maxNativeZoom"] = arr[i]["maxNativeZoom"];
          if (arr[i]["tms"])
            item["tms"] = arr[i]["tms"];

          result.unshift(item);
        }
      }
    }
  }
  _outLayerButtonShow(){
    if(!this._outbtn){
      this._outbtn =MA.DOM.find( document.body, "#layer-list .out-button" )[0];
      MA.DOM.on(this._outbtn, "click", MA.bind(this._outButtonClick, this));
    }
    this._outbtn.style.display= "";
  }
  _outLayerButtonHide(){
    if(!this._outbtn){
      this._outbtn =MA.DOM.find( document.body, "#layer-list .out-button" )[0];
      MA.DOM.on(this._outbtn, "click", MA.bind(this._outButtonClick, this));
    }
    this._outbtn.style.display= "none";
  }
  
  _outButtonClick(){
    if ( !this._saveFileDialog) {
      this._saveFileDialog = new GSIBV.UI.Dialog.SaveFileDialog(
        "外部タイル設定保存", GSIBV.UI.Dialog.SaveFileDialog.FILE_TEXT);
    }
    var layersJSON = {
      "layers": [
        {
          "type": "LayerGroup",
          "title": "外部タイル",
          "entries": []
        }
      ]
    };
    
    var tileList = this._map._layerList._list;
    for (var i = 0; i < tileList.length; i++) {
      var item = tileList[i];

      if (!item._isOutside) continue;

      var entry = {
        "type": "Layer",
        "title": item.title,
        "url": item.url
      };
      if (item.minZoom || item.minZoom == 0) entry.minZoom = item.minZoom;
      if (item.maxZoom || item.maxZoom == 0) entry.maxZoom = item.maxZoom;
      if (item.maxNativeZoom || item.maxNativeZoom == 0) entry.maxNativeZoom = item.maxNativeZoom;
      if (item.tms) entry.tms = true;

      layersJSON.layers[0].entries.unshift(entry);

    }
    var layersJSONText = JSON.stringify(layersJSON, null, "  ");

    this._saveFileDialog.show(MA.getTimestampText("layers") + ".txt",layersJSONText);
  }
};

/*****************************************************************
 * GSIBV.UI.Dialog.EditOutsideTileDialog
 * 外部タイル情報編集ダイアログ管理
******************************************************************/
GSIBV.UI.Dialog.EditOutsideTileDialog = class extends GSIBV.UI.Dialog.Modeless {
  constructor(map) {
    super();
    this._map = map;
    this._size.width = 320;    
    this._size.height = 280;
    this._position = {left:242,top:340};
  }

  _createHeader(headerContainer) {
    super._createHeader(headerContainer);
    this._titleContainer = MA.DOM.create("div");
    this._titleContainer.innerHTML = "外部タイル編集";
    headerContainer.appendChild(this._titleContainer);

    this._closeButton = MA.DOM.create("button");
    MA.DOM.addClass(this._closeButton, "close-button");

    MA.DOM.on(this._closeButton, "click", MA.bind(this._onCloseClick, this));
    headerContainer.appendChild(this._closeButton);
  }

  _createContents(contentsContainer) {
    MA.DOM.addClass(contentsContainer, "-gsibv-relief-contents");
    this._contentContainer = this._createOtContents();
    this._footerContainer = this._createOtFooter();
    contentsContainer.appendChild(this._contentContainer);
    contentsContainer.appendChild(this._footerContainer);
  }

  _createOtFooter() {
    var buttonContainer = MA.DOM.create("div");
    MA.DOM.addClass(buttonContainer, "footer");
    this._commitButton = MA.DOM.create("button");
    this._commitButton.setAttribute("href", "javascript:void(0);");
    this._commitButton.innerHTML = "上記の内容で変更";
    buttonContainer.appendChild(this._commitButton);
    MA.DOM.on(this._commitButton, "click", MA.bind(this._load,this));    
    return buttonContainer;
  }
  _createOtContents() {
    var divContainer = MA.DOM.create("div");
    var dlContainer = MA.DOM.create("dl");
    var dtContainer = MA.DOM.create("dt");
    var ddContainer = MA.DOM.create("dd");
    var div = null;
    var span = null;
    var option = null;
 
    div = MA.DOM.create("div");
    div.innerHTML = "レイヤー名:";
    this._layerNameInput = MA.DOM.create("input");
    MA.DOM.addClass(this._layerNameInput,"title");
    this._layerNameInput.setAttribute("type", "text");
    this._layerNameInput.setAttribute("placeholder", "表示名称");
    ddContainer.appendChild(div);
    ddContainer.appendChild(this._layerNameInput);

    div = MA.DOM.create("div");
    div.innerHTML = "URL:";
    ddContainer.appendChild(div);

    div = MA.DOM.create("div");
    this._urlInput = MA.DOM.create("textarea");
    this._urlInput.setAttribute("placeholder", "例:https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png");
    div.appendChild(this._urlInput);
    ddContainer.appendChild(div);

    div = MA.DOM.create("div");
    this._tmsInput =  MA.DOM.create("input");
    MA.DOM.addClass(this._tmsInput, "normalcheck");
    this._tmsInput.setAttribute("type", "checkbox");
    this._tmsInput.setAttribute("id", "gsi_editoutsidetiledialog_tms");
    var labelCheck = MA.DOM.create("label");
    labelCheck.innerHTML = "南西原点";
    labelCheck.setAttribute("for", "gsi_editoutsidetiledialog_tms");

    div.appendChild(this._tmsInput);
    div.appendChild(labelCheck);
    ddContainer.appendChild(div);

    div = MA.DOM.create("div");
    span = MA.DOM.create("span");
    span.innerHTML = "minZoom:";
    this._minZoomSelect = MA.DOM.create("select");
    option = MA.DOM.create("option");
    this._minZoomSelect.appendChild(option);
    for (var i = 2; i <= 24; i++) {
      option = MA.DOM.create("option");
      option.setAttribute("value", i);
      option.innerHTML = i;
      this._minZoomSelect.appendChild(option);
    }
    div.appendChild(span);
    div.appendChild(this._minZoomSelect);
    span = MA.DOM.create("span");
    span.innerHTML = "maxZoom:";
    this._maxZoomSelect = MA.DOM.create("select");
    this._maxZoomSelect .style.marginRight = 0;
    option = MA.DOM.create("option");
    this._maxZoomSelect.appendChild(option);
    for (var i = 2; i <= 24; i++) {
      option = MA.DOM.create("option");
      option.setAttribute("value", i);
      option.innerHTML = i;
      this._maxZoomSelect.appendChild(option);
    }
    div.appendChild(span);
    div.appendChild(this._maxZoomSelect);
    ddContainer.appendChild(div);

    div = MA.DOM.create("div");
    span = MA.DOM.create("span");
    span.innerHTML = "maxNativeZoom:";
    this._maxNativeZoomSelect = MA.DOM.create("select");
    option = MA.DOM.create("option");
    this._maxNativeZoomSelect.appendChild(option);
    for (var i = 2; i <= 24; i++) {
      option = MA.DOM.create("option");
      option.setAttribute("value", i);
      option.innerHTML = i;
      this._maxNativeZoomSelect.appendChild(option);
    }
    div.appendChild(span);
    div.appendChild(this._maxNativeZoomSelect);
    div.style.marginBottom = 0;
    ddContainer.appendChild(div);

    dlContainer.appendChild(dtContainer);
    dlContainer.appendChild(ddContainer);

    divContainer.appendChild(dlContainer);
    MA.DOM.addClass(divContainer,"outside-panel");
    return divContainer;
  }

  show(layer) {
    super.show();
    this._oldLayer = layer;
    this._urlInput.value = layer.url;
    this._layerNameInput.value = layer.title;
    this._tmsInput.checked = layer._tms;
    this._minZoomSelect.value = layer.minZoom;
    this._maxZoomSelect.value = layer.maxZoom;
    this._maxNativeZoomSelect.value = layer.maxNativeZoom;
  }

  _onCloseClick() {
    this.hide();
  }

  _load() {
    var oldId = this._oldLayer.id;
    var oldIndex = this._map.layerList.getLayerIndexById(oldId);

    var title = $.trim(this._layerNameInput.value);
    var url = $.trim(this._urlInput.value);
    var isTMS = this._tmsInput.checked;
    var layerType = this._url2LayerType(url);
    if (layerType != "tile") {
      this._loadFinish(layerType != "tile" ? "タイルのURLを正しく入力して下さい\n" : "");
      return;
    }

    if (title == "") title = "外部タイル";

    var layerInfo = {
      url: url,
      title: title,
      tms: isTMS,
      layertype: layerType
    };

    if (this._minZoomSelect.value != "") {
      layerInfo.minzoom = parseInt(this._minZoomSelect.value);
      layerInfo.minZoom = layerInfo.minzoom;
    }
    if (this._maxZoomSelect.value != "") {
      layerInfo.maxzoom = parseInt(this._maxZoomSelect.value);
      layerInfo.maxZoom = layerInfo.maxzoom;
    }
    if (this._maxNativeZoomSelect.value != "") layerInfo.maxNativeZoom = parseInt(this._maxNativeZoomSelect.value);

    GSIBV.application._map.layerList.remove(this._oldLayer);
    layerInfo.id = oldId;

    this._appendToLayer(layerInfo, oldIndex);
    this.hide();
  }

  _appendToLayer(layerInfo, index) {
    layerInfo["tileSize"] = 256;
    layerInfo["isOutside"] = true;
    this.num++;
    var layer = new GSIBV.Map.Layer.Raster(layerInfo);

    this._map.addLayer(layer, index >= 0? index: undefined);
  }

  // 読み込み終了
  _loadFinish (msg) {
    if (! this.dialog){
      this.dialog = new GSIBV.UI.Dialog.Alert();
    }    
    this.dialog.autoDestroy = true;
    this.dialog.show("エラー", msg, [
      { "id": "ok", "title": "閉じる" }
    ]);
  }

  _url2LayerType(url) {
    if (Array.isArray(url)) {

      for (var i = 0; i < url.length; i++) {
        if (url[i].match(/\.webm$/) || url[i].match(/\.mp4$/)) return "videooverlay";
      }

      return "";
    }
    if (!url) return "";
    url = $.trim(url);

    if (url.match(/\{tms\}/)) {
      return "tms";
    }

    if (url.match(/photoprot\.php/)) {
      return "kml";
    }

    if (url.match(/\.tif$/) || url.match(/\.tiff$/)) {
      return "geotiff";
    }

    if (url.match(/\.webm$/) || url.match(/\.mp4$/)) {
      return "videooverlay";
    }
    var ext = "";
    var layerType = "";
    var matchResult = url.match(/.*\.([^.]+$)/);
    // 拡張子
    if (matchResult) ext = matchResult[1]

    // kml
    if (ext == "kml") {
      layerType = "kml";
      return layerType;
    }

    // タイルかどうか
    if (url.match(/(\{x\})/)) {
      switch (ext) {
        case "geojson":
          layerType = "geojson_tile";
          break;
        case "topojson":
          layerType = "topojson_tile";
          break;
        default:
          layerType = "tile";
          break;
      }
    }
    else {
      switch (ext) {
        case "geojson":
        case "topojson":
        case "kml":
          layerType = ext;
          break;
      }
    }

    return layerType;
  }
};

