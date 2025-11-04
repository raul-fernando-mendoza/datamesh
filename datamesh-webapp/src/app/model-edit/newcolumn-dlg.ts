import {  Component,  ElementRef,  Inject, OnInit, signal, SimpleChange, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ComparatorOption, JoinNode, SqlResultInFirebase, SnowFlakeNativeColumn, JoinNodeActionData, FilterTransformation, JoinNodeObj, TransformationType, SqlColumnGeneric, NewColumnTransformation } from 'app/datatypes/datatypes.module';
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
    selector: 'newcolumn-dlg',
    templateUrl: 'newcolumn-dlg.html',
    styleUrl: 'newcolumn-dlg.css',
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
  export class NewColumnDialog implements OnInit{ 

    FG =
      this.fb.group({
        columnName: ['', Validators.required],
        expression: ["", Validators.required]
      })

    constructor(
      public dialogRef: MatDialogRef<NewColumnDialog>,
      private fb:FormBuilder,
      private firebaseService:FirebaseService,
      @Inject(MAT_DIALOG_DATA) public data:JoinNodeActionData) {}

    ngOnInit(): void {
      let node = this.data.node
      let idx = this.data.currentTransactionIndex
      
    }

    onSubmit(){  
      let columnName:string = this.FG.controls.columnName.value! 
      let expression:string = this.FG.controls.expression.value!
      let f:NewColumnTransformation = {
        type: TransformationType.newColumn,
        id:uuid.v4(),
        columnName: columnName,
        expression: expression
      } 

      let joinNodeUpdate:JoinNode = {
        transformations:[ ...this.data.node.transformations , f]
      }
 
      this.firebaseService.updateDoc( this.data.collectionPath, this.data.node.id, joinNodeUpdate).then( ()=>{
        console.log("adding new column done")
      },
      reason =>{
        alert("Error: adding new column :" + reason.error)
      })
      
    }
}
  
  