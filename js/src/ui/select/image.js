GSIBV.UI.Select.Image = class extends MA.Class.Base {

  constructor(container, list) {
    super();
    this._container = container;
    this.list = list;
    this._selectedIndex = -1;
    this._initialize();
    
    this._onLangChange();
    this._langChangeHandler = MA.bind(this._onLangChange, this);
    GSIBV.application.on("langchange", this._langChangeHandler);

  }

  destroy() {
    
    if ( this._langChangeHandler ) {
      GSIBV.application.on("langchange", this._langChangeHandler );
      this._langChangeHandler = null;
    }

    if (this._popupContainer && this._popupContainer.parentNode) {
      this._popupContainer.parentNode.removeChild(this._popupContainer);
      delete this._popupContainer;
      this._popupContainer = null;
    }
  }

  set container(container) {
    this._container = container;
    this._initialize();
  }
  set list(list) {
    this._list = list;
  }
  get selectedId() {
    if (!this._list || this._selectedIndex < 0 || this._selectedGroup == undefined || this._selectedGroup.imageList.length - 1 < this._selectedIndex) {
      return undefined;
    }
    return this._selectedGroup.imageList[this._selectedIndex].id;
  }

  get selectedGroupId() {
    var selectedGroup = this.selectedGroup;
    return ( selectedGroup == undefined ? undefined : selectedGroup.id);
  }

  get selectedGroup() {
    if (!this._list || this._selectedIndex < 0 || this._selectedGroup == undefined || this._selectedGroup.imageList.length - 1 < this._selectedIndex) {
      return undefined;
    }

    return this._selectedGroup;
  }

  setSelected(groupId, id) {

    this._selectedGroup = null;

    for( var i=0; i<this._list.length; i++ )
    {
      if ( this._list[i].id == groupId) {
        this._selectedGroup = this._list[i];
        break;
      }
    }

    this._selectedIndex = -1;
    if ( this._selectedGroup != undefined) {
      for( var i=0; i<this._selectedGroup.imageList.length; i++ ) {
        
        if ( this._selectedGroup.imageList[i].id == id) {
          this._selectedIndex = i;
          break;
        }
      }
    }

    if ( this._groupSelect ) {
      if ( this._selectedGroup ) {
        this._groupSelect.value = this._selectedGroup.id;
      }
      this._refreshPopup();
    }
    this._refreshSelectedView();

  }
  /*
  set selectedId(id) {
    if (!this._list) return;

    for (var i = 0; i < this._list.length; i++) {
      if (this._list[i].id == id) {
        this.selectedIndex = i;
        break;
      }
    }
  }
  get selectedItem() {
    if (!this._list || this._selectedIndex < 0 || this._selectedIndex >= this._list.length) {
      return undefined;
    }

    return this._list[this._selectedIndex];
  }

  set selectedIndex(idx) {
    this._selectedIndex = idx;

    if (this._popupListUL) {
      var liList = MA.DOM.find(this._popupListUL, "li");

      for (var i = 0; i < liList.length; i++) {
        var li = liList[i];
        if (this._selectedIndex == i) {
          MA.DOM.addClass(li, "selected");
        } else {
          MA.DOM.removeClass(li, "selected");
        }
      }
    }

    this._refreshSelectedView();
  }
  */

  _refreshPopup() {
    if ( !this._popupListUL) return;
    var groupId = this._groupSelect.value;
    if (this._popupListUL) {
      var liList = MA.DOM.find(this._popupListUL, "li");

      for (var i = 0; i < liList.length; i++) {
        var li = liList[i];
        if (this._selectedIndex == i && this._selectedGroup.id == groupId) {
          MA.DOM.addClass(li, "selected");
        } else {
          MA.DOM.removeClass(li, "selected");
        }
      }
    }
  }

  _initialize() {
    if (!this._container) return;
    if (this._selectedView) return;

    this._selectedViewFrame = MA.DOM.create("div");
    MA.DOM.addClass(this._selectedViewFrame, "-gsibv-ui-imageselector");

    this._selectedView = MA.DOM.create("a");
    MA.DOM.addClass(this._selectedView, "main");
    this._selectedView.setAttribute("href", "javascript:void(0)");


    this._clearButton = MA.DOM.create("a");
    MA.DOM.addClass(this._clearButton, "button");
    MA.DOM.addClass(this._clearButton, "clear-button");
    this._clearButton.setAttribute("href", "javascript:void(0)");

    MA.DOM.on(this._clearButton, "click", MA.bind(this._onClearClick, this));


    this._selectedViewFrame.appendChild(this._selectedView);
    this._selectedViewFrame.appendChild(this._clearButton);

    this._container.appendChild(this._selectedViewFrame);
    this._refreshSelectedView();

    MA.DOM.on(this._selectedView, "click", MA.bind(this._onSelectedViewClick, this));

  }

  _onSelectedViewClick() {
    this._showPopup();
  }

  _onLangChange() {
    this._refreshSelectedView();
    var lang = GSIBV.application.lang;
    var editLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.EDITINPUT;

    if ( this._popupContainer){
      MA.DOM.find( this._popupContainer, "label.brighten-the-background")[0]
        .innerHTML = editLang["brighten-the-background"];
    }

  }

  _refreshSelectedView() {
    if (!this._list || this._selectedIndex < 0 || this._selectedGroup == undefined || this._selectedGroup.imageList.length - 1 < this._selectedIndex) {
      this._selectedIndex = -1;
    }



    var lang = GSIBV.application.lang;
    var editLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.EDITINPUT;


    if (this._selectedIndex < 0) {
      this._clearButton.style.display = 'none';
      if (this._selectedImageCanvas)
        this._selectedImageCanvas.style.display = 'none';
      this._selectedView.innerHTML = editLang["selectimage"];
      this._selectedView.setAttribute("title","");
      this._selectedView.style.paddingLeft = "4px";
      return;
    }
    this._clearButton.style.display = '';


    var item = this._selectedGroup.imageList[this._selectedIndex];
    var title = "[" + this._selectedGroup.title + "]" + item.title;
    this._selectedView.innerHTML = title;
    
    this._selectedView.setAttribute("title",title);
    if (!this._selectedImageCanvas) {
      this._selectedImageCanvas = MA.DOM.create('canvas');
      this._selectedImageCanvas.style.zIndex = 10;
      this._selectedImageCanvas.style.position = 'absolute';
      this._selectedImageCanvas.style.left = '4px';
      this._selectedImageCanvas.style.width = '14px';
      this._selectedImageCanvas.style.height = '14px';
      this._selectedImageCanvas.style.top = '50%';
      this._selectedImageCanvas.backgroundColor = '#fff';
      this._selectedImageCanvas.borderRadius = '3px';

      this._selectedImageCanvas.style.marginTop = '-7px';
      this._selectedViewFrame.appendChild(this._selectedImageCanvas);
    }

    this._selectedImageCanvas.width = item.img.width;
    this._selectedImageCanvas.height = item.img.height;
    var ctx = this._selectedImageCanvas.getContext("2d");

    ctx.clearRect(0, 0, 16, 16);
    ctx.beginPath();
    ctx.drawImage(item.img, 0, 0, item.img.width, item.img.height);

    this._selectedView.style.paddingLeft = "22px";
    this._selectedImageCanvas.style.display = 'block';
  }

  set bgBright(value) {
    this._bgBright = value ? true : false;

    if (!this._imageBGCheck) return;
    this._imageBGCheck.checked = this._bgBright;
    this._refreshImageBG();
  }

  _showPopup() {
    this._createPopup();
    if (!this._list || this._list.length <= 0) {
      this._hidePopup();
      return;
    }

    if (!this._bodyClickHandler) {
      this._bodyClickHandler = MA.bind(this._onBodyClick, this);
      MA.DOM.on(document.body, "mousedown", this._bodyClickHandler);
    }

    var pos = MA.DOM.offset(this._selectedView);
    var size = MA.DOM.size(this._selectedView);
    this._popupContainer.style.display = '';
    this._popupContainer._display = '';
    this._popupContainer.style.transition = "max-height 200ms";



    if (!this._popupContainerTransitionEndHandler) {
      this._popupContainerTransitionEndHandler = MA.bind(function () {
        if (this._listScrollBar) this._listScrollBar.update();
        if (this._popupContainer._display == 'none')
          this._popupContainer.style.display = 'none';
      }, this);
      MA.DOM.on(this._popupContainer, "transitionend", this._popupContainerTransitionEndHandler);
    }


    setTimeout(MA.bind(function () {
      this._popupContainer.style.maxHeight = '280px';

    }, this), 0);

  }
  _hidePopup() {

    if (this._bodyClickHandler) {
      MA.DOM.off(document.body, "mousedown", this._bodyClickHandler);
      this._bodyClickHandler = null;
    }

    if (!this._popupContainer) return;

    this._popupContainer._display = 'none';
    this._popupContainer.style.transition = "max-height 200ms";
    setTimeout(MA.bind(function () {
      this._popupContainer.style.maxHeight = '0px';

    }, this), 0);


    //this._popupContainer, 400 );
  }

  _onBodyClick(e) {
    var target = e.target;
    while (target) {
      if (this._popupContainer == target) {
        return;
      }
      target = target.parentNode;
    }

    this._hidePopup();

  }

  _refreshImageBG() {
    if ( this._imageBGCheck.checked ) {
      MA.DOM.addClass( this._popupListUL, "bright" );
    } else {
      MA.DOM.removeClass( this._popupListUL, "bright" );
    }
  }
  _createPopup() {
    if (this._popupContainer) return;


    var lang = GSIBV.application.lang;
    var editLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.EDITINPUT;
    this._popupContainer = MA.DOM.create("div");
    MA.DOM.addClass(this._popupContainer, "-gsibv-ui-imageselector-popup");
    this._popupContainer.style.position = 'absolute';
    this._popupContainer.style.display = 'none';


    this._popupHeader = MA.DOM.create("div");
    MA.DOM.addClass(this._popupHeader, "header");
    this._popupContents = MA.DOM.create("div");
    MA.DOM.addClass(this._popupContents, "contents");

    this._groupSelect = MA.DOM.create("select");
    this._groupSelect.setAttribute("name","icon-select");

    MA.DOM.on( this._groupSelect, "change", MA.bind(function(){
      this._refreshImageList();
    },this ) );

    var checkId = MA.getId("imageselector-imagebg-check");
    this._imageBGCheck = MA.DOM.create("input");
    this._imageBGCheck.setAttribute("type","checkbox");
    this._imageBGCheck.setAttribute("id",checkId);
    MA.DOM.addClass(this._imageBGCheck, "normalcheck");

    var label = MA.DOM.create("label");
    MA.DOM.addClass( label, "brighten-the-background" );

    label.setAttribute("for",checkId);
    label.innerHTML = editLang["brighten-the-background"];

    var checkFrame = MA.DOM.create("div");
    MA.DOM.addClass(checkFrame, "image-bgcheck-frame");

    if  (this._bgBright) {
      this._imageBGCheck.checked = true;
    }
    MA.DOM.on( this._imageBGCheck, "click", MA.bind(function(){
      this._refreshImageBG();
    },this) );


    checkFrame.appendChild( this._imageBGCheck );
    checkFrame.appendChild( label);


    for (var i = 0; i < this._list.length; i++) {
      var option = MA.DOM.create("option");
      var option = document.createElement('option');
      option.value = this._list[i].id;
      option.appendChild(document.createTextNode(this._list[i].title));
      this._groupSelect.appendChild(option);

    }

    if ( this._selectedGroup) {
      this._groupSelect.value = this._selectedGroup.id;
    }

    this._popupHeader.appendChild(this._groupSelect);
    this._popupHeader.appendChild(checkFrame);
    

    this._popupListUL = MA.DOM.create("ul");

    this._popupContainer.appendChild(this._popupHeader);
    this._popupContents.appendChild(this._popupListUL);
    this._popupContainer.appendChild(this._popupContents);
    MA.DOM.select("#main")[0].appendChild(this._popupContainer);
    //this._selectedViewFrame.appendChild(this._popupContainer);


    try {
      this._listScrollBar = new PerfectScrollbar(this._popupContents);
    } catch (e) { }

    
    /*
    
    */

    this._popupContainer.style.visibility = 'hidden';
    this._popupContainer.style.display = '';
    this._refreshImageBG();
    this._refreshImageList();

    this._popupContainer.style.display = 'none';
    this._popupContainer.style.visibility = 'visible';
  }

  _refreshImageList() {

    this._popupListUL.innerHTML = '';
    this._popupContents.scrollY = 0;

    var groupId = this._groupSelect.value;
    var group = null;

    for (var i = 0; i < this._list.length; i++) {
      var option = MA.DOM.create("option");
      var option = document.createElement('option');
      option.value = this._list[i].id;
      if ( this._list[i].id == groupId ) {
        group = this._list[i];
      }
    }


    var liList = [];
    for (var i = 0; i < group.imageList.length; i++) {
      var item = group.imageList[i];
      var li = MA.DOM.create("li");
      if( item.id=="unknown") li.style.display = 'none';
      liList.push(li);
      
      if ( this._selectedGroup && this._selectedGroup.id == groupId && 
        this._selectedIndex == i ) {
        MA.DOM.addClass(li, "selected");
      }
      /*
      if (this._selectedIndex == i) {
        MA.DOM.addClass(li, "selected");
      }
      */

      var a = MA.DOM.create("a");
      a.setAttribute("href", "javascript:void(0)");
      var imgFrame = MA.DOM.create("div");
      MA.DOM.addClass(imgFrame, "imgframe");
      var titleFrame = MA.DOM.create("div");
      MA.DOM.addClass(titleFrame, "titleframe");

      a.setAttribute("title", item.title);

      var w = item.img.width;
      var h = item.img.height;

      if (w > 60 || h > 60) {
        if (w > h) {
          var w2 = w;
          w = 60;
          h = Math.floor(h * (w / w2));
        } else {
          var h2 = h;
          h = 60;
          w = Math.floor(w * (h / h2));
        }
      }
      //imgFrame.style.height = h + "px";
      item.img.style.width = w + "px";
      item.img.style.height = h + "px";
      item.img.style.marginLeft = -Math.round(w/2) + "px";
      item.img.style.marginTop = -Math.round(h/2) + "px";

      
      titleFrame.innerHTML = item.title;

      imgFrame.appendChild(item.img);
      a.appendChild(imgFrame);
      a.appendChild(titleFrame);

      MA.DOM.on(a, "click", MA.bind(this._onSelect, this, group, i));

      li.appendChild(a);
      this._popupListUL.appendChild(li);
    }


  }

  _onClearClick() {
    this.selectedIndex = -1;
    this._hidePopup();
  }
  _onSelect(group, idx) {
    this._selectedGroup = group
    this._selectedIndex = idx;
    this._refreshPopup();
    this._refreshSelectedView();
    this._hidePopup();
  }
};