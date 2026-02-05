import { Component,  OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { AuthService } from 'app/auth.service';
import { QueryItem } from 'app/datatypes/datatypes.module';
import { FirebaseService } from 'app/firebase.service';
import { DialogNameDialog } from 'app/name-dialog/name-dlg';
import { StringUtilService } from 'app/string-util.service';
import * as uuid from 'uuid';
import { ReportList } from './report-list';


interface IReportGroup{
  id?:string
  label?:string
  indexWords?:string[]
  owner?:string
  deleted?:boolean
  createon?:Date
  updateon?:Date  
}
class ReportGroup implements IReportGroup{
  public static collection = "ReportGroup"
  id!:string 
  label!:string 
  owner!:string
  deleted:boolean = false
  indexWords:string[] = []
  createon:Date = new Date()
  updateon:Date = new Date()
}

@Component({
  selector: 'reportgroup-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MatMenuModule,
    MatListModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReportList
  ],
  templateUrl: './reportgroup-list.html',
  styleUrl: './reportgroup-list.css'
})
export class ReportGroupList implements OnInit, OnDestroy {

  collection = ReportGroup.collection

  list = signal<Array<ReportGroup>|null>(null)
  unsubscribe:any

  searchFG = this.fb.group({
    term:['']
  })  


  constructor(public firestore:FirebaseService,
    private authService:AuthService,
    private dialog: MatDialog,
    private fb:FormBuilder,
    private stringUtilService:StringUtilService ){
    
    
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
      {fieldPath:"owner",opStr:"==",value:this.authService.getUserUid()!},
      {fieldPath:"deleted",opStr:"==",value:false}
    ]
    if( this.searchFG.controls.term.value ){
      let term:string = this.searchFG.controls.term.value!
      let termqry:QueryItem = {fieldPath:"indexWords",opStr:"array-contains",value:term.toLowerCase()}
      qry.push( termqry )
    }    

    this.unsubscribe = this.firestore.onsnapShotQuery( this.collection, 
      qry,
      {
      next: (snapshot) =>{
        var list:Array<ReportGroup> = []
        snapshot.docs.map( doc =>{
          let d = doc.data() as ReportGroup
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

  onNew(){
    const dialogRef = this.dialog.open(DialogNameDialog, {
      height: '400px',
      width: '250px',
      data: { label:"New report Group", name:""}
    });
  
    dialogRef.afterClosed().subscribe(data => {
      console.log('The dialog was closed');
      if( data ){
        console.debug( data )
        let id = uuid.v4()
        let indexWordsArray = this.stringUtilService.getWordIndexArray( data.name )
        let n:ReportGroup = {
          id: id,
          label: data.name,
          owner: this.authService.getUserUid()!,
          deleted: false,
          indexWords: indexWordsArray,
          createon: new Date,
          updateon: new Date
        }
        this.firestore.setDoc(this.collection,id, n).then( ()=>{
          console.log("Completed")
          },
          error=>{
            alert("Error creating new item")
          }
        )
      }
    })
  }  
  onSearch(){
    console.log("search started")
    this.update()
  }
  onCancelSearch(){
    this.searchFG.controls.term.setValue("")
    this.update()
  }


}
