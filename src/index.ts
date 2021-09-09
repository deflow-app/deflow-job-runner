import { logger } from "./logger";
import prompt from "prompt";
import optimist from "optimist";
import cron from "node-cron";
import fs from "fs";
import { CHAIN_CONFIG, executeJobByCID } from "flow-call-sdk";
import { Wallet } from "@ethersproject/wallet";
import { JsonRpcProvider } from "@ethersproject/providers";
import {
    bootstrap
  } from 'global-agent';
import JobWorker from "flow-call-sdk/dist/entities/JobWorker";
  
bootstrap();

const FILE_PRIVATE_KEY = ".key";

let jobCid: string;
let walletKey: string;


const init = async () => {
    try {
        logger.info("Deflow JobRunner is starting...");

        let pkByFile;
        if (fs.existsSync(FILE_PRIVATE_KEY)) {
            pkByFile = fs.readFileSync(FILE_PRIVATE_KEY)?.toString();
        }

        prompt.override = optimist.usage("Usage: $0 -c <cid> -k <walletKey> -p <proxy>").alias("cid", "c").alias("walletKey", "k").alias("proxy","p").argv;
        const proxy=global.GLOBAL_AGENT.HTTP_PROXY;
        prompt.start();
        const inputs = await prompt.get([
            {
                name: "cid",
                description: "Input the IPFS CID of the job to run",
                required: true
            }, {
                name: "walletKey",
                description: `Paste your wallet's private key or mnemonic phrase here${pkByFile ? "(press ENTER to keep using current key)" : ""})`,
                required: !pkByFile
            }, {
                name: "proxy",
                description: `Set HTTP proxy server(${proxy?proxy:"ignore"})`,
                required:false
            }
        ]);
        if(inputs.proxy){
            global.GLOBAL_AGENT.HTTP_PROXY=inputs.proxy;
        }
        jobCid = inputs.cid as string;
        logger.info(`Got CID: ${jobCid}`);
        walletKey = inputs.walletKey as string;
        if (walletKey) {
            fs.writeFileSync(FILE_PRIVATE_KEY, walletKey);
            logger.info(`Your wallet key was saved in file '${FILE_PRIVATE_KEY}' and will ONLY be used locally.`);
        }
        if (!walletKey && pkByFile) {
            walletKey = pkByFile;
        }
        if (!walletKey) {
            logger.error("")
        }

        const job = await executeJobByCID(jobCid);
        const provider = new JsonRpcProvider(CHAIN_CONFIG[job.chainId].rpcUrl);
        const wallet = new Wallet(walletKey, provider);
        const worker=job.worker as JobWorker;
        logger.info("Approving tokens...");
        await worker.approve(wallet);
        logger.info("Approving done");
        cron.schedule(job.cron, async () => {
            logger.info("Start executing...");
            try {
                const results=await worker.execute(wallet);
                results.forEach((result)=>{
                    if(result.isSuccess){
                        logger.info(`${result.runner?.name} succeeded.`);
                    }
                    else{
                        logger.error(`${result.runner?.name} failed. \n%s`,result.errMsg);
                    }
                })
                logger.info("Job executed!!!");
            }
            catch (e) {
                logger.error(e);
            }
        });
        logger.info(`Cron expression: ${job.cron}`);
        logger.info(`Chain ID: ${job.chainId}`);
        logger.info(`Deflow JobRunner for [${jobCid}] started.`);
    } catch (e) {
        logger.error(e);
        console.log('Press any key to exit');
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', process.exit.bind(process, 0));
    }

};

init();