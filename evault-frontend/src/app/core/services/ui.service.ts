import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  isMobileNavOpen = signal<boolean>(false);

  toggleSidebar(): void {
    this.isMobileNavOpen.update(open => !open);
  }

  closeSidebar(): void {
    this.isMobileNavOpen.set(false);
  }

  openSidebar(): void {
    this.isMobileNavOpen.set(true);
  }
}
