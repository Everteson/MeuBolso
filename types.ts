export interface Ship {
  id: string;
  name: string;
  arrivalDate: string; // ISO String
  originPort: string;
  flag: string;
  cargoType: string;
  status: 'Agendado' | 'Atracado' | 'Atrasado';
}
