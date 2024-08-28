import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTreeModule, MatTreeFlatDataSource, MatTreeFlattener, MatTree } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConnectionsService } from 'app/connections.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormBuilder } from '@angular/forms';
import { Connection } from 'app/datatypes/datatypes.module';
import { MatSelectModule} from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UrlService } from 'app/url.service';
import { sql } from '@codemirror/lang-sql';
import { LoadmoreDatabase, DbFlatNode, SchemaNode, LOAD_MORE, TableNode, MoreNode, TableItem, SchemaItem, MoreItem } from './tables-tree';
import { Observable } from 'rxjs';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-tables-tree',
  templateUrl: './tables-tree.component.html',
  styleUrl: './tables-tree.component.css',
  providers: [LoadmoreDatabase],
  standalone: true,
  imports: [
    FormsModule, 
    ReactiveFormsModule,
    MatTreeModule, 
    MatButtonModule, 
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatInputModule,
  ]
})
export class TablesTreeComponent implements OnInit{

  nodeMap = new Map<string, DbFlatNode>();
  treeControl: FlatTreeControl<DbFlatNode>;
  treeFlattener: MatTreeFlattener<SchemaNode|TableNode|MoreNode, DbFlatNode>;
  // Flat tree data source
  dataSource: MatTreeFlatDataSource<SchemaNode|TableNode|MoreNode, DbFlatNode>;

  FG = this.fb.group({
    connectionId:[""],
    pattern:[""]
  })  

  connections:Array<Connection> = []

  schemaSql = 
  "select t.table_schema,          "+
  "       t.table_name             "+                                 
  " from information_schema.tables t"+                                        
  " order by table_schema,          "+                                        
  "       table_name               "
  
  tableSql =
  "select t.table_schema,                                                     "+
  "       t.table_name,                                                       "+
  "       c.column_name,                                                      "+
  "       c.ordinal_position,                                                 "+
  "       c.data_type,                                                        "+
  "       case                                                                "+
  "            when c.numeric_precision is not null                           "+
  "                then c.numeric_precision                                   "+
  "            when c.character_maximum_length is not null                    "+
  "                then c.character_maximum_length                            "+
  "       end as max_length,                                                  "+
  "       c.numeric_scale,                                                    "+
  "       c.is_identity,                                                      "+
  "       c.is_nullable                                                       "+
  "from information_schema.tables t                                           "+
  "inner join information_schema.columns c on                                 "+
  "         c.table_schema = t.table_schema and c.table_name = t.table_name   "+
  "order by table_schema,                                                     "+
  "       table_name,                                                         "+
  "       ordinal_position;                                                   "
  
     
  constructor(
    private fb:FormBuilder, 
    private connectionSrv:ConnectionsService,
    private urlSrv:UrlService,
    private _database: LoadmoreDatabase
    ) {
      this.treeFlattener = new MatTreeFlattener(
        this.transformer,
        this.getLevel,
        this.isExpandable,
        this.getChildren,
      );
  
      this.treeControl = new FlatTreeControl<DbFlatNode>(this.getLevel, this.isExpandable);
  
      this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  
      _database.dataChange.subscribe(data => {
        this.dataSource.data = data;
      });
  
      _database.initialize();

  }

  getChildren = (node: SchemaNode|TableNode|MoreNode): Observable<Array<SchemaNode|TableNode|MoreNode>> => node.childrenChange;

  transformer = (node: SchemaNode|TableNode|MoreNode, level: number) => {
    const existingNode = this.nodeMap.get(node.item.id);

    if (existingNode) {
      return existingNode;
    }

    const newNode = new DbFlatNode(
      node.item,
      level,
      node.hasChildren
    );
    this.nodeMap.set(node.item.id, newNode);
    return newNode;
  };  

  getLevel = (node: DbFlatNode) => node.level;

  isExpandable = (node: DbFlatNode) => node.expandable;

  hasChild = (_: number, _nodeData: DbFlatNode) => _nodeData.expandable;

  isLoadMore = (_: number, _nodeData: DbFlatNode) =>{
    var item = _nodeData.item
    return item instanceof MoreItem;
  } 

  /** Load more nodes from data source */
   appendMore(node: DbFlatNode) {
    this._database.appendMore(node.item);
  }

  loadChildren(node: DbFlatNode) {
    this._database.loadChildren(node.item, true);
  }  

  ngOnInit(): void {

    this.connectionSrv.getConnections().then( (connections) => {
      this.connections.length = 0
      this.connections.push( ...connections )
    },
    reason=>{
      alert("Error readin connection:" + reason)
    })
    this.update()

  }  



  update(){

  }
  
  onConnectionChange($event:any){
    this.reloadSchemas()

  }
  reloadSchemas(){
    this._database.rootLevelNodes.length = 0
    this._database.dataMap.clear()
    if( this.FG.controls.connectionId.value ){
      var connectionId = this.FG.controls.connectionId.value
   
      var req = {
        connectionId:connectionId,
        sql:this.schemaSql
      }
      this.urlSrv.post("executeSql",req).subscribe({ 
        'next':(result:any)=>{
          console.log( result )
          var resultSet = result.resultSet
          var newData = []
          for( var i=0; i<resultSet.length ; i++){
            var record = resultSet[i]
            var schemaName = record[0]
            //add the schema to the root nodes
            if( !this._database.rootLevelNodes.find( s => s.id == schemaName) ){
              var schemaItem = new SchemaItem( schemaName)
              this._database.rootLevelNodes.push(schemaItem)
              this._database.dataMap.set( schemaName , [])
            }
   
            
            //now add the table to the datanode schema
            var schemaData = this._database.dataMap.get(schemaName)!
            var tableName = schemaName + "." + record[1]
            if( !schemaData.find(item => item.id == tableName) ){
              var tableItem = new TableItem(schemaName,tableName)
              schemaData.push( tableItem )
              this._database.dataMap.set( tableName , [])
            }
            /*
            //no add field
            var fieldName = tableName + "." + record[2]
            var tableData = this._database.dataMap.get(tableName)!
            tableData.push( fieldName )
            */
          }
          this._database.initialize();
          

        },
        'error':(reason)=>{
          alert( reason.error.error )
        }
      })         

    }     
  }

  onCancel(){

  }
  onSearch(){

  }

  getLastName(id:string){
    if(!id) return "unknown"
    let strArr = id.split(".").reverse()
    return strArr[0]
  }
}
