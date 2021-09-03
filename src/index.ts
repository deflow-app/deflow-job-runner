import { logger } from "./logger";
import prompt from "prompt";
import optimist from "optimist";
import cron from "node-cron";
import fs from "fs";
import {CHAIN_CONFIG, executeJobByCID} from "flow-call-sdk";
import {Wallet} from "@ethersproject/wallet";
import {JsonRpcProvider} from "@ethersproject/providers";

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

        prompt.override=optimist.usage("Usage: $0 -c <cid> -k <walletKey>").alias("cid","c").alias("walletKey","k").argv;
        prompt.start();
        const inputs=await prompt.get([
            {
                name:"cid",
                description:"Input the IPFS CID of the job to run",
                required:true
            },{
                name:"walletKey",
                description:`Paste your wallet's private key or mnemonic phrase here${pkByFile?"(press ENTER to keep using current key)":""})`,
                required:!pkByFile
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
        if(!walletKey){
            logger.error("")
        }   
        
        const job=await executeJobByCID(jobCid);
        cron.schedule(job.cron,()=>{
            logger.info("Start executing...");
            try{
                const provider=new JsonRpcProvider(CHAIN_CONFIG[job.chainId].rpcUrl);
                const wallet=new Wallet(walletKey,provider);
                job.worker.execute(wallet);
                logger.info("Job executed!!!");
            }
            catch(error){
                logger.error("Execute job error",error);
            }
        });

        logger.info(`Deflow JobRunner for [${jobCid}] started.`);
    } catch (error) {
        logger.error("Got error when starting",error);
        process.exit();
    }
    
};

init(); 