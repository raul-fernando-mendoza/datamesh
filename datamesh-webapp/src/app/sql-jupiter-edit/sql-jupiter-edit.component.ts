import { AfterViewInit, Component, EventEmitter, Inject, Input ,OnDestroy, OnInit, Output, ViewChild, ViewRef} from '@angular/core';
import { Column, Connection, SqlJupiter } from '../datatypes/datatypes.module';
import { FirebaseService } from '../firebase.service';
import { collection, doc, deleteDoc , getDoc,  onSnapshot, getDocs, query, setDoc, updateDoc, DocumentData, DocumentSnapshot, Unsubscribe} from "firebase/firestore"; 
import { db } from '../../environments/environment'
import { FormBuilder } from '@angular/forms';
import { UrlService } from '../url.service';
import { ngxCsv } from 'ngx-csv/ngx-csv';
import { CommonModule, DOCUMENT } from '@angular/common';
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
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

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
    MatSelectModule ,
    MatTableModule 
  ]
})
export class SqlJupiterEditComponent implements OnInit, AfterViewInit, OnDestroy{
  @Input() parentCollection!:string
  @Input() collection!:string
  @Input() id!:string

  MIN_ROWS = 3
  MAX_ROWS = 20
  unsubscribe:any 
  sqlJupiter:SqlJupiter|null = null 
  rows = this.MIN_ROWS

  displayedColumns = ['position', 'name', 'weight', 'symbol'];
  dataSource = [];



  submitting = false
  FG = this.fb.group({
    sql:[''],
    connectionId:['']
  })

  connections:Array<Connection> = []
  constructor(
    public firebaseService:FirebaseService,
    private fb:FormBuilder,
    private urlService:UrlService,
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
  }

  update(){
    if( this.unsubscribe ){
      this.unsubscribe()
    }
    this.unsubscribe = this.firebaseService.onsnapShot( this.parentCollection + "/" + this.collection , this.id, 
    {
      "next":( (doc) =>{
        this.sqlJupiter = doc.data() as SqlJupiter
        this.rows = this.sqlJupiter.sql.split('\n').length > this.MAX_ROWS ? this.MAX_ROWS : this.MIN_ROWS 
        this.FG.controls.sql.setValue( this.sqlJupiter.sql )
        this.FG.controls.connectionId.setValue( this.sqlJupiter.connectionId )
        this.displayedColumns = ["idx"]
        if( this.sqlJupiter.result ){
          var resultJson = this.sqlJupiter.result

          for( var c=0; c<resultJson["metadata"].length; c++){
            let colName = resultJson["metadata"][c]["name"]
            let newCol = colName
            let tryNum = 0
            while( this.displayedColumns.find(e=>e==newCol) ){
              tryNum++;
              newCol = colName + "_" + tryNum
            }
            console.log("cols:" + c + ":" + colName + " " +  newCol)
            if( this.displayedColumns.findIndex( e=>e==newCol) <0 ){
              this.displayedColumns.push(newCol)
            }
            else{
              console.log("duplicated name")
            }

          }        
  
        }

      }),
      "error":( (reason)=>{
        alert("Error:" + reason)
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
  }
  onExecute(){
    var sql:string|null = this.FG.controls.sql.value
 
    if( sql ){
      let param={
        "sql":sql,
        "connectionId":this.sqlJupiter!.connectionId
      }  
      this.submitting = true
      this.urlService.post("executeSql",param).subscribe({ 
        'next':(result)=>{
          this.submitting = false
          var resultJson = result as { [key: string]: any }
          var objMetadata:Array<Column> = []

          for( let i=0;i<resultJson["metadata"].length; i++){
            let name 
            let result = objMetadata.find( e=> resultJson["metadata"][i]["name"] == e["name"])
            if( result ){
              name = result.name + SUFFIX
            }
            else{
              name = resultJson["metadata"][i]["name"]
            }
            let column:Column = {
              display_size: resultJson["metadata"][i]["display_size"],
              internal_size: resultJson["metadata"][i]["display_size"],
              is_nullable: resultJson["metadata"][i]["display_size"],
              name: name,
              precision: resultJson["metadata"][i]["display_size"],
              scale: resultJson["metadata"][i]["display_size"],
              type_code: 0
            }
            objMetadata.push(column)
            
          }          

          var objResultSet = []

          var arr = resultJson["resultSet"] as Array<string>
          for( let i=0; i< arr.length ; i++){
            var rowRaw = arr[i]
            var rowObj:{ [key: string]: any } = {}
            for( let c=0; c<rowRaw.length; c++){

                rowObj[ c ] = rowRaw[c]

              
            }         
            objResultSet.push(rowObj)
          } 

          var objResult = {
            "metadata":objMetadata,
            "resultSet":objResultSet
          }
          
          console.log(result)
          this.sqlJupiter!.result = objResult

          var obj ={
            result:objResult
          }

          this.firebaseService.updateDoc( this.parentCollection + "/" + this.collection , this.id, obj ).then( ()=>{
            console.log("save result")
          },
          reason =>{
            alert("ERROR saving sql:" + reason)
          })

        },
        'error':(reason)=>{
          this.submitting = false

          let errorMessage = reason.message
          if( reason.error && reason.error.error ){
            errorMessage = reason.error.error
          }
          alert("ERROR:" + errorMessage)
        }
      })
    }  
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
    var options = { 
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true, 
      showTitle: false,
      title: filename,
      useBom: true,
      noDownload: false,
      headers: this.displayedColumns.slice(1),
      filename:filename
    };    
    if( this.sqlJupiter ){

      let json = this.sqlJupiter.result.resultSet
      

      let metadata:Array<any> = this.sqlJupiter.result.metadata
      let keys:Array<string> = []
      for( let i=0; i<metadata.length; i ++){
        keys.push(metadata[i]["name"])
      }      


      let finalJsonArray = []
      for( let j of json){
        let new_j:any = {}
        for( let i=0; i < keys.length; i++){
          let k = keys[i]
          new_j[k] = j[k]
        }
        finalJsonArray.push( new_j )
      }

      

      new ngxCsv(finalJsonArray, filename, options);
    }
    
  }
  onConnectionChange(event:MatSelectChange){
    var connectionId:string|null = this.FG.controls.connectionId.value
    
    var obj ={
      connectionId:connectionId
    }

    this.firebaseService.updateDoc( this.parentCollection + "/" + this.collection , this.id, obj ).then( ()=>{
      console.log("save connecton")
      this.sqlJupiter!.connectionId = connectionId
    },
    reason =>{
      alert("ERROR saving sql:" + reason)
    })
  } 
}
