import React, { useState } from 'react';
import { useWorkingDaysConfig, useUpdateWorkingDays, useAddHoliday, useRemoveHoliday } from '../../hooks/api';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function WorkingDaysConfig() {
  const { data: config, isLoading } = useWorkingDaysConfig();
  const updateWorkingDays = useUpdateWorkingDays();
  const addHoliday = useAddHoliday();
  const removeHoliday = useRemoveHoliday();

  const [holidayDate, setHolidayDate] = useState('');
  const [holidayReason, setHolidayReason] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const workingDays = config?.working_days || [1, 2, 3, 4, 5];
  const holidays = config?.holidays || [];

  const toggleDay = (dayIndex) => {
    let newDays;
    if (workingDays.includes(dayIndex)) {
      // Don't allow removing all days
      if (workingDays.length <= 1) return;
      newDays = workingDays.filter(d => d !== dayIndex);
    } else {
      newDays = [...workingDays, dayIndex].sort();
    }
    updateWorkingDays.mutate(newDays);
  };

  const handleAddHoliday = (e) => {
    e.preventDefault();
    if (!holidayDate) return;
    addHoliday.mutate({ date: holidayDate, reason: holidayReason }, {
      onSuccess: () => { setHolidayDate(''); setHolidayReason(''); },
    });
  };

  const handleRemoveHoliday = (date) => {
    removeHoliday.mutate(date);
  };

  const sortedHolidays = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="glass-card overflow-hidden mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 transition-colors hover:bg-surface/20"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">Working Days & Holidays</span>
          <span className="text-[10px] text-muted bg-surface/50 px-2 py-0.5 rounded-full">
            {workingDays.length} days · {holidays.length} holiday{holidays.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className={`text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-stroke space-y-5">
          {/* Day Toggles */}
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider mb-3">Working Days</p>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                const isActive = workingDays.includes(dayIndex);
                return (
                  <button
                    key={dayIndex}
                    onClick={() => toggleDay(dayIndex)}
                    disabled={updateWorkingDays.isPending}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${
                      isActive
                        ? 'text-bg'
                        : 'border border-stroke text-muted hover:text-text-primary bg-transparent'
                    }`}
                    style={isActive ? { background: '#89AACC' } : {}}
                  >
                    {DAY_LABELS[dayIndex]}
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-muted mt-2">
              Toggle days on/off. Non-working days will show as holidays in Attendance and Timetable.
            </p>
          </div>

          {/* Holiday List */}
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider mb-3">
              Holidays ({sortedHolidays.length})
            </p>
            {sortedHolidays.length === 0 ? (
              <p className="text-xs text-muted italic">No holidays added yet.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sortedHolidays.map(hol => {
                  const d = new Date(hol.date + 'T00:00:00');
                  const displayDate = isNaN(d.getTime())
                    ? hol.date
                    : `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
                  return (
                    <div key={hol.date}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface/30 border border-stroke"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted flex-shrink-0">📅</span>
                        <span className="text-xs text-text-primary font-medium flex-shrink-0">{displayDate}</span>
                        {hol.reason && (
                          <span className="text-[10px] text-muted truncate">{hol.reason}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveHoliday(hol.date)}
                        disabled={removeHoliday.isPending}
                        className="text-muted hover:text-[#FF6B6B] transition-colors flex-shrink-0 ml-2 disabled:opacity-40"
                        title="Remove holiday"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Holiday Form */}
          <form onSubmit={handleAddHoliday} className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="text-[9px] text-muted uppercase tracking-wider block mb-1">Date</label>
              <input
                type="date"
                value={holidayDate}
                onChange={e => setHolidayDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl text-xs bg-surface border border-stroke text-text-primary focus:outline-none focus:border-text-primary/30 transition-all"
              />
            </div>
            <div className="flex-[2] w-full">
              <label className="text-[9px] text-muted uppercase tracking-wider block mb-1">Reason (optional)</label>
              <input
                type="text"
                value={holidayReason}
                onChange={e => setHolidayReason(e.target.value)}
                placeholder="e.g. Republic Day"
                className="w-full px-3 py-2 rounded-xl text-xs bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={addHoliday.isPending || !holidayDate}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-bg transition-all hover:opacity-90 disabled:opacity-40 flex-shrink-0"
              style={{ background: '#89AACC' }}
            >
              {addHoliday.isPending ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default WorkingDaysConfig;
