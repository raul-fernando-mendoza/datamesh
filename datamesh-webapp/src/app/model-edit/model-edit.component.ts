import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component , ViewChild} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { JoinCondition, JoinNode, ModelCollection, ModelObj, SnowFlakeColumn, SnowFlakeTable } from 'app/datatypes/datatypes.module';
import { FirebaseService } from 'app/firebase.service';
import { StringUtilService } from 'app/string-util.service';
import { UrlService } from 'app/url.service';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../../environments/environment'
import * as uuid from 'uuid';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTreeModule, MatTreeNestedDataSource} from '@angular/material/tree';
import { NestedTreeControl} from '@angular/cdk/tree';
import { JoinDataSource, TreeNode } from './join-datasource';
import { MatMenuModule } from '@angular/material/menu';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { HttpStatusCode } from '@angular/common/http';
import { DaoService } from 'app/dao.service';
import { JoinDialog } from 'app/join-dialog/join-dlg';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TableItem } from 'app/tables-tree/tables-tree';





@Component({
  selector: 'app-model-edit',
  standalone: true,
  imports:[ 
    CommonModule ,
    MatIconModule,
    MatButtonModule,
    FormsModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTreeModule,
    MatMenuModule,
    CdkDropList, CdkDrag ,
    MatProgressBarModule    
   ],
  providers: [JoinDataSource],
  templateUrl: './model-edit.component.html',
  styleUrl: './model-edit.component.css'
})
export class ModelEditComponent {
  model:ModelObj | null = null
  id:string | null = null
  groupId:string|null = null

  unsubscribe:Unsubscribe | null = null

  FG = this.fb.group({
    label:['',[Validators.required]],
    description:['']
  })  

  newJoinFG = this.fb.group({
    table:['',[Validators.required]]
  })  

  treeControl = new NestedTreeControl<TreeNode>(node => node.childrenNodes);
  dataSource = new JoinDataSource(this.treeControl);
  
  hasChild = (_: number, node: TreeNode) => !!node.childrenNodes && node.childrenNodes.length > 0;

  isLast = (_: number, node: TreeNode) => node.isLast;

  isEditing = (_: number, node: TreeNode) => {
    return node.item ==  this.newInfoNodeAdding
  };

  isNew = (_: number, node: TreeNode) => {
    if( this.isAdding && node.item.name == "" ){
      return true
    }
    else{
      return false
    }
  };

  isAdding = false
  parentInfoNodeAdding:JoinNode | null = null
  newInfoNodeAdding:JoinNode | null = null

  isLoading = false

 
  
  constructor( 
    private fb:FormBuilder 
   ,private stringUtilService:StringUtilService
   ,private activatedRoute:ActivatedRoute
   ,private router:Router
   ,public firebaseService:FirebaseService
   ,private urlService:UrlService
   ,private dao:DaoService
   ,private dialog: MatDialog
   ){
     this.activatedRoute.params.subscribe(res => {
       if("id" in res){
         this.id = res["id"]
         this.update()
       }  
       else if("groupId" in res){
         this.groupId = res["groupId"]
       }
     }) 
  }  
    
  flatModelMap = new Map<string,JoinNode>()

  loadFlatModel( joins:JoinNode[] ){
    joins.map( n => {
      this.flatModelMap.set(n.id, n)
      if( n.children ){
        this.loadFlatModel( n.children )
      }
    })
  }


