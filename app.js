//Copyright Emanuel Kuhn

'use strict';

// var localStorage, rivets, querySelector, Handlebars, prompt, alert, Waves;

var Debug = {};
Debug.INITDBFILE = function () {
  localStorage.setItem('dbbase', '');
};


var commit = true;

var db = {};
var DB = {};
DB.Tables = {};

db.createTable = function (name, commit) {
  if (!DB.Tables[name]) {
    DB.Tables[name] = [{}];
    if (commit) {
      db.commit();
    }
    return "Created table " + name;
  }
  throw "Table " + name + " already exists.";
};

db.dropTable = function (name, commit) {
  delete DB.Tables[name];
  if (commit) {
    db.commit();
  }
  return "Removed table " + name;
};

db.addRow = function (tableName, content, commit) {
  if (!tableName){
    return "error: db.addRow: no tableName specified";
  }
  var content = content || {};
  var row = DB.Tables[tableName].push(content);
  if (commit) {
    db.commit();
  }
  return row - 1;
};

db.updateRow = function (tableName, rowID, content, commit) {
  DB.Tables[tableName][rowID] = content;
  if (commit) {
    db.commit();
  }

};

db.updateRowItem = function (tableName, rowID, item, content, commit) {
  DB.Tables[tableName][rowID][item] = content;
  Debug.a = DB.Tables[tableName];
  if (commit) {
    db.commit();
  }

};

db.clearRow = function (tableName, rowID, commit) {
  DB.Tables[tableName][rowID] = {};
  if (commit) {
    db.commit();
  }

};

db.commit = function () {
  console.log('commit called');
  //code to write data to localStorage
  localStorage.setItem('dbbase', JSON.stringify(DB));

  console.log("db commited to localStorage: " + localStorage.getItem('dbbase'));
  return localStorage.getItem('dbbase');
};

db.pull = function () {
  //code to read data from localStorage
  if (localStorage.getItem('dbbase')) {
    var result = localStorage.getItem('dbbase');
    DB = JSON.parse(result);
  }
  console.log("db loaded from localStorage: " + DB);
  return DB;
};

db.pull();

console.log("app.js loaded\n");


//
// UI Bindings:
//

var selectedTable;
var selectedRow = 0;

function updateView(viewId, templateId, context) {
  var source = $(templateId)
    .html();
  var template = Handlebars.compile(source);
  var html = template(context);
  $(viewId)
    .html(html);
}

function updateSelectTableView() {
  var context = DB;
  if (selectedTable) {
    context.Tables[selectedTable].attr = 'selected';
    console.log(context.Tables[selectedTable].attr);
  }
  updateView("#select-table", "#select-table-template", context);
  if (selectedTable) {
    context.Tables[selectedTable].attr = '';
  }
}

function updateCardView(view, table, row) {
  if (!table) {
    $("#card-view").html('<br><br><h1>Please select or create a table.</h1>');

    console.log('error: updateCardView: !table || !row');
    return "error: updateCardView: !table || !row ";
  }
  var context = {};
  context.__selectedTable = table;
  context.__selectedRow = row;

  console.log(view, table, row);

  if (table && row !== undefined) {
    context.__currentRow = DB.Tables[table][row];
  } else if (table) {
    context.__currentTable = DB.Tables[table];
  } else {
    context.__currentdbbase = DB;
  }

  Debug.b = DB.Tables[table];


  console.log("updateCardView with context: ", context);

  try {
    updateView("#card-view", "#card-" + view + "-template", context);
  } catch (e) {
    console.log(e);
  }

  return true;
}

function updateAllViews(commit) {
  updateSelectTableView();
  updateCardView('edit', selectedTable, selectedRow);
  console.log('Views updated.');
  if (commit){
    db.commit();
  }
}

function selectCurrentTable(table) {
  selectedTable = table;
  selectedRow = 0;
  DB.selectedTable = selectedTable;
  db.commit();

  setTimeout(function () {
    updateAllViews();
  }, 10);


}



updateAllViews();

//
//UI-methods:
//

var ui = {};
ui.edit = {};

ui.newTable = function () {
  var tableName = prompt("Table name:", "default");
  try {
    db.createTable(tableName, true);
  } catch (e) {
    alert("Something went wrong: \n" + e);
    console.log(e);
  }
  selectedTable = tableName;
  selectedRow = 0;
  updateAllViews();
};

ui.dropTable = function () {
  var tableName = prompt("Drop table:", "");
  try {
    db.dropTable(tableName, true);
  } catch (e) {
    alert("Something went wrong: \n" + e);
    console.log(e);
  }
  if (selectedTable == tableName) {
    selectedTable = undefined;
  }
  updateAllViews();
};


ui.edit.addField = function () {
  console.log("ui.edit.addField");
  var fieldName = prompt("Field name: ", "");
  db.updateRowItem(selectedTable, selectedRow, fieldName, '', commit);
  updateAllViews();
};

ui.edit.commitValues = function (table, rowID, item) {
  var content = $('#' + table + '-' + rowID + '-' + item)
    .val();
  console.log('commitValues(): ', table, rowID, item, content);
  db.updateRowItem(table, rowID, item, content, commit);
};

ui.selectRow = function (row){
  if (!DB.Tables[selectedTable]) {
    throw "ui.selectRow: selectedTable == undefined";
  }
  if (!DB.Tables[selectedTable][row]) {
    throw "Row " + row + " doesn't exist";
  }
  selectedRow = row;
  updateAllViews (commit);
  return selectedRow;
}

ui.selectPrevRow = function () {
  var prevRow = selectedRow - 1;
  if (prevRow < 0) {
    throw 'error: selectPrevRow: prevRow < 0';
  }
  this.selectRow (prevRow);
  console.log("selectedRow: " + selectedRow);
  return selectedRow;
};

ui.selectNextRow = function () {
  var nextRow = selectedRow + 1;
  
  this.selectRow (nextRow);

  console.log("selectedRow: " + selectedRow);
  return selectedRow;
};

ui.addRow = function () {
  var row = {};
  var selectedRowContent = DB.Tables[selectedTable][selectedRow];
  for(var key in selectedRowContent) {
    row[key] = '';
  }
  var lastRow = db.addRow(selectedTable, row);
  this.selectRow(lastRow);
}

ui.copyRowStructure = function (){
  var rowToCopyFromID = prompt("Row to copy structure from: ", '');
  var rowToCopyToID = prompt("Row to copy structure to: ", '');
  var rowToCopyFrom = DB.Tables[selectedTable][rowToCopyFromID];
  var rowStructure;
  for(var key in rowToCopyFrom) {
    rowStructure[key] = '';
  }
  DB.Tables[selectedTable][rowToCopyToID] = rowStructure;
}

ui.clearRow = function () {
  db.clearRow(selectedTable, selectedRow, commit);
  updateAllViews ();  
}

Waves.displayEffect();







