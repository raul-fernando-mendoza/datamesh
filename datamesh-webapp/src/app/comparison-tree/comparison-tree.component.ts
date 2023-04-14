
import {FlatTreeControl} from '@angular/cdk/tree';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject} from 'rxjs';
import { Comparison, ComparisonGroup, Dataset, DatasetGroup, FileDataset, SnowFlakeDataset } from '../datatypes/datatypes.module';
import { FirebaseService } from '../firebase.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { FirestoreError } from 'firebase/firestore';


/**
 * Node for to-do item
 */
export interface ComparisonNode {
  children: ComparisonNode[];
  item: Comparison | ComparisonGroup;
}




/** Flat to-do item node with expandable and level information */
export interface ComparisonFlatNode {
  item: Comparison | ComparisonGroup
  level: number
  expandable: boolean
}


/**
 * @title Tree with checkboxes
 */
@Component({
  selector: 'app-comparison-tree',
  templateUrl: './comparison-tree.component.html',
  styleUrls: ['./comparison-tree.component.css']
})
export class ComparisonTreeComponent implements OnInit, OnDestroy {
  unsubscribeMap:Map<string, any> = new Map<string,any>()
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<ComparisonFlatNode, ComparisonNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<ComparisonNode, ComparisonFlatNode>();

  treeControl: FlatTreeControl<ComparisonFlatNode>;

  treeFlattener: MatTreeFlattener<ComparisonNode, ComparisonFlatNode>;

  dataSource: MatTreeFlatDataSource<ComparisonNode, ComparisonFlatNode>;

  _database = new BehaviorSubject<ComparisonNode[]>([]);
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
    this.treeControl = new FlatTreeControl<ComparisonFlatNode>(this.getLevel, this.isExpandable);
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

  getLevel = (node: ComparisonFlatNode) => node.level;

  isExpandable = (node: ComparisonFlatNode) => node.expandable;

  getChildren = (node: ComparisonNode): ComparisonNode[] => node.children!;

  hasChild = (_: number, _nodeData: ComparisonFlatNode) => _nodeData.expandable;

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: ComparisonNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    if( existingNode && existingNode.item.id === node.item!.id ){
      var flatNode:ComparisonFlatNode = existingNode
    }
    else{
      var flatNode:ComparisonFlatNode = {
        item: node.item,
        level: level,
        expandable: node.children.length > 0 ? true : false
      }
    }
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };


  addGroup() {
    this.router.navigate(["/ComparisonGroup-edit"])
  }

  onAddDataset(node:ComparisonNode){
    let datasetGroup = node.item as DatasetGroup

    this.router.navigate(["/Comparison-create",datasetGroup.id])
  }

  isDatasetGroup(node:ComparisonNode){
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
        var datasets:ComparisonNode[] = []

        var transactions = set.docs.map( (item:any) =>{
          var datasetGroup = item.data() as Comparison
          let datasetNode:ComparisonNode = {
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
  loadDatasetForGroup(datasetNode:ComparisonNode):Promise<void>{
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
            this.reload(this.nestedNodeMap.get( datasetNode ) )
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

  isDataset( node:ComparisonNode ){
    if( "type" in node.item ){
      return true
    }
    else{
      return false
    }
  }

  editDataset( node:ComparisonNode ){
    this.router.navigate(["/Dataset-edit/",  node.item.id]);
    
  }

  reload( node:DatasetFlatNode|null = null ){
    let temp=this.dataSource.data
    this.dataSource.data = []
    this.dataSource.data = temp;    
    if( node ){ 
      this.treeControl.expand( node )
    }
  }

  onEditDatasetGroup( node:DatasetNode ){
    this.router.navigate(["/DatasetGroup-edit/",  node.item.id]);
  }
}
