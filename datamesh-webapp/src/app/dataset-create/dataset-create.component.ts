import { Component, Inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { db } from 'src/environments/environment';
import { Dataset } from '../datatypes/datatypes.module';
import * as uuid from 'uuid';
import { collection, addDoc, doc, setDoc, updateDoc } from "firebase/firestore"; 
import { StringUtilService } from '../string-util.service';

@Component({
  selector: 'app-dataset-create',
  templateUrl: './dataset-create.component.html',
  styleUrls: ['./dataset-create.component.css']
})
export class DatasetCreateComponent {

  FG = this.fb.group({
    id:[''],
    label:[''],
    sql:['']
  })
  constructor( 
    private fb:FormBuilder 
    ,public dialogRef: MatDialogRef<DatasetCreateComponent>
    ,private stringUtilService:StringUtilService
    ,@Inject(MAT_DIALOG_DATA) public data:Dataset
    ){
      if( data ){
        this.FG.controls.id.setValue(data.id)
        this.FG.controls.label.setValue(data.label)
        this.FG.controls.sql.setValue(data.sql)
      }
  }

  createQry(dataset:Dataset):Promise<string>{
    return new Promise<string>((resolve, reject) =>{

      setDoc(doc(db, "Dataset",dataset.id), dataset).then( doc =>{
        console.log("Document written with ID: ", dataset.id)
        resolve( dataset.id )
      },
      reason =>{
        alert("Error createQry:" + reason)
        reject(reason)
      })

    })
  }
  updateQry(dataset:Dataset):Promise<string>{
    return new Promise<string>((resolve, reject) =>{
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

    })
  }

  async onSubmit(){

    if( this.data ){
      var dataset:Dataset={
        id:this.data.id,
        label:this.FG.controls.label.value,
        sql:this.FG.controls.sql.value
      }      
      this.updateQry(dataset).then( ()=>{
        console.log("Dataset updated")
        this.dialogRef.close(this.data.id)
      })
    }
    else{
      var dataset:Dataset={
        id:uuid.v4(),
        label:this.FG.controls.label.value,
        sql:this.FG.controls.sql.value
      }
      this.createQry( dataset ).then( id =>{
        console.log("create dataset success:" + id)
        this.dialogRef.close(id)
      })
    }  
  }


}
