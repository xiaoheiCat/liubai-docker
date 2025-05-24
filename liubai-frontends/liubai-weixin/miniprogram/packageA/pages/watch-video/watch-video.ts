import { navibarBehavior } from "~/behaviors/navibar-behavior";
import { i18nBehavior } from "~/packageA/behaviors/i18n-behavior";
import { pageStates } from "~/utils/atom-util";
import { fetchGet } from "./tools/useWatchVideo";
import { LiuTime } from "~/utils/LiuTime";
import valTool from "~/utils/val-tool";

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("watch-video"),
    navibarBehavior,
  ],

  data: {
    pState: pageStates.LOADING,
    pageName: "watch-video",
    _roomId: "",
    _lastGetStamp: 0,

    // fetched data
    _adUnitId: "",
    conversationCountFromAd: -1,
    conversationToAd: 0,
    _credential: "",
    errTip: "",
  },


  methods: {

    onLoad(query?: Record<string, string>) {
      if(!query) return
      const roomId = query.r
      if(!roomId) return
      this.data._roomId = roomId
      this.toGet()
    },
    
    async onShow() {
      await valTool.waitMilli(LiuTime.SECOND * 3)
      const lastGetStamp = this.data._lastGetStamp
      const within10min = LiuTime.isWithinMillis(
        lastGetStamp, LiuTime.MINUTE * 10, true
      )
      if(within10min) return
      this.toGet()
    },

    async toGet() {
      const roomId = this.data._roomId
      if(!roomId) return

      // 1. to get data
      const res1 = await fetchGet(roomId)
      const code1 = res1.code
      const data1 = res1.data

      // 2. handle error
      if(code1 === "E4004") {
        this.setData({ pState: pageStates.NO_DATA, errTip: "" })
        return
      }
      if(code1 === "E4003") {
        this.setData({ pState: pageStates.NO_AUTH, errTip: "" })
        return
      }
      if(!data1) {
        const errTip = res1.errMsg
        this.setData({ pState: pageStates.NETWORK_ERR, errTip })
        return
      }

      // 3. bind data
      this.data._lastGetStamp = LiuTime.getLocalTime()
      const bind = {
        pState: pageStates.OK,
        _adUnitId: data1.adUnitId,
        conversationCountFromAd: data1.conversationCountFromAd,
        conversationToAd: data1.conversationToAd,
        _credential: data1.credential,
      }
      this.setData(bind)
    },

    toPost() {

    },



  },



})