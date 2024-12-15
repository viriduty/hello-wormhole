import * as ethers from "ethers"
import {
  checkSubcommand,
  getArg,
  getHelloWormhole,
  loadConfig,
  checkFlag
} from "./utils"
import { deploy } from "./deploy"
import { getStatus } from "./getStatus"

async function main() {
  try {
    if (checkSubcommand("sendGreeting")) {
      await sendGreeting()
    } else if (checkSubcommand("deploy")) {
      await deploy()
    } else if (checkSubcommand("read")) {
      await read()
    } else if (checkFlag("--getStatus")) {
      const txHash = getArg(["--txHash", "--tx", "-t"]);
      const status = await getStatus("avalanche", txHash || "");
      console.log(status.info);
    } else {
      console.log("No valid subcommand or flag found.");
    }
  } catch (e) {
    console.error("An error occurred in the main execution:", e);
    process.exit(1);
  }
}

async function sendGreeting() {
  try {
    const from = 6;
    const to = 14;
    const greeting = getArg(["--greeting", "-g"]) ?? "Hello, Wormhole!";

    const helloWormhole = getHelloWormhole(from);
    const cost = await helloWormhole.quoteCrossChainGreeting(to);

    console.log(`Cost for sending greeting: ${ethers.utils.formatEther(cost)} ETH`);

    const tx = await helloWormhole.sendCrossChainGreeting(
      to,
      getHelloWormhole(to).address,
      greeting,
      { value: cost }
    );

    await tx.wait();

    console.log(`Greeting "${greeting}" sent from chain ${from} to chain ${to}`);
    console.log(`Transaction hash: ${tx.hash}`);
    console.log(`View Transaction: https://testnet.snowtrace.io/tx/${tx.hash}`);
  } catch (error) {
    console.error("Error sending greeting:", error);
  }
}

async function read(s = "State: \n\n") {
  try {
    const chains = loadConfig().chains.map((chain) => chain.chainId);
    
    for (const chainId of chains) {
      const helloWormhole = getHelloWormhole(chainId);
      const greeting = await helloWormhole.latestGreeting();
      
      s += `Chain ${chainId}: ${greeting}\n\n`;
    }

    console.log(s);
  } catch (error) {
    console.error("Error reading state:", error);
  }
}

main();
