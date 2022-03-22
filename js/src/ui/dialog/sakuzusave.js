GSIBV.UI.Dialog.SakuzuSaveDialog = class extends GSIBV.UI.Dialog.Modal {
  constructor(drawManager) {
    super();
    this._dialogs = [];
    this._frameClass = ["sakuzusavedialog"];
    this._title = "ファイル形式を選択して下さい";
    this._fileType = "";
    this._msg = "保存";
    this._drawManager = drawManager;

    this._buttons = [
      { id: "ok", title: "上記の内容で保存" },
      { id: "no", title: "戻る" },
    ];
  }

  set data(data) {
    this._data = data;
  }

  show() {
    super.show();
    this._initializeLang();
    this._kmlRadio.prop('checked', false);
    this._geojsonRadio.prop('checked', false);
    this._textarea.val("");
    $(".sakuzusavedialog .footer button").first().prop( "disabled", true);
    this._drawManager._styleId = 1;
  }

  _initializeLang() {
    var lang = GSIBV.application.lang;

    var dialogLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.SAKUZUSAVEDIALOG;

    this._titleContainer.innerHTML = this._title; //dialogLang["title"];

    for (var i = 0; i < this._buttons.length; i++) {
      if (this._buttons[i].id == "ok") {
        this._buttons[i].element.innerHTML = dialogLang["ok"];
      } else if (this._buttons[i].id == "no") {
        this._buttons[i].element.innerHTML = dialogLang["cancel"];
      }
    }
  }
  _beforeShow() {
    var frameSize = this.size;
    var size = this._getContentsSize();
    var height = frameSize.height + size.height + 6;
    this._frame.style.height = frameSize.height + size.height + 6 + "px";
    this._frame.style.marginLeft = -Math.round(frameSize.width / 2) + "px";
    this._frame.style.marginTop = -Math.round(height / 2) + "px";
  }

  _createHeader(headerContainer) {
    super._createHeader(headerContainer);
    this._titleContainer = MA.DOM.create("div");
    this._titleContainer.innerHTML = this._title;
    headerContainer.appendChild(this._titleContainer);
  }

  _createContents(contentsContainer) {
    var desp = $("<div>")
      .addClass("small")
      .html(
        "「TEXT」および「マーカー(円)」で作図した内容はGeoJSON形式でのみ保存可能です。"
      );

    this._contents.appendChild(desp[0]);
    var selectframe = $("<div>").addClass("selectframe");
    this._kmlRadio = $("<input>")
      .attr({
        id: "type_kml",
        name: "sakuzu_save_file_type",
        value: "kml",
        type: "radio",
      })
      .addClass("normalcheck");
    var label = $("<label>").attr({ for: "type_kml" }).html("KML形式");
    selectframe.append(this._kmlRadio).append(label);

    this._geojsonRadio = $("<input>")
      .attr({
        id: "type_geojson",
        name: "sakuzu_save_file_type",
        value: "geojson",
        type: "radio",
      })
      .addClass("normalcheck");
    label = $("<label>").attr({ for: "type_geojson" }).html("GeoJSON形式");
    selectframe.append(this._geojsonRadio).append(label);
    this._contents.appendChild(selectframe[0]);

    var textareaFrame = $("<div>").addClass("textarea-frame");
    this._textarea = $("<textarea>");
    textareaFrame.append(this._textarea);
    this._contents.appendChild(textareaFrame[0]);

    MA.DOM.on( this._kmlRadio[0], "click", MA.bind(this._onTypeSelect, this, this._kmlRadio[0].value) );
    MA.DOM.on( this._geojsonRadio[0], "click", MA.bind(this._onTypeSelect, this, this._geojsonRadio[0].value) );

  }

  _onTypeSelect(type) {
    this._fileType = type;
    if(type==="kml") {
      var kml = this._drawManager.kml;
      if ( !kml ) {
        this._textarea.val("");
        $(".sakuzusavedialog .footer button").first().prop( "disabled", true );
        return;
      };
      this._textarea.val(kml);
      $(".sakuzusavedialog .footer button").first().prop( "disabled", false);
      return;
    }
    if(type==="geojson") {
      var geoJSON = this._drawManager.geoJSONText;
      if ( !geoJSON ) {
        this._textarea.val("");
        $(".sakuzusavedialog .footer button").first().prop( "disabled", true );
        return;
      };
      var text = JSON.stringify( geoJSON, null, "  " );
      this._textarea.val(text);
      $(".sakuzusavedialog .footer button").first().prop( "disabled", false);
      return;
    }
  }

  _onButtonClick(btnInfo) {
    this.hide();
    if (btnInfo.id == "no") {
      return;
    }
    this._save();
  }

  _save() {
    if(this._fileType==="kml") {
      if ( !this._saveKmlDialog) {
        this._saveKmlDialog = new GSIBV.UI.Dialog.SaveFileDialog(
          "KML形式で保存", GSIBV.UI.Dialog.SaveFileDialog.FILE_TEXT);
      }
      this._saveKmlDialog.show(MA.getTimestampText("gsi") + ".kml",this._textarea.val());
      return;
    }
    if(this._fileType==="geojson") {
      if ( !this._saveGeojsonDialog) {
        this._saveGeojsonDialog = new GSIBV.UI.Dialog.SaveFileDialog(
          "作図した情報をGeoJSON形式で保存", GSIBV.UI.Dialog.SaveFileDialog.FILE_JSON);
      }
      this._saveGeojsonDialog.show(MA.getTimestampText("gsi") + ".geojson",this._textarea.val());
    }
  }
};
