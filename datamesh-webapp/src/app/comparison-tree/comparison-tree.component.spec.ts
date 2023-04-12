import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparisonTreeComponent } from './comparison-tree.component';

describe('ComparisonTreeComponent', () => {
  let component: ComparisonTreeComponent;
  let fixture: ComponentFixture<ComparisonTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComparisonTreeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComparisonTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
