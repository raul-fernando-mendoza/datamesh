import { CommonModule } from '@angular/common';
import { Component , ViewChild} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { JoinNode, ModelCollection, ModelObj } from 'app/datatypes/datatypes.module';
import { FirebaseService } from 'app/firebase.service';
import { StringUtilService } from 'app/string-util.service';
import { UrlService } from 'app/url.service';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../../environments/environment'
import * as uuid from 'uuid';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeModule, MatTree, MatTreeNestedDataSource} from '@angular/material/tree';
import { JoinDataSource } from './join-datasource';

@Component({
  selector: 'app-model-edit',
  standalone: true,
  imports:[ 
    CommonModule ,
    MatIconModule,
    MatButtonModule,
    FormsModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTreeModule  ],
  templateUrl: './model-edit.component.html',
  styleUrl: './model-edit.component.css'
})
export class ModelEditComponent {
  model:ModelObj | null = null
  id:string | null = null
  groupId:string|null = null

  unsubscribe:Unsubscribe | null = null

  FG = this.fb.group({
    label:['',[Validators.required]],
    description:['']
  })  


 
  constructor( 
    private fb:FormBuilder 
   ,private stringUtilService:StringUtilService
   ,private activatedRoute:ActivatedRoute
   ,private router:Router
   ,public firebaseService:FirebaseService
   ,private urlService:UrlService
   ){
     this.activatedRoute.params.subscribe(res => {
       if("id" in res){
         this.id = res["id"]
         this.update()
       }  
       else if("groupId" in res){
         this.groupId = res["groupId"]
       }
     }) 
 
     
  }  
    

  update(){
    
    if( this.id ){
      this.unsubscribe = onSnapshot( doc( db,ModelCollection.collectionName, this.id ),
          (docRef) =>{
                if( docRef.exists()){
                  this.model=docRef.data() as ModelObj
                  this.FG.controls.label.setValue( this.model.label!)
                }
                if( this.model ){
                  //this.nestedDataSource.setData(this.model.data) 
                }
          },
          (reason:any) =>{
              alert("ERROR update comparison list:" + reason)
          }  
      )
    }
  }    
  onDelete(){
    if(this.id && this.model){
      if( confirm("are you sure to delete:" + this.model.label) ){
        this.firebaseService.deleteDoc(ModelCollection.collectionName, this.id ).then( ()=>{
          this.router.navigate(["/"])
        })
      }
    }
  }  
  onSubmit(){
    if( !this.model ){
      this.create()
    }
    else{
      this.save()
    }
  }
  create():Promise<void>{
    //create new
    let model:ModelObj = {
      id: uuid.v4(),
      label: this.FG.controls.label.value!,
      groupId: this.groupId!,
      description: '',
      credentials: '',
      owner: '',
      data: []
    }
    return this.firebaseService.setDoc( ModelCollection.collectionName, model.id, model).then( () =>{
      this.id = model.id
      this.router.navigate([ModelCollection.collectionName,"edit",this.id])
    })
  }
  save(){
    if( this.model ){
      this.firebaseService.updateDoc( ModelCollection.collectionName, this.model.id, this.model)
    }
  }

  onCancel(){
    this.router.navigate(["/"])
  }

  ngOnInit() {
    this.update()
  }

}
