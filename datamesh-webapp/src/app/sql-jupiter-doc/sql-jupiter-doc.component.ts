import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SqlJupiter, SqlJupiterDoc } from '../datatypes/datatypes.module';
import { FirebaseService } from '../firebase.service';
import { collection, doc, deleteDoc , getDoc,  onSnapshot, getDocs, query, setDoc, updateDoc, DocumentData, DocumentSnapshot} from "firebase/firestore"; 
import { db } from '../../environments/environment'
import * as uuid from 'uuid';


@Component({
  selector: 'app-sql-jupiter-doc',
  templateUrl: './sql-jupiter-doc.component.html',
  styleUrls: ['./sql-jupiter-doc.component.css']
})
export class SqlJupiterDocComponent {
  
  unsubscribe:any
  id:string | null = ""
  sqlJupiterDoc:SqlJupiterDoc|null = null
  groupId:string|null = null
  submitting = false


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
                  this.sqlJupiterDoc=docRef.data() as SqlJupiterDoc
                  this.FG.controls.label.setValue( this.sqlJupiterDoc.label!)
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
        this.firebaseService.deleteDoc(SqlJupiterDoc.name, this.sqlJupiterDoc.id ).then( ()=>{
          this.router.navigate(["/"])
        })
      }
    }
  }  
  onCreateNew(){
    if( this.groupId ){
      var sqlJupiterDoc:SqlJupiterDoc={
        id: uuid.v4(),
        label: this.FG.controls.label.value!,
        groupId: this.groupId,
        sqlJupiterList:[]
      }
      
      setDoc( doc(db, "SqlJupiterDoc" , sqlJupiterDoc.id), sqlJupiterDoc).then( () =>{
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
      var newSqlJupiter:SqlJupiter = {
        sql:"select 1 from dual limit 100",
        result:null
      }
      this.sqlJupiterDoc.sqlJupiterList.splice(idx,0,newSqlJupiter)
      this.save()
    }
  }
  onSqlChangeItem($event:any, idx:number){
    console.log($event)

    if( this.sqlJupiterDoc ){
      this.sqlJupiterDoc.sqlJupiterList[idx] = $event
      this.save()
    }
  }
  onSqlDelete($event:any, idx:number){
    console.log($event)

    if( this.sqlJupiterDoc ){
      this.sqlJupiterDoc.sqlJupiterList[idx] = $event
      if( this.sqlJupiterDoc ){
        this.sqlJupiterDoc.sqlJupiterList.splice(idx, 1);
        this.save()
      }      
    }
  }
  save(){
    if( this.sqlJupiterDoc ){
      this.submitting = true
      var values ={
        sqlJupiterList:this.sqlJupiterDoc.sqlJupiterList
      }
      if( this.id ){
        this.firebaseService.updateDoc('SqlJupiterDoc',this.id, values).then( ()=>{
          this.submitting = false
          console.log("success saving data")
        },
        reason =>{
          this.submitting = false
          alert("Error saving doc:" + reason)
        })
      }
    }
  }



}

