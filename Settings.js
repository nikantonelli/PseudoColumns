Ext.define('Settings', {
    singleton: true,
    requires: [
        'Rally.ui.combobox.FieldComboBox',
        'Rally.ui.combobox.ComboBox',
        'Rally.ui.TextField',
        'Rally.ui.NumberField',
        'Rally.data.wsapi.Filter',
        'StringsField'
    ],


    getFields: function(context) {

    var blackListedFields = [ 'DisplayColor', 'Name', 'DragAndDropRank', 'InvestmentCategory' ];

        //This can be called before we really need it
        if ( ! Ext.getCmp('piType'))
            return [];

        return [
        {
            name: 'allowedTextFields',
            xtype: 'rallyfieldcombobox',
            model: 'portfolioitem/' + Ext.getCmp('piType').rawValue,
            fieldLabel: 'Text Field',
            readyEvent: 'ready',
            _isNotHidden: function (field) {
                var retval = (field.type.type == 'string') &&
                    !(field.hidden || _.contains( blackListedFields, field.name) || field.readOnly);
                return (retval );
            }
        },
        {
            name: 'colStrings',
            xtype: 'stringsfield',
            fieldLabel: 'Columns'
        }, {
            type: 'query'
        }];
    }
});
