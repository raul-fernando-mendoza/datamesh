import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparisonExecuteComponent } from './comparison-execute.component';

describe('ComparisonExecuteComponent', () => {
  let component: ComparisonExecuteComponent;
  let fixture: ComponentFixture<ComparisonExecuteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [ComparisonExecuteComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(ComparisonExecuteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
