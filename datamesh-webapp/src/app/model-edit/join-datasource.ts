import { CollectionViewer, SelectionChange } from '@angular/cdk/collections';
import { NestedTreeControl } from '@angular/cdk/tree';
import { Injectable } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { InfoNode } from "app/datatypes/datatypes.module";
import { BehaviorSubject, Observable,  of, Subscriber  } from "rxjs";



export interface TreeNode{
  item:InfoNode
  isLast:boolean
  childrenNodes:TreeNode[]
  parentTreeNode:TreeNode | null
}

@Injectable()
export class JoinDataSource extends MatTreeNestedDataSource<TreeNode>{
    private observable = new BehaviorSubject<TreeNode[]>([]);
    
    
    override get data(): TreeNode[] { 
      return this.observable.value; 
    }
    

    constructor() {
      super()
      this.observable.next([]);       
    }

    override connect(collectionViewer: CollectionViewer): Observable<TreeNode[]>{
        return this.observable       
    }

    override disconnect(): void {
    }
    setData(data:InfoNode[]){
        this.data.length = 0;

        var tree:TreeNode[] = [];
        data.map( node => {
          var rootNode:TreeNode = {
            item:node,
            isLast: false,
            childrenNodes: [],
            parentTreeNode: null
          }
          tree.push(rootNode)
          this.addNodeChildren(rootNode, node.children)
        })
        if(tree.length){
          tree[tree.length -1].isLast = true
        }
        this.observable.next(tree);
    }
    addNodeChildren(parentNode:TreeNode, children: InfoNode[] | undefined){
      if(children){
        children.map( node => {
          var childNode:TreeNode = {
            item:node,
            isLast: false,
            childrenNodes: [],
            parentTreeNode: parentNode
          }
          parentNode.childrenNodes.push(childNode)
          this.addNodeChildren(childNode, node.children)
        })
        if(parentNode.childrenNodes.length){
          parentNode.childrenNodes[parentNode.childrenNodes.length -1].isLast = true
        }
      }
    }
}