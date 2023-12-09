import {  Component,  Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

export interface DataName {
  label:string
  name:string
}

@Component({
    selector: 'name-dlg',
    templateUrl: 'name-dlg.html',
  })
  export class DialogNameDialog { 
    constructor(
      public dialogRef: MatDialogRef<DialogNameDialog>,
      @Inject(MAT_DIALOG_DATA) public data:DataName) {}
  }
  