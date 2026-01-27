export interface Client {
    id?: number | string;
    clientId: string;
    name: string;
    sex: string;
    age: number;
    address?: string;
    refDoctor?: string;
    procedure?: string;
    operationTeam?: string[] | string;
    timeStarted?: string;
    timeEnded?: string;
    medicationGiven?: string;
    instrumentsUsed?: string[] | string;
    clinicalSummary?: string;
    findings?: string;
    hutTestResult?: string;
    impression?: string;
    comments?: string;
    medication?: string;
    dateOfRegistration?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface MedicalReport {
    id: string;
    clientId: string;
    refDoctor?: string;
    procedure?: string;
    operationTeam?: string[] | string;
    timeStarted?: string;
    timeEnded?: string;
    medicationGiven?: string;
    stomachContent?: string;
    instrumentsUsed?: string[] | string;
    clinicalSummary?: string;
    biopsy?: string;
    biopsySite?: string;
    oesophagusGE?: string;
    geJunction?: string;
    fundus?: string;
    body?: string;
    antrum?: string;
    pylorus?: string;
    d1?: string;
    d2?: string;
    duodenum?: string;
    findings?: string;
    hutTestResult?: string;
    testType?: string;
    testResult?: string;
    impression?: string;
    comments?: string;
    medication?: string;
    date?: string;
    createdAt?: string;
    updatedAt?: string;
}
