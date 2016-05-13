Ext.define('StringsField', {
    extend: 'Ext.form.field.Base',
    alias: 'widget.stringsfield',
    requires: [
        'Rally.ui.Button'
    ],

    fieldSubTpl: '<div id="{id}"></div>',

    cls: 'colStrings',

    config: {
        /**
         * @cfg {Object}
         *
         * The size settings value for this field
         */
        value: undefined
    },

    onDestroy: function() {
        if (this._stringsContainer) {
            this._stringsContainer.destroy();
            delete this._stringsContainer;
        }
        this.callParent(arguments);
    },

    onRender: function() {
        this.callParent(arguments);

        this._stringsContainer = Ext.create('Ext.Container', {
            renderTo: this.inputEl,
            cls: 'strings-container',
            items: this._buildRows()
        });
    },

    /**
     * When a form asks for the data this field represents,
     * give it the name of this field and the ref of the selected project (or an empty string).
     * Used when persisting the value of this field.
     * @return {Object}
     */
    getSubmitData: function() {
        var data = {};
        data[this.name] = Ext.JSON.encode(_.map(Ext.ComponentQuery.query('container', this._stringsContainer), function(row) {
            var labelTextBox = Ext.ComponentQuery.query('rallytextfield', row)[0];

            return {
                text: labelTextBox.getValue()
            };
        }));

        return data;
    },

    _buildRows: function() {
        return [{
            xtype: 'component',
            margin: '0 0 5px 0',
            html: '<span class="label-header">Title</span>'
        }].concat(_.map(Ext.JSON.decode(this._value), function(value) {
            return this._buildRow(value);
        }, this));
    },

    _buildRow: function(value) {
        return {
            xtype: 'container',
            layout: 'hbox',
            items: [{
                xtype: 'rallybutton',
                border: false,
                frame: false,
                cls: 'row-btn plus',
                disabled: false,
                itemId: 'plusButton',
                iconCls: 'icon-plus',
                listeners: {
                    click: this._addRow,
                    scope: this
                }
            }, {
                xtype: 'rallybutton',
                border: false,
                cls: 'row-btn minus',
                frame: false,
                iconCls: 'icon-minus',
                itemId: 'minusButton',
                listeners: {
                    click: this._removeRow,
                    scope: this
                }
            }, {
                xtype: 'rallytextfield',
                width: 500,
                value: value && value.text
            }]
        };
    },

    _addRow: function(button) {
        var container = button.up();
        var stringsContainer = container.up();
        var index = stringsContainer.items.indexOf(container);
        stringsContainer.insert(index + 1, this._buildRow());
        var appSettings = this.up('rallyappsettings');
        appSettings.fireEvent('appsettingsready', appSettings);
    },

    _removeRow: function(button) {
        button.up().destroy();
        var appSettings = this.up('rallyappsettings');
        appSettings.fireEvent('appsettingsready', appSettings);
    },

    setValue: function(value) {
        this.callParent(arguments);
        this._value = value;
    }
});