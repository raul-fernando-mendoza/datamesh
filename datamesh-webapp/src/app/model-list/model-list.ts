import { Component,  OnDestroy, OnInit, signal } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon-module.d';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { Model, ModelCollection } from 'app/datatypes/datatypes.module';
import { FirebaseService } from 'app/firebase.service';
import { UserLoginService } from 'app/user-login.service';

@Component({
  selector: 'app-model-list',
  imports: [
    MatListModule,
    MatButtonModule,
    MatIconModule,
    RouterModule],
  templateUrl: './model-list.html',
  styleUrl: './model-list.css'
})
export class ModelList  implements OnInit, OnDestroy{
  collection = ModelCollection.collectionName
  models = signal<Array<Model>|null>(null)
  unsubscribe:any
  

  constructor(private firestore:FirebaseService,
    private userLoginService: UserLoginService ){
    
    
  }
  ngOnInit(): void {
    let userid = this.userLoginService.getUserUid();
    this.unsubscribe = this.firestore.onsnapShotQuery( this.collection, [],{
      next: (snapshot) =>{
        var models:Array<Model> = []
        snapshot.docs.map( doc =>{
          let m = doc.data() as Model
          m.id = doc.id
          models.push( m )
        },)
        this.models.set(models)
      },
      error: (reason) =>{
        alert("Error retriving connections:" + reason)
      },
      complete: () =>{
        console.log("do nothing")
      } 
    },
    "owner","==",userid!)
  }
  ngOnDestroy(): void {
    if( this.unsubscribe ){
      this.unsubscribe()
    }
  }
}
