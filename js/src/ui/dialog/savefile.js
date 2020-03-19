GSIBV.UI.Dialog.SaveFileDialog = class extends GSIBV.UI.Dialog.Modal {


  constructor(title, fileType) {
    super();
    this._dialogs = [];
    this._frameClass = ["savedatadialog"];
    this._title = title;
    this._fileType = fileType;
    this._msg = "保存";


    this._buttons = [
      { "id": "ok", "title": "上記の内容で保存" },
      { "id": "no", "title": "保存せず閉じる" }
    ];
  }

  set data(data) {
    this._data = data;
  }

  show(fileName, data) {
    super.show();

    this._data = data;
    this._originalFileName = fileName;
    this._fileName = fileName;
    this._ext = this._getExt( fileName );
    console.log( this._ext );

    this._fileNameInput.value = fileName;
    this._initializeLang();
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

  _initializeLang() {
    var lang = GSIBV.application.lang;
    
    var dialogLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.SAVESTYLEDIALOG;

    MA.DOM.find( this._contents,"th.filename")[0].innerHTML = dialogLang["filename"];
    
    this._titleContainer.innerHTML = this._title; //dialogLang["title"];

    for( var i=0;i<this._buttons.length; i++ ) {
      if ( this._buttons[i].id == "ok") {
        this._buttons[i].element.innerHTML = dialogLang["ok"];
      } else if ( this._buttons[i].id == "no") {
        this._buttons[i].element.innerHTML = dialogLang["cancel"];
      }
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

    var table = MA.DOM.create("table");
    this._fileNameInput = MA.DOM.create("input");
    this._fileNameInput.setAttribute("type", "text");
    var tr = MA.DOM.create("tr");
    var th = MA.DOM.create("th");
    var td = MA.DOM.create("td");

    MA.DOM.addClass(th, "filename");
    th.innerHTML = 'ファイル名';

    td.appendChild(this._fileNameInput);
    tr.appendChild(th);
    tr.appendChild(td);
    table.appendChild(tr);


    MA.DOM.on( this._fileNameInput, "focus", MA.bind(function(){
      setTimeout(MA.bind(function(){this._fileNameInput.select();},this),0);
    },this));

    MA.DOM.on( this._fileNameInput, "blur", MA.bind(this._onFileNameBlur,this));

    this._contents.appendChild(table);

  }

  
  _onButtonClick(btnInfo) {

    if ( btnInfo.id == "no") {
      this.hide();
      return;
    }
    var fileName = this._fileName;
    
    fileName = fileName.trim();
    
    if ( fileName == "" ) {
      fileName = this._originalFileName;
    }
    this._save( fileName);
  }

  _save(fileName) {
    var blob = null;
    if ( this._fileType == GSIBV.UI.Dialog.SaveFileDialog.FILE_IMAGE ) {
      blob = this._createImageBlog( this._data );

    } else if ( this._fileType == GSIBV.UI.Dialog.SaveFileDialog.FILE_TEXT ) {
      blob = this._createTextBlog( this._data,  "text/plain" );
    } else if ( this._fileType == GSIBV.UI.Dialog.SaveFileDialog.FILE_JSON ) {
      blob = this._createTextBlog( this._data,  "text/plain" );
    }
    
    
    var url = window.URL || window.webkitURL;

    if ( GSIBV.UI.Dialog.SaveFileDialog._dummyButton) {
      document.body.removeChild( GSIBV.UI.Dialog.SaveFileDialog._dummyButton );
    }
    GSIBV.UI.Dialog.SaveFileDialog._dummyButton = MA.DOM.create("a");
    GSIBV.UI.Dialog.SaveFileDialog._dummyButton.innerHTML="　";

    GSIBV.UI.Dialog.SaveFileDialog._dummyButton.setAttribute("download",fileName);
    GSIBV.UI.Dialog.SaveFileDialog._dummyButton.setAttribute("href",url.createObjectURL(blob));


    document.body.appendChild( GSIBV.UI.Dialog.SaveFileDialog._dummyButton );

    this.hide();
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
GSIBV.UI.Dialog.SaveFileDialog.FILE_TEXT = "text";
GSIBV.UI.Dialog.SaveFileDialog.FILE_JSON = "json";
GSIBV.UI.Dialog.SaveFileDialog.FILE_IMAGE = "image";