import { ReactNode } from 'react';

export interface SelectOption {
  value: any;
  label: ReactNode;
}

export interface SelectProps {
  options: SelectOption[];
  value: any;
  placeholder?: string;
  onChange: (value: any) => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  isSearchable?: boolean;
  isClearable?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  renderOption?: (option: SelectOption) => ReactNode;
  renderValue?: (option: SelectOption) => ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Select: React.FC<SelectProps>; 