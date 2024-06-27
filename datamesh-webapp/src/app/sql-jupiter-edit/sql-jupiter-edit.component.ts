import { AfterViewInit, Component, Input ,OnDestroy, OnInit} from '@angular/core';
import { Connection, SqlJupiter, SqlJupiterObj, SqlResultCollection, SqlResultObj } from '../datatypes/datatypes.module';
import { FirebaseService } from '../firebase.service';
import { db } from '../../environments/environment'
import { FormBuilder } from '@angular/forms';
import { UrlService } from '../url.service';
import { ngxCsv } from 'ngx-csv/ngx-csv';
import { CommonModule, DATE_PIPE_DEFAULT_TIMEZONE, DOCUMENT } from '@angular/common';
import { MatSelectChange } from '@angular/material/select';
import { DialogNameDialog } from '../name-dialog/name-dlg';
import { MatDialog } from '@angular/material/dialog';
import { ConnectionsService } from 'app/connections.service';
import { SqlEditComponent } from 'app/sql-edit/sql-edit.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import * as uuid from 'uuid';
import { Timestamp } from 'firebase/firestore';
import { interval } from 'rxjs';
import { highlightSpecialChars } from '@codemirror/view';


interface Transaction {
  item: string;
  cost: number;
}

const SUFFIX = "_2"

@Component({
  selector: 'app-sql-jupiter-edit',
  templateUrl: './sql-jupiter-edit.component.html',
  styleUrls: ['./sql-jupiter-edit.component.css'],
  standalone: true,
  imports:[
    CommonModule,
    MatButtonModule,
    MatIconModule,    
    FormsModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule, 
    SqlEditComponent,
    MatSelectModule
  ]
})
export class SqlJupiterEditComponent implements OnInit, AfterViewInit, OnDestroy{
  @Input() parentCollection!:string
  @Input() collection!:string
  @Input() id!:string

  MIN_ROWS = 3
  MAX_ROWS = 20
  unsubscribe:any 
  unsubscribeResult:any
  sqlJupiter:SqlJupiterObj | null = null 

  sqlResult:SqlResultObj | null= null

  rows = this.MIN_ROWS

  displayedColumns = ['position', 'name', 'weight', 'symbol'];
  dataSource = [];



  submitting = false
  FG = this.fb.group({
    sql:[''],
    connectionId:['']
  })

  elapsedTime:string = ""
  elapsedSubscriber:any

  activeRequestStatuses = new Set(["requested","assigned",'inprogress'])
  activeResultStatuses = new Set(['requested','assigned','inprogress']);
  

  connections:Array<Connection> = []

  request_id:string | undefined = undefined

  constructor(
    public firebaseService:FirebaseService,
    private fb:FormBuilder,
    public connectionsService:ConnectionsService,
    private dialog: MatDialog,
  ) {

  }
  ngAfterViewInit(): void {
    console.log( this.parentCollection )
    console.log( this.collection )
    console.log( this.id )
    this.update()
  }
  ngOnDestroy(): void {
    if( this.unsubscribe ){
      this.unsubscribe()
    }
    if( this.unsubscribeResult ){
      this.unsubscribeResult()
    }
  }

  update(){
    if( this.unsubscribe ){
      this.unsubscribe()
    }
    this.unsubscribe = this.firebaseService.onsnapShot( this.parentCollection + "/" + this.collection , this.id, 
    {
      "next":( (doc) =>{
        this.sqlJupiter = doc.data() as SqlJupiterObj
        //this.rows = this.sqlJupiter.sql.split('\n').length > this.MAX_ROWS ? this.MAX_ROWS : this.MIN_ROWS 
        this.FG.controls.sql.setValue( this.sqlJupiter.sql )
        this.FG.controls.connectionId.setValue( this.sqlJupiter.connectionId )
        this.displayedColumns = ["idx"]
        if( this.sqlJupiter.request_id && this.request_id != this.sqlJupiter.request_id){
          this.request_id = this.sqlJupiter.request_id
          this.readResults(this.sqlJupiter.request_id)
        }
        

        if( this.elapsedSubscriber ){
          clearInterval( this.elapsedSubscriber )
        }

        if(this.activeRequestStatuses.has(this.sqlJupiter.request_status)){
          this.elapsedSubscriber = interval(1000)

          let thiz = this

          this.elapsedSubscriber.subscribe( 
            { 'next':() =>{
              thiz.updateElapsedTime()
            }
          }) 
        }
        
      }),
      "error":( (reason)=>{
        alert("Error:" + reason)
      })
    })
  }

  readResults(request_id:string){
    if( this.unsubscribeResult ){
      this.unsubscribeResult()
    }
    if( this.sqlResult ){
      this.sqlResult.result_set = undefined
    }
    this.unsubscribeResult = this.firebaseService.onsnapShot( [this.parentCollection, this.collection, this.id, SqlResultCollection.collectionName].join("/"), request_id, 
    {
      "next":( (doc) =>{
        if( doc.exists() ){
          this.sqlResult = doc.data() as SqlResultObj
          this.displayedColumns = ["idx"] 
        }
      })
      ,"error":( (reason)=>{
        alert("Errorr reading results:" + "")
      })
    })   
  }
  ngOnInit(): void {
    this.connectionsService.getConnections().then( (connections) =>{
      this.connections.length = 0
      connections.map( e =>{
        this.connections.push( e )
      })
       
    } )
  }    
  
