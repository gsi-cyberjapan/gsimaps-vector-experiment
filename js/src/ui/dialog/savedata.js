GSIBV.UI.Dialog.SaveDataDialog = class extends GSIBV.UI.Dialog.Modal {


  constructor() {
    super();
    this._dialogs = [];
    this._frameClass = ["savedatadialog"];
  }

  set data(data) {
    this._data = data;
  }

  show(title, fileName) {
    this._title = "スタイルの保存";
    this._msg = "保存";


    this._buttons = [
      { "id": "ok", "title": "上記の内容で保存" },
      { "id": "no", "title": "保存せず閉じる" }
    ];
    super.show();

    this._titleInput.value = ( this._data.title != undefined ? this._data.title : "");
    this._fileNameInput.value = ( 
      this._data.fileName != undefined ? this._data.fileName : this._makeFileName() );
    this._initializeLang();
  }
  _initializeLang() {
    var lang = GSIBV.application.lang;
    
    var dialogLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.SAVESTYLEDIALOG;

    MA.DOM.find( this._contents,"th.filename")[0].innerHTML = dialogLang["filename"];
    MA.DOM.find( this._contents,"th.title")[0].innerHTML = dialogLang["title2"];
    
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

  _createContents(contentsContainer) {

    var table = MA.DOM.create("table");
    this._fileNameInput = MA.DOM.create("input");
    this._fileNameInput.setAttribute("type", "text");
    this._titleInput = MA.DOM.create("input");
    this._titleInput.setAttribute("type", "text");

    var tr = MA.DOM.create("tr");
    var th = MA.DOM.create("th");
    var td = MA.DOM.create("td");

    MA.DOM.addClass(th, "filename");
    th.innerHTML = 'ファイル名';

    td.appendChild(this._fileNameInput);
    tr.appendChild(th);
    tr.appendChild(td);
    table.appendChild(tr);

    tr = MA.DOM.create("tr");
    th = MA.DOM.create("th");
    td = MA.DOM.create("td");

    MA.DOM.addClass(th, "title");
    th.innerHTML = 'タイトル';

    td.appendChild(this._titleInput);
    tr.appendChild(th);
    tr.appendChild(td);
    table.appendChild(tr);

    MA.DOM.on( this._fileNameInput, "focus", MA.bind(function(){
      setTimeout(MA.bind(function(){this._fileNameInput.select();},this),0);
    },this));
    MA.DOM.on( this._titleInput, "focus", MA.bind(function(){
      setTimeout(MA.bind(function(){this._titleInput.select();},this),0);
    },this));

    this._contents.appendChild(table);

  }

  
  _onButtonClick(btnInfo) {

    var lang = GSIBV.application.lang;
    
    var dialogLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.SAVESTYLEDIALOG;
    if ( btnInfo.id == "no") {
      this.hide();
      return;
    }
    var title = this._titleInput.value;
    var fileName = this._fileNameInput.value;
    
    title = title.trim();
    fileName = fileName.trim();
    
    var msg = '';
    if ( fileName == "" ) {
      msg = dialogLang["filename"];
    }
    if ( title == "" ) {
      msg += (msg!=""?"、":"") + dialogLang["title"];;
    }

    if ( msg == "") {
      //ok
      this._fireButtonClick(title, fileName);
    } else {
      msg += 'が入力されていません。<br>自動で設定してよろしいですか？';
      this._showConfirmDialog(msg,title, fileName);
    }
    
  }
  _fireButtonClick(title, fileName) {
    var info = { "title": title, "fileName": fileName, "cancel": false };
    this.fire("buttonclick", info);
    if (!info.cancel) this.hide();
  }
  
  _makeTitle() {
    return MA.getId("title-");
  }
  _makeFileName() {
    return MA.getId("gsi-binarytile-style-") + ".json";
  }


  _showConfirmDialog(msg, title, fileName) {
    
    var dialog = new GSIBV.UI.Dialog.Alert();
    dialog.autoDestroy = true;
    dialog.on("buttonclick",MA.bind(function(title, fileName,e){
        if ( e.params.id == "ok" ) {
          if ( title == "") title = this._makeTitle();
          if ( fileName == "") fileName = this._makeFileName();
          this._fireButtonClick(title, fileName);
        }
    },this, title, fileName));
    dialog.show("Confirm",msg, [
        {"id":"ok", "title":"はい"},
        {"id":"no", "title":"いいえ"}
    ]);
  }

};