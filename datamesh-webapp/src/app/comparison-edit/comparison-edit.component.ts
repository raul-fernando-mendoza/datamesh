import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { db } from '../../environments/environment'

import { collection, doc, deleteDoc , getDoc,  onSnapshot, getDocs, query, setDoc, updateDoc} from "firebase/firestore"; 
import { MatDialog } from '@angular/material/dialog';
import { Comparison, Child, PortListRequest, Dataset, Port, ConditionJoin } from '../datatypes/datatypes.module';
import { ActivatedRoute, Router } from '@angular/router';
import * as uuid from 'uuid';
import { ChildEditComponent } from '../child-edit/child-edit.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import {NestedTreeControl} from '@angular/cdk/tree';
import { TreeNestedDataSource, TreeNode, TREENODE_EXAMPLE_DATA } from '../tree-nested-data-source';
import { MatTree } from '@angular/material/tree';
import { UrlService } from '../url.service';
import { StringUtilService } from '../string-util.service';
import { Portal } from '@angular/cdk/portal';

interface ItemPort{
  side:"left"|"right"
  port:Port
}
  //dataset:Dataset

@Component({
  selector: 'app-comparison-edit',
  templateUrl: './comparison-edit.component.html',
  styleUrls: ['./comparison-edit.component.css']
})
export class ComparisonEditComponent implements OnInit, AfterViewInit, OnInit, OnDestroy{

  @ViewChild(MatPaginator) paginator!: MatPaginator ;
  @ViewChild(MatSort) sort!: MatSort ;
  @ViewChild(MatTable) table!: MatTable<ItemPort> ;
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
  FG = this.fb.group({
    id:[''],
    label:[''],
    leftDatasetId:[''],
    rightDatasetId:[''],
  })

  comparisonList:TreeNode[] = []
  //nodeTreeDataSource!:TreeNestedDataSource 
  
  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['idx','source','name','type','alias','selected'];

  submmiting=false

  unsubscribes = new Map()

  portsDataSource:ItemPort[] = []

  leftItemPorts:ItemPort[] = [
    /*
    { 
      port:{
        datasetId:"abc",
        name:"ACCOUNT_ID",
        datatype:"srt",
        alias:"mio",
        selected:true      
      },
      dataset:{
        id:"jkl",
        label:"fist",
        sql:"select * from dual"     
      }
    }
    */
  ]
  rightItemPorts:ItemPort[] = []
 
  constructor(
      public dialog: MatDialog
     ,private router:Router
     ,private route: ActivatedRoute
     ,private urlService:UrlService
     ,private stringUtilService:StringUtilService
     ,private fb:FormBuilder) {
    if( this.route.snapshot.paramMap.get('id') != 'null'){
      this.id = this.route.snapshot.paramMap.get('id')
    }    
    this.dataSource.data = TREENODE_EXAMPLE_DATA;   
  }

  ngOnDestroy(): void {
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
    values[propertyName]=value   
    if( this.id ){
      updateDoc( doc( db, "Comparison", this.id), values ).then( ()=>{
        console.log("update property")
      },
      reason=>{
        alert("ERROR:" + reason)
      })
    }
  }  
  update(){
    if( this.id ){
      let unsubscribe = onSnapshot( doc( db,"Comparison", this.id ),
          (docRef) =>{
                //initialize the form
                this.comparison=docRef.data() as Comparison

                this.FG.controls.label.setValue( this.comparison.label!)
                this.FG.controls.leftDatasetId.setValue( this.comparison.leftDatasetId! )
                this.FG.controls.rightDatasetId.setValue( this.comparison.rightDatasetId! )

                //add the first node 
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

                
                //load the ports to portdatasource
                this.comparison.leftPorts.map(item=>{
                  let itemPort:ItemPort={
                    side:"left",
                    port:item
                  }
                  this.portsDataSource.push( itemPort )
                })
                this.comparison.rightPorts.map(item=>{
                  let itemPort:ItemPort={
                    side:"right",
                    port:item
                  }
                  this.portsDataSource.push( itemPort )
                })
                


                let parentPath = "Comparison" + "/" + this.comparison.id
                this.loadChildren( parentPath , node ).then( () =>{
                  this.dataSource.data = this.comparisonList
                })
                
              
          },
          (reason:any) =>{
              alert("ERROR update list:" + reason)
          }  
      )
      this.unsubscribes.set( "root", unsubscribe )
    }
  }  

