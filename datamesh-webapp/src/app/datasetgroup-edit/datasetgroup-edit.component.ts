import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { uuidv4 } from '@firebase/util';
import { FirebaseApp } from 'firebase/app';
import { DatasetGroup } from '../datatypes/datatypes.module';
import { FirebaseService } from '../firebase.service';
import * as uuid from 'uuid';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-datasetgroup-edit',
  templateUrl: './datasetgroup-edit.component.html',
  styleUrls: ['./datasetgroup-edit.component.css'],
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
export class DatasetgroupEditComponent implements OnInit,OnDestroy{
  id:string|null = null
  datasetGroup:DatasetGroup|undefined
  groupCollection:string = "invalid"

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
    if( this.activatedRoute.snapshot.paramMap.get('id') != 'null'){
      this.id = this.activatedRoute.snapshot.paramMap.get('id') 
    }     
    this.activatedRoute.params.subscribe(res => {
      if("id" in res){
        this.id = res["id"]
      }
      if("groupCollection" in res){
        this.groupCollection = res["groupCollection"]
      }  
      this.update()
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
      if( this.unsubscribe ){
        this.unsubscribe()
      }        
      this.unsubscribe = this.firebaseService.onsnapShot( this.groupCollection , this.id!, {
        "next":((doc) =>{
          if( doc.exists() ){
            this.datasetGroup = doc.data() as DatasetGroup
            this.FG.controls.label.setValue( this.datasetGroup.label)
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
    var datasetGroup:DatasetGroup = {
      id: uuid.v4(),
      label: this.FG.controls.label.value!
    }
    this.firebaseService.setDoc( this.groupCollection, datasetGroup.id, datasetGroup).then( ()=>{
      this.id = datasetGroup.id
    })
  }  
  onCancel(){
    this.router.navigate(["/"])
  }
  onDelete(){
    if( this.id && this.datasetGroup){
      if( confirm("are you sure to delete:" + this.datasetGroup.label) ){
        this.firebaseService.deleteDoc(this.groupCollection, this.datasetGroup.id ).then( ()=>{
          this.router.navigate(["/"])
        })
      }
    }
  }  
}
