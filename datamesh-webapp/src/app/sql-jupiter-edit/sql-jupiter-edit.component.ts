import { Component, EventEmitter, Input ,OnDestroy, OnInit, Output} from '@angular/core';
import { SqlJupiter, SqlJupiterDoc } from '../datatypes/datatypes.module';
import { FirebaseService } from '../firebase.service';
import { collection, doc, deleteDoc , getDoc,  onSnapshot, getDocs, query, setDoc, updateDoc, DocumentData, DocumentSnapshot} from "firebase/firestore"; 
import { db } from '../../environments/environment'
import { FormBuilder } from '@angular/forms';
import { UrlService } from '../url.service';

@Component({
  selector: 'app-sql-jupiter-edit',
  templateUrl: './sql-jupiter-edit.component.html',
  styleUrls: ['./sql-jupiter-edit.component.css']
})
export class SqlJupiterEditComponent implements OnInit, OnDestroy{
  @Input() sqlJupiter:SqlJupiter|null = null
  @Output() change = new EventEmitter<SqlJupiter>();
  @Output() delete = new EventEmitter<SqlJupiter>();

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
  ngOnDestroy(): void {
    
  }
  ngOnInit(): void {
    if( this.sqlJupiter && this.sqlJupiter.sql){
      this.FG.controls.sql.setValue( this.sqlJupiter.sql )
    }
  }
  onSqlChange($event:any){
    console.log($event)
    var sql:string|null = this.FG.controls.sql.value
    if( this.sqlJupiter && sql){
      this.sqlJupiter.sql = sql
    }
    this.change.emit(this.sqlJupiter!)    
  }
  onSubmit(){

  }
  onCancel(){

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
          this.change.emit(this.sqlJupiter!)
        },
        'error':(reason)=>{
          this.submitting = false
          alert("ERROR:" + reason.error.error)
        }
      })
    }  
  }
  remove(){
    this.delete.emit(this.sqlJupiter!)      
  }
  textAreaAdjust(element:any) {
    element.style.height = "1px";
    element.style.height = (25+element.scrollHeight)+"px";
  }
}
