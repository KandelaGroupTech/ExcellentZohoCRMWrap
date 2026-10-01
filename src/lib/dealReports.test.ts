import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calendarDaysSince,
  daysInStageColumnLabel,
  groupDealsByAccount,
  isAgingDeal,
  isClosedStage,
  NO_ACCOUNT_LABEL,
  resolveStageEntry,
} from './dealReports';

test('closed stages include won, lost, and lost to competition', () => {
  assert.equal(isClosedStage('Closed Won'), true);
  assert.equal(isClosedStage('Closed Lost'), true);
  assert.equal(isClosedStage('Closed Lost to Competition'), true);
  assert.equal(isClosedStage('Proposal/Price Quote'), false);
});

test('stage entry prefers an open stage-history row over created time', () => {
  const entry = resolveStageEntry(
    {
      Stage: 'Proposal/Price Quote',
      Stage_Modified_Time: null,
      Created_Time: '2026-09-22T13:00:27-04:00',
    },
    [
      {
        Stage: 'Qualification',
        Moved_To__s: 'Proposal/Price Quote',
        Modified_Time: '2026-09-22T13:00:27-04:00',
      },
      {
        Stage: 'Proposal/Price Quote',
        Moved_To__s: null,
        Modified_Time: '2026-09-30T16:41:29-04:00',
      },
    ]
  );
  assert.equal(entry.basis, 'stage_history');
  assert.equal(entry.approximate, false);
  assert.equal(entry.enteredAt, '2026-09-30T16:41:29-04:00');
});

test('stage entry uses Stage_Modified_Time when Zoho populated it', () => {
  const entry = resolveStageEntry(
    {
      Stage: 'Qualification',
      Stage_Modified_Time: '2026-08-01T12:00:00-04:00',
      Created_Time: '2026-01-01T12:00:00-04:00',
    },
    []
  );
  assert.equal(entry.basis, 'stage_modified_time');
  assert.equal(entry.enteredAt, '2026-08-01T12:00:00-04:00');
});

test('missing stage history falls back to created time and is approximate', () => {
  const entry = resolveStageEntry(
    {
      Stage: 'Qualification',
      Stage_Modified_Time: null,
      Created_Time: '2026-01-01T12:00:00-04:00',
    },
    []
  );
  assert.equal(entry.basis, 'created_time');
  assert.equal(entry.approximate, true);
  assert.equal(daysInStageColumnLabel(['created_time']), 'Days since created (approx.)');
  assert.equal(daysInStageColumnLabel(['stage_history']), 'Days in stage');
});

test('aging requires 30+ days, no next step, no open tasks, and no recent activity', () => {
  const aged = {
    closed: false,
    daysInStage: 45,
    nextStep: '  ',
    openTaskCount: 0,
    daysSinceActivity: 40,
  };
  assert.equal(isAgingDeal(aged), true);
  assert.equal(isAgingDeal({ ...aged, daysInStage: 30 }), false);
  assert.equal(isAgingDeal({ ...aged, nextStep: 'Call Friday' }), false);
  assert.equal(isAgingDeal({ ...aged, openTaskCount: 1 }), false);
  assert.equal(isAgingDeal({ ...aged, daysSinceActivity: 10 }), false);
  assert.equal(isAgingDeal({ ...aged, daysSinceActivity: null }), true);
  assert.equal(isAgingDeal({ ...aged, closed: true }), false);
});

test('calendar days use America/New_York date boundaries', () => {
  const days = calendarDaysSince(
    '2026-09-01T23:30:00-04:00',
    new Date('2026-10-01T00:30:00-04:00')
  );
  assert.equal(days, 30);
});

test('revenue groups unassigned deals and sorts by total descending', () => {
  const groups = groupDealsByAccount([
    { id: '1', name: 'Beta', accountId: 'a', accountName: 'Acme', amount: 100, stage: 'Qualification' },
    { id: '2', name: 'Alpha', accountId: 'a', accountName: 'Acme', amount: 400, stage: 'Closed Won' },
    { id: '3', name: 'Loose', accountId: null, accountName: null, amount: 50, stage: 'Qualification' },
    { id: '4', name: 'Also loose', accountId: null, accountName: '', amount: 25, stage: 'Qualification' },
  ]);
  assert.equal(groups[0].accountName, 'Acme');
  assert.equal(groups[0].totalPipelineValue, 500);
  assert.equal(groups[0].dealCount, 2);
  assert.deepEqual(groups[0].deals.map((deal) => deal.name), ['Alpha', 'Beta']);
  assert.equal(groups[1].accountName, NO_ACCOUNT_LABEL);
  assert.equal(groups[1].dealCount, 2);
  assert.equal(groups[1].totalPipelineValue, 75);
});
