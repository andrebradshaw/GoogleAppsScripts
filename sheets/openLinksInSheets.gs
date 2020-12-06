var your_sheet_id = 'YOUR_SHEET_ID_NG51Lm7YUMCG3coJFYx9fgU';
var your_sheet_name = 'YOUR_SHEET_NAME';
var ss = SpreadsheetApp.openById(your_sheet_id);
var report = ss.getSheetByName(your_sheet_name);

function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Quickli Tools')
      .addItem('Links Viewer', 'pagePanel')
      .addToUi();
}

function pagePanel() {
  const link_table = getLinksInCols(0);
  const jdat= JSON.stringify(link_table).replace(/"/g,"&quot;");
  var header = `
    <script>
      function initPaging(){
        document.getElementById('next_url_view').onclick = nextPage;
      }
      function nextPage(){ 
        const header = document.getElementById('page_header_view');
        const jdat = JSON.parse(header.getAttribute('jdat').replace(/&quot;/g,'"'));
        console.log(jdat);
        google.script.run.withSuccessHandler((data)=>{
          console.log(data);
        }).pagerPanel(jdat,1)
      }
    </script>
    <div id="page_header_view" jdat="${jdat}" style="position: fixed; top: 0px; right: 0px; z-index: 999999;">
      <div id="next_url_view" style="cursor: pointer; background: #004471; color: #ffffff; border-radius: 0.3em; text-align: center; padding: 6px;" onClick="nextPage()">next</div>
    </div>
  `;
  var page = UrlFetchApp.fetch(link_table.link_table[0].cell).toString();
  var html = HtmlService.createHtmlOutput(page.replace(/\n|\r/g,'').replace(/<script.+?<\/script>/gi,'').replace(/<body.{0,500}?>/i,'<body>'+header))
      .setWidth(720)
      .setHeight(500)
  SpreadsheetApp.getUi() // Or DocumentApp or SlidesApp or FormApp.
      .showModalDialog(html,link_table.link_table[0].cell.slice(0,52));
}
function pagerPanel(data,page){
  const link_table = getLinksInCols(data.current_index+page);
  const jdat= JSON.stringify(link_table).replace(/"/g,"&quot;");
  var header = `
    <script>
      function initPaging(){
        document.getElementById('next_url_view').onclick = nextPage;
      }
      function nextPage(){
        const header = document.getElementById('page_header_view');
        const jdat = JSON.parse(header.getAttribute('jdat').replace(/&quot;/g,'"'));
        console.log(jdat);
        google.script.run.withSuccessHandler((data)=>{
          console.log(data);
        }).pagerPanel(jdat,1)
      }
    
    console.log('test')
    
    </script>
    <div id="page_header_view" jdat="${jdat}" style="display: grid; position: fixed; top: 0px; right: 0px; z-index: 999999; grid-template-columns: 50px; grid-gap: 8px;">
      <div id="next_url_view" style="cursor: pointer; background: ${link_table.link_table[data.current_index+1].cell ? 'transparent' : '#004471'}; color: #ffffff; border-radius: 0.3em; text-align: center; padding: 6px;"  onClick="nextPage()">${link_table.link_table[data.current_index+1].cell ? '' : 'next'}</div>
    </div>
  `;
  var page = UrlFetchApp.fetch(link_table.link_table[data.current_index+1].cell).toString();
  var html = HtmlService.createHtmlOutput(page.replace(/\n|\r/g,'').replace(/<script.+?<\/script>/gi,'').replace(/<body.{0,500}?>/i,'<body>'+header))
      .setWidth(720)
      .setHeight(500)
  SpreadsheetApp.getUi()
      .showModalDialog(html,link_table.link_table[data.current_index+1].cell.slice(0,52));
}


function getLinksInCols(cindex) {
  var header = Array.from(report.getRange(1, 1, 1, report.getLastColumn()).getValues())[0];
  var rows = report.getLastRow();
  var cols_with_links = header.map((i,n,r) => { //i == the current value on the iteration. n == the index, r == the full array/header 
    return Array.from(report.getRange(1,(n+1),rows,1).getRichTextValues()).map((row,ix,rr)=> {return {col_head:i,row_index:ix,col_index:n,cell:row[0].getLinkUrl()}});
  }).flat().filter(r=> r.cell)
  return {current_index: cindex, link_table: cols_with_links};
}
