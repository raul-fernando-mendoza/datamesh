import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, signal, ViewChild } from '@angular/core';
import {  FormBuilder,  FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JoinData, JoinNode, ModelObj,  SnowFlakeTable,    InfoNode, JoinNodeObj,  getCurrentTimeStamp, FilterTransformation, Transformation, JoinNodeActionData, ActionOption, TransformationType, GroupByTransformation, SelectColumnsTransformation, SqlResultGeneric, RenameColumnTransformation, NewColumnTransformation, SqlColumnGeneric, SnowFlakeDataset, LocalFilterTransformation } from 'app/datatypes/datatypes.module';
import { FirebaseService } from 'app/firebase.service';
import { StringUtilService } from 'app/string-util.service';
import { UrlService } from 'app/url.service';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../../environments/environment'
import * as uuid from 'uuid';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTree, MatTreeModule} from '@angular/material/tree';
import { JoinDataSource, TreeNode } from './join-datasource';
import { MatMenuModule } from '@angular/material/menu';
import { CdkDrag, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { DaoService } from 'app/dao.service';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule} from '@angular/material/expansion';
import { MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { AuthService } from 'app/auth.service';
import { AngularSplitModule, SplitAreaComponent, SplitComponent } from 'angular-split';
import { TablesTreeComponent } from 'app/tables-tree/tables-tree.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule} from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { FilterDialog } from './filter-dlg';
import { GroupByDialog } from './groupby-dlg';
import { JoinDialog } from './join-dlg';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NewColumnDialog } from './newcolumn-dlg';
import { uuidv4 } from '@firebase/util';
import {MatButtonToggleModule} from '@angular/material/button-toggle';


@Component({
    selector: 'app-model-edit',
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatTreeModule,
        MatMenuModule,
        CdkDropListGroup, CdkDropList,
        MatProgressBarModule,
        MatExpansionModule,
        MatProgressSpinnerModule,
        RouterModule,
        AngularSplitModule,
        SplitComponent,
        SplitAreaComponent,
        TablesTreeComponent,
        MatSidenavModule,
        MatTabsModule,
        MatListModule,
        MatCheckboxModule,
        MatButtonToggleModule
    ],
    providers: [JoinDataSource],
    templateUrl: './model-edit.component.html',
    styleUrl: './model-edit.component.css'
})
export class ModelEditComponent implements OnInit, AfterViewInit{
  @ViewChild("tree") tree!: MatTree<TreeNode> ; 

  
  isLoading = false

  model = signal<ModelObj>(new ModelObj())
  id:string | null = null
  folderId:string|null = null

  unsubscribe:Unsubscribe | null = null

  FG = this.fb.group({
    label:['',[Validators.required]],
    description:['']
  })  

  newJoinFG = this.fb.group({
    table:['',[Validators.required]]
  })  

  arr:Array<{id:string}> = []        


  childrenAccessor = (node: TreeNode) => node.childrenNodes ?? [];

  dataSource = new JoinDataSource();
  
  hasChild = (_: number, node: TreeNode) => !!node.childrenNodes && node.childrenNodes.length > 0;

  isLast = (_: number, node: TreeNode) => node.isLast;

  isEditing = (_: number, node: TreeNode) => {
    return node.item ==  this.newInfoNodeAdding
  };

  parentInfoNodeAdding:JoinNode | null = null
  newInfoNodeAdding:JoinNode | null = null

  

  

  infoNodes:InfoNode[] = []
  infoNodesSignal = signal<InfoNode[]>([])
  flatJoinNodeMap = new Map<string,JoinNodeObj>()
  flatInfoNodes = new Map<string, InfoNode>()  

  selectedJoinNodeObj = signal<JoinNodeObj|null>(null)
  selectedTransactionIdx = signal<number|null>(null)
  result = signal<SqlResultGeneric | undefined>(undefined)

  selectedColumns:Array<FormGroup> = [
    this.fb.group({
      id:[""],
      rename:['',[Validators.required]],
      selected:[false],

      isFiltered:[false],
      filterValues:[""]
    })  
  ]
  
