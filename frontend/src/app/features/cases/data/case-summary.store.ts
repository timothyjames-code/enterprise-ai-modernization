import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiHttpClient } from '../../../core/services/api/http-client.service';
import { CaseActivityStore } from './case-activity.store';
import { CasesStore } from './cases.store'; // ✅ adjust path if needed

export type SummaryDraftDto = {
  draftId: number;
  caseId: number;
  purpose: string;
  status: string; // DRAFT | ACCEPTED | REJECTED | ...
  generationStatus: string; // COMPLETED | FAILED | ...
  createdAt: string;
  expiresAt: string;
  sourceUpdatedAt: string;
  inputFingerprint: string;
  contentText: string;
  stale: boolean;
  currentCaseUpdatedAt: string;
};

export type CreateDraftResponse = {
  draftId: number;
  status: string;
  generationStatus: string;
  pollUrl: string;
};

export type CaseDto = {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  summaryText: string | null;
};

@Injectable({ providedIn: 'root' })
export class CaseSummaryStore {
  private readonly api = inject(ApiHttpClient);
  private readonly snack = inject(MatSnackBar);
  private readonly activity = inject(CaseActivityStore);

  // ✅ NEW: refresh a single row in the /cases list
  private readonly cases = inject(CasesStore);

  // per-case state
  readonly draftIdByCase = signal<Record<number, number | null>>({});
  readonly draftByCase = signal<Record<number, SummaryDraftDto | null>>({});
  readonly creatingIds = signal<Set<number>>(new Set());
  readonly loadingIds = signal<Set<number>>(new Set());
  readonly acceptingKeys = signal<Set<string>>(new Set()); // "caseId:draftId"
  readonly rejectingKeys = signal<Set<string>>(new Set()); // "caseId:draftId"
  readonly ackStaleByCase = signal<Record<number, boolean>>({});

  // Optional: show official summary immediately in drawer after accept,
  // even if parent list isn't refreshed yet.
  readonly officialSummaryOverrideByCase = signal<
    Record<number, { summaryText: string; updatedAt: string }>
  >({});

  // ---------- selectors ----------
  draftId(caseId: number): number | null {
    return this.draftIdByCase()[caseId] ?? null;
  }

  draft(caseId: number): SummaryDraftDto | null {
    return this.draftByCase()[caseId] ?? null;
  }

  isCreating(caseId: number): boolean {
    return this.creatingIds().has(caseId);
  }

  isLoading(caseId: number): boolean {
    return this.loadingIds().has(caseId);
  }

  isAccepting(caseId: number, draftId: number): boolean {
    return this.acceptingKeys().has(this.key(caseId, draftId));
  }

  isRejecting(caseId: number, draftId: number): boolean {
    return this.rejectingKeys().has(this.key(caseId, draftId));
  }

  ackStale(caseId: number): boolean {
    return this.ackStaleByCase()[caseId] ?? false;
  }

  setAckStale(caseId: number, value: boolean) {
    this.ackStaleByCase.set({ ...this.ackStaleByCase(), [caseId]: !!value });
  }

  officialSummaryOverride(caseId: number): { summaryText: string; updatedAt: string } | null {
    return this.officialSummaryOverrideByCase()[caseId] ?? null;
  }

  clearDraft(caseId: number) {
    const nextIds = { ...this.draftIdByCase() };
    delete nextIds[caseId];
    this.draftIdByCase.set(nextIds);

    const nextDrafts = { ...this.draftByCase() };
    delete nextDrafts[caseId];
    this.draftByCase.set(nextDrafts);

    const nextAck = { ...this.ackStaleByCase() };
    delete nextAck[caseId];
    this.ackStaleByCase.set(nextAck);
  }

