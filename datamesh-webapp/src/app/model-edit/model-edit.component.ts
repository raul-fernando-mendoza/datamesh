import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component , ViewChild} from '@angular/core';
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
import { MatTreeModule, MatTreeNestedDataSource} from '@angular/material/tree';
import { NestedTreeControl} from '@angular/cdk/tree';
import { JoinDataSource, TreeNode } from './join-datasource';
import { MatMenuModule } from '@angular/material/menu';





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
    MatTreeModule,
    MatMenuModule ],
  providers: [JoinDataSource],
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

  newJoinFG = this.fb.group({
    table:['',[Validators.required]],
    criteria:['',[Validators.required]]
  })  
/*
  data: JoinNode[] = [
    {
      name: 'Fruit',
      children: [{name: 'Apple'}, {name: 'Banana'}, {name: 'Fruit loops'}],
    },
    {
      name: 'Vegetables',
      children: [
        {
          name: 'Green',
          children: [{name: 'Broccoli'}, {name: 'Brussels sprouts'}],
        },
        {
          name: 'Orange',
          children: [{name: 'Pumpkins'}, {name: 'Carrots'}],
        },
      ],
    },
  ];  
  */
  treeControl = new NestedTreeControl<TreeNode>(node => node.childrenNodes);
  dataSource = new JoinDataSource(this.treeControl);
  
  hasChild = (_: number, node: TreeNode) => !!node.childrenNodes && node.childrenNodes.length > 0;

  isLast = (_: number, node: TreeNode) => node.isLast;

  isEditing = (_: number, node: TreeNode) => {
    return node.item ==  this.newInfoNodeAdding
  };

  isNew = (_: number, node: TreeNode) => {
    if( this.isAdding && node.item.name == "" ){
      return true
    }
    else{
      return false
    }
  };

  isAdding = false
  parentInfoNodeAdding:JoinNode | null = null
  newInfoNodeAdding:JoinNode | null = null

 
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
                  this.dataSource.setData(this.model.data) 
                  //this.dataSource.setData(this.data)
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
  Add(node:JoinNode | null){
    if( this.model ){
      console.log(node)
      this.isAdding = true
      this.newInfoNodeAdding = {
        name:"",
        criteria:""
      }
      this.parentInfoNodeAdding = node
      
      if( !this.parentInfoNodeAdding ){
        this.model.data.push( this.newInfoNodeAdding  )
      }
      else{
        var item = this.parentInfoNodeAdding
        if( !item.children ){
          item.children = []
        }
        item.children.push(this.newInfoNodeAdding)
      }
      this.dataSource.setData(this.model.data)    
    } 
  }
  Edit(node:JoinNode | null){
    if( this.model  && node ){
      console.log(node)
      this.isAdding = true

      this.newJoinFG.controls.table.setValue(node.name)
      this.newJoinFG.controls.criteria.setValue(node.criteria)
      this.newInfoNodeAdding = node
    } 
    this.dataSource.setData(this.model!.data)
  }

  AddSubmit(node:JoinNode){
    if( this.model ){
      console.log(node)
      var name = this.newJoinFG.controls.table.value
      var criteria = this.newJoinFG.controls.criteria.value ? this.newJoinFG.controls.criteria.value : "" 
      
      if(this.isAdding && this.newInfoNodeAdding != null && name ) {
        this.newInfoNodeAdding.name = name
        this.newInfoNodeAdding.criteria = criteria
        this.isAdding = false
        this.newInfoNodeAdding = null
        this.parentInfoNodeAdding = null
        this.newJoinFG.controls.table.setValue("")
      }
      this.save()    
    }
  }  
  EditSubmit(node:JoinNode){
    if( this.model ){
      console.log(node)
      var name = this.newJoinFG.controls.table.value
      var criteria = this.newJoinFG.controls.criteria.value ? this.newJoinFG.controls.criteria.value : "" 
      
      if(this.isAdding && this.newInfoNodeAdding != null && name ) {
        this.newInfoNodeAdding.name = name
        this.newInfoNodeAdding.criteria = criteria
        this.isAdding = false
        this.newInfoNodeAdding = null
        this.parentInfoNodeAdding = null
        this.newJoinFG.controls.table.setValue("")
        this.newJoinFG.controls.criteria.setValue("")
      }
      this.save()    
    }
  }    
  deleteNode(parentNodeInfo:JoinNode, nodeInfo:JoinNode){
    if( this.model ){
      if( parentNodeInfo && parentNodeInfo.children ){
        let idx = parentNodeInfo.children.findIndex( (node) => node == nodeInfo )
        if( idx >= 0){
          parentNodeInfo.children.splice(idx, 1)
          this.save()
        }
      } 
      else{
        let idx = this.model.data.findIndex( (node) => node == nodeInfo )
        if( idx >= 0){
          this.model.data.splice(idx, 1)
          this.save()
        }      
      }
    }
  }
}