  constructor( 
    private fb:FormBuilder 
   ,private stringUtilService:StringUtilService
   ,private activatedRoute:ActivatedRoute
   ,private router:Router
   ,public firebaseService:FirebaseService
   ,private urlService:UrlService
   ,private dao:DaoService
   ,private dialog: MatDialog
   ,private authService:AuthService
   ){
     this.activatedRoute.params.subscribe(res => {
       if("id" in res){
        if( this.id && this.id != res["id"]){
         this.id = res["id"]
         if( this.unsubscribe )
          this.unsubscribe()
         this.update()
        }
        else{
          this.id = res["id"]
        }
       }

     })
     this.activatedRoute.queryParams.subscribe(params => {
       if("folderId" in params){
         this.folderId = params["folderId"]
       }
     }) 
     for( let i=0; i<100; i++){
      let n = { "id":String(i) }
      this.arr.push( n )
    }      
  }  
  ngAfterViewInit(): void {
    console.log("after view init")
  }
  ngOnInit() {

    this.update()
  }    

  update(){
    
    if( this.id && this.id != 'new' ){
      this.unsubscribe = onSnapshot( doc( db,ModelObj.collectionName, this.id ),
          (docRef) =>{
                if( docRef.exists()){
                  let model=docRef.data() as ModelObj

                  this.model.set(model)

                  this.FG.controls.label.setValue( model.label!)
                  
                  this.dataSource.setData([])
                  this.loadRawModel().then( () =>{
                    this.dataSource.setData(this.infoNodes) 
                    this.tree.expandAll()
                    this.selectedJoinNodeObj.set(null)
                  },
                  reason=>{
                    alert("Error reloading JoinNodes:" + reason.error)
                  })
                  
                  //this.dataSource.setData(this.data)
                }
          },
          (reason:any) =>{
              alert("ERROR update comparison list:" + reason)
          }  
      )
    }
  }
  getPath( infoNode:InfoNode ):InfoNode[]{
    return this.getPathRecursive( infoNode.id, this.infoNodes )
  }

  getPathRecursive(id:string, parentInfoNodes:InfoNode[]):InfoNode[]{
    for(let i = 0; i<parentInfoNodes.length; i++){
      if( parentInfoNodes[i].id == id ){
        return [ parentInfoNodes[i] ]
      }
      else{
        if( parentInfoNodes[i].children ){
          let result = this.getPathRecursive( id, parentInfoNodes[i].children! )
          if( result ){
            return [parentInfoNodes[i], ... result]
          }
        }
      }
    }
    return []    
  }

  isRootNode( infoNode:InfoNode ){
    let isRoot = false
    let idx = this.infoNodes.findIndex( e => infoNode.id == e.id)
    if( idx >= 0){
      isRoot = true
    }
    return isRoot
  }

  getCollection( infoNode:InfoNode ){
    var path = this.getPath( infoNode )

    
    var model = this.model()! 

    var fullPath = ModelObj.collectionName + "/" + model.id + "/" + JoinNodeObj.className 

    if( path ){
      for(let i =0; i< path.length-1; i++){
        fullPath = fullPath + "/" + path[i].id + "/" + JoinNodeObj.className
      }
    }
    return fullPath 
  }
  
  
  loadRawModel():Promise<void>{
    return new Promise((resolve, reject) =>{ 
      this.infoNodes.length = 0
      this.infoNodesSignal.set(this.infoNodes)
      this.flatJoinNodeMap.clear()
      this.flatInfoNodes.clear()


      //add the root
      let model = this.model()

      let currentPath = [ModelObj.collectionName, model.id, JoinNodeObj.className].join("/")
      this.firebaseService.getDocs( currentPath ).then( 
        docs =>{
          let transactions: Promise<void>[] = []
          docs.forEach( doc =>{
            let joinNode:JoinNodeObj = doc.data() as JoinNodeObj
            let root:InfoNode = {
              id: joinNode.id,
              name: joinNode.name,
              children: undefined
            }
            this.flatJoinNodeMap.set( joinNode.id, joinNode)
            this.flatInfoNodes.set( joinNode.id, joinNode)
            this.infoNodes.push( root )
            this.infoNodesSignal.set(this.infoNodes)

            
            
            let t = this.loadRawModelRecursive( currentPath + "/" + joinNode.id , root).then( ()=>{
              //console.log("do nothing")
              },
              error =>{
              alert("Error loading first level")
            })
            transactions.push(t)
            
          })
          Promise.all( transactions ).then( () =>{
            resolve()
          },
          error=>{
            reject( error )
          })
        }
        
      )
    })
  }

