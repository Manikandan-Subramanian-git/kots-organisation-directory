import { Component, OnInit, inject, signal, output, HostListener } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { OrganisationStore } from '../../core/store/organisation.store';
import { OrganisationApiService } from '../../core/services/organisation-api.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

interface CreateOrgForm {
  name: FormControl<string>;
  status: FormControl<string>;
  ownerEmail: FormControl<string>;
  memberCount: FormControl<number | null>;
}

@Component({
  selector: 'app-org-create-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div
        class="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
      >
        <!-- Modal Header -->
        <div class="modal-header">
          <div>
            <h2 id="dialog-title" class="modal-title">{{ 'createModal.dialogTitle' | t }}</h2>
            <p id="dialog-desc" class="modal-desc">{{ 'createModal.dialogDescription' | t }}</p>
          </div>
          <button
            type="button"
            class="btn-close"
            (click)="closeModal.emit()"
            [attr.aria-label]="'createModal.closeAria' | t"
          >
            ✕
          </button>
        </div>

        <!-- Submission Error Alert Banner (FR3: Submit button must not be only indicator) -->
        @if (submissionError()) {
          <div class="alert-banner" role="alert">
            <svg class="alert-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span>{{ submissionError() }}</span>
          </div>
        }

        <!-- Typed Non-Nullable Reactive Form (FR3) -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="form-body">
          <!-- Name Field (Required, 3-80 chars, unique case-insensitive) -->
          <div class="form-field">
            <label for="org-name" class="field-label">
              {{ 'createModal.fieldName' | t }} <span class="required-star">*</span>
            </label>
            <input
              id="org-name"
              type="text"
              class="form-input"
              [class.input-invalid]="isFieldInvalid('name')"
              formControlName="name"
              [placeholder]="'createModal.fieldNamePlaceholder' | t"
              [attr.aria-invalid]="isFieldInvalid('name')"
              [attr.aria-describedby]="isFieldInvalid('name') ? 'name-error' : null"
              maxlength="80"
            />
            <!-- Field error shown ONLY on blur (touched), never on every keystroke -->
            @if (isFieldInvalid('name')) {
              <div id="name-error" class="field-error" role="alert">
                @if (form.controls.name.hasError('required')) {
                  <span>{{ 'createModal.errors.nameRequired' | t }}</span>
                } @else if (form.controls.name.hasError('minlength')) {
                  <span>{{ 'createModal.errors.nameMinLength' | t }}</span>
                } @else if (form.controls.name.hasError('maxlength')) {
                  <span>{{ 'createModal.errors.nameMaxLength' | t }}</span>
                } @else if (form.controls.name.hasError('nameTaken')) {
                  <span>{{ 'createModal.errors.nameUnique' | t }}</span>
                }
              </div>
            }
          </div>

          <!-- Status Field (Required) -->
          <div class="form-field">
            <label for="org-status" class="field-label">
              {{ 'createModal.fieldStatus' | t }} <span class="required-star">*</span>
            </label>
            <select
              id="org-status"
              class="form-select"
              [class.input-invalid]="isFieldInvalid('status')"
              formControlName="status"
              [attr.aria-invalid]="isFieldInvalid('status')"
              [attr.aria-describedby]="isFieldInvalid('status') ? 'status-error' : null"
            >
              <option value="" disabled>{{ 'createModal.fieldStatusSelect' | t }}</option>
              <option value="active">{{ 'status.active' | t }}</option>
              <option value="inactive">{{ 'status.inactive' | t }}</option>
              <option value="suspended">{{ 'status.suspended' | t }}</option>
            </select>
            @if (isFieldInvalid('status')) {
              <div id="status-error" class="field-error" role="alert">
                <span>{{ 'createModal.errors.statusRequired' | t }}</span>
              </div>
            }
          </div>

          <!-- Owner Email Field (Required, valid email) -->
          <div class="form-field">
            <label for="org-owner-email" class="field-label">
              {{ 'createModal.fieldOwnerEmail' | t }} <span class="required-star">*</span>
            </label>
            <input
              id="org-owner-email"
              type="email"
              class="form-input"
              [class.input-invalid]="isFieldInvalid('ownerEmail')"
              formControlName="ownerEmail"
              [placeholder]="'createModal.fieldOwnerEmailPlaceholder' | t"
              [attr.aria-invalid]="isFieldInvalid('ownerEmail')"
              [attr.aria-describedby]="isFieldInvalid('ownerEmail') ? 'ownerEmail-error' : null"
            />
            @if (isFieldInvalid('ownerEmail')) {
              <div id="ownerEmail-error" class="field-error" role="alert">
                @if (form.controls.ownerEmail.hasError('required')) {
                  <span>{{ 'createModal.errors.ownerEmailRequired' | t }}</span>
                } @else if (form.controls.ownerEmail.hasError('email')) {
                  <span>{{ 'createModal.errors.ownerEmailInvalid' | t }}</span>
                }
              </div>
            }
          </div>

          <!-- Member Count Field (Optional, >= 0) -->
          <div class="form-field">
            <label for="org-member-count" class="field-label">
              {{ 'createModal.fieldMemberCount' | t }}
            </label>
            <input
              id="org-member-count"
              type="number"
              min="0"
              step="1"
              class="form-input"
              [class.input-invalid]="isFieldInvalid('memberCount')"
              formControlName="memberCount"
              [placeholder]="'createModal.fieldMemberCountPlaceholder' | t"
              [attr.aria-invalid]="isFieldInvalid('memberCount')"
              [attr.aria-describedby]="isFieldInvalid('memberCount') ? 'memberCount-error' : 'memberCount-help'"
            />
            <span id="memberCount-help" class="field-help">{{ 'createModal.memberCountHelp' | t }}</span>
            @if (isFieldInvalid('memberCount')) {
              <div id="memberCount-error" class="field-error" role="alert">
                @if (form.controls.memberCount.hasError('min')) {
                  <span>{{ 'createModal.errors.memberCountMin' | t }}</span>
                } @else if (form.controls.memberCount.hasError('pattern')) {
                  <span>{{ 'createModal.errors.memberCountPattern' | t }}</span>
                }
              </div>
            }
          </div>

          <!-- Actions -->
          <div class="modal-actions">
            <button
              type="button"
              class="btn btn-cancel"
              (click)="closeModal.emit()"
            >
              {{ 'createModal.cancelButton' | t }}
            </button>
            <button
              type="submit"
              class="btn btn-submit"
              [disabled]="isSubmitting()"
            >
              @if (isSubmitting()) {
                <span class="btn-spinner"></span>
                <span>{{ 'createModal.submittingButton' | t }}</span>
              } @else {
                <span>{{ 'createModal.submitButton' | t }}</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4);
      z-index: 1000;
    }

    .modal-card {
      background-color: var(--color-bg-surface);
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border-subtle);
      box-shadow: var(--shadow-xl);
      width: 100%;
      max-width: 520px;
      overflow: hidden;
      animation: modal-enter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modal-enter {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .modal-header {
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--color-border-subtle);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-4);
    }

    .modal-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .modal-desc {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      margin-top: var(--space-1);
    }

    .btn-close {
      color: var(--color-text-muted);
      font-size: var(--font-size-base);
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color var(--transition-fast);
    }

    .btn-close:hover {
      background-color: var(--color-bg-muted);
      color: var(--color-text-primary);
    }

    .alert-banner {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin: var(--space-4) var(--space-6) 0;
      padding: var(--space-3) var(--space-4);
      background-color: var(--color-error-bg);
      color: var(--color-error-fg);
      border: 1px solid var(--color-error-border);
      border-radius: var(--radius-md);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
    }

    .alert-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .form-body {
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .field-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
    }

    .required-star {
      color: var(--color-error-fg);
    }

    .form-input, .form-select {
      height: 40px;
      padding: 0 var(--space-3);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      background-color: var(--color-bg-subtle);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      transition: border-color var(--transition-fast), background-color var(--transition-fast);
    }

    .form-input:focus, .form-select:focus {
      background-color: var(--color-bg-surface);
      border-color: var(--color-brand);
      outline: none;
      box-shadow: var(--shadow-focus);
    }

    .input-invalid {
      border-color: var(--color-error-border) !important;
      background-color: var(--color-error-bg) !important;
    }

    .field-error {
      font-size: var(--font-size-xs);
      color: var(--color-error-fg);
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .field-help {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .modal-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border-subtle);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-5);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
    }

    .btn-cancel {
      background-color: var(--color-bg-subtle);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border-default);
    }

    .btn-cancel:hover {
      background-color: var(--color-bg-muted);
      color: var(--color-text-primary);
    }

    .btn-submit {
      background-color: var(--color-brand);
      color: var(--color-brand-contrast);
      box-shadow: var(--shadow-sm);
    }

    .btn-submit:hover:not(:disabled) {
      background-color: var(--color-brand-hover);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #fff;
      border-radius: var(--radius-full);
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class OrgCreateDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(OrganisationStore);
  private readonly apiService = inject(OrganisationApiService);

  readonly closeModal = output<void>();
  readonly created = output<void>();

  readonly isSubmitting = signal<boolean>(false);
  readonly submissionError = signal<string | null>(null);

  /**
   * Typed, non-nullable Reactive Form (FR3)
   */
  readonly form: FormGroup<CreateOrgForm> = this.fb.group({
    name: this.fb.control('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(80),
        this.caseInsensitiveUniqueValidator()
      ]
    }),
    status: this.fb.control('active', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    ownerEmail: this.fb.control('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email
      ]
    }),
    memberCount: this.fb.control<number | null>(0, {
      validators: [Validators.min(0)]
    })
  });

  ngOnInit(): void {
    // Form is ready
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal.emit();
    }
  }

  /**
   * Checks if field error should be shown.
   * Condition: invalid AND touched (strictly on blur, never on keystroke!)
   */
  isFieldInvalid(fieldName: keyof CreateOrgForm): boolean {
    const ctrl = this.form.controls[fieldName];
    return ctrl.invalid && ctrl.touched;
  }

  /**
   * Custom validator for case-insensitive unique organisation name (FR3)
   */
  private caseInsensitiveUniqueValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = typeof control.value === 'string' ? control.value.trim() : '';
      if (!value) return null;
      if (this.apiService.isNameTaken(value)) {
        return { nameTaken: true };
      }
      return null;
    };
  }

  async onSubmit(): Promise<void> {
    this.submissionError.set(null);

    // If form is invalid, mark all fields as touched to trigger blur error displays
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submissionError.set('Please fix the highlighted field errors before submitting.');
      return;
    }

    this.isSubmitting.set(true);

    try {
      const rawValues = this.form.getRawValue();
      await this.store.addOrganisation({
        name: rawValues.name,
        status: rawValues.status,
        ownerEmail: rawValues.ownerEmail,
        memberCount: rawValues.memberCount
      });

      this.isSubmitting.set(false);
      this.created.emit();
      this.closeModal.emit();
    } catch (err: unknown) {
      this.isSubmitting.set(false);
      const msg = err instanceof Error ? err.message : 'Failed to create organisation.';
      this.submissionError.set(msg);
    }
  }
}
