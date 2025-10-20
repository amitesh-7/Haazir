
-- DIAGNOSTIC SCRIPT FOR SUPABASE
-- Run this in Supabase SQL Editor to diagnose why students aren't showing


-- 1. Check if students exist
SELECT '=== STEP 1: Total Students ===' as step;
SELECT COUNT(*) as total_students FROM students;

-- 2. View all students
SELECT '=== STEP 2: All Students ===' as step;
SELECT 
  student_id,
  name,
  roll_number,
  section_id,
  semester,
  department_id
FROM students
ORDER BY roll_number
LIMIT 20;

-- 3. Check recent timetable entries
SELECT '=== STEP 3: Recent Timetable Entries ===' as step;
SELECT 
  t.schedule_id,
  t.course_id,
  t.section_id,
  t.teacher_id,
  t.day_of_week,
  t.start_time,
  t.end_time,
  c.course_name,
  c.semester,
  c.department_id
FROM timetable t
LEFT JOIN courses c ON t.course_id = c.course_id
ORDER BY t.schedule_id DESC
LIMIT 10;

-- 4. Check recent attendance sessions
SELECT '=== STEP 4: Recent Attendance Sessions ===' as step;
SELECT 
  session_id,
  schedule_id,
  status,
  created_at,
  expires_at
FROM attendance_sessions
ORDER BY created_at DESC
LIMIT 5;

-- 5. For the MOST RECENT session, show matching students
SELECT '=== STEP 5: Students Matching Most Recent Session ===' as step;
WITH recent_session AS (
  SELECT schedule_id 
  FROM attendance_sessions 
  ORDER BY created_at DESC 
  LIMIT 1
),
timetable_info AS (
  SELECT 
    t.schedule_id,
    t.section_id,
    c.semester,
    c.department_id,
    c.course_name
  FROM timetable t
  JOIN courses c ON t.course_id = c.course_id
  WHERE t.schedule_id = (SELECT schedule_id FROM recent_session)
)
SELECT 
  ti.schedule_id,
  ti.course_name,
  ti.section_id as required_section,
  ti.semester as required_semester,
  ti.department_id as required_dept,
  COUNT(s.student_id) as matching_students
FROM timetable_info ti
LEFT JOIN students s ON 
  s.section_id = ti.section_id 
  AND s.semester = ti.semester 
  AND s.department_id = ti.department_id
GROUP BY ti.schedule_id, ti.course_name, ti.section_id, ti.semester, ti.department_id;

-- 6. Show the actual students who SHOULD match
SELECT '=== STEP 6: List of Students Who Should Match ===' as step;
WITH recent_session AS (
  SELECT schedule_id 
  FROM attendance_sessions 
  ORDER BY created_at DESC 
  LIMIT 1
),
timetable_info AS (
  SELECT 
    t.schedule_id,
    t.section_id,
    c.semester,
    c.department_id,
    c.course_name
  FROM timetable t
  JOIN courses c ON t.course_id = c.course_id
  WHERE t.schedule_id = (SELECT schedule_id FROM recent_session)
)
SELECT 
  s.student_id,
  s.name,
  s.roll_number,
  s.section_id,
  s.semester,
  s.department_id,
  '✅ MATCH' as status
FROM students s
JOIN timetable_info ti ON 
  s.section_id = ti.section_id 
  AND s.semester = ti.semester 
  AND s.department_id = ti.department_id
ORDER BY s.roll_number;

-- 7. Show students who DON'T match (with reasons)
SELECT '=== STEP 7: Students Who DON''T Match (With Reasons) ===' as step;
WITH recent_session AS (
  SELECT schedule_id 
  FROM attendance_sessions 
  ORDER BY created_at DESC 
  LIMIT 1
),
timetable_info AS (
  SELECT 
    t.section_id,
    c.semester,
    c.department_id
  FROM timetable t
  JOIN courses c ON t.course_id = c.course_id
  WHERE t.schedule_id = (SELECT schedule_id FROM recent_session)
)
SELECT 
  s.student_id,
  s.name,
  s.roll_number,
  s.section_id,
  s.semester,
  s.department_id,
  ti.section_id as required_section,
  ti.semester as required_semester,
  ti.department_id as required_dept,
  CASE 
    WHEN s.section_id IS NULL THEN '❌ section_id is NULL'
    WHEN s.section_id != ti.section_id THEN '❌ Wrong section_id'
    WHEN s.semester IS NULL THEN '❌ semester is NULL'
    WHEN s.semester != ti.semester THEN '❌ Wrong semester'
    WHEN s.department_id IS NULL THEN '❌ department_id is NULL'
    WHEN s.department_id != ti.department_id THEN '❌ Wrong department_id'
    ELSE '✅ Should match'
  END as mismatch_reason
FROM students s
CROSS JOIN timetable_info ti
WHERE NOT (
  s.section_id = ti.section_id 
  AND s.semester = ti.semester 
  AND s.department_id = ti.department_id
)
ORDER BY s.roll_number
LIMIT 20;

-- 8. Summary Report
SELECT '=== STEP 8: SUMMARY REPORT ===' as step;
SELECT 
  (SELECT COUNT(*) FROM students) as total_students_in_db,
  (SELECT COUNT(*) FROM timetable) as total_timetable_entries,
  (SELECT COUNT(*) FROM attendance_sessions WHERE created_at > NOW() - INTERVAL '7 days') as sessions_last_7_days,
  (
    WITH recent_session AS (
      SELECT schedule_id FROM attendance_sessions ORDER BY created_at DESC LIMIT 1
    ),
    timetable_info AS (
      SELECT t.section_id, c.semester, c.department_id
      FROM timetable t
      JOIN courses c ON t.course_id = c.course_id
      WHERE t.schedule_id = (SELECT schedule_id FROM recent_session)
    )
    SELECT COUNT(*)
    FROM students s
    JOIN timetable_info ti ON 
      s.section_id = ti.section_id 
      AND s.semester = ti.semester 
      AND s.department_id = ti.department_id
  ) as students_matching_recent_session;

