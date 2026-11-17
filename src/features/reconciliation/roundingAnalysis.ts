export interface RoundingLine{platformId:string;diffPaise:number}
export function analyseRounding(lines:RoundingLine[],aggregateTolerancePaise:number){const individual=lines.filter(l=>l.diffPaise!==0&&Math.abs(l.diffPaise)<=1);const aggregate=lines.reduce((s,l)=>s+l.diffPaise,0);return{individual,aggregatePaise:aggregate,exceeds:Math.abs(aggregate)>aggregateTolerancePaise}}
