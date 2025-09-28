import {  Component,  ElementRef,  Inject, OnInit, signal, SimpleChange, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ComparatorOption, JoinNode, SqlResultInFirebase, SnowFlakeNativeColumn, JoinNodeActionData, FilterTransformation, JoinNodeObj, TransformationType } from 'app/datatypes/datatypes.module';
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
        DataGridComponent,
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
      ComparatorOption.ne
    ]
 
    filterFA =
      this.fb.group({
        columnName: [''],
        comparator: [ComparatorOption.equal],
        exp:['']
      })

    columns!:SnowFlakeNativeColumn[]

    filteredOptions: SnowFlakeNativeColumn[] = [];

    result:SqlResultInFirebase | null= null
    
    constructor(
      public dialogRef: MatDialogRef<FilterDialog>,
      private fb:FormBuilder,
      private firebaseService:FirebaseService,
      @Inject(MAT_DIALOG_DATA) public data:JoinNodeActionData) {}

    ngOnInit(): void {
      let node = this.data.node
      let idx = this.data.currentTransactionIndex

      this.columns = node.transformations[idx].sampleData!.metadata
    }

    filter(): void {
      const filterValue = this.filterFA.controls.exp.value ? this.filterFA.controls.exp.value : ""
      this.filteredOptions = this.columns.filter((o => o.name.toLowerCase().includes(filterValue.toLowerCase())))
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
        transformations:[ ...this.data.node.transformations , f]
      }
 
      this.firebaseService.updateDoc( this.data.collectionPath + "/" + JoinNodeObj.className, this.data.node.id, joinNodeUpdate).then( ()=>{
        console.log("editing filter done")
      },
      reason =>{
        alert("Error: Editing filter:" + reason.error)
      })
      
    }
}
  
  