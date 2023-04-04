import { AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { EXAMPLE_DATA, NodeTableDataSource, NodeTableRow } from '../node-table/node-table-datasource';
import { db } from '../../environments/environment'
import { Observable } from 'rxjs';

import { collection, doc, deleteDoc , getDoc,  onSnapshot, getDocs, query, setDoc, updateDoc} from "firebase/firestore"; 
import { DatasetCreateComponent } from '../dataset-create/dataset-create.component';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Child, JoinType, Dataset, Port, ConditionJoin, PortListRequest } from '../datatypes/datatypes.module';
import { ActivatedRoute, Router } from '@angular/router';
import * as uuid from 'uuid';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { UrlService } from '../url.service';
import { StringUtilService } from '../string-util.service';

interface ItemPort{
  side:"left"|"right"
  port:Port
  //dataset:Dataset
}

@Component({
  selector: 'app-join-edit',
  templateUrl: './child-edit.component.html',
  styleUrls: ['./child-edit.component.css']
})
export class ChildEditComponent implements OnInit , AfterViewInit{

  @ViewChild(MatPaginator) paginator!: MatPaginator ;
  @ViewChild(MatSort) sort!: MatSort ;
  @ViewChild(MatTable) table!: MatTable<Port> ; 

  datasets:Dataset[] = []

  child!:Child 
  FG = this.fb.group({
    id:[''],
    label:[''],
    leftDatasetId:[''],
    rightDatasetId:[''],
    ports:this.fb.array([
      this.fb.group({
        id:[""],
        datasetId:[""],
        name:[""],
        type:[""],
        alias:[""]
      })
    ])
  })

  

  portsDataSource:ItemPort[]=[]
  leftItemPorts:ItemPort[] = []
  rightItemPorts:ItemPort[] = []

  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['idx','source','name','type','alias','selected'];

  submmiting=false

  unsubscribes = new Map()
 
  constructor(
      public dialog: MatDialog
     ,private router:Router
     ,private route: ActivatedRoute
     ,private fb:FormBuilder
     ,private urlService:UrlService
     ,private stringUtilService:StringUtilService
     ,@Inject(MAT_DIALOG_DATA) public data:{ parentCollection:string, id:string|null}) {
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
    if( this.data.id ){
      updateDoc( doc( db, this.data.parentCollection + "/Child", this.data.id), values ).then( ()=>{
        console.log("update property")
      })
    }
  }
  onCheckboxChange(event:any){
    var propertyName = event.source.name
    var value:boolean = event.checked     
    var values:any = {}
    values[propertyName]=value   
    if( this.data.id ){
      updateDoc( doc( db, this.data.parentCollection + "/Child" , this.data.id), values ).then( ()=>{
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
    if( this.data.id ){
      updateDoc( doc( db, this.data.parentCollection + "/Child" , this.data.id), values ).then( ()=>{
        console.log("update property")
      },
      reason=>{
        alert("ERROR:" + reason)
      })
    }
  }  
  update(){
    if( this.data.id ){
      let unsubscribe = onSnapshot( doc( db, this.data.parentCollection + "/Child" , this.data.id ),
          (doc) =>{
                this.child=doc.data() as Child
                this.FG.controls.label.setValue( this.child.label )
                this.FG.controls.leftDatasetId.setValue( this.child.leftDatasetId )
                this.FG.controls.rightDatasetId.setValue( this.child.rightDatasetId )
                //load the ports to portdatasource
                this.child.leftPorts.map(item=>{
                  let itemPort:ItemPort={
                    side:"left",
                    port:item
                  }
                  this.portsDataSource.push( itemPort )
                })
                this.child.rightPorts.map(item=>{
                  let itemPort:ItemPort={
                    side:"right",
                    port:item
                  }
                  this.portsDataSource.push( itemPort )
                })
          },
          (reason:any) =>{
              alert("ERROR update list:" + reason)
          }  
      )
      this.unsubscribes.set( "root", unsubscribe )
    }
  }  

  loadChildren( parentPath:string, node:NodeTableRow ):Promise<void>{
    return new Promise<void>((resolve, reject)=>{
      let unsubscribe = onSnapshot(collection(db,this.data.parentCollection + "/Child"),
      (set) =>{
        node.children.length = 0
        let transactions = []
        set.docs.map( doc =>{
          var child=doc.data() as Child
          var childNode:NodeTableRow = {
            obj:child,
            opened:false,
            children:[],
            nodeClass:"Child",
            isLeaf:true
          }          
          node.children.push( childNode )
          let childrenPath:string = parentPath + "/Child/" + child.id

          return this.loadChildren( childrenPath, childNode )

        })
        resolve()
      },
      (reason:any) =>{
        alert("ERROR update list:" + reason)
        reject(reason)
      })
      this.unsubscribes.set(node.obj.id, unsubscribe)
    })
  }
  onRemove(id:string){
    deleteDoc( doc( db, this.data.parentCollection, id )).then( () =>{
      console.log("remove successful")
    },
    reason =>{
      alert("ERROR removing:" + reason)
    })
  }  
  onAddJoin(e:any){
/*
    let path = this.dataSource!.getPathNode(parentNode)

    let parentPath:string = ""
    for( let i =0; i<path.length; i++){
      let item:NodeTableRow=path[i]
      parentPath += item.nodeClass + "/" + item.obj.id
    }

    setDoc( doc(db, this.data.parentCollection + "/" + Child.name , child.id), child).then( () =>{
      console.log("created")
      this.data.id = child.id
    },
    reason =>{
      console.log("ERROR:" + reason )
    })
    */
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
    var child:Child={
      id:uuid.v4(),
      label:this.FG.controls.label.value!,
      leftDatasetId:this.FG.controls.leftDatasetId.value!,
      rightDatasetId:this.FG.controls.rightDatasetId.value!,
      leftPorts:[],
      rightPorts:[],
      joinConditions:[]
    }
    
    setDoc( doc(db, this.data.parentCollection + "/Child", child.id), child).then( () =>{
      console.log("created")
      this.data.id = child.id
      this.child = child      
      this.onRefreshPorts().then( ()=>{
        this.update()
      })      
    },
    reason =>{
      console.log("ERROR:" + reason )
    })
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
                this.child!.leftPorts!.length = 0
              }
              else{
                this.child!.rightPorts!.length = 0
              }
              tempItemPorts.map( item => {
                itemPorts.push(item)
                if( side == "left"){
                  this.child.leftPorts!.push( item.port )
                }
                else{
                  this.child!.rightPorts!.push( item.port )
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
        this.child.joinConditions.length = 0
        this.child.leftPorts.map( lPort =>{
          this.child.rightPorts.map( rPort =>{
            if( lPort.name == rPort.name ){
              let joinCondition:ConditionJoin = {
                leftExpresion:lPort.name,
                rightExpresion:rPort.name,
                selected:true
              }
              this.child.joinConditions.push( joinCondition )
            }
          })
        })

        var obj ={ 
          "leftPorts":this.child.leftPorts,
          "rightPorts":this.child.rightPorts,
          "joinConditions":this.child.joinConditions
        }
        updateDoc( doc(db,this.data.parentCollection + "/Child",this.child.id), obj).then( ()=>{
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
      obj.leftPorts=this.child!.leftPorts
    }
    else{
      obj.rightPorts=this.child!.rightPorts
    }
    
    updateDoc( doc(db, this.data.parentCollection + "/Child" , this.child.id!), obj).then( () =>{
      console.log("update")
    },
    reason =>{
      console.log("ERROR:" + reason )
    })    
  }

 
}
