<script setup lang="ts">
import { useIndexBoard } from './tools/useIndexBoard';
import GeneralTip from './general-tip/general-tip.vue';
import { useI18n } from 'vue-i18n';

const {
  ibData,
  onTapInstall,
  onTapCloseA2hsTip,
  onConfirmNewVersion,
  onCancelNewVersion,
  onTapWebPush,
  onCancelWebPush,
} = useIndexBoard()

const { t } = useI18n()

</script>
<template>

  <!-- A2HS -->
  <GeneralTip
    :title="t('a2hs.title')"
    :desc="t('a2hs.desc')"
    :confirmText="t('a2hs.add')"
    :expand="ibData.a2hs"
    @confirm="onTapInstall"
    @cancel="onTapCloseA2hsTip"
  ></GeneralTip>

  <!-- New Version -->
  <GeneralTip
    :title="t('pwa.new_version_title')"
    :desc="t('pwa.new_version_desc')"
    :confirmText="t('pwa.new_version_lanuch')"
    :expand="ibData.newVersion"
    @confirm="onConfirmNewVersion"
    @cancel="onCancelNewVersion"
  ></GeneralTip>

  <!-- Web Push -->
  <GeneralTip
    :title="t('pwa.web_push_title')"
    :desc="t('pwa.web_push_desc')"
    :confirmText="t('pwa.web_push_confirm')"
    :expand="ibData.webPush"
    @confirm="onTapWebPush"
    @cancel="onCancelWebPush"
  ></GeneralTip>  

</template>
<style scoped lang="scss">


</style>