import APIs from "~/packageB/requests/APIs";
import { LiuReq } from "~/packageB/requests/LiuReq";
import type { 
  Res_PO_CreateOrder, 
  Res_SubPlan_Info,
} from "~/packageB/requests/req-types";


export async function getOrderId() {
  // 1. get subscription plan
  const url1 = APIs.SUBSCRIBE_PLAN
  const param1 = { operateType: "monthly_info" }
  const res1 = await LiuReq.request<Res_SubPlan_Info>(url1, param1)
  const {
    code: code1,
    data: data1,
  } = res1
  if(code1 !== "0000" || !data1) return
  const isWxpayOn = data1.wxpay?.isOn
  if(!isWxpayOn) return
  const subscription_id = data1.id

  // 2. create order
  const url2 = APIs.PAYMENT_ORDER
  const param2 = { 
    operateType: "create_order",
    subscription_id,
  }
  const res2 = await LiuReq.request<Res_PO_CreateOrder>(url2, param2)
  return res2.data?.orderData.order_id
}