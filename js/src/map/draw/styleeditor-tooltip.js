GSIBV.Map.Draw.SeTooltip = class extends MA.Class.Base {
    constructor(targetNode, targetAreaNode) {
      super();
      this._message = "";
      this._targetNode = targetNode;
      this._targetAreaNode = targetAreaNode;
      if(this._targetNode) this._create();
      else this.destroy();
    }

    set message( value ) {
      this._message = value || "";
      if(this._message) this._update(this._message);
      else this._hide();
    }
    
    clear() {
      this._message = "";
      this._hide();
    }

    _create() {
      if ( this._container ) return;
      this._container = MA.DOM.create("div");
      MA.DOM.addClass(this._container,"style-editor-draw-tooltip")
      this._messageContainer = MA.DOM.create("p");
      this._container.appendChild( this._messageContainer );
      if(this._targetNode.parentNode) {
        this._targetNode.parentNode.insertBefore(this._container, this._targetNode);
      }
      this._hide();

      if ( !this._mouseMoveHandler ) {
        this._mouseMoveHandler = MA.bind( this._onMouseMove, this );
        MA.DOM.on( document.body, "mousemove", this._mouseMoveHandler);
      }
    }
  
    destroy() {
      this._message = "";
      if ( this._mouseMoveHandler ) {
        MA.DOM.off( document.body, "mousemove", this._mouseMoveHandler);
        this._mouseMoveHandler = undefined;
      }
      if ( !this._container) return;
  
      if ( this._container.parentNode ) {
        this._container.parentNode.removeChild( this._container);
      }
      this._container = undefined;
      this._messageContainer = undefined;
    }

    _update(message){
        this._messageContainer.innerHTML = message || "";
    }
  
    _show() {
      this._update(this._message);
      this._container.style.display = "block";
    }
  
    _hide() {
      this._update("");
      this._container.style.display = "none";
    }
  
    _onMouseMove(evt) {
      var pos = this._validPosition(evt);

      if(this._message && pos) {
        this._container.style.top = (pos.y - 30 ) + "px";
        this._container.style.left = ( pos.x + 10 ) + "px";
        this._show();
      } else {
          this._hide();
      }
    }
  
    _validPosition(evt) {
      var pos = {
        x : evt.pageX,
        y : evt.pageY
      };
      var validArea = this._targetAreaNode ? this._targetAreaNode.getBoundingClientRect() : this._targetNode.getBoundingClientRect();
      if(validArea.right < pos.x || pos.x < validArea.left) return null;
      if(validArea.bottom < pos.y || pos.y < validArea.top) return null;
      return pos;
    }
  };