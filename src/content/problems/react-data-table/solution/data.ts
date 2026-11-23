import type { Column } from './types';

export type Level = 'Junior' | 'Mid' | 'Senior' | 'Staff';

export interface Employee {
  id: number;
  name: string;
  team: string;
  level: Level;
  salary: number;
  startDate: string; // ISO yyyy-mm-dd, so string order is chronological
  location: string | null; // null = not disclosed
}

// Fictional people and numbers, made up for this exercise.
export const employees: Employee[] = [
  { id: 1, name: 'Amara Okafor', team: 'Platform', level: 'Senior', salary: 148000, startDate: '2019-03-11', location: 'Lagos' },
  { id: 2, name: 'Bruno Silva', team: 'Growth', level: 'Mid', salary: 112000, startDate: '2021-07-01', location: 'São Paulo' },
  { id: 3, name: 'chloe Martin', team: 'Design Systems', level: 'Staff', salary: 182000, startDate: '2016-10-24', location: 'Lyon' },
  { id: 4, name: 'Dev Patel', team: 'Platform', level: 'Junior', salary: 86000, startDate: '2024-01-15', location: null },
  { id: 5, name: 'Elif Yılmaz', team: 'Payments', level: 'Senior', salary: 151000, startDate: '2018-05-30', location: 'Istanbul' },
  { id: 6, name: 'Farah Haddad', team: 'Growth', level: 'Junior', salary: 98000, startDate: '2025-09-01', location: 'Amman' },
  { id: 7, name: 'Gustav Berg', team: 'Payments', level: 'Mid', salary: 118000, startDate: '2020-02-17', location: 'Oslo' },
  { id: 8, name: 'Hiro Tanaka', team: 'Design Systems', level: 'Mid', salary: 112000, startDate: '2022-04-04', location: 'Osaka' },
  { id: 9, name: 'Ines Ferreira', team: 'Platform', level: 'Staff', salary: 176000, startDate: '2015-12-07', location: 'Porto' },
  { id: 10, name: 'Jonas Weber', team: 'Payments', level: 'Junior', salary: 91000, startDate: '2023-11-20', location: 'Berlin' },
  { id: 11, name: 'Kavya Rao', team: 'Growth', level: 'Senior', salary: 139000, startDate: '2017-08-14', location: 'Bengaluru' },
  { id: 12, name: 'Luca Romano', team: 'Platform', level: 'Mid', salary: 112000, startDate: '2021-01-25', location: null },
  { id: 13, name: 'Maya Cohen', team: 'Design Systems', level: 'Senior', salary: 144000, startDate: '2019-06-03', location: 'Tel Aviv' },
  { id: 14, name: 'Nnamdi Eze', team: 'Payments', level: 'Staff', salary: 188000, startDate: '2014-04-28', location: 'Accra' },
];

const LEVEL_RANK: Record<Level, number> = { Junior: 0, Mid: 1, Senior: 2, Staff: 3 };
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const employeeColumns: Column<Employee>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'team', header: 'Team', sortable: true },
  // Alphabetical order would be Junior, Mid, Senior, Staff by accident; the rank makes intent explicit.
  { key: 'level', header: 'Level', sortable: true, compare: (a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] },
  { key: 'salary', header: 'Salary', sortable: true, render: (e) => money.format(e.salary) },
  { key: 'startDate', header: 'Start date', sortable: true },
  { key: 'location', header: 'Location', render: (e) => e.location ?? '—' },
];