  loadRawModelRecursive( parentCollection:string , parentNode:InfoNode ):Promise<void>{
    return new Promise((resolve, reject) =>{
        let transactions:any[]= []
        this.firebaseService.getDocs( parentCollection + "/" + JoinNodeObj.className ).then( docs =>{
        docs.forEach( doc =>{
          let n = doc.data() as JoinNodeObj

          let newInfoNode:InfoNode = {
            id:n.id,
            name:n.tableName,
            children:undefined
          }
          if ( !parentNode.children ){
            parentNode.children = []
          }

          this.flatJoinNodeMap.set( n.id, n)
          this.flatInfoNodes.set( newInfoNode.id, newInfoNode)
          parentNode.children!.push(newInfoNode)
          let t = this.loadRawModelRecursive( parentCollection + "/" + JoinNodeObj.className + "/" + n.id , newInfoNode)
          transactions.push(t)
        
        })
        Promise.all( transactions ).then( () =>{
          resolve()
        })  
      })
    })
  }


      
  onDelete(){
    if(this.id && this.model){
      if( confirm("are you sure to delete:" + this.model()!.label) ){
        this.firebaseService.deleteDoc(ModelObj.collectionName, this.id ).then( ()=>{
          this.router.navigate(["/"])
        })
      }
    }
  }  
  onSubmit(){
    if( this.id == 'new' ){
      this.onCreate()
    }
    else{
      this.save()
    }
  }
  onCreate():Promise<void>{
    //create new
    let model:ModelObj = {
      id: uuid.v4(),
      label: this.FG.controls.label.value!,
      description: '',
      owner: this.authService.getUserUid()!,
      folderId: this.folderId ?? undefined,
      updateon: getCurrentTimeStamp(),
      createon: getCurrentTimeStamp()
    }
    return this.firebaseService.setDoc( ModelObj.collectionName, model.id, model).then( () =>{
      this.id = model.id
      this.router.navigate([ModelObj.collectionName,"edit",this.id])
    },
    error=>{
      alert("Error: model new" + error)
    })
  }
  save(){
    if( this.model ){
      this.firebaseService.updateDoc( ModelObj.collectionName, this.model()!.id, this.model)
    }
  }

  onCancel(){
    this.router.navigate(["/"])
  }


  onDeleteNode(parentNodeInfo:JoinNodeObj, nodeInfo:JoinNodeObj){

    if( parentNodeInfo ){
      let path = this.getPath(parentNodeInfo)
      if( path ){
        let pathWithNodes = ""
        path.forEach( e =>{
          pathWithNodes = pathWithNodes + "/" + JoinNodeObj.className + "/" + e.id
        })
        let parentPath = ModelObj.collectionName + "/" + this.model()!.id + pathWithNodes
        this.firebaseService.deleteDoc(parentPath + "/" + JoinNodeObj.className,nodeInfo.id).then( () =>{
          this.firebaseService.updateDoc(ModelObj.collectionName, this.model()!.id, { updateon:getCurrentTimeStamp() })
        })
      }
    }
    else{ //this is a root node
      let parentPath = ModelObj.collectionName + "/" + this.model()!.id 
      this.firebaseService.deleteDoc(parentPath + "/" + JoinNodeObj.className,nodeInfo.id).then( () =>{
        this.firebaseService.updateDoc(ModelObj.collectionName, this.model()!.id, { updateon:getCurrentTimeStamp() }).then( ()=>{
          console.log("update completed")
        },
        reason=>{
          alert("error updating after delete root node:" + reason.error)
        })
      },
      error=>{
        alert("Error removing root node :" + error.error)
      })      
    }
  }

