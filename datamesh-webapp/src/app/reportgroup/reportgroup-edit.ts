import { Component , OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Route, Router, RouterModule } from '@angular/router';
import { AuthService } from 'app/auth.service';
import { QueryItem } from 'app/datatypes/datatypes.module';
import { FirebaseService } from 'app/firebase.service';
import { StringUtilService } from 'app/string-util.service';
import { Location } from '@angular/common';
import * as uuid from 'uuid';


interface IReportGroup{
  id?:string
  label?:string
  description?:string
  indexWords?:string[]
  owner?:string
  deleted?:boolean
  createon?:Date
  updateon?:Date  
}
class ReportGroup implements IReportGroup{
  public static collection = "ReportGroup"
  id!:string 
  label!:string 
  description:string = ""
  owner!:string
  deleted:boolean = false
  indexWords:string[] = []
  createon:Date = new Date()
  updateon:Date = new Date()
}

@Component({
  selector: 'reportgroup-edit',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MatMenuModule,
    MatListModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule, 
    MatInputModule, 

    MatProgressSpinnerModule, 
  ],
  templateUrl: './reportgroup-edit.html',
  styleUrl: './reportgroup-edit.css'
})
export class ReportGroupEdit implements OnInit, OnDestroy {
  collection = ReportGroup.collection

  reportGroup = signal<ReportGroup|null>(null)
  unsubscribe:any
  id!:string

  FG = this.fb.group({
    label:['',[Validators.required]],
    description:['']
  })  

  constructor(public firestore:FirebaseService,
    private authService:AuthService,
    private router:Router,

    private location: Location,
    private activatedRoute:ActivatedRoute,
    private fb:FormBuilder,
    private stringUtilService:StringUtilService 
 ){
  this.activatedRoute.params.subscribe(res => {
    if("id" in res){
      if( this.id && this.id != res["id"]){
       this.id = res["id"]
       this.update()
      }
      else{
        this.id = res["id"]
      }
    }  
   })     
    
  }
  ngOnInit(): void {
    this.update()
  }

  update(){
    if( this.unsubscribe ){
      this.unsubscribe()
    }
    console.log("getUserUid()" + this.authService.getUserUid())

    if( this.id != "new" ){
      this.unsubscribe = this.firestore.onsnapShot( this.collection, this.id,
        {
        next: (doc) =>{
            let d = doc.data() as ReportGroup
            d.id = doc.id
            this.FG.controls.label.setValue(d.label)
            this.FG.controls.description.setValue(d.description)
            this.reportGroup.set(d)
        },
        error: (reason) =>{
          alert("Error retriving Report Group:" + reason)
        },
        complete: () =>{
          console.log("do nothing")
        } 
      }
      )
    }
  }
  ngOnDestroy(): void {
    if( this.unsubscribe ){
      this.unsubscribe()
    }
  }
  onNew(){
    var id= uuid.v4()
    let label = this.FG.controls.label.value ? this.FG.controls.label.value : ""
    let description = this.FG.controls.description.value ? this.FG.controls.description.value : ""
    let indexWordsArray = this.stringUtilService.getWordIndexArray( label )

    var n:ReportGroup = {
      id: id,
      label: label,
      owner: this.authService.getUserUid()!,
      deleted: false,
      indexWords: indexWordsArray,
      createon: new Date(),
      updateon: new Date(),
      description: description
    }
    this.firestore.setDoc(this.collection,id, n).then( ()=>{
      console.log("New object created")
      this.router.navigate(["..",id], {relativeTo: this.activatedRoute})
    },
      error=>{
        alert("Error creating new object:" + error)
      }
    )
  }  
  onRename(){
    let label:string = this.FG.controls.label.value!
    let indexWordsArray = this.stringUtilService.getWordIndexArray( label )
    let obj = {
      label:label,
      indexWords: indexWordsArray
    }
    this.firestore.updateDoc(this.collection, this.id , obj).then( ()=>{
      console.log("update completed")
    },
    error=>{
      alert("the group label can not be changed")
    })
  }
  onDelete(){
    if( confirm("are you sure to delete:" + this.reportGroup()!.label) ){
      this.firestore.deleteDoc(this.collection, this.reportGroup()!.id ).then( ()=>{
        console.log("completed")
        this.location.back();
      },
      error=>{
        alert("there has been an error when deleting the Item")
      })
    }
  }  

  getErrorMessage(o:any) {
    if (this.FG.controls.label.hasError('required')) {
      return 'You must enter a value';
    }

    return this.FG.controls.label.hasError('label') ? 'Not valid name' : '';
  }  
}
