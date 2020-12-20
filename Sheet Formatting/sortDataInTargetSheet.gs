

function sortDataInTargetSheet() {
  const transpose = (a)=>  a[0].map((_, c)=> a.map(r=> r[c])); //https://gist.github.com/femto113/1784503
  const ss = SpreadsheetApp.openById('1mnsiO_gTNXV4wHLtRutNIwIYX3M7SqahSme4OHp6CA0');
  const target_sheet = ss.getSheetByName('1608493702322');
  const key_sheet = ss.getSheetByName('keys');
  const target_table = getTableValuesBy(target_sheet);
  const key_table = getTableValuesBy(key_sheet);
  const key_index = getColIndexBy(key_table,'key');
  const rename_index = getColIndexBy(key_table,'display');

  const keys = key_table.map(row=> row[key_index]);
  const renamed_header = key_table.map(row=> row[rename_index]);
  keys.shift();
  renamed_header.shift();

  const target_indexes = keys.map(col=> getColIndexBy(target_table,col));
  const parsed_table = transpose(target_indexes.map(i=> getColumn(i,target_table) ));
  parsed_table.shift();
  const new_table = [...[renamed_header],...parsed_table];
  ss.insertSheet('parsed_sheet');
  ss.getSheetByName('parsed_sheet').getRange(1,1,new_table.length,new_table[0].length).setValues(new_table);
  console.log(parsed_table);

}


