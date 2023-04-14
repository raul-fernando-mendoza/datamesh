import {Component, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Dataset, FileDataset, Port, PortListResponse, SnowFlakeDataset } from '../datatypes/datatypes.module';
import * as uuid from 'uuid';
import { StringUtilService } from '../string-util.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { FirebaseService } from '../firebase.service';
import { MatSelectChange } from '@angular/material/select';
import { UrlService } from '../url.service';


@Component({
  selector: 'app-dataset-create',
  templateUrl: './dataset-create.component.html',
  styleUrls: ['./dataset-create.component.css']
})
export class DatasetCreateComponent implements OnInit, OnDestroy{

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
    fileName:['',[]]

  })

  id:string | null = null
  datasetGroupId:string | null = null
  unsubscribe:any
  
  dataset:FileDataset|SnowFlakeDataset|undefined

  datasource:Port[] = []

  constructor( 
     private fb:FormBuilder 
    ,private stringUtilService:StringUtilService
    ,private activatedRoute:ActivatedRoute
    ,private router:Router
    ,public firebaseService:FirebaseService
    ,private urlService:UrlService
    ){

      if( this.activatedRoute.snapshot.paramMap.get('id') != 'null'){
        this.id = this.activatedRoute.snapshot.paramMap.get('id')
      }     
      if( this.activatedRoute.snapshot.paramMap.get('datasetGroupId') != 'null'){
        this.datasetGroupId = this.activatedRoute.snapshot.paramMap.get('datasetGroupId')
      }  

      this.activatedRoute.params.subscribe(res => {
        if("id" in res){
          this.id = res["id"]
          if( this.unsubscribe ){
            this.unsubscribe()
          }  
          this.update()
        }  
        else if("datasetGroupId" in res){
          this.datasetGroupId = res["datasetGroupId"]
        }
      })      
  }
  ngOnDestroy(): void {
    this.unsubscribe()
  }
  ngOnInit(): void {
    this.update()
  }

  update(){
    if( this.id ){
      this.unsubscribe = this.firebaseService.onsnapShot("Dataset", this.id, {
        "next":((doc)=>{
          let dataset:Dataset = doc.data() as Dataset

          this.FG.controls.type.setValue( dataset.type )
          this.FG.controls.label.setValue( dataset.label )
          

          if( dataset.type === "FileDataset"){
            this.dataset = doc.data() as FileDataset
            this.FG.controls.fileName.setValue( dataset.fileName )
          }
          else{
            this.dataset = doc.data() as SnowFlakeDataset
            this.FG.controls.sql.setValue( this.dataset.sql )
          }

          this.datasource = this.dataset.ports
        }),
        "error":((reason)=>{
          alert("ERROR:" + reason)
        })
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
    let dataset = {
      id:uuid.v4(),
      type: this.FG.controls.type.value,
      label: this.FG.controls.label.value!,
      datasetGroupId: this.datasetGroupId!,
      fileName: this.FG.controls.fileName.value!,
      sql:this.FG.controls.sql.value!,
      ports: []
    }
    return this.firebaseService.setDoc( "Dataset", dataset.id, dataset).then( () =>{
      this.id = dataset.id
      this.update()
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
        
        param = {"qry":(this.dataset! as SnowFlakeDataset).sql }
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
              reject(reason)
            }
          })
    
    })
    
  }

  onPortChange($event:any, port:Port){
    port.datatype = $event.value
    this.firebaseService.updateDoc( "Dataset", this.id!, {ports:this.dataset!.ports})
  }
}

