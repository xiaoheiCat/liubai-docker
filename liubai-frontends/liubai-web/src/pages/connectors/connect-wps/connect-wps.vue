<script setup lang="ts">
import PageDefault from "~/pages/shared/page-default/page-default.vue";
import { useI18n } from "vue-i18n";
import { useConnectWps } from "./tools/useConnectWps"

const { t } = useI18n()
const { 
  cwData,
  onWebhookChanged,
  onWebhookUrlInput,
  onTapCopyWebhookPassword,
  onTapSave,
  onTapConfigMethod,
} = useConnectWps()

</script>
<template>

  <PageDefault title-key="connect.wps">

    <PlaceholderView
      :p-state="cwData.pageState"
    ></PlaceholderView>

    <div class="cw-container" v-if="cwData.pageState < 0">

      <div class="cw-bar">
        <div class="liu-no-user-select cwb-title">
          <span>{{ t('connect.wps_backup') }}</span>
        </div>

        <div class="liu-no-user-select cwb-footer">
          <liu-switch 
            :checked="cwData.webhook_toggle"
            @change="onWebhookChanged($event.checked)"
          ></liu-switch>
        </div>

      </div>

      <div class="cw-desc">
        <span class="liu-selection">{{ t('connect.wps_backup_desc') }}</span>
      </div>

      <!-- show if toggle is true -->
      <div class="cw-panel" v-if="cwData.webhook_toggle">

        <!-- webhook url -->
        <div class="liu-no-user-select cw-question">
          <span>{{ t('connect.wps_webhook_url') }}</span>
        </div>
        <input type="text" 
          v-model="cwData.webhook_url" 
          class="ph-no-capture cw-answer" 
          placeholder="https://www.kdocs.cn/chatflow/......"
          @input="onWebhookUrlInput"
        />

        <!-- password -->
        <div class="liu-no-user-select cw-question">
          <span>{{ t('connect.wps_webhook_password') }}</span>
        </div>
        <div class="liu-hover cw-answer" @click.stop="onTapCopyWebhookPassword">
          <div class="cw-answer-text">
            <span>{{ cwData.webhook_password }}</span>
          </div>
          <div class="cw-icon-btn">
            <svg-icon name="copy"
              class="cw-icon-btn-icon"
              color="var(--main-normal)"
            ></svg-icon>
          </div>
        </div>

        <!-- buttons -->
        <div class="cw-btns">
          <custom-btn 
            size="mini" 
            type="transparent"
            @click="onTapConfigMethod"
          >
            <span>{{ t('connect.check_config') }}</span>
          </custom-btn>
          <custom-btn 
            size="mini" 
            class="cw-save-btn"
            :disabled="!cwData.canSave"
            :is-loading="cwData.isSaving"
            @click="onTapSave"
          >
            <span>{{ t('common.save') }}</span>
          </custom-btn>
        </div>

      </div>
      

    </div>

  </PageDefault>

</template>
<style scoped lang="scss">
@use "../shared/connect-layout.scss";

</style>