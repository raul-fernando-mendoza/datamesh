
import {FlatTreeControl} from '@angular/cdk/tree';
import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject, firstValueFrom} from 'rxjs';
import { FirebaseService } from '../firebase.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { FirestoreError } from 'firebase/firestore';


export interface Data{
  id:string
  label:string
  groupId:string
}

export interface Group{
  id:string
  label:string
}

/**
 * Node for to-do item
 */
export interface TreeNode {
  children: TreeNode[];
  item: Group | Data;
}




/** Flat to-do item node with expandable and level information */
export interface FlatNode {
  item: Group | Data;
  level: number
  expandable: boolean
}


/**
 * @title Tree with checkboxes
 */
@Component({
  selector: 'app-dataset-tree',
  templateUrl: './dataset-tree.component.html',
  styleUrls: ['./dataset-tree.component.css']
})
export class DatasetTreeComponent implements OnInit, OnDestroy {

  @Input() groupCollection!:string //the folder where the file should be written
  @Input() dataCollection!:string //displayName

  unsubscribeMap:Map<string, any> = new Map<string,any>()

  

  snapshotTime:Map<string,number> = new Map<string,number>() //tells if the snapshot was recorded on cache data 
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeToNode = new Map<FlatNode, TreeNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nodeToFlatNode = new Map<TreeNode, FlatNode>();

  treeControl: FlatTreeControl<FlatNode>;

  treeFlattener: MatTreeFlattener<TreeNode, FlatNode>;

  dataSource: MatTreeFlatDataSource<TreeNode, FlatNode>;

  _database = new BehaviorSubject<TreeNode[]>([]);
  constructor(
    private firebaseService:FirebaseService,
    private router:Router,
    private route: ActivatedRoute
  ) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren,
    );
    this.treeControl = new FlatTreeControl<FlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    this._database.subscribe(data => {
      this.flatNodeToNode.clear()
      this.nodeToFlatNode.clear()
      this.dataSource.data = []
      this.dataSource.data = data;
    });
  }
  ngOnDestroy(): void {
    this.unsubscribeMap.forEach( (key:string, unsubscribe:any) =>{
      unsubscribe();
    })
  }
  ngOnInit(): void {
    this.update()
  }

  getLevel = (node: FlatNode) => node.level;

  isExpandable = (node: FlatNode) => node.expandable;

  getChildren = (node: TreeNode): TreeNode[] => node.children!;

  hasChild = (_: number, _nodeData: FlatNode) => _nodeData.expandable;

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: TreeNode, level: number) => {
    const existingNode = this.nodeToFlatNode.get(node);
    if( existingNode && existingNode.item === node.item ){
      var flatNode:FlatNode = existingNode
    }
    else{
      var flatNode:FlatNode = {
        item: node.item,
        level: level,
        expandable: node.children.length > 0 ? true : false
      }
    }
    this.flatNodeToNode.set(flatNode, node);
    this.nodeToFlatNode.set(node, flatNode);
    return flatNode;
  };

  isGroup(node:TreeNode){
    if( !("groupId" in node.item) ){
      return true
    }
    else{
      return false
    }
  }
  update():Promise<void>{
    return new Promise<void>((resolve, reject)=>{
      this.unsubscribeMap.forEach( (unsubscribe:any,key:string) =>{
        unsubscribe()
      })
      this.unsubscribeMap.clear()  
      this.snapshotTime.clear()  
      let unsubscribe = this.firebaseService.onsnapShotQuery(this.groupCollection,null, null, null,{
        "next":( (set:any)=>{
          console.log("reload parent")
          var datasets:TreeNode[] = []
          var transactions = set.docs.map( (item:any) =>{
            var datasetGroup = item.data() as Group
            let datasetNode:TreeNode = {
              children: [],
              item: datasetGroup
            }
            datasets.push( datasetNode )
            return this.loadDataForGroup( datasetNode )
          })
          Promise.all( transactions ).then( ()=>{
            datasets.sort( (a,b) => a.item.label.toUpperCase() >= b.item.label.toUpperCase() ? 1:-1 )
            this._database.next(datasets);
            if( !this.unsubscribeMap.get( "/" )){
              this.unsubscribeMap.set( "/", unsubscribe )
            }
            resolve()
          })
        }),
        "error":( (error: FirestoreError) =>{
            alert("ERROR:" + error)
            reject(error)
        })
      })
      
    })
  }  
  loadDataForGroup(groupNode:TreeNode):Promise<void>{
    return new Promise<void>((resolve, reject) =>{
      let unsubscribe = this.firebaseService.onsnapShotQuery(this.dataCollection,"groupId","==",groupNode.item.id, {
        "next":( (set:any) =>{
          
          groupNode.children.length = 0
          set.docs.map( (doc:any) =>{
            var data = doc.data() as Data
            let newDatasetNode:TreeNode = {
              children: [],
              item: data
            }
            groupNode.children.push( newDatasetNode )            
          })
          groupNode.children.sort( (a,b)=> a.item.label > b.item.label ? 1:-1)
          let prev = this.snapshotTime.get( groupNode.item.id )
          if( prev ){
            let now = (new Date()).getTime()
            if( (now - prev) > 1000){
              console.log("calling reload from:" + groupNode.item.label)
              this.reload( groupNode.item.id )
            }
          }
          console.log("register:" + groupNode.item.label + " cache:" + set.metadata.fromCache)
          
          this.snapshotTime.set( groupNode.item.id, (new Date()).getTime() )
          resolve()
        }),
        "error":( (error:any) =>{
          alert("ERROR:" +error)
          reject()
        })          
      })
      this.unsubscribeMap.set( groupNode.item.id, unsubscribe)
    })
    
  }

  isData( node:TreeNode ){
    if( "groupId" in node.item ){
      return true
    }
    else{
      return false
    }
  }



  reload( id:string | null ){
    this.update().then( ()=>{
      if( id ){ 
        this.nodeToFlatNode.forEach( (groupFlatNode, key)=>{
          if( groupFlatNode.item.id == id){
            this.treeControl.expand( groupFlatNode )
            let groupNode = this.flatNodeToNode.get( groupFlatNode )            
            if( groupNode ){
              groupNode.children.map( (childNode) =>{
                let flatChildNode = this.nodeToFlatNode.get(childNode)
                if( flatChildNode ){
                  console.log("expand: " + flatChildNode.item.label)
                   this.treeControl.expand( flatChildNode )
                }
              })
            }
          }
        })
      }
    },
    error=>{
      alert("ERROR:" + error)
    })
  }
  addGroup() {
    this.router.navigate(["/" + this.groupCollection + "-create"])
  }

  onAddData(node:TreeNode){
    let group = node.item as Group

    this.router.navigate(["/" + this.dataCollection + "-create", group.id])
  }
  onEditGroup( node:TreeNode ){
    this.router.navigate(["/" + this.groupCollection + "-edit/",  node.item.id]);
  }
  onEditData( node:TreeNode ){
    this.router.navigate(["/" + this.dataCollection + "-edit",  node.item.id]);
  }  
}
