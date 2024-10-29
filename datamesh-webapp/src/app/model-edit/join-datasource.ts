import { CollectionViewer, DataSource, SelectionChange } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { JoinNode } from "app/datatypes/datatypes.module";
import { BehaviorSubject, Observable,  of, Subscriber  } from "rxjs";

export class JoinDataSource extends DataSource<JoinNode> {



    data:JoinNode[] = [{ name:"hi", children:[] }]
    private subscriber: Subscriber<JoinNode[]> | null = null

    observable = new BehaviorSubject<JoinNode[]>([]);

    constructor(private _treeControl: FlatTreeControl<JoinNode>) {
        super();
    }

    connect(collectionViewer: CollectionViewer): Observable<readonly JoinNode[]> {
        this._treeControl.expansionModel.changed.subscribe(change => {
            if (
              (change as SelectionChange<JoinNode>).added ||
              (change as SelectionChange<JoinNode>).removed
            ) {
              this.handleTreeControl(change as SelectionChange<JoinNode>);
            }
          });
                  
        return this.observable       
    }

    disconnect(collectionViewer: CollectionViewer): void {
    }
    onAddjoin(parentNode:JoinNode | null, newNode:JoinNode){
        if( parentNode ){
            parentNode.children.push( newNode )
        }
        else{
            this.data.push(newNode)
        }
        this.observable.next(this.data);
    }
    setData(data:JoinNode[]){
        this.data.length = 0;
        data.map( n => this.data.push(n))
        this.observable.next(this.data);
    }
    handleTreeControl(change: SelectionChange<JoinNode>) {
       
        if (change.added) {
          change.added.forEach(node => console.log(node, true));
        }
        if (change.removed) {
          change.removed
            .slice()
            .reverse()
            .forEach(node => console.log(node, false));
        }
      }
    
}