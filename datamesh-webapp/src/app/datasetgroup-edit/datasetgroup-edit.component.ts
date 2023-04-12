import { Component } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Route } from '@angular/router';
import { uuidv4 } from '@firebase/util';
import { FirebaseApp } from 'firebase/app';
import { DatasetGroup } from '../datatypes/datatypes.module';
import { FirebaseService } from '../firebase.service';
import * as uuid from 'uuid';

@Component({
  selector: 'app-datasetgroup-edit',
  templateUrl: './datasetgroup-edit.component.html',
  styleUrls: ['./datasetgroup-edit.component.css']
})
export class DatasetgroupEditComponent {
  id:string|null = null

  FG = this.fb.group({
    label:["", [Validators.required]]
  })


  constructor( 
    private activatedRoute: ActivatedRoute,
    private fb:FormBuilder,
    private firebaseService: FirebaseService
  ){
    if( this.activatedRoute.snapshot.paramMap.get('id') != 'null'){
      this.id = this.activatedRoute.snapshot.paramMap.get('id') 
    }     
  }
  getErrorMessage() {
    if (this.FG.controls.label.hasError('required')) {
      return 'You must enter a value';
    }

    return this.FG.controls.label.hasError('name') ? 'Not valid name' : '';
  }
  onCreateNew(){
    var datasetGroup:DatasetGroup = {
      id: uuid.v4(),
      label: this.FG.controls.label.value!
    }
    this.firebaseService.setDoc( "DatasetGroup", datasetGroup).then( ()=>{
      this.id = datasetGroup.id
    })
  }  
  onCancel(){

  }
}
