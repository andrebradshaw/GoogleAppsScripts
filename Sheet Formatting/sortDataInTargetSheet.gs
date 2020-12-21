const transpose = (a)=>  a[0].map((_, c)=> a.map(r=> r[c])); //https://gist.github.com/femto113/1784503
const nameCase = (s) => s && typeof s == 'string' ? s.split(/(?=[^ğᴀғʀńŃŌŌŚŠśšŪūÿłžźżŁŽŹŻçćčÇĆČáāàâäãåÁÀÂÄÃĀĀÅĀÆæéèêëęēėÉÈÊËíìîïīįñÑóòôöõøœÓÒÔÖÕØŒßÚÙÛÜúùûüřa-zA-Z])\b/).map(el=> el.replace(/\w\S*/g, txt=> txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())).join('').replace(/(?<=\bMc)\w/ig, t=> t.charAt(0).toUpperCase()) : s;
const millisecondsToYears = (m) => m && /^\d[\d.]*$/.test(m) ? Math.round((m/3.154e+10)*1000)/1000 : m;

function table2JSON(table){
  const arr = [];
  for(let i=1; i<table.length; i++){
    let obj = {};
    for(let h=0; h<table[0].length; h++){
      obj[table[0][h]] = table[i][h];
    }
    arr.push(obj)
  }
  return arr;
}

function sortDataInTargetSheet(){
  const now_date = new Date().getTime();

  const ss_key = SpreadsheetApp.openById('1mnsiO_gTNXV4wHLtRutNIwIYX3M7SqahSme4OHp6CA0');
  const ss_target = SpreadsheetApp.openById('1_moCWY6Pw1p1IWdbr4QbOf5m9br_iaiMcP88CuxJAG8');
  const ss_parsed = SpreadsheetApp.create(ss_target.getName()+'_parsed_'+now_date, 100, 10);

  const key_sheet = ss_key.getSheetByName('keys');

  const target_sheets = ss_target.getSheets();
  for(let ts=0; ts<target_sheets.length; ts++){
    let target_sheet = target_sheets[ts];
    
    let target_table = getTableValuesBy(target_sheet);
    let key_table = getTableValuesBy(key_sheet);
    let key_table_json = table2JSON(key_table);
    let mapped_table = transpose(key_table_json.map((obj,i,r)=> {
      let target_index = getColIndexBy(target_table,obj.key);
      let col = getColumn(target_index,target_table);
      return obj.action && obj.action == 'nameCase' ? col.map(cell=> nameCase(cell)) : obj.action && obj.action == 'millisecondsToYears' ? col.map(cell=> millisecondsToYears(cell)) : col;
    }));
    let rename_index = getColIndexBy(key_table,'display');
    let renamed_header = key_table.map(row=> row[rename_index]);
    renamed_header.shift();
    mapped_table.shift();
    let new_table = [...[renamed_header],...mapped_table];
    
    ss_parsed.insertSheet(target_sheet.getSheetName()+' parsed_sheet '+now_date).getRange(1,1,new_table.length,new_table[0].length).setValues(new_table);
    
    let parsed_sheet = ss_parsed.getSheetByName(target_sheet.getSheetName()+' parsed_sheet '+now_date);
    
    let styling_indexes = getColumn(getColIndexBy(key_table,'background color'),key_table);
    styling_indexes.shift();

    styling_indexes.forEach((color,i,r)=> {
      let rows = parsed_sheet.getLastRow();
      if(color){
        let colors = Array(rows).fill([color]);
        parsed_sheet.getRange(1,(i+1),parsed_sheet.getLastRow(),1).setBackgrounds(colors);
      }
    })
    parsed_sheet.setFrozenRows(1);
    parsed_sheet.setFrozenColumns(4);
  }
}
