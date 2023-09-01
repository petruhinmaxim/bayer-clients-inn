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
    prepareClientName: string,
    fullName: string,
    region: string,
    area:string,
    cultures?: string,
    totalSquare?:number,
    culture?: string,
    square?: number,
    status?: string,
    inn?: string
}

export type Ts = {
    inn?: string,
    premium?: string
}
