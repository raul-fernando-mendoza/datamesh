import { Component, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import * as uuid from 'uuid';
import { StringUtilService } from '../string-util.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { FirebaseService } from '../firebase.service';
import { MatSelectChange } from '@angular/material/select';
import { UrlService } from '../url.service';
import { ConnectionsService } from 'app/connections.service';
import { Connection, ConnectionCollection } from 'app/datatypes/datatypes.module';


@Component({
  selector: 'app-connection-edit',
  templateUrl: './connection-edit.component.html',
  styleUrls: ['./connection-edit.component.css']
})
export class ConnectionEditComponent {

  connection:Connection|null = null
  id:string | null =null
  groupId:string|null = null

  FG = this.fb.group({
    label:['',[Validators.required]],
    description:[''],
    credentials:['',[Validators.required]],
  })


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
    this.update()
  }
  update(){
    if( this.id ){

      var req = {
        "collectionId": ConnectionCollection.collectionName,
        "id": this.id
      }
      this.urlService.post("getEncryptedDocument" , req).subscribe({
        'next':(result)=>{
          console.log( result )
          this.connection = result as Connection
          this.FG.controls.label.setValue( this.connection.label! )
          this.FG.controls.credentials.setValue( this.connection.credentials! )
        },
        'error':(reason)=>{
          alert("Error:" + reason)
        }
      })
    }  
  }

  getErrorMessage() {
    if (this.FG.controls.label.hasError('required')) {
      return 'You must enter a value';
    }

    return this.FG.controls.label.hasError('name') ? 'Not valid name' : '';
  }
  onCreateNew(){
    var id= uuid.v4()
    var thiz = this

    var groupId:string = this.groupId!

    var connection:Connection = {
      id:id,
      label:this.FG.controls.label.value ? this.FG.controls.label.value : "",
      credentials:this.FG.controls.credentials.value ? this.FG.controls.credentials.value : "",
      groupId:groupId
    }
    var req = {
      "collectionId": ConnectionCollection.collectionName,
      "id": id,
      "data": connection,
      "unencriptedFields":["id", "label","groupId"]
    }
    this.urlService.post("setEncryptedDocument" , req).subscribe({
      'next':(data)=>{
        thiz.id = id
        thiz.update()
      
      },
      'error':(reason)=>{
        alert("Error:" + reason)
      }
    })
  }  
  onCancel(){
    this.router.navigate(["/"])
  }
  onDelete(){
    if( this.id && this.connection){
      if( confirm("are you sure to delete:" + this.connection.label) ){
        this.firebaseService.deleteDoc(ConnectionCollection.collectionName, this.id ).then( ()=>{
          this.router.navigate(["/"])
        },
        reason =>{
          alert("Error removing connection:" + reason)
        })
      }
    }
  }  
  onCredentialsChange($event:any){
    var id= this.id
    var thiz = this

    var groupId:string = this.groupId!

    var connection:Connection = {
      credentials:this.FG.controls.credentials.value ? this.FG.controls.credentials.value : "",
    }
    var req = {
      "collectionId": ConnectionCollection.collectionName,
      "id": id,
      "data": connection,
      "unencriptedFields":["id", "label","groupId"]
    }
    this.urlService.post("setEncryptedDocument" , req).subscribe({
      'next':(data)=>{
        thiz.id = id
        thiz.update()
      
      },
      'error':(reason)=>{
        alert("Error:" + reason)
      }
    })
  }
}
