/*
    This script assumes your table is output from Quickli. 
    It takes flat job data, parses it back into a nested JSON format, then calculates the average tenure for your target company name.
*/
const your_spreadsheet_id = '1U5ahDlrQ4AJjiCsAfICOW1FMRrICzuZuNc6bXdTT01A';
const your_sheet_name = '1609963645326';
const your_title_search = `Software~Engineer OR software dev`; //takes a boolean search
const your_company_name_search = `freelance`; //takes a boolean search

function runSearch(){
  const avg_time_w_company = getAverageTimeInCompanyNameSearch(your_company_name_search);
  const avg_time_w_title = getAverageTimeInCompanyNameSearch(your_title_search);
  console.log('avg time with title:\n'+avg_time_w_title+'\n\navg time at company:\n'+avg_time_w_company);
}

function getAverageTimeWithTitleSearch(booleanString){
  const ss = SpreadsheetApp.openById(your_spreadsheet_id);
  const sheet = ss.getSheetByName(your_sheet_name);
  const table = getTableValuesBy(sheet);
  const renested = renestJobs(table);
  const xarr = buildSearchSet(booleanString);
  const work = renested.filter( record=> record.jobs.filter( job=> xarr.every( x=> x.test(job.job_title) ) ).length );
  const times = renested.map(record=> {
    let matching = record.jobs.filter( job=> xarr.every( x=> x.test(job.job_title) ) ).map( job=> job.years_in_job ? parseFloat(job.years_in_job) : 0.02);
    return matching.length ? matching.reduce((a,b)=> a+b) : 0;
  });
  return times.reduce((a,b)=> a+b) / work.length;
}

function getAverageTimeInCompanyNameSearch(booleanString){
  const ss = SpreadsheetApp.openById(your_spreadsheet_id);
  const sheet = ss.getSheetByName(your_sheet_name);
  const table = getTableValuesBy(sheet);
  const renested = renestJobs(table);
  const xarr = buildSearchSet(booleanString);
  const worked_at_target_company = renested.filter( record=> record.jobs.filter( job=> xarr.every( x=> x.test(job.job_company_name) ) ).length );
  const times_at_target_company = renested.map(record=> {
    let matching_jobs = record.jobs.filter( job=> xarr.every( x=> x.test(job.job_company_name) ) ).map( job=> job.years_in_job ? parseFloat(job.years_in_job) : 0.02);
    return matching_jobs.length ? matching_jobs.reduce((a,b)=> a+b) : 0;
  });
  return times_at_target_company.reduce((a,b)=> a+b) / worked_at_target_company.length;
}

/*This translates the jobs back into a nested array so we can filter down on jobs by candidate record */
function renestJobs(table){
  const reg = (o, n) => o ? o[n] : '';
  return table2JSON(table).map(record=> {
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
}

const parseStringAsXset = (s) => s
.split(/\s+\band\b\s+|(?<!\s+and\b)\s+\(|\)\s+(?!\band\b)/i)
    .map(el=> 
        el.split(/\s+\bor\b\s+/i).map(ii=> 
            ii.replace(/\s*\)\s*/g,'')
            .replace(/\s*\(\s*/g,'')
            .replace(/\s+/g,'.{0,3}')
            .replace(/"/g,'\\b')
            .replace(/\*/g,'\\w*')
            .replace(/\*\*\*/g,'.{0,60}'))
                .reduce((a,b)=> a+'|'+b)).filter(el=> el);

function permutateNear(input,joiner){
  var nearx = /(?<=\||^)\S+?(?=\||$)/g;
  var base = input.replace(nearx, '').replace(/[\|]+/g, '|');
  var near_or = input.match(nearx) ? input.match(nearx).map(str=> {
    var arr = str.split(/~/);
    if(arr.length > 5){
      return str.replace(/[~]+/,'.');
    }else{
      var cont = [];
      var containArr = [];
      function comboLoop(arr, cont){
        if (arr.length == 0) {
          var row = cont.join(joiner);
          containArr.push(row)
        }
        for (var i = 0; i < arr.length; i++) {
          var x = arr.splice(i, 1);
          cont.push(x);
          comboLoop(arr, cont);
          cont.pop();
          arr.splice(i, 0, x);
        }
      }
      comboLoop(arr, cont);
      return containArr.reduce((a,b)=> a+'|'+b);
    }
  }).flat().reduce((a,b)=> a+'|'+b) : '';
  return base + near_or;
}
function buildSearchSet(str){
  if(str){
      var set = parseStringAsXset(str);
      var xset = set.map(r=> permutateNear(r,'.{0,39}')).map(r=> tryRegExp(r.replace(/^\||\|$/g,''),'i'));
      return xset;
  }else{return null}
}
function tryRegExp(s,f){
    try{return new RegExp(s,f)}
    catch(err){return err}
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