  updateSampleData():Promise<any>{
    return new Promise(( resolve, reject ) => {

      var req = {
        collection:ModelObj.collectionName,
        id: this.model()!.id  
      }
      this.isLoading = true
      this.urlService.post("updateModelSamples",req).subscribe({ 
        'next':(result:any)=>{
          this.isLoading = false
          console.log( result )
          resolve( result )
        },
        'error':(reason)=>{   
          this.isLoading = false     
          alert("Error updateModelSamples:" + reason.error.error)
          reject( reason.error.error )
        }
      })         
    })  
  }

  updateAll():Promise<void>{
    return this.updateSampleData().then( ()=>{
      this.firebaseService.updateDoc(ModelObj.collectionName, this.model()!.id, { updateon:getCurrentTimeStamp() }).then( ()=>{
        console.log("node onEditJoinNode updated")
      },
      reason=>{
        alert("Error onEditJoinNode: " + reason.error)
      })
    })     
  }
  
  acceptPredicate(drag: CdkDrag, drop: CdkDropList) {
    return true //drag.data.startsWith("G") ;
  }  
    
  onDrop(e:any){
    var data  = e.item.data as SnowFlakeTable 
    console.log(data)
    var connectionId = data.connectionId
    var schemaName = data.schemaName
    var tableName =  data.tableName
    var joinNodeId = e.container.id  
    var parentNode:JoinNodeObj = this.flatJoinNodeMap.get( joinNodeId ) as JoinNodeObj

    let rightJoinNode:JoinNodeObj = {
      id: uuid.v4(),
      name: data.tableName,
      connectionId: data.connectionId,
      tableName: data.tableName,
      joinCriteria: [],
      columns: [],
      transformations: []
    }    

    if( parentNode ){
      console.log( e.container )
      let infoNode = this.flatInfoNodes.get(parentNode.id)
      if( infoNode != null){
        let path = this.getPath( infoNode )
        if( path ){
          let pathWithNodes = ""
          path.forEach( e =>{
            pathWithNodes = pathWithNodes + "/" + JoinNodeObj.className + "/" + e.id
          })
          let parentPath = ModelObj.collectionName + "/" + this.model()!.id + pathWithNodes
          let id = uuid.v4()
          var newJoin:JoinNodeObj = {
            id: id,
            name: tableName,
            connectionId: connectionId,
            tableName: tableName,
            joinCriteria: [],
            columns: [],
            transformations: []
          }
  
          let InitialTransformation:Transformation= {
            id: uuid.v4(),
            type: TransformationType.initialRead 
          }
          let joinResultTransformation:Transformation= {
            id: uuid.v4(),
            type: TransformationType.joinResult 
          }
          newJoin.transformations = [InitialTransformation,joinResultTransformation]
                        
          this.firebaseService.setDoc( parentPath + "/"  + JoinNodeObj.className, newJoin.id, newJoin  )
          .then( ()=>{
            this.updateAll()
          })
        }
      }
    }
    else{
      console.log(parentNode)
      let id = uuid.v4()
      var newJoin:JoinNodeObj = {
        id: id,
        name: tableName,
        connectionId: connectionId,
        tableName: tableName,
        joinCriteria: [],
        columns: [],
        transformations: []
      }
      
        
      let InitialTransformation:Transformation= {
        id: uuid.v4(),
        type: TransformationType.initialRead 
      }
      let joinResultTransformation:Transformation= {
        id: uuid.v4(),
        type: TransformationType.joinResult 
      }
      newJoin.transformations = [InitialTransformation,joinResultTransformation]

      this.firebaseService.setDoc( [ ModelObj.collectionName , this.model()!.id , JoinNodeObj.className].join("/"), newJoin.id, newJoin  )
      .then( ()=>{
        this.updateAll()
      })

    }
  } 

  getJoinCriteriaText(infoNode: InfoNode){
    let str=""

    let joinNode:JoinNodeObj = this.flatJoinNodeMap.get( infoNode.id ) as JoinNodeObj

    joinNode.joinCriteria.forEach( e =>{
      str += e.leftValue + e.comparator + e.rightValue + "\n"
    })
    
    return str
  }

