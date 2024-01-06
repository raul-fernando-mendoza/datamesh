import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { db } from '../../environments/environment'

import { collection, doc, deleteDoc , getDoc,  onSnapshot, getDocs, query, setDoc, updateDoc, DocumentData, DocumentSnapshot} from "firebase/firestore"; 
import { MatDialog } from '@angular/material/dialog';
import { Comparison, PortListResponse, Dataset, Port, ComparisonPort, KeyLeftRight } from '../datatypes/datatypes.module';
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
import { CdkDragDrop, CdkDragEnter, CdkDragExit, copyArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';




const keyports = "keyports"

  //dataset:Dataset

@Component({
  selector: 'app-comparison-edit',
  templateUrl: './comparison-edit.component.html',
  styleUrls: ['./comparison-edit.component.css']
})
export class ComparisonEditComponent implements OnInit, AfterViewInit, OnInit, OnDestroy{

  @ViewChild(keyports, {
    static: true
    }) table!: MatTable<KeyLeftRight> ;
  @ViewChild(MatPaginator) paginator!: MatPaginator ;
  @ViewChild(MatSort) sort!: MatSort ;
  
  //@ViewChild(MatTree) tree!: MatTree<TreeNode> ; 

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
 
  submmiting=false

  unsubscribe:any
  unsubscribes = new Map()

  portsDataSource:KeyLeftRight[] = []

  portdatatypes:string[] = [
    "int32",
    "object",
    "float64",
    "LongTypep()",
    "BooleanType()",
    "LongType()",
    "StringType()"
  ]

  done = ['Get up', 'Brush teeth', 'Take a shower', 'Check e-mail', 'Walk dog'];

  displayedColumns: string[] = ['idx','parent', 'left', 'right', 'selected'];
  portsSource = [];  

  leftDataset:Dataset | null = null
  rightDataset:Dataset | null = null

  leftDisplayedColumns = ['idx','name','alias','isSelected']

  constructor(
      public dialog: MatDialog
     ,private router:Router
     ,private activatedRoute: ActivatedRoute
     ,private urlService:UrlService
     ,private stringUtilService:StringUtilService
     ,private fb:FormBuilder
     ,public firebaseService:FirebaseService) {
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
 
  }
  ngAfterViewInit(): void {
    this.update()
  }
  

 
  update(){
    
    if( this.id ){
      this.unsubscribe = onSnapshot( doc( db,"Comparison", this.id ),
          (docRef) =>{
                if( docRef.exists()){
                  this.comparison=docRef.data() as Comparison

                  this.FG.controls.label.setValue( this.comparison.label!)

                  this.updateDataSources()

                  this.table.dataSource = []
                  this.table.dataSource = this.comparison.keyLeftRight
                  this.table.renderRows()
                }
        
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



 
  onCreateNew(){
    var comparison:Comparison={
      id: uuid.v4(),
      label: this.FG.controls.label.value!,
      groupId: this.groupId,
      parentDatasetId: null,
      parentPorts: [],
      filter: "",
      leftDatasetId: null,
      leftPorts: [],
      rightDatasetId: null,
      rightPorts: [],
      keyLeftRight: [],
      keyParenRight: [],
      keyParentLeft: [],
      records: undefined,
      schema: undefined
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

/*
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
*/
  onExecute(){
    this.router.navigate(["Comparison","execute",this.comparison.id])
  }
  onLeftSourceDrop(e: any) {
    // Get the dropped data here
    console.log(e)
    this.comparison.leftDatasetId = e.dragData
    
    this.firebaseService.updateDoc("Comparison",this.id!, {leftDatasetId:this.comparison.leftDatasetId }).then( ()=>{
      this.updatePorts()
    },
    reason=>{
      alert("error loading left:" + reason)
    })

    
  }
  onRightSourceDrop(e:any){
    console.log(e)
    this.comparison.rightDatasetId = e.dragData
    this.firebaseService.updateDoc("Comparison",this.id!, {rightDatasetId:this.comparison.rightDatasetId }).then( ()=>{
      this.updatePorts()
    },
    reason=>{
      alert("Error loading right:" + reason)
    })
    
  }

  updateDataSources():Promise<void>{
    return new Promise<void>( (resolve, reject) =>{
      let transactions:any = []
      if( this.comparison.leftDatasetId ){
        let leftTransaction = this.firebaseService.getdoc("Dataset", this.comparison.leftDatasetId).then( (doc:DocumentSnapshot) =>{
          if( doc.exists() ){
            this.leftDataset = doc.data() as Dataset
            this.comparison.leftPorts = []
            this.leftDataset.ports.map( port =>{
              let comparisonPort:ComparisonPort = {
                name: port.name,
                datatype: port.datatype,
                alias: "",
                isSelected: true
              }
              this.comparison.leftPorts.push( comparisonPort )
            })
          }
        })
        transactions.push( leftTransaction )
      }
      if( this.comparison.rightDatasetId ){
        let rightTransaction = this.firebaseService.getdoc("Dataset", this.comparison.rightDatasetId).then( (doc:DocumentSnapshot) =>{
          if( doc.exists() ){
            this.rightDataset = doc.data() as Dataset
            this.comparison.rightPorts = []
            this.rightDataset.ports.map( port =>{
              let comparisonPort:ComparisonPort = {
                name: port.name,
                datatype: port.datatype,
                alias: "",
                isSelected: true
              }
              this.comparison.rightPorts.push( comparisonPort )
            })
          }
        })
        transactions.push( rightTransaction )
      }
      Promise.all( transactions ).then( ()=>{
        resolve()
      },
      error =>{
        reject(error)
      })
    })        
  }


  updatePorts():Promise<void>{
    return new Promise<void>( (resolve,reject) =>{
      let transactions:any = []
      if( this.comparison.leftDatasetId ){
        let leftTransaction = this.firebaseService.getdoc("Dataset", this.comparison.leftDatasetId).then( (doc:DocumentSnapshot) =>{
          if( doc.exists() ){
            this.leftDataset = doc.data() as Dataset
            this.comparison.leftPorts = []
            this.leftDataset.ports.map( port =>{
              let comparisonPort:ComparisonPort = {
                name: port.name,
                datatype: port.datatype,
                alias: "",
                isSelected: true
              }
              this.comparison.leftPorts.push( comparisonPort )
            })
            this.firebaseService.updateDoc("Comparison",this.id!, {leftPorts:this.comparison.leftPorts })
          }
        })
        transactions.push( leftTransaction )
      }
      if( this.comparison.rightDatasetId ){
        let rightTransaction = this.firebaseService.getdoc("Dataset", this.comparison.rightDatasetId).then( (doc:DocumentSnapshot) =>{
          if( doc.exists() ){
            this.rightDataset = doc.data() as Dataset
            this.comparison.rightPorts = []
            this.rightDataset.ports.map( port =>{
              let comparisonPort:ComparisonPort = {
                name: port.name,
                datatype: port.datatype,
                alias: "",
                isSelected: true
              }
              this.comparison.rightPorts.push( comparisonPort )
            })
            this.firebaseService.updateDoc("Comparison",this.id!, {rightPorts:this.comparison.rightPorts })
          }
        })
        transactions.push( rightTransaction )
      }
      Promise.all( transactions ).then( ()=>{
        //when reaching here the comparison leftPorts and rightPorts sholuld have been filled
        this.comparison.keyLeftRight.length = 0
        //go trough all the left ports and check if the right has the same port if that is the case add key
        this.comparison.leftPorts.map( lport =>{
          let found = this.comparison.rightPorts.find( rport =>{
            return (lport.alias!=""?lport.alias:lport.name) == (rport.alias!=""?rport.alias:rport.name) 
          }) 
          if( found ){
            let newRow:KeyLeftRight ={
              leftPortName: lport.name,
              leftPortType: lport.datatype,
              leftPortAlias: lport.alias,
              rightPortName: found.name,
              rightPortType: found.datatype,
              rightPortAlias: found.alias,
              isSelected:true
            }
            this.comparison.keyLeftRight.push( newRow )
          }
        })
        this.firebaseService.updateDoc("Comparison",this.id!, {keyLeftRight:this.comparison.keyLeftRight })
        this.table.dataSource = []
        this.table.dataSource = this.comparison.keyLeftRight
        this.table.renderRows()
      },
      reason=>{
        alert("Error updating ports:" + reason)
      })
    })   
  }  
}
