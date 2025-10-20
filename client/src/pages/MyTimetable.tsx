import React, { useEffect, useMemo, useState } from 'react';
import { fetchTeacherTimetable, fetchStudentTimetable } from '../services/api';

type Entry = {
  day_of_week: string;
  start_time: string;
  end_time: string;
  course_name?: string;
  course_code?: string;
  teacher_name?: string;
  course_id?: number | string;
};

const dayColumns = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MyTimetable: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = localStorage.getItem('user');
        const user = raw ? JSON.parse(raw) : null;
        const role = user?.role;
        let data: any[] = [];
        if (role === 'teacher') {
          const id = user?.profile?.teacher_id || user?.user_id || user?.id;
          data = await fetchTeacherTimetable(String(id));
        } else {
          const id = user?.profile?.student_id || user?.user_id || user?.id;
          data = await fetchStudentTimetable(String(id));
        }
        const mapped: Entry[] = (Array.isArray(data) ? data : []).map((e: any) => ({
          day_of_week: e.day_of_week || e.day,
          start_time: e.start_time,
          end_time: e.end_time,
          course_name: e.course?.course_name || e.course_name,
          course_code: e.course?.course_code || e.course_code,
          teacher_name: e.teacher?.name || e.teacher_name,
          course_id: e.course_id,
        }));
        setEntries(mapped);
      } catch (err: any) {
        setError(err?.message || 'Failed to load timetable');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const timeSlots = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => set.add(e.start_time));
    return Array.from(set).sort();
  }, [entries]);

  const byDay = useMemo(() => {
    const map: Record<string, Entry[]> = {};
    dayColumns.forEach(d => (map[d] = []));
    entries.forEach(e => {
      if (!map[e.day_of_week]) map[e.day_of_week] = [];
      map[e.day_of_week].push(e);
    });
    Object.values(map).forEach(list => list.sort((a, b) => (a.start_time < b.start_time ? -1 : 1)));
    return map;
  }, [entries]);

  if (loading) return <div>Loading timetable…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Timetable</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 border-b text-left">Time</th>
              {dayColumns.map(day => (
                <th key={day} className="p-2 border-b text-left">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.length === 0 ? (
              <tr><td colSpan={8} className="p-4 text-center text-gray-500">No classes scheduled</td></tr>
            ) : (
              timeSlots.map(slot => (
                <tr key={slot}>
                  <td className="p-2 border-b font-medium whitespace-nowrap">{slot}</td>
                  {dayColumns.map(day => {
                    const item = (byDay[day] || []).find(e => e.start_time === slot);
                    return (
                      <td key={day} className="p-2 border-b align-top">
                        {item ? (
                          <div>
                            <div className="font-semibold">{item.course_code ? `${item.course_code} — ` : ''}{item.course_name || item.course_id}</div>
                            <div className="text-sm text-gray-600">{item.start_time}–{item.end_time}</div>
                            {item.teacher_name && (
                              <div className="text-sm text-gray-600">{item.teacher_name}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyTimetable;
