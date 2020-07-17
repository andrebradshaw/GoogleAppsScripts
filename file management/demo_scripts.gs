function getFolderIDByName(target_name) {
  var folders = DriveApp.getFolders();
  while (folders.hasNext()) {
    var folder = folders.next();
    var folder_name = folder.getName();
    if(folder_name == target_name){
      return folder.getId();
    }
  }
}

function getFileIdByName(target_name){
  var files = DriveApp.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    var filename = file.getName();
    if(filename == target_name){
      return file.getId();
    }
  }
}

function deleteFileById(id){
  var file = DriveApp.getFileById(id);
  file.setTrashed(true);
}

function createFolder(name){
  var folder = DriveApp.createFolder(name);
  var id = folder.getId();
  Logger.log(id);
  return folder;
}

function fileNameExistsInFolder(filename,target_folder_name){
  var folder_id = getFolderIDByName(target_folder_name);
  var files_in_folder = DriveApp.getFolderById(folder_id).getFilesByName(filename);
  return files_in_folder.hasNext();
}

function createFile(target_folder_name,obj){
  var filename = 'test_file';
  var target_folder_id = getFolderIDByName(target_folder_name);
  var target_folder = DriveApp.getFolderById(target_folder_id);
  var file = DriveApp.getFolderById(target_folder_id).createFile(obj.filename, obj.content, obj.type);
  Logger.log(file.getId());
}

function getJSONfilesFromFolderAsArray(target_folder_name){
  var contain_arr = [];
  var folder_id = getFolderIDByName(target_folder_name);
  var files_in_folder = DriveApp.getFolderById(folder_id).getFilesByType('application/json');
  while (files_in_folder.hasNext()) {
    var file = files_in_folder.next();
    var blob = file.getAs('application/json');
    var content = blob.getDataAsString();
    var data = JSON.parse(content);
    contain_arr.push(data);
  }
  Logger.log(contain_arr);
  return contain_arr;
}

function test(){
  getJSONfilesFromFolderAsArray('test folder');
  var obj = {
    filename: fileNameExistsInFolder('test file','test folder') ? filename + ' ' + new Date().getTime() : 'test file',
    content: JSON.stringify({first_name: 'Andre', last_name: 'Bradshaw'}),
    type: 'application/json'
  }
  var file = createFile('test folder',obj);

}
