import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { db } from '../../environments/environment'

import { collection, doc, deleteDoc , getDoc,  onSnapshot, getDocs, query, setDoc, updateDoc} from "firebase/firestore"; 
import { MatDialog } from '@angular/material/dialog';
import { Comparison, PortListResponse, Dataset, Port, ComparisonRow } from '../datatypes/datatypes.module';
import { ActivatedRoute, Router } from '@angular/router';
import * as uuid from 'uuid';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import {NestedTreeControl} from '@angular/cdk/tree';
import { TreeNestedDataSource, TreeNode, TREENODE_EXAMPLE_DATA } from '../tree-nested-data-source';
import { MatTree } from '@angular/material/tree';
import { UrlService } from '../url.service';
import { StringUtilService } from '../string-util.service';
import { Portal } from '@angular/cdk/portal';
import { FirebaseService } from '../firebase.service';


  //dataset:Dataset

@Component({
  selector: 'app-comparison-edit',
  templateUrl: './comparison-edit.component.html',
  styleUrls: ['./comparison-edit.component.css']
})
export class ComparisonEditComponent implements OnInit, AfterViewInit, OnInit, OnDestroy{

  @ViewChild(MatPaginator) paginator!: MatPaginator ;
  @ViewChild(MatSort) sort!: MatSort ;
  @ViewChild(MatTable) table!: MatTable<ComparisonRow> ;
  @ViewChild(MatTree) tree!: MatTree<TreeNode> ; 

  treeControl = new NestedTreeControl<TreeNode>(node => 
    node.children
    );
  dataSource = new TreeNestedDataSource();

  hasChild = (_: number, node: TreeNode) => {
    var b:boolean = !!node.children && node.children.length > 0
    return b
  };

  id:string | null = ""

  datasets:Dataset[] = []

  comparison!:Comparison
  groupId:string = ""

  FG = this.fb.group({
    id:[''],
    label:[''],
    filter:['']
  })

  comparisonList:TreeNode[] = []
  //nodeTreeDataSource!:TreeNestedDataSource 
  
  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['idx','source','name','type','alias','selected'];

  submmiting=false

  unsubscribe:any
  unsubscribes = new Map()

  portsDataSource:ComparisonRow[] = []

  portdatatypes:string[] = [
    "int32",
    "object",
    "float64",
    "LongTypep()",
    "BooleanType()",
    "LongType()",
    "StringType()"
  ]

  constructor(
      public dialog: MatDialog
     ,private router:Router
     ,private activatedRoute: ActivatedRoute
     ,private urlService:UrlService
     ,private stringUtilService:StringUtilService
     ,private fb:FormBuilder
     ,private firebaseService:FirebaseService) {
      this.activatedRoute.params.subscribe(res => {
        if("id" in res){
          this.id = res["id"]
          if( this.unsubscribe ){
            this.unsubscribe()
            this.unsubscribe=null
          }  
          this.update()
        }  
        else if("groupId" in res){
          this.groupId = res["groupId"]
        }
      })  
    this.dataSource.data = TREENODE_EXAMPLE_DATA;   
  }

  ngOnDestroy(): void {
    if( this.unsubscribe ){
      this.unsubscribe()
    }
    
    this.unsubscribes.forEach( item =>{
      item()
    })
  }
  ngOnInit(): void {
    this.loadDataSets()
  }
  ngAfterViewInit(): void {
    this.update()
  }
  
  onPropertyChange(event:any){
    var propertyName:string = event.srcElement.attributes.formControlname.value
    var value:any = event.target.value      
    var values:any = {}
    values[propertyName]=value 
    if( this.id ){
      updateDoc( doc( db, "Comparison", this.id), values ).then( ()=>{
        console.log("update property")
      })
    }
  }
  onCheckboxChange(event:any){
    var propertyName = event.source.name
    var value:boolean = event.checked     
    var values:any = {}
    values[propertyName]=value   
    if( this.id ){
      updateDoc( doc( db, "Comparison", this.id), values ).then( ()=>{
        console.log("update property")
      })
    }
  }  
  onSelectChange(event:MatSelectChange){
    console.log("onSelectChange")
    var propertyName:any = event.source.ngControl.name
    var value = event.source.ngControl.value  
    var values:any = {}
    if( value == undefined ){
      values[propertyName]=null     
    }
    else values[propertyName]=value   
    if( this.id ){
      updateDoc( doc( db, "Comparison", this.id), values ).then( ()=>{
        console.log("update property")
      },
      reason=>{
        alert("ERROR:" + reason)
      })
    }
  }  

