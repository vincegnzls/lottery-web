import { Fee, MsgSend, MsgExecuteContract, Coins, Coin, LCDClient, MsgSwap } from '@terra-money/terra.js'
import {
  useWallet, WalletStatus, useConnectedWallet, CreateTxFailed,
  Timeout,
  TxFailed,
  TxResult,
  TxUnspecifiedError,
  UserDenied,
  useLCDClient
} from '@terra-money/wallet-provider'
import React, { useState, useEffect } from 'react'
import Axios from 'axios'

const LOTTERY_ADDR = 'terra1cavr02g42rm363dpjyz7hh3nnk8nzu4jry5dr3'
const TERRA_SWAP_ROUTER_ADDR = 'terra14z80rwpd0alzj4xdtgqdmcqt9wd9xj5ffd60wp'

export default function ConnectSample () {
  const {
    status,
    network,
    wallets,
    availableConnectTypes,
    availableInstallTypes,
    availableConnections,
    connect,
    install,
    disconnect
  } = useWallet()
  const connectedWallet = useConnectedWallet()
  const lcd = useLCDClient()

  const [txResult, setTxResult] = useState(null)
  const [txError, setTxError] = useState(null)
  const [contractState, setContractState] = useState(null)

  useEffect(() => {
    if (connectedWallet) {
      // console.log(connectedWallet.walletAddress)
    }
  }, [connectedWallet])

  useEffect(() => {
    if (lcd) {
      fetchContractState()
    }
  }, [lcd])

  const fetchContractState = async () => {
    if (connectedWallet) {
      const res = await lcd.wasm.contractQuery(LOTTERY_ADDR, { get_state: {} })
      setContractState({ res })
    }
  }

  useEffect(() => {
    if (availableConnections) {
      // console.log(availableConnections)
    }
  }, [availableConnections])

  const samplePlaceBet = async () => {
    if (!connectedWallet) {
      alert('Please connect wallet first!')
      return
    }

    if (connectedWallet.network.chainID.startsWith('columbus')) {
      alert('Please only execute this example on Testnet')
    }

    setTxResult(null)
    setTxError(null)

    // Get fee
    const msgs = [
      new MsgExecuteContract(connectedWallet.walletAddress, LOTTERY_ADDR, {
        place_bet: {}
      }, new Coins({ uluna: 1000000 }))
      // new MsgSwap(connectedWallet.walletAddress, new Coin('uphp', 100000), 'uusd')
    ]

    // await lcd.wasm.contractQuery()

    const accountInfo = await lcd.auth.accountInfo(
      connectedWallet.walletAddress.toString()
    )

    const { data: gasPrices } = await Axios.get(
      'https://fcd.terra.dev/v1/txs/gas_prices'
    )

    const memo = 'estimate fee'
    const txOptions = {
      msgs,
      memo,
      gasPrices,
      gasAdjustment: 10
    }

    let rawFee

    try {
      rawFee = await lcd.tx.estimateFee(
        [
          {
            sequenceNumber: accountInfo.getSequenceNumber(),
            publicKey: accountInfo.getPublicKey()
          }
        ],
        txOptions
      )
    } catch (e) {
      console.log(e.response)
      setTxError(e.response.data.message)
      return null
    }

    const estimatedFeeGas = rawFee.amount
      .toArray()
      .reduce((gas, coin) => {
      // @ts-ignore
        const price = gasPrices[coin.denom]
        return gas.plus(coin.amount.div(price).toString())
      })

    // console.log(estimatedFeeGas.toString())

    // return

    connectedWallet
      .post({
        fee: new Fee(1000000, estimatedFeeGas.toString()),
        msgs: msgs
      })
      .then((nextTxResult) => {
        console.log(nextTxResult)
        console.log('NANII')

        if (nextTxResult.success) {
          fetchContractState()
        } else {}

        setTxResult(nextTxResult)
      })
      .catch((error) => {
        console.log('NANIII')
        if (error instanceof UserDenied) {
          setTxError('User Denied')
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message)
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message)
        } else if (error instanceof Timeout) {
          setTxError('Timeout')
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message)
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error))
          )
        }
      })
  }

  const login = () => {
    Axios.post('http://localhost/users/login/', {
      email: 'asd',
      password: 'adsda'
    }).then(res => {
      console.log(res)
    }).catch(e => {
      console.log(e.reponse)
    })
  }

  return (
    <div>
      {/* <button onClick={login}>LOGIN TEST</button> */}

      <h1>LOTTERY TEST</h1>
      <button onClick={samplePlaceBet}>PLACE BET</button>

      {txResult && (
        <>
          <pre>{JSON.stringify(txResult, null, 2)}</pre>
          {connectedWallet && txResult && (
            <div>
              <a
                href={`https://finder.terra.money/${connectedWallet.network.chainID}/tx/${txResult.result.txhash}`}
                target="_blank"
                rel="noreferrer"
              >
              Open Tx Result in Terra Finder
              </a>
            </div>
          )}
        </>
      )}

      {txError && <pre>{txError}</pre>}

      {(!!txResult || !!txError) && (
        <button
          onClick={() => {
            setTxResult(null)
            setTxError(null)
          }}
        >
          Clear result
        </button>
      )}
      <section>
        <pre>
          {JSON.stringify(
            {
              status,
              network,
              wallets
            },
            null,
            2
          )}
        </pre>
      </section>
      <br/>
      LOTTERY STATE:
      <section>
        <pre>
          {JSON.stringify(contractState, null, 2)}
        </pre>
      </section>
      <br/>
      CONNECT YOUR WALLET:
      <footer>
        {status === WalletStatus.WALLET_NOT_CONNECTED && (
          <>
            {/* {availableConnectTypes.map((connectType) => (
              <button
                key={'connect-' + connectType}
                onClick={() => connect(connectType)}
              >
                                Connect {connectType}
              </button>
            ))} */}
            <br />
            {availableConnections.map(
              ({ type, name, icon, identifier = '' }) => {
                if (type !== 'READONLY') {
                  return (
                    <button
                      key={'connection-' + type + identifier}
                      onClick={() => connect(type, identifier)}
                    >
                      <img
                        src={icon}
                        alt={name}
                        style={{ width: '1em', height: '1em', marginRight: '5px' }}
                      />
                      {name}
                    </button>
                  )
                }
              }
            )}
          </>
        )}
        {status === WalletStatus.WALLET_CONNECTED && (
          <button onClick={() => disconnect()}>Disconnect</button>
        )}
      </footer>

    </div>
  )
}
