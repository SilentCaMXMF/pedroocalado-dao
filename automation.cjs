const puppeteer = require('puppeteer-core');

const WALLET_ADDRESS = '0x0E47675D5157aa13FF662E364091B2c5656a6322';

async function controlDashboard() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForSelector('#connectBtn');
  
  console.log('=== DeFi Dashboard Automation ===\n');
  console.log('Page loaded:', await page.title());
  
  // Wait for gas to load
  await new Promise(r => setTimeout(r, 3000));
  
  // Read initial state
  let totalValue = await page.$eval('#totalValue', el => el.textContent);
  let ethBalance = await page.$eval('#ethBalance', el => el.textContent);
  let gasSlow = await page.$eval('#gasSlow', el => el.textContent);
  let gasStandard = await page.$eval('#gasStandard', el => el.textContent);
  let gasFast = await page.$eval('#gasFast', el => el.textContent);
  
  console.log('\n--- Initial State ---');
  console.log('Total Value: €' + totalValue);
  console.log('ETH Balance:', ethBalance);
  console.log('Gas - Slow:', gasSlow, '| Standard:', gasStandard, '| Fast:', gasFast, 'Gwei');
  
  // Simulate wallet connection
  console.log('\n--- Simulating Wallet Connection ---');
  console.log('Address:', WALLET_ADDRESS);
  
  await page.evaluate((addr) => {
    window.currentAccount = addr;
    const btn = document.getElementById('connectBtn');
    btn.classList.add('connected');
    btn.textContent = addr.slice(0, 6) + '...' + addr.slice(-4);
    document.getElementById('networkBadge').textContent = 'Ethereum';
    document.getElementById('networkBadge').classList.add('mainnet');
    document.getElementById('statusDot').classList.add('online');
    document.getElementById('statusText').textContent = 'Connected';
  }, WALLET_ADDRESS);
  
  // Fetch wallet data
  console.log('\n--- Fetching Wallet Data ---');
  
  const walletData = await page.evaluate(async (addr) => {
    const { createPublicClient, http, formatEther } = await import('https://esm.sh/viem@2.21.0');
    const { mainnet } = await import('https://esm.sh/viem@2.21.0/chains');
    
    const client = createPublicClient({
      chain: mainnet,
      transport: http('https://ethereum-rpc.publicnode.com')
    });
    
    const balance = await client.getBalance({ address: addr });
    const ethBalance = parseFloat(formatEther(balance));
    
    const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur');
    const priceData = await priceRes.json();
    const ethPrice = priceData.ethereum.eur;
    
    return {
      balance: ethBalance,
      price: ethPrice,
      totalValue: ethBalance * ethPrice
    };
  }, WALLET_ADDRESS);
  
  console.log('Balance:', walletData.balance.toFixed(4), 'ETH');
  console.log('ETH Price: €' + walletData.price);
  console.log('Total Value: €' + walletData.totalValue.toFixed(2));
  
  // Update UI
  await page.evaluate((data) => {
    document.getElementById('ethBalance').textContent = data.balance.toFixed(4);
    document.getElementById('ethHoldings').textContent = data.balance.toFixed(4) + ' ETH';
    document.getElementById('totalValue').textContent = data.totalValue.toFixed(2);
    document.getElementById('ethValue').textContent = '€' + data.totalValue.toFixed(2);
  }, walletData);
  
  // Read updated state
  totalValue = await page.$eval('#totalValue', el => el.textContent);
  ethBalance = await page.$eval('#ethBalance', el => el.textContent);
  
  console.log('\n--- Updated UI ---');
  console.log('Total Value: €' + totalValue);
  console.log('ETH Balance:', ethBalance);
  
  // Test refresh gas
  console.log('\n--- Testing Refresh Gas ---');
  await page.click('#refreshGas');
  await new Promise(r => setTimeout(r, 2000));
  
  gasSlow = await page.$eval('#gasSlow', el => el.textContent);
  gasStandard = await page.$eval('#gasStandard', el => el.textContent);
  gasFast = await page.$eval('#gasFast', el => el.textContent);
  console.log('Gas - Slow:', gasSlow, '| Standard:', gasStandard, '| Fast:', gasFast, 'Gwei');
  
  // Test refresh tokens
  console.log('\n--- Testing Refresh Tokens ---');
  await page.click('#refreshTokens');
  await new Promise(r => setTimeout(r, 2000));
  
  // Change theme
  console.log('\n--- Testing CSS Changes ---');
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--primary', '#a855f7');
    document.documentElement.style.setProperty('--primary-glow', 'rgba(168, 85, 247, 0.15)');
  });
  console.log('Changed theme to purple');
  
  // Screenshot
  await page.screenshot({ path: '/home/pedroocalado/pedroocalado.dao/screenshot.png', fullPage: true });
  console.log('\nScreenshot saved!');
  
  const finalState = await page.evaluate(() => ({
    title: document.title,
    walletConnected: !!window.currentAccount,
    walletAddress: window.currentAccount,
    totalValue: document.getElementById('totalValue').textContent,
    ethBalance: document.getElementById('ethBalance').textContent,
    network: document.getElementById('networkBadge').textContent
  }));
  
  console.log('\n=== Final State ===');
  console.log(finalState);
  console.log('\n=== Tests Complete ===');
  
  await browser.close();
}

controlDashboard().catch(console.error);
