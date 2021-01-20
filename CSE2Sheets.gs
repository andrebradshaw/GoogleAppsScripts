const target_column_name = 'CSE URL';

const getTableValuesBy = (sheet) => sheet.getRange(1,1,1,1).isBlank() ? [] : Array.from(sheet.getRange(1,1,sheet.getLastRow(),sheet.getLastColumn()).getValues()); 
/* gets full sheet as Table, by the sheetObject. This only retrieves the max rows and columns containing data. Returns an empty array if the first cell is blank */
const getColIndexBy = (table,header_name) => table[0].indexOf(header_name); 
/* gets the index number (not sheet col number) of the specified header within a given sheet */

function getDataFromCSEURLs() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  var table = getTableValuesBy(sheet);

  var target_col_index = getColIndexBy(table,target_column_name);

  var updated_table = [
    [
      ...table[0],
      ...[
        'Result Link',
        'Result Snippet',
        'Result Title'
      ]
    ]
  ];

  for(let i=1; i<table.length; i++){
    let url = table[i][target_col_index].replace(/\s+/g,'%20').replace(/"/g,'%22');
    let res = UrlFetchApp.fetch(url);
    let data = JSON.parse(res);
    let updated_row = [
      ...table[i],
      ...[
        data.items[0].link,
        data.items[0].snippet,
        data.items[0].title
      ]
    ];
    updated_table.push(updated_row);
  }
  var sn = 'CSE Results_'+Math.round(new Date().getTime()/1000);
  SpreadsheetApp.getActiveSpreadsheet().insertSheet(sn);
  var cse_res_sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sn);
  cse_res_sheet.getRange(1,1,updated_table.length,updated_table[0].length).setValues(updated_table);

}

