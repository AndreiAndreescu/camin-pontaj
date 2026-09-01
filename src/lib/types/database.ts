export type ProfileRole = "admin" | "center_head";
export type CenterType = "centru" | "apartament";
export type TimesheetStatus = "in_lucru" | "finalizat";

export interface ProfileRow {
  id: string;
  full_name: string;
  role: ProfileRole;
  created_at: string;
}

export interface CenterRow {
  id: string;
  nume: string;
  cod: string | null;
  tip: CenterType;
  cladire: string | null;
  adresa: string | null;
  localitate: string | null;
  judet: string | null;
  capacitate: number | null;
  activ: boolean;
  created_at: string;
}

export interface ProfileCenterRow {
  profile_id: string;
  center_id: string;
}

export interface EmployeeRow {
  id: string;
  nume: string;
  functie: string;
  email: string | null;
  telefon: string | null;
  este_salariat: boolean;
  activ: boolean;
  created_at: string;
}

export interface EmployeeCenterRow {
  employee_id: string;
  center_id: string;
}

export interface AbsenceCodeRow {
  code: string;
  label: string;
  sort_order: number;
}

export interface TimesheetRow {
  id: string;
  center_id: string;
  employee_id: string;
  an: number;
  luna: number;
  status: TimesheetStatus;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface TimesheetDayRow {
  id: string;
  timesheet_id: string;
  ziua: number;
  ora_inceput: string | null;
  ora_sfarsit: string | null;
  ore_lucrate: number | null;
  ore_suplimentare: number;
  ore_noapte: number;
  ore_sambata: number;
  ore_duminica: number;
  cod_absenta: string | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Pick<ProfileRow, "id" | "full_name" | "role">;
        Update: Partial<Pick<ProfileRow, "full_name" | "role">>;
        Relationships: [];
      };
      centers: {
        Row: CenterRow;
        Insert: Partial<CenterRow> & Pick<CenterRow, "nume">;
        Update: Partial<CenterRow>;
        Relationships: [];
      };
      profile_centers: {
        Row: ProfileCenterRow;
        Insert: ProfileCenterRow;
        Update: Partial<ProfileCenterRow>;
        Relationships: [];
      };
      employees: {
        Row: EmployeeRow;
        Insert: Partial<EmployeeRow> & Pick<EmployeeRow, "nume" | "functie">;
        Update: Partial<EmployeeRow>;
        Relationships: [];
      };
      employee_centers: {
        Row: EmployeeCenterRow;
        Insert: EmployeeCenterRow;
        Update: Partial<EmployeeCenterRow>;
        Relationships: [];
      };
      absence_codes: {
        Row: AbsenceCodeRow;
        Insert: Partial<AbsenceCodeRow> & Pick<AbsenceCodeRow, "code" | "label">;
        Update: Partial<AbsenceCodeRow>;
        Relationships: [];
      };
      timesheets: {
        Row: TimesheetRow;
        Insert: Partial<TimesheetRow> & Pick<TimesheetRow, "center_id" | "employee_id" | "an" | "luna">;
        Update: Partial<TimesheetRow>;
        Relationships: [];
      };
      timesheet_days: {
        Row: TimesheetDayRow;
        Insert: Partial<TimesheetDayRow> & Pick<TimesheetDayRow, "timesheet_id" | "ziua">;
        Update: Partial<TimesheetDayRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
