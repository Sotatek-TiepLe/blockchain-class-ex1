// This exercise contains the following tasks:
// - Initiate a web3 instance
const Web3 = require("web3");
const web3 = new Web3("wss://rinkeby.infura.io/ws/v3/c9f9eba874a24d339db4c886f6964321");

// - Create a contract with address of WETH: 0xc778417e063141139fce010982780140aa0cd5ab (rinkeby)
const ABI = require("./ABI.json")
const SMART_CONTRACT_ADDRESS = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
const myContract = new web3.eth.Contract(ABI, SMART_CONTRACT_ADDRESS);
console.log(`Address Smart Contract: `, myContract._address);

// - Query the balance of any wallet address..
const walletAddress = "0xC5FEdBD978E30862957637f32C53E92184E40835";
const walletAddress2 = "0x399C3A3b0fa0Cc447869Ee815475d26264D44804";
const getBalance = function (address) {
  myContract.methods
    .balanceOf(address)
    .call().then(result => {
      console.log(`Balance of ${address}: `, web3.utils.fromWei(result), "WETH")
    })
}
getBalance(walletAddress);
getBalance(walletAddress2);

// - Create a function to query event “transfer” on the last 100 block…
const queryTransfer = async () => {
  const blockNumberLatest = await web3.eth.getBlockNumber();
  const options = {
    // filter: {
    //   src: walletAddress,
    //   dst: walletAddress2
    // },
    fromBlock: blockNumberLatest - 100,
    toBlock: 'latest'
  };
  myContract.getPastEvents('Transfer', options)
    .then(result => console.log('queryTransfer: ', result))
}
queryTransfer();

// - Create a function to listen to event “transfer”
const listenTransfer = async () => {
  const blockNumberLatest = await web3.eth.getBlockNumber();
  const options = {
    fromBlock: blockNumberLatest - 100,
  };
  myContract.events.Transfer(options, function (error, event) { console.log(event); })
    .on('connected', subscriptionId => console.log("subscriptionId: ", subscriptionId))
    .on('data', event => console.log("event: ", event))
    .on('changed', changed => console.log("changed: ", changed))
    .on('error', err => console.log('error', err.message, err.stack))

}
listenTransfer();

// - Using multicall function to get the balance of 10 wallet addresses
// - Example multicall: https://github.com/pancakeswap/pancake-frontend/blob/develop/src/utils/multicall.ts
const ethereumMulticall = require('ethereum-multicall');
const multicall = new ethereumMulticall.Multicall({ web3Instance: web3, tryAggregate: true });

async function multiCallSmartContract(listWalletAddress) {
  // Multi call smart contract
  const contractCallContext = listWalletAddress.map((address, index) => {
    return {
      reference: address,
      contractAddress: SMART_CONTRACT_ADDRESS,
      abi: ABI,
      calls: [{ reference: 'balance' + index, methodName: 'balanceOf', methodParameters: [address] }]
    }
  })
  const results = await multicall.call(contractCallContext);

  // Handle results
  const balanceWallet = [];
  for (const [key, objRes] of Object.entries(results.results)) {
    const balanceHex = objRes.callsReturnContext[0].returnValues[0].hex;
    balanceWallet.push({
      // Type 1
      // wallet: listWalletAddress[balanceWallet.length],
      // balance: web3.utils.fromWei(balanceHex)
      // Type 2
      [listWalletAddress[balanceWallet.length]]: web3.utils.fromWei(balanceHex)
    });
  }
  console.log(`WETH Wallet Balance: `, balanceWallet);
}
multiCallSmartContract([
  walletAddress,
  walletAddress2,
  "0x5b10b3a2d468e31c84aabddaff7f963d4066396f",
  "0x8c9328ae6a9780d9ddd6a6b78ed4657c93c30048",
  "0x56fea30c48b8737b1cfe220e52d968c3d7bbd865",
  "0x61518b93576C5A607af1d60E423160a4aBd99414",
  "0x9139cADca85e5643Ed0Ab58124b7f37dfBd9a982",
  "0x7fD08df92D411FB7ead03677851cd1ebD24BB42C",
  "0x255E0902097970a6680b5B9550422925b1212239",
  "0xdDfa65583dD24F7b0E4762ce91db87661F2c101F",
]);