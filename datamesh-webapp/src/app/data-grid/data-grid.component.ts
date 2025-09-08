import { CommonModule } from '@angular/common';
import { Component, Input , AfterViewInit} from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SqlResultInFirebase, SelectedColumn } from 'app/datatypes/datatypes.module';

@Component({
    selector: 'app-data-grid',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        FormsModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './data-grid.component.html',
    styleUrl: './data-grid.component.css'
})
export class DataGridComponent{
  @Input() result!:SqlResultInFirebase
  @Input() columnsFA:FormArray<FormGroup<{columnName:FormControl, selected:FormControl, alias:FormControl }>> | null = null

  isLoading:boolean = false 

  

  constructor(private fb:FormBuilder){
    if( this.columnsFA != null){
      this.columnsFA.clear()
    }
    

  }


  format( datatype:any, val:any){
    let result = datatype + " " + val
    
    if( datatype == 8 ){
      if( val ){
        let date = new Date(val)
        let pstOffset = 480; // this is the offset for the Pacific Standard Time timezone     
        let str = new Date(date.getTime() + (pstOffset) * 60 * 1000).toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
        let d= Date.parse(str)
        let ts = this.formatDate(new Date(d))
      
        
        if( ts.endsWith(' 00:00:00') ){
          result = ts.substring( 0, ts.length - 9 )
        }
        else{
          result = ts
        }
      }
      else{
        result = val
      }
    }
    if( 2 == datatype ){
        result = val
    } 
    if( 
      datatype == 0||
      datatype == 0
      
    ){
      if( val - Math.floor(val) > 0){
        result = Number(val).toFixed(2)
      }
      else{
        result = Math.floor(Number(val)) + ".__"
      }      
    }              
    
    return result
  }
  isNumber(datatype:any){
    
    if(     
      datatype == 0 ||
      datatype == 0 ){
      return true
    }
    
    return false
  }
  formatDate(d:Date): string {
    // Create a date object with the current time
 
    // Create an array with the current month, day and time
    let date: Array<String> = [ String(d.getMonth() + 1).padStart(2 ,"0"), String(d.getDate()).padStart(2 ,"0"), String(d.getFullYear()) ];
    // Create an array with the current hour, minute and second
    let time: Array<String> = [ String(d.getHours()).padStart(2 ,"0"), String(d.getMinutes()).padStart(2 ,"0"), String(d.getSeconds()).padStart(2 ,"0")];
    // Return the formatted string
    return date.join("/") + " "  + time.join(":")
  }  
}
