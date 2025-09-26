import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JoinCondition, JoinData, JoinNode, ModelObj,  SnowFlakeTable,    InfoNode, JoinNodeObj, Model, getCurrentTimeStamp, SqlResultInFirebase, TransformationContainer } from 'app/datatypes/datatypes.module';
import { FirebaseService } from 'app/firebase.service';
import { StringUtilService } from 'app/string-util.service';
import { UrlService } from 'app/url.service';
import { doc, DocumentSnapshot, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../../environments/environment'
import * as uuid from 'uuid';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTree, MatTreeModule} from '@angular/material/tree';
import { JoinDataSource, TreeNode } from './join-datasource';
import { MatMenuModule } from '@angular/material/menu';
import { CdkDrag, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { DaoService } from 'app/dao.service';
import { JoinDialog } from 'app/join-dialog/join-dlg';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule} from '@angular/material/expansion';
import { MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { AuthService } from 'app/auth.service';
import { AngularSplitModule, SplitAreaComponent, SplitComponent } from 'angular-split';
import { TablesTreeComponent } from 'app/tables-tree/tables-tree.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import {MatTabsModule} from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';

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
        MatListModule
    ],
    providers: [JoinDataSource],
    templateUrl: './model-edit.component.html',
    styleUrl: './model-edit.component.css'
})
export class ModelEditComponent implements OnInit, AfterViewInit{
  @ViewChild("tree") tree!: MatTree<TreeNode> ; 

  model = signal<ModelObj|null>(null)
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

  isLoading = false

  

  infoNodes:InfoNode[] = []
  flatJoinNodeMap = new Map<string,JoinNodeObj>()
  flatInfoNodes = new Map<string, InfoNode>()  

