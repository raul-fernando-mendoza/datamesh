import { Component,  Input,  OnDestroy, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { AuthService } from 'app/auth.service';
import { JupiterDoc } from 'app/datatypes/datatypes.module';
import { FirebaseService } from 'app/firebase.service';

@Component({
  selector: 'sqljupiterdoc-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MatMenuModule,
    MatListModule
  ],
  templateUrl: './sqljupiterdoc-list.html',
  styleUrl: './sqljupiterdoc-list.css'
})
export class SqlJupiterDocList implements OnInit, OnDestroy {
  @Input() groupId!:string

  collection = "SqlJupiterDoc"
  jupiterDocList = signal<Array<JupiterDoc>|null>(null)
  unsubscribe:any
  

  constructor(private firestore:FirebaseService,
    private authService:AuthService ){
    
    
  }
  ngOnInit(): void {
    console.log("getUserUid()" + this.authService.getUserUid())
    this.unsubscribe = this.firestore.onsnapShotQuery( this.collection, 
      [
        {fieldPath:"groupId",opStr:"==",value:this.groupId},
        {fieldPath:"owner",opStr:"==",value:this.authService.getUserUid()!}
      ],
      {
      next: (snapshot) =>{
        var sqlJupiterList:Array<JupiterDoc> = []
        snapshot.docs.map( doc =>{
          let j = doc.data() as JupiterDoc
          j.id = doc.id
          sqlJupiterList.push( j )
        },)
        this.jupiterDocList.set(sqlJupiterList)
      },
      error: (reason) =>{
        alert("Error retriving connections:" + reason)
      },
      complete: () =>{
        console.log("do nothing")
      } 
    }
    )
  }
  ngOnDestroy(): void {
    if( this.unsubscribe ){
      this.unsubscribe()
    }
  }
}
