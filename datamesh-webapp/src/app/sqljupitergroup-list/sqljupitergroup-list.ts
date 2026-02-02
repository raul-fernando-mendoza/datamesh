import { Component,  OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { AuthService } from 'app/auth.service';
import { QueryItem, SqlJupiterGroup } from 'app/datatypes/datatypes.module';
import { FirebaseService } from 'app/firebase.service';
import { DialogNameDialog } from 'app/name-dialog/name-dlg';
import { SqlJupiterDocList } from 'app/sqljupiterdoc-list/sqljupiterdoc-list';
import { StringUtilService } from 'app/string-util.service';
import * as uuid from 'uuid';

@Component({
  selector: 'sqljupitergroup-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MatMenuModule,
    MatListModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,

    SqlJupiterDocList
  ],
  templateUrl: './sqljupitergroup-list.html',
  styleUrl: './sqljupitergroup-list.css'
})
export class SqlJupiterGroupList implements OnInit, OnDestroy {


  collection = "SqlJupiterGroup"
  sqlJupiterGroupList = signal<Array<SqlJupiterGroup>|null>(null)
  unsubscribe:any

  renamedId = signal<string|null>(null)

  FG = this.fb.group({
    label:['']
  })  

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
      {fieldPath:"owner",opStr:"==",value:this.authService.getUserUid()!}
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
        var sqlJupiterGroupList:Array<SqlJupiterGroup> = []
        snapshot.docs.map( doc =>{
          let jg = doc.data() as SqlJupiterGroup
          jg.id = doc.id
          sqlJupiterGroupList.push( jg )
        },)
        sqlJupiterGroupList.sort( (a,b) =>{ return a.createon > b.createon?-1:1})
        this.sqlJupiterGroupList.set(sqlJupiterGroupList)
      },
      error: (reason) =>{
        alert("Error retriving sqljupitergroups:" + reason)
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

  onNewGroup(){
    const dialogRef = this.dialog.open(DialogNameDialog, {
      height: '400px',
      width: '250px',
      data: { label:"new group", name:""}
    });
  
    dialogRef.afterClosed().subscribe(data => {
      console.log('The dialog was closed');
      if( data ){
        console.debug( data )
        let id = uuid.v4()
        let indexWordsArray = this.stringUtilService.getWordIndexArray( data.label )
        let g:SqlJupiterGroup = {
          id: id,
          label: data.label,
          owner: this.authService.getUserUid()!,
          deleted: false,
          indexWords: indexWordsArray,
          createon: new Date,
          updateon: new Date
        }
        this.firestore.setDoc("SqlJupiterGroup",id, g).then( ()=>{
          console.log("Completed")
          },
          error=>{
            alert("Error creating group")
          }
        )
      }
    })
  }  
  onDeleteSqlJupiterGroup( jg:SqlJupiterGroup ){
    if( confirm("are you sure to delete:" + jg.label) ){
      this.firestore.deleteDoc("SqlJupiterGroup", jg.id ).then( ()=>{
        console.log("completed")
      },
      error=>{
        alert("there has been an error when deleting the SqlJupiterGroup")
      })
    }
  }
  onRenameClick( jg:SqlJupiterGroup ){
    this.FG.controls.label.setValue(jg.label)
    this.renamedId.set(jg.id)
  }

  onUpdateGroupLabel(jg:SqlJupiterGroup){
    let id:string = this.renamedId()!
    let label:string = this.FG.controls.label.value!
    let indexWordsArray = this.stringUtilService.getWordIndexArray( label )
    let obj = {
      label:label,
      indexWords: indexWordsArray
    }
    this.firestore.updateDoc("SqlJupiterGroup", id , obj).then( ()=>{
      console.log("update completed")
      this.renamedId.set(null)
    },
    error=>{
      alert("the group label can not be changed")
    })
  }

  onCancelEdit(){
    this.renamedId.set(null)
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
