import { logger } from "./logger";
import prompt from "prompt";
import optimist from "optimist";

let jobCid;

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
        jobCid=inputs.cid;
        logger.info(`Got CID: ${jobCid}`);
        logger.info("Deflow JobRunner started.");
    } catch (error) {
        logger.error("Got error when starting",error);
        process.exit();
    }
    
};

init(); 