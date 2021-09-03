# deflow-job-runner

It's a runner built by nodejs to execute `DeFlow Job` outside browser, which is more stable and safe for production. The CID of a published job and the key of wallet should be provided before running.

## Build

Build executable files for windows, linux and macOS.
```shell
yarn release
```

## Usage

Just run the corresponding executable file for your OS, follow the prompts to input the CID of job and wallet key.
Or you could use the command below:
```shell
<exeFileName> -c <cid> -k <walletKey>
```
