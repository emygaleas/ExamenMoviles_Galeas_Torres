import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableroPage } from './tablero.page';

describe('TableroPage', () => {
  let component: TableroPage;
  let fixture: ComponentFixture<TableroPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableroPage]
    }).compileComponents();

    fixture = TestBed.createComponent(TableroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
