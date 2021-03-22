GSIBV.UI.Dialog.OpenDataDialog = class extends GSIBV.UI.Dialog.Modal {


  constructor() {
    super();
    this._dialogs = [];
    this._frameClass = ["opendatadialog"];
  }


  show() {
    this._title = "スタイルファイルを開く";
    this._msg = "保存";


    this._buttons = [
      { "id": "ok", "title": "上記の内容で読込" },
      { "id": "no", "title": "開かず閉じる" }
    ];
    super.show();
    this._refreshFile();
    this._initializeLang();
  }
  _initializeLang() {
    var lang = GSIBV.application.lang;
    
    var dialogLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.OPENSTYLEDIALOG;

    MA.DOM.find( this._contents,"th.filename")[0].innerHTML = dialogLang["filename"];
    MA.DOM.find( this._contents,"th.encode")[0].innerHTML = dialogLang["encode"];
    
    this._titleContainer.innerHTML = dialogLang["title"];

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

  _refreshFile() {
    
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
  _createContents(contentsContainer) {

    var table = MA.DOM.create("table");
    this._fileNameInput = MA.DOM.create("input");
    this._fileNameInput.setAttribute("type", "file");
    var tr = MA.DOM.create("tr");
    var th = MA.DOM.create("th");
    var td = MA.DOM.create("td");

    this._fileInputFrame = MA.DOM.create("div");
    MA.DOM.addClass(this._fileInputFrame, "file");

    this._fileInputFileName = MA.DOM.create("div");
    this._fileInputFileName.innerHTML = 'ファイルを選択して下さい';

    this._fileInputFrame.appendChild(this._fileInputFileName);

    MA.DOM.addClass(th,"filename");
    th.innerHTML = 'ファイル';
    this._fileInputFrame.appendChild(this._fileNameInput);
    td.appendChild(this._fileInputFrame);
    tr.appendChild(th);
    tr.appendChild(td);
    table.appendChild(tr);


    this._encodeSelect = MA.DOM.create("select");
    
    function createOption(value, text) {
      var option = document.createElement("option");
      option.setAttribute("value", value);
      option.innerHTML = text;
      return option
    }
    this._encodeSelect.appendChild( createOption("utf-8","UTF8"));
    this._encodeSelect.appendChild( createOption("shift-jis","Shift-JIS"));
    tr = MA.DOM.create("tr");
    th = MA.DOM.create("th");
    td = MA.DOM.create("td");
    
    MA.DOM.addClass(th,"encode");
    th.innerHTML = 'エンコード';
    td.appendChild(this._encodeSelect);
    tr.appendChild(th);
    tr.appendChild(td);
    table.appendChild(tr);

    this._encodeSelect.selectedIndex = 0;


    MA.DOM.on(this._fileNameInput, "change", MA.bind(function (e) {
      this._files = this._fileNameInput.files;
      this._refreshFile();
    }, this));

    this._contents.appendChild(table);

  }


  _onButtonClick(btnInfo) {

    if (btnInfo.id == "no") {
      this.hide();
      return;
    }
    if (!this._files || this._files.length <= 0) {
      var dialog = new GSIBV.UI.Dialog.Alert();
      dialog.autoDestroy = true;
      dialog.show("エラー", "ファイルが選択されていません", [
        { "id": "ok", "title": "閉じる" }
      ]);
    } else {
      this._loadFile( this._files[0]);
    }
    /*
    var msg = '';
    if ( fileName == "" ) {
      msg = 'ファイルが選択されていません。<br>自動で設定してよろしいですか？';
    } else {
      this._fireButtonClick(title, fileName);
    } 
    */
  }

  _loadFile( file ) {
    var reader = new FileReader();
    try {
      reader.onload = MA.bind( function(reader,file){
        this._fireButtonClick( file.name, reader.result );
      },this, reader, file );
      reader.readAsText(file, this._encodeSelect.value);
    } catch(e) {
      console.log(e);
    }
  }
  _fireButtonClick(fileName, text) {
    var info = { "fileName": fileName, "text": text, "cancel": false };
    this.fire("buttonclick", info);
    if (!info.cancel) this.hide();
  }



};