/*
    This script assumes your table is output from Quickli. 
    It takes flat job data, parses it back into a nested JSON format, then calculates the average tenure for your target company name.
*/
const your_spreadsheet_id = '1U5ahDlrQ4AJjiCsAfICOW1FMRrICzuZuNc6bXdTT01A';
const your_sheet_name = '1609963645326';
const your_target_company_name = 'Afterpay'; //NOTE: this assumes the spelling is always the same. A regular expression might be needed for company names witha a variance.

function myFunction() {
  const reg = (o, n) => o ? o[n] : '';
  const ss = SpreadsheetApp.openById(your_spreadsheet_id);
  const sheet = ss.getSheetByName(your_sheet_name);
  const table = getTableValuesBy(sheet);

/*This translates the jobs back into a nested array so we can filter down on jobs by candidate record */
  const mapped_table = table2JSON(table).map(record=> {
    let jobs = [];
    Object.entries(record).filter(kv=> /job_/.test(kv[0])).forEach(keyvalpair=> {
      let key = keyvalpair[0];
      let val = keyvalpair[1];

      let is_job_record = /^job_\d+_/.test(key);
      let placement_index = reg(/^job_(\d+)_/.exec(key),1) ? (parseInt(reg(/^job_(\d+)_/.exec(key),1)) -1) : 0;
      
      if(is_job_record && reg(/^job_(\d+)_/.exec(key),1)){
        if(jobs[placement_index]){
          jobs[placement_index][key.replace(/^job_\d+_/,'')] = val;
        }else{
          jobs[placement_index] = {};
          jobs[placement_index][key.replace(/^job_\d+_/,'')] = val;
        }
      }
    });
    return {...record,...{jobs: jobs}};
  }).filter(r=> r.job_1_job_company_name);
  
  console.log(getAverageTimeInJobAtTargetCompany(mapped_table,your_target_company_name));
}

function getAverageTimeInJobAtTargetCompany(records,company_name){
  let worked_at_target_company = records.filter(record=> record.jobs.filter(job=> job.job_company_name == company_name).length);
  let times_at_target_company = records.map(record=> {
    let matching_jobs = record.jobs.filter(job=> job.job_company_name == company_name).map(job=> parseFloat(job.years_in_job));
    return matching_jobs.length ? matching_jobs.reduce((a,b)=> a+b) : 0;
  })
  return times_at_target_company.reduce((a,b)=> a+b) / worked_at_target_company.length
}
  
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

const getColumn = (i,table) => table.map(col=> col[i]); 
/* utility sheets
returns column as an array. arguments are the column index and the table.
*/

const getTableValuesBy = (sheet) => sheet.getRange(1,1,1,1).isBlank() ? [] : Array.from(sheet.getRange(1,1,sheet.getLastRow(),sheet.getLastColumn()).getValues()); 
/* utility sheets
getTableValuesBy => gets full sheet as Table, by the sheetObject. This only retrieves the max rows and columns containing data. Returns an empty array if the first cell is blank
*/

const getColIndexBy = (table,header_name) => table[0].indexOf(header_name); 
/* utility sheets
getColIndexBy => gets the index number (not sheet col number) of the specified header within a given sheet
*/

const getRowIndexBy = (table,header_name,query) => table.findIndex(r=> r[getColIndexBy(table,header_name)] == query);
/* utility sheets
getRowIndexBy => gets the index number of the first string matching row value within a specified headername within a given sheet.
*/

const getRowIndexRegX = (table,header_name,x) => table.findIndex(r=> x.test(r[getColIndexBy(table,header_name)]));
/* utility sheets
getRowIndexByX => gets the index number of the first matching regular expression on a row value within a specified headername within a given sheet.
*/
