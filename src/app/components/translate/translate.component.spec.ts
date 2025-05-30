import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { TranslatorComponent } from './translate.component'; // Cambia Translate por Translator

describe('TranslatorComponent', () => {  // Cambia TranslateComponent por TranslatorComponent
  let component: TranslatorComponent;
  let fixture: ComponentFixture<TranslatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TranslatorComponent],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TranslatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
