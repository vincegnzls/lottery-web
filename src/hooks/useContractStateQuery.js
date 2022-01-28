import { useQuery } from 'react-query'
import { useLCDClient } from '@terra-money/wallet-provider'

const fetchContractState = async () => {
  const lcd = useLCDClient()

  const res = await lcd.wasm.contractQuery('terra1heffmpxwlldmqxpmh8f3lv0uw2kkdm69xx4uez', { get_state: {} })
  console.log(res)
}

export { fetchContractState }