  selectedJoinNodePath = signal("")
  selectedJoinNode = signal<JoinNode|null>(null)
  result = signal<any | null>(null)
  
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
                    this.selectedJoinNode.set(null)
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
  getPath( id:string, parentInfoNodes:InfoNode[] ):InfoNode[]|null{
    for(let i = 0; i<parentInfoNodes.length; i++){
      if( parentInfoNodes[i].id == id ){
        return [ parentInfoNodes[i] ]
      }
      else{
        if( parentInfoNodes[i].children ){
          let infonode = parentInfoNodes[i]
          if( infonode.children ){
            for( let j=0 ; j<infonode.children.length; j++ ){
              let result = this.getPath( id, infonode.children)
              if( result ){
                return [parentInfoNodes[i], ... result]
              }
            }
          }
        }
      }
    }
    return null
  }

getCollectionPath( id:string ){
  var path = this.getPath( id , this.infoNodes)
  var model = this.model()!
  if( path ){
    var pathWithNodes = ""
    for(let i =0; i< path.length; i++){
      pathWithNodes = pathWithNodes + "/" + JoinNodeObj.className + "/" + path[i].id
    }
    var fullPath = ModelObj.collectionName + "/" + model.id + pathWithNodes
    return fullPath
  }
  return null
}
  
  
  loadRawModel():Promise<void>{
    return new Promise((resolve, reject) =>{ 
      this.infoNodes.length = 0
      this.flatJoinNodeMap.clear()
      this.flatInfoNodes.clear()

      let model:ModelObj = this.model()!
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


  /*
  Edit(node:JoinNode | null){
    if( this.model  && node ){
      console.log(node)
      this.isAdding = true

      this.newJoinFG.controls.table.setValue(node.name)
      this.newInfoNodeAdding = node
    } 
    this.dataSource.setData(this.model!.data)
  }
*
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
      if( name ){
        node.name = name
      }
      
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

*/
  onDeleteNode(parentNodeInfo:JoinNodeObj, nodeInfo:JoinNodeObj){

    if( parentNodeInfo ){
      let path = this.getPath(parentNodeInfo.id!,this.infoNodes)
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

  getSampleData(tableName:string, connectionId:string):Promise<any>{
    return new Promise(( resolve, reject ) => {
      
      let sql = "select * from " + tableName + " limit 10"

      var req = {
        connectionId:connectionId,
        sql:sql
      }
      this.isLoading = true
      this.urlService.post("executeSql",req).subscribe({ 
        'next':(result:any)=>{
          this.isLoading = false
          console.log( result )
          resolve( result )
        },
        'error':(reason)=>{   
          this.isLoading = false     
          reject( reason.error.error )
        }
      })         
    })  
  }

  
  acceptPredicate(drag: CdkDrag, drop: CdkDropList) {
    return true //drag.data.startsWith("G") ;
  }  
  /*
  AddTable(
    connectionId:string,
    schemaName:string,
    tableName:string,
    parentNode:JoinNode | null){
    if( this.model ){
      console.log(parentNode)
      let id = uuid.v4()
      var newJoin:JoinNodeObj = {
        id: id,
        name: tableName,
        connectionId: connectionId,
        tableName: tableName,
        joinCriteria: [],
        columns: [],
        sampleData: null,
        transformations: []
      }
      
      if( !parentNode ){
        this.model.rootJoinNode = newJoin  
      }
      else{
      }
      this.save()   
    } 
  }
*/  
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
      sampleData: null,
      transformations: []
    }    

    if( parentNode ){
      console.log( e.container )
      let infoNode = this.flatInfoNodes.get(parentNode.id)
      if( infoNode != null){
        let path = this.getPath( infoNode.id , this.infoNodes)
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
            sampleData: null,
            transformations: []
          }

          this.getSampleData( tableName, connectionId).then( result =>{
            
            let sqlResult:SqlResultInFirebase = {
              metadata:result.metadata,
              resultSet:Array<{ [key: string]: any }>()
            }
            for(let i=0; i<result.resultSet.length; i++){ 
              let row = result.resultSet[i]             
              let data:{[key: string]:any}={}
              for( let c=0; c<row.length; c++){
                data["k_" + c] = row[c]
              }
              sqlResult.resultSet.push(data)
            }    

            let transformationContainer:TransformationContainer = {
              id: uuid.v4(),
              type: 'rawRead',
              label: 'initial',
              transformation: null,
              sampleData:sqlResult
            }
            newJoin.transformations = [transformationContainer]
                         
            this.firebaseService.setDoc( parentPath + "/"  + JoinNodeObj.className, newJoin.id, newJoin  )
            .then( () =>{
              this.firebaseService.updateDoc(ModelObj.collectionName, this.model()!.id, { updateon:getCurrentTimeStamp() })
            })
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
        sampleData: null,
        transformations: []
      }

      this.getSampleData( tableName, connectionId).then( result =>{

        let sqlResult:SqlResultInFirebase = {
          metadata:result.metadata,
          resultSet:Array<{ [key: string]: any }>()
        }
        for(let i=0; i<result.resultSet.length; i++){ 
          let row = result.resultSet[i]             
          let data:{[key: string]:any}={}
          for( let c=0; c<row.length; c++){
            data["k_" + c] = row[c]
          }
          sqlResult.resultSet.push(data)
        }        
            
        let transformationContainer:TransformationContainer = {
          id: uuid.v4(),
          type: 'rawRead',
          label: 'initial',
          transformation: null,
          sampleData:sqlResult
        }
        newJoin.transformations = [transformationContainer]

        this.firebaseService.setDoc( [ ModelObj.collectionName , this.model()!.id , JoinNodeObj.className].join("/"), newJoin.id, newJoin  )
        .then( () =>{
          let model:Model = {
            updateon:getCurrentTimeStamp()
          }
          this.firebaseService.updateDoc(ModelObj.collectionName, this.model()!.id, model)
        },
        reason =>{
          alert("Error saving results:" + reason.error)
        })
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
      let collectionPath:string = this.getCollectionPath(node.id)!
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
        if( data != undefined ){
          console.debug( data )
          this.firebaseService.updateDoc(ModelObj.collectionName, this.model()!.id, { updateon:getCurrentTimeStamp() })
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
    if( datatype == 8 && val){
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
    if( 3 == datatype && val){
        result = val
    } 
    if( val == 0 || datatype==0
    ){
      if( val - Math.floor(val) ){
        result = Number(val).toFixed(2)
      }
      else{
        result = Math.floor(Number(val)) + ".__"
      }      
    }              

    return result
  }
  isNumber(datatype:any){
    
    if(datatype == 3){
      return true
    }
    return false
  }
  formatDate(d:Date): string {
    // Create a date object with the current time
 
    // Create an array with the current month, day and time
    let date: Array<String> = [ String(d.getMonth() + 1).padStart(2 ,"0"), String(d.getDate()).padStart(2 ,"0"), String(d.getFullYear()) ];
    // Create an array with the current hour, minute and second
    let time: Array<String> = [ String(d.getHours()).padStart(2 ,"0"), String(d.getMinutes()).padStart(2 ,"0"), String(d.getSeconds()).padStart(2 ,"0")];
    // Return the formatted string
    return date.join("/") + " "  + time.join(":")
  }

  onJoinNodeSelected(node:InfoNode){
    
    let fullPath = this.getCollectionPath( node.id )
    if( fullPath ){
      this.selectedJoinNodePath.set(fullPath)
      let joinNodeObj = this.flatJoinNodeMap.get( node.id )
      if( joinNodeObj ){
        this.selectedJoinNode.set(joinNodeObj)
        let result = joinNodeObj.transformations[0].sampleData
        this.result.set(result)
      }
    }
    
  }
}
