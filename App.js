Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    id: 'columnsApp',

    items: [

    ],

    config: {
        defaultSettings: {
            colStrings: Ext.JSON.encode([{
                text: 'Title One'
            }, {
                text: 'Title Two'
            }, {
                text: 'Title Three'
            }])
        }
    },

    getSettingsFields: function() {
        return Settings.getFields(this.getContext());
    },

    launch: function() {

        var app = this;
        this.add( {
            xtype: 'rallyportfolioitemtypecombobox',
            stateful: true,
            stateId: this.getStateId(),
            id: 'piType',
            listeners: {
                ready: function() { app._onLoad(app, this.rawValue); },
                change: function() { app._onLoad(app, this.rawValue); },
                scope: app
            }
        });
    },

    _addGrid: function() {
        var grid = this.down('rallygrid');
        if ( grid ) {
            grid.destroy();
        }

        this.grid = Ext.create( 'Rally.ui.grid.Grid',
            this._getGridConfig(
                this.getSetting('allowedTextFields')
            )
        );
        this.insert( 1, this.grid );
    },


    _getGridConfig: function( field ) {
        var gridConfig = {
                xtype: 'rallygrid',
//                width: 2560,
                store: this.store,
                enableBulkEdit: true,
//                readOnly: true,
                enableColumnResize: true,
                bulkEditConfig: {
                    showEdit: false,
                    showTag: false,
                    showParent: false,
                    showRemove: false,
                    showMilestones: false
                },
                context: this.getContext(),

                plugins: [
                        Ext.create('Ext.grid.plugin.CellEditing', {
                            clicksToEdit: 2
                        })
                ],

                columnCfgs:  [

                         { text: 'ID', dataIndex: 'FormattedID', width: 75 } ,
                         'Name' ,
                         'Description',
                         { text: 'Owner', dataIndex: 'Owner', width: 75 } ,
                          'Project',
                         { text: 'Business Outcome', dataIndex: 'Parent' },
                         { text: '% Done', dataIndex: 'PercentDoneByStoryPlanEstimate', width: 100},
                         { text: 'Accepted Stories', dataIndex: 'AcceptedLeafStoryCount' , width: 75, align: 'center' },
                         { text: 'Total Story Count', dataIndex:'LeafStoryCount' , width: 75, align: 'center'},
                         { text: 'Accepted Story Estimates', dataIndex: 'AcceptedLeafStoryPlanEstimateTotal', width: 75, align: 'center'},
                         { text: 'Total Story Estimate', dataIndex: 'LeafStoryPlanEstimateTotal', width: 75, align: 'center'},

                         { text: 'Milestones', dataIndex: 'Milestones', readOnly: true },
                          'LastUpdateDate'
                        ]
                    .concat(
                        _.map(
                            Ext.JSON.decode(this.getSetting('colStrings')), function (colstring) {
                                var retval = {
                                    text: colstring.text,
                                    dataIndex: field,
                                    editor: {
                                        xtype: 'apprichtexteditor'
//                                        startEdit: function(arg1, arg2, arg3, arg4) { debugger; }
//                                            listeners: {
//                                                focus: function(arg1, arg2, arg3, arg4, arg5) {
//                                                    this.show();
//                                                },
//                                                blur: function(arg1, arg2, arg3, arg4, arg5) {
//                                                    this.hide();
//                                                }
//                                            }
                                    },
                                    renderer: function (value, metaData, record, rowIdx, colIdx, store) {
                                            retval = this._findSubText(value, colIdx);
                                        return (retval);
                                    },
                                    columnHeaderConfig: {
                                        headerTpl: colstring || 'Invalid App Setting'
                                    }
                                };
                                return retval;
                            }
                    )
                ),

                _findSubText: function (value, colIdx) {

                    var startString = this.columns[colIdx - 1].text;  //Zero based not one based like colIdx
                    var endString = (colIdx < this.columns.length)?this.columns[colIdx].text: null;    //If off the end we will be null here

                    return this._parseWTF(value, startString, endString);
                },

                _parseWTF: function ( value, strB, strE ) {

                    //How the fork do you parse this field!!!!

                    //So, I think it goes like this....
                    // 1. Find the first string you are looking for
                    // 2. Check whether it is part of a div already (<div> will be just before)
                    // 3. Find the next string. If it exists, backtrack to before the prior <div>
                    //    If not, then just use the rest of the text
                    // 4. Rinse and repeat

                    var startPoint = value.indexOf(strB);

                    if (startPoint < 0) {
                        return '';
                    }

                    var gotDiv = false; //Are we in a <div>
                    var midDiv = false; //Have we got a <div> between string and value

                    if (startPoint > 4) //Might be a <div> in front
                    {
                        if (value.slice( startPoint - 5, startPoint) === '<div>') {
                            gotDiv = true;
                            startPoint -= 5;    //Move back to before the <div>
                        }

                        if (value.slice(startPoint + strB.length + 5, startPoint + strB.length + 11) === '</div>') {
                            midDiv = true;
                        }
                    }

                    // Look for end
                    var endPoint = value.indexOf(strE);
                    if ( endPoint > 0 ) {
                        if (value.slice( endPoint - 5, endPoint) === '<div>') {
                            endPoint -= 5;
                        }
                    }
                    else {
                        endPoint = value.length;
                    }

                    var finalString = value.slice( startPoint, endPoint);

                    //Remove the separator div from end
                    var uselessDiv = '<div><br /></div>';
                    while (finalString.slice( finalString.length - uselessDiv.length, finalString.length) == uselessDiv) {
                        finalString = finalString.slice(0, finalString.length - uselessDiv.length);
                    }

                    if (gotDiv) {
                        if (midDiv) {
                            finalString = finalString.slice( strB.length + 11, finalString.length); //Remove <div></div>
                        }
                        else {
                            finalString = finalString.slice( strB.length + 5, finalString.length - 6);
                        }

                    }
                    else finalString = finalString.slice( strB.length, finalString.length);

                    //Remove the separator div from start
                    while (finalString.slice( 0, uselessDiv.length) == uselessDiv) {
                        finalString = finalString.slice(uselessDiv.length, finalString.length);
                    }

                    return finalString;
                }
            };
        return (gridConfig);
    },

    _onLoad: function(app, value) {
        var modelType = 'portfolioitem/' + this.down('rallyportfolioitemtypecombobox').rawValue;

        var filters = [];
        var timeboxScope = app.getContext().getTimeboxScope();
        if(timeboxScope) {
            filters.push(timeboxScope.getQueryFilter());
        }

        //Now get the settings query box and apply those settings
        var queryString = app.getSetting('query');
        if (queryString) {
            var filterObj = Rally.data.wsapi.Filter.fromQueryString(queryString);
            filterObj.itemId = filterObj.toString();
            filters.push(filterObj);
        }

        var itemStore = Ext.create('Rally.data.wsapi.artifact.Store', {
            models: [ modelType ],
            filters: filters,
            autoLoad: true,
            fetch: [ 'FormattedID', 'Name', 'Owner', 'Notes', 'PercentDoneByStoryCount', 'PercentDoneByStoryPlanEstimate',
                'AcceptedLeafStoryCount', 'LeafStoryCount', 'AcceptedLeafStoryPlanEstimateTotal', 'LeafStoryPlanEstimateTotal',
                'LastUpdateDate', 'Description', 'Project', 'Parent', 'PlannedStartDate', 'PlannedEndDate', 'ActualStartDate', 'ActualEndDate',
                'Milestones' ],
            hydrate: ['Milestones'],
            listeners: {
                load: function (store, data, success) {
                    this.store = store;
                    this._addGrid();
                },
                scope: app
            }
        });

        app.exporter = Ext.create('GridExporter');

        var rallybutton = this.down('rallybutton');
        if ( rallybutton ) {
            rallybutton.destroy();
        }

        app.add ({
            id : 'exportButton',
            margin: '5 5 5 5',
            xtype: 'rallybutton',
            text : 'Export',
            handler : function() {
                var saveDialog = Ext.create('Rally.ui.dialog.Dialog', {
                    autoShow: true,
                    draggable: true,
                    width: 300,
                    title: 'Export all records',
                    items: [
                        {
                            xtype: 'rallybutton',
                            text: 'CSV',
                            handler: function () {
                                app.exporter.exportCSV(app.grid);
                                saveDialog.destroy();
                            }
                        }
                    ]

                 });
            }

        });
    }
});