  // ---------- actions ----------
  createDraft(caseId: number) {
    const creating = new Set(this.creatingIds());
    creating.add(caseId);
    this.creatingIds.set(creating);

    // body optional; server defaults purpose
    this.api.post<CreateDraftResponse>(`/cases/${caseId}/summary-drafts`, {}).subscribe({
      next: (res) => {
        const after = new Set(this.creatingIds());
        after.delete(caseId);
        this.creatingIds.set(after);

        const draftId = res?.draftId;
        if (!draftId) {
          this.toast('Draft created, but no draftId returned');
          return;
        }

        this.draftIdByCase.set({ ...this.draftIdByCase(), [caseId]: draftId });
        this.setAckStale(caseId, false);
        this.loadDraft(caseId, draftId);

        // refresh activity to show SUMMARY_DRAFT_CREATED
        this.activity.load(caseId, true);

        this.toast('Summary draft created');
      },
      error: (err) => {
        const after = new Set(this.creatingIds());
        after.delete(caseId);
        this.creatingIds.set(after);

        this.toast(err?.error?.message ?? err?.message ?? 'Failed to create summary draft');
      },
    });
  }

  loadDraft(caseId: number, draftId: number) {
    const loading = new Set(this.loadingIds());
    loading.add(caseId);
    this.loadingIds.set(loading);

    this.api.get<SummaryDraftDto>(`/cases/${caseId}/summary-drafts/${draftId}`).subscribe({
      next: (dto) => {
        const after = new Set(this.loadingIds());
        after.delete(caseId);
        this.loadingIds.set(after);

        this.draftByCase.set({ ...this.draftByCase(), [caseId]: dto ?? null });
      },
      error: (err) => {
        const after = new Set(this.loadingIds());
        after.delete(caseId);
        this.loadingIds.set(after);

        this.toast(err?.error?.message ?? err?.message ?? 'Failed to load summary draft');
      },
    });
  }

  acceptDraft(caseId: number, draftId: number) {
    const k = this.key(caseId, draftId);
    const accepting = new Set(this.acceptingKeys());
    accepting.add(k);
    this.acceptingKeys.set(accepting);

    const body = { acknowledgeStale: this.ackStale(caseId) };

    this.api.post<CaseDto>(`/cases/${caseId}/summary-drafts/${draftId}/accept`, body).subscribe({
      next: (updatedCase) => {
        const after = new Set(this.acceptingKeys());
        after.delete(k);
        this.acceptingKeys.set(after);

        if (updatedCase?.summaryText) {
          this.officialSummaryOverrideByCase.set({
            ...this.officialSummaryOverrideByCase(),
            [caseId]: { summaryText: updatedCase.summaryText, updatedAt: updatedCase.updatedAt },
          });
        }

        // clear draft review UI
        this.clearDraft(caseId);

        // refresh activity to show SUMMARY_ACCEPTED
        this.activity.load(caseId, true);

        // ✅ refresh just this case row in the list (no reload)
        this.cases.refreshOne(caseId);

        this.toast('Summary accepted');
      },
      error: (err) => {
        const after = new Set(this.acceptingKeys());
        after.delete(k);
        this.acceptingKeys.set(after);

        // common: 409 conflict if stale and not acknowledged
        this.toast(err?.error?.message ?? err?.message ?? 'Failed to accept summary draft');
      },
    });
  }

  rejectDraft(caseId: number, draftId: number, reasonCode: string, comment?: string) {
    const k = this.key(caseId, draftId);
    const rejecting = new Set(this.rejectingKeys());
    rejecting.add(k);
    this.rejectingKeys.set(rejecting);

    const body = { reasonCode, comment: comment ?? '' };

    this.api
      .post<SummaryDraftDto>(`/cases/${caseId}/summary-drafts/${draftId}/reject`, body)
      .subscribe({
        next: () => {
          const after = new Set(this.rejectingKeys());
          after.delete(k);
          this.rejectingKeys.set(after);

          this.clearDraft(caseId);

          // refresh activity to show SUMMARY_REJECTED
          this.activity.load(caseId, true);

          this.toast('Summary rejected');
        },
        error: (err) => {
          const after = new Set(this.rejectingKeys());
          after.delete(k);
          this.rejectingKeys.set(after);

          this.toast(err?.error?.message ?? err?.message ?? 'Failed to reject summary draft');
        },
      });
  }

  // ---------- helpers ----------
  private key(caseId: number, draftId: number): string {
    return `${caseId}:${draftId}`;
  }

  private toast(message: string, action = 'OK', duration = 2500) {
    this.snack.open(message, action, { duration });
  }
}
