import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiHttpClient } from '../../../core/services/api/http-client.service';

/**
 * Matches your backend ActivityItemDto:
 * - kind: "note" | "event"
 * - note: { body }
 * - event: { type, message, payloadJson }
 */
export type ActivityItemDto =
  | {
      kind: 'note';
      id: number;
      createdAt: string; // ISO string
      body: string;

      // optional (future-proof if you add later)
      actor?: string;
      createdBy?: string;
      user?: string;
    }
  | {
      kind: 'event';
      id: number;
      createdAt: string; // ISO string
      type: string; // EventType enum string
      message: string;
      payloadJson: string | null;

      // optional (future-proof if you add later)
      actor?: string;
      createdBy?: string;
      user?: string;
    };

@Injectable({ providedIn: 'root' })
export class CaseActivityStore {
  private readonly api = inject(ApiHttpClient);
  private readonly snack = inject(MatSnackBar);

  // Drawer state
  readonly drawerOpen = signal(false);
  readonly selectedCaseId = signal<number | null>(null);

  // Activity state (per case)
  readonly activityByCase = signal<Record<number, ActivityItemDto[]>>({});
  readonly activityLoadingIds = signal<Set<number>>(new Set());
  readonly noteDraftByCase = signal<Record<number, string>>({});
  readonly addingNoteIds = signal<Set<number>>(new Set());

  // ---- per-note UI state ----
  readonly expandedNoteIds = signal<Set<string>>(new Set()); // "caseId:noteId"
  readonly editingNoteIds = signal<Set<string>>(new Set()); // "caseId:noteId"
  readonly noteEditDraftByKey = signal<Record<string, string>>({});
  readonly savingNoteIds = signal<Set<string>>(new Set());

  // ---- NEW: per-note delete state ----
  readonly deletingNoteIds = signal<Set<string>>(new Set()); // "caseId:noteId"

  // ---------- Drawer ----------
  open(caseId: number) {
    if (this.drawerOpen() && this.selectedCaseId() === caseId) {
      this.close();
      return;
    }

    this.selectedCaseId.set(caseId);
    this.drawerOpen.set(true);

    if (!this.activityByCase()[caseId]) {
      this.load(caseId);
    }
  }

  close() {
    this.drawerOpen.set(false);
  }

  onDrawerClosed() {
    // optional
  }

  // ---------- Data ----------
  items(caseId: number): ActivityItemDto[] {
    return this.activityByCase()[caseId] ?? [];
  }

  isLoading(caseId: number): boolean {
    return this.activityLoadingIds().has(caseId);
  }

  refresh(caseId: number) {
    this.load(caseId, true);
  }

  load(caseId: number, force = false) {
    if (!force && this.activityByCase()[caseId]) return;

    const loading = new Set(this.activityLoadingIds());
    loading.add(caseId);
    this.activityLoadingIds.set(loading);

    this.api.get<ActivityItemDto[]>(`/cases/${caseId}/activity`).subscribe({
      next: (items) => {
        this.activityByCase.set({
          ...this.activityByCase(),
          [caseId]: Array.isArray(items) ? items : [],
        });

        const after = new Set(this.activityLoadingIds());
        after.delete(caseId);
        this.activityLoadingIds.set(after);
      },
      error: () => {
        const after = new Set(this.activityLoadingIds());
        after.delete(caseId);
        this.activityLoadingIds.set(after);
        this.toast('Failed to load activity');
      },
    });
  }

  // ---------- Create note ----------
  noteDraft(caseId: number): string {
    return this.noteDraftByCase()[caseId] ?? '';
  }

  setNoteDraft(caseId: number, value: string) {
    this.noteDraftByCase.set({ ...this.noteDraftByCase(), [caseId]: value ?? '' });
  }

  isAddingNote(caseId: number): boolean {
    return this.addingNoteIds().has(caseId);
  }

  addNote(caseId: number) {
    const body = this.noteDraft(caseId).trim();
    if (!body) return;

    const adding = new Set(this.addingNoteIds());
    adding.add(caseId);
    this.addingNoteIds.set(adding);

    this.api.post<void>(`/cases/${caseId}/notes`, { body }).subscribe({
      next: () => {
        const after = new Set(this.addingNoteIds());
        after.delete(caseId);
        this.addingNoteIds.set(after);

        this.setNoteDraft(caseId, '');
        this.toast('Note added');
        this.load(caseId, true);
      },
      error: (err) => {
        const after = new Set(this.addingNoteIds());
        after.delete(caseId);
        this.addingNoteIds.set(after);

        const msg = err?.error?.message ?? err?.message ?? 'Failed to add note';
        this.toast(msg);
      },
    });
  }

  // ---------- Type guards ----------
  isNote(a: ActivityItemDto): a is Extract<ActivityItemDto, { kind: 'note' }> {
    return a.kind === 'note';
  }

  isEvent(a: ActivityItemDto): a is Extract<ActivityItemDto, { kind: 'event' }> {
    return a.kind === 'event';
  }

  // ---------- NOTE expand/edit helpers ----------
  private key(caseId: number, noteId: string | number): string {
    return `${caseId}:${noteId}`;
  }

  isNoteExpanded(caseId: number, noteId: string | number): boolean {
    return this.expandedNoteIds().has(this.key(caseId, noteId));
  }

  toggleNoteExpanded(caseId: number, noteId: string | number) {
    const k = this.key(caseId, noteId);
    const next = new Set(this.expandedNoteIds());
    next.has(k) ? next.delete(k) : next.add(k);
    this.expandedNoteIds.set(next);
  }

