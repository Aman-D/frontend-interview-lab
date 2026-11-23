export interface Option {
  /** Unique value reported through onChange. */
  value: string;
  /** Visible text; also what the filter matches against. */
  label: string;
  /** Listed, but can never be selected. */
  disabled?: boolean;
}

export interface MultiSelectProps {
  /** Visible label; also the accessible name of the combobox. */
  label: string;
  options: Option[];
  /** Controlled selection (values, in selection order). When provided, the component never changes it itself. */
  value?: string[];
  /** Initial selection when uncontrolled. Read once, on mount. */
  defaultValue?: string[];
  /** Called with the complete next selection. */
  onChange?: (value: string[]) => void;
  /** At most this many selected values. Unlimited when omitted. */
  maxSelections?: number;
  placeholder?: string;
}
