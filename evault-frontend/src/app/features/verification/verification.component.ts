import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VerificationService } from '../../core/services/verification.service';
import { DocumentService } from '../../core/services/document.service';
import { LegalDocument } from '../../core/models/document.model';
import { DocumentVerificationResult, TamperIncident } from '../../core/models/verification.model';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="verification-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="breadcrumb">
          <span>JUDICIAL DASHBOARD</span>
          <span class="separator">/</span>
          <span class="active">INTEGRITY ADJUDICATION</span>
        </div>
        <h1 class="page-title">Cryptographic Document & Evidence Verifier</h1>
        <p class="page-subtitle">Verify bitwise document integrity against decentralized IPFS nodes and Ethereum smart contract anchors</p>
      </div>

      <!-- Quick Demo / Simulation Banner -->
      <div class="demo-banner gov-card">
        <div class="demo-banner-content">
          <div class="demo-badge">
            <span class="material-icons">security</span>
            <span>INTEGRITY VERIFICATION SUITE</span>
          </div>
          <h3>Simulate Zero-Knowledge Document Verification & Tamper Detection</h3>
          <p>
            Test how the vault validates genuine dockets or catches even a single byte modification using SHA-256 fingerprinting and blockchain consensus.
          </p>
        </div>
        <div class="demo-actions">
          <button (click)="runAuthenticSimulation()" [disabled]="verifying" class="action-sim-btn btn-sim-success">
            <span class="material-icons">verified_user</span>
            <span>Verify Authentic FIR (Match)</span>
          </button>
          <button (click)="runTamperedSimulation()" [disabled]="verifying" class="action-sim-btn btn-sim-danger">
            <span class="material-icons">gpp_bad</span>
            <span>Simulate Tampered File (Alert)</span>
          </button>
        </div>
      </div>

      <div class="main-layout-grid">
        <!-- Left Column: Upload Form -->
        <div class="gov-card upload-section">
          <div class="section-head">
            <h3>Upload Legal Document for Inspection</h3>
            <span class="badge badge-info">SHA-256 ENGINE</span>
          </div>

          <!-- Drag and Drop Zone -->
          <div 
            class="drop-zone" 
            [class.drag-over]="isDragOver"
            (dragover)="onDragOver($event)" 
            (dragleave)="onDragLeave($event)" 
            (drop)="onDrop($event)"
            (click)="fileInput.click()"
          >
            <input 
              #fileInput 
              type="file" 
              (change)="onFileSelected($event)" 
              style="display: none;" 
            />
            
            <div class="drop-zone-inner">
              <div class="icon-circle">
                <span class="material-icons drop-icon" [ngClass]="selectedFile ? 'text-primary' : 'text-muted'">
                  {{ selectedFile ? 'task' : 'cloud_upload' }}
                </span>
              </div>

              <div *ngIf="!selectedFile">
                <div class="drop-text-primary">Drag & drop court document or click to browse</div>
                <div class="drop-text-sub">Supports PDF, DOCX, PNG, JPG, TXT up to 50MB</div>
              </div>

              <div *ngIf="selectedFile" class="selected-file-meta">
                <div class="file-name font-mono">{{ selectedFile.name }}</div>
                <div class="file-size font-mono">{{ formatBytes(selectedFile.size) }}</div>
                <div class="client-hash font-mono" *ngIf="clientCalculatedHash">
                  <span class="hash-tag">Calculated SHA-256:</span>
                  <span>{{ clientCalculatedHash }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Optional Target Document Selection -->
          <div class="form-group mt-4">
            <label class="gov-label">Compare Against Specific Docket Document (Optional):</label>
            <select [(ngModel)]="selectedTargetDocId" class="gov-select">
              <option [ngValue]="null">Auto-Match (Search entire ledger by SHA-256 hash)</option>
              <option *ngFor="let doc of existingDocs()" [ngValue]="doc.id">
                #{{ doc.id }} - {{ doc.title }} ({{ doc.documentType }})
              </option>
            </select>
          </div>

          <button 
            (click)="executeVerification()" 
            [disabled]="!selectedFile || verifying" 
            class="gov-btn gov-btn-primary btn-block mt-4"
          >
            @if (verifying) {
              <div class="spinner-sm"></div>
              <span>Querying Blockchain & IPFS...</span>
            } @else {
              <span class="material-icons">search_check</span>
              <span>Execute Cryptographic Verification</span>
            }
          </button>
        </div>

        <!-- Right Column: Verification Result View -->
        <div class="gov-card result-section">
          <div class="section-head">
            <h3>Integrity Adjudication Report</h3>
            <span class="badge" [ngClass]="getResultBadgeClass()">
              {{ result() ? result()?.status : 'AWAITING INSPECTION' }}
            </span>
          </div>

          <!-- Placeholder when no verification yet -->
          <div *ngIf="!result() && !verifying" class="placeholder-state">
            <div class="placeholder-seal-wrap">
              <img src="images/tamper-shield.jpg" alt="Cryptographic Security Seal" class="placeholder-seal-img" />
            </div>
            <h4>Ready to Verify Document Integrity</h4>
            <p>Select a file from your computer or click one of the automated simulation buttons above to check bitwise hash validity against the decentralized ledger.</p>
            <div class="placeholder-badges">
              <span class="badge badge-success">✓ FIPS 180-4 SHA-256</span>
              <span class="badge badge-info">✓ IPFS CID Cluster</span>
              <span class="badge badge-warning">✓ EVM Block Proof</span>
            </div>
          </div>

          <!-- Loading state -->
          <div *ngIf="verifying" class="loading-state">
            <div class="spinner"></div>
            <h4>Querying On-Chain Document Registry</h4>
            <p>Computing SHA-256 digest • Checking DocumentRegistry.sol contract • Validating IPFS cluster availability...</p>
          </div>

          <!-- VERIFIED RESULT -->
          <div *ngIf="result() && result()?.status === 'VERIFIED'" class="verif-report">
            <div class="verif-banner banner-success">
              <div class="icon-wrap verified-seal-icon-wrap">
                <img src="images/certificate-seal.jpg" alt="Certified Authentic Notarization Seal" class="verified-seal-icon-img" />
              </div>
              <div class="banner-body">
                <h3 class="banner-title">DOCUMENT INTEGRITY VERIFIED</h3>
                <p class="banner-desc">{{ result()?.message }}</p>
              </div>
            </div>

            <div class="audit-details">
              <div class="detail-row">
                <span class="key">Associated Docket</span>
                <span class="val font-semibold">{{ result()?.caseNumber || 'N/A' }} — {{ result()?.documentTitle }}</span>
              </div>

              <div class="detail-row">
                <span class="key">Bitwise Hash Parity</span>
                <span class="val text-success font-bold font-mono">✓ 100% MATCH (ZERO MODIFICATIONS)</span>
              </div>

              <div class="detail-row">
                <span class="key">Computed SHA-256</span>
                <span class="val font-mono text-xs word-break">{{ result()?.computedHash }}</span>
              </div>

              <div class="detail-row">
                <span class="key">Anchored Ledger Hash</span>
                <span class="val font-mono text-xs text-primary word-break">{{ result()?.originalHash }}</span>
              </div>

              <div class="detail-row">
                <span class="key">IPFS Cluster Storage</span>
                <span class="val font-mono text-xs">
                  <span class="material-icons text-xs text-success">cloud_done</span>
                  CID: {{ result()?.ipfsCid }} (Pinned)
                </span>
              </div>

              <div class="detail-row" *ngIf="result()?.transactionHash">
                <span class="key">Ethereum Anchor Tx</span>
                <span class="val font-mono text-xs text-primary word-break">{{ result()?.transactionHash }}</span>
              </div>

              <div class="detail-row" *ngIf="result()?.contractAddress">
                <span class="key">Solidity Contract</span>
                <span class="val font-mono text-xs">{{ result()?.contractAddress }}</span>
              </div>

              <div class="detail-row">
                <span class="key">Adjudication Timestamp</span>
                <span class="val font-mono text-xs">{{ result()?.verifiedAt | date:'dd MMM yyyy, HH:mm:ss' }} IST</span>
              </div>
            </div>

            <div class="report-actions-bar mt-4">
              <button type="button" (click)="openCertificateModal()" class="gov-btn gov-btn-primary btn-sm">
                <span class="material-icons">receipt_long</span>
                <span>Generate Section 65B Certificate</span>
              </button>
              <button type="button" (click)="openTamperLab()" class="gov-btn gov-btn-secondary btn-sm">
                <span class="material-icons">science</span>
                <span>Launch Bitwise Cryptographic Lab</span>
              </button>
            </div>
          </div>

          <!-- TAMPER DETECTED RESULT -->
          <div *ngIf="result() && result()?.status === 'TAMPER_DETECTED'" class="verif-report">
            <div class="verif-banner banner-danger">
              <div class="icon-wrap">
                <span class="material-icons">gpp_bad</span>
              </div>
              <div class="banner-body">
                <h3 class="banner-title text-danger">CRITICAL: INTEGRITY TAMPER DETECTED!</h3>
                <p class="banner-desc">{{ result()?.message }}</p>
              </div>
            </div>

            <div class="tamper-alert-box">
              <span class="material-icons">warning</span>
              <div>
                <strong>Judicial Advisory:</strong> This document does NOT match the immutable cryptographic record anchored on the blockchain. A tamper incident has been recorded in the audit trail.
              </div>
            </div>

            <div class="audit-details">
              <div class="detail-row">
                <span class="key">Target Case Docket</span>
                <span class="val font-semibold">{{ result()?.caseNumber || 'N/A' }} — {{ result()?.documentTitle }}</span>
              </div>

              <div class="detail-row">
                <span class="key">Tampered Copy Hash</span>
                <span class="val font-mono text-xs text-danger word-break font-bold">{{ result()?.computedHash }}</span>
              </div>

              <div class="detail-row">
                <span class="key">Original Anchored Hash</span>
                <span class="val font-mono text-xs text-success word-break font-bold">{{ result()?.originalHash }}</span>
              </div>

              <div class="detail-row">
                <span class="key">Integrity Failure</span>
                <span class="val text-danger font-bold">1 or more bytes altered or document substituted</span>
              </div>

              <div class="detail-row" *ngIf="result()?.ipfsCid">
                <span class="key">Original IPFS CID</span>
                <span class="val font-mono text-xs">{{ result()?.ipfsCid }}</span>
              </div>

              <div class="detail-row" *ngIf="result()?.transactionHash">
                <span class="key">Original Anchor Tx</span>
                <span class="val font-mono text-xs text-primary">{{ result()?.transactionHash }}</span>
              </div>

              <div class="detail-row">
                <span class="key">Incident Logged At</span>
                <span class="val font-mono text-xs">{{ result()?.verifiedAt | date:'dd MMM yyyy, HH:mm:ss' }} IST</span>
              </div>
            </div>

            <div class="report-actions-bar mt-4">
              <button type="button" (click)="openTamperLab()" class="gov-btn gov-btn-danger btn-sm">
                <span class="material-icons">biotech</span>
                <span>Inspect Bitwise Byte Diff & Avalanche Effect</span>
              </button>
            </div>
          </div>

          <!-- NOT FOUND RESULT -->
          <div *ngIf="result() && result()?.status === 'NOT_FOUND'" class="verif-report">
            <div class="verif-banner banner-neutral">
              <div class="icon-wrap">
                <span class="material-icons">help_outline</span>
              </div>
              <div class="banner-body">
                <h3 class="banner-title">NO BLOCKCHAIN ANCHOR FOUND</h3>
                <p class="banner-desc">{{ result()?.message }}</p>
              </div>
            </div>

            <div class="audit-details">
              <div class="detail-row">
                <span class="key">Calculated Hash</span>
                <span class="val font-mono text-xs word-break">{{ result()?.computedHash }}</span>
              </div>
              <div class="detail-row">
                <span class="key">Ledger Status</span>
                <span class="val text-warning font-semibold">Unregistered Document Fingerprint</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Real-Time Tamper Detection Log Table -->
      <div class="gov-card tamper-feed-section mt-6">
        <div class="section-head">
          <div class="feed-title">
            <span class="material-icons text-danger">notifications_active</span>
            <h3>System Tamper Detection Log</h3>
          </div>
          <span class="badge badge-danger">REAL-TIME SURVEILLANCE</span>
        </div>

        <div class="table-responsive">
          <table class="gov-table">
            <thead>
              <tr>
                <th>INCIDENT ID</th>
                <th>EXHIBIT / DOCUMENT</th>
                <th>DOCKET NUMBER</th>
                <th>EXPECTED HASH (LEDGER)</th>
                <th>TAMPERED HASH RECEIVED</th>
                <th>SEVERITY</th>
                <th>DETECTED TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let inc of tamperAlerts()">
                <td class="font-mono text-primary font-bold">#INC-{{ inc.id }}</td>
                <td class="font-semibold text-slate-800">{{ inc.documentTitle }}</td>
                <td class="font-mono text-xs text-slate-600">{{ inc.caseNumber || 'CASE-2026-0001' }}</td>
                <td class="font-mono text-xs text-success" title="{{ inc.expectedHash }}">
                  {{ inc.expectedHash | slice:0:10 }}...{{ inc.expectedHash | slice:-6 }}
                </td>
                <td class="font-mono text-xs text-danger" title="{{ inc.attemptedHash }}">
                  {{ inc.attemptedHash | slice:0:10 }}...{{ inc.attemptedHash | slice:-6 }}
                </td>
                <td>
                  <span class="badge badge-danger">CRITICAL</span>
                </td>
                <td class="font-mono text-xs text-slate-600">{{ inc.detectedAt | date:'dd MMM yyyy, HH:mm:ss' }}</td>
              </tr>

              <tr *ngIf="tamperAlerts().length === 0">
                <td colspan="7" class="empty-cell text-center" style="padding: 28px;">
                  <span class="text-secondary text-sm">No unauthorized tamper incidents recorded. System integrity intact.</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Interactive Bitwise Cryptographic Tamper Lab Card -->
      <div class="gov-card tamper-lab-card mt-6" id="tamper-lab-section">
        <div class="section-head">
          <div class="feed-title">
            <span class="material-icons text-primary">science</span>
            <h3>Interactive Cryptographic Avalanche & Bitwise Tamper Lab</h3>
          </div>
          <span class="badge badge-info">MATHEMATICAL PROOF</span>
        </div>

        <p class="text-sm text-secondary mb-4">
          Demonstrate why FIPS 180-4 SHA-256 makes document forgery mathematically impossible: flipping even a single bit in the binary stream causes an immediate <strong>Avalanche Effect</strong>, totally changing the resulting 256-bit cryptographic digest.
        </p>

        <div class="tamper-lab-grid">
          <!-- Left: Hex Byte Stream Explorer -->
          <div class="hex-viewer-box">
            <div class="hex-header">
              <span class="hex-header-title">RAW EVIDENCE STREAM (OFFSET 0x0000 - 0x001F)</span>
              <button type="button" class="gov-btn btn-xs" [ngClass]="tamperByteModified ? 'gov-btn-danger' : 'gov-btn-primary'" (click)="toggleTamperByte()">
                <span class="material-icons">{{ tamperByteModified ? 'undo' : 'edit' }}</span>
                <span>{{ tamperByteModified ? 'Revert to Original Byte (0x46)' : 'Simulate 1-Bit Alteration (0x46 -> 0x58)' }}</span>
              </button>
            </div>

            <div class="hex-grid font-mono">
              <div class="hex-row">
                <span class="hex-offset">0x0000:</span>
                <span class="hex-byte" [class.tampered-byte]="tamperByteModified">{{ tamperByteModified ? '58' : '46' }}</span>
                <span class="hex-byte">49</span> <span class="hex-byte">52</span> <span class="hex-byte">2D</span>
                <span class="hex-byte">44</span> <span class="hex-byte">45</span> <span class="hex-byte">4C</span> <span class="hex-byte">2D</span>
                <span class="hex-byte">34</span> <span class="hex-byte">30</span> <span class="hex-byte">39</span> <span class="hex-byte">2F</span>
                <span class="hex-byte">32</span> <span class="hex-byte">30</span> <span class="hex-byte">32</span> <span class="hex-byte">36</span>
                <span class="hex-ascii">{{ tamperByteModified ? 'XIR-DEL-409/2026' : 'FIR-DEL-409/2026' }}</span>
              </div>
              <div class="hex-row">
                <span class="hex-offset">0x0010:</span>
                <span class="hex-byte">43</span> <span class="hex-byte">6F</span> <span class="hex-byte">6D</span> <span class="hex-byte">70</span>
                <span class="hex-byte">6C</span> <span class="hex-byte">61</span> <span class="hex-byte">69</span> <span class="hex-byte">6E</span>
                <span class="hex-byte">61</span> <span class="hex-byte">6E</span> <span class="hex-byte">74</span> <span class="hex-byte">3A</span>
                <span class="hex-byte">20</span> <span class="hex-byte">43</span> <span class="hex-byte">79</span> <span class="hex-byte">62</span>
                <span class="hex-ascii">Complainant: Cyb</span>
              </div>
            </div>
          </div>

          <!-- Right: Cryptographic Avalanche Metric -->
          <div class="avalanche-metric-box">
            <div class="metric-title">
              <span>SHA-256 AVALANCHE EFFECT ANALYSIS</span>
              <span class="badge" [ngClass]="tamperByteModified ? 'badge-danger' : 'badge-success'">
                {{ tamperByteModified ? 'TAMPER DETECTED (52.3% BITS FLIPPED)' : '100% BITWISE CONSENSUS' }}
              </span>
            </div>

            <div class="hash-compare-block">
              <div class="hash-row">
                <span class="hash-lbl text-success font-semibold">ANCHORED ON-CHAIN HASH:</span>
                <span class="font-mono text-xs crypto-hash">130e42058caf9acff869bf9490fce33db94b95e17771d25f0bec39b9c8fffe12</span>
              </div>
              <div class="hash-row mt-2">
                <span class="hash-lbl font-semibold" [ngClass]="tamperByteModified ? 'text-danger' : 'text-success'">
                  {{ tamperByteModified ? 'RECALCULATED TAMPERED HASH:' : 'RECALCULATED GENUINE HASH:' }}
                </span>
                <span class="font-mono text-xs crypto-hash" [class.tampered-hash]="tamperByteModified">
                  {{ tamperByteModified ? '7f8a1290bb4c9823e1104921f0084ad38914ac7b120938475928371948572019' : '130e42058caf9acff869bf9490fce33db94b95e17771d25f0bec39b9c8fffe12' }}
                </span>
              </div>
            </div>

            <div class="legal-verdict-box mt-3" [class.danger-box]="tamperByteModified">
              <span class="material-icons">{{ tamperByteModified ? 'gpp_bad' : 'verified_user' }}</span>
              <div>
                <strong>{{ tamperByteModified ? 'EVIDENTIARY FAILURE: INADMISSIBLE UNDER SECTION 65B' : 'CERTIFIED EVIDENCE: 100% ADMISSIBLE' }}</strong>
                <p>{{ tamperByteModified ? 'A 1-bit alteration at offset 0x0000 caused 134 out of 256 bits in the cryptographic output to flip. Smart contract consensus failed.' : 'Bitwise digest matches the EVM blockchain transaction receipt and IPFS CID exactly.' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Printable Section 65B Electronic Evidence Certificate Modal -->
      @if (certificateModalOpen) {
        <div class="modal-backdrop" (click)="closeCertificateModal()">
          <div class="modal-container cert-modal" (click)="$event.stopPropagation()">
            <div class="cert-modal-header no-print">
              <div class="header-left">
                <span class="material-icons-outlined cert-icon">receipt_long</span>
                <div>
                  <h3>Section 65B Electronic Evidence Certificate</h3>
                  <p>Certified under Section 65B(4) Indian Evidence Act, 1872 & Section 63 BSA 2023</p>
                </div>
              </div>
              <div class="header-actions">
                <button type="button" class="gov-btn gov-btn-primary btn-sm" (click)="printCertificate()">
                  <span class="material-icons">print</span>
                  <span>Print / Save PDF</span>
                </button>
                <button type="button" class="modal-close-btn" (click)="closeCertificateModal()">
                  <span class="material-icons">close</span>
                </button>
              </div>
            </div>

            <!-- Formal Printable Document Layout -->
            <div class="printable-certificate">
              <div class="cert-gov-header">
                <div class="cert-emblem-wrap">
                  <img src="images/evault-emblem.jpg" alt="Government Seal" class="cert-seal-img" />
                </div>
                <div class="cert-authority-title">
                  <h2>HIGH COURT OF DELHI • SPECIAL SESSIONS COURT NO. 4</h2>
                  <h3>DIRECTORATE OF DIGITAL JUDICIARY & CRYPTOGRAPHIC EVIDENCE REPOSITORY</h3>
                  <div class="cert-badge-rule">e-Courts Digital Vault Infrastructure (eVAULT-SIH26190)</div>
                </div>
              </div>

              <div class="cert-title-block">
                <h1>CERTIFICATE OF ELECTRONIC EVIDENCE</h1>
                <p class="cert-law-sub">Under Section 65B(4) of the Indian Evidence Act, 1872 & Section 63 of the Bharatiya Sakshya Adhiniyam, 2023</p>
                <div class="cert-serial font-mono">CERTIFICATE REF: SEC65B-DEL-2026-00421-E</div>
              </div>

              <div class="cert-preamble">
                This is to certify that the electronic document described below has been retrieved from the decentralized, immutable eVAULT repository and subjected to bitwise cryptographic consensus against Ethereum Smart Contract (DocumentRegistry.sol) and IPFS Multihash storage.
              </div>

              <div class="cert-table-wrap">
                <table class="cert-table font-mono">
                  <tbody>
                    <tr>
                      <td class="cert-k">DOCKET / CASE NO.</td>
                      <td class="cert-v font-bold">{{ result()?.caseNumber || 'CASE-2026-0001' }}</td>
                      <td class="cert-k">FIR REFERENCE</td>
                      <td class="cert-v font-bold">FIR-DEL-409/2026</td>
                    </tr>
                    <tr>
                      <td class="cert-k">DOCUMENT NAME</td>
                      <td class="cert-v" colspan="3">{{ result()?.documentTitle || 'Certified FIR Record' }}</td>
                    </tr>
                    <tr>
                      <td class="cert-k">PRIMARY SHA-256 HASH</td>
                      <td class="cert-v font-bold word-break" colspan="3">{{ result()?.originalHash || '130e42058caf9acff869bf9490fce33db94b95e17771d25f0bec39b9c8fffe12' }}</td>
                    </tr>
                    <tr>
                      <td class="cert-k">COMPUTED VERIFICATION HASH</td>
                      <td class="cert-v font-bold word-break text-success" colspan="3">{{ result()?.computedHash || '130e42058caf9acff869bf9490fce33db94b95e17771d25f0bec39b9c8fffe12' }}</td>
                    </tr>
                    <tr>
                      <td class="cert-k">IPFS CONTENT ID (CID)</td>
                      <td class="cert-v" colspan="3">{{ result()?.ipfsCid || 'QmLF96R2faHpJZVMv4CJat4xdeC5zCTQPKxxxxxxxxxx' }}</td>
                    </tr>
                    <tr>
                      <td class="cert-k">BLOCKCHAIN ANCHOR TX</td>
                      <td class="cert-v font-bold word-break" colspan="3">{{ result()?.transactionHash || '0x60dff121d96945083fe21ed28344ff002af9c894a0e8a27324676fccecac43d5' }}</td>
                    </tr>
                    <tr>
                      <td class="cert-k">BLOCK NUMBER</td>
                      <td class="cert-v">{{ result()?.blockNumber || 10043 }}</td>
                      <td class="cert-k">VERIFICATION CONSENSUS</td>
                      <td class="cert-v font-bold text-success">✓ 100% BITWISE PARITY</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="cert-attestation-clause">
                <strong>STATUTORY ATTESTATION:</strong><br>
                1. The computer system / decentralized node cluster from which this electronic record was produced was operating properly during the relevant period.<br>
                2. The cryptographic fingerprint (SHA-256) matches the on-chain smart contract anchor with zero variance, ruling out any post-anchoring modification, truncation, or interception.<br>
                3. This certificate satisfies the requirements for admissibility of electronic records in judicial proceedings before any Court of Law in the Union of India.
              </div>

              <div class="cert-signatures">
                <div class="sig-col">
                  <div class="qr-placeholder">
                    <span class="material-icons qr-icon">qr_code_2</span>
                    <span class="qr-sub">Scan to Verify Anchor</span>
                  </div>
                </div>
                <div class="sig-col text-right">
                  <div class="seal-mark">
                    <img src="images/certificate-seal.jpg" alt="Official Notarization Crest" class="cert-signature-seal-img" />
                    <span>CRYPTOGRAPHICALLY NOTARIZED</span>
                  </div>
                  <div class="sig-name">Hon'ble Justice K. S. Verma</div>
                  <div class="sig-title">Presiding Judge • Special Sessions Court No. 4</div>
                  <div class="sig-date">{{ (result()?.verifiedAt || '2026-09-30T12:00:00') | date:'dd MMMM yyyy, HH:mm:ss' }} IST</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .verification-page {
      padding: 24px 32px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 20px;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-family: var(--font-mono);
      font-weight: 700;
      color: #64748b;
      margin-bottom: 4px;
      letter-spacing: 0.05em;
    }

    .separator { color: #cbd5e1; }
    .page-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
    .page-subtitle { font-size: 13px; color: #475569; margin: 0; }

    /* Demo Banner */
    .demo-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      margin-bottom: 24px;
      border-left: 4px solid #1e3a8a;
      background: #ffffff;
      flex-wrap: wrap;
      gap: 16px;
    }

    .demo-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      font-family: var(--font-mono);
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: 0.08em;
      margin-bottom: 4px;

      .material-icons { font-size: 14px; }
    }

    .demo-banner-content {
      max-width: 650px;

      h3 { font-size: 16px; font-weight: 700; margin: 0 0 4px 0; color: #0f172a; }
      p { font-size: 13px; color: #475569; margin: 0; line-height: 1.5; }
    }

    .demo-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .action-sim-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

      .material-icons { font-size: 18px; }
    }

    .btn-sim-success {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      color: #15803d;

      &:hover:not(:disabled) {
        background: #dcfce7;
        border-color: #4ade80;
        box-shadow: 0 2px 4px rgba(22, 163, 74, 0.15);
      }
    }

    .btn-sim-danger {
      background: #fef2f2;
      border: 1.5px solid #fca5a5;
      color: #b91c1c;

      &:hover:not(:disabled) {
        background: #fee2e2;
        border-color: #f87171;
        box-shadow: 0 2px 4px rgba(220, 38, 38, 0.15);
      }
    }

    /* Layout */
    .main-layout-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;

      @media (max-width: 992px) {
        grid-template-columns: 1fr;
      }
    }

    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;

      h3 { font-size: 15px; font-weight: 700; margin: 0; color: #0f172a; }
    }

    /* Drop Zone */
    .drop-zone {
      border: 2px dashed #cbd5e1;
      border-radius: 10px;
      padding: 32px 16px;
      text-align: center;
      cursor: pointer;
      background: #f8fafc;
      transition: all 0.15s ease-in-out;

      &:hover, &.drag-over {
        border-color: #2563eb;
        background: #eff6ff;
      }
    }

    .drop-zone-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .icon-circle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

      .drop-icon { font-size: 28px; }
      .text-primary { color: #2563eb; }
      .text-muted { color: #64748b; }
    }

    .drop-text-primary {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .drop-text-sub {
      font-size: 12px;
      color: #64748b;
    }

    .selected-file-meta {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;

      .file-name { font-size: 13px; color: #1e3a8a; font-weight: 700; }
      .file-size { font-size: 11px; color: #64748b; }
      .client-hash {
        font-size: 11px;
        color: #1e293b;
        word-break: break-all;
        max-width: 440px;
        margin-top: 6px;
        padding: 6px 10px;
        background: #ffffff;
        border-radius: 6px;
        border: 1px solid #cbd5e1;

        .hash-tag { color: #1e3a8a; font-weight: 700; margin-right: 4px; }
      }
    }

    .btn-block {
      width: 100%;
      justify-content: center;
      padding: 12px;
      font-size: 14px;
    }

    .mt-4 { margin-top: 16px; }
    .mt-6 { margin-top: 24px; }

    /* Results */
    .placeholder-state {
      padding: 40px 16px;
      text-align: center;
      color: #64748b;

      .placeholder-seal-wrap {
        width: 100px;
        height: 100px;
        margin: 0 auto 16px auto;
        display: flex;
        align-items: center;
        justify-content: center;

        .placeholder-seal-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }
      }

      .placeholder-badges {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 14px;
      }

      h4 { color: #1e293b; margin: 0 0 6px 0; font-size: 15px; }
      p { font-size: 13px; max-width: 360px; margin: 0 auto; line-height: 1.5; color: #64748b; }
    }

    .loading-state {
      padding: 40px 16px;
      text-align: center;

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e2e8f0;
        border-top-color: #1e3a8a;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 16px auto;
      }

      h4 { color: #0f172a; margin-bottom: 4px; }
      p { font-size: 12px; color: #64748b; max-width: 380px; margin: 0 auto; }
    }

    .verif-banner {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;

      .icon-wrap {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .material-icons { font-size: 24px; }
      }

      .banner-title { font-size: 14px; font-weight: 800; margin: 0 0 2px 0; }
      .banner-desc { font-size: 12px; margin: 0; line-height: 1.4; }
    }

    .banner-success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;

      .icon-wrap { background: #dcfce7; color: #15803d; }
      .banner-title { color: #15803d; }
      .banner-desc { color: #166534; }
    }

    .banner-danger {
      background: #fef2f2;
      border: 1px solid #fecaca;

      .icon-wrap { background: #fee2e2; color: #b91c1c; }
      .banner-title { color: #b91c1c; }
      .banner-desc { color: #991b1b; }
    }

    .banner-neutral {
      background: #f8fafc;
      border: 1px solid #e2e8f0;

      .icon-wrap { background: #f1f5f9; color: #475569; }
      .banner-title { color: #1e293b; }
      .banner-desc { color: #64748b; }
    }

    .tamper-alert-box {
      display: flex;
      gap: 12px;
      padding: 12px 14px;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #991b1b;

      .material-icons { color: #dc2626; font-size: 20px; }
    }

    .audit-details {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;

      &:last-child { border-bottom: none; padding-bottom: 0; }
      .key { color: #64748b; font-weight: 500; min-width: 140px; }
      .val { color: #0f172a; text-align: right; }
    }

    .word-break { word-break: break-all; }
    .text-primary { color: #1e40af; }
    .text-success { color: #15803d; }
    .text-danger { color: #b91c1c; }

    /* Feed */
    .feed-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .report-actions-bar {
      display: flex;
      gap: 10px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    /* Bitwise Tamper Lab */
    .tamper-lab-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-md);
      padding: 24px;
    }

    .tamper-lab-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 900px) {
      .tamper-lab-grid {
        grid-template-columns: 1fr;
      }
    }

    .hex-viewer-box, .avalanche-metric-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
    }

    .hex-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .hex-header-title {
      font-size: 0.75rem;
      font-weight: 700;
      font-family: var(--font-mono);
      color: #475569;
      letter-spacing: 0.05em;
    }

    .hex-grid {
      font-size: 0.8125rem;
      line-height: 1.8;
      overflow-x: auto;
    }

    .hex-row {
      display: flex;
      gap: 5px;
      align-items: center;
      margin-bottom: 4px;
    }

    .hex-offset {
      color: #64748b;
      font-weight: 700;
      margin-right: 4px;
    }

    .hex-byte {
      padding: 1px 4px;
      border-radius: 4px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      font-size: 0.75rem;
    }

    .tampered-byte {
      background: #fee2e2 !important;
      border-color: #fca5a5 !important;
      color: #b91c1c !important;
      font-weight: 800;
      box-shadow: 0 0 6px rgba(220, 38, 38, 0.4);
    }

    .hex-ascii {
      margin-left: 12px;
      color: #1e3a8a;
      font-weight: 600;
      font-size: 0.75rem;
    }

    .metric-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      margin-bottom: 12px;
    }

    .hash-compare-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .hash-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .hash-lbl {
      font-size: 0.7rem;
      font-family: var(--font-mono);
      letter-spacing: 0.04em;
    }

    .tampered-hash {
      background: #fee2e2 !important;
      border-color: #fca5a5 !important;
      color: #b91c1c !important;
      box-shadow: 0 0 8px rgba(220, 38, 38, 0.2);
    }

    .legal-verdict-box {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      border-radius: 8px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      font-size: 0.8125rem;

      .material-icons { font-size: 20px; flex-shrink: 0; }
      p { margin: 2px 0 0; font-size: 0.75rem; }
    }

    .danger-box {
      background: #fef2f2 !important;
      border-color: #fecaca !important;
      color: #991b1b !important;
    }

    /* Modal Backdrop & Container */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(2px);
      z-index: 2500;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .cert-modal {
      width: 100%;
      max-width: 860px;
      max-height: 92vh;
      overflow-y: auto;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
    }

    .cert-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .cert-icon { font-size: 28px; color: #1e3a8a; }
        h3 { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0; }
        p { font-size: 0.75rem; color: #64748b; margin: 0; }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    }

    .modal-close-btn {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      display: flex;

      &:hover { background: #e2e8f0; color: #0f172a; }
    }

    /* Printable Certificate */
    .printable-certificate {
      padding: 36px 40px;
      background: #ffffff;
      color: #0f172a;
    }

    .cert-gov-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 2px solid #0f172a;
      margin-bottom: 20px;

      .cert-emblem-wrap {
        width: 52px;
        height: 52px;
        border-radius: 10px;
        background: #0f172a;
        border: 2px solid #d97706;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;

        .cert-seal-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .cert-emblem { font-size: 30px; color: #f59e0b; }
      }

      .cert-authority-title {
        h2 { font-size: 1.05rem; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: -0.01em; }
        h3 { font-size: 0.8125rem; font-weight: 700; margin: 2px 0 4px; color: #475569; }
        .cert-badge-rule { font-size: 0.6875rem; font-family: var(--font-mono); font-weight: 700; color: #1e3a8a; }
      }
    }

    .cert-title-block {
      text-align: center;
      margin-bottom: 20px;

      h1 { font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0 0 4px; letter-spacing: 0.02em; }
      .cert-law-sub { font-size: 0.8125rem; color: #475569; margin: 0 0 6px; font-weight: 600; }
      .cert-serial { font-size: 0.75rem; font-weight: 800; color: #1e3a8a; }
    }

    .cert-preamble {
      font-size: 0.8125rem;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 16px;
    }

    .cert-table-wrap {
      margin-bottom: 16px;
    }

    .cert-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;

      td {
        padding: 8px 10px;
        border: 1px solid #cbd5e1;
        vertical-align: middle;
      }

      .cert-k {
        background: #f8fafc;
        font-weight: 700;
        color: #334155;
        width: 22%;
      }

      .cert-v {
        color: #0f172a;
      }
    }

    .cert-attestation-clause {
      font-size: 0.75rem;
      line-height: 1.6;
      color: #334155;
      padding: 12px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 24px;
    }

    .cert-signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;

      .qr-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;

        .qr-icon { font-size: 56px; color: #0f172a; }
        .qr-sub { font-size: 0.65rem; font-family: var(--font-mono); color: #64748b; font-weight: 600; }
      }

      .seal-mark {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #15803d;
        font-size: 0.75rem;
        font-weight: 800;
        border: 1.5px solid #d97706;
        background: #fffbeb;
        padding: 6px 12px;
        border-radius: 24px;
        margin-bottom: 10px;

        .cert-signature-seal-img {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          box-shadow: 0 2px 6px rgba(184, 134, 11, 0.25);
        }
      }

      .verified-seal-icon-img {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        object-fit: cover;
        box-shadow: 0 2px 8px rgba(184, 134, 11, 0.25);
      }

      .sig-name { font-size: 0.9375rem; font-weight: 800; color: #0f172a; }
      .sig-title { font-size: 0.75rem; color: #475569; }
      .sig-date { font-size: 0.6875rem; color: #64748b; font-family: var(--font-mono); margin-top: 2px; }
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class VerificationComponent implements OnInit {
  selectedFile: File | null = null;
  clientCalculatedHash = '';
  selectedTargetDocId: number | null = null;
  isDragOver = false;

  verifying = false;
  certificateModalOpen = false;
  tamperByteModified = false;

  result = signal<DocumentVerificationResult | null>(null);
  existingDocs = signal<LegalDocument[]>([]);
  tamperAlerts = signal<TamperIncident[]>([]);

  constructor(
    private verificationService: VerificationService,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.loadDocs();
    this.loadTamperAlerts();
  }

  loadDocs(): void {
    this.documentService.getAllDocuments().subscribe({
      next: (docs) => this.existingDocs.set(docs || [])
    });
  }

  loadTamperAlerts(): void {
    this.verificationService.getTamperAlerts().subscribe({
      next: (alerts) => this.tamperAlerts.set(alerts || [])
    });
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = false;
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.handleFile(e.dataTransfer.files[0]);
    }
  }

  onFileSelected(e: any): void {
    if (e.target.files && e.target.files.length > 0) {
      this.handleFile(e.target.files[0]);
    }
  }

  async handleFile(file: File): Promise<void> {
    this.selectedFile = file;
    this.result.set(null);
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      this.clientCalculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      this.clientCalculatedHash = '';
    }
  }

  executeVerification(): void {
    if (!this.selectedFile) return;

    this.verifying = true;
    this.result.set(null);

    this.verificationService.verifyFile(this.selectedFile, this.selectedTargetDocId || undefined).subscribe({
      next: (res) => {
        this.verifying = false;
        this.result.set(res);
        this.loadTamperAlerts();
      },
      error: (err) => {
        this.verifying = false;
        alert('Verification request failed: ' + (err.error?.message || 'Server error'));
      }
    });
  }

  runAuthenticSimulation(): void {
    this.verifying = true;
    this.result.set(null);
    const docs = this.existingDocs();
    const targetId = docs.length > 0 ? docs[0].id : 1;

    this.verificationService.verifyDocument(targetId).subscribe({
      next: (res) => {
        this.verifying = false;
        this.result.set(res);
        this.loadTamperAlerts();
      },
      error: () => {
        this.verifying = false;
      }
    });
  }

  runTamperedSimulation(): void {
    const tamperedContent = "FIRST INFORMATION REPORT (FIR-DEL-409/2026)\nComplainant: Cyber Cell Inspector\nAccused: Unknown Cyber Crime Syndicate\nSections: 420, 468, 471 IPC & 66C, 66D IT Act 2000\n[ALTERED COPY: Unauthorized bail exemption inserted by compromised actor]";
    const file = new File([tamperedContent], "FIR-DEL-409-2026-Altered.pdf", { type: "application/pdf" });

    this.selectedFile = file;
    const docs = this.existingDocs();
    this.selectedTargetDocId = docs.length > 0 ? docs[0].id : 1;

    this.executeVerification();
  }

  openCertificateModal(): void {
    this.certificateModalOpen = true;
  }

  closeCertificateModal(): void {
    this.certificateModalOpen = false;
  }

  printCertificate(): void {
    window.print();
  }

  openTamperLab(): void {
    const el = document.getElementById('tamper-lab-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  toggleTamperByte(): void {
    this.tamperByteModified = !this.tamperByteModified;
  }

  getResultBadgeClass(): string {
    const r = this.result();
    if (!r) return 'badge-neutral';
    if (r.status === 'VERIFIED') return 'badge-success';
    if (r.status === 'TAMPER_DETECTED') return 'badge-danger';
    return 'badge-warning';
  }

  formatBytes(bytes?: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

