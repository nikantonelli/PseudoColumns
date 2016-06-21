Ext.define("GridExporter", {
    //dateFormat : 'Y-m-d g:i',
    dateFormat : 'Y-m-d',

    inheritableStatics: {
        XmlFileHeader: '<?xml version="1.0"?>',
        XmlFileExtension: '.xml.txt'
    },

    _downloadFiles: function( files ) {
        if ( files.length )
        {
            var data = files.pop();
            var format = files.pop();
            var file = files.pop();

            var href = "<a href='" + format + "," + encodeURIComponent(data) + "' download='" + file + "'></a>";

            var ml = Ext.DomHelper.insertAfter(window.document.getElementById('exportButton'), href);
            ml.click();
//            ml.remove(); //Leaves them behind without this, but there is a timing issue: from click to remove.
            this._downloadFiles(files);
        }
    },

    exportCSV: function(grid) {
        var data = this._getCSV(grid, false);
        // fix: ' character was causing termination of csv file
        data = data.replace(/\'/g, "");
        this._downloadFiles(
            [
                'export.csv', 'data:text/csv;charset=utf8', data
            ]
        );

    },

    _escapeForCSV: function(string) {
        string = "" + string;
        if (string.match(/,/)) {
            if (!string.match(/"/)) {
                string = '"' + string + '"';
            } else {
                string = string.replace(/,/g, ''); // comma's and quotes-- sorry, just lose the commas
            }
        }
        return string;
    },

    _getFieldText: function(fieldData,record,col,index) {
        var text;

        if (fieldData === null || fieldData === undefined) {
            text = '';

        } else if (fieldData._refObjectName && !fieldData.getMonth) {
            text = fieldData._refObjectName;

        } else if (fieldData instanceof Date) {
            text = Ext.Date.format(fieldData, this.dateFormat);

        } else if (typeof fieldData === 'string' ){ //Remove any html formatting coding.

            text = fieldData.replace(/<[^>]*>/g," "); //Remove all the tags  for now
            text = text.replace(/\’/g,"'");              //Remove the MAC back-quote
            text = text.replace(/&nbsp\;/g," ");        //Remove the &nbsp chars

        } /*else if (!fieldData.match) { // not a string or object we recognise...blank it out
            text = '';
        } */ else {
            text = fieldData;
        }

        return text;
    },

    _getFieldTextAndEscape: function(fieldData,record,col,index) {
        var string  = this._getFieldText(fieldData,record,col,index);

        return this._escapeForCSV(string);
    },

    // have to add the colIdx to the count of locked columns
    fixedColumnCount : function(columns) {
        var cols = _.filter(columns,function(c) { 
            return c!==undefined && c!==null && c.locked === true;
        });
        return cols.length;
    },

    _stripDivs: function(text) {

        var retval = text.replace('<div>','');
        retval = retval.replace('</div>','');
        retval = retval.replace('<br />','');
        return retval;
    },

    _getCSV: function (grid) {
        var cols    = grid.columns;
        var store   = grid.store;
        var hdrData    = '';
        var rowData = '';
        var valid = true;

        var that = this;
        Ext.Array.each(cols, function(col, index) {
            if (col.hidden !== true) {

                // fix the issue with the "SYLK" warning in excel by prepending "Item" to the ID column
//                var colLabel = (index === 0 ? "Item " : "") + col.dataIndex;

                var colLabel = col && col.dataIndex;
                if ( colLabel && colLabel.replace(/<br\/?>/,'') ){
                    if ( col.editor && col.editor.xtype === 'apprichtexteditor') {
                        hdrData += that._getFieldTextAndEscape(col.text) + ',';
                    }
                    else {
                        hdrData += that._getFieldTextAndEscape(colLabel) + ',';
                    }
                }
            }
        });
        hdrData += "\n";

        _.each( store.data.items, function(record,i) {
            Ext.Array.each(cols, function(col, index) {
            
                if (col.hidden !== true) {
                    var fieldName   = col && col.dataIndex;
                    if (fieldName ) {
                        var text = record.get(fieldName);

                        if ( col.editor && col.editor.xtype === 'apprichtexteditor') {
                            var rg = this.up('rallygrid');
                            var rt = rg._findSubText(text, index + 1);  //Adjust for function
                            rt = that._stripDivs(rt);
                            rowData += that._getFieldTextAndEscape(rt) + ',';
                        }
                        else {
                            rowData += that._getFieldTextAndEscape(text,record,col,index) + ',';
                        }
                    }
                }
            });
            rowData += "\n";
        });

        if (rowData.length > 0)
            return hdrData + rowData;
        else
            return null;
    }
});