Ext.define('Rally.ui.bulk.RecordMenuFix', {
    override: 'Rally.ui.menu.bulk.RecordMenu',
    _getMenuItems: function() {
        var records = this.getRecords();
        var items = this.callParent(arguments);
        items.push({
            xtype: 'resetBulkField',
            id: 'resetBulkField'
        });
        _.each(items, function(item) {
            Ext.apply(item, {
                records: records,
                store: this.store,
                onBeforeAction: this.onBeforeAction,
                onActionComplete: this.onActionComplete,
                context: this.getContext()
            });
        }, this);

        return items;
    }
});

Ext.define('resetBulkField', {
    extend: Rally.ui.menu.bulk.MenuItem,
    alias: 'widget.resetBulkField',

    config: {
        text: 'Reset Field',
        handler: function( arg1, arg2, arg3) {
            var fields = _.map( Ext.JSON.decode(Ext.getCmp('columnsApp').getSetting('colStrings')), function(value) {
                                    return value.text;
                                });
            var theString = '';
            _.each(fields, function( field) {
                theString += '<div>' + field + '</div><div><br /></div>';
            });
            _.each( this.records, function( record) {
                record.set(Ext.getCmp('columnsApp').getSetting('allowedTextFields'), theString);
                record.save();
            });

        }
    }
});