  onPortChange($event:any, row:ComparisonRow, property:string){
    
/*     
    if( row.side == "left"){
      var port = this.comparison.leftPorts.find( element => {
        return element.name == row.name;
      })  
    }
    else{
       var port = this.comparison.rightPorts.find( element => {
        return element.name == row.name;
      })   
    } 
    
    if( port ){
      switch (property){
        case "datatype":
          port.datatype = $event.value 
          break
        case "alias":
          port.alias = $event.srcElement.value
          break 
        case "selected":
          port.selected = $event.checked
          break 
      }
    } 

    var values:any = {}  
    if( port ){
      if( port.side == 'left'){
        values["leftPorts"]=this.comparison.leftPorts
      }
      else{
        values["rightPorts"]=this.comparison.rightPorts
      }


      if( this.id ){
        updateDoc( doc( db, "Comparison", this.id), values ).then( ()=>{
          console.log("update port values")
        },
        reason=>{
          alert("ERROR:" + reason)
        })
        .then( ()=>{
          this.updateJoinColumns()   
        })
      }
         
    }    
    */  
  }
 
  update(){
    
    if( this.id ){
      this.unsubscribe = onSnapshot( doc( db,"Comparison", this.id ),
          (docRef) =>{
                if( docRef.exists()){
                  this.comparison=docRef.data() as Comparison

                  this.FG.controls.label.setValue( this.comparison.label!)
                }
/*
                this.portsDataSource.length = 0
                //load the ports to portdatasource

                
                this.comparison.leftPorts.map(port=>{
                  this.portsDataSource.push( port )
                })
                this.comparison.rightPorts.map(port=>{
                  this.portsDataSource.push( port )
                })
                
                
                //now Add the tree for childs
                var node:TreeNode = {
                  obj:this.comparison,
                  opened:false,
                  children:null,
                  nodeClass:"Comparison",
                  isLeaf:true,
                  parentNode:null,
                  isLoading:false
                }
                this.comparisonList.length=0
                this.comparisonList.push( node )


                let parentPath = "Comparison" + "/" + this.comparison.id
                this.loadChildren( parentPath , node ).then( () =>{
                  this.dataSource.data = this.comparisonList
                })
  */              
          },
          (reason:any) =>{
              alert("ERROR update comparison list:" + reason)
          }  
      )
    }
    
    
  }  

