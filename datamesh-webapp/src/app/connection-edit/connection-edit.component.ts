import { Component, OnDestroy, OnInit, signal} from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import * as uuid from 'uuid';
import { StringUtilService } from '../string-util.service';
import { ActivatedRoute, Route, Router, RouterModule } from '@angular/router';
import { FirebaseService } from '../firebase.service';
import {MatSelectModule} from '@angular/material/select';
import { UrlService } from '../url.service';
import { ConnectionsService } from 'app/connections.service';
import { Connection, ConnectionCollection } from 'app/datatypes/datatypes.module';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IfStmt } from '@angular/compiler';
import { AuthService } from 'app/auth.service';


@Component({
    selector: 'app-connection-edit',
    templateUrl: './connection-edit.component.html',
    styleUrls: ['./connection-edit.component.css'],
    imports: [
      CommonModule,
        MatIconModule,
        MatButtonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        RouterModule,
        MatProgressSpinnerModule
    ]
})
export class ConnectionEditComponent implements OnInit, OnDestroy{

  connection:any 
  id = signal("")

  FG = this.fb.group({
    label:['',[Validators.required]],
    credentials:[''],
  })

  unsubscribe:any


  constructor( 
    private fb:FormBuilder 
   ,private activatedRoute:ActivatedRoute
   ,private router:Router
   ,public firebaseService:FirebaseService
   ,private urlService:UrlService
   ,public connectionsService:ConnectionsService
   ,private authService:AuthService

   ){
    this.activatedRoute.params.subscribe(res => {
      if("id" in res){
        console.log("change id" + res["id"])
        this.id.set(res["id"])
      }
    })      
  }  
  ngOnDestroy(): void {
    if( this.unsubscribe ){
      this.unsubscribe()
    }
  }
    



  ngOnInit(): void {
    if( this.id() ){
      this.unsubscribe = this.firebaseService.onsnapShot(ConnectionCollection.collectionName, this.id(), {
        next:(doc)=>{
          this.update()
        },
        error:(reason)=>{
          alert("Error loading connection" + reason)
        },
        complete:()=>{
          console.log("do nothing")
        }
      })
    }
  }
  update(){
    console.log("running update")
    if( this.id() ){
      var req = {
        "collectionId": ConnectionCollection.collectionName,
        "id": this.id()
      }
      this.urlService.post("getEncryptedDocument" , req).subscribe({
        'next':(obj)=>{
          
          let connection = obj as Connection
          
          this.FG.controls.label.setValue( connection.label! )
          this.FG.controls.credentials.setValue( connection.credentials! )
          console.log("setting new connection:" + connection)
          this.connection = signal( connection )
        },
        'error':(reason)=>{
          alert("Error:" + reason)
        }
      })
    }  
  }

  getErrorMessage(control:FormControl) {
    if (control.hasError('required')) {
      return 'You must enter a value';
    }

    return control.hasError('name') ? 'Not valid name' : '';
  }
  onCreateNew(){
    var id= uuid.v4()

    var connection:Connection = {
      id:id,
      label:this.FG.controls.label.value ? this.FG.controls.label.value : "",
      credentials:this.FG.controls.credentials.value ? this.FG.controls.credentials.value : "",
      owner:this.authService.getUserUid()!
    }
    var req = {
      "collectionId": ConnectionCollection.collectionName,
      "id": id,
      "data": connection,
      "owner":this.authService.getUserUid(),
      "unencriptedFields":["id", "label","groupId", "owner"]
    }
    this.urlService.post("setEncryptedDocument" , req).subscribe({
      'next':(data)=>{
        this.router.navigate(["/connection/edit",id])
      },
      'error':(reason)=>{
        alert("Error creando nuevo:" + reason)
      }
    })
  }  
  onDelete(){
    let id:string = this.id()
    if( confirm("are you sure to delete:" + this.connection().label) ){
      this.firebaseService.deleteDoc(ConnectionCollection.collectionName, id ).then( ()=>{
        this.router.navigate(["/connection/list"])
      },
      reason =>{
        alert("Error removing connection:" + reason)
      })
    }
  }  
  onCredentialsChange($event:any){
    var id= this.id()

    var connection:Connection = {
      credentials:this.FG.controls.credentials.value ? this.FG.controls.credentials.value : "",
    }
    var req = {
      "collectionId": ConnectionCollection.collectionName,
      "id": id,
      "data": connection,
      "owner":this.connection().owner,
      "unencriptedFields":["id", "label","groupId"]
    }
    this.urlService.post("setEncryptedDocument" , req).subscribe({
      'next':(data)=>{
          console.log("modified")
      },
      'error':(reason)=>{
        alert("Error:" + reason)
      }
    })
  }
}
