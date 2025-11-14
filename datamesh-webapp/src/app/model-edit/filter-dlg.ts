import {  Component,  ElementRef,  Inject, OnInit, signal, SimpleChange, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ComparatorOption, JoinNode, SqlResultInFirebase, SnowFlakeNativeColumn, JoinNodeActionData, FilterTransformation, JoinNodeObj, TransformationType, SqlColumnGeneric, SqlResultGeneric, ActionOption } from 'app/datatypes/datatypes.module';
import { MatCheckboxModule} from '@angular/material/checkbox';
import { MatRadioModule} from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatExpansionModule} from '@angular/material/expansion';
import { DataGridComponent } from 'app/data-grid/data-grid.component';
import { MatListModule } from '@angular/material/list';
import * as uuid from 'uuid';
import { FirebaseService } from 'app/firebase.service';

@Component({
    selector: 'filter-dlg',
    templateUrl: 'filter-dlg.html',
    styleUrl: 'filter-dlg.css',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        FormsModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDialogModule,
        MatCheckboxModule,
        MatSelectModule,
        MatGridListModule,
        MatRadioModule,
        MatTabsModule,
        MatProgressSpinnerModule,
        MatAutocompleteModule,
        MatExpansionModule,
        MatListModule
    ]
})
  export class FilterDialog implements OnInit{ 
    @ViewChild('input') input!: ElementRef<HTMLInputElement>;
    
    comparisonOptions:Array<ComparatorOption> = [  
      ComparatorOption.equal,
      ComparatorOption.gt,
      ComparatorOption.gte,
      ComparatorOption.lt ,
      ComparatorOption.lte,
      ComparatorOption.ne,
      ComparatorOption.in
    ]
 
    filterFA =
      this.fb.group({
        columnName: [''],
        comparator: [ComparatorOption.equal],
        exp:['']
      })

    columns!:SqlColumnGeneric[]

    filteredOptions: SqlColumnGeneric[] = [];

    result:SqlResultInFirebase | null= null
    
    constructor(
      public dialogRef: MatDialogRef<FilterDialog>,
      private fb:FormBuilder,
      private firebaseService:FirebaseService,
      @Inject(MAT_DIALOG_DATA) public data:JoinNodeActionData) {}

    ngOnInit(): void {
      let node = this.data.node
      let idx = this.data.currentTransactionIndex
      let tId = node.transformations[idx-1].id

      if( this.data.action == ActionOption.add){
        //we are adding at the end to bring the columns from the last transformation result
        tId = node.transformations[idx].id

      }
      else{
        let t = node.transformations[idx] as FilterTransformation
        this.filterFA.controls.columnName.setValue(t.leftValue)
        this.filterFA.controls.comparator.setValue(t.comparator)
        this.filterFA.controls.exp.setValue(t.rightValue)
      }

      this.firebaseService.getdoc( this.data.collectionPath + "/" + node.id + "/sampledata" , tId).then( doc =>{
        if(doc.exists()){
          let result = doc.data() as SqlResultGeneric
          this.columns = result.columns
        }
      })
  
    }

    filter(): void {
      const filterValue = this.filterFA.controls.columnName.value ? this.filterFA.controls.columnName.value : ""
      this.filteredOptions = this.columns.filter((o => o.columnName.toLowerCase().includes(filterValue.toLowerCase())))
    }   

    onSubmit(){  
      let columnName = this.filterFA.controls.columnName.value 
      let comparator:ComparatorOption = this.filterFA.controls.comparator.value ? this.filterFA.controls.comparator.value : ComparatorOption.equal
      let exp = this.filterFA.controls.exp.value
      let f:FilterTransformation = {
        type: TransformationType.filter,
        id:uuid.v4(),
        leftValue: columnName ? columnName : "",
        comparator: comparator ,
        rightValue: exp ? exp : ""
      } 

      let joinNodeUpdate:JoinNode = {
        transformations:[ ...this.data.node.transformations ]
      }      

      if( this.data.action == ActionOption.add){
        let idx = this.data.currentTransactionIndex
        if(  idx == this.data.node.transformations.length-1){
          //is adding at the end
          joinNodeUpdate.transformations!.push( f )
        }
        else{
          joinNodeUpdate.transformations!.splice(idx+1, 0, f)
        }
      }
      else if( this.data.action == ActionOption.edit){
        joinNodeUpdate.transformations?.splice(this.data.currentTransactionIndex,1, f)
      }
 
      this.firebaseService.updateDoc( this.data.collectionPath, this.data.node.id, joinNodeUpdate).then( ()=>{
        console.log("editing filter done")
      },
      reason =>{
        alert("Error: Editing filter:" + reason.error)
      })
      
    }
}
  
  