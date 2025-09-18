// Mock date utilities that might be used in the app
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
};

export const formatDateForInput = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const getAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

describe('Date Utils', () => {
  beforeEach(() => {
    // Mock current time to 2023-01-01T12:00:00Z
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('formatDate', () => {
    it('should format recent dates correctly', () => {
      const now = new Date('2023-01-01T12:00:00Z');
      
      expect(formatDate(new Date(now.getTime() - 30 * 1000).toISOString())).toBe('Just now');
      expect(formatDate(new Date(now.getTime() - 5 * 60 * 1000).toISOString())).toBe('5m ago');
      expect(formatDate(new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString())).toBe('2h ago');
      expect(formatDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString())).toBe('3d ago');
    });

    it('should format older dates with full date and time', () => {
      const oldDate = new Date('2022-12-01T10:30:00Z');
      const result = formatDate(oldDate.toISOString());
      
      expect(result).toContain('12/1/2022');
      // Check for time in any format (AM/PM or 24-hour)
      expect(result).toMatch(/(10:30|11:30).*AM|PM|:00/);
    });

    it('should handle invalid date strings', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date at Invalid Date');
    });
  });

  describe('formatDateForInput', () => {
    it('should format date for HTML date input', () => {
      const dateString = '2023-01-15T14:30:00Z';
      const result = formatDateForInput(dateString);
      
      expect(result).toBe('2023-01-15');
    });

    it('should handle different date formats', () => {
      expect(formatDateForInput('2023-12-25')).toBe('2023-12-25');
      expect(formatDateForInput('2023-01-01T00:00:00Z')).toBe('2023-01-01');
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate('2023-01-01')).toBe(true);
      expect(isValidDate('2023-01-01T12:00:00Z')).toBe(true);
      expect(isValidDate('January 1, 2023')).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('2023-13-01')).toBe(false);
      expect(isValidDate('')).toBe(false);
    });
  });

  describe('getAge', () => {
    it('should calculate age correctly', () => {
      // Person born in 1990, current year is 2023
      expect(getAge('1990-01-01')).toBe(33);
      expect(getAge('1990-12-31')).toBe(32); // Not yet birthday
      expect(getAge('2023-01-01')).toBe(0); // Born today
    });

    it('should handle edge cases', () => {
      expect(getAge('2024-01-01')).toBe(-1); // Future birth date
      expect(getAge('1900-01-01')).toBe(123); // Very old person
    });
  });
});
