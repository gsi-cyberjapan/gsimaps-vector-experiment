GSIBV.UI.Dialog.SaveImageAreaSelectDialog = class extends GSIBV.UI.Dialog.Modeless {

  constructor(options) {
    super(options);
    this._align = "right";
    this._position = {left:242,top:266};
    this._size.width = 350;
    this._size.height = 400;
    this._map = (options ? options.map: undefined);
    var dialogManager = GSIBV.UI.Dialog.Modeless.Manager.get();
    var frameSize = MA.DOM.size( dialogManager.frame );

    this._position = {left:frameSize.width-this._size.width-4,top:39};
    this._resizable = false;
    this._current = null;
    this._frameClass = ["-gsibv-saveimage-aeraselect-dialog"];
  }


  show() {
    this._buttons = [
      { "id": "ok", "title": "上記の内容で画像を生成" },
      { "id": "no", "title": "閉じる" }
    ];
    this._adjustContents();
    this._map.on("areaselectorchange", this._onAreaChange);
    this._map.on("areaselectorvalid", this._onAreaValid);
    this._map.on("areaselectorinvalid", this._onAreaInvalid);
    super.show();

    if ( this._sizeTimerId  ) clearTimeout(this._sizeTimerId );
    this._sizeTimerId = setInterval( ()=>{this.refreshSize();},10);
  }


  refreshSize() {

    const rect = this._contents.getBoundingClientRect();
    const headerRect = this._header.getBoundingClientRect();
    const footerRect = this._footer.getBoundingClientRect();
    this._frame.style.height = (rect.height + (headerRect.height + footerRect.height + 10)) + "px";
  }

  hide() {
    this.destroyTimer();
    this._map.off("areaselectorchange", this._onAreaChange);
    this._map.off("areaselectorvalid", this._onAreaValid);
    this._map.off("areaselectorinvalid", this._onAreaInvalid);
    this._map.stopAreaSelect();
    super.hide();
  }

  showSizeAreaFrame () {
    switch(this.mode) {
      case "screen":
        MA.DOM.find( this._contentsInner, ".saveimage-size-frame" )[0].style.display = "none";
        MA.DOM.find( this._contentsInner, ".saveimage-area-frame" )[0].style.display = "none";
        break;
      case "area":
        MA.DOM.find( this._contentsInner, ".saveimage-size-frame" )[0].style.display = "none";
        MA.DOM.find( this._contentsInner, ".saveimage-area-frame" )[0].style.display = "";
        break;
      case "size":
        MA.DOM.find( this._contentsInner, ".saveimage-size-frame" )[0].style.display = "";
        MA.DOM.find( this._contentsInner, ".saveimage-area-frame" )[0].style.display = "none";
        break;
      default:

    }

    this.refreshView();
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

  _onAreaInvalid = (e) => {
    this.disableButton(0);
    this.showMessage(e.params.message);

    if ( e.params.rotate ) {
      MA.DOM.find( this._contentsInner, ".saveimage-size-frame" )[0].style.display = "none";
      MA.DOM.find( this._contentsInner, ".saveimage-area-frame" )[0].style.display = "none";
      this.showMessage(e.params.message, true);
    } else {
      this.showSizeAreaFrame();
    }
    this.refreshSize();
  }

  _onButtonClick(btnInfo) {

    if ( btnInfo.id !== "ok") {
      this.hide();
      return;
    };
    
    const radioList = MA.DOM.find(this._contentsInner, "input.saveimage-area-mode");
    let mode = "";
    let data = undefined;

    for( let i=0; i<radioList.length; i++ ) {
      const radio = radioList[i];

      if ( radio.checked) {
        mode = radio.value;
        break;
      }
      

    }

    if ( mode !== "screen" && this._map.areaSelector ) {
      data = {};
      data.left = this._map.areaSelector.left;
      data.top = this._map.areaSelector.top;
      data.width = this._map.areaSelector.width;
      data.height = this._map.areaSelector.height;

      const range = this._map.areaSelector.range;

      data.northWest = { lat : range.max.lat, lng : range.min.lng};
      data.southEast = { lat : range.min.lat, lng : range.max.lng};
    }


    if ( !this._saveImageDialog) {
      this._saveImageDialog = new GSIBV.UI.Dialog.SaveImageDialog("ファイルを保存する準備が整いました", 
        this._map );
    }

    this._saveImageDialog.show("test.png",data);

  }
  
  _resize() {
    this._adjustContents();
    //this._updateScroll();
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
    this._titleContainer.innerHTML = "画像として保存";
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
      this._onAreaValid();
      this._onModeSelect(this.mode);
      return;
    }
    
    const frame = MA.DOM.select( "#template .saveimage-areaselect")[0].cloneNode(true)
    //MA.DOM.addClass( this._frame, "saveimagedialog");
    this._contents.appendChild( frame );

    const radioList = MA.DOM.find(frame, "input.saveimage-area-mode");
    
    for( let i=0; i<radioList.length; i++ ) {
      const radio = radioList[i];
      const id = MA.getId( "gsi-saveimage-areaselect-mode" );
      const label = MA.DOM.find(frame, "label." + radio.value)[0];
      radio.setAttribute("name","gsi-saveimage-areaselect-mode");
      radio.setAttribute("id",id);
      label.setAttribute("for", id);
      if ( radio.value==="screen") radio.setAttribute("checked", true);

      MA.DOM.on( radio, "click", MA.bind(this._onModeSelect, this, radio.value) );
    }


    this._contentsInner= frame;
    
    this._initInputText( MA.DOM.find(this._contentsInner, '.saveimage-size-frame input[name="image-width"]')[0] );
    this._initInputText( MA.DOM.find(this._contentsInner, '.saveimage-size-frame input[name="image-height"]')[0] );
    
    this._initInputText( MA.DOM.find(this._contentsInner, '.saveimage-area-frame input[name="min-lat"]')[0] );
    this._initInputText( MA.DOM.find(this._contentsInner, '.saveimage-area-frame input[name="max-lat"]')[0] );
    this._initInputText( MA.DOM.find(this._contentsInner, '.saveimage-area-frame input[name="min-lng"]')[0] );
    this._initInputText( MA.DOM.find(this._contentsInner, '.saveimage-area-frame input[name="max-lng"]')[0] );
    


    this._onModeSelect( "screen");
  }

  _initInputText( input ) {

    MA.DOM.on(input, "focus", (e)=>{
      this.destroyTimer();
      this._inputCheckTimer = setInterval(()=>{ this.inputCheck(input)}, 100 );
    });
    MA.DOM.on(input, "blur", ()=>{
      this.destroyTimer();
    });
  }

  inputCheck(input) {

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

  _onModeSelect (mode) {
    
    switch(mode) {
      case "screen":
        this._map.stopAreaSelect();
        MA.DOM.find( this._contentsInner, ".saveimage-size-frame" )[0].style.display = "none";
        MA.DOM.find( this._contentsInner, ".saveimage-area-frame" )[0].style.display = "none";
        this._onAreaValid();
        break;
      case "area":
        MA.DOM.find( this._contentsInner, ".saveimage-size-frame" )[0].style.display = "none";
        MA.DOM.find( this._contentsInner, ".saveimage-area-frame" )[0].style.display = "";
        this._map.startAreaSelect("area");
        break;
      case "size":
        MA.DOM.find( this._contentsInner, ".saveimage-size-frame" )[0].style.display = "";
        MA.DOM.find( this._contentsInner, ".saveimage-area-frame" )[0].style.display = "none";
        this._map.startAreaSelect("size");
        break;
      default:

    }

    this.refreshView();
  }

  _onAreaChange = () => {
    this.refreshView();
  }

  refreshView() {
    const areaSelector = this._map.areaSelector;
    if ( !areaSelector) return;
    const range = areaSelector.range;
    const minLatLng = range.min;
    const maxLatLng = range.max;

    
    MA.DOM.find(this._contentsInner, '.saveimage-size-frame input[name="image-width"]')[0].value=areaSelector.width;
    MA.DOM.find(this._contentsInner, '.saveimage-size-frame input[name="image-height"]')[0].value=areaSelector.height;
    MA.DOM.find(this._contentsInner, ".saveimage-size-frame .min-lat")[0].innerHTML = minLatLng.lat.toFixed(6);
    MA.DOM.find(this._contentsInner, ".saveimage-size-frame .max-lat")[0].innerHTML = maxLatLng.lat.toFixed(6);
    MA.DOM.find(this._contentsInner, ".saveimage-size-frame .min-lng")[0].innerHTML = minLatLng.lng.toFixed(6);
    MA.DOM.find(this._contentsInner, ".saveimage-size-frame .max-lng")[0].innerHTML = maxLatLng.lng.toFixed(6);
    


    MA.DOM.find(this._contentsInner, '.saveimage-area-frame input[name="min-lat"]')[0].value = minLatLng.lat.toFixed(6);
    MA.DOM.find(this._contentsInner, '.saveimage-area-frame input[name="max-lat"]')[0].value = maxLatLng.lat.toFixed(6);
    MA.DOM.find(this._contentsInner, '.saveimage-area-frame input[name="min-lng"]')[0].value = minLatLng.lng.toFixed(6);
    MA.DOM.find(this._contentsInner, '.saveimage-area-frame input[name="max-lng"]')[0].value = maxLatLng.lng.toFixed(6);
    
    MA.DOM.find(this._contentsInner, ".saveimage-area-frame .image-width")[0].innerHTML = areaSelector.width;
    MA.DOM.find(this._contentsInner, ".saveimage-area-frame .image-height")[0].innerHTML = areaSelector.height;


  }


};












GSIBV.UI.Dialog.SaveImageDialog = class extends GSIBV.UI.Dialog.Modal {


  constructor(title, map) {
    super();
    this._dialogs = [];
    this._frameClass = ["savedatadialog", "saveimagedialog"];
    this._title = title;
    this._map = map;
    this._msg = "保存";


  }


  show(fileName, data) {
    this._data = data;
    this._timestamp = MA.getTimestampText();
    super.show();

  }
  

  _getExt (fileName) {
    var parts = fileName.split(".");
    if ( parts.length == 1 ) return "";
    else return "." + parts[parts.length-1];
  }
  _onFileNameBlur() {
    var fileName = this._fileNameInput.value.trim();
    if ( fileName == "" ) {
      this._fileNameInput.value = this._originalFileName;
    } else {
      var ext = this._getExt( fileName );
      if ( fileName.charAt(0) == ".") {
        fileName = this._originalFileName;
      } else {
        if ( ext == ".") {
          fileName += this._ext.replace(".","");

        } else if ( ext == "") {
          fileName += this._ext;
        }
      }
      this._fileName = fileName;
      this._fileNameInput.value = this._fileName;
    }
  }

  _beforeShow() {
    var frameSize = this.size;
    var size = this._getContentsSize();
    var height = (frameSize.height + size.height + 6);
    this._frame.style.height = (frameSize.height + size.height + 6) + "px";
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

    
    const frame = MA.DOM.select( "#template .saveimage")[0].cloneNode(true)
    const checkList = MA.DOM.find(frame, "input.saveimage-credit");
    

    const fileNameInput = MA.DOM.find(frame, "input.filename")[0];
    
    MA.DOM.on( fileNameInput, "focus", () =>{
      fileNameInput.select();
    } );
    MA.DOM.on( fileNameInput, "blur", () =>{
      let fileName = fileNameInput.value.trim();
      if ( !fileName ) fileName = "gsi" + MA.getTimestampText();
      fileNameInput.value = fileName;
    } );


    for( let i=0; i<checkList.length; i++ ) {
      const check = checkList[i];
      const id = MA.getId( "gsi-saveimage-credit" );
      const label = MA.DOM.find(frame, "label." + check.value)[0];
      check.setAttribute("id",id);
      label.setAttribute("for", id);
      check.setAttribute("checked", true);

    }

    const saveButton = MA.DOM.find(frame, "button.save-execute")[0];
    MA.DOM.on( saveButton, "click", () => {
      if ( this._saveType === "png") {
        const options = {
          credit : MA.DOM.find(frame, "input.saveimage-credit")[0].checked,
          data : this._data
        };
  
        this._map.makeImageCanvas((canvas)=>{
          if ( !canvas) {
            alert("画像ファイル作成エラー");
            return;
          }
  
          let fileName = fileNameInput.value.trim();
          fileName = ( fileName ? fileName : "gsi" + this._timestamp + ".png" );
          this._save(fileName, "image", canvas);
        },options);
      } else {
        const txt = this._map.makeWorldFileText(this._data);
        let fileName = fileNameInput.value.trim();
        fileName = ( fileName ? fileName : "gsi" + this._timestamp + ".pgw" );
        this._save(fileName, "text",txt, "application/octet-stream");
      }
      MA.DOM.removeClass( MA.DOM.find(frame, ".filename-frame" )[0], "visible" );
    } );


    const cancelButton = MA.DOM.find(frame, "button.save-cancel")[0];
    MA.DOM.on( cancelButton, "click", () => {
      MA.DOM.removeClass( MA.DOM.find(frame, ".filename-frame" )[0], "visible" );
    } );


    MA.DOM.on( MA.DOM.find(frame, ".saveimage-button")[0], "click", ()=>{

      
      this._saveType = "png";
      MA.DOM.addClass( MA.DOM.find(frame, ".filename-frame" )[0], "visible" );
      fileNameInput.value = "gsi" + this._timestamp + ".png";
      /*
      const options = {
        credit : MA.DOM.find(frame, "input.saveimage-credit")[0].checked,
        data : this._data
      };

      this._map.makeImageCanvas((canvas)=>{
        if ( !canvas) {
          alert("画像ファイル作成エラー");
          return;
        }

        let fileName = fileNameInput.value.trim();
        fileName = ( fileName ? fileName : "gsi" + MA.getTimestampText() ) + ".png";
        this._save(fileName, "image", canvas);
      },options);
      */
    } );

    MA.DOM.on( MA.DOM.find(frame, ".saveworldfile-button")[0], "click", ()=>{
      this._saveType = "pgw";
      MA.DOM.addClass( MA.DOM.find(frame, ".filename-frame" )[0], "visible" );
      fileNameInput.value = "gsi" + this._timestamp + ".pgw";
      /*
      const txt = this._map.makeWorldFileText(this._data);
      let fileName = fileNameInput.value.trim();
      fileName = ( fileName ? fileName : "gsi" + MA.getTimestampText() ) + ".pgw";
      this._save(fileName, "text",txt, "application/octet-stream");
      */
    } );
    

    this._contents.appendChild(frame);

  }

  _save(fileName, type, data, contentType) {
    var blob = null;
    
    if ( type == "image")
      blob = this._createImageBlog( data);
    else if ( type == "text")
    blob = this._createTextBlog( data,contentType);
    
    var url = window.URL || window.webkitURL;

    if ( GSIBV.UI.Dialog.SaveFileDialog._dummyButton) {
      document.body.removeChild( GSIBV.UI.Dialog.SaveFileDialog._dummyButton );
    }
    GSIBV.UI.Dialog.SaveFileDialog._dummyButton = MA.DOM.create("a");
    GSIBV.UI.Dialog.SaveFileDialog._dummyButton.innerHTML="　";

    GSIBV.UI.Dialog.SaveFileDialog._dummyButton.setAttribute("download",fileName);
    GSIBV.UI.Dialog.SaveFileDialog._dummyButton.setAttribute("href",url.createObjectURL(blob));


    document.body.appendChild( GSIBV.UI.Dialog.SaveFileDialog._dummyButton );

    setTimeout( function(){
      GSIBV.UI.Dialog.SaveFileDialog._dummyButton.click();
      setTimeout(function(){
        if ( GSIBV.UI.Dialog.SaveFileDialog._dummyButton ) {
          document.body.removeChild( GSIBV.UI.Dialog.SaveFileDialog._dummyButton );
        }
        GSIBV.UI.Dialog.SaveFileDialog._dummyButton = null;
      },0);
    }, 0);
  }


  _createTextBlog(text, contentType) {
    return new Blob([text], { "type": contentType });
  }


  _createImageBlog(canvas) {
    var o = null;
    var base64 = canvas.toDataURL().split(',');
    if (base64.length > 1) {
      var data = window.atob(base64[1]);
      var data_n = data.length;
      if (data_n > 0) {
        var data_buff = new ArrayBuffer(data_n);
        var data_blob = new Uint8Array(data_buff);

        var i = 0;

        for (i = 0; i < data_n; i++) {
          data_blob[i] = data.charCodeAt(i);
        }
        o = new Blob([data_blob], { type: 'image/png' });
      }
    }
    return o;
  }
};