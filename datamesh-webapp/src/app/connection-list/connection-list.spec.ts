import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionList } from './connection-list';

describe('ConnectionList', () => {
  let component: ConnectionList;
  let fixture: ComponentFixture<ConnectionList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectionList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConnectionList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
