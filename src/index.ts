import { logger } from "./logger";
import prompt from "prompt";
import optimist from "optimist";
import cron from "node-cron";

let jobCid:string;


const init=async ()=>{
    try {
        logger.info("Deflow JobRunner is starting...");
        prompt.override=optimist.usage("Usage: $0 -c <input>").alias("cid","c").argv;
        prompt.start();
        const inputs=await prompt.get([
            {
                name:"cid",
                description:"Input the IPFS CID of the job to run",
                required:true
            }
        ]);
        jobCid=inputs.cid as string;
        logger.info(`Got CID: ${jobCid}`);
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