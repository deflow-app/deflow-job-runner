
import pino from "pino"

const option={
  base: null,
  prettyPrint : true,
  timestamp: () => `,"time":"${new Date(Date.now()).toLocaleString(undefined,{hour12:false})}"`
}

export const logger = pino(option);

export function invariant(condition:any,message:string){
  if(!condition){
    throw new Error(message);
  }
}
