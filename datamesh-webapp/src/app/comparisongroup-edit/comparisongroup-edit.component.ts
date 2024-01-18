import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { uuidv4 } from '@firebase/util';
import { FirebaseApp } from 'firebase/app';
import { ComparisonGroup } from '../datatypes/datatypes.module';
import { FirebaseService } from '../firebase.service';
import * as uuid from 'uuid';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-comparisongroup-edit',
  templateUrl: './comparisongroup-edit.component.html',
  styleUrls: ['./comparisongroup-edit.component.css'],
  standalone: true,
  imports:[ 
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FormsModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ]    
})
export class ComparisonGroupEditComponent implements OnInit,OnDestroy{
  id:string|null = null

  group:ComparisonGroup|undefined

  unsubscribe:any = null

  FG = this.fb.group({
    label:["", [Validators.required]]
  })


  constructor( 
    private activatedRoute: ActivatedRoute,
    private fb:FormBuilder,
    public firebaseService: FirebaseService,
    private router:Router
  ){
    this.activatedRoute.params.subscribe(res => {
      if("id" in res){
        this.id = res["id"]
        if( this.unsubscribe ){
          this.unsubscribe()
        }  
        this.update()
      }  
    })        
  }
  ngOnDestroy(): void {
    if( this.unsubscribe ){
      this.unsubscribe()
    }
  }
  ngOnInit(): void {
    this.update()
  }
  update(){
    if( this.id ){
      this.firebaseService.onsnapShot( "ComparisonGroup", this.id!, {
        "next":((doc) =>{
          if( doc.exists() ){
            this.group = doc.data() as ComparisonGroup
            this.FG.controls.label.setValue( this.group.label)
          }
        }),
        "error":((error)=>{
          alert("ERROR:"+ error)
        })
      })
    }
  }
  getErrorMessage() {
    if (this.FG.controls.label.hasError('required')) {
      return 'You must enter a value';
    }

    return this.FG.controls.label.hasError('name') ? 'Not valid name' : '';
  }
  onCreateNew(){
    var datasetGroup:ComparisonGroup = {
      id: uuid.v4(),
      label: this.FG.controls.label.value!
    }
    this.firebaseService.setDoc( "ComparisonGroup", datasetGroup.id, datasetGroup).then( ()=>{
      this.id = datasetGroup.id
    })
  }  
  onCancel(){
    this.router.navigate(["/"])
  }
  onDelete(){
    if( confirm("are you sure to delete:" + this.group?.label) ){
      this.firebaseService.deleteDoc("ComparisonGroup", this.group!.id ).then( ()=>{
        this.router.navigate(["/"])
      })
    }
  }  
}
