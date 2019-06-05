var apikey = 'y0ur_4pi_k3y_g0es_h3r3';

var ss = SpreadsheetApp.openById('y0ur_spr33d5heet_id_g0es_h3r3');
var s1 = ss.getSheetByName('your_sheet_name');

var numberToQuery = 20; //change this to a higher number if you wish to pull more than 20 at a time. I do not recommend going about 100 per cycle

var li_pathx = /linkedin.com\/in\/([\w+|-]+)(\/|\b$)/i;
var li39x = /linkedin.com\/in\/[\w+|-]{39}/i;

function reg(o,n){  if(o) { return o[n]; } }

function arr(table){  var t  = [];  for(var i=0; i<table.length; i++){t.push(table[i])}  return t; }

function indexFromArr(x){  for(var i=0; i<x.length; i++){   if(x[i] == 'Likelihood_score') { return i; }   }}
    
function getIndexOfPubUrl(arr){  for(var i =0; i<arr.length; i++){    if(li_pathx.test(arr[i]) || li39x.test(arr[i]) === false) { return i}  }} // TODO: why do we have || lir39x === false ? This makes no sense 

function lastRowNum_bySpecifiedCol(colNum){
  var rowArr = [];
  var data = s1.getRange(1, colNum, s1.getLastRow(), 1).getValues();
  for(i =(data.length-1); i >=0;  i--){    if (data[i][0] != null && data[i][0] != ''){      rowArr.push(i+1);    }  }
  if(rowArr.length <1) {    return 0;  }else{    return Math.max.apply(null, rowArr);  }
}

function peopleDataMapper() {
  var lr = s1.getLastRow();
  var lc = s1.getLastColumn();
  var lrByCol = lastRowNum_bySpecifiedCol(lc);
  var table = s1.getRange(1,1,lr,s1.getLastColumn()).getValues();

  if(arr(table[0]).some(function(el){ return el == 'Likelihood_score'}) === false){

    var header = [['Likelihood_score','birthdate','personal_phones','personal_emails','work_phones','work_emails','other_phones','other_emails']];
    s1.getRange(1,(lc+1),1,header[0].length).setValues(header);

  } else {

    var t = getIndexOfPubUrl(table[1]);
    var stop = table.length - lrByCol < numberToQuery ? table.length : lrByCol + numberToQuery;

    for(var i=lrByCol; i<stop; i++) {

      var apiLC = indexFromArr(table[0],'Likelihood_score');
      var path = reg(li_pathx.exec(table[i][t]),1); 
      var url = path ? 'https://api.peopledatalabs.com/v4/person?api_key='+apikey+'&profile=linkedin.com/in/' + path : null;
      var res = url ? UrlFetchApp.fetch(url,{muteHttpExceptions: true}) : null;
      var dat = res ? JSON.parse(res) : null;

      if(dat.data) {

        var personal_email = [];
        var work_email = [];
        var n_email = [];

        var personal_phone = [];
        var work_phone = [];
        var n_phone = [];

        var emails = dat.data.emails;
        var phones = dat.data.phone_numbers;

        if(emails.length > 0){
          emails.forEach(function(el){ 
            if(el.type != 'personal' || el.type != 'professional'){n_email.push(el.address);}
            if(el.type == 'professional'){            work_email.push(el.address);          }
            if(el.type == 'personal'){            personal_email.push(el.address);          }
          });
        }
        if(phones.length > 0){
          phones.forEach(function(el){ 
            if(/personal/i.test(el.type) === false || /professional/i.test(el.type) === false){n_phone.push(el.national_number);}
            if(/professional/i.test(el.type)){            work_phone.push(el.national_number);          }
            if(/personal/i.test(el.type)){            personal_phone.push(el.national_number);          }
          });
        }

        var emailstr_person = personal_email.length > 0 ? '[' + personal_email.toString() + ']' : '[]';
        var phonestr_person = personal_phone.length > 0 ? '[' + personal_phone.toString() + ']' : '[]';

        var emailstr_work = work_email.length > 0 ? '[' + work_email.toString() + ']' : '[]';
        var phonestr_work = work_phone.length > 0 ? '[' + work_phone.toString() + ']' : '[]';

        var emailstr_n = n_email.length > 0 ? '[' + n_email.toString() + ']' : '[]';
        var phonestr_n = n_phone.length > 0 ? '[' + n_phone.toString() + ']' : '[]';


        var birthdate = dat.data.birth_date ? dat.data.birth_date : '';
        var likelihood = dat.likelihood ? dat.likelihood : '';
        var output = [[likelihood,birthdate,phonestr_person,emailstr_person,phonestr_work,emailstr_work,phonestr_n,emailstr_n]];

        s1.getRange((i+1),(apiLC+1),output.length, output[0].length).setValues(output);
        Logger.log(dat);
        Logger.log(output);
      }
    }
  }
}
