import { Component,  OnDestroy, OnInit, signal } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { AuthService } from 'app/auth.service';
import { Model, ModelCollection } from 'app/datatypes/datatypes.module';
import { FirebaseService } from 'app/firebase.service';

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
    private authService: AuthService ){
    
    
  }
  ngOnInit(): void {
    let userid = this.authService.getUserUid();
    this.unsubscribe = this.firestore.onsnapShotQuery( this.collection, [{fieldPath:"owner",opStr:"==",value:userid!}],{
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
    })
  }
  ngOnDestroy(): void {
    if( this.unsubscribe ){
      this.unsubscribe()
    }
  }
}
