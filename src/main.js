import { createPublicClient, http, parseEther, formatEther, formatUnits } from 'viem'
import { mainnet } from 'viem/chains'

const RPC_URLS = [
  'https://eth-mainnet.g.alchemy.com/v2/demo',
  'https://cloudflare-eth.com',
  'https://ethereum-rpc.publicnode.com'
]

let client = null
let currentAccount = null

const ethPriceCache = { price: 0, updated: 0 }
const CACHE_DURATION = 60000

async function getClient() {
  if (!client) {
    for (const url of RPC_URLS) {
      try {
        client = createPublicClient({
          chain: mainnet,
          transport: http(url)
        })
        await client.getBlockNumber()
        break
      } catch (e) {
        client = null
      }
    }
    if (!client) {
      throw new Error('Could not connect to any RPC')
    }
  }
  return client
}

async function fetchEthPrice() {
  const now = Date.now()
  if (ethPriceCache.price && (now - ethPriceCache.updated) < CACHE_DURATION) {
    return ethPriceCache.price
  }
  
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur'
    )
    const data = await response.json()
    ethPriceCache.price = data.ethereum.eur
    ethPriceCache.updated = now
    return ethPriceCache.price
  } catch (e) {
    console.error('Failed to fetch ETH price:', e)
    return ethPriceCache.price || 2500
  }
}

async function fetchGasPrice() {
  try {
    const c = await getClient()
    const gasPrice = await c.getGasPrice()
    const gwei = formatUnits(gasPrice, 9)
    const baseGwei = parseFloat(gwei)
    
    return {
      slow: Math.max(1, Math.floor(baseGwei * 0.8)),
      standard: Math.floor(baseGwei),
      fast: Math.ceil(baseGwei * 1.3)
    }
  } catch (e) {
    console.error('Failed to fetch gas:', e)
    return { slow: 20, standard: 30, fast: 50 }
  }
}

function formatAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatEth(value) {
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '0.0000'
    return num.toFixed(4)
  } catch {
    return '0.0000'
  }
}

function formatEuro(value) {
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '0.00'
    return num.toLocaleString('en-EU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  } catch {
    return '0.00'
  }
}

function updateUI(data) {
  const { balance, totalValue, gas } = data
  
  document.getElementById('ethBalance').textContent = formatEth(balance)
  document.getElementById('ethHoldings').textContent = `${formatEth(balance)} ETH`
  document.getElementById('totalValue').textContent = formatEuro(totalValue)
  document.getElementById('ethValue').textContent = `€${formatEuro(totalValue)}`
  
  document.getElementById('gasSlow').textContent = gas.slow
  document.getElementById('gasStandard').textContent = gas.standard
  document.getElementById('gasFast').textContent = gas.fast
  document.getElementById('gasTime').textContent = new Date().toLocaleTimeString()
  
  document.getElementById('statusDot').classList.add('online')
  document.getElementById('statusText').textContent = 'Connected'
}

function setConnecting(connecting) {
  const btn = document.getElementById('connectBtn')
  if (connecting) {
    btn.disabled = true
    btn.querySelector('.btn-text').textContent = 'Connecting...'
  } else {
    btn.disabled = false
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    alert('Please install MetaMask!')
    return
  }
  
  setConnecting(true)
  
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })
    
    if (accounts.length > 0) {
      currentAccount = accounts[0]
      
      const btn = document.getElementById('connectBtn')
      btn.classList.add('connected')
      btn.querySelector('.btn-text').textContent = formatAddress(currentAccount)
      btn.onclick = disconnectWallet
      
      await loadWalletData()
    }
  } catch (e) {
    console.error('Connection failed:', e)
    alert('Failed to connect wallet')
  } finally {
    setConnecting(false)
  }
}

async function disconnectWallet() {
  currentAccount = null
  
  const btn = document.getElementById('connectBtn')
  btn.classList.remove('connected')
  btn.querySelector('.btn-text').textContent = 'Connect Wallet'
  btn.onclick = connectWallet
  
  document.getElementById('totalValue').textContent = '0.00'
  document.getElementById('ethBalance').textContent = '0.0000'
  document.getElementById('ethHoldings').textContent = '0.0000 ETH'
  document.getElementById('ethValue').textContent = '€0.00'
  
  document.getElementById('networkBadge').textContent = 'Not Connected'
  document.getElementById('networkBadge').classList.remove('mainnet')
  
  document.getElementById('statusDot').classList.remove('online')
  document.getElementById('statusText').textContent = 'Ready'
}

async function loadWalletData() {
  if (!currentAccount) return
  
  document.getElementById('networkBadge').textContent = 'Ethereum'
  document.getElementById('networkBadge').classList.add('mainnet')
  
  const [balance, ethPrice, gas] = await Promise.all([
    getBalance(),
    fetchEthPrice(),
    fetchGasPrice()
  ])
  
  updateUI({
    balance,
    totalValue: balance * ethPrice,
    gas
  })
}

async function getBalance() {
  try {
    const c = await getClient()
    const balance = await c.getBalance({ address: currentAccount })
    return parseFloat(formatEther(balance))
  } catch (e) {
    console.error('Failed to get balance:', e)
    return 0
  }
}

async function refreshGas() {
  const btn = document.getElementById('refreshGas')
  btn.classList.add('loading')
  
  const gas = await fetchGasPrice()
  
  document.getElementById('gasSlow').textContent = gas.slow
  document.getElementById('gasStandard').textContent = gas.standard
  document.getElementById('gasFast').textContent = gas.fast
  document.getElementById('gasTime').textContent = new Date().toLocaleTimeString()
  
  btn.classList.remove('loading')
}

async function refreshTokens() {
  if (!currentAccount) return
  
  const btn = document.getElementById('refreshTokens')
  btn.classList.add('loading')
  
  await loadWalletData()
  
  btn.classList.remove('loading')
}

document.getElementById('connectBtn').onclick = connectWallet
document.getElementById('refreshGas').onclick = refreshGas
document.getElementById('refreshTokens').onclick = refreshTokens

window.ethereum?.on('accountsChanged', (accounts) => {
  if (accounts.length === 0) {
    disconnectWallet()
  } else if (accounts[0] !== currentAccount) {
    window.location.reload()
  }
})

refreshGas()
