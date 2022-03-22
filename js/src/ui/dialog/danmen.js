GSIBV.UI.Dialog.DanmenDialog = class extends GSIBV.UI.Dialog.Modeless {

  constructor(options) {
    super(options);
    this._align = "right";
    this._position = {left:242,top:266};
    this._size.width = 290;
    this._size.height = 180;
    this._map = (options ? options.map: undefined);
    var dialogManager = GSIBV.UI.Dialog.Modeless.Manager.get();
    var frameSize = MA.DOM.size( dialogManager.frame );

    this._position = {left:frameSize.width-this._size.width-4,top:39};
    this._resizable = false;
    this._current = null;
    this._frameClass = ["-gsibv-danmen-dialog"];
    this._useDEMTileList = ["DEM5A", "DEM5B", "DEM5C", "DEM10B", "DEMGM"];
  }


  show() {
    this._buttons = [];
    this._adjustContents();
    
    super.show();
    this._draw(GSIBV.Map.Draw.DanmenLine.Type);
  }


  refreshSize() {

    const rect = this._contents.getBoundingClientRect();
    const headerRect = this._header.getBoundingClientRect();
    const footerRect = this._footer.getBoundingClientRect();
    this._frame.style.height = (rect.height + (headerRect.height + footerRect.height + 10)) + "px";
  }

  hide() {
    if(this._displayDialog) {
      this._displayDialog.hide();
    }
    this._map.drawManager.stopDraw();
    this._map.drawManager.stopEdit();
    super.hide();
  }

  _onAreaValid = (e) => {
    this.showSizeAreaFrame();
    const elem = MA.DOM.find(this._contentsInner, ".saveimage-message")[0];
    elem.innerHTML="";
    elem.style.display = "none";

    if ( e && e.params && e.params.rotate ) {
      
      MA.DOM.find( this._contentsInner, ".saveimage-size-frame" )[0].classList.add("rotate");
      this.showMessage("回転中は緯度、経度の範囲を表示できません。", true);
    } else {
      
      MA.DOM.find( this._contentsInner, ".saveimage-size-frame" )[0].classList.remove("rotate");
      this.showMessage("", false);
    }

    this.enableButton(0);
    this.refreshSize();
  }


  showMessage(msg,resetRotate ) {

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


  _resize() {
    this._adjustContents();
    //this._updateScroll();
  }


  _draw(type) {
    
    var proc = MA.bind(function(type){
      if ( this._map.drawManager.drawer) {
        this._map.drawManager.stopDraw();
      }
      this._map.drawManager.draw(type);
      
    },this,type);
    

    proc();
  }
  _adjustContents() {
    if (!this._frame ) return;
    var visible = !(this._frame.style.display == 'none' );

    if ( !visible ) {
      this._frame.style.visibility = 'hidden';
      this._frame.style.display = '';
    }


    if ( !visible ) {
      this._frame.style.display = 'none';
      this._frame.style.visibility = 'visible';
    }
  }

  
  _createHeader(headerContainer) {
    this._titleContainer = MA.DOM.create("div");
    this._titleContainer.innerHTML = "断面図";
    headerContainer.appendChild(this._titleContainer);
    super._createHeader(headerContainer);

  }

  get mode() {
    const radioList = MA.DOM.find(this._contentsInner, "input.saveimage-area-mode");
    for( let i=0; i<radioList.length; i++ ) {
      const radio = radioList[i];
      if ( radio.checked ) {
        return radio.value;
      }
    }

  }

  // ダイアログの中身生成
  _create() {
    super._create();

    if ( this._contentsInner) {
      // this._onModeSelect(this.mode);
      return;
    }
    
    // const frame = MA.DOM.select( "#template .dialog-danmen")[0].cloneNode(true)
    this._createContent();
    this._contents.appendChild( this.frame[0] );



    this._contentsInner= this.frame[0];

    // const btnSetArea = MA.DOM.find(frame, "a.set-area");
    // const btnSelectFile = MA.DOM.find(frame, "input.select-file");
    // const btnOptionToggle = MA.DOM.find(frame, "a.option-toggle-button");
    // MA.DOM.on( btnOptionToggle, "click", MA.bind(this._onOptionToggle, this) );
    this.on("graphcreatestart", MA.bind(this._onGraphCreateStart, this));
    this.on("graphcreated", MA.bind(this._onGraphCreate, this));
  }
  _createContent() {
    this.frame = $('<div>').addClass("dialog-content").css({ "position": "relative", "padding": "8px" });

    var title = $("<div>").addClass("title").html("操作方法");
    this.frame.append(title);

    var wrapper = $("<div>").addClass("wrapper");
    // 経路指定
    wrapper.append($("<div>").addClass("description").html("地図上をクリック(タップ)して経路を指定"));

    var clearButton = $("<a>").addClass("set-area").attr({ "href": "javascript:void(0);" }).html("指定をクリア")
      .on("click", MA.bind(function () {

        if (this._displayDialog) this._displayDialog.hide();
        if (this._blind) this._blind.hide();
        if (this._msg) this._msg.hide();
        this._draw(GSIBV.Map.Draw.DanmenLine.Type);
        // this._map.drawManager.stopDraw();
        // this._map.drawManager.draw(GSIBV.Map.Draw.DanmenLine.Type);
      }, this));
    wrapper.append(clearButton);


    // ファイル読み込み
    wrapper.append($("<div>").addClass("description").html("又は既存のGeoJSON,KMLファイルを選択"));

    this._vectorFileInput = $("<input>").attr({ "type": "file" });
    wrapper.append(this._vectorFileInput);

    
    this._vectorFileInput.change(MA.bind(function(e){
      console.log(e.target.files);
      if (e.target.files && e.target.files.length > 0) {
        this._load(e.target.files[0]);
      }
    }, this));


    // ライン選択
    this._lineSelectFrame = $("<div>").addClass("lineselect").css({ "z-index": 1000, "position": "absolute", "background": "#ffffff", "left": 0, "top": 0, "right": 0, "bottom": 0 }).hide();

    this._lineSelectFrameMsg = $("<div>").addClass("message").html("断面図を表示する経路を地図上から選択してください。");
    this._lineSelectFrame
      .append($("<img>").attr({ "src": "image/system/info.png" })).append(this._lineSelectFrameMsg);


    var backButton = $("<a>").addClass("normalbutton").attr({ "href": "javascript:void(0);" }).html("経路指定画面に戻る");
      // .on("click", L.bind(function () {

      //   if (this._displayDialog) this._displayDialog.hide();
      //   if (this._vectorSelector) this._vectorSelector.destroy();

      //   this._vectorSelector = null;

      //   this._crossSectionView.restart();
      //   this._vectorFileInput.val("");
      //   this._lineSelectFrame.fadeOut(200);
      // }, this));
    this._lineSelectFrame.append(
      $("<div>").addClass("btnframe")
        .append(backButton)
    );


    this.frame.append(this._lineSelectFrame);


    // オプション
    this._optionToggleButton = $("<a>")
      .attr({ "href": "javascript:void(0);" }).html("オプション").addClass("option-toggle-button")
      .click(MA.bind(function () {
        var dialog = MA.DOM.find( document.body, ".-gsibv-danmen-dialog" )[0];
        if (this._optionFrame.is(":visible")) {
          this._optionFrame.slideUp(300);
          this._optionToggleButton.removeClass("open");
          dialog.style.height = "180px";
        } else {
          this._optionFrame.slideDown(300);
          this._optionToggleButton.addClass("open");
          dialog.style.height = "400px";
        }
      }, this));

    wrapper.append(this._optionToggleButton);
    this._optionFrame = $("<div>").hide().addClass("option-container");

    var message = $("<div>").addClass("message").html("断面図に使用するデータを選択")
    this._optionFrame.append(message);

    // リンク

    var linkFrame = $("<div>");
    var link = $("<a>")
      .attr({ "target": "_blank", "href": "https://maps.gsi.go.jp/development/hyokochi.html" })
      .html("データについて").addClass("link")
    linkFrame.append(link);

    this._optionFrame.append(linkFrame);

    // 一覧
    this._optionDEMCheckList = [];

    var __createOption = MA.bind(function (name) {
      var id = "dialog_dem_" + name;
      var frame = $("<div>");
      var input = $("<input>").data({ "demid": name }).attr({ "type": "checkbox", "id": id }).val(name).addClass("normalcheck");
      var label = $("<label>").attr({ "for": id }).html(name);
      frame.append(input).append(label);

      if (this._useDEMTileList.indexOf(name) >= 0) {
        input[0].checked = true;
      }
      input.on("click", MA.bind(this._onUseDemChange, this));
      // label.on("click", MA.bind(this._onUseDemChange, this));
      // $("#"+id).click(function(e){
      //   console.log(e.target.checked);
      //   $("#"+id).prop('checked', e.target.checked);
      // })
      this._optionDEMCheckList.push(input);
      return frame;
    }, this);

    this._optionFrame.append(__createOption("DEM5A"));
    this._optionFrame.append(__createOption("DEM5B"));
    this._optionFrame.append(__createOption("DEM5C"));
    this._optionFrame.append(__createOption("DEM10B"));
    this._optionFrame.append(__createOption("DEMGM"));

    // メッセージ２

    var message2 = $("<div>").html("選択したもののうち、その地点における最も精度の良いデータを用いて断面図を作成します。").addClass("message2")
    this._optionFrame.append(message2);

    wrapper.append(this._optionFrame);

    this.frame.append(wrapper);
    return this.frame;
  }
  _load(file) {
    var reader = new FileReader();
    reader.onload = MA.bind(function (e) {
      console.log(e);
      var text = reader.result;
      var json = null;
      try {
        json = JSON.parse(text);
      }
      catch (e) {
        //kml
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

      }

      if(!json.features || json.features.length==0 || json.features[0].geometry.type!="LineString") {
        console.log("Not LineString");
        return;
      }
      this._map.drawManager.drawer._load(json);
      var bounds = this._map.drawManager.drawer.feature.bounds;
      var lnglatBounds = new mapboxgl.LngLatBounds(
        new mapboxgl.LngLat(bounds.northWest.lng, bounds.northWest.lat),
        new mapboxgl.LngLat(bounds.southEast.lng, bounds.southEast.lat)
      );
      var size = MA.getScreenSize();
      var maxZoom = 11;
      if ( this._map.map.getZoom() >= 11 ) maxZoom = this._map.map.getZoom();
      this._vectorFileInput.val(null);
      this._map.map.fitBounds(lnglatBounds,{
        speed: 2,
        curve: 1.5,
        maxZoom: maxZoom,
        padding:size.width > 300 && size.height > 300 ? 100 : 0});

    }, this);

    reader.readAsText(file);

  }
  _onUseDemChange() {
    console.log("clicked!");
    this._useDEMTileList = [];
    for (var i = 0; i < this._optionDEMCheckList.length; i++) {
      var input = this._optionDEMCheckList[i];
      if (input.is(":checked")) {
        this._useDEMTileList.push(input.data("demid"));
      }
    }
    if (this._displayDialog) {
      this._displayDialog.setUseDEMTileList(this._useDEMTileList);
    }
    // this._crossSectionView.setUseDEMTileList(this._useDEMTileList);
  }
  _onOptionToggle(e) {
    console.log(this);
    console.log(e);
    var dialog = MA.DOM.find( document.body, ".-gsibv-danmen-dialog" )[0];
    const btnOptionToggle = MA.DOM.find(dialog, "a.option-toggle-button")[0];
    const optionContainer = MA.DOM.find(dialog, ".option-container")[0];
    console.log(optionContainer);
    if(MA.DOM.hasClass(btnOptionToggle,"open")) {
      MA.DOM.removeClass(btnOptionToggle,"open");
      MA.DOM.hide(optionContainer);
      dialog.style.height = "180px";
    } else {
      MA.DOM.addClass(btnOptionToggle,"open");
      MA.DOM.show(optionContainer);
      dialog.style.height = "400px";
    }
  }

  // 断面図生成開始前処理
  _onGraphCreateStart(e) {
    if (!this._blind) {
      this._blind = $("<div>").addClass("window_blind");
      this._msg = $("<div>").css({
        "position": "absolute",
        "left": "50%",
        "top": "50%",
        "margin-left": "-90px",
        "padding-left": "34px",
        "display": "none",
        "color": "#ff0000",
        "z-index": 999999,
        "line-height": "32px",
        "background-image": "url(image/system/loading003.gif)",
        "background-position": "0px 50%",
        "background-repeat": "no-repeat"
      }).html("断面図を生成しています");
      $("body").append(this._blind).append(this._msg);
    }


    this._blind.fadeIn(300);
    this._msg.fadeIn(300);
  }
  // 断面図生成開始
  _onGraphCreate(e) {
    this._blind.fadeOut(200);
    this._msg.fadeOut(200);


    if (!e.params || !e.params.graph) {
      if (e.params.msg)
        alert(e.params.msg);
      else
        alert("グラフを作成できません。");
      if (this._displayDialog) this._displayDialog.hide();
      return;
    }



    if (!this._displayDialog) {
      
      this._displayDialog = new GSIBV.UI.Dialog.CrossSectionView({map:this._map});
      
      this._displayDialog.on("hide", MA.bind(function () {

        this._draw(GSIBV.Map.Draw.DanmenLine.Type);
      }, this));
    }
    this._displayDialog.show(e.params.graph);
  }



};








