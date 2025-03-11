import { reactive, watch } from "vue"
import type { AcData } from "./types"
import { pageStates } from "~/utils/atom"
import liuEnv from "~/utils/liu-env"
import cui from "~/components/custom-ui"
import { useAwakeNum } from "~/hooks/useCommon"
import { CloudEventBus } from "~/utils/cloud/CloudEventBus"
import type { MenuItem } from "~/components/common/liu-menu/tools/types"
import { i18n } from "~/locales"
import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"

export function useAccountsContent() {

  const hasBE = liuEnv.hasBackend()
  const acData = reactive<AcData>({
    pageState: !hasBE ? pageStates.NEED_BACKEND : pageStates.LOADING,
  })
  listenContext(acData)

  const _showUnsupported = () => {
    cui.showModal({ 
      iconName: "emojis-construction_color", 
      content_key: "setting.unbind_unsupported",
      showCancel: false,
    })
  }

  const onTapPhone = () => {
    toBindPhone(acData)
  }

  const onTapWeChat = () => {
    toBindWeChat(acData)
  }

  const onTapEmail = () => {
    if(acData.email) {
      _showUnsupported()
      return
    }
    cui.showModal({ 
      iconName: "emojis-construction_color", 
      content_key: "common.under_construction",
      showCancel: false,
    })
  }

  const onMenuItemForWeChat = async (item: MenuItem, index: number) => {
    if(index === 0) {
      // Re-link
      toBindWeChat(acData)
    }
    else if(index === 1) {
      toUnlinkWeChat(acData)
    }
  }

  const onMenuItemForPhone = async (item: MenuItem, index: number) => {
    if(index === 0) {
      // Re-link
      toBindPhone(acData)
    }
    else if(index === 1) {
      toUnlinkPhone(acData)
    }
  }

  return {
    acData,
    onTapPhone,
    onTapWeChat,
    onTapEmail,
    onMenuItemForPhone,
    onMenuItemForWeChat,
  }
}

async function toUnlinkWeChat(
  acData: AcData,
) {
  const res1 = await cui.showModal({ 
    title: "⚠️",
    content_key: "setting.unbind_tip_2",
    confirm_key: "setting.unbind_2",
    isTitleEqualToEmoji: true,
    modalType: "warning",
  })
  if(!res1.confirm) return
  const url = APIs.BIND_DATA
  const body = { operateType: "unbind-wx_gzh" }
  cui.showLoading()
  const res2 = await liuReq.request(url, body)
  cui.hideLoading()
  if(res2.code === "0000") {
    acData.wx_gzh_nickname = undefined
    acData.wx_gzh_openid = undefined
    cui.showSnackBar({ text_key: "setting.unbind_success" })
  }
}


async function toUnlinkPhone(
  acData: AcData,
) {
  const t = i18n.global.t
  const name = t("setting.phone")
  const res1 = await cui.showModal({ 
    title: "⚠️",
    content_key: "setting.unbind_tip_1",
    content_opt: { name },
    confirm_key: "setting.unbind_2",
    isTitleEqualToEmoji: true,
    modalType: "warning",
  })
  if(!res1.confirm) return
  const url = APIs.BIND_DATA
  const body = { operateType: "unbind-phone" }
  cui.showLoading()
  const res2 = await liuReq.request(url, body)
  cui.hideLoading()
  console.log("res2 for toUnlinkPhone: ")
  console.log(res2)
  if(res2.code === "0000") {
    acData.phone_pixelated = undefined
    cui.showSnackBar({ text_key: "setting.unbind_success" })
  }
}


async function toBindPhone(
  acData: AcData,
) {
  const res = await cui.showBindPopup({ bindType: "phone", compliance: false })
  if(res.bound) {
    CloudEventBus.addSyncNumManually()
  }
}

async function toBindWeChat(
  acData: AcData,
) {
  await cui.showQRCodePopup({ bindType: "wx_gzh" })
  getMyData(acData)
}

function listenContext(
  acData: AcData,
) {
  if(acData.pageState === pageStates.NEED_BACKEND) return

  const { syncNum, awakeNum } = useAwakeNum()
  watch(awakeNum, (newV) => {
    if(newV < 1 || syncNum.value < 1) return
    getMyData(acData)
  }, { immediate: true })
}

async function getMyData(
  acData: AcData,
) {
  const res = await CloudEventBus.getLatestUserInfo()
  if(!res) return

  acData.email = res.email
  acData.phone_pixelated = res.phone_pixelated
  acData.wx_gzh_nickname = res.wx_gzh_nickname
  acData.wx_gzh_openid = res.wx_gzh_openid
  acData.pageState = pageStates.OK
}