export type DataModel = {
    sisLink: SisLink[],
    agReg: AgReg[],
    ts: Ts [],
    psp: string [],
    price: string []
}

export type SisLink = {
    distributorName: string
    distributorDates: DistributorData[]
}

export type DistributorData = {
    inn?: string,
    client?: string,
    product?: string,
    amount?: string
}

export type AgReg = {
    inn?: string,
    client?: string,
    prepareClientName?: string,
    fullName?: string,
    region?: string,
    area?: string,
    cultures?: string,
    totalSquare?: number,
    culture?: string,
    square?: number,
    status?: string
}

export type Ts = {
    inn?: string,
    premium?: string
}

export type ProductPrice = {
    product?: string,
    price?: string
}

export type DistributorReport = {
    distributorName: string,
    totalPremiumSum?: number,
    cultureReports: CultureReport[],
    productReports: ProductReport[]
}

export type CultureReport = {
    inn: string,
    client: string,
    status: string,
    distributorName: string,
    totalSquare?: number,
    culture?: string,
    square?: number,
}

export type ProductReport = {
    inn: string,
    client: string,
    status: string,
    distributorName: string,
    product: string,
    amount: number,
    price?: number,
    sum?: number,
    premiumPercent?: number,
    premiumSum?: number
}