  onEditJoinNode(parentNode:InfoNode, node:InfoNode){
    console.log(node)
    if( parentNode && node ){
      
      let leftNode = this.flatJoinNodeMap.get(parentNode.id)!
      let leftCollectionPath:string = this.getCollection(parentNode)!
      let rightNode = this.flatJoinNodeMap.get(node.id)
      let rightCollectionPath:string = this.getCollection(node)!

      let data: JoinData = {
        leftNode: leftNode,
        leftCollectionPath: leftCollectionPath,
        rightNode: rightNode!,
        rightCollectionPath: rightCollectionPath,
        
      }
      const dialogRef = this.dialog.open(JoinDialog, {
        height: '95%',
        width: '95%',
        data: data
      });
    
      dialogRef.afterClosed().subscribe(data => {
        console.log('The dialog was closed');
        if( data ){
          console.debug( data )
          this.updateAll()         
        }
      })
    }
  }
  getDataType( datatype:any):string{
    switch ( datatype ){
      case 2:return "String"
      case 8:return "TimestampType"
    }
    return datatype
  }

  format( datatype:any, val:any){
    let result = val
    if( datatype.startsWith("date") && val){
      let date = new Date(val)
      let pstOffset = 480; // this is the offset for the Pacific Standard Time timezone     
      let str = new Date(date.getTime() + (pstOffset) * 60 * 1000).toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
      let d= Date.parse(str)
      let ts = this.formatDate(new Date(d))
     
      
      if( ts.endsWith(' 00:00:00') ){
        result = ts.substring( 0, ts.length - 9 )
      }
      else{
        result = ts
      }
    }
    else if(datatype.startsWith("decimal") || datatype==0
    ){
      if( val - Math.floor(val) ){
        result = Number(val).toFixed(2)
      }
      else{
        result = Math.floor(Number(val)) + ".__"
      }      
    }  
    else{
      result = val
    }            

    return result
  }
  isNumber(datatype:any){
    
    if(datatype.startsWith("decimal") || 
       datatype.startsWith("bigint") ){
      return true
    }
    return false
  }
  formatDate(d:Date): string {
    // Create an array with the current month, day and time
    let date: Array<String> = [ String(d.getMonth() + 1).padStart(2 ,"0"), String(d.getDate()).padStart(2 ,"0"), String(d.getFullYear()) ];
    // Create an array with the current hour, minute and second
    let time: Array<String> = [ String(d.getHours()).padStart(2 ,"0"), String(d.getMinutes()).padStart(2 ,"0"), String(d.getSeconds()).padStart(2 ,"0")];
    // Return the formatted string
    return date.join("/") + " "  + time.join(":")
  }


  

  onJoinNodeSelected(node:InfoNode){

    //if( !this.selectedJoinNodeObj() || this.selectedJoinNodeObj()!.id != node.id ){
      let joinNodeObj = this.flatJoinNodeMap.get( node.id )
      if( !this.selectedJoinNodeObj() || this.selectedJoinNodeObj()!=joinNodeObj ){
        this.selectedJoinNodeObj.set(joinNodeObj!)
        let lastIdx = joinNodeObj!.transformations.length - 1
        this.onTranformation(node, lastIdx)    
      }
    //}
  }

  getTransformationText(t:Transformation ):string{
    let str = ""
    if( t.type == TransformationType.initialRead ){
      let tf = t as FilterTransformation
      str = "Initial Read"
    }  
    if( t.type == TransformationType.joinResult ){
      let tf = t as FilterTransformation
      str = "Join Result"
    }       
    if( t.type == TransformationType.filter ){
      let tf = t as FilterTransformation
      str = "Filter:" + tf.leftValue + " " + tf.comparator + " " + tf.rightValue
    }
    else if( t.type == TransformationType.groupBy ){
      let g = t as GroupByTransformation
      str += "GroupBy:" + g.groupByColumns + " " 
      for(let i =0; i<g.functions.length; i++){
        str += g.functions[i].functionOption + " " + g.functions[i].columnName
      }
    }
    else if( t.type == TransformationType.selectColumns){
      let sc = t as SelectColumnsTransformation
      str = "Select "
      sc.columnsNames.forEach( e =>{
        if( str ){
          str +=','
        }
        str += e
      })
    }
    else if( t.type == TransformationType.renameColumn){
      let rt = t as RenameColumnTransformation
      str = "rename:" + rt.columnName + "-" + rt.newColumnName
    }
    else if( t.type == TransformationType.newColumn){
      let nct = t as NewColumnTransformation
      str = nct.columnName + "=" + nct.expression
    }    
    else if( t.type == TransformationType.localfilter){
      let lft = t as LocalFilterTransformation
      if( lft.listValues ){
        lft.listValues.forEach(e => {
          if(str){
            str += ";"
          }
          str += e.columnName + " in (" + e.filterValues + ")"
        });
      }
    }     
    return str
  }

