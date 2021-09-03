import { logger } from "./logger";
import prompt from "prompt";
import optimist from "optimist";
import cron from "node-cron";
import fs from "fs";

const FILE_PRIVATE_KEY=".key";

let jobCid:string;
let walletKey:string;


const init=async ()=>{
    try {
        logger.info("Deflow JobRunner is starting...");

        let pkByFile;
        if(fs.existsSync(FILE_PRIVATE_KEY)){
            pkByFile=fs.readFileSync(FILE_PRIVATE_KEY)?.toString();
        }

        prompt.override=optimist.usage("Usage: $0 -c <input> -k <input>").alias("cid","c").alias("walletKey","k").argv;
        prompt.start();
        const inputs=await prompt.get([
            {
                name:"cid",
                description:"Input the IPFS CID of the job to run",
                required:true
            },{
                name:"walletKey",
                description:`Paste your wallet's private key or mnemonic phrase here(press ENTER to ${pkByFile?"keep using current key":"ignore"})`,
                required:false
            }
        ]);
        jobCid=inputs.cid as string;
        logger.info(`Got CID: ${jobCid}`);
        walletKey=inputs.walletKey as string;
        if(walletKey){
            fs.writeFileSync(FILE_PRIVATE_KEY,walletKey);
            logger.info(`Your wallet key was saved in file '${FILE_PRIVATE_KEY}' and will ONLY be used locally.`);
        }
        if(!walletKey && pkByFile){
            walletKey=pkByFile;
        }   
        const job={
            cronExpr:"* * * * * *",
            call:()=>{
                logger.info(`run job[${jobCid}]...`);
            }
        }
        cron.schedule(job.cronExpr,job.call);
        logger.info("Deflow JobRunner started.");
    } catch (error) {
        logger.error("Got error when starting",error);
        process.exit();
    }
    
};

init(); 