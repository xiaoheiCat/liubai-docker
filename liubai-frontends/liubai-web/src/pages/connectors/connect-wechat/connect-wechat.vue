<script setup lang="ts">
import PageDefault from "~/pages/shared/page-default/page-default.vue";
import { useI18n } from "vue-i18n";
import { useConnectWeChat } from "./tools/useConnectWeChat"

const { t } = useI18n()
const { 
  cwcData,
  onWechatRemindChanged,
  onTapAddWeChat,
  onTapFollowOnWeChat,
} = useConnectWeChat()

</script>
<template>

  <PageDefault title-key="connect.wechat">


    <PlaceholderView
      :p-state="cwcData.pageState"
    ></PlaceholderView>


    <div class="cw-container" v-if="cwcData.pageState < 0">

      <div class="cw-bar">
        <div class="liu-no-user-select cwb-title">
          <span>{{ t('connect.wechat_remind') }}</span>
        </div>


        <div class="liu-no-user-select cwb-footer" 
          v-if="cwcData.wx_gzh_openid && cwcData.wx_gzh_subscribed"
        >
          <liu-switch 
            :checked="cwcData.wx_gzh_toggle"
            @change="onWechatRemindChanged($event.checked)"
          ></liu-switch>
        </div>

        <div class="liu-no-user-select cwb-footer" v-else>

          <custom-btn size="mini" @click="onTapFollowOnWeChat">

            <div class="cwbf-arrow">
              <svg-icon name="logos-wechat-half-fill" 
                class="cwbf-arrow-icon"
                color="var(--on-primary)"
              ></svg-icon>
            </div>

            <span v-if="cwcData.fr === 'wx_gzh'">{{ t('connect.bind') }}</span>
            <span v-else>{{ t('connect.follow') }}</span>
          </custom-btn>
          
        </div>

      </div>

      <div class="cw-desc">
        <span class="liu-selection">{{ t('connect.wechat_remind_desc') }}</span>
      </div>

    </div>

  </PageDefault>

</template>
<style scoped lang="scss">
@use "../shared/connect-layout.scss";

</style>