  onSqlChange($event:any){
    console.log($event)
    var sql:string|null = this.FG.controls.sql.value
    if( this.sqlJupiter && this.sqlJupiter.sql != sql){
      let obj = {
        sql:sql
      }
      this.firebaseService.updateDoc( this.parentCollection + "/" + this.collection , this.id, obj).then( ()=>{
        console.log("save sql")
      },
      reason =>{
        alert("ERROR saving sql:" + reason)
      })

    } 
    return true  
  }
  onExecute(){

    if( this.sqlJupiter && this.sqlJupiter.request_id){
      this.firebaseService.deleteDoc( [this.parentCollection, this.collection, this.id, SqlResultCollection.collectionName].join("/"), this.sqlJupiter.request_id).then( ()=>{
        console.log("remove all values")
      },
      reason =>{
        alert("ERROR removing old results:" + reason)
      })    
    }

    if( this.sqlResult ){
      this.sqlResult.result_status = null
    }
    
    var sql:string|null = this.FG.controls.sql.value
    let sqlJupiter:SqlJupiter = {
      request_id:uuid.v4(),
      request_status:"requested",
      request_start_time:Timestamp.now(),
      request_error_message:""
    }
    this.firebaseService.updateDoc( this.parentCollection + "/" + this.collection , this.id, sqlJupiter).then( ()=>{
      console.log("request execution")
    },
    reason =>{
      alert("ERROR request execution:" + reason)
    })
  }

  onExportCsv(){
    const dialogRef = this.dialog.open(DialogNameDialog, {
      height: '400px',
      width: '250px',
      data: { label:"csv file name", name:""}
    });
  
    dialogRef.afterClosed().subscribe(data => {
      console.log('The dialog was closed');
      if( data != undefined ){
        console.debug( data )
        this.exportCsv( data.name )
      }
    })
  }
  exportCsv(filename:string){
    
 
    if( this.sqlResult && this.sqlResult.result_set && this.sqlResult.result_metadata){

      let json = this.sqlResult.result_set
      

      let metadata = this.sqlResult.result_metadata
      let keys:Array<string> = []
      for( let i=0; i<metadata.length; i ++){
        keys.push(metadata[i]["name"])
      }      

      var options = { 
        fieldSeparator: ',',
        quoteStrings: '"',
        decimalseparator: '.',
        showLabels: true, 
        showTitle: false,
        title: filename,
        useBom: true,
        noDownload: false,
        headers: keys,
        filename:filename
      };   



      let finalJsonArray = []
      for( let j of json){
        let new_j:any = {}
        for( let i=0; i < keys.length; i++){
          let val = j[i]
          if( 8 == metadata[i]["type_code"] && val){
            if( val.endsWith(' 00:00:00') ){
              new_j[i] = "'" + val.substring( 0, val.length - 9 )
            }
            else{
              new_j[i] = "'" + val
            }
          }
          if( 3 == metadata[i]["type_code"] && val){
              new_j[i] = "'" + val
          }          
          else{ 
            new_j[i] = j[i]
          }
        }
        finalJsonArray.push( new_j )
      }

      

      new ngxCsv(finalJsonArray, filename, options);
    }
    
   
  }
  onConnectionChange(event:MatSelectChange){
    var connectionId:string|null = this.FG.controls.connectionId.value

    if( this.sqlJupiter && connectionId ){
    
      var obj:SqlJupiter ={
        connectionId:connectionId
      }

      this.firebaseService.updateDoc( this.parentCollection + "/" + this.collection , this.id, obj ).then( ()=>{
        console.log("save connecton")
        if( this.sqlJupiter ){
          this.sqlJupiter.connectionId = connectionId
        }
      },
      reason =>{
        alert("ERROR saving sql:" + reason)
      })
    }
  } 

  updateElapsedTime(){
    
    if( this.sqlJupiter && this.sqlJupiter.request_start_time ){
      let st:Date = this.firebaseService.getDate(this.sqlJupiter.request_start_time)
      let n:Date = new Date()
      let millisendsElapsed = n.getTime() - st.getTime()
      let diff = new Date( millisendsElapsed )
      this.elapsedTime =  diff.toISOString().slice(11,19)
    }
    
  }

  onAbort(){
    var sql:string|null = this.FG.controls.sql.value
    let sqlJupiter:SqlJupiter = {
      request_status:"aborted",
      request_completion_time:Timestamp.now()
    }
    this.firebaseService.updateDoc( this.parentCollection + "/" + this.collection , this.id, sqlJupiter).then( ()=>{
      console.log("request execution")
    },
    reason =>{
      alert("ERROR request execution:" + reason)
    })
  }

  getKeys( obj:any ){
    return Object.keys(obj)
  }
}
