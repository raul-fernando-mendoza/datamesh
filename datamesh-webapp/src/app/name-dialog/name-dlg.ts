import {  Component,  Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface DataName {
  label:string
  name:string
}

@Component({
    selector: 'name-dlg',
    templateUrl: 'name-dlg.html',
    standalone: true,
    imports:[ 
      CommonModule,
      MatButtonModule,
      MatIconModule,
      FormsModule, 
      ReactiveFormsModule,
      MatFormFieldModule,
      MatInputModule,    
      MatDialogModule
    ]    
  })
  export class DialogNameDialog { 
    constructor(
      public dialogRef: MatDialogRef<DialogNameDialog>,
      @Inject(MAT_DIALOG_DATA) public data:DataName) {}
  }
  