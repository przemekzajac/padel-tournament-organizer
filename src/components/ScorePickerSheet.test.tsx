import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScorePickerSheet } from './ScorePickerSheet';

describe('ScorePickerSheet', () => {
  it('renders score options from 0 to pointsPerMatch', () => {
    render(
      <ScorePickerSheet
        pointsPerMatch={24}
        teamLabel="Alice & Bob"
        currentValue={null}
        onSelect={() => {}}
        onClose={() => {}}
      />
    );

    // Should have buttons for 0 through 24
    for (let i = 0; i <= 24; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it('renders team label in header', () => {
    render(
      <ScorePickerSheet
        pointsPerMatch={16}
        teamLabel="Alice & Bob"
        currentValue={null}
        onSelect={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Score for Alice & Bob')).toBeInTheDocument();
  });

  it('calls onSelect when a score is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <ScorePickerSheet
        pointsPerMatch={16}
        teamLabel="Test"
        currentValue={null}
        onSelect={onSelect}
        onClose={() => {}}
      />
    );

    await user.click(screen.getByText('10'));
    expect(onSelect).toHaveBeenCalledWith(10);
  });

  it('highlights current value with primary styling', () => {
    render(
      <ScorePickerSheet
        pointsPerMatch={16}
        teamLabel="Test"
        currentValue={8}
        onSelect={() => {}}
        onClose={() => {}}
      />
    );

    const button8 = screen.getByText('8').closest('button');
    expect(button8).toHaveClass('bg-primary');
    expect(button8).toHaveClass('text-white');
  });

  it('does not highlight non-selected values with primary styling', () => {
    render(
      <ScorePickerSheet
        pointsPerMatch={16}
        teamLabel="Test"
        currentValue={8}
        onSelect={() => {}}
        onClose={() => {}}
      />
    );

    const button5 = screen.getByText('5').closest('button');
    expect(button5).not.toHaveClass('bg-primary');
    expect(button5).toHaveClass('bg-gray-100');
  });

  it('renders score options for 32-point match', () => {
    render(
      <ScorePickerSheet
        pointsPerMatch={32}
        teamLabel="Test"
        currentValue={null}
        onSelect={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('32')).toBeInTheDocument();
  });

  it('renders correct number of buttons', () => {
    render(
      <ScorePickerSheet
        pointsPerMatch={16}
        teamLabel="Test"
        currentValue={null}
        onSelect={() => {}}
        onClose={() => {}}
      />
    );

    // 0 through 16 = 17 buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(17);
  });
});
