// Utility types
export type Status = 'idle' | 'loading' | 'success' | 'error';

export type Theme = 'light' | 'dark' | 'system';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Form states
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}