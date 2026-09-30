import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CaseService } from '../../../core/services/case.service';
import { DocumentService } from '../../../core/services/document.service';
import { CaseResponse } from '../../../core/models/case.model';
import { DocumentResponse } from '../../../core/models/document.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <header class="app-navbar">
      <div class="navbar-left">
        <a routerLink="/dashboard" class="brand-link">
          <div class="emblem-container">
            <span class="material-icons emblem-icon">gavel</span>
          </div>

          <div class="brand-text">
            <span class="brand-title">eVault</span>
            <span class="brand-subtitle">National Digital Legal & Evidence Vault</span>
          </div>
        </a>

        <!-- Demo Mode Environment Badge -->
        <div class="demo-env-badge" title="Local demonstration environment with mock IPFS and simulated EVM blockchain anchor">
          <span class="demo-env-dot"></span>
          <span class="demo-env-text">DEMO ENVIRONMENT: LOCAL IPFS & BLOCKCHAIN</span>
        </div>
      </div>

      <div class="navbar-center">
        <!-- Quick Global Search Button -->
        <button type="button" class="quick-search-btn" (click)="openSearchModal()" title="Global Search dockets, FIR, hash (Ctrl+K)">
          <span class="material-icons-outlined search-icon">search</span>
          <span class="search-text">Search dockets, FIR, hash...</span>
          <kbd class="search-kbd">Ctrl K</kbd>
        </button>

        <!-- SIH Presentation Tour Button -->
        <button type="button" class="sih-tour-btn" (click)="toggleTourModal()" title="Launch SIH Presentation Mode">
          <span class="material-icons-outlined tour-icon">play_circle</span>
          <span class="tour-text">SIH Demo Mode (10-Step Tour)</span>
        </button>

        <a routerLink="/verification" class="verify-badge-btn" title="Instant Cryptographic Verification">
          <span class="material-icons shield-icon">verified_user</span>
          <span>Verify Document</span>
        </a>
      </div>

      <div class="navbar-right">
        @if (authService.isAuthenticated()) {
          <div class="user-menu-wrapper">
            <button type="button" class="user-identity-pill" (click)="toggleUserDropdown()" aria-label="Toggle user options">
              <div class="avatar-circle">
                {{ getUserInitials() }}
              </div>

              <div class="user-info">
                <span class="user-name">{{ authService.userFullName() }}</span>
                <span class="user-role-badge">{{ formatRole(authService.userRole()) }}</span>
              </div>
              <span class="material-icons dropdown-arrow">{{ userDropdownOpen ? 'expand_less' : 'expand_more' }}</span>
            </button>

            <!-- Quick Role Switcher Dropdown -->
            @if (userDropdownOpen) {
              <div class="user-dropdown-menu">
                <div class="dropdown-header">
                  <span class="dropdown-header-title">SIH Evaluator Quick Switch</span>
                  <span class="dropdown-header-sub">Switch judicial persona instantly</span>
                </div>

                <button type="button" class="role-switch-item" (click)="switchRole('judge', 'Judge')">
                  <span class="material-icons role-ic judge">gavel</span>
                  <div class="role-tx">
                    <strong>Hon'ble Justice K. S. Verma</strong>
                    <small>Judge • Special Sessions Court</small>
                  </div>
                  @if (authService.isJudge()) { <span class="active-dot">●</span> }
                </button>

                <button type="button" class="role-switch-item" (click)="switchRole('officer', 'Investigating Officer')">
                  <span class="material-icons role-ic officer">local_police</span>
                  <div class="role-tx">
                    <strong>Insp. Rajesh V. Sharma</strong>
                    <small>Investigating Officer • Cyber Crime</small>
                  </div>
                  @if (authService.isOfficer()) { <span class="active-dot">●</span> }
                </button>

                <button type="button" class="role-switch-item" (click)="switchRole('prosecutor', 'Prosecutor')">
                  <span class="material-icons role-ic prosecutor">balance</span>
                  <div class="role-tx">
                    <strong>Adv. Sunita Rao</strong>
                    <small>Public Prosecutor • Directorate</small>
                  </div>
                  @if (authService.isProsecutor()) { <span class="active-dot">●</span> }
                </button>

                <button type="button" class="role-switch-item" (click)="switchRole('lawyer', 'Defense Advocate')">
                  <span class="material-icons role-ic lawyer">work</span>
                  <div class="role-tx">
                    <strong>Adv. Vikramaditya Sen</strong>
                    <small>Defense Advocate • Bar Council</small>
                  </div>
                  @if (authService.isLawyer()) { <span class="active-dot">●</span> }
                </button>

                <button type="button" class="role-switch-item" (click)="switchRole('admin', 'Administrator')">
                  <span class="material-icons role-ic admin">admin_panel_settings</span>
                  <div class="role-tx">
                    <strong>Dr. Amitabh Sen</strong>
                    <small>Super Administrator • e-Governance</small>
                  </div>
                  @if (authService.isSuperAdmin()) { <span class="active-dot">●</span> }
                </button>

                <div class="dropdown-divider"></div>

                <button type="button" class="dropdown-logout-item" (click)="logout()">
                  <span class="material-icons">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            }
          </div>
        } @else {
          <a routerLink="/auth/login" class="gov-btn gov-btn-primary btn-sm">
            <span class="material-icons">login</span>
            <span>Judicial Login</span>
          </a>
        }
      </div>
    </header>

    <!-- SIH Presentation Walkthrough Modal (Official White Theme) -->
    @if (tourModalOpen) {
      <div class="tour-backdrop" (click)="closeTourModal()">
        <div class="tour-modal" (click)="$event.stopPropagation()">
          <div class="tour-header">
            <div class="tour-title-wrap">
              <span class="material-icons tour-title-icon">auto_awesome</span>
              <div>
                <h2>SIH26190 — 10-Step Evaluator Presentation Walkthrough</h2>
                <p>Guided demonstration of blockchain evidence anchoring, cryptographic verification, and tamper detection</p>
              </div>
            </div>
            <button type="button" class="tour-close-btn" (click)="closeTourModal()" aria-label="Close Tour">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="tour-body">
            <div class="tour-steps-list">
              @for (step of tourSteps; track step.num) {
                <div class="tour-step-card" [class.completed]="step.num < currentStep" [class.current]="step.num === currentStep">
                  <div class="step-num-badge">{{ step.num }}</div>
                  <div class="step-info">
                    <h4>{{ step.title }}</h4>
                    <p>{{ step.description }}</p>
                  </div>
                  <button type="button" class="gov-btn gov-btn-secondary btn-xs" (click)="executeTourStep(step)">
                    <span>{{ step.actionLabel }}</span>
                    <span class="material-icons">arrow_forward</span>
                  </button>
                </div>
              }
            </div>
          </div>

          <div class="tour-footer">
            <div class="tour-footer-note">
              <span class="material-icons info-sm">info</span>
              <span>All steps execute live against the local Spring Boot REST APIs, simulated EVM blockchain, and IPFS cluster.</span>
            </div>
            <button type="button" class="gov-btn gov-btn-primary" (click)="closeTourModal()">
              <span>Close Walkthrough</span>
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Global Quick Search Modal (Official White Theme) -->
    @if (searchModalOpen) {
      <div class="search-backdrop" (click)="closeSearchModal()">
        <div class="search-dialog" (click)="$event.stopPropagation()">
          <div class="search-input-wrap">
            <span class="material-icons search-input-icon">search</span>
            <input 
              #searchInput 
              type="text" 
              class="search-main-input" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="onSearchQueryChange()"
              placeholder="Search court cases by FIR, docket number, or documents by SHA-256 hash / IPFS CID..." 
              autofocus
            />
            @if (searchQuery) {
              <button type="button" class="search-clear-btn" (click)="clearSearch()">
                <span class="material-icons">close</span>
              </button>
            }
            <kbd class="search-esc-kbd" (click)="closeSearchModal()">ESC</kbd>
          </div>

          <div class="search-results-container">
            @if (!searchQuery) {
              <div class="search-suggestions">
                <span class="suggestion-header">QUICK JUMP TARGETS & DOCKETS</span>
                <div class="suggestion-grid">
                  <div class="suggestion-item" (click)="selectCase(1)">
                    <span class="material-icons">folder</span>
                    <div>
                      <strong>CASE-2026-0001 (State vs. Rajesh Kumar)</strong>
                      <small>FIR No. 0124/2026 • Cyber Frauds & Digital Evidence</small>
                    </div>
                  </div>
                  <div class="suggestion-item" (click)="selectCase(2)">
                    <span class="material-icons">folder</span>
                    <div>
                      <strong>CASE-2026-0002 (CBI vs. Tech Syndicate)</strong>
                      <small>FIR No. 0089/2026 • Financial Ledger Embezzlement</small>
                    </div>
                  </div>
                  <div class="suggestion-item" (click)="navigateTo('/verification')">
                    <span class="material-icons text-success">security</span>
                    <div>
                      <strong>Independent Document Hash Verifier</strong>
                      <small>Upload any file to calculate SHA-256 and match on-chain</small>
                    </div>
                  </div>
                  <div class="suggestion-item" (click)="navigateTo('/cases')">
                    <span class="material-icons text-primary">gavel</span>
                    <div>
                      <strong>Full Court Case Registry</strong>
                      <small>Browse all active judicial dockets</small>
                    </div>
                  </div>
                </div>
              </div>
            } @else {
              <!-- Case Results -->
              @if (matchingCases.length > 0) {
                <div class="search-group">
                  <span class="group-title">MATCHING CASES & DOCKETS ({{ matchingCases.length }})</span>
                  @for (c of matchingCases; track c.id) {
                    <div class="result-row" (click)="selectCase(c.id)">
                      <div class="result-left">
                        <span class="material-icons result-icon">folder_special</span>
                        <div>
                          <div class="result-main-text">
                            <strong>{{ c.caseNumber }}</strong> — {{ c.title }}
                          </div>
                          <div class="result-sub-text">
                            FIR: {{ c.firNumber }} • {{ c.courtName }} • Status: {{ c.status }}
                          </div>
                        </div>
                      </div>
                      <span class="badge badge-info">{{ c.priority }}</span>
                    </div>
                  }
                </div>
              }

              <!-- Document Results -->
              @if (matchingDocuments.length > 0) {
                <div class="search-group">
                  <span class="group-title">MATCHING LEGAL DOCUMENTS ({{ matchingDocuments.length }})</span>
                  @for (d of matchingDocuments; track d.id) {
                    <div class="result-row" (click)="selectDocument(d)">
                      <div class="result-left">
                        <span class="material-icons result-icon">description</span>
                        <div>
                          <div class="result-main-text">
                            <strong>{{ d.title }}</strong> ({{ d.documentType }})
                          </div>
                          <div class="result-sub-text font-mono">
                            SHA-256: {{ d.sha256Hash | slice:0:16 }}... • CID: {{ d.ipfsCid | slice:0:12 }}...
                          </div>
                        </div>
                      </div>
                      <span class="badge badge-success">ANCHORED</span>
                    </div>
                  }
                </div>
              }

              @if (matchingCases.length === 0 && matchingDocuments.length === 0) {
                <div class="search-empty">
                  <span class="material-icons">search_off</span>
                  <p>No docket or document matches "<strong>{{ searchQuery }}</strong>"</p>
                  <button type="button" class="gov-btn gov-btn-secondary btn-sm" (click)="navigateTo('/verification')">
                    <span class="material-icons">fingerprint</span>
                    Verify as Arbitrary File Hash
                  </button>
                </div>
              }
            }
          </div>

          <div class="search-footer">
            <span class="footer-tip"><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
            <span class="footer-tip"><kbd>ESC</kbd> to close</span>
            <span class="footer-tip">Powered by eVAULT Cryptographic Index</span>
          </div>
        </div>
      </div>
    }
  `,

  styles: [`
    /* =========================================================
       MAIN NAVBAR
       ========================================================= */

    .app-navbar {
      height: 64px;
      flex-shrink: 0;
      background-color: #0f172a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      border-bottom: 2px solid #1e293b;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      box-sizing: border-box;
      width: 100%;
    }


    /* =========================================================
       LEFT / BRAND
       ========================================================= */

    .navbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 0;
    }

    .brand-link {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: inherit;
      min-width: 0;
    }

    .emblem-container {
      width: 38px;
      height: 38px;
      background: rgba(217, 119, 6, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #f59e0b;
      flex-shrink: 0;
    }

    .emblem-icon {
      font-size: 20px;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .brand-title {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.2;
      color: #ffffff;
    }

    .brand-subtitle {
      font-size: 0.65rem;
      color: #94a3b8;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-weight: 600;
      white-space: nowrap;
    }


    /* =========================================================
       CENTER VERIFY BUTTON
       ========================================================= */

    .navbar-center {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .quick-search-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      color: #94a3b8;
      cursor: pointer;
      font-size: 13px;
      transition: all var(--transition-fast);

      &:hover {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(255, 255, 255, 0.3);
        color: #ffffff;
      }

      .search-icon {
        font-size: 16px;
        color: #94a3b8;
      }

      .search-text {
        font-size: 12px;
      }

      .search-kbd {
        font-size: 10px;
        font-family: var(--font-mono);
        padding: 2px 6px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: #cbd5e1;
      }
    }

    .verify-badge-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #34d399;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .shield-icon {
      font-size: 16px;
    }

    .verify-badge-btn:hover {
      background: rgba(16, 185, 129, 0.25);
      color: #6ee7b7;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
    }


    /* =========================================================
       RIGHT / USER
       ========================================================= */

    .navbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
    }

    .user-identity-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #1e293b;
      border: 1px solid #334155;
      padding: 5px 14px 5px 6px;
      border-radius: 9999px;
      user-select: none;
      max-width: 260px;
    }

    .avatar-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #2563eb;
      color: #ffffff;
      font-weight: 700;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(255, 255, 255, 0.15);
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.15;
      min-width: 0;
    }

    .user-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #f8fafc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 190px;
    }

    .user-role-badge {
      font-size: 0.625rem;
      font-weight: 700;
      color: #93c5fd;
      letter-spacing: 0.05em;
    }


    /* =========================================================
       TABLET
       ========================================================= */

    @media (max-width: 900px) {

      .app-navbar {
        padding: 0 16px;
      }

      .brand-subtitle {
        font-size: 0.58rem;
      }

      .user-name {
        max-width: 150px;
      }

    }


    /* =========================================================
       MOBILE
       ========================================================= */

    @media (max-width: 768px) {

      .app-navbar {
        height: 58px;
        padding: 0 12px;
        gap: 8px;
      }

      .navbar-left {
        flex: 1;
        min-width: 0;
      }

      .brand-link {
        gap: 8px;
        min-width: 0;
      }

      .emblem-container {
        width: 34px;
        height: 34px;
      }

      .emblem-icon {
        font-size: 18px;
      }

      .brand-text {
        min-width: 0;
      }

      .brand-title {
        font-size: 1rem;
      }

      .brand-subtitle {
        font-size: 0.52rem;
        line-height: 1.15;
        max-width: 150px;
        white-space: normal;
      }

      .navbar-center {
        flex-shrink: 0;
      }

      .verify-badge-btn {
        padding: 6px 10px;
        gap: 5px;
        font-size: 0.7rem;
        white-space: nowrap;
      }

      .shield-icon {
        font-size: 14px;
      }

      .navbar-right {
        flex-shrink: 0;
        gap: 0;
      }

      .user-identity-pill {
        padding: 4px;
        border-radius: 50%;
        max-width: none;
      }

      .avatar-circle {
        width: 32px;
        height: 32px;
      }

      .user-info {
        display: none;
      }

    }


    /* =========================================================
       SMALL MOBILE
       ========================================================= */

    @media (max-width: 480px) {

      .app-navbar {
        height: 56px;
        padding: 0 8px;
        gap: 6px;
      }

      .brand-link {
        gap: 6px;
      }

      .emblem-container {
        width: 32px;
        height: 32px;
      }

      .emblem-icon {
        font-size: 17px;
      }

      .brand-title {
        font-size: 0.95rem;
      }

      .brand-subtitle {
        display: none;
      }

      .verify-badge-btn {
        padding: 6px 9px;
        font-size: 0.68rem;
        gap: 4px;
      }

      .shield-icon {
        font-size: 13px;
      }

      .avatar-circle {
        width: 31px;
        height: 31px;
      }

    }


    /* =========================================================
       VERY SMALL MOBILE
       ========================================================= */

    @media (max-width: 360px) {

      .app-navbar {
        padding: 0 6px;
        gap: 5px;
      }

      .emblem-container {
        width: 30px;
        height: 30px;
      }

      .emblem-icon {
        font-size: 16px;
      }

      .brand-title {
        font-size: 0.9rem;
      }

      .verify-badge-btn {
        padding: 5px 7px;
        font-size: 0.62rem;
      }

      .shield-icon {
        font-size: 12px;
      }

      .avatar-circle {
        width: 30px;
        height: 30px;
        font-size: 0.7rem;
      }

    }

    /* Demo Environment Badge */
    .demo-env-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      padding: 4px 10px;
      border-radius: 9999px;
      margin-left: 8px;
    }

    .demo-env-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #f59e0b;
      box-shadow: 0 0 6px #f59e0b;
    }

    .demo-env-text {
      font-size: 0.65rem;
      font-family: var(--font-mono);
      font-weight: 700;
      color: #fbbf24;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }

    /* SIH Tour Button */
    .sih-tour-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #1e3a8a, #2563eb);
      color: #ffffff;
      border: 1px solid #3b82f6;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      margin-right: 10px;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
      transition: all 0.2s ease;

      .tour-icon {
        font-size: 17px;
        color: #93c5fd;
      }

      &:hover {
        background: linear-gradient(135deg, #1d4ed8, #3b82f6);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.45);
      }
    }

    /* User Menu Dropdown */
    .user-menu-wrapper {
      position: relative;
    }

    .user-identity-pill {
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #1e293b;
      border: 1px solid #334155;
      padding: 4px 12px 4px 5px;
      border-radius: 9999px;
      color: inherit;

      &:hover {
        background: #334155;
      }

      .dropdown-arrow {
        font-size: 18px;
        color: #94a3b8;
      }
    }

    .user-dropdown-menu {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      width: 290px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.15);
      padding: 10px;
      z-index: 1200;
      animation: fadeIn 0.15s ease-out;

      .dropdown-header {
        padding: 6px 10px 10px;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 6px;

        .dropdown-header-title {
          display: block;
          font-size: 0.75rem;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dropdown-header-sub {
          display: block;
          font-size: 0.6875rem;
          color: #64748b;
        }
      }

      .role-switch-item {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        background: none;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s;

        &:hover {
          background: #f1f5f9;
        }

        .role-ic {
          font-size: 20px;
          padding: 6px;
          border-radius: 6px;

          &.judge { background: #fef3c7; color: #b45309; }
          &.officer { background: #e0f2fe; color: #0369a1; }
          &.prosecutor { background: #f3e8ff; color: #7e22ce; }
          &.lawyer { background: #ffedd5; color: #c2410c; }
          &.admin { background: #fee2e2; color: #b91c1c; }
        }

        .role-tx {
          display: flex;
          flex-direction: column;
          flex: 1;

          strong {
            font-size: 0.75rem;
            color: #0f172a;
          }

          small {
            font-size: 0.65rem;
            color: #64748b;
          }
        }

        .active-dot {
          color: #2563eb;
          font-size: 14px;
        }
      }

      .dropdown-divider {
        height: 1px;
        background: #e2e8f0;
        margin: 6px 0;
      }

      .dropdown-logout-item {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: none;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        color: #b91c1c;
        font-size: 0.8125rem;
        font-weight: 600;

        &:hover {
          background: #fee2e2;
        }

        .material-icons {
          font-size: 18px;
        }
      }
    }

    /* SIH Tour Modal */
    .tour-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(2px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .tour-modal {
      width: 100%;
      max-width: 820px;
      max-height: 88vh;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #cbd5e1;
    }

    .tour-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;

      .tour-title-wrap {
        display: flex;
        align-items: center;
        gap: 12px;

        .tour-title-icon {
          font-size: 28px;
          color: #2563eb;
        }

        h2 {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        p {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 2px 0 0;
        }
      }

      .tour-close-btn {
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;

        &:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
      }
    }

    .tour-body {
      padding: 20px 24px;
      overflow-y: auto;
      flex: 1;
    }

    .tour-steps-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .tour-step-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      transition: all 0.15s ease;

      &:hover {
        background: #ffffff;
        border-color: #3b82f6;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
      }

      .step-num-badge {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #1e3a8a;
        color: #ffffff;
        font-weight: 800;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .step-info {
        flex: 1;
        min-width: 0;

        h4 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 2px;
        }

        p {
          font-size: 0.8125rem;
          color: #475569;
          margin: 0;
        }
      }
    }

    .tour-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;

      .tour-footer-note {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        color: #64748b;

        .info-sm {
          font-size: 16px;
          color: #2563eb;
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Global Search Modal (Strictly Official White Theme) */
    .search-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 10vh;
      z-index: 1060;
    }

    .search-dialog {
      width: 100%;
      max-width: 680px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .search-input-wrap {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
      gap: 12px;
      background: #ffffff;

      .search-input-icon {
        font-size: 24px;
        color: #1e3a8a;
      }

      .search-main-input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 15px;
        color: #0f172a;
        background: transparent;
        font-family: inherit;

        &::placeholder {
          color: #94a3b8;
          font-size: 14px;
        }
      }

      .search-clear-btn {
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        border-radius: 4px;

        &:hover {
          color: #0f172a;
          background: #f1f5f9;
        }

        .material-icons {
          font-size: 18px;
        }
      }

      .search-esc-kbd {
        font-size: 10px;
        font-family: var(--font-mono);
        font-weight: 700;
        padding: 3px 6px;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        color: #64748b;
        cursor: pointer;
      }
    }

    .search-results-container {
      max-height: 420px;
      overflow-y: auto;
      padding: 16px 20px;
      background: #ffffff;
    }

    .search-suggestions {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .suggestion-header {
        font-size: 11px;
        font-family: var(--font-mono);
        font-weight: 800;
        color: #64748b;
        letter-spacing: 0.05em;
      }

      .suggestion-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .suggestion-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        cursor: pointer;
        transition: all var(--transition-fast);

        &:hover {
          background: #eff6ff;
          border-color: #93c5fd;
        }

        .material-icons {
          font-size: 20px;
          color: #1e3a8a;
        }

        strong {
          font-size: 13px;
          color: #0f172a;
          display: block;
        }

        small {
          font-size: 11px;
          color: #64748b;
          display: block;
        }
      }
    }

    .search-group {
      margin-bottom: 16px;

      .group-title {
        font-size: 10px;
        font-family: var(--font-mono);
        font-weight: 800;
        color: #64748b;
        letter-spacing: 0.05em;
        display: block;
        margin-bottom: 8px;
      }
    }

    .result-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #f1f5f9;
      cursor: pointer;
      margin-bottom: 6px;
      transition: all var(--transition-fast);

      &:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      .result-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .result-icon {
        font-size: 20px;
        color: #1e3a8a;
      }

      .result-main-text {
        font-size: 13px;
        color: #0f172a;
      }

      .result-sub-text {
        font-size: 11px;
        color: #64748b;
      }
    }

    .search-empty {
      padding: 32px 16px;
      text-align: center;
      color: #64748b;

      .material-icons {
        font-size: 36px;
        color: #94a3b8;
        margin-bottom: 8px;
      }

      p {
        font-size: 13px;
        margin: 0 0 16px 0;
      }
    }

    .search-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;

      kbd {
        font-family: var(--font-mono);
        font-size: 9px;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        padding: 1px 4px;
        border-radius: 3px;
        color: #475569;
      }
    }
  `]
})
export class NavbarComponent implements OnInit {
  userDropdownOpen = false;
  tourModalOpen = false;
  currentStep = 1;

  searchModalOpen = false;
  searchQuery = '';
  allCases: CaseResponse[] = [];
  allDocs: DocumentResponse[] = [];
  matchingCases: CaseResponse[] = [];
  matchingDocuments: DocumentResponse[] = [];

  tourSteps = [
    {
      num: 1,
      title: '1. Select Case Docket',
      description: 'Explore active cases such as CASE-2026-00421 (State vs. Vikram Malhotra & Ors.) with FIR, jurisdiction, and priority.',
      actionLabel: 'Open Cases',
      route: '/cases'
    },
    {
      num: 2,
      title: '2. Upload & Anchor Evidence',
      description: 'Upload legal documents and digital exhibits (PDF, DOCX, IMG) directly into the case repository.',
      actionLabel: 'Case Detail #1',
      route: '/cases/1'
    },
    {
      num: 3,
      title: '3. SHA-256 Digest Generation',
      description: 'FIPS 180-4 compliant 256-bit cryptographic fingerprinting calculated upon file stream ingestion.',
      actionLabel: 'View Documents',
      route: '/documents'
    },
    {
      num: 4,
      title: '4. Decentralized Storage (IPFS)',
      description: 'Content-addressable storage generates unique multihash IPFS CID without placing heavy files on-chain.',
      actionLabel: 'Inspect Evidence',
      route: '/evidence'
    },
    {
      num: 5,
      title: '5. Smart Contract Blockchain Anchor',
      description: 'Document hash and CID anchored immutably to EVM DocumentRegistry.sol ledger with block timestamp and gas proof.',
      actionLabel: 'View Dashboard',
      route: '/dashboard'
    },
    {
      num: 6,
      title: '6. Cryptographic Document Verification',
      description: 'Run bitwise hash verification comparing any uploaded file against its registered ledger anchor.',
      actionLabel: 'Verify Portal',
      route: '/verification'
    },
    {
      num: 7,
      title: '7. Interactive Case Timeline',
      description: 'Chronological events from FIR registration to charge-sheet filing, forensic arrival, and court submission.',
      actionLabel: 'Case Timeline',
      route: '/cases/1'
    },
    {
      num: 8,
      title: '8. Chain of Custody Tracking',
      description: 'Section 65B Indian Evidence Act / BNSS compliant chain of custody tracking every custodian handover and access.',
      actionLabel: 'Custody Trail',
      route: '/cases/1'
    },
    {
      num: 9,
      title: '9. Controlled Tamper Demonstration',
      description: 'Demonstrate how altering a single byte in a document changes the SHA-256 fingerprint completely.',
      actionLabel: 'Simulate Tamper',
      route: '/verification'
    },
    {
      num: 10,
      title: '10. Automated Tamper Detection Alert',
      description: 'Instant integrity discrepancy alert flagged to Judge and Prosecutor, permanently recorded in audit logs.',
      actionLabel: 'Inspect Alerts',
      route: '/dashboard'
    }
  ];

  constructor(
    public authService: AuthService,
    private router: Router,
    private caseService: CaseService,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.loadSearchData();
  }

  loadSearchData(): void {
    this.caseService.getAllCases().subscribe({
      next: (cases) => {
        this.allCases = cases || [];
      },
      error: () => {}
    });

    this.documentService.searchDocuments(0, 50).subscribe({
      next: (res) => {
        this.allDocs = res.data?.content || [];
      },
      error: () => {}
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.toggleSearchModal();
    } else if (event.key === 'Escape' && this.searchModalOpen) {
      this.closeSearchModal();
    }
  }

  toggleSearchModal(): void {
    this.searchModalOpen = !this.searchModalOpen;
    if (this.searchModalOpen) {
      this.userDropdownOpen = false;
      this.tourModalOpen = false;
      this.searchQuery = '';
      this.matchingCases = [];
      this.matchingDocuments = [];
      if (this.allCases.length === 0) {
        this.loadSearchData();
      }
    }
  }

  openSearchModal(): void {
    this.searchModalOpen = true;
    this.userDropdownOpen = false;
    this.tourModalOpen = false;
    this.searchQuery = '';
    this.matchingCases = [];
    this.matchingDocuments = [];
    if (this.allCases.length === 0) {
      this.loadSearchData();
    }
  }

  closeSearchModal(): void {
    this.searchModalOpen = false;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.matchingCases = [];
    this.matchingDocuments = [];
  }

  onSearchQueryChange(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.matchingCases = [];
      this.matchingDocuments = [];
      return;
    }

    this.matchingCases = this.allCases.filter(c => 
      c.caseNumber?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.firNumber?.toLowerCase().includes(q) ||
      c.courtName?.toLowerCase().includes(q) ||
      c.policeStation?.toLowerCase().includes(q)
    );

    this.matchingDocuments = this.allDocs.filter(d =>
      d.title?.toLowerCase().includes(q) ||
      d.fileName?.toLowerCase().includes(q) ||
      d.sha256Hash?.toLowerCase().includes(q) ||
      d.ipfsCid?.toLowerCase().includes(q) ||
      d.documentType?.toLowerCase().includes(q)
    );
  }

  selectCase(id: number): void {
    this.closeSearchModal();
    this.router.navigate(['/cases', id]);
  }

  selectDocument(doc: DocumentResponse): void {
    this.closeSearchModal();
    const caseId = doc.legalCaseId || doc.caseId;
    if (caseId) {
      this.router.navigate(['/cases', caseId]);
    } else {
      this.router.navigate(['/verification']);
    }
  }

  navigateTo(route: string): void {
    this.closeSearchModal();
    this.router.navigateByUrl(route);
  }

  toggleUserDropdown(): void {
    this.userDropdownOpen = !this.userDropdownOpen;
  }

  toggleTourModal(): void {
    this.tourModalOpen = !this.tourModalOpen;
    this.userDropdownOpen = false;
  }

  closeTourModal(): void {
    this.tourModalOpen = false;
  }

  executeTourStep(step: any): void {
    this.currentStep = step.num;
    this.closeTourModal();
    this.router.navigateByUrl(step.route);
  }

  switchRole(roleKey: string, roleName: string): void {
    this.userDropdownOpen = false;
    this.authService.demoLogin(roleKey).subscribe({
      next: (res) => {
        if (res.success) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {}
    });
  }

  logout(): void {
    this.userDropdownOpen = false;
    this.authService.logout();
  }

  getUserInitials(): string {
    const name = this.authService.userFullName();
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  formatRole(role: string | null): string {
    if (!role) return 'OFFICIAL';
    return role.replace(/_/g, ' ');
  }
}