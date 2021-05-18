function doGet(e) { //this function serves up the view HTML file 
  return HtmlService.createTemplateFromFile('view')
                    .evaluate()
                    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); 
}

function processResumeFile(filename,dataURI){ //this function is called within the view.html file using the google.script.run.withSuccessHandler method
  var blob = dataURItoBlob(dataURI, filename);
  return fileImageBlob(blob);
}

function dataURItoBlob(dataURI, filename) { // code swiped from https://stackoverflow.com/a/36949118/1027723
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0){
    byteString = Utilities.base64Decode(dataURI.split(',')[1]);
  } else {
    byteString = decodeURI(dataURI.split(',')[1]);
  }
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  return Utilities.newBlob(byteString, mimeString, filename);
}

function fileImageBlob(blob){ //TODO: we are overwriteing the file variable. Fix this later and test to ensure it doesnt break anything. 
  var filename = blob.getName();
  var type = /docx$/i.test(filename) ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : /pdf$/i.test(filename) ? 'application/pdf' : /png$/i.test(filename) ? 'image/png' : /jpeg$|jpg$/i.test(filename) ? 'image/jpeg' : /bmp$/i.test(filename) ? 'image/bmp' : 'text/plain';
  if(type){
    var file = {
      title: 'OCR File',
      mimeType: type
    };
    file = Drive.Files.insert(file, blob, {ocr: true});
    var doc = DocumentApp.openByUrl(file.embedLink);
    var body = doc.getBody().getText().replace(/\n/g,'<br>');
    deleteFileById(file.getId()); 
    return body;
  }else{
    return 'file type not supported';
  }
}

function deleteFileById(id){
  var file = DriveApp.getFileById(id);
  file.setTrashed(true);
}
