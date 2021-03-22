function dslorethumbnail_click(list) {
  list  = list.split("\\");   
  var names={};
  names["LoreName"] = "碑名";
  names["DisasterName"]="災害名";
  names["DisasterKind"] = "災害種別";
  names["LoreYear"] = "建立年";
  names["Address"]="所在地";
  names["DisasterInfo"] = "伝承内容";
  names["Image"]="概要";

  var title = "";
  var id = "";
  for(var i = 0; i < list.length; i+=2){
    if (list[i] == "LoreName"){
      title = list[i + 1];
    }
    if (list[i] == "ID"){
      id = list[i + 1];
    }
  }

  var data = {
    id : id,
    title : title,
    list : [],
    images : []
  };
  
  for(var j = 0; j < list.length; j+=2){
    var key =list[j];
    if (!names[key])continue;
    if (key == "Image"){
      data.images.push( {
        "type":"image",
        "src" : list[j+1]
      });
      

    } else {
      if ( (list[j] != "") && (list[j + 1] != "") ){
        
        if (key == "DisasterInfo"){
          var ms = /\[(.*?)\]\((.*?)\)/;
          var mt = ms.exec(list[j + 1]);
          while(mt != null){
            var hit = mt[0];
            var atag = "<a href='" + mt[2] + "' target=_blank>" + mt[1] + "</a>";
            list[j + 1] = list[j + 1].replace(hit, atag);
            mt = ms.exec(list[j + 1]);
          }
        }
        data.list.push( {
          "type":"data",
          "key" : key,
          "title" : names[key],
          "content" : list[j + 1]
        });
      }
    }
  }
  GSIBV.application.showDsloretDialog(data);
}