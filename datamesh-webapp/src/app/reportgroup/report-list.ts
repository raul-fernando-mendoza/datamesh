import { Component,  Input , OnDestroy, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { AuthService } from 'app/auth.service';
import { QueryItem } from 'app/datatypes/datatypes.module';
import { FirebaseService } from 'app/firebase.service';


class Report{
  public static collection = "Report"
  id!:string
  label!:string
  reportGroupId!:string
  deleted!:boolean
  createon!:Date
  updateon!:Date  
}

@Component({
  selector: 'report-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MatMenuModule,
    MatListModule,
  ],
  templateUrl: './report-list.html',
  styleUrl: './report-list.css'
})
export class ReportList implements OnInit, OnDestroy {
  @Input() groupId:String = ""
  collection = Report.collection

  list = signal<Array<Report>|null>(null)
  unsubscribe:any


  constructor(public firestore:FirebaseService,
    private authService:AuthService,
 ){
    
    
  }
  ngOnInit(): void {
    this.update()
  }

  update(){
    if( this.unsubscribe ){
      this.unsubscribe()
    }
    console.log("getUserUid()" + this.authService.getUserUid())

    let qry:Array<QueryItem> = [
      {fieldPath:"reportGroupId",opStr:"==",value:this.groupId.toString()},
      {fieldPath:"owner",opStr:"==",value:this.authService.getUserUid()!},
      {fieldPath:"deleted",opStr:"==",value:false}
    ]

    this.unsubscribe = this.firestore.onsnapShotQuery( this.collection, 
      qry,
      {
      next: (snapshot) =>{
        var list:Array<Report> = []
        snapshot.docs.map( doc =>{
          let d = doc.data() as Report
          d.id = doc.id
          list.push( d )
        },)
        list.sort( (a,b) =>{ return a.createon > b.createon?-1:1})
        this.list.set(list)
      },
      error: (reason) =>{
        alert("Error retriving recordset:" + reason)
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