  onAddFilter(){
    this.filter(ActionOption.add)
  }

  filter(action:ActionOption){
    if( this.selectedJoinNodeObj() ){
      let joinNodeObj:JoinNodeObj = this.selectedJoinNodeObj()!
      let infoNode:InfoNode = this.flatInfoNodes.get( joinNodeObj.id )!
      let collectionPath:string = this.getCollection(infoNode)
      let idx = this.selectedTransactionIdx()!
      
      
      
     let data: JoinNodeActionData = {
        node: joinNodeObj,
        collectionPath: collectionPath,
        currentTransactionIndex: idx,
        action: action
      }
      const dialogRef = this.dialog.open(FilterDialog, {
        height: '95%',
        width: '95%',
        data: data
      });
    
      dialogRef.afterClosed().subscribe(data => {
        console.log('The dialog was closed');
        if( data ){
          console.debug( data )
          this.updateAll()
        }
      })
    }
  }
  onTransactionRemove(i:number){
      let joinNodeObj = this.selectedJoinNodeObj()!
      joinNodeObj.transformations.splice( i, 1)

      let nodeUpdate:JoinNode = {
        transformations:[ ...joinNodeObj.transformations ]
      }      

      let infoNode = this.flatInfoNodes.get( joinNodeObj.id )!
      let collectionPath = this.getCollection( infoNode )
      

      this.firebaseService.updateDoc( collectionPath , infoNode.id, nodeUpdate).then( ()=>{
        console.log("save the join")
        this.updateAll()
      })

  }
  onAddGroupBy(){
    this.groupBy(ActionOption.add)
  }
  groupBy(action:ActionOption){
    if( this.selectedJoinNodeObj() ){
      let n = this.selectedJoinNodeObj()!
      let collection:string = this.getCollection(n)!
      
      let node = this.flatJoinNodeMap.get(n.id)!

      let data: JoinNodeActionData = {
        node: node,
        collectionPath: collection,
        currentTransactionIndex: this.selectedTransactionIdx()!,
        action: action
      }
      const dialogRef = this.dialog.open(GroupByDialog, {
        height: '95%',
        width: '95%',
        data: data
      });
    
      dialogRef.afterClosed().subscribe(data => {
        console.log('The dialog was closed');
        if( data ){
          console.debug( data )
          this.updateAll()
        }
      })
    }
  }

  

  addSelectedColumns(){
    if( this.selectedJoinNodeObj() ){
      let infoNode:InfoNode = this.selectedJoinNodeObj()!

      let joinNode:JoinNodeObj = this.flatJoinNodeMap.get(infoNode.id)!

      let columnsNames:Array<string> = Array<string>()

      for(let i=0; i<this.selectedColumns.length; i++){
        if(this.selectedColumns[i].controls["selected"].value ){
          let name = this.result()!.columns[i]['columnName']
          columnsNames.push( name )
        } 
      }

      let selectedColumnsTransformation:SelectColumnsTransformation = {
        type: TransformationType.selectColumns,
        id: uuid.v4(),
        columnsNames: columnsNames
      }
      
      let nodeUpdate:JoinNode = {
        transformations:[ ...joinNode.transformations , selectedColumnsTransformation]
      }

      let collection = this.getCollection( infoNode )
      

      this.firebaseService.updateDoc( collection, infoNode.id, nodeUpdate).then( ()=>{
        console.log("save the join")
        this.updateAll()
      })

    }
  }
  
  padNumberWithZeros(num: number, totalLength: number): string {
    return num.toString().padStart(totalLength, '0');
  }