  update(){
    
    if( this.id ){
      this.unsubscribe = onSnapshot( doc( db,ModelCollection.collectionName, this.id ),
          (docRef) =>{
                if( docRef.exists()){
                  this.model=docRef.data() as ModelObj
                  this.FG.controls.label.setValue( this.model.label!)
                }
                if( this.model ){
                  this.flatModelMap.clear()
                  this.loadFlatModel(this.model.data)
                  this.dataSource.setData(this.model.data) 
                  //this.dataSource.setData(this.data)
                }
          },
          (reason:any) =>{
              alert("ERROR update comparison list:" + reason)
          }  
      )
    }
  }    
  onDelete(){
    if(this.id && this.model){
      if( confirm("are you sure to delete:" + this.model.label) ){
        this.firebaseService.deleteDoc(ModelCollection.collectionName, this.id ).then( ()=>{
          this.router.navigate(["/"])
        })
      }
    }
  }  
  onSubmit(){
    if( !this.model ){
      this.create()
    }
    else{
      this.save()
    }
  }
  create():Promise<void>{
    //create new
    let model:ModelObj = {
      id: uuid.v4(),
      label: this.FG.controls.label.value!,
      groupId: this.groupId!,
      description: '',
      credentials: '',
      owner: '',
      data: []
    }
    return this.firebaseService.setDoc( ModelCollection.collectionName, model.id, model).then( () =>{
      this.id = model.id
      this.router.navigate([ModelCollection.collectionName,"edit",this.id])
    })
  }
  save(){
    if( this.model ){
      this.firebaseService.updateDoc( ModelCollection.collectionName, this.model.id, this.model)
    }
  }

  onCancel(){
    this.router.navigate(["/"])
  }

  ngOnInit() {
    this.update()
  }
  
  Edit(node:JoinNode | null){
    if( this.model  && node ){
      console.log(node)
      this.isAdding = true

      this.newJoinFG.controls.table.setValue(node.name)
      this.newInfoNodeAdding = node
    } 
    this.dataSource.setData(this.model!.data)
  }

  AddSubmit(node:JoinNode){
    if( this.model ){
      console.log(node)
      var name = this.newJoinFG.controls.table.value
      
      
      if(this.isAdding && this.newInfoNodeAdding != null && name ) {
        this.newInfoNodeAdding.name = name
        
        this.isAdding = false
        this.newInfoNodeAdding = null
        this.parentInfoNodeAdding = null
        this.newJoinFG.controls.table.setValue("")
      }
      this.save()    
    }
  }  
  
  EditSubmit(node:JoinNode){
    if( this.model ){
      console.log(node)
      var name = this.newJoinFG.controls.table.value
      
      if(this.isAdding && this.newInfoNodeAdding != null && name ) {
        this.newInfoNodeAdding.name = name
        this.isAdding = false
        this.newInfoNodeAdding = null
        this.parentInfoNodeAdding = null
        this.newJoinFG.controls.table.setValue("")
      }
      this.save()    
    }
  }    


  deleteNode(parentNodeInfo:JoinNode, nodeInfo:JoinNode){
    if( this.model ){
      if( parentNodeInfo && parentNodeInfo.children ){
        let idx = parentNodeInfo.children.findIndex( (node) => node == nodeInfo )
        if( idx >= 0){
          parentNodeInfo.children.splice(idx, 1)
          this.save()
        }
      } 
      else{
        let idx = this.model.data.findIndex( (node) => node == nodeInfo )
        if( idx >= 0){
          this.model.data.splice(idx, 1)
          this.save()
        }      
      }
    }
  }
  acceptPredicate(drag: CdkDrag, drop: CdkDropList) {
    return true //drag.data.startsWith("G") ;
  }  
  
  AddTable(
    connectionId:string,
    schemaName:string,
    tableName:string,
    parentNode:JoinNode | null){
    if( this.model ){
      console.log(parentNode)
      let id = uuid.v4()
      var newJoin:JoinNode = {
        id: id,
        name: tableName,
        connectionId: connectionId,
        tableName: tableName,
        joinCriteria: [],
        
      }
      
      if( !parentNode ){
        this.model.data.push( newJoin  )
      }
      else{
        
        if( !parentNode.children ){
          parentNode.children = []
        }
        parentNode.children.push(newJoin)
      }
      this.save()   
    } 
  }
  