  loadChildren( parentPath:string, parentNode:TreeNode ):Promise<void>{
    return new Promise<void>((resolve, reject)=>{
      /*
      let unsubscribe = onSnapshot(collection(db,parentPath + "/Child" ),
      (set) =>{
        if( parentNode.children != null){
          parentNode.children.length = 0
        }     
        let transactions =  set.docs.map( doc =>{
          var child=doc.data() as Child
          var childNode:TreeNode = {
            obj:child,
            opened:false,
            children:null,
            nodeClass:"Child",
            isLeaf:true,
            parentNode:parentNode,
            isLoading:false
          }          
          if( parentNode.children == null){
            parentNode.children = []
          }          
          parentNode.children!.push( childNode )
          let childrenPath:string = parentPath + "/Child/" + child.id
          return this.loadChildren( childrenPath, childNode )
        })
        Promise.all( transactions ).then( ()=>{
          var id = parentPath.split("/").reverse()[0]
          this.unsubscribes.set(id, unsubscribe)
          if( parentNode.children ){
            parentNode.children!.sort( (a,b) =>{ return a.obj.label > b.obj.label ? 1: -1 })
          }
          let pathNodes = this.dataSource.getNodePath( parentNode )
          this.tree.renderNodeChanges( pathNodes )
          this.dataSource.data = TREENODE_EXAMPLE_DATA
          this.dataSource.data = this.comparisonList
          pathNodes.forEach(node => {
            this.treeControl.expand(node);
          });
          resolve()  
        })
      },
      (reason:any) =>{
        alert("ERROR update load children:" + reason)
        reject(reason)
      })
*/
    })
  }
  onDelete(){
    if( confirm("are you sure to delete:" + this.comparison?.label) ){
      this.firebaseService.deleteDoc("Comparison", this.comparison!.id ).then( ()=>{
        this.router.navigate(["/"])
      })
    }
  }
  onAddChild(parentNode:TreeNode){
/*
    var parentCollection:string = this.dataSource.getPath( parentNode )

    const dialogRef = this.dialog.open(ChildEditComponent, {
      height: '400px',
      width: '80%',
      data: { parentCollection:parentCollection, id:null }
    });
  
    dialogRef.afterClosed().subscribe( (data:any) => {
      console.log('The dialog was closed');
      if( data != undefined && data != ''){
        console.log(data)
      }
      else{
        console.debug("none")
      }
    });    
*/

  }


  loadDataSets(){
    getDocs( query( collection(db, "Dataset") ) ).then( set =>{
      this.datasets.length = 0
      set.docs.map( doc =>{
        var dataset:Dataset = doc.data() as Dataset
        this.datasets.push( dataset )
      })
      this.datasets.sort( (a,b) => a.label! > b.label! ? 1 : -1)
    })    
  } 
 
  onCreateNew(){
    var comparison:Comparison={
      id:uuid.v4(),
      label:this.FG.controls.label.value!,
      groupId:this.groupId,
      sources:[],
      parentId:null,
      filter:""
    }
    
    setDoc( doc(db, "Comparison" , comparison.id!), comparison).then( () =>{
      console.log("created")
      this.id = comparison.id!
      this.comparison = comparison  
      this.router.navigate(["Comparison-edit",this.comparison.id])    
    },
    reason =>{
      console.log("ERROR:" + reason )
    })
    
  }   
  
  onCancel(){
    this.router.navigate(["Comparison-list"])
  }


  onEditChild(row:TreeNode){
    /*
    var parentCollection:string = this.dataSource.getPath( row.parentNode )
    

    const dialogRef = this.dialog.open(ChildEditComponent, {
      height: '400px',
      width: '80%',
      data: {  parentCollection, id:row.obj.id }
    });
  
    dialogRef.afterClosed().subscribe( (data:any) => {
      console.log('The dialog was closed');
      if( data != undefined && data != ''){
        console.log(data)
      }
      else{
        console.debug("none")
      }
    });   
    */
  }  
  onRemoveChild(row:TreeNode){
    var parentCollection:string = this.dataSource.getPath( row.parentNode )
    deleteDoc( doc(db, parentCollection + "/Child", row.obj.id) ).then( ()=>{
      console.log("child removed")
    },
    reason=>{
      alert("ERROR:" + reason)
    })
  }

  sortData($event:any){
    console.log( $event )
  }  