  onUpdateSampleData(){
    this.updateAll(  )
  }

  onRenameColumn(i:number){
    let columnName:string = this.result()!.columns[i].columnName
    let newColumnName:string = this.selectedColumns[i].controls["rename"].value!
    let localfilter:string = this.selectedColumns[i].controls["localfilter"].value!
    let node:JoinNodeObj = this.selectedJoinNodeObj()!
    let infoNode:InfoNode =  this.flatInfoNodes.get(node.id)!
    
    let renameColumnTransformation:RenameColumnTransformation = {
      type: TransformationType.renameColumn,
      id: uuid.v4(),
      columnName: columnName,
      newColumnName: newColumnName    }

    let transformationUpdate: JoinNode = {
      transformations: [...node!.transformations!, renameColumnTransformation]
    }
    let collection = this.getCollection( infoNode )
    
    this.firebaseService.updateDoc( collection, node.id, transformationUpdate).then( ()=>{
      this.updateAll()
    })
  }

  onTranformation(node:InfoNode, i:number){

    //if( this.selectedTransactionIdx() != i ){

      let joinNodeObj = this.flatJoinNodeMap.get( node.id )!
      if( !this.selectedJoinNodeObj() || this.selectedJoinNodeObj()!=joinNodeObj ){ 
        this.selectedJoinNodeObj.set( joinNodeObj! ) 
      }  

      this.selectedTransactionIdx.set( i )
      let collection = this.getCollection( joinNodeObj )

      let transformationId = joinNodeObj.transformations[i].id
      this.firebaseService.getdoc(collection + "/" + joinNodeObj.id + "/sampledata", transformationId).then( doc =>{
        if( doc.exists() ){
          let result = doc.data() as SqlResultGeneric
          this.selectedColumns.length = 0
          for( let c =0; c<result.columns.length; c++){
            let t = this.fb.group({
              id:[result.columns[c].columnName],
              selected:[false],
              rename:[result.columns[c].columnName],
              isFiltered:[""],
              filterValues:[""]
            })

            if( joinNodeObj.transformations[i].type == TransformationType.localfilter ){
              let tft:LocalFilterTransformation = joinNodeObj.transformations[i] as LocalFilterTransformation
              if( tft.listValues ){
                let idx = tft.listValues.findIndex( e =>
                  e.columnName == result.columns[c].columnName
                ) 
                if( idx >= 0){
                  t.controls.isFiltered.setValue( 'true' )
                  t.controls.filterValues.setValue( tft.listValues[idx].filterValues )
                }
              }
              
            }
            
            this.selectedColumns.push(t)
          }
          this.result.set(result)
          this.selectColumns()    
        }
        else{
          this.result.set(undefined)
        }
      })
    //}  
  }

  onNewColumn(){
    this.newColumn(ActionOption.add)
  }

  newColumn(action:ActionOption){
    if( this.selectedJoinNodeObj() ){
      let joinNodeObj:JoinNodeObj = this.selectedJoinNodeObj()!
      let infoNode:InfoNode = this.flatInfoNodes.get( joinNodeObj.id )!
      let collection:string = this.getCollection(infoNode)
      
     let data: JoinNodeActionData = {
        node: joinNodeObj,
        collectionPath: collection,
        currentTransactionIndex: this.selectedTransactionIdx()!,
        action: action
      }
      const dialogRef = this.dialog.open(NewColumnDialog, {
        height: '95%',
        width: '95%',
        data: data
      });
    
      dialogRef.afterClosed().subscribe(data => {
        console.log('The dialog was closed');
        if( data ){
          console.debug( data )
          this.updateAll()
        }
      })
    }
  }

