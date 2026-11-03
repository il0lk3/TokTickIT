import React, { useState } from 'react';
import { ResolutionGateInfo } from '../../api';
import { AccessibleDialog } from '../common/AccessibleDialog';

export interface TicketWorkflowActionsProps {
  currentStatus: string;
  allowedTransitions?: string[];
  resolutionGate?: ResolutionGateInfo;
  isUpdating: boolean;
  onTransition: (targetStatus: string) => void;
  onAssignOwnerShortcut?: () => void;
  onLogActionShortcut?: () => void;
}

export function TicketWorkflowActions({
  currentStatus,
  allowedTransitions = [],
  resolutionGate,
  isUpdating,
  onTransition,
  onAssignOwnerShortcut,
  onLogActionShortcut,
}: TicketWorkflowActionsProps) {
  const [confirmModal, setConfirmModal] = useState<{ targetStatus: string; title: string; desc: string; confirmVariant: 'danger' | 'warning' | 'primary' | 'success' } | null>(null);

  const handleActionClick = (targetStatus: string) => {
    if (isUpdating) return;

    if (targetStatus === 'Cancelled') {
      setConfirmModal({
        targetStatus: 'Cancelled',
        title: 'Cancel Ticket',
        desc: 'Are you sure you want to cancel this ticket? This action is terminal and cannot be reversed.',
        confirmVariant: 'danger',
      });
      return;
    }

    if (targetStatus === 'Closed') {
      setConfirmModal({
        targetStatus: 'Closed',
        title: 'Close Ticket',
        desc: 'Are you sure you want to close this ticket? Ticket work will be marked finished.',
        confirmVariant: 'primary',
      });
      return;
    }

    onTransition(targetStatus);
  };

  const handleConfirmAction = () => {
    if (!confirmModal) return;
    const target = confirmModal.targetStatus;
    setConfirmModal(null);
    onTransition(target);
  };

  const isGateBlocked = (targetStatus: string) => {
    return targetStatus === 'Resolved' && resolutionGate !== undefined && !resolutionGate.met;
  };

  const renderStatusButton = (targetStatus: string) => {
    const blocked = isGateBlocked(targetStatus);

    switch (targetStatus) {
      case 'Open':
        return (
          <button
            key="Open"
            type="button"
            className="btn btn-outline-primary btn-sm px-3 py-2 fw-medium rounded-pill d-flex align-items-center gap-2"
            disabled={isUpdating}
            onClick={() => handleActionClick('Open')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            Open Ticket
          </button>
        );

      case 'InProgress':
        return (
          <button
            key="InProgress"
            type="button"
            className="btn btn-outline-warning btn-sm px-3 py-2 fw-medium rounded-pill d-flex align-items-center gap-2"
            disabled={isUpdating}
            onClick={() => handleActionClick('InProgress')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            In Progress
          </button>
        );

      case 'WaitingForRequester':
        return (
          <button
            key="WaitingForRequester"
            type="button"
            className="btn btn-outline-info btn-sm px-3 py-2 fw-medium rounded-pill d-flex align-items-center gap-2"
            disabled={isUpdating}
            onClick={() => handleActionClick('WaitingForRequester')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Waiting for Requester
          </button>
        );

      case 'Resolved':
        return (
          <button
            key="Resolved"
            type="button"
            id="resolve-action-btn"
            className={`btn btn-sm px-3 py-2 fw-medium rounded-pill d-flex align-items-center gap-2 ${
              blocked ? 'btn-outline-secondary opacity-75' : 'btn-success'
            }`}
            aria-disabled={blocked ? 'true' : 'false'}
            aria-describedby={blocked ? 'resolution-gate-reason' : undefined}
            disabled={isUpdating}
            onClick={() => {
              if (!blocked) handleActionClick('Resolved');
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            Resolve
          </button>
        );

      case 'Closed':
        return (
          <button
            key="Closed"
            type="button"
            className="btn btn-outline-secondary btn-sm px-3 py-2 fw-medium rounded-pill d-flex align-items-center gap-2"
            disabled={isUpdating}
            onClick={() => handleActionClick('Closed')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Close Ticket
          </button>
        );

      case 'Reopened':
        return (
          <button
            key="Reopened"
            type="button"
            className="btn btn-warning btn-sm px-3 py-2 fw-medium rounded-pill d-flex align-items-center gap-2 text-dark"
            disabled={isUpdating}
            onClick={() => handleActionClick('Reopened')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            Reopen
          </button>
        );

      case 'Cancelled':
        return (
          <button
            key="Cancelled"
            type="button"
            className="btn btn-outline-danger btn-sm px-3 py-2 fw-medium rounded-pill d-flex align-items-center gap-2"
            disabled={isUpdating}
            onClick={() => handleActionClick('Cancelled')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Cancel Ticket
          </button>
        );

      default:
        return null;
    }
  };

  const gateMissing = resolutionGate?.missing || [];
  const showGateBanner = allowedTransitions.includes('Resolved') && resolutionGate !== undefined && !resolutionGate.met;

  return (
    <div className="d-flex flex-column gap-2" data-testid="ticket-workflow-actions">
      {/* Action Buttons Row */}
      <div className="d-flex flex-wrap align-items-center gap-2">
        {allowedTransitions.map((target) => renderStatusButton(target))}
      </div>

      {/* Resolution Gate Missing Requirements Banner */}
      {showGateBanner && (
        <div
          id="resolution-gate-reason"
          className="alert alert-warning py-2 px-3 mb-0 rounded-3 small border-0 bg-warning bg-opacity-10 text-dark d-flex flex-column gap-1"
          role="region"
          aria-label="Resolution Gate Requirements"
        >
          <div className="d-flex align-items-center gap-2 fw-semibold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Resolution Gate Requirements:
          </div>
          <div className="text-secondary ps-4">
            Ticket must have an assigned active IT Staff owner and at least one logged action taken with a result before it can be resolved.
          </div>
          <div className="d-flex flex-wrap gap-2 ps-4 pt-1">
            {gateMissing.includes('ACTIVE_STAFF_OWNER_REQUIRED') && onAssignOwnerShortcut && (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm py-0 px-2 rounded-pill fw-medium"
                style={{ fontSize: '0.75rem' }}
                onClick={onAssignOwnerShortcut}
              >
                Assign Owner
              </button>
            )}
            {gateMissing.includes('ACTION_TAKEN_WITH_RESULT_REQUIRED') && onLogActionShortcut && (
              <button
                type="button"
                className="btn btn-outline-success btn-sm py-0 px-2 rounded-pill fw-medium"
                style={{ fontSize: '0.75rem' }}
                onClick={onLogActionShortcut}
              >
                Log Action
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmModal && (
        <AccessibleDialog
          isOpen={true}
          role="alertdialog"
          title={confirmModal.title}
          description={confirmModal.desc}
          confirmText={`Confirm ${confirmModal.targetStatus === 'Cancelled' ? 'Cancel' : confirmModal.targetStatus}`}
          cancelText="Keep Ticket"
          confirmVariant={confirmModal.confirmVariant}
          isSubmitting={isUpdating}
          initialFocusSafe={true}
          onClose={() => setConfirmModal(null)}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}
