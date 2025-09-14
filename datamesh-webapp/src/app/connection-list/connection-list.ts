import { Component,  OnDestroy, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { AuthService } from 'app/auth.service';
import { Connection } from 'app/datatypes/datatypes.module';
import { FirebaseService } from 'app/firebase.service';

@Component({
  selector: 'app-connection-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MatMenuModule,
    MatListModule
  ],
  templateUrl: './connection-list.html',
  styleUrl: './connection-list.css'
})
export class ConnectionList implements OnInit, OnDestroy {


  collection = "Connection"
  connections = signal<Array<Connection>|null>(null)
  unsubscribe:any
  

  constructor(private firestore:FirebaseService,
    private authService:AuthService ){
    
    
  }
  ngOnInit(): void {
    this.unsubscribe = this.firestore.onsnapShotQuery( this.collection, {
      next: (snapshot) =>{
        var connections:Array<Connection> = []
        snapshot.docs.map( doc =>{
          let c = doc.data() as Connection
          c.id = doc.id
          connections.push( c )
        },)
        this.connections.set(connections)
      },
      error: (reason) =>{
        alert("Error retriving connections:" + reason)
      },
      complete: () =>{
        console.log("do nothing")
      } 
    },
    "owner","==",this.authService.getUserUid()!)
  }
  ngOnDestroy(): void {
    if( this.unsubscribe ){
      this.unsubscribe()
    }
  }
}
