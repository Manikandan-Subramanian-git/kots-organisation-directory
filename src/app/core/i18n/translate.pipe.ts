import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService, TranslationParams } from './translation.service';

@Pipe({
  name: 't',
  standalone: true,
  pure: false // Impure so it responds immediately to signal changes
})
export class TranslatePipe implements PipeTransform {
  private readonly translationService = inject(TranslationService);

  transform(key: string, params?: TranslationParams): string {
    if (!key) return '';
    return this.translationService.t(key, params);
  }
}