  isNoteEditing(caseId: number, noteId: string | number): boolean {
    return this.editingNoteIds().has(this.key(caseId, noteId));
  }

  startEditNote(caseId: number, item: ActivityItemDto) {
    if (!this.isNote(item)) return;

    const noteId = item.id;
    const k = this.key(caseId, noteId);

    const editing = new Set(this.editingNoteIds());
    editing.add(k);
    this.editingNoteIds.set(editing);

    const expanded = new Set(this.expandedNoteIds());
    expanded.add(k);
    this.expandedNoteIds.set(expanded);

    this.noteEditDraftByKey.set({ ...this.noteEditDraftByKey(), [k]: (item.body ?? '').trim() });
  }

  cancelEditNote(caseId: number, noteId: string | number) {
    const k = this.key(caseId, noteId);

    const next = new Set(this.editingNoteIds());
    next.delete(k);
    this.editingNoteIds.set(next);

    const drafts = { ...this.noteEditDraftByKey() };
    delete drafts[k];
    this.noteEditDraftByKey.set(drafts);
  }

  noteEditDraft(caseId: number, noteId: string | number): string {
    return this.noteEditDraftByKey()[this.key(caseId, noteId)] ?? '';
  }

  setNoteEditDraft(caseId: number, noteId: string | number, value: string) {
    const k = this.key(caseId, noteId);
    this.noteEditDraftByKey.set({ ...this.noteEditDraftByKey(), [k]: value ?? '' });
  }

  isNoteSaving(caseId: number, noteId: string | number): boolean {
    return this.savingNoteIds().has(this.key(caseId, noteId));
  }

  saveNote(caseId: number, noteId: string | number) {
    const k = this.key(caseId, noteId);
    const body = this.noteEditDraft(caseId, noteId).trim();
    if (!body) return;

    const saving = new Set(this.savingNoteIds());
    saving.add(k);
    this.savingNoteIds.set(saving);

    // ✅ requires backend endpoint PUT /api/cases/{caseId}/notes/{noteId}
    this.api.put<void>(`/cases/${caseId}/notes/${noteId}`, { body }).subscribe({
      next: () => {
        const after = new Set(this.savingNoteIds());
        after.delete(k);
        this.savingNoteIds.set(after);

        this.toast('Note updated');
        this.cancelEditNote(caseId, noteId);
        this.load(caseId, true);
      },
      error: (err) => {
        const after = new Set(this.savingNoteIds());
        after.delete(k);
        this.savingNoteIds.set(after);

        const msg = err?.error?.message ?? err?.message ?? 'Failed to update note';
        this.toast(msg);
      },
    });
  }

  // ---------- Delete note ----------
  isNoteDeleting(caseId: number, noteId: string | number): boolean {
    return this.deletingNoteIds().has(this.key(caseId, noteId));
  }

  deleteNote(caseId: number, noteId: string | number) {
    const k = this.key(caseId, noteId);

    const deleting = new Set(this.deletingNoteIds());
    deleting.add(k);
    this.deletingNoteIds.set(deleting);

    // ✅ requires backend endpoint DELETE /api/cases/{caseId}/notes/{noteId}
    this.api.delete<void>(`/cases/${caseId}/notes/${noteId}`).subscribe({
      next: () => {
        const after = new Set(this.deletingNoteIds());
        after.delete(k);
        this.deletingNoteIds.set(after);

        // UI cleanup
        const exp = new Set(this.expandedNoteIds());
        exp.delete(k);
        this.expandedNoteIds.set(exp);

        const edit = new Set(this.editingNoteIds());
        edit.delete(k);
        this.editingNoteIds.set(edit);

        const drafts = { ...this.noteEditDraftByKey() };
        delete drafts[k];
        this.noteEditDraftByKey.set(drafts);

        this.toast('Note deleted');
        this.load(caseId, true);
      },
      error: (err) => {
        const after = new Set(this.deletingNoteIds());
        after.delete(k);
        this.deletingNoteIds.set(after);

        const msg = err?.error?.message ?? err?.message ?? 'Failed to delete note';
        this.toast(msg);
      },
    });
  }

  // ---------- Rendering helpers ----------
  activityTypeLabel(a: ActivityItemDto): string {
    return this.isNote(a) ? 'NOTE' : String(a.type ?? 'EVENT');
  }

  activityIcon(a: ActivityItemDto): string {
    if (this.isNote(a)) return 'sticky_note_2';

    const t = String(a.type ?? '').toLowerCase();
    if (t.includes('status')) return 'autorenew';
    if (t.includes('assign')) return 'person';
    if (t.includes('event')) return 'event';
    return 'bolt';
  }

  activityTime(a: ActivityItemDto): string | null {
    return a.createdAt ? String(a.createdAt) : null;
  }

  activityActor(a: ActivityItemDto): string | null {
    return a.actor ?? a.createdBy ?? a.user ?? null;
  }

  activityBody(a: ActivityItemDto): string {
    if (this.isNote(a)) return (a.body ?? '').trim() || '(empty note)';

    return (
      String(a.message ?? '').trim() ||
      (a.payloadJson ? String(a.payloadJson).trim() : '') ||
      '(no details)'
    );
  }

  private toast(message: string, action = 'OK', duration = 2500) {
    this.snack.open(message, action, { duration });
  }
}
