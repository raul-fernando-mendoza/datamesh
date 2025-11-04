import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, signal, ViewChild } from '@angular/core';
import {  FormBuilder,  FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JoinData, JoinNode, ModelObj,  SnowFlakeTable,    InfoNode, JoinNodeObj,  getCurrentTimeStamp, FilterTransformation, Transformation, JoinNodeActionData, ActionOption, TransformationType, GroupByTransformation, SelectColumnsTransformation, SqlResultGeneric, RenameColumnTransformation } from 'app/datatypes/datatypes.module';
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
        MatCheckboxModule
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
  groupId:string|null = 'default'

  unsubscribe:Unsubscribe | null = null

  FG = this.fb.group({
    label:['',[Validators.required]],
    description:['']
  })  

  newJoinFG = this.fb.group({
    table:['',[Validators.required]]
  })  


  childrenAccessor = (node: TreeNode) => node.childrenNodes ?? [];

  dataSource = new JoinDataSource();
  
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

  

  

  infoNodes:InfoNode[] = []
  flatJoinNodeMap = new Map<string,JoinNodeObj>()
  flatInfoNodes = new Map<string, InfoNode>()  

  selectedInfoNodePath = signal("")
  selectedJoinNodeObj = signal<JoinNodeObj|null>(null)
  result = signal<SqlResultGeneric | undefined>(undefined)

  selectedColumns:Array<FormGroup> = Array<FormGroup>()
  
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
       else if("groupId" in res){
         this.groupId = res["groupId"]
       }
     }) 
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

  getCollectionPath( infoNode:InfoNode ){
    var path = this.getPath( infoNode )

    
    var model = this.model()!
    if( path ){
      var pathWithNodes = ""
      for(let i =0; i< path.length; i++){
        pathWithNodes = pathWithNodes + "/" + JoinNodeObj.className + "/" + path[i].id
      }
      var fullPath = ModelObj.collectionName + "/" + model.id + pathWithNodes
      return fullPath
    }
    return ModelObj.collectionName 
  }
  
  
  loadRawModel():Promise<void>{
    return new Promise((resolve, reject) =>{ 
      this.infoNodes.length = 0
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

  updateAll(infoNode:InfoNode):Promise<void>{
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
      sampleData: [],
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
            sampleData: [],
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
            this.updateAll( newJoin )
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
        sampleData: [],
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
        this.updateAll(newJoin)
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
      let collectionPath:string = this.getCollectionPath(node)!
      let leftNode = this.flatJoinNodeMap.get(parentNode.id)!
      let rightNode = this.flatJoinNodeMap.get(node.id)

      let data: JoinData = {
        leftNode: leftNode,
        rightNode: rightNode!,
        rightCollectionPath:collectionPath
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
          this.updateAll(node)         
        }
      })
    }
  }
  /*
  onPlay(node:JoinNode | null){
    if( this.model  && node ){      
      console.log(this.model()!.id)
      this.isLoading= true
      this.dao.getModelResult(this.model()!.id).then( result =>{
        this.isLoading =false
        console.log( result )
        this.result = result
      },
      error=>{
        this.isLoading=false
        alert("onPlay Error:" + error)
        this.result = null
      })
    } 
  }    
  */
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
    
    if(datatype.startsWith("decimal") ){
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
    
    let fullPath = this.getCollectionPath( node )
    if( fullPath ){
      this.selectedInfoNodePath.set(fullPath)
      let joinNodeObj = this.flatJoinNodeMap.get( node.id )
      if( joinNodeObj ){
        this.selectedJoinNodeObj.set(joinNodeObj)
        let lastIdx = joinNodeObj.transformations.length - 1
        //let result:SqlResultGeneric|undefined = joinNodeObj.transformations[lastIdx].sampleData
        let result:SqlResultGeneric = joinNodeObj.sampleData[0]

        //no create the form before loading the sample
       
        if( result ){

          this.selectedColumns.length = 0
          for( let i =0; i<result.columns.length; i++){
            let t = this.fb.group({
              selected:[false],
              rename:[result.columns[i].columnName]
            })

            this.selectedColumns.push(t)
          }
        }
        
        this.result.set(result)
      }
    }
    
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
      str = tf.leftValue + " " + tf.comparator + " " + tf.rightValue
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
      str = ""
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
    return str
  }

  addFilter(){
    if( this.selectedJoinNodeObj() ){
      let joinNodeObj:JoinNodeObj = this.selectedJoinNodeObj()!
      let infoNode = this.flatInfoNodes.get( joinNodeObj.id )!
      let collectionPath:string = this.getCollectionPath(infoNode)
      let parentCollectionName = collectionPath.split("/").slice(0,-1).join("/")
      
      
     let data: JoinNodeActionData = {
        node: joinNodeObj,
        collectionPath: parentCollectionName,
        currentTransactionIndex: joinNodeObj.transformations.length-1,
        action: ActionOption.add
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
          this.updateAll(infoNode)
        }
      })
    }
  }
  removeFilter(i:number){
      let joinNodeObj = this.selectedJoinNodeObj()!
      joinNodeObj.transformations.splice( i, 1)

      let nodeUpdate:JoinNode = {
        transformations:[ ...joinNodeObj.transformations ]
      }      

      let infoNode = this.flatInfoNodes.get( joinNodeObj.id )!
      let collectionName = this.getCollectionPath( infoNode )
      let parentCollectionName = collectionName.split("/").slice(0,-1).join("/")

      this.firebaseService.updateDoc( parentCollectionName , infoNode.id, nodeUpdate).then( ()=>{
        console.log("save the join")
        this.updateAll(infoNode)
      })

  }
  addGroupBy(){
    if( this.selectedJoinNodeObj() ){
      let n = this.selectedJoinNodeObj()!
      let collectionPath:string = this.getCollectionPath(n)!
      let parentCollection = collectionPath.split("/").slice(0,-1).join("/")
      let node = this.flatJoinNodeMap.get(n.id)!

      let data: JoinNodeActionData = {
        node: node,
        collectionPath: parentCollection,
        currentTransactionIndex: node.transformations.length-1,
        action: ActionOption.add
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
          this.updateAll( n )
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

      let collectionName = this.getCollectionPath( infoNode )
      let parentCollection = collectionName.split("/").slice(0,-1).join("/")

      this.firebaseService.updateDoc( parentCollection, infoNode.id, nodeUpdate).then( ()=>{
        console.log("save the join")
        this.updateAll(infoNode)
      })

    }
  }
  
  padNumberWithZeros(num: number, totalLength: number): string {
    return num.toString().padStart(totalLength, '0');
  }

  onUpdateSampleData(){
    let joinNodeObj:JoinNodeObj= this.selectedJoinNodeObj()!
    let infoNode:InfoNode=this.flatInfoNodes.get( joinNodeObj.id )!

    this.updateAll( infoNode )
  }

  onRenameColumn(i:number){
    let columnName:string = this.result()!.columns[i].columnName
    let newColumnName:string = this.selectedColumns[i].controls["rename"].value!
    let node:JoinNodeObj = this.selectedJoinNodeObj()!
    let infoNode:InfoNode =  this.flatInfoNodes.get(node.id)!
    
    let renameColumnTransformation:RenameColumnTransformation = {
      type: TransformationType.renameColumn,
      id: uuid.v4(),
      columnName: columnName,
      newColumnName: newColumnName
    }

    let transformationUpdate: JoinNode = {
      transformations: [...node!.transformations!, renameColumnTransformation]
    }
    let collection = this.getCollectionPath( infoNode )
    let parentCollection = collection.split("/").slice(0,-1).join("/")
    this.firebaseService.updateDoc( parentCollection, node.id, transformationUpdate).then( ()=>{
      this.updateAll(infoNode)
    })
  }

  onTranformation(i:number){
    let node:JoinNodeObj = this.selectedJoinNodeObj()!


    let result = node.sampleData[i]
    if( result ){

      this.selectedColumns.length = 0
      for( let i =0; i<result.columns.length; i++){
        let t = this.fb.group({
          selected:[false],
          rename:[result.columns[i].columnName]
        })

        this.selectedColumns.push(t)
      }
    }    
    this.result.set(result)    
  }

}
