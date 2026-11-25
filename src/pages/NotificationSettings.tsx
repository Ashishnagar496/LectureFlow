import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import {
  Bell,
  BellOff,
  Clock,
  Moon,
  Send,
  CheckCircle2,
  AlertCircle,
  History
} from 'lucide-react';

export const NotificationSettings: React.FC = () => {
  const {
    preferences,
    logs,
    permissionStatus,
    toggleMasterNotifications,
    quickEnablePush,
    updatePreferences,
    sendTestAlert
  } = useNotification();

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const isEnabled = preferences?.enabled || false;

  const handleMasterToggle = async (checked: boolean) => {
    try {
      setTestResult(null);
      await toggleMasterNotifications(checked);
    } catch (e: any) {
      setTestResult({ success: false, msg: e.message || 'Could not update notification settings.' });
    }
  };

  const handleTestPush = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await sendTestAlert('browser_push');
      setTestResult({ success: true, msg: res.preview });
    } catch (e: any) {
      setTestResult({ success: false, msg: e.message || 'Failed to send test notification.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      <div className="pb-3 border-b border-[#1F2937]">
        <div className="flex items-center space-x-2 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-1">
          <Bell className="w-4 h-4 text-[#60A5FA]" />
          <span>Push Reminders</span>
        </div>
        <h1 className="text-2xl font-bold text-[#F9FAFB]">
          Notification Settings
        </h1>
        <p className="text-xs text-[#9CA3AF] mt-0.5">
          Free, 1-click browser &amp; mobile PWA push notifications before every class.
        </p>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-xs sm:text-sm ${
            testResult.success
              ? 'bg-[#166534] border-[#166534] text-white'
              : 'bg-[#7F1D1D] border-[#991B1B] text-white'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{testResult.msg}</span>
        </div>
      )}

      {/* 1-Click Instant Activation */}
      {!isEnabled && (
        <div className="bg-[#111827] rounded-2xl border border-[#2563EB]/30 shadow-[0_0_0_1px_rgba(37,99,235,0.15)] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#F9FAFB]">
              Turn On Reminders in 1 Click
            </h2>
            <p className="text-xs text-[#9CA3AF]">
              Allow browser/device notifications once and get alerted 10 minutes before every class.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await quickEnablePush();
              setTestResult({ success: true, msg: 'Instant lecture reminders are now active! You will be notified 10 minutes before each class.' });
            }}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors shrink-0"
          >
            <Bell className="w-4 h-4 text-white" />
            <span>Enable Instant Alerts</span>
          </button>
        </div>
      )}

      {/* Master Toggle */}
      <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-5 sm:p-6 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            {isEnabled ? (
              <Bell className="w-5 h-5 text-[#60A5FA]" />
            ) : (
              <BellOff className="w-5 h-5 text-[#9CA3AF]" />
            )}
            <h2 className="text-base sm:text-lg font-bold text-[#F9FAFB]">
              Enable Lecture Notifications
            </h2>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-1">
            When disabled, no reminders are sent and LectureFlow operates cleanly as a schedule viewer.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          aria-label="Enable Lecture Notifications"
          onClick={() => handleMasterToggle(!isEnabled)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none ${
            isEnabled ? 'bg-[#2563EB]' : 'bg-[#374151]'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full shadow-sm transition-transform ${
              isEnabled ? 'translate-x-5 bg-white' : 'translate-x-0.5 bg-[#D1D5DB]'
            }`}
          />
        </button>
      </div>

      <div className={`space-y-6 transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-60 pointer-events-none'}`}>

        {/* Lead Time */}
        <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-5 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#60A5FA]" />
            <h3 className="text-sm font-bold text-[#F9FAFB] uppercase tracking-wide">
              Reminder Lead Time
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[5, 10, 15, 30].map((mins) => {
              const isSelected = (preferences?.reminder_minutes || 10) === mins;
              return (
                <button
                  key={mins}
                  onClick={() => updatePreferences({ reminder_minutes: mins as 5 | 10 | 15 | 30 })}
                  className={`py-2.5 px-3 rounded-xl border text-center transition-colors ${
                    isSelected
                      ? 'bg-[#2563EB] text-white border-[#2563EB] font-semibold'
                      : 'bg-[#111827] text-[#9CA3AF] border-[#1F2937] hover:text-[#F9FAFB]'
                  }`}
                >
                  <span className="block text-sm font-bold">{mins} min</span>
                  <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#9CA3AF]'}`}>
                    {mins === 10 ? 'Default' : 'Before class'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Browser & Mobile PWA Push */}
        <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-[#0B1120] text-[#60A5FA] border border-[#1F2937]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-bold text-[#F9FAFB]">Browser &amp; Mobile PWA Push</h4>
                <span className="text-[10px] bg-[#166534] text-white font-medium px-2 py-0.5 rounded">
                  Free &bull; Instant
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Browser permission status: <strong className="text-[#F9FAFB] capitalize">{permissionStatus}</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={handleTestPush}
            disabled={testing}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] self-end sm:self-center"
          >
            <Send className="w-3.5 h-3.5 text-white" />
            <span>{testing ? 'Sending...' : 'Send Test Push'}</span>
          </button>
        </div>

        {/* Quiet Hours */}
        <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-5 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Moon className="w-4 h-4 text-[#60A5FA]" />
            <h3 className="text-sm font-bold text-[#F9FAFB] uppercase tracking-wide">
              Quiet Hours
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1">Start (Evening)</label>
              <input
                type="time"
                value={preferences?.quiet_hours_start || '22:00'}
                onChange={(e) => updatePreferences({ quiet_hours_start: e.target.value })}
                className="w-full px-3 py-2 border border-[#1F2937] rounded-xl text-sm bg-[#0B1120] text-[#F9FAFB] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1">End (Morning)</label>
              <input
                type="time"
                value={preferences?.quiet_hours_end || '07:00'}
                onChange={(e) => updatePreferences({ quiet_hours_end: e.target.value })}
                className="w-full px-3 py-2 border border-[#1F2937] rounded-xl text-sm bg-[#0B1120] text-[#F9FAFB] focus:outline-none"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Audit Log */}
      <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F2937]">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-[#60A5FA]" />
            <h3 className="text-sm font-bold text-[#F9FAFB] uppercase tracking-wide">
              Notification Activity Log
            </h3>
          </div>
          <span className="text-xs text-[#9CA3AF]">{logs.length} events</span>
        </div>

        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B1120] text-[#9CA3AF] border-b border-[#1F2937]">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1F2937]/40">
                    <td className="p-3 font-mono text-[#F9FAFB] whitespace-nowrap">
                      {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-semibold capitalize text-[#F9FAFB]">
                      {log.channel.replace('_', ' ')}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2563EB] text-white">
                        {log.delivery_status}
                      </span>
                    </td>
                    <td className="p-3 text-[#9CA3AF] truncate max-w-[240px]">
                      {log.message_preview || 'Lecture reminder'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-[#9CA3AF]">
            No notification activity yet. Click &ldquo;Send Test Push&rdquo; above to preview alerts.
          </p>
        )}
      </div>

    </div>
  );
};
