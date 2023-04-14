
import {FlatTreeControl} from '@angular/cdk/tree';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject, firstValueFrom} from 'rxjs';
import { Dataset, DatasetGroup, FileDataset, SnowFlakeDataset } from '../datatypes/datatypes.module';
import { FirebaseService } from '../firebase.service';
import * as uuid from 'uuid';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { FirestoreError } from 'firebase/firestore';

/**
 * Node for to-do item
 */
export interface DatasetNode {
  children: DatasetNode[];
  item: DatasetGroup | SnowFlakeDataset | FileDataset;
}




/** Flat to-do item node with expandable and level information */
export interface flatNode {
  item: DatasetGroup | SnowFlakeDataset | FileDataset
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
  unsubscribeMap:Map<string, any> = new Map<string,any>()
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeToNode = new Map<flatNode, DatasetNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nodeToFlatNode = new Map<DatasetNode, flatNode>();

  treeControl: FlatTreeControl<flatNode>;

  treeFlattener: MatTreeFlattener<DatasetNode, flatNode>;

  dataSource: MatTreeFlatDataSource<DatasetNode, flatNode>;

  _database = new BehaviorSubject<DatasetNode[]>([]);
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
    this.treeControl = new FlatTreeControl<flatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    this._database.subscribe(data => {
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

  getLevel = (node: flatNode) => node.level;

  isExpandable = (node: flatNode) => node.expandable;

  getChildren = (node: DatasetNode): DatasetNode[] => node.children!;

  hasChild = (_: number, _nodeData: flatNode) => _nodeData.expandable;

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: DatasetNode, level: number) => {
    const existingNode = this.nodeToFlatNode.get(node);
    if( existingNode && existingNode.item.id === node.item!.id ){
      var flatNode:flatNode = existingNode
    }
    else{
      var flatNode:flatNode = {
        item: node.item,
        level: level,
        expandable: node.children.length > 0 ? true : false
      }
    }
    this.flatNodeToNode.set(flatNode, node);
    this.nodeToFlatNode.set(node, flatNode);
    return flatNode;
  };


  addGroup() {
    this.router.navigate(["/DatasetGroup-edit"])
  }

  onAddDataset(node:DatasetNode){
    let datasetGroup = node.item as DatasetGroup

    this.router.navigate(["/Dataset-create",datasetGroup.id])
  }

  isDatasetGroup(node:DatasetNode){
    if( !("type" in node.item) ){
      return true
    }
    else{
      return false
    }
  }
  update(){
    this.unsubscribeMap.forEach( (key:string,unsubscribe:any) =>{
      unsubscribe()
    })
    this.unsubscribeMap.clear()    
    let unsubscribe = this.firebaseService.onsnapShotQuery("DatasetGroup",null, null, null,{
      "next":( (set:any)=>{
        var datasets:DatasetNode[] = []
        var transactions = set.docs.map( (item:any) =>{
          var datasetGroup = item.data() as DatasetGroup
          let datasetNode:DatasetNode = {
            children: [],
            item: datasetGroup
          }
          datasets.push( datasetNode )
          return this.loadDatasetForGroup( datasetNode )
        })
        Promise.all( transactions ).then( ()=>{
          datasets.sort( (a,b) => a.item.label.toUpperCase() >= b.item.label.toUpperCase() ? 1:-1 )
          this._database.next(datasets);
        })
      }),
      "error":( (error: FirestoreError) =>{
          alert("ERROR:" + error)
      })
    })
    this.unsubscribeMap.set( "/", unsubscribe )
  }  
  loadDatasetForGroup(datasetNode:DatasetNode):Promise<void>{
    return new Promise<void>((resolve, reject) =>{
      
      let unsubscribe = this.firebaseService.onsnapShotQuery("Dataset","datasetGroupId","==",datasetNode.item.id, {
        "next":( (set:any) =>{
          datasetNode.children.length = 0
          set.docs.map( (doc:any) =>{
            let dataset:Dataset = doc.data() as Dataset
            if( dataset.type == 'FileDataset'){
              var fileDataset = dataset as FileDataset
              let newDatasetNode:DatasetNode = {
                children: [],
                item: fileDataset
              }
              datasetNode.children.push( newDatasetNode )
            }
            else{
              var snowflakeDataset = dataset as SnowFlakeDataset
              let newDatasetNode:DatasetNode = {
                children: [],
                item: snowflakeDataset
              }
              datasetNode.children.push( newDatasetNode )            
            }
          })
          datasetNode.children.sort( (a,b)=> a.item.label > b.item.label ? 1:-1)
          if( !this.unsubscribeMap.get( datasetNode.item.id) ){
            this.unsubscribeMap.set( datasetNode.item.id, unsubscribe)
          }
          else{
            this.reload(this.nodeToFlatNode.get( datasetNode ) )
          }
          resolve()
        }),
        "error":( (error:any) =>{
          alert("ERROR:" +error)
          reject()
        })          
      })
      
      
    })
  }

  isDataset( node:DatasetNode ){
    if( "type" in node.item ){
      return true
    }
    else{
      return false
    }
  }

  editDataset( node:DatasetNode ){
    this.router.navigate(["/Dataset-edit",  node.item.id]);
    
  }

  reload( flatNode:flatNode|null = null ){
    let temp=this.dataSource.data
    this.dataSource.data = []
    this.dataSource.data = temp;   
    if( flatNode ){ 
      this.treeControl.expand( flatNode )
      let node = this.flatNodeToNode.get(flatNode)
      if( node ){
        node.children.map( (childNode) =>{
          let flatChildNode = this.nodeToFlatNode.get(childNode)
          if( flatChildNode ){
             this.treeControl.expand( flatChildNode )
          }
        })
      }
    }
  }

  onEditDatasetGroup( node:DatasetNode ){
    this.router.navigate(["/DatasetGroup-edit/",  node.item.id]);
  }
}
