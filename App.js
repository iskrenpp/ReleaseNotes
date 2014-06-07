

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
    appWorkspace : null,
    appPrefName: 'buildList6',

                
    launch: function() {
        
        this.appWorkspace = this.getContext().getWorkspaceRef();
        console.log ('workspace ref', this.appWorkspace);
        console.log('context',this.getContext());
        console.log("Loading App: Release Notes App");
        this.now= new Date();
        var tf = Ext.create('Rally.ui.TextField',
        {
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
        var release=this.down('#relComboBox').getRecord().get('ObjectID');
        var that=this;
        var startDate=this.down('#tf').getValue();
        
        Ext.create('Rally.data.lookback.SnapshotStore', {
                    listeners: {
                        load: function(store, data, success) {
                            console.log('loaded snapshots', data);
                            console.log('this',this);
                            that._fetchBuilds(store);
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
    
    _fetchBuilds : function (myStore){
        // get pref value object and put into an array
        
        var buildPairs = null;
        Rally.data.PreferenceManager.load({
            workspace: this.appWorkspace,
            filterByName: this.appPrefName,
            success: function(pref) {
                //console.log('loaded pref', pref, pref[this.appPrefName]);
                var decodedPrefValue = Ext.JSON.decode(pref[this.appPrefName]);
                this.appPrefValue = (decodedPrefValue === undefined) ? {} : decodedPrefValue;
                console.log('decoded pref value', this.appPrefValue);
                buildPairs=_.sortBy(this.appPrefValue,'date');
                
                console.log ('build Pairs',buildPairs);
                
                this._sortData(buildPairs,myStore);
            },
            scope: this
        });
    },
    
    _sortData : function(myBuilds,myStore){
        
        var customGridData = [];
        
        // loop through snapshots
        myStore.each(function(snapshot) {
            var buildNumber = null;
            _.each(myBuilds,function (buildData){  
                console.log (buildData.date, buildData.build);
               if (snapshot.get('_ValidFrom')<buildData.date)
                {
                    buildNumber = buildData.build;
                    console.log('item assigned to build');
                    return false;
                    
                }
            
            });
            
            
            customGridData.push({formattedId: snapshot.get('FormattedID'), name: snapshot.get('Name'), build: buildNumber });
        }, this);
        
        var gridStore = Ext.create("Rally.data.custom.Store", {
            data: customGridData,
            storeId: 'gridStore',
            columnCfgs: [
                {
                    text: 'Formatted ID', dataIndex: 'formattedId'
                },
                {
                    text: 'Name', dataIndex: 'name'
                },
                {
                    text: 'Build', dataIndex: 'build'
                }
                ]
        });
        this._displayGrid(customGridData);
    },


    _displayGrid: function(myStore) {
        console.log('creating grid', myStore);
        var displayGrid=Ext.create('Ext.grid.Panel',{
			itemId:'grid',
			store: Ext.data.StoreManager.lookup('gridStore'),
			title:'RELEASE NOTES',
			columns: [
						{text: 'Formatted ID', dataIndex : 'formattedId', flex: 1},
						{text : 'Name', dataIndex : 'name', flex: 5},
						{text: 'Build', dataIndex: 'build', flex: 2}
			],
			
			showPagingToolbar : false,
			columnLines:true
		});
		this.down('#displayContainer').add(displayGrid);
    
    }
    
    
    
});