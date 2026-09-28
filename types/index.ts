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
    letterhead?: 'LARS' | 'ADAMS';
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
    // Lower Endoscopy Fields
    dre?: string;
    anus?: string;
    rectum?: string;
    sigmoid?: string;
    descendingColon?: string;
    splenicFlexure?: string;
    transverseColon?: string;
    hepaticFlexure?: string;
    ascendingColon?: string;
    caecum?: string;
    ileoCaecalValve?: string;
    findings?: string;
    hutTestResult?: string;
    testType?: string;
    testResult?: string;
    impression?: string;
    comments?: string;
    medication?: string;
    amount?: number | null;
    signatureImage?: string | null;
    date?: string;
    letterhead?: 'LARS' | 'ADAMS';
    createdAt?: string;
    updatedAt?: string;
}

export interface SavedSignature {
    id: string;
    label: string;
    imageData: string;
    createdAt?: string;
}
