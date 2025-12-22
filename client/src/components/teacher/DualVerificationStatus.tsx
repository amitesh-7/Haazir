import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { api } from "../../services/api";

interface VerificationRecord {
  studentId: number;
  studentName: string;
  rollNumber: string;
  status: string;
  faceMatchScore: number;
  scannedAt: string;
}

interface VerificationStats {
  total: number;
  pending: number;
  selfVerified: number;
  verified: number;
  suspicious: number;
}

interface DualVerificationStatusProps {
  sessionId: string;
  onVerifyPhoto?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Dual Verification Status Dashboard
 * Shows real-time status of student verifications for a session
 */
const DualVerificationStatus: React.FC<DualVerificationStatusProps> = ({
  sessionId,
  onVerifyPhoto,
  autoRefresh = true,
  refreshInterval = 10000,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [sessionStatus, setSessionStatus] = useState<string>("pending");
  const [overrideModal, setOverrideModal] = useState<{
    open: boolean;
    studentId: number;
    studentName: string;
  } | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideLoading, setOverrideLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get(
        `/smart-attendance/dual-verify/status/${sessionId}`
      );

      if (response.data.success) {
        const data = response.data.data;
        setStats(data.stats);
        setRecords(data.records);
        setSessionStatus(data.session.verificationStatus);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchStatus();

    if (autoRefresh) {
      const interval = setInterval(fetchStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStatus, autoRefresh, refreshInterval]);

  const handleOverride = async (status: "verified" | "rejected") => {
    if (!overrideModal || !overrideReason.trim()) {
      return;
    }

    setOverrideLoading(true);
    try {
      await api.post("/smart-attendance/dual-verify/override", {
        sessionId,
        studentId: overrideModal.studentId,
        status,
        reason: overrideReason,
      });

      setOverrideModal(null);
      setOverrideReason("");
      fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.error || "Override failed");
    } finally {
      setOverrideLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "text-green-600 bg-green-50";
      case "self_verified":
        return "text-blue-600 bg-blue-50";
      case "suspicious":
        return "text-red-600 bg-red-50";
      case "rejected":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-yellow-600 bg-yellow-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="w-4 h-4" />;
      case "self_verified":
        return <Clock className="w-4 h-4" />;
      case "suspicious":
        return <AlertTriangle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">
          Loading verification status...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            📊 Verification Status
          </h3>
          <p className="text-sm text-gray-500">
            Session: {sessionId.slice(0, 8)}...
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStatus}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg border hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {onVerifyPhoto && stats?.selfVerified && stats.selfVerified > 0 && (
            <button
              onClick={onVerifyPhoto}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              <UserCheck className="w-5 h-5" />
              Verify Class Photo
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <Users className="w-6 h-6 text-gray-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-700">
              {stats.total}
            </div>
            <div className="text-xs text-gray-500">Total Scanned</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl text-center">
            <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl text-center">
            <UserCheck className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-600">
              {stats.selfVerified}
            </div>
            <div className="text-xs text-gray-500">Self-Verified</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-600">
              {stats.verified}
            </div>
            <div className="text-xs text-gray-500">Verified ✅</div>
          </div>
          <div className="bg-red-50 p-4 rounded-xl text-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-600">
              {stats.suspicious}
            </div>
            <div className="text-xs text-gray-500">Suspicious ⚠️</div>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-sm font-medium text-gray-600">
                Student
              </th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">
                Roll No.
              </th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">
                Status
              </th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">
                Match Score
              </th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">
                Time
              </th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map((record, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-800">
                    {record.studentName}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{record.rollNumber}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      record.status
                    )}`}
                  >
                    {getStatusIcon(record.status)}
                    {record.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {record.faceMatchScore
                    ? `${Math.round(record.faceMatchScore * 100)}%`
                    : "-"}
                </td>
                <td className="px-4 py-3 text-gray-500 text-sm">
                  {record.scannedAt
                    ? new Date(record.scannedAt).toLocaleTimeString()
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  {record.status === "suspicious" && (
                    <button
                      onClick={() =>
                        setOverrideModal({
                          open: true,
                          studentId: record.studentId,
                          studentName: record.studentName,
                        })
                      }
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Override
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No students have scanned yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h4 className="text-lg font-bold text-gray-800 mb-4">
              Override Attendance - {overrideModal.studentName}
            </h4>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for override:
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter reason for manual override..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setOverrideModal(null);
                  setOverrideReason("");
                }}
                disabled={overrideLoading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleOverride("rejected")}
                disabled={overrideLoading || !overrideReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => handleOverride("verified")}
                disabled={overrideLoading || !overrideReason.trim()}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DualVerificationStatus;
