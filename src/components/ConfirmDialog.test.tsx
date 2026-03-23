import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders title and message', () => {
    render(
      <ConfirmDialog
        title="Delete Tournament"
        message="Are you sure you want to delete this?"
        confirmLabel="Delete"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Delete Tournament')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this?')).toBeInTheDocument();
  });

  it('renders custom confirm label', () => {
    render(
      <ConfirmDialog
        title="Test"
        message="Test message"
        confirmLabel="Yes, delete"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Yes, delete')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        title="Test"
        message="Test message"
        confirmLabel="Confirm"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );

    await user.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        title="Test"
        message="Test message"
        confirmLabel="Confirm"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        title="Test"
        message="Test message"
        confirmLabel="Confirm"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );

    // The backdrop is the first div with bg-black/40
    const backdrop = document.querySelector('.bg-black\\/40') as HTMLElement;
    await user.click(backdrop);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
