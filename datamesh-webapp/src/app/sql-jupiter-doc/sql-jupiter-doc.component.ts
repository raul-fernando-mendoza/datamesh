import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SqlJupiter, JupiterDoc, TextJupiter, DatasetGroup, SqlJupiterObj } from '../datatypes/datatypes.module';
import { FirebaseService } from '../firebase.service';
import { collection, doc, deleteDoc , getDoc,  onSnapshot, getDocs, query, setDoc, updateDoc, DocumentData, DocumentSnapshot} from "firebase/firestore"; 
import { db } from '../../environments/environment'
import * as uuid from 'uuid';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TextJupiterComponent } from 'app/text-jupiter/text-jupiter.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SqlJupiterEditComponent } from 'app/sql-jupiter-edit/sql-jupiter-edit.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sql-jupiter-doc',
  templateUrl: './sql-jupiter-doc.component.html',
  styleUrls: ['./sql-jupiter-doc.component.css'],
  standalone: true,
  imports:[
    CommonModule,
    MatIconModule,
    MatButtonModule,
    TextJupiterComponent,
    FormsModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    SqlJupiterEditComponent
  ]  
})
export class SqlJupiterDocComponent {
  
  unsubscribe:any
  id:string | null = ""
  sqlJupiterDoc:JupiterDoc|null = null
  groupId:string|null = null
  submitting = false
  parentCollection:string|null = null

  sqlJupiterGroup:DatasetGroup|null = null

  FG = this.fb.group({
    id:[''],
    label:['']
  })

  constructor(
    private router:Router
    ,private activatedRoute: ActivatedRoute
    ,private fb:FormBuilder
    ,public firebaseService:FirebaseService
  ){
    this.activatedRoute.params.subscribe(res => {
      if("id" in res){
        this.id = res["id"]
        this.parentCollection = "SqlJupiterDoc/" + this.id 
        this.update()
      }  
      else if("groupId" in res){
        this.groupId = res["groupId"]
      }      
    })      
  }
  update(){
    if( this.id ){
      if( this.unsubscribe ){
        this.unsubscribe()
      }        
      this.unsubscribe = onSnapshot( doc( db, "SqlJupiterDoc", this.id ),
          (docRef) =>{
                if( docRef.exists()){
                  this.sqlJupiterDoc=docRef.data() as JupiterDoc
                  this.FG.controls.label.setValue( this.sqlJupiterDoc.label!)

                  var thiz = this
                  this.firebaseService.getdoc("SqlJupiterGroup",this.sqlJupiterDoc.groupId).then( data =>{
                    thiz.sqlJupiterGroup = data.data() as DatasetGroup
                     

                  })
                }
          },
          (reason:any) =>{
              alert("ERROR update comparison list:" + reason)
          }  
      )
    }
  }  

  onDelete(){
    if( this.sqlJupiterDoc ){
      if( confirm("are you sure to delete:" + this.sqlJupiterDoc.label) ){
        this.firebaseService.deleteDoc("SqlJupiterDoc", this.sqlJupiterDoc.id ).then( ()=>{
          this.router.navigate(["/"])
        },
        reason=>{
          alert("error deleting doc:" + reason)
        })
      }
    }
  }  
  onCreateNew(){
    if( this.groupId ){
      var sqlJupiterDoc:JupiterDoc={
        id: uuid.v4(),
        label: this.FG.controls.label.value!,
        groupId: this.groupId,
        itemList:[]
      }
      
      this.firebaseService.setDoc( "SqlJupiterDoc" , sqlJupiterDoc.id, sqlJupiterDoc).then( () =>{
        console.log("created")
        this.id = sqlJupiterDoc.id!
        this.sqlJupiterDoc = sqlJupiterDoc  
        this.router.navigate(["SqlJupiterDoc","edit",this.sqlJupiterDoc.id])    
      },
      reason =>{
        alert("ERROR:" + reason )
      })
    }  
  }   

  onCancel(){
    this.router.navigate(["/"])
  }  
  onAddSqlJupiter(idx:number){
    if( this.sqlJupiterDoc ){
      let thiz = this
      var newSqlJupiter:SqlJupiterObj = {
        id: uuid.v4(),
        className: "SqlJupiter",
        sql: "",
        connectionId: null,
        request_id: null,
        request_status: "",
        request_start_time: null,
        request_completion_time: null,
        result_set: null,
        result_metadata: null
      }
      this.firebaseService.setDoc( 'SqlJupiterDoc/'+this.id+"/SqlJupiter", newSqlJupiter.id, newSqlJupiter).then( () =>  {      
        thiz.sqlJupiterDoc!.itemList.splice(idx,0,{className:"SqlJupiter", id:newSqlJupiter.id})
        thiz.submitting = false
        thiz.save().then( () =>{
          console.log("success saving data")
        })
        
      },
      reason =>{
        thiz.submitting = false
        alert("Error saving doc:" + reason)
      })
    }
  }
  onAddTextJupiter(idx:number){
    if( this.sqlJupiterDoc ){
      let thiz = this
      var newTxtJupiter:TextJupiter = {
        id: uuid.v4(),
        className: "TextJupiter",
        txt: "hello"
      }
      this.firebaseService.setDoc( 'SqlJupiterDoc/'+this.id+"/TextJupiter", newTxtJupiter.id, newTxtJupiter).then( () =>  {      
        thiz.sqlJupiterDoc!.itemList.splice(idx,0,{className:"TextJupiter", id:newTxtJupiter.id})
        thiz.submitting = false
        thiz.save().then( () =>{
          console.log("success saving data")
        })
        
      },
      reason =>{
        thiz.submitting = false
        alert("Error saving doc:" + reason)
      })
    }
  }
  onSqlDelete(idx:number){

    if( this.sqlJupiterDoc ){
      let item = this.sqlJupiterDoc.itemList[idx] 
      this.firebaseService.deleteDoc( "SqlJupiterDoc/" + this.sqlJupiterDoc.id + "/" + item.className,item.id ).then( ()=>{
        this.sqlJupiterDoc!.itemList.splice(idx, 1);
        this.save()
      })
    }
  }
  save():Promise<void>{
    return new Promise<void>( (resolve, reject ) =>{
      if( this.sqlJupiterDoc ){
        this.submitting = true
        var values ={
          itemList:this.sqlJupiterDoc.itemList
        }
        if( this.id ){
          this.firebaseService.updateDoc('SqlJupiterDoc',this.id, values).then( ()=>{
            this.submitting = false
            console.log("success saving data")
            resolve()
          },
          reason =>{
            this.submitting = false
            alert("Error saving doc:" + reason)
            reject()
          })
        }
      }
    })
  }



}

