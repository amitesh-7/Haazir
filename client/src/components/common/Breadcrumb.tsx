import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

const breadcrumbConfig: Record<string, BreadcrumbItem> = {
  '/coordinator': { label: 'Dashboard', icon: '📊' },
  '/students': { label: 'Students', icon: '👥' },
  '/teachers': { label: 'Teachers', icon: '👨‍🏫' },
  '/courses': { label: 'Courses', icon: '📚' },
  '/departments': { label: 'Departments', icon: '🏢' },
  '/timetable': { label: 'Timetable', icon: '🗓️' },
  '/attendance': { label: 'Attendance', icon: '📝' },
  '/teacher': { label: 'Dashboard', icon: '📊' },
  '/student': { label: 'Dashboard', icon: '📊' },
  '/my-timetable': { label: 'My Schedule', icon: '🗓️' },
  '/attendance/take': { label: 'Take Attendance', icon: '✅' },
  '/attendance/me': { label: 'My Attendance', icon: '📈' },
  '/profile': { label: 'Account Settings', icon: '⚙️' },
  '/student/profile': { label: 'Student Profile', icon: '👤' },
};

const roleConfig = {
  coordinator: { label: 'Administration', icon: '🛡️' },
  teacher: { label: 'Teaching', icon: '👨‍🏫' },
  student: { label: 'Student Portal', icon: '🎓' },
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const path = location.pathname;
    const items: BreadcrumbItem[] = [];

    // Add home/role-based root
    if (user?.role && roleConfig[user.role as keyof typeof roleConfig]) {
      const roleInfo = roleConfig[user.role as keyof typeof roleConfig];
      items.push({
        label: roleInfo.label,
        icon: roleInfo.icon,
        href: `/${user.role}`
      });
    }

    // Add current page if it's not the root
    const currentPage = breadcrumbConfig[path];
    if (currentPage && path !== `/${user?.role}`) {
      items.push({
        ...currentPage,
        href: path
      });
    }

    return items;
  }, [location.pathname, user?.role]);

  // Don't show breadcrumb if there's only one item or on login page
  if (breadcrumbs.length <= 1 || location.pathname === '/login') {
    return null;
  }

  return (
    <nav className="flex mb-4 text-sm" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbs.map((item, index) => (
          <li key={item.href || item.label} className="inline-flex items-center">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-gray-400 mx-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="flex items-center space-x-1 text-gray-500 font-medium">
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </span>
            ) : (
              <Link
                to={item.href || '#'}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;