  onSelectColumn(column:SqlColumnGeneric){
    let idx:number = this.selectedTransactionIdx()!
    let nodeObj:JoinNodeObj = this.selectedJoinNodeObj()!
    if( (idx + 1) < nodeObj.transformations.length ){
      let nextTransaction = nodeObj.transformations[idx+1]
      if( nextTransaction.type == TransformationType.selectColumns ){
        let selectionTransaction:SelectColumnsTransformation = nextTransaction as  SelectColumnsTransformation

        let i:number = this.selectedColumns.findIndex( e => 
          e.controls["id"].value == column.columnName
        )
        if( this.selectedColumns[i].controls["selected"].value  ){
          selectionTransaction.columnsNames.push( column.columnName )
          
        }
        else{
          selectionTransaction.columnsNames.splice( i, 1)
        }
        let joinNodeUpdate:JoinNode = {
          transformations:[ ...nodeObj.transformations ]
        }
        

        let infoNode:InfoNode = this.flatInfoNodes.get( nodeObj.id )!
        let collection:string = this.getCollection(infoNode)
                
   
        this.firebaseService.updateDoc( collection, nodeObj.id, joinNodeUpdate).then( ()=>{
          this.updateAll()
        },
        reason =>{
          alert("Error: adding new column :" + reason.error)
        })
  
        
      }
    }
  }

  selectColumns(){
    let nodeObj:JoinNodeObj = this.selectedJoinNodeObj()!
    let idx:number = this.selectedTransactionIdx()!
    
    if( (idx + 1) < nodeObj.transformations.length ){
      let nextTransaction = nodeObj.transformations[idx+1]
      
      if( nextTransaction.type == TransformationType.selectColumns ){
        let selectionTransaction:SelectColumnsTransformation = nextTransaction as  SelectColumnsTransformation
        selectionTransaction.columnsNames.forEach( st =>{
          let i = this.selectedColumns.findIndex( e => 
            st == e.controls["id"].value 
          )
          if( i >= 0){
            this.selectedColumns[i].controls["selected"].setValue(true)
          }
        })
      }
    }
  }

  onEditTransformation(i:number){
    
    let node:JoinNodeObj = this.selectedJoinNodeObj()!    
    switch( node.transformations[i].type ){
      case TransformationType.newColumn:
        this.newColumn(ActionOption.edit)
        break
      case TransformationType.filter:
        this.filter(ActionOption.edit)
        break;
      case TransformationType.groupBy:
        this.groupBy(ActionOption.edit)
        break;  
      
    }

  }

  onDuplicate(){
    let req = {
      id:this.id,
      overwrites:{
        label:this.model().label + "_copy"
      }
    }
    this.isLoading = true
    this.urlService.post("ModelDuplicate",req).subscribe({ 
      'next':(result:any)=>{
        this.isLoading = false
        console.log( result )        
        this.router.navigate(["/model/" + result["id"]])

      },
      'error':(reason)=>{   
        this.isLoading = false     
        alert("Error ModelDuplicate:" + reason.error.error)
      }
    }) 
  }

  onLocalFilterColumn(i:number){
    let columnName = this.result()!.columns[i]['columnName']
    let idx = this.selectedTransactionIdx()!
    let node = this.selectedJoinNodeObj()!

    let transformationUpdate: JoinNode = {
      transformations: [...node!.transformations]
    }       

    //if the current transformation is a local filter add it to it
    if( node.transformations[idx].type == TransformationType.localfilter){
      let currentTransformation = transformationUpdate.transformations![idx] as LocalFilterTransformation
       
      let filterValues = this.selectedColumns[i].controls["filterValues"].value
      
      //if there is previous filter for this column update it
      let colIdx = currentTransformation.listValues!.findIndex( e => e.columnName == columnName )
      if( colIdx>=0 ){ //update the current filter
        currentTransformation.listValues![colIdx].filterValues = filterValues
      }
      else{
        //there was not an existing filter add it to the list
        currentTransformation.listValues?.push({"columnName":columnName, "filterValues":filterValues})
      }
    }
    else{
      let newTransformation:LocalFilterTransformation = {
        type: TransformationType.localfilter,
        id: uuidv4(),
        listValues: []
      }
      let filterValues = this.selectedColumns[i].controls["filterValues"].value

      newTransformation.listValues!.push({"columnName":columnName, "filterValues":filterValues})

      transformationUpdate.transformations!.push( newTransformation )
    }

    let infoNode:InfoNode = this.flatInfoNodes.get( node.id )!
    let collection = this.getCollection( infoNode )
    
    this.firebaseService.updateDoc( collection, node.id, transformationUpdate).then( ()=>{
      this.updateAll()
    })    
    
  }

}
