export type DataModel = {
    sisLink: SisLink[],
    agReg: AgReg[],
    ts: Ts [],
    psp: string [],
    price: string []
}

export type SisLink = {
    distributor?: string,
    inn?: string,
    client?: string,
    product?: string,
    amount?: string
}

export type AgReg = {
    client: string,
    fullName: string,
    region: string,
    area:string,
    culture?: string,
    status?: string,
    prepareClientName: string,
    inn?: string
}

export type Ts = {
    inn?: string,
    premium?: string
}
