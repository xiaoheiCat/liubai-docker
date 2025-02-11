<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAccountsContent } from './tools/useAccountsContent';
import AcItem from "./ac-item.vue";
import type { MenuItem } from '~/components/common/liu-menu/tools/types';

const {
  acData,
  onTapPhone,
  onTapWeChat,
  onTapEmail,
  onMenuItemForPhone,
  onMenuItemForWeChat,
} = useAccountsContent()

const { t } = useI18n()

const menus1: MenuItem[] = [{ text_key: "setting.rebind" }, { text_key: "setting.unbind" }]
const menus2: MenuItem[] = [{ text_key: "setting.modify" }, { text_key: "setting.unbind" }]

</script>
<template>

  <PlaceholderView
    :p-state="acData.pageState"
  ></PlaceholderView>

  <div v-if="acData.pageState < 0" class="ac-container">

    <!-- Phone -->
    <LiuMenu :menu="menus2" v-if="acData.phone_pixelated" min-width-str="90px"
      @tapitem="onMenuItemForPhone"
    >
      <div class="liu-no-user-select liu-hover ac-item">
        <AcItem icon-name="emojis-mobile_phone_color"
          :hd="t('setting.phone')"
          :bd="acData.phone_pixelated"
        ></AcItem>
      </div>
    </LiuMenu>
    <div class="liu-no-user-select liu-hover ac-item" v-else @click.stop="onTapPhone">
      <AcItem icon-name="emojis-mobile_phone_color" :hd="t('setting.phone')"></AcItem>
    </div>

    <!-- WeChat -->
    <LiuMenu :menu="menus1" v-if="acData.wx_gzh_openid" min-width-str="90px"
      @tapitem="onMenuItemForWeChat"
    >
      <div class="liu-no-user-select liu-hover ac-item">
        <AcItem wechat-logo
          :hd="t('setting.wechat')"
          :bd="acData.wx_gzh_nickname || t('setting.bound')"
        ></AcItem>
      </div>
    </LiuMenu>
    <div class="liu-no-user-select liu-hover ac-item" v-else @click.stop="onTapWeChat">
      <AcItem wechat-logo :hd="t('setting.wechat')"></AcItem>
    </div>

    <!-- Email -->
    <div class="liu-no-user-select liu-hover ac-item" @click.stop="onTapEmail">
      <AcItem icon-name="emojis-e_mail_color" :hd="t('setting.email')"
        :bd="acData.email"
      ></AcItem>
    </div>

  </div>

</template>
<style scoped lang="scss">

.ac-container {
  background-color: var(--card-bg);
  border-radius: 24px;
  position: relative;
  padding: 16px 10px 12px 10px;
  width: 100%;
  box-sizing: border-box;
  box-shadow: var(--card-shadow-2);
  margin-block-end: 32px;
  container-type: inline-size;
  container-name: ac-container;
}

.ac-item {
  width: 100%;
  border-radius: 8px;
  position: relative;
  display: flex;
  box-sizing: border-box;
  overflow: hidden;
  padding: 10px 10px;

  &::before {
    border-radius: 8px;
  }
}


</style>