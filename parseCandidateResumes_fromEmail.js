/*
GOOGLE APPS SCRIPT
This script will monitor inbound emails for a given subject name, then will parse those resumes as a Google Doc, and add a record to a spreadsheet

Full build video:
https://youtu.be/r05EwELmymE

Set Time-Based Triggers:
https://youtu.be/RvUyyDpXxuE
*/

var sheetId = 'YOUR_SPREADSHEET_ID_GOES_HERE';
var ss = SpreadsheetApp.openById(sheetId); //https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app#openById(String)
var mainSheet = ss.getSheetByName('Main'); //https://developers.google.com/apps-script/reference/spreadsheet/sheet#getsheetbyname

function reg(o,n){if(o){return o[n].trim()}else{return '';}}
function unq(arr){ return arr.filter(function(e, p, a) { return a.indexOf(e) == p }) }
function fixCase(s){  return s.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()} );}

function parseAsRegexArr(bool) {
  function rxReady(s){ return s ? s.replace(/"/g, '\\b').trim().replace(/\)/g, '').replace(/\(/g, '').replace(/\s+/g, '.{0,2}').replace(/\//g, '\\/').replace(/\+/g, '\\+').replace(/\s*\*\s*/g, '\\s*\\w*\\s+') : s;}
  function checkSimpleOR(s) { return /\bor\b/i.test(s) && /\(/.test(s) === false;}
  if (checkSimpleOR(bool)) {
    var x = new RegExp(bool.replace(/\s+OR\s+|\s*\|\s*/gi, '|').replace(/\//g, '\\/').replace(/"/g, '\\b').replace(/\s+/g, '.{0,2}').replace(/\s*\*\s*/g, '\\s*\\w*\\s+'), 'i');
    var xArr = [x];
    return xArr;
  } else {
    var orx = "\\(.+?\\)|(\\(\\w+\\s{0,1}OR\\s|\\w+\\s{0,1}OR\\s)+((\\w+\s)+?|(\\w+)\\)+)+?";
    var orMatch = bool ? bool.match(new RegExp(orx, 'g')) : [];
    var orArr = orMatch ? orMatch.map(function(b) {return rxReady(b.replace(/\s+OR\s+|\s*\|\s*/gi, '|'))}) : [];
    var noOrs = bool ? bool.replace(new RegExp(orx, 'g'), '').split(/\s+[AND\s+]+/i) : bool;
    var ands = noOrs ? noOrs.map(function(a) { return rxReady(a)}) : [];
    var xArr = ands.concat(orArr).filter(function(i){ return i != ''}).map(function(x){return new RegExp(x, 'i')});
    return xArr;
  }
}
function booleanSearch(bool,target){
  var arr = parseAsRegexArr(bool);
  return arr.every(function(x){
    return x.test(target);
  });
}

function getFolderByName(x){ //https://developers.google.com/apps-script/reference/drive/folder-iterator
  var folders = DriveApp.getFolders();
  while(folders.hasNext()){
    var folder = folders.next();
    if(x.test(folder.getName())) return folder.getId();
  }
}

function getEmailThreadsBySubject(searchString){ 
  var matches = [];
  var threads = GmailApp.getInboxThreads(0, 50); //https://developers.google.com/apps-script/reference/gmail/gmail-app#getInboxThreads(Integer,Integer)
  for(var i=0; i<threads.length; i++){
    var msgs = threads[i].getMessages();
    var subject = msgs[0].getSubject();
    var attachments = msgs[0].getAttachments(); //https://developers.google.com/apps-script/reference/gmail/gmail-message#getAttachments(Object)
    if(msgs[0].isUnread() && booleanSearch(searchString,subject) && attachments && attachments.length > 0) { //https://developers.google.com/apps-script/reference/gmail/gmail-thread#isUnread()
     matches.push(msgs[0]);
    } // if msgs unread && match params
  } //end forloop
  return matches;
}

function parseCandidateSubmissions(){
  var targetEmails = getEmailThreadsBySubject('Candidate Submission OR candidate submittal');
  for(var i=0; i<targetEmails.length; i++){
    var attachments = targetEmails[i].getAttachments();
    var attachmentNames = attachments.map(function(el){return el.getName()})
    var sender = targetEmails[i].getFrom(); //https://developers.google.com/apps-script/reference/gmail/gmail-message#getFrom()
    var timestamp = new Date(targetEmails[i].getDate());
    var msgId = targetEmails[i].getId();

    var candNames = [];
    var candEmails = [];
    var candPhones = [];
    var candLinkedIns = [];
    var fileLinks = [];

    for(var a=0; a<attachments.length; a++){
        var default_name = attachments[a].getName();
        if(/\bpdf\b/i.test(default_name)){ var fileBlob = attachments[a].getAs('application/pdf')} //https://developers.google.com/apps-script/reference/base/blob#getAs(String)
        if(/\bdocx\b/i.test(default_name)){ var fileBlob = attachments[a].getAs('application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
        if(/\bdoc\b/i.test(default_name)){ var fileBlob = attachments[a].getAs('application/msword')}
        if(/\brtf\b/i.test(default_name)){ var fileBlob = attachments[a].getAs('application/rtf')}
        if(/\brtf\b/i.test(default_name)){ var fileBlob = attachments[a].getAs('text/plain')}
        
        var targetFolderId = getFolderByName(/^Candidate Submissions$/);
        var fileObj = {
          'title': 'Temp_'+a,
          'parents': [{'id': targetFolderId}],
          'mimeType': 'application/vnd.google-apps.document'
          };
        var newFile = Drive.Files.insert(fileObj,fileBlob);
        var newDocId = newFile.getId();
        var newDocFile = DocumentApp.openById(newDocId);
        var newDocFileBodyText = newDocFile.getBody().getText();
        var newDocFileHeaderText = newDocFile.getHeader() ? newDocFile.getHeader().getText() : '';

        var name = newDocFileHeaderText ? fixCase(reg(/^[a-z]+\s+[a-z]+/i.exec(newDocFileHeaderText),0)) : fixCase(reg(/^[a-z]+\s+[a-z]+/i.exec(newDocFileBodyText),0));
        var email = newDocFileHeaderText ? reg(/[\w|\.]+@\w+\.[a-zA-Z]+/.exec(newDocFileHeaderText),0) : reg(/[\w|\.]+@\w+\.[a-zA-Z]+/.exec(newDocFileBodyText),0);
        var phone = newDocFileHeaderText ? reg(/\b[2-9]\d{2}\){0,1}\W{0,1}\d{3}\W{0,1}\d{4}\b/.exec(newDocFileHeaderText),0) : reg(/\b[2-9]\d{2}\){0,1}\W{0,1}\d{3}\W{0,1}\d{4}\b/.exec(newDocFileBodyText),0);
        var linkedin = newDocFileHeaderText ? reg(/linkedin\.com\/in\/\S+/.exec(newDocFileHeaderText),0) : reg(/linkedin\.com\/in\/\S+/.exec(newDocFileBodyText),0);

        candNames.push(name);
        candEmails.push(email);
        candPhones.push(phone);
        candLinkedIns.push(linkedin);
        fileLinks.push('https://docs.google.com/document/d/'+newDocId);
        var newFileName = name ? name+' - '+newDocId : default_name.replace(/\..+/,'') +' - '+ newDocId;
        DocumentApp.openById(newDocId).setName(newFileName);

    } //end for(attachments)
    var nameCheck = candNames.filter(function(el){return el != ''});
    var nameDrop =  nameCheck.length == 1 ? candNames[0] : JSON.stringify(candNames);
    var emailDrop = JSON.stringify( unq( candEmails.filter(function(el){return el != ''}) ) );
    var phoneDrop = JSON.stringify( unq( candPhones.filter(function(el){return el != ''}) ) );
    var linkedInDrop = JSON.stringify( unq( candLinkedIns.filter(function(el){return el != ''}) ) );
    var fileDrop = JSON.stringify( unq( fileLinks.filter(function(el){return el != ''}) ) );
    var rowDrop = [[msgId,timestamp,sender,nameDrop,emailDrop,phoneDrop,linkedInDrop,fileDrop]];
    mainSheet.insertRowBefore(2); //https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet#insertrowbeforebeforeposition
    mainSheet.getRange(2,1,rowDrop.length,rowDrop[0].length).setValues(rowDrop);
    targetEmails[i].markRead(); //https://developers.google.com/apps-script/reference/gmail/gmail-message#markRead()
  } //end for(targetEmails)

}//end parseCandidateSubmissions







