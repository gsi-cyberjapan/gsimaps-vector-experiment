

GSIBV.UI.Dialog.FreeRelief = class extends GSIBV.UI.Dialog.Modeless {

  constructor(map,options) {
    super(options);
    this._map = map;
    this._size.width = 290;
    this._size.height = 340;
    this._position = {left:242,top:64};
    this._resizable = true;
    this._current = null;
    // カラーパターンのhtmlカラーをRGBに
    for( var i=0; i<GSIBV.CONFIG.FREERELIEF_COLORPATTERNS.length; i++ ) {
      var pattern = GSIBV.CONFIG.FREERELIEF_COLORPATTERNS[i];
      for( var j=0;j<pattern.colors.length; j++ ) {
        var color = pattern.colors[j];
        if ( color.r || color.r == 0 ) continue;
        pattern.colors[j] = GSIBV.Map.Layer.FreeRelief.colorStringToRGBA(color);
      }
    }

  }
  
  show() {
    
    this._data = GSIBV.Map.Layer.FreeRelief.DataManager.instance.data;
    this._data = JSON.parse( JSON.stringify(this._data) );

    
    this._updateList();
    super.show();
    this._refreshGradationBar();
    this._resize();
  }

  hide() {
    this._hideNewPanel();
    super.hide();
  }
  _resize() {
    if ( !this._contentContainer) return;
    var headerSize = MA.DOM.size(this._headerContainer);
    var footerSize = MA.DOM.size(this._footerContainer);

    this._contentContainer.style.top = headerSize.height + "px";
    this._contentContainer.style.bottom = footerSize.height + "px";
    
    if ( this._listScrollBar ) this._listScrollBar.update();
    if ( this._newPanelScrollBar ) this._newPanelScrollBar.update();

  }

  _createHeader(headerContainer) {
    this._titleContainer = MA.DOM.create("div");
    this._titleContainer.innerHTML = '自分で作る色別標高図';
    headerContainer.appendChild(this._titleContainer);
    super._createHeader(headerContainer);

  }
  _create() {
    if (this._headerContainer ) return;
    super._create();



    var windowSize = MA.DOM.size( this._parentElement );

    if ( this._position.top + this._size.height > windowSize.height) {
      this._position.top = windowSize.height - this._size.height;
    }
    
    if ( this._position.left + this._size.width > windowSize.width) {
      this._position.left = windowSize.width - this._size.width;
    }

    this._frame.style.left = this._position.left + "px";
    this._frame.style.top = this._position.top + "px";

    
    try {
      this._listScrollBar = new PerfectScrollbar(this._listContainer);
    } catch (e) { console.log(e); }

  }

  _createContents(contentsContainer) {
    MA.DOM.addClass(contentsContainer, "-gsibv-relief-contents");
    
    this._headerContainer = this._createReliefHeader();
    this._contentContainer = this._createReliefContent();
    this._footerContainer = this._createReliefFooter();
    
    contentsContainer.appendChild( this._headerContainer);
    contentsContainer.appendChild( this._contentContainer);
    contentsContainer.appendChild( this._footerContainer);
  }

  _createReliefHeader() {
    var container = MA.DOM.create("div");
    MA.DOM.addClass(container, "-header");

    var toolbar = this._createMenuToolbar();
    var toolbar2 = this._createMenuToolbar2();

    container.appendChild(toolbar);
    container.appendChild(toolbar2);

    return container;
  }

  _createMenuToolbar() {
    var container = MA.DOM.create("div");
    MA.DOM.addClass(container, "-toolbar");

    // 開く
    var openButton = MA.DOM.create("button");
    MA.DOM.addClass(openButton, "open");
    container.appendChild( openButton );
    MA.DOM.on(openButton,"click", MA.bind(this._onOpen,this));

    // 保存
    var saveButton = MA.DOM.create("button");
    MA.DOM.addClass(saveButton, "save");
    container.appendChild( saveButton );
    MA.DOM.on(saveButton,"click", MA.bind(this._onSave,this));

    // 凡例保存
    var saveHanreiButton = MA.DOM.create("button");
    saveHanreiButton.innerHTML = "凡例保存";
    MA.DOM.addClass(saveHanreiButton, "save-hanrei");
    container.appendChild( saveHanreiButton );
    MA.DOM.on(saveHanreiButton,"click", MA.bind(this._onSaveHanrei,this));

    // 簡易設定（廃止）
    /*
    var newButton = MA.DOM.create("button");
    newButton.innerHTML = "簡易設定";
    MA.DOM.addClass(newButton, "new");
    container.appendChild( newButton );
    MA.DOM.on( newButton, "click", MA.bind(function(){
      this._showNewPanel();
    },this ) );
    */
    var newButton = MA.DOM.create("button");
    newButton.innerHTML = "自動作成";
    MA.DOM.addClass(newButton, "new");
    container.appendChild( newButton );
    MA.DOM.on( newButton, "click", MA.bind(function(){
      this._createAutoNewData();
    },this ) );



    // 初期状態に戻す
    var resetButton = MA.DOM.create("button");
    resetButton.innerHTML = "初期状態に戻す";
    MA.DOM.addClass(resetButton, "reset");
    container.appendChild( resetButton );

    MA.DOM.on( resetButton, "click", MA.bind(function(){
      this._data = GSIBV.Map.Layer.FreeRelief.getDefaultData();
      this._updateList();
      this._refreshGradationBar();
      this._commit();
    },this ) );

    return container;

  }

  _onOpen() {
    if ( !this._openFileDialog) {
      this._openFileDialog = new GSIBV.UI.Dialog.OpenFileDialog(
        "ファイルを開く", GSIBV.UI.Dialog.OpenFileDialog.FILE_TEXT);
      this._openFileDialog.on("select", MA.bind(function(evt){
        var data = this._parseText(evt.params.data);
        if ( !data ) {
          
          var dialog = new GSIBV.UI.Dialog.Alert();
          dialog.autoDestroy = true;
          dialog.show("エラー", "自分で作る色別標高図のファイルを選択して下さい", [
            { "id": "ok", "title": "閉じる" }
          ]);
          evt.params.cancel = true;
        } else {
          this._data = data;
          this._updateList();
          this._refreshGradationBar();
          this._commit();
        }
      },this));
    }
    this._openFileDialog.show();
  }

  _parseText( text ) {
    //console.log( text );
    try {
      var data = JSON.parse(text);
      data.gradate = (data.gradate ? true : false);
      data.useHillshademap = (data.useHillshademap ? true : false);

      if (data.colors.length < 2) {
        return;
      }

      var colors = [];
      for (var i = 0; i < data.colors.length; i++) {
        if (data.colors[i].h) {
          data.colors[i].h = GSIBV.Map.Util.reliefRound(data.colors[i].h);
        }
        if ( !isNaN(data.colors[i].h) ) {
          colors.push( data.colors[i]);
        }
      }

      data.colors = colors;
      if ( data.colors.length < 2) return null;

      return data;
    }
    catch (e) {
      console.log(e);
    }
    return null;
  }

  _onSave() {
    var data = this._makeElevationData();
    var text = JSON.stringify(data, null, "  ");
    if ( !this._saveFileDialog) {
      this._saveFileDialog = new GSIBV.UI.Dialog.SaveFileDialog(
        "設定した内容を保存", GSIBV.UI.Dialog.SaveFileDialog.FILE_TEXT);
    }
    this._saveFileDialog.show(MA.getId("relief") + ".txt",text);

  }

  _onSaveHanrei() {
    var canvas = GSIBV.Map.Layer.FreeRelief.makeHanreiImage(this._makeElevationData());

    if ( !this._saveHanreiFileDialog) {
      this._saveHanreiFileDialog = new GSIBV.UI.Dialog.SaveFileDialog(
        "凡例画像を保存", GSIBV.UI.Dialog.SaveFileDialog.FILE_IMAGE);
    }
    this._saveHanreiFileDialog.show(MA.getId("hanrei") + ".png",canvas);

  }

  _createMenuToolbar2() {
    
    var container = MA.DOM.create("div");
    MA.DOM.addClass(container, "-toolbar2");

    // 降順に並べる
    var id = MA.getId( "gsi-freerelief-check" );
    var check = MA.DOM.create("input");
    MA.DOM.addClass(check, "normalcheck")
    check.setAttribute("type", "checkbox");
    check.setAttribute("id", id);
    var label = MA.DOM.create("label");
    label.setAttribute("for", id);

    label.innerHTML = "降順に並べる";
    container.appendChild(check);
    container.appendChild(label);
    this._orderCheck = check;
    this._orderCheck.checked = this._data.desc;

    MA.DOM.on(this._orderCheck,"click", MA.bind(function(){
      var data = this._makeElevationData(!this._orderCheck.checked);
      data.desc = this._orderCheck.checked;
      this._data = data;
      this._updateList();
    },this));

    // カラーパターン
    var button = MA.DOM.create("button");
    
    button.innerHTML="カラーパターン選択"
    this._colorPatternSelect = button;
    MA.DOM.on(button, "click", MA.bind(this._onColorPatternSelectClick,this));
    

    container.appendChild(button);

    return container;
  }

  _createReliefContent() {
    var container = MA.DOM.create("div");
    MA.DOM.addClass(container, "-content");

    var listContainer = MA.DOM.create("div");
    MA.DOM.addClass(listContainer, "listcontainer");

    this._listContainer = listContainer;
   
    container.appendChild(listContainer);

    
    this._updateList();

    return container;
  }


  
  _createReliefFooter() {
    var container = MA.DOM.create("div");
    MA.DOM.addClass(container, "-footer");
    /*
    var tani =MA.DOM.create("div");
    tani.innerHTML = "(単位:m)";
    MA.DOM.addClass(tani, "-tani");
    container.appendChild(tani);
    */
    var optionContainer =  MA.DOM.create("div");
    MA.DOM.addClass(optionContainer, "-container");
    
    var createCheck = function(prefix, text) {
      
      var id = MA.getId( prefix );
      var check = MA.DOM.create("input");
      MA.DOM.addClass(check, "normalcheck")
      check.setAttribute("type", "checkbox");
      check.setAttribute("id", id);
      var label = MA.DOM.create("label");
      label.setAttribute("for", id);

      label.innerHTML = text;
      
      return {id:id,check:check, label:label};
    };
    // グラデーション
    var check = createCheck("gsi-freerelief-check","グラデーション");
    optionContainer.appendChild( check.check);
    optionContainer.appendChild( check.label);
    this._gradateInput = check.check;
    MA.DOM.on( this._gradateInput, "click", MA.bind( this._refreshGradationBar, this ) );
    this._gradateInput.checked = this._data.gradate;

    // 陰影
    var check = createCheck("gsi-freerelief-check","陰影");
    optionContainer.appendChild( check.check);
    optionContainer.appendChild( check.label);
    this._useHillshademapInput = check.check;
    this._useHillshademapInput.checked = this._data.useHillshademap;
    
    // OKボタン
    var buttonContainer =  MA.DOM.create("div");
    MA.DOM.addClass(buttonContainer, "-container");
    this._commitButton = MA.DOM.create("button");
    this._commitButton.setAttribute("href","javascript:void(0);");
    this._commitButton.innerHTML = "上記の内容で地図に反映";
    //MA.DOM.addClass(this._commitButton, "button");
    buttonContainer.appendChild(this._commitButton);

    MA.DOM.on(this._commitButton,"click", MA.bind(this._commit,this));
    
    container.appendChild(optionContainer);
    container.appendChild(buttonContainer);
    return container;
  }

  _commit() {
    
    var data = this._makeElevationData();
    this._data = data;
    GSIBV.Map.Layer.FreeRelief.DataManager.instance.data = this._data;
  }


  // データを表示
  _updateList() {
    if ( !this._listContainer ) return;

    if ( this._gradateInput ) {
      this._gradateInput.checked = this._data.gradate;
      this._useHillshademapInput.checked = this._data.useHillshademap;
    }
    
    if ( this._orderCheck ) {
      this._orderCheck.checked = this._data.desc;
    }
    this._listContainer.innerHTML="";
    var data = this._data;
    var table = MA.DOM.create("table");
    MA.DOM.addClass(table,"colors");
    var tbody = MA.DOM.create("tbody");

    var colors = data.colors;

    this._lineList = [];

    if (data.desc) {
      
      for (var i = colors.length - 1; i >= 0; i--) {
        var next = (i < colors.length - 1 ? colors[i + 1] : null);
        var current = colors[i];
        var prev = (i > 0 ? colors[i - 1] : null);
        var tr = this._createLine(prev, current, next, true);
        tbody.appendChild(tr);

        this._lineList.push( {
          tr : tr,
          color : colors[i]
        });
      }
    } else {
      for (var i = 0; i < colors.length; i++) {
        var prev = (i > 0 ? colors[i - 1] : null);
        var current = colors[i];
        var next = (i < colors.length - 1 ? colors[i + 1] : null);

        var tr = this._createLine(prev, current, next);
        tbody.appendChild(tr);

        this._lineList.push( {
          tr : tr,
          color : colors[i]
        });
      }
    }

    //グラデーション
    
    var td = MA.DOM.create("td");
    MA.DOM.addClass(td,"gradationbar");
    //td.style.position = "relative";
    td.style.width = "16px";
    td.setAttribute( "rowspan",this._lineList.length );
    
    var div = MA.DOM.create("div");
    MA.DOM.addClass(div,"bar");
    /*
    var div = $("<div>").css({
      "position": "absolute",
      "background": 'url("./image/system/transparent_bg.png")',
      "border": "1px solid #aaa", "left": "1px", "top": "1px", "right": "4px", "bottom": "1px"
    });
    */
    var canvas = document.createElement('canvas');
    div.appendChild(canvas);
    td.appendChild(div);

    this._lineList[0].tr.insertBefore(td,this._lineList[0].tr.firstChild);

    table.appendChild(tbody);
    this._listContainer.appendChild(table);



    var removeButtons = MA.DOM.find( this._listContainer, "a.remove");
    for( var i=0; i<removeButtons.length; i++ ) {
      var btn = removeButtons[i];
      btn.style.display = ( removeButtons.length <= 2 ? "none" : "block");
    }
    /*
    var removeButtons = frame.find("a.remove_btn");
    if (removeButtons.length <= 2)
      removeButtons.style.display="none";
    else
      removeButtons.style.display="block";
    */

    //if (!skipRefreshGradationBar) 
  
    
    var tani =MA.DOM.create("div");
    tani.innerHTML = "(単位:m)";
    MA.DOM.addClass(tani, "-tani");
    this._listContainer.appendChild(tani);

  }

  _createLine(prev, current, next, desc) {
    var tr = MA.DOM.create("tr");
    MA.DOM.addClass(tr,"line");
    var td = null;

    td = MA.DOM.create("td");
    MA.DOM.addClass(td,"from");
    td.innerHTML= ( !prev ? "&nbsp;" : prev.h );
    tr.appendChild(td);

    td = MA.DOM.create("td");
    td.innerHTML="-";
    tr.appendChild(td);

    if (next) {
      var input = MA.DOM.create("input");
      MA.DOM.addClass(input,"elevation");
      input.setAttribute("type","text");
      input.value = current.h;

      td = MA.DOM.create("td");
      td.appendChild(input);
      tr.appendChild(td);

      MA.DOM.on( input, "focus", MA.bind(function(elem){
        setTimeout( MA.bind(function(){this.select();}, input), 0 );
      },this,input));
      
      MA.DOM.on( input, "blur", MA.bind(function(elem){
        this._checkInputElevation(tr);
      },this,input));
      
    } else {
      td = MA.DOM.create("td");
      MA.DOM.addClass(td,"to");
      td.innerHTML="&nbsp;";
      tr.appendChild(td);
    }

    td = MA.DOM.create("td");

    var color = current.color;
    if (color) {
      if (color.r || color.r == 0) color = this._rgbToColor(color);
    }
    else {
      color = null;
    }

    var a = MA.DOM.create("a");
    a.setAttribute("href","javascript:void(0);");
    MA.DOM.addClass(a,"color");
    a._color = color;
    if ( color) {
      a.style.backgroundColor = color;
      MA.DOM.removeClass( a, "transparent");
    } else {
      a.style.backgroundColor ="transparent";
      MA.DOM.addClass( a, "transparent");
    }
    
    MA.DOM.on(a,"click", MA.bind(function(target){
      if ( !this._colorPicker) {
        this._colorPicker = new GSIBV.UI.ColorPicker();
        this._colorPicker.zIndex = 50000;
        this._colorPicker.noAlpha = true;
        this._colorPicker.useClearButton = true;
        this._colorPicker.on("change",MA.bind(function(evt){
          //this._colorPicker._currentTarget._color = ;
          var color = evt.params.color;
          if ( color ) {
            MA.DOM.removeClass( this._colorPicker._currentTarget, "transparent");
            this._colorPicker._currentTarget._color =this._rgbToColor(MA.Color.fix(color.getRGB()) );
            this._colorPicker._currentTarget.style.backgroundColor =this._colorPicker._currentTarget._color;
          } else {
            this._colorPicker._currentTarget._color =null;
            this._colorPicker._currentTarget.style.backgroundColor ="transparent";
            MA.DOM.addClass( this._colorPicker._currentTarget, "transparent");
          }
        },this));
      }
      this._colorPicker._currentTarget = target;
      this._colorPicker.show(target,GSIBV.Map.Layer.FreeRelief.colorStringToRGBA(target._color));
    },this,a));
    
    /*
    var this$ = this;
    a.ColorPicker({
      onSubmit: function (hsb, hex, rgb, el) {
        $(el).val("#" + hex.toUpperCase());
        $(el).ColorPickerHide();
        this$._refreshGradationBar();
      },
      onBeforeShow: function () {
        var color = $(this).data("color");
        if (color)
          $(this).ColorPickerSetColor(color);
      },
      onShow: function (colpkr) {
        $(colpkr).fadeIn(200);
      },
      onHide: L.bind(function (colpkr) {
        $(colpkr).fadeOut(200);
        this$._refreshGradationBar();
      }, this),
      onChange: function (hsb, hex, rgb) {
        var el = this.data('colorpicker').el;
        var color = "#" + hex.toUpperCase();
        $(el).css({ "background": color }).data({ "color": color });
      },
      onClear: function () {
        var el = this.data('colorpicker').el;
        $(el).css({ "background": 'url("./image/system/transparent_bg.png")' }).data({ "color": null });
        this$._refreshGradationBar();
      }
    });
    */
    td.appendChild(a);
    tr.appendChild(td);


    //

    if (next) { //(!desc && next) || (desc && prev) ) {
      td = MA.DOM.create("td");
      td.style.width ="24px";

      a = MA.DOM.create("a");
      a.setAttribute("title", "この行を削除");
      a.setAttribute("href", "javascript:void(0);");
      MA.DOM.addClass(a, "button");
      MA.DOM.addClass(a, "remove");
      
      MA.DOM.on(a,"click", MA.bind(function(tr){
        this._removeLine(tr);
      },this,tr ));
      td.appendChild(a);
      tr.appendChild(td);

      //
      td = MA.DOM.create("td");
      td.style.width ="24px";
      
      a = MA.DOM.create("a");
      a.setAttribute("title", "ここに追加");
      a.setAttribute("href", "javascript:void(0);");
      MA.DOM.addClass(a, "button");
      MA.DOM.addClass(a, "append");
      MA.DOM.addClass(a, desc ? "prev" : "next");

      MA.DOM.on(a,"click", MA.bind(function(tr){
        this._appendLine(tr);
      },this,tr ));

      td.appendChild(a);
      tr.appendChild(td);
    } else {
      td = MA.DOM.create("td");
      td.innerHTML = "&nbsp;";
      tr.appendChild(td);

      td = MA.DOM.create("td");
      td.style.width ="24px";
      td.innerHTML = "&nbsp;";
      tr.appendChild(td);
    }
    return tr;

  }


  // 内部形式から#000000へ
  _rgbToColor (rgb) {
    return "#"
      + ("00" + rgb.r.toString(16).toUpperCase()).substr(-2)
      + ("00" + rgb.g.toString(16).toUpperCase()).substr(-2)
      + ("00" + rgb.b.toString(16).toUpperCase()).substr(-2);
  }

  _refreshGradationBar() {
    var tr = MA.DOM.find( this._listContainer, "table.colors tr");
    var td = MA.DOM.find( tr[0], "td.gradationbar")[0];

    td.setAttribute("rowspan", tr.length);
    
    if ( !this._gradateInput || !this._gradateInput.checked ) {
      td.style.display="none";
      return;
    }

    td.style.display="";
    var div = MA.DOM.find( td, "div");
    var size = MA.DOM.size( div[0]);
    var w = 9;
    var h = size.height;
    var canvas = MA.DOM.find( td,"canvas")[0];


    canvas.width = w
    canvas.height = h;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();



    var lineHeight = Math.round(h / tr.length);

    var prev = null;

    for (var idx = 0; idx < tr.length; idx++) {
      var color = MA.DOM.find(tr[idx],"a.color")[0]._color;
      if (color) color = GSIBV.Map.Layer.FreeRelief.colorStringToRGBA(color);

      var startY = (idx * lineHeight);// - (lineHeight/2);// - Math.round( lineHeight/ 2 )-1;

      for (var y = startY; y < startY + lineHeight; y++) {
        var yP = (y - startY) / lineHeight;

        ctx.globalAlpha = 1;
        if (color) {
          var c = {
            r: color.r,
            g: color.g,
            b: color.b,
            a: 255
          };
          ctx.globalAlpha = 1;
          if (prev) {
            c.r = prev.r + Math.round((color.r - prev.r) * yP);
            c.g = prev.g + Math.round((color.g - prev.g) * yP);
            c.b = prev.b + Math.round((color.b - prev.b) * yP);
          } else if (idx > 0) {
            if (y <= startY + Math.round(lineHeight / 2)) continue;
            if (this.options.transparentGradate) {
              c.a = Math.round(255 * yP);
              ctx.globalAlpha = c.a / 255;
            }
            else {
              //if ( yP < 0.5 ) 
              ctx.globalAlpha = 1;
            }
          }

          if (c.r > 255) c.r = 255;
          if (c.g > 255) c.g = 255;
          if (c.b > 255) c.b = 255;
          if (c.a > 255) c.a = 255;

          ctx.fillStyle = "rgb(" + c.r + "," + c.g + "," + c.b + ")";

        } else {

          if (prev) {
            var c = {
              r: prev.r,
              g: prev.g,
              b: prev.b,
              a: 255
            };

            if (this.options.transparentGradate) {
              c.a = prev.a + Math.round((- prev.a) * yP);
            }
            else {

              //if ( yP > 0.5 ) 
              if (y >= startY + Math.round(lineHeight / 2)) c.a = 0;;

            }

            if (c.r > 255) c.r = 255;
            if (c.g > 255) c.g = 255;
            if (c.b > 255) c.b = 255;
            if (c.a > 255) c.a = 255;

            ctx.fillStyle = "rgb(" + c.r + "," + c.g + "," + c.b + ")";
            ctx.globalAlpha = c.a / 255;
          }
          else {
            ctx.fillStyle = "rgb(255,255,255)";
            ctx.globalAlpha = 0;
          }


        }

        ctx.fillRect(0, y - Math.round(lineHeight / 2), w, 1);
      }

      prev = color;
    }

    var y = tr.length * lineHeight - Math.round(lineHeight / 2) - 1;
    ctx.fillRect(0, y, w, lineHeight);
  }


  
  // 入力値からデータ
  _makeElevationData (desc) {
    var data = {
      gradate: this._gradateInput.checked,
      useHillshademap: this._useHillshademapInput.checked,
      desc: (desc != undefined ? desc : this._orderCheck.checked),
      colors: []
    };


    var inputs = MA.DOM.find( this._listContainer, "input.elevation");
    var colorSelects = MA.DOM.find( this._listContainer, "a.color");


    if (data.desc) {

      for (var i = 0; i < colorSelects.length; i++) {
        var input = null;

        if (i <= inputs.length && i > 0)
          input = inputs[i - 1];

        var colorSelect = colorSelects[i];

        data.colors.unshift({
          h: (input ? Number(input.value) : null),
          color: colorSelect._color
        });

      }
    } else {
      for (var i = 0; i < colorSelects.length; i++) {
        var input = null;

        if (i < inputs.length)
          input = inputs[i];

        var colorSelect = colorSelects[i];

        data.colors.push({
          h: (input ? Number(input.value) : null),
          color: colorSelect._color
        });

      }

    }

    return data;

  }

  _trToData (tr) {
    var input = MA.DOM.find(tr,"input.elevation");
    var h = null;
    
    if ( input.length > 0 ) {
      h= input[0].value;
      if (h) {
        h = h.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
          return String.fromCharCode(s.charCodeAt(0) - 65248);
        });
        h = h.replace(/[ー－‐]/g, "-");
        //if (h.match(/^-?[0-9]+$/))
        //  h = parseInt(h);
        if (h.match(/^[-]?([1-9]\d*|0)(\.\d+)?$/))
          GSIBV.Map.Util.reliefRound(Number(h));
        else
          h = null;
      }
      else
        h = null;
    }


    var color = MA.DOM.find(tr,"a.color")[0]._color;
    
    return {
      h: h,
      color: color
    };
  }

  _appendLine(tr) {
    var appendNext = !this._orderCheck.checked;

    var current = this._trToData(tr);
    var prev = null;
    //(tr.prev("tr.line").length > 0 ? this._trToData(tr.prev("tr.line")) : null);
    var next = null;
    //(tr.next("tr.line").length ? this._trToData(tr.next("tr.line")) : null);
    if (appendNext) {
      prev = tr.previousSibling && MA.DOM.hasClass(tr.previousSibling,"line") ?  this._trToData(tr.previousSibling) : null;
      next = tr.nextSibling && MA.DOM.hasClass(tr.nextSibling,"line") ?  this._trToData(tr.nextSibling) : null;
      //prev = (tr.prev("tr.line").length > 0 ? this._trToData(tr.prev("tr.line")) : null);
      //next = (tr.next("tr.line").length ? this._trToData(tr.next("tr.line")) : null);
    } else {
      next = tr.previousSibling && MA.DOM.hasClass(tr.previousSibling,"line") ?  this._trToData(tr.previousSibling) : null;
      prev = tr.nextSibling && MA.DOM.hasClass(tr.nextSibling,"line") ?  this._trToData(tr.nextSibling) : null;
      
      //next = (tr.prev("tr.line").length > 0 ? this._trToData(tr.prev("tr.line")) : null);
      //prev = (tr.next("tr.line").length ? this._trToData(tr.next("tr.line")) : null);
    }
    var h = 0;

    if (next) h = (current.h || current.h == 0 ? current.h + 1 : null);
    else h = (current.h || current.h == 0 ? current.h - 1 : null);

    if (next && next.h && (h || h == 0)) {
      h = parseInt(current.h + ((next.h - current.h) / 2));
    }
    else if (prev && prev.h && (h || h == 0)) {
      h = parseInt(current.h + ((current.h - prev.h) / 2));
    }
    var color = GSIBV.Map.Layer.FreeRelief.colorStringToRGBA(current.color);

    if (next) {
      var nextColor = GSIBV.Map.Layer.FreeRelief.colorStringToRGBA(next.color);
      var p = 0.5;
      color.r = Math.round(color.r + ((nextColor.r - color.r) * p));
      color.g = Math.round(color.g + ((nextColor.g - color.g) * p));
      color.b = Math.round(color.b + ((nextColor.b - color.b) * p));
      if (color.r > 255) color.r = 255;
      if (color.g > 255) color.g = 255;
      if (color.b > 255) color.b = 255;

    }



    var newTr = null;


    if (appendNext) {

      newTr = this._createLine(current, {
        h: h,
        color: this._rgbToColor(color)
      }, next);
      //newTr.insertAfter(tr);
      if ( !tr.nextSibling) {
        tr.parentNode.appendChild( newTr );
      } else {
        tr.parentNode.insertBefore( newTr, tr.nextSibling);
      }
    } else {

      newTr = this._createLine(current, {
        h: h,
        color: this._rgbToColor(color)
      }, next, true);
      
      tr.parentNode.insertBefore( newTr, tr);
    }

    MA.DOM.find( newTr, "input[type=text]")[0].focus();

    this._refreshElevationFrom();
    this._refreshGradationBar();


    var removeButtons = MA.DOM.find( this._listContainer, "a.remove");
    for( var i=0; i<removeButtons.length; i++ ) {
      var btn = removeButtons[i];
      btn.style.display = ( removeButtons.length <= 2 ? "none" : "block");
    }
  }

  
  _refreshElevationFrom () {

    var orderDesc = this._orderCheck.checked;

    var trArr = MA.DOM.find(this._listContainer,"tr.line");
    var prev = null;

    for (var i = 0; i < trArr.length; i++) {
      var tr = trArr[(orderDesc ? trArr.length - i - 1 : i)];
      var current = this._trToData(tr);

      if (!prev) {
        MA.DOM.find(tr,"td.from" )[0].innerHTML = "";
      } else {
        MA.DOM.find(tr,"td.from" )[0].innerHTML = prev.h;
      }

      prev = current;
    }


  }

  _removeLine(tr) {

    var inputs = MA.DOM.find(this._listContainer,"input.elevation");
    if (inputs.length <= 2) return;

    tr.parentNode.removeChild(tr);

    var removeButtons = MA.DOM.find( this._listContainer, "a.remove");
    for( var i=0; i<removeButtons.length; i++ ) {
      var btn = removeButtons[i];
      btn.style.display = ( removeButtons.length <= 2 ? "none" : "block");
    }
    this._refreshElevationFrom();
    this._refreshGradationBar();
  }


  _onColorPatternSelectClick() {
    if ( !this._colorPatternSelectPanel ) {
      this._colorPatternSelectPanel = MA.DOM.create("div");
      MA.DOM.addClass( this._colorPatternSelectPanel, "-gsibv-relief-patternselectpanel" );
      this._colorPatternSelectPanel.style.display="none";
      //.addClass("gsi_editreliefdialog_patternselectpanel").hide();
      
      var ul = MA.DOM.create("ul");
      
      for( var i=0; i<GSIBV.CONFIG.FREERELIEF_COLORPATTERNS.length; i++ ) {
        var pattern = GSIBV.CONFIG.FREERELIEF_COLORPATTERNS[i];
        
        var li = MA.DOM.create("li");
        var a = MA.DOM.create("a");
        a.setAttribute("href","javascript:void(0);");
        MA.DOM.on(a, "click", MA.bind(function(pattern){
          this._hideColorPatternSelectPanel();
          this._setColorPattern(pattern);
        },this,pattern) );
        var canvas = MA.DOM.create("canvas");
        canvas.width = 200;
        canvas.height = 10;
        this._drawPatternSample(canvas, pattern, 200, 10);

        a.appendChild( canvas );
        li.appendChild(a);
        ul.appendChild(li);
      }
      this._colorPatternSelectPanel.appendChild( ul );
      
    }
    document.body.appendChild( this._colorPatternSelectPanel );

    if ( !this._colorPatternSelectPanelHideCheckHandler) {
      this._colorPatternSelectPanelHideCheckHandler = MA.bind( function(evt){
        var target = evt.target;
        while( target ) {
          if ( target == this._colorPatternSelectPanel) {
            return;
          }
          target = target.parentNode;
        }
        this._hideColorPatternSelectPanel();
      }, this );
      MA.DOM.on(document.body,"mousedown", this._colorPatternSelectPanelHideCheckHandler );
    }


    var pos = MA.DOM.offset ( this._colorPatternSelect );
    var size = MA.DOM.size ( this._colorPatternSelect );

    this._colorPatternSelectPanel.style.left = pos.left + "px";
    this._colorPatternSelectPanel.style.top = ( pos.top + size.height) + "px";
    MA.DOM.fadeIn( this._colorPatternSelectPanel,300 );
  }

  _hideColorPatternSelectPanel() {
    
    if ( this._colorPatternSelectPanelHideCheckHandler) {
      MA.DOM.off(document.body,"mousedown", this._colorPatternSelectPanelHideCheckHandler );
      this._colorPatternSelectPanelHideCheckHandler = null;
    }
    if ( this._colorPatternSelectPanel ) {
      this._colorPatternSelectPanel.style.display="none";
      this._colorPatternSelectPanel.parentNode.removeChild(this._colorPatternSelectPanel);
      this._colorPatternSelectPanel = null;
    
    }
  }
  
  _drawPatternSample(canvas, pattern, w,h) {
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,w,h);
    ctx.beginPath();
    var imageData = ctx.createImageData(w, h);

    var colors = pattern.colors;

    var blockWidth = Math.ceil( w / (colors.length-1) ); 
    
    for( var i=0; i<colors.length-1; i++ ) {
      
      var color1 = colors[i];
      var color2 = colors[i+1];
      var startX = i*blockWidth;
      for( var x = startX ; x<startX+blockWidth && x<w; x++ ) {
        var p = (x-startX)/blockWidth;
        var r = Math.round( color1.r + ( color2.r - color1.r) * p );
        var g = Math.round( color1.g + ( color2.g - color1.g) * p );
        var b = Math.round( color1.b + ( color2.b - color1.b) * p );
        for( var y=0; y<h; y++ ) {
          var idx = (y * w * 4) + (x * 4);
          imageData.data[idx] = r;
          imageData.data[idx+1] = g
          imageData.data[idx+2] = b;
          imageData.data[idx+3] = 255; 
          
        }
      }
    }
    /*
    for( var x=0; x<w; x++ ) {
      var p = x / (w -1);
      var r = Math.round( pattern.begin.r + ( pattern.end.r - pattern.begin.r) * p );
      var g = Math.round( pattern.begin.g + ( pattern.end.g - pattern.begin.g) * p );
      var b = Math.round( pattern.begin.b + ( pattern.end.b - pattern.begin.b) * p );

      for( var y=0; y<h; y++ ) {
        var idx = (y * w * 4) + (x * 4);
        imageData.data[idx] = r;
        imageData.data[idx+1] = g
        imageData.data[idx+2] = b;
        imageData.data[idx+3] = 255; 
        
      }
    }
    */
    ctx.putImageData( imageData,0,0 );
  }

  _setColorPattern(pattern) {
    var colorSelects = MA.DOM.find( this._listContainer,"a.color");
    var desc = this._orderCheck.checked;
    var colors = this._makeColorsFromColorPattern(colorSelects.length, pattern);

    for( var i=0; i<colorSelects.length; i++ ) {
      var idx = ( desc ? colorSelects.length -i - 1 : i );
      var a = colorSelects[idx];

    //  var color =;


      /*
      var p = ( i < max-1 ? i : max - 1 )  / (max -1);
      var r = Math.round( pattern.begin.r + ( pattern.end.r - pattern.begin.r) * p );
      var g = Math.round( pattern.begin.g + ( pattern.end.g - pattern.begin.g) * p );
      var b = Math.round( pattern.begin.b + ( pattern.end.b - pattern.begin.b) * p );
      var color = this._rgbToColor({r:r,g:g,b:b});
      */
     var color = this._rgbToColor(colors[idx]);

      a._color = color;
      a.style.backgroundColor = color;
//      a.data({"color": color}).css({"background":color});

    }

    this._refreshGradationBar();
  }

  _makeColorsFromColorPattern(len, pattern) {

    var colors = JSON.parse(JSON.stringify(pattern.colors));

    if ( len <= colors.length ) {
    // 少ない場合
      var colorsLength = colors.length;
      for( var i=0; i<colorsLength - len; i++ ) {
        if ( i % 2 == 0 ) {
          colors.splice( colors.length - 2,1 );
        } else {
          colors.splice( 1,1 );
        }
      }
      return colors;
    }

    // 多い場合は補完

    var colorLength = colors.length-1;
    var splitNum = Math.floor(len / colorLength );
    var lastIndex = (colorLength) - ( len % colorLength );

    //console.log( colorLength, splitNum, lastIndex);


    var splitColor = function ( c1, c2, num) {
      var result = [];
      // 
      for( var i=0; i<num; i++) {

        var p = (i+1) / (num+1);
        var color = {
          r : Math.round( c1.r + ( c2.r - c1.r) * p ),
          g : Math.round( c1.g + ( c2.g - c1.g) * p ),
          b : Math.round( c1.b + ( c2.b - c1.b) * p ),
        };

        result.push( color );
      }
      return result;
    };
    
    var result = [];

    for( var i=colorLength-1; i>=0; i-- ) {
      var sNum = splitNum;
      if ( lastIndex == colorLength) {
        sNum--;
        if ( i < 1 ) sNum --;
      } else {
        if ( i < lastIndex+1) {
          sNum --;
        }
      }
      
      result.unshift( colors[i+1]);
      if ( sNum <= 0 ) continue;
      //console.log( "分割位置", (i+1) + "~" + (i), "分割数", sNum);
      var splittedColors = splitColor(colors[i], colors[i+1], sNum);
      for( var j=splittedColors.length-1; j>=0; j-- ) {
        result.unshift( splittedColors[j]);
      }
    }
    result.unshift( colors[0]);

    //console.log( result );
    return result;
  }

  _checkInputElevation (tr) {
    
    var desc = this._orderCheck.checked;

    var h = MA.DOM.find(tr,"input.elevation")[0].value;
    h = h.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 65248);
    });
    h = h.replace(/[ー－‐]/g, "-");


    //if (h.match(/^-?[0-9]+$/))
    //  h = parseInt(h);
    var x = Number(h);
    if (h.match(/^[-]?([1-9]\d*|0)(\.\d+)?$/))
      h = GSIBV.Map.Util.reliefRound(x);
    else
      h = null;

    var nextElement = ( desc ? tr.previousSibling : tr.nextSibling);

    var nextH = undefined;
    if ( nextElement ) {
      try{
        nextH = MA.DOM.find( nextElement, "input.elevation")[0].value;
      } catch(ex){}
    }

    if (h != null && nextH) {
      nextH = nextH.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 65248);
      });
      nextH = nextH.replace(/[ー－‐]/g, "-");

      //if (nextH.match(/^-?[0-9]+$/))
      //  nextH = parseInt(nextH);
      if (nextH.match(/^[-]?([1-9]\d*|0)(\.\d+)?$/))
        nextH = GSIBV.Map.Util.reliefRound(Number(nextH));
      else
        nextH = null;

      if (nextH != null && h >= nextH) {
        h = nextH - 1;
        MA.DOM.find( tr, "input.elevation")[0].value=h;
      }
      else if (x != h){
        MA.DOM.find( tr, "input.elevation")[0].value=h;
      }
    }


    var prevElement = ( desc ? tr.nextSibling : tr.previousSibling);

    var prevH = undefined;
    if ( prevElement ) {
      try{
        prevH = MA.DOM.find( prevElement, "input.elevation")[0].value;
      } catch(ex){}
    }


    if (h != null && prevH) {
      prevH = prevH.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 65248);
      });
      prevH = prevH.replace(/[ー－‐]/g, "-");

      //if (prevH.match(/^-?[0-9]+$/))
      //  prevH = parseInt(prevH);
      if (prevH.match(/^[-]?([1-9]\d*|0)(\.\d+)?$/))
        prevH = GSIBV.Map.Util.reliefRound(Number(prevH));
      else
        prevH = null;

      if (prevH != null && h <= prevH) {
        h = prevH + 1;
        MA.DOM.find( tr, "input.elevation")[0].value=h;
      }
      else if (x != h){
        MA.DOM.find( tr, "input.elevation")[0].value=h;
      }
    }

    if (h != null) {
      var nextTr = ( desc ? tr.previousSibling : tr.nextSibling);
      if (nextTr) {
        var fromElements = MA.DOM.find(nextTr,".from");
        if ( fromElements.length > 0) fromElements[0].innerHTML = h;
      }
    }
  }

  _showNewPanel() {
    if ( !this._newPanelContainer) {
      this._newPanelContainer = MA.DOM.create("div");
      this._newPanelContainer.style.display = "none";
      MA.DOM.addClass( this._newPanelContainer, "-gsibv-relief-newpanel" );

      this._newPanelListContainer = MA.DOM.create("div");
      MA.DOM.addClass( this._newPanelListContainer, "-container" );


      this._createNewPanel(this._newPanelListContainer);
      
      this._newPanelContainer.appendChild( this._newPanelListContainer);
      this._contents.appendChild( this._newPanelContainer);
      
      try {
        this._newPanelScrollBar = new PerfectScrollbar(this._newPanelListContainer);
      } catch (e) { console.log(e); }


    }
    this._newAutoRadio.checked = true;
    this._refreshNewPanel();
    MA.DOM.fadeIn( this._newPanelContainer, 300);
  }
  _hideNewPanel () {
    if ( this._demRangeLoader ) {
      this._demRangeLoader.cancel();
      this._demRangeLoader = undefined;
    }
    if ( this._newPanelLoadingContainer ) this._newPanelLoadingContainer.style.display = "none";
    if ( this._newPanelContainer ) this._newPanelContainer.style.display = "none";
  }
  _createNewPanel(container) {

    var dl = MA.DOM.create("dl");
    this._createNewPanelAuto( dl );
    this._createNewPanelBunrui(dl);
    container.appendChild( dl );
    this._createNewPanelOptions(container);
  }

  _refreshNewPanel() {
    if ( this._newAutoRadio.checked) {
      MA.DOM.removeClass(this._newPanelAutoContents,"disable" );
      MA.DOM.addClass(this._newPanelSplitContents,"disable" );
    } else {
      MA.DOM.addClass(this._newPanelAutoContents,"disable" );
      MA.DOM.removeClass(this._newPanelSplitContents,"disable" );
    }
  }

  _createNewPanelAuto(container) {
    // 表示範囲の標高値から作成

    var dt = MA.DOM.create("dt");

    this._newAutoRadio =MA.DOM.create("input");
    MA.DOM.addClass( this._newAutoRadio, "normalcheck" );
    MA.DOM.on( this._newAutoRadio, "click", MA.bind(this._refreshNewPanel,this));

    this._newAutoRadio.checked = true;
    this._newAutoRadio.setAttribute("id", "gsi_editreliefdialog_newmode_radio_auto");
    this._newAutoRadio.setAttribute("name", "gsi_editreliefdialog_newmode_radio");
    this._newAutoRadio.setAttribute("type", "radio");

    var label =MA.DOM.create("label");
    label.setAttribute("for", "gsi_editreliefdialog_newmode_radio_auto");
    label.innerHTML = "表示範囲の標高値から作成";
    dt.appendChild(this._newAutoRadio);
    dt.appendChild(label);
    container.appendChild(dt);

    var dd = MA.DOM.create("dd");
    this._newPanelAutoContents = dd;
    var msg = MA.DOM.create("div");
    msg.innerHTML= "※表示している範囲の最高標高・最低標高から、自動で色分けします";
    dd.appendChild( msg);

    container.appendChild(dd);


  }

  

  _createNewPanelBunrui(container) {
    var dt = MA.DOM.create("dt");

    this._newSplitRadio =MA.DOM.create("input");
    MA.DOM.addClass( this._newSplitRadio, "normalcheck" );
    MA.DOM.on( this._newSplitRadio, "click", MA.bind(this._refreshNewPanel,this));
    this._newSplitRadio.checked = true;
    this._newSplitRadio.setAttribute("id", "gsi_editreliefdialog_newmode_radio_split");
    this._newSplitRadio.setAttribute("name", "gsi_editreliefdialog_newmode_radio");
    this._newSplitRadio.setAttribute("type", "radio");

    var label =MA.DOM.create("label");
    label.setAttribute("for", "gsi_editreliefdialog_newmode_radio_split");
    label.innerHTML = "分類数を指定して作成";
    dt.appendChild(this._newSplitRadio);
    dt.appendChild(label);
    container.appendChild(dt);


    var dd = MA.DOM.create("dd");
    this._newPanelSplitContents = dd;
    
    var table = MA.DOM.create("table");
    var tbody = MA.DOM.create("tbody");

    var createHiRow = MA.bind( function(tbody,title, color, h) {
        
      var tr = null;
      var td = null;
      var span = null;
      tr = MA.DOM.create("tr");
      td = MA.DOM.create("td");
      td.innerHTML = title;
      tr.appendChild(td);

      var input = MA.DOM.create("input");
      input.setAttribute("type","text");
      input._defaultValue = h;
      input._currentValue = h;
      input.value = h;

      MA.DOM.on(input, "focus", MA.bind(function(){
        setTimeout( MA.bind(function(){this.select();}, this),0);
      }, input ) );

      

      td = MA.DOM.create("td");
      span = MA.DOM.create("span");
      span.innerHTML = "mの色";
      td.appendChild(input);
      td.appendChild( span);
      tr.appendChild(td);
      
      var a = MA.DOM.create("a");
      a.setAttribute("href","javascript:void(0);");
      MA.DOM.addClass(a,"color");
      a.style.backgroundColor = color;
      a._color = color;

      MA.DOM.on(a,"click", MA.bind(function(target){
        if ( !this._colorPicker) {
          this._colorPicker = new GSIBV.UI.ColorPicker();
          this._colorPicker.zIndex = 50000;
          this._colorPicker.noAlpha = true;
          this._colorPicker.useClearButton = true;
          this._colorPicker.on("change",MA.bind(function(evt){
            //this._colorPicker._currentTarget._color = ;
            var color = evt.params.color;
            if ( color ) {
              MA.DOM.removeClass( this._colorPicker._currentTarget, "transparent");
              this._colorPicker._currentTarget._color =this._rgbToColor(MA.Color.fix(color.getRGB()) );
              this._colorPicker._currentTarget.style.backgroundColor =this._colorPicker._currentTarget._color;
            } else {
              this._colorPicker._currentTarget._color =null;
              this._colorPicker._currentTarget.style.backgroundColor ="transparent";
              MA.DOM.addClass( this._colorPicker._currentTarget, "transparent");
            }
          },this));
        }
        this._colorPicker._currentTarget = target;
        this._colorPicker.show(target,GSIBV.Map.Layer.FreeRelief.colorStringToRGBA(target._color));
      },this,a));

      td = MA.DOM.create("td");
      td.appendChild(a);

      tr.appendChild( td);

      tbody.appendChild(tr);

      return {
        input : input,
        colorInput : a
      };
    }, this );
    
    

    var checkProc = function(input){
      var h = input.value;
      h = h.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 65248);
      });
      h = h.replace(/[ー－‐]/g, "-");


      
      if (h.match(/^[-]?([1-9]\d*|0)(\.\d+)?$/))
        h = GSIBV.Map.Util.reliefRound(Number(h));
      else
        h= null;
      /*
      if (h.match(/^-?[0-9]+$/))
        h = parseInt(h);
      else
        h = null;
      */
      if ( h == null ) {
        h = input._currentValue;
      }
      input.value = h;
      input._currentValue = h;

    };

    // 最低
    var low = createHiRow( tbody, "最低標高","#2db4b4",0);
    this._lowElevationInput = low.input;
    this._lowColorInput = low.colorInput;
    MA.DOM.on(low.input, "blur", MA.bind(checkProc,this, low.input));


    // 最高
    var hi = createHiRow( tbody, "最高標高","#b43d09", 4000);
    this._hiElevationInput = hi.input;
    this._hiColorInput = hi.colorInput;
    MA.DOM.on(hi.input, "blur", MA.bind(checkProc,this, hi.input));
    
    // 分類数
    var tr = null;
    var td = null;
    tr = MA.DOM.create("tr");
    td = MA.DOM.create("td");
    td.innerHTML = "分類数";
    tr.appendChild(td);

    var input = MA.DOM.create("input");
    input.setAttribute("type","text");
    input._defaultValue = 5;
    input._currentValue = 5;
    input.value = 5;

    MA.DOM.on(input, "focus", MA.bind(function(){
      setTimeout( MA.bind(function(){this.select();}, this),0);
    }, input ) );
    MA.DOM.on(input, "blur", MA.bind(checkProc,this, input));


    td = MA.DOM.create("td");
    td.setAttribute("colspan",2);
    td.appendChild(input);
    tr.appendChild(td);
    tbody.appendChild(tr);
    this._splitCountInput = input;

    table.appendChild(tbody);
    dd.appendChild(table);
    container.appendChild(dd);

  }

  _createNewPanelOptions(container) {
     // 反映、作成ボタン等
     var optionFrame = MA.DOM.create("div");
     MA.DOM.addClass(optionFrame, "option-frame");


     
    this._createAfterReflectionInput =MA.DOM.create("input");
    MA.DOM.addClass( this._createAfterReflectionInput, "normalcheck" );
    this._createAfterReflectionInput.checked = true;
    this._createAfterReflectionInput.setAttribute("id", "gsi_editreliefdialog_create_afterreclection");
    this._createAfterReflectionInput.setAttribute("type", "checkbox");

    var label =MA.DOM.create("label");
    label.setAttribute("for", "gsi_editreliefdialog_create_afterreclection");
    label.innerHTML = "読み込み後地図に反映";
    optionFrame.appendChild(this._createAfterReflectionInput);
    optionFrame.appendChild(label);
    container.appendChild(optionFrame);



    var buttonFrame = MA.DOM.create("div");
    MA.DOM.addClass(buttonFrame, "button-frame");

    var btn = MA.DOM.create("button");
    btn.innerHTML = "上記の内容で作成";
    
    MA.DOM.on( btn, "click", MA.bind(function () {
      if( this._newSplitRadio.checked ) 
        this._createNewData();
      else
        this._createAutoNewData();
    }, this) );

    buttonFrame.appendChild(btn);


    btn = MA.DOM.create("button");
    btn.innerHTML = "キャンセル";
    
    MA.DOM.on( btn, "click", MA.bind(function () {
      MA.DOM.fadeOut( this._newPanelContainer, 300 );
    }, this) );

    buttonFrame.appendChild(btn);

    container.appendChild(buttonFrame);
  }


  _createNewData() {
    
    var getInt = function (value) {
      value = value.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 65248);
      });
      value = value.replace(/[ー－‐]/g, "-");

      if (value.match(/^-?[0-9]+$/))
        return parseInt(value);
      else
        return null;
    };

    var getNumber = function(value) {
      value = value.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 65248);
      });
      value = value.replace(/[ー－‐]/g, "-");

      
      if (value.match(/^[-]?([1-9]\d*|0)(\.\d+)?$/))
        return GSIBV.Map.Util.reliefRound(Number(value));
      else
        return null;
    };

    var low = getNumber(this._lowElevationInput.value);
    var hi = getNumber(this._hiElevationInput.value);
    var num = getInt(this._splitCountInput.value);
    num += 1;


    var loColor = this._lowColorInput._color;
    var hiColor = this._hiColorInput._color;

    var msg = '';
    if (low == null)
      msg += '最低標高を正しく入力して下さい';
    if (hi == null)
      msg += (msg == '' ? '' : '\n') + '最高標高を正しく入力して下さい';
    if (num == null || num < 2)
      msg += (msg == '' ? '' : '\n') + '分類数を正しく入力して下さい';

    if (msg != '') {
      alert(msg);
      return;
    }
    
    this._data = {
      gradate: false,
      useHillshademap: false,
      colors: this._makeColors( num, low, hi, loColor, hiColor)
    };
    this._updateList();
    this._refreshGradationBar();
    if ( this._createAfterReflectionInput.checked) {
      this._commit();
    }
    MA.DOM.fadeOut( this._newPanelContainer, 300 );
    /*
    this._refreshReriefEdit(data);
    if (this._createAfterReflectionInput.is(":checked")) {
      this._reflection();
    }
    if( this._newDataView ) this._newDataView.fadeOut(200);
    */
  }

  
  _createAutoNewData() {
    this._demRangeLoader = new GSIBV.UI.Dialog.FreeRelief.DemRangeLoader(this._map);
    this._demRangeLoader.on("load", MA.bind(function(evt){
      if ( this._newPanelContainer ) this._newPanelContainer.style.display = "none";
      else this._newPanelLoadingContainer.style.display = "none";

      if ( evt.params.lo != undefined) {
        var low = Math.floor( evt.params.lo);
        var hi = Math.ceil( evt.params.hi);
        var colors = GSIBV.Map.Layer.FreeRelief.getDefaultData().colors;
        
        if ( low < 0 ) low = 0;
        if ( hi < 0 ) hi = 0;
        
        if ( low < hi) {
          colors[ 0].h = low;
          for (var i = 1; i < colors.length - 2; i++) {
            var p = (1 / (colors.length - 1)) * (i);
            colors[i].h = Math.round(low + (hi - low) * p);
          }
          colors[ colors.length-2].h = hi;
          

          this._data = {
            gradate: false,
            useHillshademap: false,
            colors: colors
          };
          this._updateList();
          this._refreshGradationBar();
          if ( !this._createAfterReflectionInpu || this._createAfterReflectionInput.checked) {
            this._commit();
          }
          if ( this._newPanelContainer )MA.DOM.fadeOut( this._newPanelContainer, 300 );
          else this._newPanelLoadingContainer.style.display = "none";
          return;
        }
      }

      
      var dialog = new GSIBV.UI.Dialog.Alert();
      dialog.autoDestroy = true;
      dialog.show("エラー", "標高データを取得できませんでした", [
        { "id": "ok", "title": "閉じる" }
      ]);

    },this));


    if ( !this._newPanelLoadingContainer) {
      this._newPanelLoadingContainer = MA.DOM.create("div");
      MA.DOM.addClass(this._newPanelLoadingContainer, "-loading-panel");
      if ( this._newPanelContainer )
        this._newPanelContainer.appendChild( this._newPanelLoadingContainer );
      else
        this._contents.appendChild( this._newPanelLoadingContainer );
      
    }

    if ( this._newPanelContainer) this._newPanelContainer.style.display = "";
    else this._newPanelLoadingContainer.style.display = "";

    this._demRangeLoader.load();
    
  }

  
  _makeColors (num, low, hi, loColor, hiColor) {
    
    var loRgb = GSIBV.Map.Layer.FreeRelief.colorStringToRGBA(loColor);
    var hiRgb = GSIBV.Map.Layer.FreeRelief.colorStringToRGBA(hiColor);

    var colors = [];

    colors.push({
      h: low,
      color: loColor
    });

    for (var i = 0; i < num - 2; i++) {
      var color = {};

      var p = (1 / (num - 1)) * (i + 1);
      color.r = Math.round(loRgb.r + ((hiRgb.r - loRgb.r) * p));
      color.g = Math.round(loRgb.g + ((hiRgb.g - loRgb.g) * p));
      color.b = Math.round(loRgb.b + ((hiRgb.b - loRgb.b) * p));
      if (color.r > 255) color.r = 255;
      if (color.g > 255) color.g = 255;
      if (color.b > 255) color.b = 255;


      colors.push({
        h: Math.round(low + (hi - low) * p),
        color: this._rgbToColor(color)
      });
    }

    colors.push({
      h: hi,
      color: hiColor
    });

    colors.push({
      h: null,
      color: hiColor
    });

    return colors;
  }


};



