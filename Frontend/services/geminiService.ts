import { Ship } from "../types";

// Função auxiliar para gerar datas próximas
const getDate = (offsetHours: number) => {
  const date = new Date();
  date.setHours(date.getHours() + offsetHours);
  return date.toISOString();
};

const DATASETS: Ship[][] = [
  // CENÁRIO 1: Manhã Agitada - Chegadas da Europa e Ásia
  [
    {
      id: "CMD-101",
      name: "MSC Gullls",
      arrivalDate: getDate(-2),
      originPort: "Rotterdam (Netherlands)",
      flag: "PA",
      cargoType: "Containers",
      status: "Atracado"
    },
    {
      id: "CMD-102",
      name: "Maersk Leta",
      arrivalDate: getDate(1),
      originPort: "Shanghai (China)",
      flag: "DK",
      cargoType: "Eletrônicos",
      status: "Agendado"
    },
    {
      id: "CMD-103",
      name: "CMA CGM Brazil",
      arrivalDate: getDate(3),
      originPort: "Le Havre (France)",
      flag: "FR",
      cargoType: "Veículos",
      status: "Agendado"
    },
    {
      id: "CMD-104",
      name: "Ever Given II",
      arrivalDate: getDate(-5),
      originPort: "Singapore",
      flag: "TW",
      cargoType: "Granel Sólido",
      status: "Atrasado"
    },
    {
      id: "CMD-105",
      name: "Hapag-Lloyd Santos",
      arrivalDate: getDate(0),
      originPort: "Hamburg (Germany)",
      flag: "DE",
      cargoType: "Químicos",
      status: "Atracado"
    }
  ],
  // CENÁRIO 2: Tarde - Foco nas Américas e Petróleo
  [
    {
      id: "TRD-201",
      name: "Petrobras Morena",
      arrivalDate: getDate(0),
      originPort: "Rio de Janeiro (Brasil)",
      flag: "BR",
      cargoType: "Petróleo Bruto",
      status: "Atracado"
    },
    {
      id: "TRD-202",
      name: "ONE Apus",
      arrivalDate: getDate(2),
      originPort: "Long Beach (USA)",
      flag: "JP",
      cargoType: "Containers",
      status: "Agendado"
    },
    {
      id: "TRD-203",
      name: "ZIM Kingston",
      arrivalDate: getDate(4),
      originPort: "Kingston (Jamaica)",
      flag: "IL",
      cargoType: "Manufaturados",
      status: "Agendado"
    },
    {
      id: "TRD-204",
      name: "Hamburg Süd Rio",
      arrivalDate: getDate(-1),
      originPort: "Buenos Aires (Argentina)",
      flag: "LR",
      cargoType: "Refrigerados (Carne)",
      status: "Atracado"
    },
    {
      id: "TRD-205",
      name: "Cosco Star",
      arrivalDate: getDate(6),
      originPort: "Ningbo (China)",
      flag: "CN",
      cargoType: "Têxtil",
      status: "Atrasado"
    },
    {
      id: "TRD-206",
      name: "Wallenius Wilhelmsen",
      arrivalDate: getDate(8),
      originPort: "Gothenburg (Sweden)",
      flag: "NO",
      cargoType: "Automóveis (Ro-Ro)",
      status: "Agendado"
    }
  ],
  // CENÁRIO 3: Noite/Madrugada - Operação Pesada
  [
    {
      id: "NGT-301",
      name: "HMM Algeciras",
      arrivalDate: getDate(-3),
      originPort: "Busan (South Korea)",
      flag: "KR",
      cargoType: "Containers (Mega)",
      status: "Atracado"
    },
    {
      id: "NGT-302",
      name: "OOCL Hong Kong",
      arrivalDate: getDate(-1),
      originPort: "Hong Kong",
      flag: "HK",
      cargoType: "Eletrônicos",
      status: "Atracado"
    },
    {
      id: "NGT-303",
      name: "Grimaldi Grande",
      arrivalDate: getDate(5),
      originPort: "Lagos (Nigeria)",
      flag: "IT",
      cargoType: "Veículos",
      status: "Atrasado"
    },
    {
      id: "NGT-304",
      name: "Yang Ming One",
      arrivalDate: getDate(2),
      originPort: "Kaohsiung (Taiwan)",
      flag: "TW",
      cargoType: "Peças Industriais",
      status: "Agendado"
    }
  ]
];

export const generateShipSchedule = async (): Promise<Ship[]> => {
  // Simula um delay de rede para parecer real (UX)
  await new Promise(resolve => setTimeout(resolve, 600));

  // Escolhe um dataset aleatório
  const randomIndex = Math.floor(Math.random() * DATASETS.length);
  return DATASETS[randomIndex];
};
