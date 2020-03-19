
GSIBV.UI.Popup = class extends MA.Class.Base {

  constructor(parent) {
    super();
    this._parent = (parent ? parent : document.body);
    this._container = null;

    this._className = ['-gsibv-ui-popup'];
    this._fadeSpeed = 400;
    this._opacity = 1;
    this._autoHide = true;
  }


  show(left, top) {
    this._create();

    this._container.style.visibility = 'hidden';
    this._container.style.display = '';

    var size = MA.DOM.size(this._container);
    var parentSize = MA.DOM.size(this._container.offsetParent);
    if (size.width + left > parentSize.width) {
      left = parentSize.width - size.width - 2;
    }
    if (size.height + top > parentSize.height) {
      top = parentSize.height - size.height - 2;
    }
    this._container.style.left = left + 'px';
    this._container.style.top = top + 'px';

    this._container.style.display = 'none';
    this._container.style.visibility = 'visible';

    MA.DOM.fadeIn(this._container, this._fadeSpeed, this._opacity);

    if (!this._documentMouseDownHandler) {
      this._documentMouseDownHandler = MA.bind(this._onDocumentMouseDown, this);
      MA.DOM.on(document.body, "mousedown", this._documentMouseDownHandler);
    }
  }

  hide() {

    if (this._documentMouseDownHandler) {
      MA.DOM.off(document.body, "mousedown", this._documentMouseDownHandler);
      this._documentMouseDownHandler = null;
    }

    MA.DOM.fadeOut(this._container, this._fadeSpeed);
  }

  _createContent(content) {

  }

  _create() {
    if (this._container) return;
    this._container = MA.DOM.create('div');
    MA.DOM.addClass(this._container, this._className);
    this._container.style.position = 'absolute';
    this._container.style.display = 'none';

    this._content = MA.DOM.create('div');
    MA.DOM.addClass(this._content, "-gsibv-ui-popup-content");
    this._content.style.position = 'relative';
    this._container.appendChild(this._content);

    this._createContent(this._content);

    this._parent.appendChild(this._container);
  }

  _onDocumentMouseDown(e) {
    if (!this._autoHide) return;
    if (!MA.DOM.isChild(this._container, e.target) && this._container != e.target) {
      this.hide();
    }

  }

}


