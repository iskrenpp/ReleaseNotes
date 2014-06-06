

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:[ {   xtype: 'container',
                itemId:'controlsContainer',
                layout:'hbox'
            },
            {   xtype: 'container',
                itemId:'displayContainer'
            }
                ],
                
    launch: function() {
        console.log("Loading App: Release Notes App");
        console.log ('context',this.getContext());
        this.now= new Date();
        var tf = Ext.create('Rally.ui.TextField',
        {
            //emptyText: Rally.util.DateTime.toIsoString(new Date(),true),
            //setValue : this.now.toISOString(),
            itemId: 'tf'
        }
        );
        this.sd=new Date(this.now.getTime());
        this.sd.setMonth(this.sd.getMonth()-1);
        
        tf.setValue(this.sd.toISOString());
        
        var button = Ext.create('Rally.ui.Button',
        
        {
            text: 'Generate',
            handler: this._onButtonClick,
            scope : this
        });

        var rCB=Ext.create('Rally.ui.combobox.ReleaseComboBox',{
            itemId: 'relComboBox',
            listeners: {
                ready : function(rCB){
                    console.log('ready');
                    console.log(rCB);
                    console.log(rCB.getValue());
                	console.log('container',this.down('#displayContainer'));
                    this.down('#controlsContainer').add(button);
                    this._onButtonClick();
                },
                scope : this
            
            }
        
        });
        
        this.down('#controlsContainer').add(tf);
        this.down('#controlsContainer').add(rCB);
        //this.down('#controlsContainer').add(button);
        //this._onButtonClick();
    },
    
    
    _onButtonClick: function(){
        console.log("Go fetch data.");
        console.log('textfield',this.down('#tf'));
        var release=this.down('#relComboBox').getRecord().get('ObjectID');
        var that=this;
        //var now=Rally.util.DateTime.toIsoString(new Date(),true);
        //console.log(this.now);
        var startDate=this.down('#tf').getValue();
        console.log('startDate', startDate);
        console.log('now',this.now.toISOString());
        Ext.create('Rally.data.lookback.SnapshotStore', {
                    listeners: {
                        load: function(store, data, success) {
                            console.log('loaded snapshots', data);
                            console.log('this',this);
                            that._displayResults(store);
                        }
                    },
                    //scope : this,
                    autoLoad : true,
                    fetch: [
                        'FormattedID',
                        '_referenceId',
                        'Project',
                        'Name',
                        'ScheduleState',
                        'State',
                        'Ready',
                        'Release'],
                    hydrate:[
                            'ScheduleState',
                            'Release',
                            'Project',
                            'Name'
                    ],
                    compress : true,//to do  - check for returning duplicates
                    
                    filters: [
                        {
                            property: '_TypeHierarchy',
                            operator: 'in',
                            value: ['Defect', 'HierarchicalRequirement']
                        },
                        {
                            property : 'Project',
                            operator : '=',
                            value: 9335289720
                        },
                        {
                            property : 'Release',
                            operator : '=',
                            value: release
                        },
                        {
                            property : '_ValidFrom',
                            operator : '>=',
                            value: startDate
                        },
                        {
                            property : '_ValidFrom',
                            operator : '<',
                            value: this.now.toISOString()
                        },
                        {
                            property : '_ValidTo',
                            operator : '>',
                            value: this.now.toISOString()
                        },
                        {
                            property : 'ScheduleState',
                            operator : '!=',
                            value: 'Completed'
                        }


                        
                        

                    ],
                    context: 
                    {
                        workspace: '/workspace/9098595109',
                        project:'/project/9335289720',
                        projectScopeDown: true
                    
                    }
                    
        });
        
    },
    _displayResults : function (myStore){
        var displayGrid=Ext.create('Rally.ui.grid.Grid',{
			id:'grid',
			store: myStore,
			title:'RELEASE NOTES',
			columnCfgs: [
							{text: 'Formatted ID', dataIndex : 'FormattedID'},
							{text : 'Name', dataIndex : 'Name'},
							{text

			],
			
			pagingToolbarCfg: {
		        pageSizes: [40, 60, 80]
			},
			showPagingToolbar : false,
			columnLines:true,
		});
		this.down('#displayContainer').add(displayGrid);
    
    }
    
    
    
});