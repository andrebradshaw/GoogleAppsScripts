/*
          view a review of the code and demo @ https://youtu.be/C6OgbYen1_s
*/
function setStandardSheetLayout() {
  const header_background_color = '#009bad';
  const header_text_color = '#ffffff';
  const header_border_color = '#ffffff';
  const header_rows_to_freeze = 1;
  const column_border_color = '#7c7c7c';
  const number_of_columns_to_freeze = 3;
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  for(let i=0; i<sheets.length; i++){
    let sheet = sheets[i];
    sheet.setFrozenColumns(number_of_columns_to_freeze);
    sheet.setFrozenRows(header_rows_to_freeze);

    let range_c = sheet.getRange(1,1,sheet.getLastRow(),number_of_columns_to_freeze);
    range_c.setBorder(true, true, true, true, true, true, column_border_color, SpreadsheetApp.BorderStyle.SOLID);

    let range_h = sheet.getRange(1,1,1,sheet.getLastColumn());
    range_h.setBackground(header_background_color);
    range_h.setFontColor(header_text_color);
    range_h.setBorder(true, true, true, true, true, true,header_border_color, SpreadsheetApp.BorderStyle.SOLID);
    range_h.setFontWeight("bold");
  }
}
