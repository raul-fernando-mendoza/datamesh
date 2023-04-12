import {Component, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Dataset, FileDataset, SnowFlakeDataset } from '../datatypes/datatypes.module';
import * as uuid from 'uuid';
import { StringUtilService } from '../string-util.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { FirebaseService } from '../firebase.service';


@Component({
  selector: 'app-dataset-create',
  templateUrl: './dataset-create.component.html',
  styleUrls: ['./dataset-create.component.css']
})
export class DatasetCreateComponent implements OnInit, OnDestroy{

  FG = this.fb.group({
    type:['',[Validators.required]],
    label:['',[Validators.required]],
    sql:[''],
    fileName:['']
  })

  id:string | null = null
  datasetGroupId:string | null = null
  unsubscribe:any

  constructor( 
    private fb:FormBuilder 
    ,private stringUtilService:StringUtilService
    ,private activatedRoute:ActivatedRoute
    ,private router:Router
    ,private firebaseService:FirebaseService
    ){

      if( this.activatedRoute.snapshot.paramMap.get('id') != 'null'){
        this.id = this.activatedRoute.snapshot.paramMap.get('id')
      }     
      if( this.activatedRoute.snapshot.paramMap.get('datasetGroupId') != 'null'){
        this.datasetGroupId = this.activatedRoute.snapshot.paramMap.get('datasetGroupId')
      }  
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
            let fileDataset:FileDataset = doc.data() as FileDataset
            this.FG.controls.fileName.setValue( fileDataset.fileName )
          }
          else{
            let snowFlakeDataset:SnowFlakeDataset = doc.data() as SnowFlakeDataset
            this.FG.controls.sql.setValue( snowFlakeDataset.sql ) 
          }
        }),
        "error":((reason)=>{

        })
      })
    }
  }

  onCreateNew(){
    this.createNew()
  }
  createNew():Promise<void>{
    let type=this.FG.controls.type.value
    if( type == "FileDataset"){
      let dataset:FileDataset ={
        id: uuid.v4(),
        type: 'FileDataset',
        label: this.FG.controls.label.value!,
        datasetGroupId: this.datasetGroupId!,
        fileName: this.FG.controls.fileName.value!,
        ports: []
      }
      return this.firebaseService.setDoc( "Dataset", dataset)
    }
    else {
      let dataset:SnowFlakeDataset ={
        id: uuid.v4(),
        type: 'SnowFlakeDataset',
        label: this.FG.controls.label.value!,
        datasetGroupId: this.datasetGroupId!,
        sql: this.FG.controls.sql.value!,
        ports: []
      }
      return this.firebaseService.setDoc( "Dataset", dataset)
    }
    
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
}