Ext.define ('AppRichTextEditor', {
//    extend: Rally.ui.richtext.RichTextEditor,
        extend:  Ext.Component ,
        alias: 'widget.apprichtexteditor',

    config: {
        hideMode: 'offsets',
        listeners: {
//            blur: function(arg1, arg2, arg3, arg4, arg5) {
//                debugger;
//                this.hide();
//                return true;
//            },
//            beforedestroy: function(arg1, arg2, arg3, arg4) {
//                debugger;
//                return true;
//            },
//            beforestartedit: function(arg1, arg2, arg3, arg4) {
//                debugger;
//                return false;
//            }
        }
    },

    constructor: function(config, arg2, arg3, arg4) {
        this.mergeConfig(config);
        this.callParent([this.config]);
//        debugger;
    },

    initComponent: function(arg1, arg2, arg3, arg4) {
        this.callParent(arguments);
        this.addEvents( 'beforestartedit');
//        this.getRawValue = this._getRawValue;
//        this.setSize = this._setSize;
//        if (!this.getToolbarAlwaysEnabled()) {
//            this.on('focus', this._enableToolbar, this);
//            this.on('blur', this._disableToolbar, this);
//        }
//
//        this.mixins.field.initField.call(this);
//
//        debugger;
    },
//
//    _getRawValue: function () {
//        return this.initialValue;
//    },
//
//    _setSize: function( width, height) {
//        return true;
//    },


    startEdit: function(el, value, context) {
        var me = this;
        var field = me.field;

//debugger;

        me.completeEdit();
        me.boundEl = Ext.get(el);
        value = Ext.isDefined(value) ? value : Ext.String.trim(me.boundEl.dom.innerText || me.boundEl.dom.innerHTML);

        if (!me.rendered) {
            if (me.ownerCt) {
                me.parentEl = me.ownerCt.el;
                me.parentEl.position();
            }
            me.render(me.parentEl || document.doby);
        }

        if (me.fireEvent('beforestartedit', me, me.boundEl, value) !== false) {
            me. startValue = value;
            me.show();
            me.editing = true;
        }
    }
//
//    calculate: function (ownerContext) {
//    }

});