GSIBV.UI.Popup.Menu = class extends MA.Class.Base {

  constructor() {
    super();
  }
  destroy() {
    this._destroyMouseDownHandler();
    if ( this._container ) {
      this._container.parentNode.removeChild( this._container );
      delete this._container;
      this._container = null;
    }
  }

  set items( items) {
    this._items = items;
    this._initMenuItems();
  }
  
  set parentContainer( container) {
    this._parentContainer = container;
  }

  
  get isVisible() {
    if ( !this._container)return false;
    return ! ( this._container.style.display == "none");

  }
  show(ownerButton, pos)  {
    this._showing = true;
    this._ownerButton = ownerButton;
    this._position = pos;

    this._create();
    this._initMenuItems();
    this._initMouseDownHandler();
    this._adjust();
    MA.DOM.fadeIn(this._container, 300);
    this.fire("show");
  }

  hide() {

    this._showing = false;
    if (!this._bodyMouseDownHandler) return;

    this._destroyMouseDownHandler();
    MA.DOM.fadeOut(this._container, 300);
    this.fire("hide");
  }

  _initMenuItems() {
    if ( !this._items || !this._container ) return;
    
    this._ul.innerHTML ='';

    for( var i=0; i<this._items.length; i++ ) {
      var li= this._createItem( this._items[i]);
      this._ul.appendChild( li );
    }
  }

  _createItem(item) {
    var li= MA.DOM.create("li");

    if ( item.type=="separator") {
      MA.DOM.addClass(li, "separator");
      return li;
    }

    var a = MA.DOM.create("a");
    a.setAttribute("href", "javascript:void(0);");
    if ( item.type == "check") {

      var id = MA.getId( "gsi-popup-menu-check" );
      var check = MA.DOM.create("input");
      MA.DOM.addClass(check, "normalcheck")
      check.setAttribute("type", "checkbox");
      check.setAttribute("id", id);
      if ( item.checked) {
        check.setAttribute("checked", true);
      }
      var label = MA.DOM.create("label");
      label.setAttribute("for", id);

      label.innerHTML = item.title;
      a.appendChild(check);
      a.appendChild(label);

      MA.DOM.on(check,"click", MA.bind(function(item,check){
        if ( !this._showing ) return;
        this.fire( "select", {"item":item, "checked":check.checked} );
        this.hide();
      },this,item,check));

      
    } else if ( item.type == "radio") {
        var id = MA.getId( "gsi-popup-menu-radio" );
        var name = MA.getId( "gsi-popup-menu-radio-" + item.name );
        var check = MA.DOM.create("input");
        MA.DOM.addClass(check, "normalcheck")
        check.setAttribute("type", "radio");
        check.setAttribute("id", id);
        check.setAttribute("name", name);
        if ( item.checked) {
          check.setAttribute("checked", true);
        }
        var label = MA.DOM.create("label");
        label.setAttribute("for", id);
  
        label.innerHTML = item.title;
        a.appendChild(check);
        a.appendChild(label);
  
        MA.DOM.on(check,"click", MA.bind(function(item,check){
          if ( !this._showing ) return;
          this.fire( "select", {"item":item, "checked":check.checked} );
          this.hide();
        },this,item,check));
  


    } else {
      a.innerHTML = item.title;
      if ( item.class ) {
        MA.DOM.addClass(a, item.class );
      }
      MA.DOM.on(a,"click", MA.bind(function(item){
        if ( !this._showing ) return;
        this.fire( "select", {"item":item} );
        this.hide();
      },this,item));
    }
    li.appendChild( a );
    return li;
  }

  _adjust() {

    this._container.style.left = '0px';
    this._container.style.top = '0px';
    this._container.style.visibility = 'hidden';
    this._container.style.display = '';
    var menuSize = MA.DOM.size(this._container);
    this._container.style.display = 'none';
    this._container.style.visibility = 'visible';
    var windowSize = MA.DOM.size(this._container.parentNode);

    var pos = {
      left :0,
      top:0
    };

    var left = 0;
    var top = 0;

    if ( this._ownerButton ) {
      pos = MA.DOM.offset(this._ownerButton);
      var size = MA.DOM.size(this._ownerButton);
      if ( this._position == "right") {
        left = (pos.left + size.width+6);
        top = (pos.top-10);
      } else {
        left = (pos.left + size.width - menuSize.width);
        top = (pos.top + size.height);
      }
    } else if ( this._position ) {
      left = this._position.left;
      top = this._position.top;
      pos.top = top;
      pos.left = left;
    }

    if (left < 0) left = 0;
    if (left + menuSize.width > windowSize.width) left = windowSize.width - menuSize.width - 1;

    if (top + menuSize.height > windowSize.height) top = pos.top - menuSize.height;

    this._container.style.left = left + 'px';
    this._container.style.top = top + 'px';
  }

  _initMouseDownHandler() {
    if (!this._bodyMouseDownHandler) {
      this._bodyMouseDownHandler =  MA.bind( this._onBodyMouseDown, this );
      MA.DOM.on(document.body, "mousedown", this._bodyMouseDownHandler);
    }
  }


  _destroyMouseDownHandler() {
    if (this._bodyMouseDownHandler) {
      MA.DOM.off(document.body, "mousedown", this._bodyMouseDownHandler);
      this._bodyMouseDownHandler =  null;
    }
  }


  _onBodyMouseDown(e) {
    if (e.type != "ps-scroll-y") {
      var target = e.target;

      while (target) {
        if (target == this._container || target == this._parentContainer) {
          return;
        }
        target = target.parentNode;
      }
    }

    this.hide();
  }
  _create() {
    if ( this._container ) {
      this._ul.innerHTML = '';
      return;
    }
    this._container = MA.DOM.create("div");
    MA.DOM.addClass(this._container, "-gsibv-popup-menu");
    var ul = MA.DOM.create("ul");
    this._ul = ul;
    this._container.appendChild(ul);

    this._container.style.display = 'none';


    MA.DOM.select("#main")[0].appendChild(this._container);

  }



};