<script setup lang="ts">
import PageDefault from "~/pages/shared/page-default/page-default.vue";
import { useI18n } from "vue-i18n";
import { useConnectDingTalk } from "./tools/useConnectDingTalk"

const { t } = useI18n()
const { 
  cwData,
  onWebhookChanged,
  onWebhookUrlInput,
  onTapSave,
  onTapConfigMethod,
} = useConnectDingTalk()

</script>
<template>

  <PageDefault title-key="connect.dingtalk">

    <PlaceholderView
      :p-state="cwData.pageState"
    ></PlaceholderView>

    <div class="cw-container" v-if="cwData.pageState < 0">

      <div class="cw-bar">
        <div class="liu-no-user-select cwb-title">
          <span>{{ t('connect.dingtalk_backup') }}</span>
        </div>

        <div class="liu-no-user-select cwb-footer">
          <liu-switch 
            :checked="cwData.webhook_toggle"
            @change="onWebhookChanged($event.checked)"
          ></liu-switch>
        </div>

      </div>

      <div class="cw-desc">
        <span class="liu-selection">{{ t('connect.dingtalk_backup_desc') }}</span>
      </div>

      <!-- show if toggle is true -->
      <div class="cw-panel" v-if="cwData.webhook_toggle">

        <!-- webhook url -->
        <div class="liu-no-user-select cw-question">
          <span>{{ t('connect.dingtalk_webhook_url') }}</span>
        </div>
        <input type="text" 
          v-model="cwData.webhook_url" 
          class="ph-no-capture cw-answer" 
          placeholder="https://connector.dingtalk.com/..."
          @input="onWebhookUrlInput"
        />

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