GSIBV.UI.Dialog.FreeRelief.DemRangeLoader = class extends MA.Class.Base {

  constructor(map) {
    super();
    this._map = map;
  }

  cancel() {
    
    for( var i=0; i<this._loaders.length; i++ ) {
      this._loaders[i].destroy();
    }
    this._loaders = [];
  }
  load() {


    this._lo = undefined;
    this._hi = undefined;

    var zoom = GSIBV.Map.Layer.TileImage.getZoom(this._map.map);


    var mapBounds = this._map.map.getBounds();

    var northWest = mapBounds.getNorthWest();
    var southEast = mapBounds.getSouthEast();

    this._lt = GSIBV.Map.Layer.TileImage.latlngToCoords(northWest.lat, northWest.lng, zoom);
    this._rb = GSIBV.Map.Layer.TileImage.latlngToCoords(southEast.lat, southEast.lng, zoom);

    var coordsList = GSIBV.Map.Layer.TileImage.getCoordsList(this._map.map,zoom);
    var loaders = [];

    for( var i=0; i<coordsList.length; i++ ) {
      var coords = coordsList[i];
      var loader = new GSIBV.DEMLoader( coords.x, coords.y, coords.z,{
        useHillshademap:false
      });
      loader.on("load", MA.bind(this._onDemLoad, this, loader, coords ) );
      loaders.push( loader );
    }
    
    this._loaders= loaders;
    for( var i=0; i<this._loaders.length; i++ ) {
      this._loaders[i].load();
    }
  }

  _onDemLoad(loader, coords, evt) {
    var idx = this._loaders.indexOf( loader );
    if ( idx >= 0 ) {
      this._loaders.splice(idx,1);
    } else {
      return;
    }
    var data = evt.from.getData();
    if ( data ) {
      var idx = 0;
      for (var y = 0; y < 256; ++y) {
        
        if ( coords.y == this._lt.y) {
          if ( y < this._lt.py) continue;
        }  else if ( coords.y == this._rb.y) {
          if ( y > this._rb.py) continue;
        }

        for (var x = 0; x < 256; ++x) {
          var h= data[idx];
          idx++;
          
          if ( coords.x == this._lt.x) {
            if ( x < this._lt.px) continue;
          }  else if ( coords.x == this._rb.x) {
            if ( x > this._rb.px) continue;
          }

          if ( h == null) continue;



          if ( this._lo == undefined || this._lo > h ) this._lo = h;
          if ( this._hi == undefined || this._hi < h ) this._hi = h;
        }
      }
    }

    if ( this._loaders.length <= 0 ) {
      this.fire("load",{
        lo : this._lo,
        hi : this._hi
      });
    }
  }
};
