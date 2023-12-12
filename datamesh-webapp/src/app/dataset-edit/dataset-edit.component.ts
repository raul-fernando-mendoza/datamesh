import {Component, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Dataset, FileDataset, Port, PortListResponse, SnowFlakeDataset } from '../datatypes/datatypes.module';
import * as uuid from 'uuid';
import { StringUtilService } from '../string-util.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { FirebaseService } from '../firebase.service';
import { MatSelectChange } from '@angular/material/select';
import { UrlService } from '../url.service';
import { ConnectionsService } from 'app/connections.service';


@Component({
  selector: 'app-dataset-edit',
  templateUrl: './dataset-edit.component.html',
  styleUrls: ['./dataset-edit.component.css']
})
export class DatasetEditComponent implements OnInit{

  displayedColumns: string[] = ['name', 'datatype' ];
  portdatatypes:string[] = [
    "int32",
    "object",
    "float64"
  ]

  typeList = ["FileDataset","SnowFlakeDataset"]

  FG = this.fb.group({
    type:['',[Validators.required]],
    label:['',[Validators.required]],
    sql:['',[]],
    fileName:['',[]],
    connectionName:[""],
  })

  id:string | null = null
  groupId:string | null = null
  
  dataset!:FileDataset|SnowFlakeDataset


  datasource:Port[] = []

  connectionNames:Array<string> = []

  constructor( 
     private fb:FormBuilder 
    ,private stringUtilService:StringUtilService
    ,private activatedRoute:ActivatedRoute
    ,private router:Router
    ,public firebaseService:FirebaseService
    ,private urlService:UrlService
    ,public connectionsService:ConnectionsService,
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
  ngOnInit(): void {
    this.connectionsService.getConnectionNames().then( (connectionNames) => {
      this.connectionNames = connectionNames
    },
    reason=>{
      alert("Error readin connection:" + reason)
    })
    this.update()

  }

  update(){
    if( this.id ){
      this.firebaseService.getdoc("Dataset", this.id).then( doc =>{
          let dataset:Dataset = doc.data() as Dataset

          this.FG.controls.type.setValue( dataset.type )
          this.FG.controls.label.setValue( dataset.label )

          if( dataset.type === "FileDataset"){
            let fileDataset = doc.data() as FileDataset
            this.FG.controls.fileName.setValue( fileDataset.fileName )
            this.dataset = fileDataset
          }
          else{
            let snowFlakeDataset:SnowFlakeDataset = doc.data() as SnowFlakeDataset
            this.FG.controls.connectionName.setValue( snowFlakeDataset.connectionName )              
            this.FG.controls.sql.setValue( snowFlakeDataset.sql )
            this.dataset = snowFlakeDataset
          }

          this.datasource = this.dataset.ports
        },
        reason=>{
          alert("ERROR:" + reason)        
      })
    }
  }

  onSubmit(){
    if( !this.dataset ){
      this.create()
    }
    else{
      this.save()
    }
  }
  create():Promise<void>{
    //create new
    let dataset:Dataset = {
      id:uuid.v4(),
      type: this.FG.controls.type.value!,
      label: this.FG.controls.label.value!,
      groupId: this.groupId!,
      fileName: this.FG.controls.fileName.value!,
      sql:this.FG.controls.sql.value!,
      connectionName:this.FG.controls.connectionName.value?this.FG.controls.connectionName.value:"",
      ports: []
    }
    return this.firebaseService.setDoc( "Dataset", dataset.id, dataset).then( () =>{
      this.id = dataset.id
      this.router.navigate(["Dataset","edit",this.id])
    })
  }

  save(){
    let type=this.FG.controls.type.value
    let values ={
      type: this.FG.controls.type.value!,
      label: this.FG.controls.label.value!,
      sql:this.FG.controls.sql.value!,
      fileName: this.FG.controls.fileName.value!,
      ports: []
    }
    return this.firebaseService.updateDoc( "Dataset", this.dataset!.id, values)
  }

  onCancel(){
    this.router.navigate(["/"])
  }
  updateQry(dataset:Dataset):Promise<string>{
    
    return new Promise<string>((resolve, reject) =>{
      /*
      var values = {
        label:dataset.label,
        sql: dataset.sql
      }
      updateDoc(doc(db, "Dataset",dataset.id), values).then( doc =>{
        console.log("Document updated with ID: ", dataset.id)
        resolve( dataset.id )
      },
      reason =>{
        alert("Error updateDataset:" + reason)
        reject(reason)
      })
      */
    })
  }

  onSelectTypeChange(event:MatSelectChange){
    
    console.log("onSelectChange")
    var propertyName:any = event.source.ngControl.name
    var value = event.source.ngControl.value  
    if(this.FG.controls.type.value == 'SnowFlakeDataset'){
      this.FG.controls.fileName.removeValidators(Validators.required)
      this.FG.controls.fileName.updateValueAndValidity()
      this.FG.controls.sql.addValidators(Validators.required); 
      this.FG.controls.sql.updateValueAndValidity()               
    } else {                
      this.FG.controls.sql.removeValidators(Validators.required)
      this.FG.controls.sql.updateValueAndValidity()
      this.FG.controls.fileName.addValidators(Validators.required)
      this.FG.controls.fileName.updateValueAndValidity()
    }
    this.firebaseService.onSelectionChange(event, 'Dataset', this.id, 'type')
  }  
  
  onDelete(){
    if( confirm("are you sure to delete:" + this.dataset?.label) ){
      this.firebaseService.deleteDoc("Dataset", this.dataset!.id ).then( ()=>{
        this.router.navigate(["/"])
      })
    }
  }

  onRefreshPorts():Promise<void>{
    
    return new Promise<void>((resolve,reject)=>{
      
      let param:any
      if( this.dataset!.type == "SnowFlakeDataset"  ){
        let sql = this.FG.controls.sql.value 
        let dataset:SnowFlakeDataset = (this.dataset as SnowFlakeDataset)
        dataset.sql = sql ? sql : ""
        param = {
          "qry":(this.dataset! as SnowFlakeDataset).sql,
          "connectionname":(this.dataset! as SnowFlakeDataset).connectionName,
        }
      }//finish left dataset qry    
      else{
        param = {"csvfile":( this.dataset! as FileDataset).fileName}
      }    
      this.urlService.post("getFielsForQuery",param).subscribe({ 
            'next':(result)=>{
             
              var tempPorts:Port[] = []
              var data:PortListResponse = result as PortListResponse 
    
              this.dataset!.ports = data["fields"]
              this.datasource = this.dataset!.ports
              
              this.firebaseService.updateDoc("Dataset", this.dataset!.id, {ports:this.dataset!.ports})
              resolve()
            },
            'error':(reason)=>{
              alert("ERROR:" + reason.error.error)
              reject(reason)
            }
          })
    
    })
    
  }

  onPortChange($event:any, port:Port){
    port.datatype = $event.value
    if( this.id ){
      this.firebaseService.updateDoc( "Dataset", this.id!, {
        ports:this.dataset!.ports
      })
    }
  }
  onConnectionChange(event:MatSelectChange){
    if( this.dataset ){
      var connectionName = this.FG.controls.connectionName.value  
      
      var obj ={
        connectionName:connectionName?connectionName:""
      }

      this.firebaseService.updateDoc( "Dataset", this.dataset.id, obj ).then( ()=>{
        console.log("save connecton")
        this.dataset.connectionName = connectionName?connectionName:""
      },
      reason =>{
        alert("ERROR saving sql:" + reason)
      })
    }
  }   
}

