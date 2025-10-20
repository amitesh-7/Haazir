export const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

export const calculateAttendancePercentage = (presentDays: number, totalDays: number): number => {
    if (totalDays === 0) return 0;
    return (presentDays / totalDays) * 100;
};

export const isAttendanceBelowThreshold = (percentage: number, threshold: number = 75): boolean => {
    return percentage < threshold;
};

export const downloadReport = (data: any, filename: string): void => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};