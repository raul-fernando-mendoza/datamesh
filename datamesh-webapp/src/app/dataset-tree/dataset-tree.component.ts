
import {FlatTreeControl} from '@angular/cdk/tree';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject} from 'rxjs';
import { DatasetGroup, FileDataset, SnowFlakeDataset } from '../datatypes/datatypes.module';
import { FirebaseService } from '../firebase.service';
import * as uuid from 'uuid';
import { Router } from '@angular/router';
import { FirestoreError } from 'firebase/firestore';

/**
 * Node for to-do item
 */
export interface DatasetNode {
  children: DatasetNode[];
  item: DatasetGroup | SnowFlakeDataset | FileDataset;
}




/** Flat to-do item node with expandable and level information */
export interface DatasetFlatNode {
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
  unsubscribe:any
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<DatasetFlatNode, DatasetNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<DatasetNode, DatasetFlatNode>();

  treeControl: FlatTreeControl<DatasetFlatNode>;

  treeFlattener: MatTreeFlattener<DatasetNode, DatasetFlatNode>;

  dataSource: MatTreeFlatDataSource<DatasetNode, DatasetFlatNode>;

  _database = new BehaviorSubject<DatasetNode[]>([]);
  constructor(
    private firebaseService:FirebaseService,
    private router:Router
  ) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren,
    );
    this.treeControl = new FlatTreeControl<DatasetFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    this._database.subscribe(data => {
      this.dataSource.data = []
      this.dataSource.data = data;
    });
  }
  ngOnDestroy(): void {
    this.unsubscribe()
  }
  ngOnInit(): void {
    this.unsubscribe = this.firebaseService.onsnapShotQuery("DatasetGroup",null, null, null,{
      "next":( (set:any)=>{
        var datasets:DatasetNode[] = []

        var dataset : FileDataset | SnowFlakeDataset | DatasetGroup
        set.docs.map( (item:any) =>{
          if( item.data()["type"] == 'FileDataset'){
            dataset = item.data() as FileDataset
          }
          else if( item.data()["type"] == 'SnowFlakeDataset'){
            dataset = item.data() as SnowFlakeDataset
          }
          else{
            dataset = item.data() as DatasetGroup
          }
  
          let datasetNode:DatasetNode = {
            children: [],
            item: dataset
          }
          datasets.push( datasetNode )
        })
        datasets.sort( (a,b) => a.item.label.toUpperCase() >= b.item.label.toUpperCase() ? 1:-1 )
        this._database.next(datasets);
      }),
      "error":( (error: FirestoreError) =>{
          alert("ERROR:" + error)
      })
    })
  }


  getLevel = (node: DatasetFlatNode) => node.level;

  isExpandable = (node: DatasetFlatNode) => node.expandable;

  getChildren = (node: DatasetNode): DatasetNode[] => node.children!;

  hasChild = (_: number, _nodeData: DatasetFlatNode) => _nodeData.expandable;

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: DatasetNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    if( existingNode && existingNode.item.id === node.item!.id ){
      var flatNode:DatasetFlatNode = existingNode
    }
    else{
      var flatNode:DatasetFlatNode = {
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
    this.router.navigate(["DatasetGroup-edit"])
  }

  onAddDataset(){
    this.router.navigate(["Dataset-edit"])
  }

  isDatasetGroup(node:DatasetNode){
    if( !("type" in node.item) ){
      return true
    }
    else{
      return false
    }
  }
}