  loadChildren( parentPath:string, parentNode:TreeNode ):Promise<void>{
    return new Promise<void>((resolve, reject)=>{
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
        alert("ERROR update list:" + reason)
        reject(reason)
      })

    })
  }
  onRemove(id:string){
    deleteDoc( doc( db, "Comparison", id )).then( () =>{
      console.log("remove successful")
    },
    reason =>{
      alert("ERROR removing:" + reason)
    })
  }  
  onAddChild(parentNode:TreeNode){

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


  }


  loadDataSets(){
    getDocs( query( collection(db, "Dataset") ) ).then( set =>{
      this.datasets.length = 0
      set.docs.map( doc =>{
        var dataset:Dataset = doc.data() as Dataset
        this.datasets.push( dataset )
      })
    })    
  } 
 
  onCreateNew(){
    var comparison:Comparison={
      id:uuid.v4(),
      label:this.FG.controls.label.value!,
      leftDatasetId:this.FG.controls.leftDatasetId.value!,
      rightDatasetId:this.FG.controls.rightDatasetId.value!,
      leftPorts:[],
      rightPorts:[],
      joinConditions:[]
    }
    
    setDoc( doc(db, "Comparison" , comparison.id!), comparison).then( () =>{
      console.log("created")
      this.id = comparison.id!
      this.comparison = comparison      
      this.onRefreshPorts().then( ()=>{
        this.update()
      })
    },
    reason =>{
      console.log("ERROR:" + reason )
    })
  }   
  
  onCancel(){
    this.router.navigate(["Comparison-list"])
  }


  onEditChild(row:TreeNode){
    
    var parentCollection:string = this.dataSource.getPath( row.parentNode )

    const dialogRef = this.dialog.open(ChildEditComponent, {
      height: '400px',
      width: '80%',
      data: { parentCollection:parentCollection, id:row.obj.id }
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

  getPorts( side:"left"|"right",itemPorts:ItemPort[], datasetId:string|null ):Promise<void>{
    return new Promise<void>((resolve,reject)=>{
      if( datasetId ){
        let dataSet = this.getDataset( datasetId )
        if( dataSet && dataSet.sql ){
          var qry = this.stringUtilService.removeNonPrintable(dataSet.sql)
          
          this.urlService.post("getFielsForQuery",{"qry":qry}).subscribe({ 
            'next':(result)=>{
             
              var tempItemPorts:ItemPort[] = []
              var data:PortListRequest = result as PortListRequest 
    
              var fields = data["fields"]
              fields.map( field =>{
                var itemPort:ItemPort = {
                  side:side,
                  port:field
                }
                tempItemPorts.push( itemPort )
              })
              itemPorts.map( oldItemPort =>{
                tempItemPorts.filter( p => p.port.name == oldItemPort.port.name && oldItemPort.port.selected == true).map( p=>{
                  p.port.selected = true
                  if( oldItemPort.port.alias != null ){
                    p.port.alias = oldItemPort.port.alias
                  }
                })
              })
              itemPorts.length=0
              if( side == "left"){
                this.comparison!.leftPorts!.length = 0
              }
              else{
                this.comparison!.rightPorts!.length = 0
              }
              tempItemPorts.map( item => {
                itemPorts.push(item)
                if( side == "left"){
                  this.comparison.leftPorts!.push( item.port )
                }
                else{
                  this.comparison!.rightPorts!.push( item.port )
                }                
              })
              resolve()
            },
            'error':(reason)=>{
              reject(reason)
            }
          })
        }//finish left dataset qry  
      }  
    })
  }

  onRefreshPorts():Promise<void>{
    return new Promise<void>((resolve, reject) =>{
      let leftDatasetId:string|null = this.FG.controls.leftDatasetId.value
      let rightDatasetId:string|null = this.FG.controls.rightDatasetId.value

      this.submmiting = true
      this.getPorts("left", this.leftItemPorts, leftDatasetId ).then( ()=>{
      })
      .then( ()=>{
        return this.getPorts("right", this.rightItemPorts, rightDatasetId )
      })
      .then( ()=>{
        this.submmiting = false
        var allItemPorts:ItemPort[] = []
        this.leftItemPorts.map( item => allItemPorts.push(item))
        this.rightItemPorts.map( item => allItemPorts.push(item))
        this.portsDataSource.length = 0
        allItemPorts.map( item => this.portsDataSource.push(item))

        //update joinConditions 
        //1.-first read all fields with the same name 
        //2.-save the newOnes
        this.comparison.joinConditions.length = 0
        this.comparison.leftPorts.map( lPort =>{
          this.comparison.rightPorts.map( rPort =>{
            if( lPort.name == rPort.name ){
              let joinCondition:ConditionJoin = {
                leftExpresion:lPort.name,
                rightExpresion:rPort.name,
                selected:true
              }
              this.comparison.joinConditions.push( joinCondition )
            }
          })
        })

        var obj ={ 
          "leftPorts":this.comparison.leftPorts,
          "rightPorts":this.comparison.rightPorts,
          "joinConditions":this.comparison.joinConditions
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
    })
  }
  onSelectPort(row:ItemPort){
    console.log( row )
    var obj:{
      leftPorts?:Port[]
      rightPorts?:Port[]
    }={}
    if( row.side == "left"){
      obj.leftPorts=this.comparison!.leftPorts
    }
    else{
      obj.rightPorts=this.comparison!.rightPorts
    }
    
    updateDoc( doc(db, "Comparison" , this.comparison.id!), obj).then( () =>{
      console.log("update")
    },
    reason =>{
      console.log("ERROR:" + reason )
    })    
  }

  onExecute(){
    this.router.navigate(["Comparison-execute",{id:this.comparison.id}])
  }

}
