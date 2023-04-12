import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetTreeComponent } from './dataset-tree.component';

describe('DatasetTreeComponent', () => {
  let component: DatasetTreeComponent;
  let fixture: ComponentFixture<DatasetTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DatasetTreeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatasetTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
