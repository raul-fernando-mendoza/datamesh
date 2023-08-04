import { AfterViewInit, Component, EventEmitter, Input ,OnDestroy, OnInit, Output} from '@angular/core';
import { SqlJupiter } from '../datatypes/datatypes.module';
import { FirebaseService } from '../firebase.service';
import { collection, doc, deleteDoc , getDoc,  onSnapshot, getDocs, query, setDoc, updateDoc, DocumentData, DocumentSnapshot, Unsubscribe} from "firebase/firestore"; 
import { db } from '../../environments/environment'
import { FormBuilder } from '@angular/forms';
import { UrlService } from '../url.service';


export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He'},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li'},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
  {position: 5, name: 'Boron', weight: 10.811, symbol: 'B'},
  {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C'},
  {position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N'},
  {position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O'},
  {position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F'},
  {position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne'},
];


@Component({
  selector: 'app-sql-jupiter-edit',
  templateUrl: './sql-jupiter-edit.component.html',
  styleUrls: ['./sql-jupiter-edit.component.css']
})
export class SqlJupiterEditComponent implements OnInit, AfterViewInit, OnDestroy{
  @Input() parentCollection!:string
  @Input() collection!:string
  @Input() id!:string

  unsubscribe:any 
  sqlJupiter:SqlJupiter|null = null 
  rows = 1

  displayedColumns = ['position', 'name', 'weight', 'symbol'];
  dataSource = ELEMENT_DATA;

  submitting = false
  FG = this.fb.group({
    sql:[''],
  })

  constructor(
    public firebaseService:FirebaseService,
    private fb:FormBuilder,
    private urlService:UrlService
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
        this.rows = this.sqlJupiter.sql.split('\n').length
        this.FG.controls.sql.setValue( this.sqlJupiter.sql )
        this.displayedColumns = ["idx"]
        if( this.sqlJupiter.result ){
          var resultJson = this.sqlJupiter.result

          for( var c=0; c<resultJson["metadata"].length; c++){
            if( this.displayedColumns.indexOf(resultJson["metadata"][c]["name"]) < 0 ){
              this.displayedColumns.push(resultJson["metadata"][c]["name"])
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
  }
  onSqlChange($event:any){
    console.log($event)
    var sql:string|null = this.FG.controls.sql.value
    if( this.sqlJupiter && sql){
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
        "sql":sql
      }  
      this.submitting = true
      this.urlService.post("executeSql",param).subscribe({ 
        'next':(result)=>{
          this.submitting = false

          var objResultSet = []

          var resultJson = result as { [key: string]: any }

          var arr = resultJson["resultSet"] as Array<string>
          for( var i=0; i< arr.length ; i++){
            var rowRaw = arr[i]
            var rowObj:{ [key: string]: any } = {}
            for( var c=0; c<rowRaw.length; c++){
              rowObj[ resultJson["metadata"][c]["name"] ] = rowRaw[c]
            }         
            objResultSet.push(rowObj)
          } 

          var objResult = {
            "metadata":resultJson["metadata"],
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
}
