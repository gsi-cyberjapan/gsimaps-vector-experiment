GSIBV.UI.Dialog.NewDataDialog = class extends GSIBV.UI.Dialog.Modal {


  constructor() {
    super();
    this._dialogs = [];
    this._frameClass = ["newdatadialog"];
  }

  show() {
    this._title = "新しいレイヤを作成";
    this._msg = "新規作成";


    this._buttons = [
      { "id": "ok", "title": "上記の内容で作成" },
      { "id": "no", "title": "作成せず閉じる" }
    ];
    super.show();

    this._initializeLang();
    setTimeout(MA.bind(function(){
      this._titleInput.focus();
    },this),1);
  }
  _initializeLang() {
    var lang = GSIBV.application.lang;
    
    var dialogLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.NEWSTYLEDIALOG;

    this._titleInput.value = dialogLang["defaulttitle"];
    MA.DOM.find( this._contents,"th.title")[0].innerHTML = dialogLang["title2"];
    MA.DOM.find( this._contents,"th.template")[0].innerHTML = dialogLang["template"];
    
    this._titleContainer.innerHTML = dialogLang["title"];

    for( var i=0;i<this._buttons.length; i++ ) {
      if ( this._buttons[i].id == "ok") {
        this._buttons[i].element.innerHTML = dialogLang["ok"];
      } else if ( this._buttons[i].id == "no") {
        this._buttons[i].element.innerHTML = dialogLang["cancel"];
      }
    }

    this._templateSelect.innerHTML = "";
    function createOption(value, text) {
      var option = document.createElement("option");
      option.setAttribute("value", value);
      option.innerHTML = text;
      return option
    }
    for( var i=0; i<GSIBV.CONFIG.STYLETEMPLATE.length; i++ ) {
      var title  =GSIBV.CONFIG.STYLETEMPLATE[i].title;
      if ( lang != "ja") {
        var titleEng = GSIBV.CONFIG.LANG[lang.toUpperCase()].LAYER[title];
        if ( titleEng ) title = titleEng;
      }
      this._templateSelect.appendChild( 
        createOption(GSIBV.CONFIG.STYLETEMPLATE[i].id, title));
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
    var tr = null; //MA.DOM.create("tr");
    var th = null; //MA.DOM.create("th");
    var td = null; //MA.DOM.create("td");


    this._titleInput = MA.DOM.create("input");
    this._titleInput.setAttribute("type","text");

    MA.DOM.on( this._titleInput,"focus", function() {
      setTimeout(MA.bind(function(){this.select();},this),0);
    });

    tr = MA.DOM.create("tr");
    th = MA.DOM.create("th");
    td = MA.DOM.create("td");
    MA.DOM.addClass(th,"title");
    th.innerHTML = '表示名称';
    td.appendChild(this._titleInput);
    tr.appendChild(th);
    tr.appendChild(td);
    table.appendChild(tr);


    this._contents.appendChild(table);


    this._templateSelect = MA.DOM.create("select");
    
    tr = MA.DOM.create("tr");
    th = MA.DOM.create("th");
    td = MA.DOM.create("td");
    MA.DOM.addClass(th,"template");
    th.innerHTML = '初期状態';
    td.appendChild(this._templateSelect);
    tr.appendChild(th);
    tr.appendChild(td);
    table.appendChild(tr);
    this._templateSelect.selectedIndex = 0;


  }

  _onButtonClick(btnInfo) {

    var lang = GSIBV.application.lang;
    
    var dialogLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.NEWSTYLEDIALOG;


    if (btnInfo.id == "no") {
      this.hide();
      return;
    } else {
      var title  = this._titleInput.value;
      title = title.trim();
      var template = this._templateSelect.value;
      
      var msg = "";
      if (title == "" ) {
        msg = dialogLang["title"]
      }

      if ( template == undefined || template == "" ) {
        msg = ( msg == "" ? "" : "," ) +dialogLang["template"];
      }

      if ( msg != "" ) {
        msg = msg + "が設定されていません。";
        if ( !this._dialog)
          this._dialog = new GSIBV.UI.Dialog.Alert();
        this._dialog.show("Error",msg, [
            {"id":"ok", "title":"OK"}
        ]);
      } else {
        var styleTemplate = null;
        for( var i=0; i<GSIBV.CONFIG.STYLETEMPLATE.length; i++) {
          if ( GSIBV.CONFIG.STYLETEMPLATE[i].id == template ){
            styleTemplate = GSIBV.CONFIG.STYLETEMPLATE[i];
            break;
          }
        }
        var info = {  "title": title, "template":styleTemplate, "cancel": false };
        this.fire("buttonclick", info);
        if (!info.cancel) this.hide();
      }


    }
  }



};