  getDataset(id:string):Dataset|null{
    var selectedDataset:Dataset|null = null
    this.datasets.map( dataset =>{
      if( id == dataset.id){
        selectedDataset = dataset
      }
    })
    return selectedDataset
  } 
  getPorts( side:"left"|"right",comparisonPorts:ComparisonRow[], datasetId:string|null, csvfile:string|null ):Promise<void>{
    
    return new Promise<void>((resolve,reject)=>{
      /*
      let param:any
      if( datasetId ){
        let dataSet = this.getDataset( datasetId )
        if( dataSet && dataSet.sql ){
          var qry = this.stringUtilService.removeNonPrintable(dataSet.sql)
          param = {"qry":qry}
        }
          
      }//finish left dataset qry    
      else{
        param = {"csvfile":csvfile}
      }    
      this.urlService.post("getFielsForQuery",param).subscribe({ 
            'next':(result)=>{
             
              var tempItemPorts:ComparisonRow[] = []
              var data:PortListRequest = result as PortListRequest 
    
              var fields = data["fields"]
              fields.map( field =>{
                let port:ComparisonRow = {
                  name: field.name,
                  datatype: field.datatype,
                  alias: null,
                  selected: true,
                  side: side
                }
                tempItemPorts.push( port )
              })
              comparisonPorts.map( oldItemPort =>{
                tempItemPorts.filter( p => p.name == oldItemPort.name).map( p=>{
                  p.selected = oldItemPort.selected
                  if( oldItemPort.alias != null ){
                    p.alias = oldItemPort.alias
                  }
                })
              })
              comparisonPorts.length=0
              tempItemPorts.map( item => {
                comparisonPorts.push(item)
              })
              resolve()
            },
            'error':(reason)=>{
              reject(reason)
            }
          })
    */
    })
    
  }

  onRefreshPorts(){
    this.submmiting = true
    this.refreshPorts().then( ()=>{
      this.submmiting = false
    },
    reason =>{
      this.submmiting = false
      alert("ERROR refreshing Ports" + reason.error.error)
    })
  }

  refreshPorts():Promise<void>{
    
    return new Promise<void>((resolve, reject) =>{
      /*
      let leftDatasetId:string|null = this.FG.controls.leftDatasetId.value
      let rightDatasetId:string|null = this.FG.controls.rightDatasetId.value
      let leftFile:string|null = this.FG.controls.leftFile.value
      this.getPorts("left", this.comparison.leftPorts, leftDatasetId, leftFile ).then( ()=>{
      })
      .then( ()=>{
        return this.getPorts("right", this.comparison.rightPorts, rightDatasetId, leftFile )
      })
      .then( ()=>{
        this.submmiting = false
        var allItemPorts:ComparisonRow[] = []
        this.comparison.leftPorts.map( port => allItemPorts.push(port))
        this.comparison.rightPorts.map( port => allItemPorts.push(port))
        this.portsDataSource.length = 0
        allItemPorts.map( item => this.portsDataSource.push(item))

        this.updateJoinColumns()

        var obj ={ 
          "leftPorts":this.comparison.leftPorts,
          "rightPorts":this.comparison.rightPorts,
        }
        updateDoc( doc(db,"Comparison",this.comparison.id), obj).then( ()=>{
          console.log("ports has been updated")
          resolve()
        },
        reason=>{
          alert("ERROR:"+ reason)
        })
      })
      .catch( (reason) =>{
        reject( reason )
      })
      */
    })
    
  }
  
  onExecute(){
    this.router.navigate(["Comparison-execute",{id:this.comparison.id}])
  }
  updateJoinColumns():Promise<void>{
    
    return new Promise<void>( (resolve,reject) =>{
      /*
      //update joinColumns
      //1.-first read all fields with the same name 
      //2.-save the newOnes
      if( !this.comparison.joinColumns ){
        this.comparison.joinColumns = []
      }
      this.comparison.joinColumns.length = 0
      this.comparison.leftPorts.map( lPort =>{
        this.comparison.rightPorts.map( rPort =>{
          var lName = lPort.alias ? lPort.alias.toUpperCase() : lPort.name.toUpperCase()
          var rName = rPort.alias ? rPort.alias.toUpperCase() : rPort.name.toUpperCase()
          if( lName == rName ){
            this.comparison.joinColumns.push( lName )
          }
        })
      }) 
      var obj ={ 
        "joinColumns":this.comparison.joinColumns
      }
      updateDoc( doc(db,"Comparison",this.comparison.id), obj).then( ()=>{
        console.log("ports has been updated")
        resolve()
      },
      reason=>{
        alert("ERROR:"+ reason)
        reject(reason)
      })           
      */
    })   
    
  }
}
