import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetgroupEditComponent } from './datasetgroup-edit.component';

describe('DatasetgroupEditComponent', () => {
  let component: DatasetgroupEditComponent;
  let fixture: ComponentFixture<DatasetgroupEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DatasetgroupEditComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatasetgroupEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
