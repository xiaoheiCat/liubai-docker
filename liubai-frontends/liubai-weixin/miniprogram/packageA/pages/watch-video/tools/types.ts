import { PageState } from "~/types/types-atom";


export interface WatchVideoData {
  pState: PageState
  pageName: string
  _roomId: string
  _lastGetStamp: number
  
  // fetched data
  _adUnitId: string
  conversationCountFromAd: number
  conversationToAd: number
  _credential: string
  errTip: string
}