  onDrop(e:any){
    var data  = e.item.data as SnowFlakeTable 
    console.log(data)
    var connectionId = data.connectionId
    var schemaName = data.schemaName
    var tableName =  data.tableName
    var joinNodeId = e.container.id  
    var parentNode:JoinNode = this.flatModelMap.get( joinNodeId ) as JoinNode

    if( parentNode ){

      var leftColumns:Array<SnowFlakeColumn> = []
      var rightColumns:Array<SnowFlakeColumn> = []

      this.isLoading = true
    
      this.dao.getTableColumns(parentNode.connectionId, parentNode.tableName ).then( left =>{
        console.debug( left )
        leftColumns = left
        
      }).then(()=>{
        return this.dao.getTableColumns(connectionId, tableName ).then( right =>{
          console.debug( right )
          rightColumns = right
        })
      }).then( ()=>{
        this.isLoading = false
        this.openJoinDialog(parentNode, leftColumns, connectionId, schemaName, tableName, rightColumns)
      },
      error=>{
        this.isLoading = false
        alert("error retriving columns")
      })
    }
    else{
      this.AddTable( connectionId, schemaName, tableName, parentNode! )
    }
    

  } 
  
  openJoinDialog(
    parentNode:JoinNode,
    leftColumns:Array<SnowFlakeColumn>,
    connectionId:string, 
    schemaName:string, 
    rightTableName:string,
    rightColumns:Array<SnowFlakeColumn>
  ){
    const dialogRef = this.dialog.open(JoinDialog, {
      height: '60%',
      width: '60%',
      data: { 
        label:"Join Dialog", 
        leftTableName:parentNode.tableName,
        leftColumns:leftColumns,
        rightTableName:rightTableName,
        rightColumns:rightColumns,
        joinConditions:[]
      }
    });
  
    dialogRef.afterClosed().subscribe(data => {
      console.log('The dialog was closed');
      if( data != undefined ){
        console.debug( data )
        let newJoinNode:JoinNode = {
          id: uuid.v4(),
          name: rightTableName,
          connectionId: connectionId,
          tableName: rightTableName,
          joinCriteria: data.joinConditions
        }
        if( !parentNode.children ){
          parentNode.children = []
        }
        parentNode.children.push(newJoinNode)
        this.save()
      }
    })
  }

  getJoinCriteriaText(joinCriteria: JoinCondition[]){
    let str=""
    joinCriteria.forEach( e =>{
      str += e.leftValue + e.comparator + e.rightValue + "\n"
    })
    return str
  }

  EditJoinNode(parentNode:JoinNode, node:JoinNode){
    console.log(node)
    if( parentNode ){

      var leftColumns:Array<SnowFlakeColumn> = []
      var rightColumns:Array<SnowFlakeColumn> = []

      this.isLoading = true
    
      this.dao.getTableColumns(parentNode.connectionId, parentNode.tableName ).then( left =>{
        console.debug( left )
        leftColumns = left
        
      }).then(()=>{
        return this.dao.getTableColumns(node.connectionId, node.tableName ).then( right =>{
          console.debug( right )
          rightColumns = right
        })
      }).then( ()=>{
        this.isLoading = false
        this.editJoinDialog(parentNode, leftColumns, node, rightColumns)
      },
      error=>{
        this.isLoading = false
        alert("error retriving columns")
      })
    }

  }

  editJoinDialog(
    parentNode:JoinNode,
    leftColumns:Array<SnowFlakeColumn>,
    node:JoinNode,
    rightColumns:Array<SnowFlakeColumn>
  ){
    const dialogRef = this.dialog.open(JoinDialog, {
      height: '60%',
      width: '60%',
      data: { 
        label:"Join Dialog", 
        leftTableName:parentNode.tableName,
        leftColumns:leftColumns,
        rightTableName:node.tableName,
        rightColumns:rightColumns,
        joinConditions:node.joinCriteria
      }
    });
  
    dialogRef.afterClosed().subscribe(data => {
      console.log('The dialog was closed');
      if( data != undefined ){
        console.debug( data )
        this.save()
      }
    })
  }

}
